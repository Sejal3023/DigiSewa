import { Router } from "express";
import db from '../db/pg_client.js';
import { requireAuth } from "../middleware/authMiddleware.js";
import crypto from 'crypto';

const router = Router();

// ==========================================
// 1. INITIATE TRANSFER (FIXED)
// ==========================================
router.post("/initiate", requireAuth, async (req, res) => {
  try {
    const { 
      applicationId, 
      toDepartmentName, 
      transferReason 
    } = req.body;
    
    const officerId = req.user.id;
    
    console.log('🔄 Transfer initiated by officer:', officerId);
    console.log('📤 To department:', toDepartmentName);
    
    // Get current application info
    
    const appResult = await db.query(
      `SELECT 
        a.responsible_dept, 
        d.name as from_dept_name
       FROM applications a
       LEFT JOIN departments d ON a.responsible_dept = d.id
       WHERE a.id = $1`,
      [applicationId]
    );
    
    if (!appResult.rows.length) {
      throw new Error('Application not found');
    }
    
    const fromDeptId = appResult.rows[0].responsible_dept;
    const fromDeptName = appResult.rows[0].from_dept_name;
    
    // Get target department ID
    const toDeptResult = await db.query(
      `SELECT id FROM departments WHERE name = $1`,
      [toDepartmentName]
    );
    
    if (!toDeptResult.rows.length) {
      throw new Error('Target department not found');
    }
    
    const toDeptId = toDeptResult.rows[0].id;
    
    // Generate access code
    const accessCode = `TRANS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    
    console.log('🔑 Generated access code:', accessCode);
    
    // Create transfer record
    const transferResult = await db.query(
      `INSERT INTO department_transfers (
        application_id,
        from_department_id,
        to_department_id,
        transferred_by,
        transfer_reason,
        access_code,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *`,
      [applicationId, fromDeptId, toDeptId, officerId, transferReason, accessCode]
    );
    
    // Update application's responsible department
    await db.query(
      `UPDATE applications
       SET responsible_dept = $1,
           current_stage = 'transferred',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [toDeptId, applicationId]
    );
    
    // Grant document permissions
    await db.query(
      `INSERT INTO document_permissions (
        document_id,
        department_id,
        access_policy,
        granted_by,
        revoked
      )
      SELECT 
        d.id,
        $1,
        'read',
        $2,
        false
      FROM documents d
      WHERE d.application_id = $3
      ON CONFLICT (document_id, department_id) 
      DO UPDATE SET revoked = false, granted_at = CURRENT_TIMESTAMP`,
      [toDeptId, officerId, applicationId]
    );
    
    console.log('✅ Transfer successful!');
    
    res.json({
      success: true,
      message: "Transfer initiated successfully",
      data: {
        transferId: transferResult.rows[0].id,
        accessCode: accessCode,
        fromDepartment: fromDeptName,
        toDepartment: toDepartmentName
      }
    });
    
  } catch (error) {
    console.error("❌ Transfer error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 2. GET PENDING TRANSFERS
// ==========================================
router.get("/pending/:departmentName", requireAuth, async (req, res) => {
  try {
    const { departmentName } = req.params;
    
    console.log('📥 Fetching pending transfers for:', departmentName);
    
    const result = await db.query(
      `SELECT 
        dt.id as transfer_id,
        dt.application_id,
        dt.transfer_reason,
        dt.transferred_at,
        a.license_type,
        a.status as application_status,
        fd.name as from_department,
        u.full_name as transferred_by,
        u2.full_name as applicant_name
      FROM department_transfers dt
      JOIN applications a ON dt.application_id = a.id
      JOIN departments fd ON dt.from_department_id = fd.id
      JOIN departments td ON dt.to_department_id = td.id
      JOIN users u ON dt.transferred_by = u.id
      LEFT JOIN users u2 ON a.user_id = u2.id
      WHERE td.name = $1 AND dt.status = 'pending'
      ORDER BY dt.transferred_at DESC`,
      [departmentName]
    );
    
    console.log(`✅ Found ${result.rows.length} pending transfers`);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error("❌ Get pending transfers error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 3. ACCEPT TRANSFER WITH ACCESS CODE
// ==========================================
router.post("/accept", requireAuth, async (req, res) => {
  try {
    const { transferId, accessCode } = req.body;
    const officerId = req.user.id;
    
    console.log('✅ Accepting transfer:', { transferId, accessCode });
    
    // Verify access code
    const transferResult = await db.query(
      `SELECT * FROM department_transfers 
       WHERE id = $1 AND access_code = $2 AND status = 'pending'`,
      [transferId, accessCode]
    );
    
    if (!transferResult.rows.length) {
      throw new Error('Invalid access code');
    }
    
    // Mark as accepted
    await db.query(
      `UPDATE department_transfers
       SET status = 'accepted',
           accepted_at = CURRENT_TIMESTAMP,
           accepted_by = $1
       WHERE id = $2`,
      [officerId, transferId]
    );
    
    // Update application stage
    await db.query(
      `UPDATE applications
       SET current_stage = 'under_review'
       WHERE id = $1`,
      [transferResult.rows[0].application_id]
    );
    
    console.log('✅ Transfer accepted successfully');
    
    res.json({
      success: true,
      message: "Transfer accepted"
    });
    
  } catch (error) {
    console.error("❌ Accept transfer error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 4. GET TRANSFER HISTORY
// ==========================================
router.get("/history/:applicationId", requireAuth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const result = await db.query(
      `SELECT 
        dt.*,
        fd.name as from_department,
        td.name as to_department,
        u1.full_name as transferred_by_name,
        u2.full_name as accepted_by_name
      FROM department_transfers dt
      JOIN departments fd ON dt.from_department_id = fd.id
      JOIN departments td ON dt.to_department_id = td.id
      JOIN users u1 ON dt.transferred_by = u1.id
      LEFT JOIN users u2 ON dt.accepted_by = u2.id
      WHERE dt.application_id = $1
      ORDER BY dt.transferred_at DESC`,
      [applicationId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
