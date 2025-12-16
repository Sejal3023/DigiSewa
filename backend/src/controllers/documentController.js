import * as documentService from '../services/documentService.js';
import * as blockchainService from '../blockchain/blockchainService.js';
import { validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';
import db from '../db/pg_client.js';

// Upload a new document (steps 1-7)
//const uploadDocument = async (req, res) => {
  //try {
    //const errors = validationResult(req);
    //if (!errors.isEmpty()) {
      //return res.status(400).json({ errors: errors.array() });
    //}

    //const { name, departmentId, applicationId, accessPolicy } = req.body;
    //const owner = req.user.id;

    //if (!req.file) {
      //return res.status(400).json({ error: 'No file uploaded' });
    //}

    // Check if file is PDF
    //if (req.file.mimetype !== 'application/pdf') {
      //return res.status(400).json({ error: 'Only PDF files are allowed' });
    //}

    // Steps 2-4: Encrypt and upload to IPFS
  //const uploadResult = await documentService.processAndUploadDocument(
  //req.file.buffer,
  //req.file.originalname,
  //{ applicationId, departmentId }
//);


    // Step 6: Register on blockchain
   // const blockchainResult = await blockchainService.registerDocument(
   //   uploadResult.cid,
     // departmentId,
      //accessPolicy,
      //uploadResult.encryptedAesKey
    //);

    // Store document metadata
// Store document metadata
//const document = await documentService.createDocument({
  //user_id: owner,                          // maps to user_id column
  //filename: req.file.originalname,         // optional, can keep original name
  //original_name: req.file.originalname,    // store original filename
  //file_type: req.file.mimetype,            // MIME type
  //file_size: req.file.size,                // file size
  //file_hash: uploadResult.documentHash,    // SHA-256 hash of original file
  //ipfs_hash: uploadResult.cid,             // IPFS CID
  //encryption_key: uploadResult.aesKey,     // AES key
  //iv: uploadResult.iv,                     // IV
  //blockchain_tx_hash: uploadResult.blockchainTxHash, // blockchain tx
  //application_id: applicationId,           // link to application
  //status: 'uploaded'                        // default status
//});


    //res.status(201).json({
     // message: 'Document uploaded successfully',
      //document,
     // cid: uploadResult.cid
    //});
  //} catch (error) {
    //console.error('Error uploading document:', error);
    //res.status(500).json({ error: 'Failed to upload document' });
  //}
//};

// Upload a new document (steps 1-7)
const uploadDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, departmentId, applicationId, accessPolicy } = req.body;
    const owner = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if file is PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Steps 2-4: Encrypt and upload to IPFS + blockchain registration
    const uploadResult = await documentService.processAndUploadDocument(
      req.file.buffer,
      req.file.originalname,
      { applicationId, departmentId }
    );

    // ❌ REMOVE THIS BROKEN BLOCKCHAIN CALL - it's already handled in processAndUploadDocument
    // const blockchainResult = await blockchainService.registerDocument(...);

    // Store document metadata
    const document = await documentService.createDocument({
      user_id: owner,
      filename: req.file.originalname,
      original_name: req.file.originalname,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      file_hash: uploadResult.documentHash,
      ipfs_hash: uploadResult.cid,
      encryption_key: uploadResult.aesKey,
      iv: uploadResult.iv,
      blockchain_tx_hash: uploadResult.blockchainTxHash,
      application_id: applicationId,
      status: 'uploaded'
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document,
      cid: uploadResult.cid,
      blockchainTxHash: uploadResult.blockchainTxHash
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};


// Get all documents for the authenticated user
const getDocuments = async (req, res) => {
  try {
    const owner = req.user.id;
    const documents = await documentService.getDocumentsByOwner(owner);
    res.json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};

// Get a specific document by ID
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error getting document by ID:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
};

// Get document for access (steps 8-15)
const getDocumentForAccess = async (req, res) => {
  try {
    const { cid } = req.params;
    const departmentId = req.user.departmentId;

    // Step 9: Validate access on blockchain
    const hasAccess = await blockchainService.verifyDepartmentAccess(cid, departmentId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Step 10: Fetch encrypted file from IPFS
    const encryptedFile = await documentService.getFileFromIPFS(cid);
    
    // Step 12: Get encrypted AES key
    const encryptedAesKey = await blockchainService.getEncryptedAesKey(cid, departmentId);
    
    res.json({
      encryptedFile: encryptedFile.toString('base64'),
      encryptedAesKey,
      cid
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Share a document with a department (steps 16-18)
const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId, accessPolicy } = req.body;
    const grantedBy = req.user.id;

    // Get document to share
    const document = await documentService.getDocumentById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Step 17: Share with department via blockchain
    const sharingResult = await blockchainService.shareWithDepartment(
      document.cid,
      req.user.departmentId,
      departmentId,
      accessPolicy,
      document.aesKey
    );

    // Store permission in database
    const documentPermission = await documentService.shareDocument(
      id,
      departmentId,
      accessPolicy,
      grantedBy
    );

    res.status(201).json({
      message: 'Document shared successfully',
      documentPermission,
      txHash: sharingResult.txHash
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
};

// Get department documents
const getDepartmentDocuments = async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const documents = await documentService.getDepartmentDocuments(departmentId);
    res.json(documents);
  } catch (error) {
    console.error('Error getting department documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};
// --- NEW FUNCTION FOR APPLICATION FORM / FORMAT DOWNLOAD ---
export const downloadApplicationPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch application data from database
    const result = await db.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Application not found');

    const application = result.rows[0];

    // Ensure logged-in citizen is the owner
    if (application.owner !== req.user.id) return res.status(403).send('Access denied');

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Application_${application.id}.pdf"`);

    // Generate PDF dynamically
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Application Form', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Application ID: ${application.id}`);
    doc.text(`Name: ${application.name}`);
    doc.text(`Email: ${application.email}`);
    doc.text(`Program: ${application.program}`);
    doc.text(`Date of Birth: ${application.dob}`);
    doc.text(`Department: ${application.department}`);
    doc.text(`Submission Date: ${application.submission_date}`);
    doc.moveDown();
    doc.text('Please verify all details carefully before submission.', { italic: true });

    doc.end();

  } catch (error) {
    console.error('Error generating application PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }
};



export default {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentForAccess,
  shareDocument,
  getDepartmentDocuments,
  downloadApplicationPDF
};
