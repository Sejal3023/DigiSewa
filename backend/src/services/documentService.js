import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import Document from '../models/document.js';
import { uploadToPinata } from './pinataService.js';
import { shareDocumentWithDepartment } from '../blockchain/blockchainService.js';

console.log('DocumentService initialized - AES + IPFS + blockchain integration');

// ---------------- AES Functions ----------------
export const encryptFile = (buffer) => {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encryptedData: Buffer.concat([iv, encrypted, authTag]), aesKey: aesKey.toString('base64'), iv: iv.toString('hex') };
};

export const decryptFile = (encryptedData, aesKeyBase64) => {
  const aesKey = Buffer.from(aesKeyBase64, 'base64');
  const iv = encryptedData.slice(0, 12);
  const authTag = encryptedData.slice(encryptedData.length - 16);
  const encrypted = encryptedData.slice(12, encryptedData.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

// ---------------- Validation ----------------
export const isDocumentSizeAcceptable = (buffer) => buffer.length <= 100 * 1024 * 1024;
export const isDocumentTypeAllowed = (originalName) => {
  const allowed = ['.pdf','.doc','.docx','.jpg','.jpeg','.png','.gif','.txt','.xls','.xlsx','.ppt','.pptx'];
  const ext = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));
  return allowed.includes(ext);
};

// ---------------- Main Processing ----------------
//export const processAndUploadDocument = async (buffer, originalName, metadata) => {
  //try {
    //if (!isDocumentTypeAllowed(originalName)) throw new Error(`File type not allowed: ${originalName}`);
    //if (!isDocumentSizeAcceptable(buffer)) throw new Error(`File too large: ${originalName}`);

    //const { encryptedData, aesKey, iv } = encryptFile(buffer);

    //const pinataResult = await uploadToPinata(encryptedData, `${originalName}.enc`, metadata);
    //if (!pinataResult.success) throw new Error(`Pinata upload failed: ${pinataResult.error}`);

    //const documentHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // ---------------- Main Processing ----------------
export const processAndUploadDocument = async (buffer, originalName, metadata) => {
  try {
    if (!isDocumentTypeAllowed(originalName)) throw new Error(`File type not allowed: ${originalName}`);
    if (!isDocumentSizeAcceptable(buffer)) throw new Error(`File too large: ${originalName}`);

    const { encryptedData, aesKey, iv } = encryptFile(buffer);

    const pinataResult = await uploadToPinata(encryptedData, `${originalName}.enc`, metadata);
    if (!pinataResult.success) throw new Error(`Pinata upload failed: ${pinataResult.error}`);

    const documentHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // ---------------- License Type → Department Name Mapping ----------------
    const LICENSE_TO_DEPARTMENT_NAME = {
      'building-permit': 'Municipal Corporation',
      'fssai-license': 'Food Safety Department',
      'shop-establishment': 'Labour Department',
      'Police Verification Certificate': 'Police Department',
      'income-certificate': 'Revenue Department',
      'vehicle-registration': 'Regional Transport Office'
    };

    let blockchainResult = null;

    // Get license type from metadata (can be departmentId or license_type)
    const licenseType = metadata.departmentId || metadata.license_type;
    const departmentName = LICENSE_TO_DEPARTMENT_NAME[licenseType];

    if (!departmentName) {
      console.warn(`⚠️ Unknown license type: "${licenseType}". Blockchain sync skipped.`);
      console.warn(`   Valid license types: ${Object.keys(LICENSE_TO_DEPARTMENT_NAME).join(', ')}`);
    } else {
      console.log(`📤 Registering document on blockchain`);
      console.log(`   License Type: "${licenseType}"`);
      console.log(`   Department: "${departmentName}"`);

      try {
        blockchainResult = await shareDocumentWithDepartment(
          metadata.applicationId,
          pinataResult.cid,
          documentHash,
          departmentName
        );
        console.log('✅ Document registered on blockchain');
        console.log(`   TX Hash: ${blockchainResult.txHash}`);
      } catch (bcError) {
        console.error('❌ Blockchain registration failed:', bcError.message);
      }
    }

    return {
      cid: pinataResult.cid,
      aesKey,
      iv,
      documentHash,
      blockchainTxHash: blockchainResult?.txHash || null
    };
  } catch (error) {
    console.error('Error in processAndUploadDocument:', error);
    throw error;
  }
};



// --- Map DB department to blockchain department name ---
// ---------------- Department ID → Name mapping (from DB) ---------------- //
// Maps license_type to blockchain department name
//const LICENSE_TO_DEPARTMENT_NAME = {
  //'building-permit': 'Municipal Corporation',
  //'fssai-license': 'Food Safety Department',
  //'shop-establishment': 'Labour Department',
  //'Police Verification Certificate': 'Police Department',
  //'income-certificate': 'Revenue Department',
  //'vehicle-registration': 'Regional Transport Office'
//};

//let blockchainResult = null;

// 🔗 Use license_type to get blockchain department name
//const departmentName = LICENSE_TO_DEPARTMENT_NAME[metadata.license_type];

//if (!departmentName) {
  //console.warn(`⚠️ Unknown license type: ${metadata.license_type}. Blockchain sync skipped.`);
//} else {
  //console.log(`📤 Registering document on blockchain for department: ${departmentName}`);
  //console.log(`Mapped license type ${metadata.license_type} → ${departmentName}`);

  //try {
    //blockchainResult = await shareDocumentWithDepartment(
      //metadata.applicationId,
      //pinataResult.cid,
      //documentHash,
      //departmentName
    //);
    //console.log('✅ Document registered on blockchain, txHash:', blockchainResult.txHash);
  //} catch (bcError) {
    //console.error('❌ Blockchain registration failed:', bcError.message);
  //}
//}

//return {
  //cid: pinataResult.cid,
  //aesKey,
  //iv,
  //documentHash,
  //blockchainTxHash: blockchainResult?.txHash || null
//};
  //} catch (error) {
    //console.error('Error in processAndUploadDocument:', error);
    //throw error;
  //}
//};



// ---------------- Database Wrappers ----------------
export const createDocument = async (docData) => Document.create(docData);
export const getDocumentsByOwner = async (ownerId) => Document.findAll({ where: { owner: ownerId } });
export const getDocumentById = async (id) => Document.findByPk(id);
export const getDocumentByCid = async (cid) => Document.findOne({ where: { cid } });
export const shareDocument = async (documentId, departmentId, accessPolicy, grantedBy) => ({ documentId, departmentId, accessPolicy, grantedBy });
export const getDepartmentDocuments = async (departmentId) => Document.findAll({ where: { departmentId } });
