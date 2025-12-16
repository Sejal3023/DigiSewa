import { Router } from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import db from '../db/pg_client.js';
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { aesEncrypt, deriveAesKeyFromSecret, sha256Hex } from "../utils/crypto.js";
import { recordIssuanceOnChain, recordRevocationOnChain } from "../blockchain/blockchainService.js";
import * as documentService from "../services/documentService.js";
// 🎯 CORRECTED IMPORTS: Importing necessary services for IPFS and blockchain
import { uploadToPinata, generateAESKey, encryptData } from '../services/pinataService.js';
import { shareDocumentWithDepartment } from '../blockchain/blockchainService.js';
import crypto from 'crypto';

const router = Router();

// Ensure backend/generated folder exists
const GENERATED_FOLDER = path.join("backend", "generated");
if (!fs.existsSync(GENERATED_FOLDER)) fs.mkdirSync(GENERATED_FOLDER, { recursive: true });

// Table names
const TABLE_APPLICATIONS = "applications";
const TABLE_DOCUMENTS = "documents";

/* ------------------- DEPARTMENT OFFICER ROUTES ------------------- */

// GET /applications - For department officers
router.get("/", async (req, res, next) => {
  try {
    const { license_type, status, department} = req.query;
    // Note: department filter removed since column doesn't exist

    let query = `
      SELECT 
        a.id,
        a.user_id,
        a.license_type,
        a.status,
        a.submission_date,
        a.blockchain_tx_hash,
        a.ipfs_hash,
        a.application_data,
        a.created_at,
        a.updated_at,
        d.name as department_name  
        FROM applications a
        LEFT JOIN departments d ON a.responsible_dept = d.id  
        WHERE 1=1
    `   ;
        

    const params = [];
    let paramCount = 1;

    // Filter by license type
    if (license_type) {
      query += ` AND a.license_type = $${paramCount}`;
      params.push(license_type);
      paramCount++;
    }

    // Filter by status
    if (status && status !== 'all') {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    
    // ✅ CHANGE 4: Add department filter (ONLY IF PROVIDED)
    if (department) {
      query += ` AND d.name = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    query += ` ORDER BY a.submission_date DESC`;

    console.log('Executing query:', query);
    console.log('With params:', params);

    const result = await db.query(query, params);

    console.log('✅ Found applications:', result.rows.length);

    res.json(result.rows || []);

  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      error: 'Failed to fetch applications',
      message: error.message
    });
  }
});


/* ------------------- APPLICATION ROUTES ------------------- */

// POST /applications - citizen submits application + optional document
router.post(
  "/",
  requireAuth,
  requireRole(["citizen"]), // 🔒 only citizens can submit
  async (req, res, next) => {
    try {
      const userId = req.user.id; // comes from JWT
      const { license_type, application_data, documentContentBase64, filename, documentName, departmentId } = req.body;

      if (!license_type || !application_data) {
        return res.status(400).json({ error: "Missing license_type or application_data" });
      }

      let documentHash = null;
      let documentId = null;
      let ipfsCid = null;
      let blockchainTxHash = null;

      // 🎯 CORRECTED LOGIC: Process document with real IPFS upload and blockchain interaction
      if (documentContentBase64) {
        try {
          // Step 1: Generate keys and hashes
          const plaintextBuffer = Buffer.from(documentContentBase64, "base64");
          const aesKey = generateAESKey();
          const { encrypted, iv } = encryptData(plaintextBuffer, aesKey);
          documentHash = sha256Hex(plaintextBuffer);

          // Step 2: Upload encrypted document to IPFS
          const uploadResult = await uploadToPinata(encrypted, filename, {
            originalName: documentName || filename,
            originalSize: plaintextBuffer.length,
            encrypted: true,
            user_id: userId,
          });

          if (!uploadResult.success) {
            console.error('IPFS upload failed:', uploadResult.error);
            throw new Error(`IPFS upload failed: ${uploadResult.error}`);
          }
          ipfsCid = uploadResult.cid;
          console.log('Document uploaded to IPFS with CID:', ipfsCid);

          // Step 3: Record hash on the blockchain (using a placeholder department ID for now)
          // You can replace '1' with an actual departmentId from the request if applicable
          const blockchainResult = await shareDocumentWithDepartment(
            userId,
            ipfsCid,
            documentHash,
            departmentId || 1 // <-- Pass the correct department ID here
          );

          if (!blockchainResult) {
            console.error('Blockchain registration failed.');
            throw new Error('Failed to register document on blockchain');
          }
          blockchainTxHash = blockchainResult.txHash;
          console.log('Document registered on blockchain with TX:', blockchainTxHash);

          // Step 4: Save document metadata to PostgreSQL
          const documentResult = await db.query(
            `INSERT INTO ${TABLE_DOCUMENTS} (filename, original_name, file_type, file_size, file_hash, ipfs_hash, encrypted_data, encryption_key, status, uploaded_at, application_id, user_id, blockchain_tx_hash) 
              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
            [
              filename || "supporting_doc",
              documentName || filename || "Supporting Document",
              "application/pdf", // placeholder
              plaintextBuffer.length,
              documentHash,
              ipfsCid,
              encrypted.toString("base64"),
              aesKey.toString("base64"),
              "pending",
              new Date(),
              null, // application_id will be updated below
              userId,
              blockchainTxHash
            ]
          );

          documentId = documentResult.rows[0].id;
        } catch (docError) {
          console.error("Document processing error:", docError);
          return res.status(500).json({ error: "Failed to process document" });
        }
      }

            // Map license type to department
      const departmentMapping = {
        'vehicle-registration': 'Regional Transport Office',
        'drivers-license': 'Regional Transport Office',
        'fssai-license': 'Food Safety Department',
        'shop-establishment': 'Labour Department',
        'income-certificate': 'Revenue Department',
        'police-verification': 'Police Department',
        'building-permit': 'Municipal Corporation'  // ✅ ADDED THIS LINE
      };

      const departmentName = departmentMapping[license_type];
      let assignedDepartmentId = null;

      if (departmentName) {
        const deptResult = await db.query(
          'SELECT id FROM departments WHERE name = $1',
          [departmentName]
        );
        assignedDepartmentId = deptResult.rows[0]?.id;
        console.log(`📤 Assigning "${license_type}" → Department "${departmentName}" (ID: ${assignedDepartmentId})`);
      }

      // Insert application record WITH responsible_dept
      const result = await db.query(
        `INSERT INTO ${TABLE_APPLICATIONS} (
          user_id, 
          license_type, 
          application_data, 
          status, 
          responsible_dept,
          submission_date, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
        [userId, license_type, application_data, "pending", assignedDepartmentId]
      );


      // Insert application record
     // const result = await db.query(
       // `INSERT INTO ${TABLE_APPLICATIONS} (user_id, license_type, application_data, status, submission_date, created_at) 
         // VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        //[userId, license_type, application_data, "pending"]
      //);

      const application = result.rows[0];

      // Link document to application if document uploaded
      if (documentId) {
        await db.query(
          `UPDATE ${TABLE_DOCUMENTS} SET application_id = $1 WHERE id = $2`,
          [application.id, documentId]
        );
      }

      res.json({
        success: true,
        application: {
          id: application.id,
          license_type: application.license_type,
          status: application.status,
          created_at: application.created_at,
          document_id: documentId,
          tracking_id: application.id,
          ipfs_cid: ipfsCid,
          document_hash: documentHash,
          blockchain_tx_hash: blockchainTxHash,
        },
        message: "Application submitted successfully"
      });
    } catch (err) {
      console.error("Application creation error:", err);
      next(err);
    }
  }
);

// PATCH /approvals/:id - Update approval record
//router.patch("/:id", requireAuth, async (req, res) => {
  //try {
    //const { id } = req.params;
    //const { blockchain_tx_hash } = req.body;
    
    //const result = await db.query(
      //`UPDATE approvals 
       //SET blockchain_tx_hash = $1
       //WHERE id = $2
       //RETURNING *`,
      //[blockchain_tx_hash, id]
    //);
    
    //if (result.rows.length === 0) {
      //return res.status(404).json({ error: 'Approval not found' });
    //}
    
    //res.json({ success: true, data: result.rows[0] });
    
  //} catch (error) {
    //console.error('Error updating approval:', error);
    //res.status(500).json({ error: error.message });
  //}
//});

// PATCH /applications/:id - Update application status
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`📝 Updating application ${id}:`, updateData);
    
    // Build dynamic UPDATE query
    const fields = Object.keys(updateData);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updateData[field]);
    values.push(id);
    
    const result = await db.query(
      `UPDATE applications 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    console.log('✅ Application updated:', result.rows[0].id);
    res.json({ success: true, application: result.rows[0] });
    
  } catch (error) {
    console.error('❌ Error updating application:', error);
    res.status(500).json({ error: error.message });
  }
});




// GET /applications/user-applications - retrieve all applications for the current user
router.get("/user-applications", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id; // Comes from JWT token
    console.log(`Fetching applications for user ID: ${userId}`);

    // This query fetches all applications for the authenticated user, ordered by submission date
    // and joins with the documents table to include document hashes for the frontend
    const result = await db.query(
      `SELECT 
         app.*,
         doc.ipfs_hash,
         doc.file_hash AS document_sha256_hash,
         doc.blockchain_tx_hash
       FROM ${TABLE_APPLICATIONS} app
       LEFT JOIN ${TABLE_DOCUMENTS} doc ON app.id = doc.application_id
       WHERE app.user_id = $1
       ORDER BY app.submission_date DESC`,
      [userId]
    );

    // The 'id' from the database is your tracking ID
    const applicationsWithTrackingId = result.rows.map(app => ({
      tracking_id: app.id,
      ...app
    }));

    res.json({
      success: true,
      applications: applicationsWithTrackingId
    });
  } catch (err) {
    console.error("Error fetching user applications:", err);
    next(err);
  }
});

// GET /applications/track/:id/pdf - generate & download application PDF
router.get("/track/:id/pdf", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT a.*, u.full_name, u.email, u.phone FROM applications a JOIN users u ON a.user_id = u.id WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).send("Application not found");
    const app = result.rows[0];
    const appData = typeof app.application_data === "object"
      ? app.application_data
      : JSON.parse(app.application_data || "{}");

    // Create PDF and stream it to response
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition", `attachment; filename=application_${id}.pdf`
    );
    doc.pipe(res);

    /* -------------------- HEADER -------------------- */
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("DIGISEWA - GOVERNMENT LICENSE APPLICATION FORM", { align: "center" })
      .moveDown(1);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Application ID: ${app.id}`, { align: "right" })
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" })
      .moveDown(1);

    /* -------------------- APPLICANT DETAILS -------------------- */
    doc.rect(40, doc.y, 520, 25).fill("#e8e8e8").stroke("#cccccc");
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(13).text("Applicant Details", 45, doc.y - 18);
    doc.moveDown(1.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Full Name: ${app.full_name}`)
      .text(`Email: ${app.email}`)
      .text(`Phone: ${app.phone}`)
      .text(`User ID: ${app.user_id}`)
      .moveDown(1);

    /* -------------------- APPLICATION DETAILS -------------------- */
    doc.rect(40, doc.y, 520, 25).fill("#e8e8e8").stroke("#cccccc");
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(13).text("Application Details", 45, doc.y - 18);
    doc.moveDown(1.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`License Type: ${app.license_type}`)
      .text(`Status: ${app.status}`)
      .text(`Submission Date: ${new Date(app.submission_date).toLocaleString()}`)
      .moveDown(1);

    /* -------------------- APPLICATION FORM DATA -------------------- */
    doc.rect(40, doc.y, 520, 25).fill("#e8e8e8").stroke("#cccccc");
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(13).text("Application Form Data", 45, doc.y - 18);
    doc.moveDown(1.5);

    doc.font("Helvetica").fontSize(11).fillColor("#333");
    Object.entries(appData).forEach(([key, value]) => {
      if (typeof value === "object") value = JSON.stringify(value);
      doc.text(`${key.replace(/_/g, " ")}: ${value}`);
    });
    doc.moveDown(1.5);

    /* -------------------- DECLARATION -------------------- */
    doc.rect(40, doc.y, 520, 25).fill("#e8e8e8").stroke("#cccccc");
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(13).text("Declaration", 45, doc.y - 18);
    doc.moveDown(1.5);

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#000")
      .text(
        "I hereby confirm that all the information provided above is true and correct to the best of my knowledge. " +
        "I understand that any false information may lead to rejection of this application. " +
        "I agree to comply with all terms and conditions under the DigiSewa system."
      )
      .moveDown(2)
      .text(`e-Signature: ${app.full_name}`, { align: "right" })
      .text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });

    doc.text("\n\n--- END OF APPLICATION FORM ---", { align: "center" });

    // End the document
    doc.end();
  } catch (err) {
    console.error("Error generating application form PDF:", err);
    next(err);
  }
});

/* ------------------- APPLICATION TRACKING ROUTES ------------------- */

// GET /applications/track/:id - Public application tracking
router.get("/track/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Application ID is required" });
    }

    // Get application with user info and related data
   const result = await db.query(
  `SELECT 
    a.*, 
    u.email, 
    u.full_name,
    u.phone,
    l.id as license_id,
    l.license_number,
    l.payload_hash,
    l.blockchain_hash,
    l.issue_date,
    l.expiry_date,
    l.status as license_status,
    COUNT(doc.id) as document_count
   FROM applications a 
   LEFT JOIN users u ON a.user_id = u.id 
   LEFT JOIN licenses l ON a.id = l.application_id 
   LEFT JOIN documents doc ON a.id = doc.application_id
   WHERE a.id = $1
   GROUP BY a.id, u.email, u.full_name, u.phone, l.id, l.license_number, l.payload_hash, l.blockchain_hash, l.issue_date, l.expiry_date, l.status`,
  [id]
);

    if (!result.rows.length) {
      return res.status(404).json({ error: "Application not found" });
    }

    const application = result.rows[0];

    // Get application documents
    const documentsResult = await db.query(
  `SELECT 
     id, 
     ipfs_hash AS cid, 
     uploaded_at, 
     application_id, 
     ipfs_hash, 
     status, 
     verified_at
   FROM documents 
   WHERE application_id = $1 
   ORDER BY uploaded_at DESC`,
  [id]
);

    // Generate timeline based on application status and dates
    const timeline = generateApplicationTimeline(application);

    // Format the tracking response
    const trackingData = {
      application: {
        id: application.id,
        license_type: application.license_type,
        status: application.status,
        applicant_name: application.full_name,
        applicant_email: application.email,
        applicant_phone: application.phone,
        department: getDepartmentFromLicenseType(application.license_type),
        submission_date: application.submission_date,
        created_at: application.created_at,
        updated_at: application.updated_at,
        blockchain_tx_hash: application.blockchain_tx_hash,
        ipfs_hash: application.ipfs_hash,
        document_hash: application.document_hash
      },
      license: application.license_id ? {
        license_id: application.license_id,
        service_type: application.service_type,
        payload_hash: application.payload_hash,
        chain_tx: application.chain_tx,
        issued_at: application.issued_at,
        status: application.license_status
      } : null,
      timeline: timeline,
      documents: documentsResult.rows,
      document_count: application.document_count,
      current_stage: getCurrentStage(application.status),
      progress: calculateProgress(application.status)
    };

    res.json({
      success: true,
      data: trackingData
    });

  } catch (err) {
    console.error("Application tracking error:", err);
    next(err);
  }
});

/// GET /applications/user/my-applications - Get authenticated user's applications
router.get("/user/my-applications", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log('📋 Fetching applications for user:', userId);

    const result = await db.query(
      `SELECT 
        a.id, 
        a.license_type, 
        a.status, 
        a.submission_date, 
        a.created_at, 
        a.updated_at,
        a.blockchain_tx_hash, 
        a.ipfs_hash,
        a.current_stage,
        a.responsible_dept,
        COUNT(doc.id) as document_count
       FROM applications a 
       LEFT JOIN documents doc ON a.id = doc.application_id
       WHERE a.user_id = $1 
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId]
    );

    console.log('✅ Found applications:', result.rows.length);

    // Format applications with progress and additional info
    const applications = result.rows.map(app => ({
      id: app.id,
      license_type: app.license_type,
      status: app.status,
      submission_date: app.submission_date,
      created_at: app.created_at,
      updated_at: app.updated_at,
      blockchain_tx_hash: app.blockchain_tx_hash,
      ipfs_hash: app.ipfs_hash,
      current_stage: app.current_stage,
      document_count: parseInt(app.document_count) || 0,
      progress: calculateProgress(app.status),
      can_download: app.status === 'approved',
      department: getDepartmentFromLicenseType(app.license_type)
    }));

    // Calculate statistics
    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      processing: applications.filter(a => a.status === 'processing').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    };

    console.log('📊 Stats:', stats);

    res.json({
      success: true,
      data: {
        applications,
        stats
      }
    });

  } catch (err) {
    console.error("❌ Get user applications error:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: err.message
    });
  }
});


// ✅ UPDATED: GET /applications/:id - Fetch application with linked documents
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch main application data
    const appResult = await db.query(
      `SELECT * FROM applications WHERE id = $1`,
      [id]
    );

    if (!appResult.rows.length) {
      return res.status(404).json({ error: "Application not found" });
    }

    const application = appResult.rows[0];

    // Fetch related documents for this application
 // ✅ Corrected query for your actual table structure
const docsResult = await db.query(
  `SELECT 
     id,
     original_name,
     file_type,
     file_size,
     file_hash,
     ipfs_hash AS cid,
     status,
     uploaded_at
   FROM documents
   WHERE application_id = $1
   ORDER BY uploaded_at DESC`,
  [id]
);


    res.json({
      ...application,
      documents: docsResult.rows || []
    });
  } catch (error) {
    console.error("Error fetching application details with documents:", error);
    res.status(500).json({ error: "Failed to fetch application details" });
  }
});



// GET /applications/:id/status - Quick status check (public)
router.get("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, license_type, status, submission_date, updated_at, blockchain_tx_hash
       FROM applications 
       WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Application not found" });
    }

    const application = result.rows[0];

    res.json({
      success: true,
      data: {
        id: application.id,
        license_type: application.license_type,
        status: application.status,
        submission_date: application.submission_date,
        last_updated: application.updated_at,
        blockchain_verified: !!application.blockchain_tx_hash,
        progress: calculateProgress(application.status),
        current_stage: getCurrentStage(application.status).name
      }
    });

  } catch (err) {
    console.error("Get application status error:", err);
    next(err);
  }
});

// GET /applications/:id/documents - Get application documents
router.get("/:id/documents", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user owns the application
    const appResult = await db.query(
      `SELECT id FROM applications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (!appResult.rows.length) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    const documentsResult = await db.query(
      `SELECT id, cid, uploaded_at, application_id, ipfs_hash, status, verified_at, encrypted_data, encryption_key
       FROM documents 
       WHERE application_id = $1 
       ORDER BY uploaded_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        application_id: id,
        documents: documentsResult.rows
      }
    });

  } catch (err) {
    console.error("Get application documents error:", err);
    next(err);
  }
});

/* ------------------- HELPER FUNCTIONS ------------------- */

function generateApplicationTimeline(application) {
  const timeline = [];
  
  // Application submitted
  timeline.push({
    status: 'submitted',
    notes: 'Application submitted successfully',
    created_at: application.submission_date || application.created_at,
    icon: 'file-text'
  });

  // Document upload (if documents exist)
  if (application.document_count > 0) {
    timeline.push({
      status: 'documents_uploaded',
      notes: `${application.document_count} document(s) uploaded`,
      created_at: application.created_at,
      icon: 'upload'
    });
  }

  // Current status
  if (application.status !== 'pending') {
    timeline.push({
      status: application.status,
      notes: getStatusMessage(application.status),
      created_at: application.updated_at,
      icon: getStatusIcon(application.status)
    });
  }

  // Blockchain verification (if exists)
  if (application.blockchain_tx_hash) {
    timeline.push({
      status: 'blockchain_verified',
      notes: 'Application recorded on blockchain',
      created_at: application.updated_at,
      icon: 'shield'
    });
  }

  // License issued (if approved and has license)
  if (application.status === 'approved' && application.license_id) {
    timeline.push({
      status: 'license_issued',
      notes: 'License has been approved and issued',
      created_at: application.issued_at || application.updated_at,
      icon: 'award'
    });
  }

  return timeline;
}

function getDepartmentFromLicenseType(licenseType) {
  const departmentMap = {
    'shop-establishment': 'Labour Department',
    'vehicle-registration': 'Regional Transport Office',
    'fssai-license': 'Food & Drug Administration', 
    'building-permit': 'Municipal Corporation',  // ✅ ADD THIS (it was missing)
    'income-certificate': 'Revenue Department',
    'police-verification': 'Police Department'
  };
  
  return departmentMap[licenseType] || 'General Department';
}

function getCurrentStage(status) {
  const stages = {
    'pending': { stage: 1, name: 'Application Submitted', description: 'Your application has been received and is awaiting review' },
    'processing': { stage: 2, name: 'Under Processing', description: 'Your application is being processed by the department' },
    'approved': { stage: 3, name: 'Approved', description: 'Your application has been approved successfully' },
    'rejected': { stage: 3, name: 'Rejected', description: 'Your application was not approved' }
  };
  
  return stages[status] || stages.pending;
}

function calculateProgress(status) {
  const progressMap = {
    'pending': 25,
    'processing': 65,
    'approved': 100,
    'rejected': 100
  };
  
  return progressMap[status] || 0;
}

function getStatusMessage(status) {
  const messages = {
    'pending': 'Application is waiting for department review',
    'processing': 'Application is being processed by the department',
    'approved': 'Application has been approved successfully',
    'rejected': 'Application has been rejected'
  };
  
  return messages[status] || 'Status updated';
}

function getStatusIcon(status) {
  const icons = {
    'pending': 'clock',
    'processing': 'settings',
    'approved': 'check-circle',
    'rejected': 'x-circle'
  };
  
  return icons[status] || 'file-text';
}

export default router;
