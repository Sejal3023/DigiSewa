import { Router } from "express";
import { AdminAuthService } from "../services/adminAuthService.js";
import db from '../db/pg_client.js';
import { generateLicensePDF, processLicenseGeneration } from '../services/licenseService.js';

const router = Router();

// ==========================================
// 🔐 EXISTING ADMIN AUTHENTICATION (UNCHANGED)
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;

    if (!email || !password || !adminCode) {
      return res.status(400).json({
        error: "Email, password, and admin access code are required"
      });
    }

    const result = await AdminAuthService.verifyCredentials(email, password, adminCode);

    if (!result.success) {
      return res.status(401).json({
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.user.role === 'super_admin' ? "Super admin login successful" : "Officer login successful",
      admin: result.user.role === 'super_admin' ? result.user : null,
      user: result.user.role !== 'super_admin' ? result.user : null,
      token: result.token
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Token is required"
      });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        error: result.error
      });
    }

    res.json({
      success: true,
      admin: result.user
    });

  } catch (error) {
    console.error("Admin verify error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Token is required"
      });
    }

    const result = await AdminAuthService.logout(token);

    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }

    res.json({
      success: true,
      message: "Admin logout successful"
    });

  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required"
      });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        error: result.error
      });
    }

    const adminResult = await AdminAuthService.getAdminById(result.user.userId);

    if (!adminResult.success) {
      return res.status(404).json({
        error: adminResult.error
      });
    }

    res.json({
      success: true,
      admin: {
        id: adminResult.admin.id,
        email: adminResult.admin.email,
        fullName: adminResult.admin.full_name,
        role: adminResult.admin.role,
        department: adminResult.admin.department,
        permissions: adminResult.admin.permissions,
        lastLogin: adminResult.admin.last_login,
        createdAt: adminResult.admin.created_at
      }
    });

  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required"
      });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        error: result.error
      });
    }

    if (result.user.role !== 'super_admin') {
      return res.status(403).json({
        error: "Insufficient permissions"
      });
    }

    const adminsResult = await AdminAuthService.getAllAdmins();

    if (!adminsResult.success) {
      return res.status(400).json({
        error: adminsResult.error
      });
    }

    res.json({
      success: true,
      admins: adminsResult.admins
    });

  } catch (error) {
    console.error("Get all admins error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

router.post("/users", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: "Authorization token required"
      });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        error: result.error
      });
    }

    const { email, password, fullName, role, department, permissions } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({
        error: "Email, password, full name, and role are required"
      });
    }

    const adminResult = await AdminAuthService.createAdmin(
      { email, password, fullName, role, department, permissions },
      result.user
    );

    if (!adminResult.success) {
      return res.status(400).json({
        error: adminResult.error
      });
    }

    res.json({
      success: true,
      message: "Admin user created successfully",
      admin: {
        id: adminResult.admin.id,
        email: adminResult.admin.email,
        fullName: adminResult.admin.full_name,
        role: adminResult.admin.role,
        department: adminResult.admin.department
      }
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

// ==========================================
// ✨ NEW DASHBOARD ROUTES
// ==========================================

router.get('/departments', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    // ✅ FIX: Application filtering - Ensure all 6 departments are returned correctly
    // Added logging to verify departments are being fetched properly
    const departments = await db.query(`
      SELECT id, name
      FROM departments
      ORDER BY name
    `);

    console.log('✅ DEPARTMENTS FETCHED:', departments.rows.length, 'departments found');
    console.log('Department names:', departments.rows.map(d => d.name));

    res.json({
      success: true,
      departments: departments.rows
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    const adminRole = result.user.role;
    const adminDept = result.user.department;

    let whereCondition = '';
    let queryParams = [];

    if (adminRole !== 'super_admin' && adminDept) {
      // ✅ FIXED: Join with departments table to match department name
      whereCondition = 'WHERE d.name = $1';
      queryParams = [adminDept];
    }

    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE a.status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE a.status = 'approved') as approved_applications,
        COUNT(*) FILTER (WHERE a.status = 'rejected') as rejected_applications,
        COUNT(*) FILTER (WHERE a.status = 'processing') as processing_applications,
        COUNT(*) FILTER (WHERE DATE(a.submission_date) = CURRENT_DATE) as today_applications,
        COUNT(*) as total_applications
      FROM applications a
      LEFT JOIN departments d ON a.responsible_dept = d.id
      ${whereCondition}
    `;

    const stats = await db.query(statsQuery, queryParams);

    // ✅ FIX: Interdepartmental transfer counts - Include transferred applications in department stats
    let departmentStats = [];
    if (adminRole === 'super_admin') {
      const deptStats = await db.query(`
       SELECT
    a.responsible_dept as department,
    d.name as department_name,
    COUNT(*) FILTER (WHERE a.status = 'pending') as pending,
    COUNT(*) FILTER (WHERE a.status = 'approved') as approved,
    COUNT(*) FILTER (WHERE a.status = 'rejected') as rejected,
    COUNT(*) FILTER (WHERE a.current_stage = 'transferred') as transferred,
    COUNT(*) as total
  FROM applications a
  LEFT JOIN departments d ON a.responsible_dept = d.id
  WHERE a.responsible_dept IS NOT NULL
  GROUP BY a.responsible_dept, d.name
  ORDER BY total DESC
      `);
      console.log('🔍 DEPARTMENT STATS FROM DB (with transfers):', JSON.stringify(deptStats.rows, null, 2));
      departmentStats = deptStats.rows;
    }

    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersCount.rows[0].count);

    const adminsCount = await db.query('SELECT COUNT(*) as count FROM users WHERE role IN (\'officer\', \'super_admin\')');
    const totalAdmins = parseInt(adminsCount.rows[0].count);

    const recentActivityQuery = `
      SELECT
        'Application ' || a.status as action,
        a.updated_at as timestamp,
        'System' as user,
        'Application ID: ' || a.id as details
      FROM applications a
      LEFT JOIN departments d ON a.responsible_dept = d.id
      ${whereCondition}
      ORDER BY a.updated_at DESC
      LIMIT 10
    `;
    const recentActivity = await db.query(recentActivityQuery, queryParams);

    res.json({
      success: true,
      totalApplications: parseInt(stats.rows[0].total_applications),
      pendingApplications: parseInt(stats.rows[0].pending_applications),
      approvedApplications: parseInt(stats.rows[0].approved_applications),
      rejectedApplications: parseInt(stats.rows[0].rejected_applications),
      processingApplications: parseInt(stats.rows[0].processing_applications),
      todayApplications: parseInt(stats.rows[0].today_applications),
      totalUsers,
      totalAdmins,
      departmentStats,
      recentActivity: recentActivity.rows
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.get('/applications/recent', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    const { limit = 20 } = req.query;
    const adminRole = result.user.role;
    const adminId = result.user.userId;
    const adminDept = result.user.department;

    let whereCondition = '';
    let queryParams = [limit];

    // For officers (non-super-admin), show applications in their department + applications they approved
    if (adminRole !== 'super_admin') {
      whereCondition = `WHERE (d.name = $2 AND a.status IN ('pending', 'processing')) OR (ap.approved_by = $3::uuid)`;
      queryParams.push(adminDept, adminId);
    }
    // For super_admin, show all applications (no additional filtering)

    const applicationsQuery = `
      SELECT DISTINCT
        a.*,
        u.full_name as applicant_name,
        u.email as applicant_email,
        d.id as department_id,
        COALESCE(d.name, ldm.department_name) as department_name
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON a.responsible_dept = d.id
      LEFT JOIN license_department_mapping ldm ON a.license_type = ldm.license_type
      ${adminRole !== 'super_admin' ? 'LEFT JOIN approvals ap ON a.id = ap.application_id' : ''}
      ${whereCondition}
      ORDER BY a.submission_date DESC
      LIMIT $1
    `;

    const applications = await db.query(applicationsQuery, queryParams);

    res.json({
      success: true,
      applications: applications.rows
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.get('/applications/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    const { id } = req.params;

    // Get application with enhanced license information
    const application = await db.query(`
      SELECT
        a.*,
        u.full_name as applicant_name,
        u.email as applicant_email,
        u.phone as applicant_phone,
        COALESCE(d.name, ldm.department_name) as department_name,
        ldm.display_name as license_display_name,
        ldm.description as license_description,
        ldm.average_processing_days,
        ldm.fees_min,
        ldm.fees_max,
        CASE
          WHEN a.status IN ('approved', 'rejected') AND a.updated_at > a.submission_date
          THEN EXTRACT(DAY FROM (a.updated_at - a.submission_date))
          ELSE NULL
        END as actual_processing_days
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON a.responsible_dept = d.id
      LEFT JOIN license_department_mapping ldm ON a.license_type = ldm.license_type
      WHERE a.id = $1
    `, [id]);

    if (application.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = application.rows[0];

    // Get documents
    const documents = await db.query(`
      SELECT
        *,
        CASE
          WHEN file_type = 'pdf' THEN 'PDF Document'
          WHEN file_type = 'image' THEN 'Image Document'
          WHEN file_type LIKE '%certificate%' THEN 'Certificate'
          WHEN file_type LIKE '%license%' THEN 'License Document'
          ELSE 'Document'
        END as document_category
      FROM documents
      WHERE application_id = $1
      ORDER BY uploaded_at DESC
    `, [id]);

    // Get approval history with detailed information
    const approvals = await db.query(`
      SELECT
        ap.*,
        u.full_name as approver_name,
        u.email as approver_email,
        u.role as approver_role,
        CASE
          WHEN u.role = 'super_admin' THEN 'Super Admin'
          ELSE u.department
        END as department_name,
        CASE
          WHEN ap.action = 'APPROVED' THEN 'Approved'
          WHEN ap.action = 'REJECTED' THEN 'Rejected'
          WHEN ap.action = 'REVIEWED' THEN 'Under Review'
          ELSE ap.action
        END as action_display
      FROM approvals ap
      LEFT JOIN users u ON ap.approved_by = u.id
      WHERE ap.application_id = $1
      ORDER BY ap.approval_date DESC
    `, [id]);

    // Get application timeline/status history
    const timeline = await db.query(`
      SELECT
        'Application Submitted' as event,
        a.submission_date as event_date,
        'User' as actor,
        u.full_name as actor_name,
        'Application was submitted for processing' as description
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = $1

      UNION ALL

      SELECT
        CASE
          WHEN ap.action = 'APPROVED' THEN 'Application Approved'
          WHEN ap.action = 'REJECTED' THEN 'Application Rejected'
          ELSE 'Application Reviewed'
        END as event,
        ap.approval_date as event_date,
        CASE WHEN u.role = 'super_admin' THEN 'Super Admin' ELSE 'Officer' END as actor,
        u.full_name as actor_name,
        COALESCE(ap.remarks, 'No remarks provided') as description
      FROM approvals ap
      LEFT JOIN users u ON ap.approved_by = u.id
      WHERE ap.application_id = $1

      ORDER BY event_date DESC
    `, [id]);

    // Calculate processing metrics
    const processingMetrics = {
      submittedDate: app.submission_date,
      lastUpdated: app.updated_at,
      expectedProcessingDays: app.average_processing_days,
      actualProcessingDays: app.actual_processing_days,
      isOverdue: app.actual_processing_days ?
        app.actual_processing_days > app.average_processing_days : false,
      status: app.status,
      currentStage: app.current_stage || 'Initial Review'
    };

    res.json({
      success: true,
      application: {
        ...app,
        applicationData: app.applicationdata ? JSON.parse(app.applicationdata) : null
      },
      licenseInfo: {
        type: app.license_type,
        displayName: app.license_display_name || app.license_type,
        description: app.license_description,
        department: app.department_name,
        fees: {
          min: app.fees_min,
          max: app.fees_max
        },
        processingDays: app.average_processing_days
      },
      documents: documents.rows,
      approvals: approvals.rows,
      timeline: timeline.rows,
      processingMetrics,
      reviewCode: app.id.substring(0, 8).toUpperCase() // Short review code for easy reference
    });

  } catch (error) {
    console.error('Get application details error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ✅ ENHANCED: Super Admin Final Approval with License Generation
router.post('/applications/:id/approve', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const adminResult = await AdminAuthService.verifyToken(token);

    if (!adminResult.valid) {
      return res.status(401).json({ error: adminResult.error });
    }

    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = adminResult.user.userId;
    const adminRole = adminResult.user.role;

    const app = await db.query(`
      SELECT a.*, u.email as applicant_email, u.full_name as applicant_name
      FROM applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (app.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = app.rows[0];

    // Check if department has already approved
    const deptApprovals = await db.query(`
      SELECT COUNT(*) as count FROM approvals
      WHERE application_id = $1 AND department_name != 'Super Admin'
    `, [id]);

    if (parseInt(deptApprovals.rows[0].count) === 0 && adminRole !== 'super_admin') {
      return res.status(400).json({
        error: 'Department approval required before super admin approval'
      });
    }

    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    // Update application status
    await db.query(`
      UPDATE applications
      SET
        status = 'approved',
        blockchain_tx_hash = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [txHash, id]);

    // Add approval record
    await db.query(`
      INSERT INTO approvals (application_id, approved_by, department_name, remarks, approval_date, action)
      VALUES ($1, $2, $3, $4, NOW(), 'APPROVED')
    `, [id, adminId, adminRole === 'super_admin' ? 'Super Admin' : adminResult.user.department, remarks || ' - Final Approval']);

    // ✅ GENERATE LICENSE AFTER SUPER ADMIN APPROVAL
    if (adminRole === 'super_admin') {
      await processLicenseGeneration(application.id);
    }

    res.json({
      success: true,
      message: adminRole === 'super_admin' ? 'Application approved and license generated' : 'Application approved by department',
      txHash,
      licenseGenerated: adminRole === 'super_admin'
    });

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});



router.get('/audit-logs', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    const { limit = 50, offset = 0 } = req.query;

    const logs = await db.query(`
      SELECT 
        a.id,
        a.license_type,
        a.status,
        a.blockchain_tx_hash,
        a.ipfs_hash,
        a.submission_date,
        a.updated_at,
        u.full_name as applicant_name
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.blockchain_tx_hash IS NOT NULL
      ORDER BY a.updated_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const total = await db.query(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE blockchain_tx_hash IS NOT NULL
    `);

    res.json({
      success: true,
      logs: logs.rows,
      total: parseInt(total.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});
// ✅ GET ALL ADMIN USERS AND OFFICERS
router.get('/users/list', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    // Fetch admin users (super_admins and officers from users table)
    const adminUsers = await db.query(`
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.department as department_name,
        u.is_active,
        u.created_at
      FROM users u
      WHERE u.role IN ('super_admin', 'officer')
      ORDER BY u.created_at DESC
    `);

    // Fetch officers with their user details
    const officers = await db.query(`
      SELECT 
        o.id,
        u.email,
        u.full_name,
        'officer' as role,
        o.department as department_name,
        u.is_active,
        o.created_at,
        o.badge_number
      FROM officers o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
     console.log('✅ Officers found:', officers.rows.length);

    // Combine both arrays
    const allUsers = [
      ...adminUsers.rows,
      ...officers.rows
    ];
     console.log('📊 Total users to send:', allUsers.length);

    res.json({
      success: true,
      users: allUsers,
      totalAdmins: adminUsers.rows.length,
      totalOfficers: officers.rows.length
    });

  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});
// ==========================================
// 📊 ANALYTICS ENDPOINT
// ==========================================

router.get('/analytics', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    const { timeRange = '30' } = req.query;
    const days = parseInt(timeRange);

    console.log('📊 Fetching analytics for last', days, 'days');

    // Total Users
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersCount.rows[0].count);

    // Total Applications
    const appsCount = await db.query('SELECT COUNT(*) as count FROM applications');
    const totalApplications = parseInt(appsCount.rows[0].count);

    // Success Rate (approved / total)
    const successQuery = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) as total
      FROM applications
    `);
    const successRate = successQuery.rows[0].total > 0 
      ? ((parseInt(successQuery.rows[0].approved) / parseInt(successQuery.rows[0].total)) * 100).toFixed(1)
      : 0;

    // Average Processing Time (in days)
    const avgTimeQuery = await db.query(`
      SELECT AVG(EXTRACT(DAY FROM (updated_at - submission_date))) as avg_days
      FROM applications
      WHERE status IN ('approved', 'rejected')
      AND updated_at > submission_date
    `);
    const avgProcessingTime = avgTimeQuery.rows[0].avg_days 
      ? parseFloat(avgTimeQuery.rows[0].avg_days).toFixed(1)
      : 0;

    // Monthly Data (last 6 months)
    const monthlyData = await db.query(`
      SELECT 
        TO_CHAR(submission_date, 'Mon') as month,
        COUNT(*) as applications,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM applications
      WHERE submission_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(submission_date, 'Mon'), EXTRACT(MONTH FROM submission_date)
      ORDER BY EXTRACT(MONTH FROM submission_date)
      LIMIT 6
    `);

    // Department Data
    const departmentData = await db.query(`
      SELECT 
        d.name as department,
        COUNT(a.*) as total,
        COUNT(*) FILTER (WHERE a.status = 'pending') as pending,
        COUNT(*) FILTER (WHERE a.status = 'approved') as approved,
        COUNT(*) FILTER (WHERE a.status = 'rejected') as rejected,
        COALESCE(AVG(EXTRACT(DAY FROM (a.updated_at - a.submission_date))) FILTER (WHERE a.status IN ('approved', 'rejected')), 0) as avg_time
      FROM departments d
      LEFT JOIN applications a ON a.responsible_dept = d.id
      GROUP BY d.name
      ORDER BY total DESC
    `);

    // Daily Stats (last 7 days)
    const dailyStats = await db.query(`
      SELECT 
        TO_CHAR(submission_date, 'Dy') as date,
        COUNT(*) as applications
      FROM applications
      WHERE submission_date >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(submission_date, 'Dy'), EXTRACT(DOW FROM submission_date)
      ORDER BY EXTRACT(DOW FROM submission_date)
    `);

    res.json({
      success: true,
      totalUsers,
      totalApplications,
      successRate: parseFloat(successRate),
      avgProcessingTime: parseFloat(avgProcessingTime),
      monthlyData: monthlyData.rows.map(row => ({
        month: row.month,
        applications: parseInt(row.applications),
        approved: parseInt(row.approved),
        rejected: parseInt(row.rejected)
      })),
      departmentData: departmentData.rows.map(row => ({
        department: row.department,
        total: parseInt(row.total),
        pending: parseInt(row.pending),
        approved: parseInt(row.approved),
        rejected: parseInt(row.rejected),
        avgTime: parseFloat(row.avg_time).toFixed(1)
      })),
      dailyStats: dailyStats.rows.map(row => ({
        date: row.date,
        applications: parseInt(row.applications)
      }))
    });

  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.get('/export/applications', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const result = await AdminAuthService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    // Get query parameters for filtering
    const { status, department, startDate, endDate } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Add filters
    if (status && status !== 'all') {
      whereConditions.push('a.status = $' + (queryParams.length + 1));
      queryParams.push(status);
    }

    if (department && department !== 'all') {
      whereConditions.push('a.responsible_dept = $' + (queryParams.length + 1));
      queryParams.push(department);
    }

    if (startDate) {
      whereConditions.push('a.submission_date >= $' + (queryParams.length + 1));
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('a.submission_date <= $' + (queryParams.length + 1));
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // ✅ FIX: CSV Department Data - Ensure department names are properly retrieved from database
    // This query now prioritizes the departments table over license_department_mapping for accurate department names
    const applicationsQuery = `
      SELECT
        a.id,
        a.license_type,
        a.status,
        a.submission_date,
        a.blockchain_tx_hash,
        u.full_name as applicant_name,
        u.email as applicant_email,
        u.phone as applicant_phone,
        COALESCE(d.name, ldm.department_name, 'Unassigned') as department_name
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN departments d ON a.responsible_dept = d.id
      LEFT JOIN license_department_mapping ldm ON a.license_type = ldm.license_type
      ${whereClause}
      ORDER BY a.submission_date DESC
    `;

    const applications = await db.query(applicationsQuery, queryParams);

    // Generate CSV content
    const csvHeaders = [
      'Application ID',
      'License Type',
      'Status',
      'Submission Date',
      'Applicant Name',
      'Applicant Email',
      'Applicant Phone',
      'Department',
      'Blockchain TX Hash'
    ];

    const csvRows = applications.rows.map(app => [
      app.id,
      app.license_type,
      app.status,
      new Date(app.submission_date).toLocaleDateString(),
      app.applicant_name || '',
      app.applicant_email || '',
      app.applicant_phone || '',
      app.department_name || '',
      app.blockchain_tx_hash || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="applications_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvContent);

  } catch (error) {
    console.error('Export applications error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
