import { requireAuth } from '../middleware/authMiddleware.js';
import express from 'express';
import multer from 'multer';
import { uploadDocument, getAccessCode } from '../controllers/documentUploadController.js';
import { retrieveDocument, verifyDocumentIntegrity, getDocumentInfo, decryptDocument } from '../controllers/documentRetrievalController.js';
import { downloadFromPinata } from '../services/pinataService.js';

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

// Document upload routes
router.post('/upload',
  requireAuth , 
  [upload.single('document'), uploadDocument]);
router.post('/access-code', requireAuth, getAccessCode);

// Document retrieval routes
router.post('/retrieve', retrieveDocument);
router.post('/verify', verifyDocumentIntegrity);
router.get('/info/:applicationId', getDocumentInfo);
router.post('/decrypt', decryptDocument);

// ✅ FIX: Add IPFS proxy route for document viewing
// This route allows frontend to fetch documents from IPFS through backend to avoid CORS issues
router.get('/proxy/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        error: 'CID parameter is required'
      });
    }

    console.log(`📥 Proxying document from IPFS with CID: ${cid}`);

    // Download document from IPFS using Pinata service
    const downloadResult = await downloadFromPinata(cid);

    if (!downloadResult.success) {
      console.error('❌ Failed to download from IPFS:', downloadResult.error);
      return res.status(404).json({
        success: false,
        error: 'Document not found on IPFS',
        details: downloadResult.error
      });
    }

    console.log(`✅ Successfully proxied document (${downloadResult.data.length} bytes)`);

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', downloadResult.data.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Send the document data
    res.send(downloadResult.data);

  } catch (error) {
    console.error('❌ Error in document proxy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during document proxy',
      details: error.message
    });
  }
});

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

export default router;
