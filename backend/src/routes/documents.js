import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware.js';
import documentController from '../controllers/documentController.js';
import { uploadDocument, getAccessCode } from '../controllers/documentUploadController.js';
import { retrieveDocument, verifyDocumentIntegrity, getDocumentInfo, decryptDocument } from '../controllers/documentRetrievalController.js';
import { downloadApplicationPDF } from '../controllers/documentController.js';
import db from '../db/pg_client.js';
import { decryptFile } from '../services/documentService.js';
import { PINATA_GATEWAY_URL, NETWORK_CONFIG } from '../services/pinataService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, images, and text files are allowed.'), false);
    }
  }
});
// GET /api/documents/user - Get all documents for logged-in user
router.get('/user', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT 
        id,
        original_name as name,
        ipfs_hash as cid,
        file_size as "fileSize",
        created_at as "createdAt",
        application_id as "applicationId",
        status,
        CASE WHEN encryption_key IS NOT NULL THEN true ELSE false END as encrypted
      FROM documents
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        documents: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
});
// Proxy route for IPFS content to avoid CORS
router.get('/proxy/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    console.log(`Proxying IPFS content for CID: ${cid}`);

    let response;
    let lastError;

    for (let attempt = 1; attempt <= NETWORK_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${NETWORK_CONFIG.maxRetries} to fetch CID: ${cid}`);
        
        response = await axios.get(`${PINATA_GATEWAY_URL}/${cid}`, {
          responseType: 'arraybuffer',
          timeout: NETWORK_CONFIG.timeout
        });

        console.log(`✅ Successfully fetched CID ${cid} on attempt ${attempt}`);
        break;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} for CID ${cid} failed:`, error.message);

        if (attempt < NETWORK_CONFIG.maxRetries) {
          const delay = NETWORK_CONFIG.retryDelay;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!response) {
      console.error(`All ${NETWORK_CONFIG.maxRetries} attempts failed for CID: ${cid}`);
      throw lastError;
    }

    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(response.data));


  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document from IPFS',
      details: error.message
    });
  }
});

// GET /api/documents/:id - Get document details with encryption keys
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // ✅ ADD THIS
    const userRole = req.user.role; // ✅ ADD THIS
    
    const result = await db.query(
      `SELECT 
        id,
        original_name as name,
        ipfs_hash as cid,
        encryption_key as "aesKey",
        iv,
        file_size as "fileSize",
        created_at as "uploadedAt",
        application_id as "applicationId",
        user_id as "userId", -- ✅ ADD THIS
        CASE WHEN encryption_key IS NOT NULL THEN true ELSE false END as encrypted
      FROM documents
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

     // ✅ ADD THIS ONE LINE HERE (defines the document variable)
    const document = result.rows[0];

     // ✅ ADD THIS ENTIRE AUTHORIZATION + LOGGING BLOCK
    // Check authorization: document owner OR officer/admin role
    const isOwner = document.userId === userId;
    const isAuthorizedRole = ['officer', 'admin', 'department'].includes(userRole);

    if (!isOwner && !isAuthorizedRole) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this document'
      });
    }

    // ✅ LOG ACCESS if officer/admin accessing someone else's document
    if (!isOwner && isAuthorizedRole) {
      try {
        await db.query(
          `INSERT INTO document_access_logs 
           (document_id, accessed_by_user_id, accessed_by_role, access_type, ip_address)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id, 
            userId, 
            userRole, 
            'VIEW_KEYS_ACCESSED', 
            req.ip || req.connection?.remoteAddress || 'unknown'
          ]
        );
        
        console.log(`🔐 ${userRole.toUpperCase()} (${userId}) accessed encryption keys for document ${id}`);
      } catch (logError) {
        // Don't fail the request if logging fails
        console.error('⚠️ Failed to log document access:', logError);
      }
    }
    // ✅ END OF NEW BLOCK

    res.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Error fetching document details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document details'
    });
  }
});

// New document upload and retrieval routes (Phase 1 & 2)
router.post('/upload', requireAuth, upload.single('document'), uploadDocument);
router.post('/access-code', requireAuth, getAccessCode);
router.post('/retrieve', retrieveDocument);
router.post('/verify', verifyDocumentIntegrity);
router.get('/info/:applicationId', getDocumentInfo);
router.post('/decrypt', decryptDocument);

// Existing document routes
router.get('/', documentController.getDocuments);
router.get('/department', documentController.getDepartmentDocuments);
//router.get('/:id', documentController.getDocumentById);
router.get('/access/:cid', documentController.getDocumentForAccess);
router.post('/:id/share', documentController.shareDocument);

router.get('/track/:id/pdf', requireAuth, downloadApplicationPDF);


// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});


// ✅ Route to view decrypted document
router.get("/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Fetch document record
    const result = await db.query("SELECT * FROM documents WHERE id = $1", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = result.rows[0];

    // 2️⃣ Validate encryption fields
    if (!doc.encrypted_data || !doc.encryption_key) {
      return res
        .status(400)
        .json({ error: "Document not encrypted or missing key" });
    }

    // 3️⃣ Convert stored base64/text to Buffer
    const encryptedBuffer = Buffer.isBuffer(doc.encrypted_data)
      ? doc.encrypted_data
      : Buffer.from(doc.encrypted_data.trim(), "base64");

    // 4️⃣ Decrypt file using your existing AES-GCM logic
    const decryptedBuffer = await decryptFile(encryptedBuffer, doc.encryption_key);

    // 5️⃣ Send decrypted file inline (opens in browser)
    res.setHeader("Content-Type", doc.file_type || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${doc.original_name}"`);
    return res.send(decryptedBuffer);

  } catch (error) {
    console.error("❌ Error serving decrypted document:", error);
    res.status(500).json({ error: "Failed to view document" });
  }
});

// ============================================================
// DOCUMENT VERIFICATION ROUTES (Add before export default)
// ============================================================

// Verify document (approve/reject)
router.post('/:id/verify', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const officerId = req.user.id;
    const officerRole = req.user.role;

    console.log(`📝 Document verification request: ${id} -> ${status} by ${officerRole}`);

    // Validate officer role
    if (!['officer', 'admin', 'department'].includes(officerRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only officers can verify documents'
      });
    }

    // Validate status
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved", "rejected", or "pending"'
      });
    }

    // Require remarks for rejection
    if (status === 'rejected' && !remarks) {
      return res.status(400).json({
        success: false,
        message: 'Remarks are required when rejecting a document'
      });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Get current document
      const docResult = await db.query(
        'SELECT status, application_id, original_name FROM documents WHERE id = $1',
        [id]
      );

      if (docResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const previousStatus = docResult.rows[0].status;
      const applicationId = docResult.rows[0].application_id;
      const documentName = docResult.rows[0].original_name;

      console.log(`📄 Document: ${documentName}, Previous status: ${previousStatus}`);

      // Update document status
      const updateResult = await db.query(
        `UPDATE documents 
         SET status = $1,
             verified_by = $2,
             verified_at = CURRENT_TIMESTAMP,
             verification_remarks = $3
         WHERE id = $4
         RETURNING *`,
        [status, officerId, remarks || null, id]
      );

      console.log(`✅ Document status updated to: ${status}`);

      // Log in audit table
      await db.query(
        `INSERT INTO document_verifications 
         (document_id, application_id, verified_by, previous_status, new_status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, applicationId, officerId, previousStatus, status, remarks || null]
      );

      console.log(`📝 Verification logged in audit trail`);

      // Get application documents stats
      const statsResult = await db.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
          COUNT(CASE WHEN status IN ('uploaded', 'pending') THEN 1 END) as pending
         FROM documents 
         WHERE application_id = $1`,
        [applicationId]
      );

      const stats = statsResult.rows[0];

      console.log(`📊 Application stats:`, {
        total: stats.total,
        approved: stats.approved,
        rejected: stats.rejected,
        pending: stats.pending
      });

      // If all documents are approved, update application status
      if (parseInt(stats.approved) === parseInt(stats.total) && parseInt(stats.total) > 0) {
        await db.query(
          `UPDATE applications 
           SET status = 'documents_verified'
           WHERE id = $1 AND status IN ('pending', 'submitted')`,
          [applicationId]
        );
        console.log(`✅ All documents approved - Application status updated to 'documents_verified'`);
      }

      await db.query('COMMIT');

      res.json({
        success: true,
        message: `Document ${status} successfully`,
        data: {
          documentId: id,
          documentName,
          status,
          remarks,
          verifiedBy: officerId,
          verifiedAt: new Date().toISOString(),
          applicationStats: {
            total: parseInt(stats.total),
            approved: parseInt(stats.approved),
            rejected: parseInt(stats.rejected),
            pending: parseInt(stats.pending),
            allApproved: parseInt(stats.approved) === parseInt(stats.total)
          }
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      console.error('❌ Transaction failed:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error verifying document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document',
      error: error.message
    });
  }
});

// Get verification history for a document
router.get('/:id/verification-history', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📜 Fetching verification history for document: ${id}`);

    const result = await db.query(
      `SELECT 
        dv.id,
        dv.previous_status,
        dv.new_status,
        dv.remarks,
        dv.created_at,
        u.full_name as verified_by_name,
        u.email as verified_by_email,
        u.role as verified_by_role
       FROM document_verifications dv
       LEFT JOIN users u ON dv.verified_by = u.id
       WHERE dv.document_id = $1
       ORDER BY dv.created_at DESC`,
      [id]
    );

    console.log(`✅ Found ${result.rows.length} verification records`);

    res.json({
      success: true,
      data: {
        documentId: id,
        historyCount: result.rows.length,
        history: result.rows
      }
    });

  } catch (error) {
    console.error('❌ Error fetching verification history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification history',
      error: error.message
    });
  }
});

// Bulk verify multiple documents
router.post('/bulk-verify', requireAuth, async (req, res) => {
  try {
    const { documentIds, status, remarks } = req.body;
    const officerId = req.user.id;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Document IDs array is required'
      });
    }

    console.log(`📦 Bulk verification: ${documentIds.length} documents -> ${status}`);

    const results = [];
    const errors = [];

    for (const docId of documentIds) {
      try {
        await db.query('BEGIN');

        const docResult = await db.query(
          'SELECT status, application_id FROM documents WHERE id = $1',
          [docId]
        );

        if (docResult.rows.length > 0) {
          const previousStatus = docResult.rows[0].status;
          const applicationId = docResult.rows[0].application_id;

          await db.query(
            `UPDATE documents 
             SET status = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP, verification_remarks = $3
             WHERE id = $4`,
            [status, officerId, remarks || null, docId]
          );

          await db.query(
            `INSERT INTO document_verifications 
             (document_id, application_id, verified_by, previous_status, new_status, remarks)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [docId, applicationId, officerId, previousStatus, status, remarks || null]
          );

          await db.query('COMMIT');
          results.push({ documentId: docId, success: true });
        } else {
          await db.query('ROLLBACK');
          errors.push({ documentId: docId, error: 'Document not found' });
        }

      } catch (error) {
        await db.query('ROLLBACK');
        errors.push({ documentId: docId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk verification completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk verification:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk verification failed',
      error: error.message
    });
  }
});

// ============================================================
// END OF VERIFICATION ROUTES
// ============================================================



export default router;
