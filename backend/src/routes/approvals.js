import { Router } from "express";
import db from '../db/pg_client.js';
import { requireAuth } from "../middleware/authMiddleware.js";
import { recordApprovalOnBlockchain } from '../utils/blockchainApproval.js';
import { processLicenseGeneration } from '../services/licenseService.js';

const router = Router();

// ==========================================
// GET /approvals - Get all approvals
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { department, application_id } = req.query;
    
    let query = `
      SELECT 
        a.*,
        u.full_name as approved_by_name
      FROM approvals a
      LEFT JOIN users u ON a.approved_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (department) {
      query += ` AND a.department_name = $${paramCount}`;
      params.push(department);
      paramCount++;
    }
    
    if (application_id) {
      query += ` AND a.application_id = $${paramCount}`;
      params.push(application_id);
      paramCount++;
    }
    
    query += ` ORDER BY a.approval_date DESC`;
    
    console.log('📊 Fetching approvals with query:', query);
    console.log('📊 Params:', params);
    
    const result = await db.query(query, params);
    
    console.log(`✅ Found ${result.rows.length} approvals`);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('❌ Error fetching approvals:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==========================================
// GET /approvals/stats/:department - Get department stats
// ==========================================
router.get("/stats/:department", async (req, res) => {
  try {
    const { department } = req.params;
    
    const result = await db.query(
      `SELECT 
        COUNT(DISTINCT application_id) as total_approved
       FROM approvals
       WHERE department_name = $1`,
      [department]
    );
    
    res.json({
      success: true,
      totalApproved: parseInt(result.rows[0]?.total_approved || 0)
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// POST /approvals - Create new approval
// ==========================================
router.post("/", requireAuth, async (req, res) => {
  //const client = await db.connect(); // ← Added for transaction
  
  try {
   // await client.query('BEGIN'); // ← Added transaction
    
    const { 
      application_id, 
      department_name, 
      remarks, 
      wallet_address, 
      approval_status 
    } = req.body;
    
    console.log('📝 Creating approval:', {
      application_id,
      department_name,
      approved_by: req.user.id,
      approval_status: approval_status || 'approved'
    });
    
    // 1. Database insert (YOUR EXISTING LOGIC)
    const result = await db.query(
      `INSERT INTO approvals (
        application_id, 
        approved_by, 
        department_name, 
        remarks, 
        wallet_address, 
        approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        application_id, 
        req.user.id, 
        department_name, 
        remarks, 
        wallet_address, 
        approval_status || 'approved'
      ]
    );
    
    const approval = result.rows[0];
    console.log('✅ Approval created:', approval.id);

    // 2. ✅ NEW: Record on blockchain
    let blockchainData = null;
    try {
      const action = approval_status === 'rejected' ? 'REJECTED' : 'APPROVED';
      
      blockchainData = await recordApprovalOnBlockchain({
        applicationId: application_id,
        department: department_name,
        officerId: req.user.id,
        action: action,
        remarks: remarks
      });

      // Update with blockchain TX hash
      await db.query(
        `UPDATE approvals 
         SET blockchain_tx_hash = $1, blockchain_hash = $2 
         WHERE id = $3`,
        [blockchainData.txHash, blockchainData.approvalHash, approval.id]
      );

      console.log('✅ Blockchain TX:', blockchainData.txHash);

    } catch (blockchainError) {
      console.warn('⚠️ Blockchain failed (continuing):', blockchainError.message);
    }

    // 3. Check if application is now fully approved and trigger license generation
    let licenseGenerationResult = null;
    if (approval.approval_status === 'approved') {
      try {
        // Import the license service function
        const { isApplicationFullyApproved } = await import('../services/licenseService.js');

        const isFullyApproved = await isApplicationFullyApproved(application_id);
        if (isFullyApproved) {
          console.log('🎉 Application is now fully approved! Triggering license generation...');

          // Update application status to 'approved' and current_stage to 'fully_approved'
          await db.query(
            `UPDATE applications SET status = 'approved', current_stage = 'fully_approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [application_id]
          );

          // Generate license
          licenseGenerationResult = await processLicenseGeneration(application_id);
          console.log('✅ License generated successfully:', licenseGenerationResult.license.license_number);
        }
      } catch (licenseError) {
        console.error('⚠️ License generation failed (continuing):', licenseError.message);
        // Don't fail the approval if license generation fails
      }
    }

    //await db.query('COMMIT'); // ← Added transaction commit

    res.json({
      success: true,
      data: {
        ...approval,
        blockchain_tx: blockchainData?.txHash || null,
        license_generated: !!licenseGenerationResult
      }
    });

  } catch (error) {
    //await client.query('ROLLBACK'); // ← Added rollback
    console.error('❌ Error creating approval:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  } finally {
   // client.release(); // ← Added connection release
  }
});


export default router;
