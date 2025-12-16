import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import db from '../db/pg_client.js';
import { uploadToPinata, generateAESKey, encryptData } from './pinataService.js';
import { recordIssuanceOnChain } from '../blockchain/blockchainService.js';

// Ensure backend/generated/licenses folder exists
const LICENSES_FOLDER = path.join("backend", "generated", "licenses");
if (!fs.existsSync(LICENSES_FOLDER)) fs.mkdirSync(LICENSES_FOLDER, { recursive: true });

/**
 * Generate an official government license PDF
 * @param {Object} licenseData - License data including application info, user info, approvals
 * @returns {Promise<Object>} - License generation result with file path and metadata
 */
export async function generateLicensePDF(application, licenseNumber, issueDate, expiryDate) {
  // Fetch user info and approvals needed for licenseData
  const userInfoResult = await db.query('SELECT full_name, email, phone FROM users WHERE id = $1', [application.user_id]);
  const userInfo = userInfoResult.rows[0];

  const approvalsResult = await db.query('SELECT department_name, approval_date FROM approvals WHERE application_id = $1 ORDER BY approval_date DESC', [application.id]);
  const approvals = approvalsResult.rows;

  const serviceName = formatServiceName(application.license_type);

  const licenseData = {
    applicationId: application.id,
    userId: application.user_id,
    licenseNumber,
    serviceName,
    userInfo: {
      id: application.user_id,
      full_name: userInfo.full_name,
      email: userInfo.email,
      phone: userInfo.phone
    },
    applicationData: application.application_data,
    approvals,
    issueDate,
    expiryDate
  };

  return new Promise((resolve, reject) => {
    try {
      const fileName = `license_${licenseNumber}.pdf`;
      const filePath = path.join(LICENSES_FOLDER, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        layout: 'portrait'
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);

          // Encrypt the PDF
          const aesKey = generateAESKey();
          const { encrypted } = encryptData(pdfBuffer, aesKey);

          // Upload to IPFS
          const uploadResult = await uploadToPinata(encrypted, fileName, {
            originalName: fileName,
            originalSize: pdfBuffer.length,
            encrypted: true,
            user_id: licenseData.userId,
            type: 'license'
          });

          if (!uploadResult.success) {
            throw new Error(`IPFS upload failed: ${uploadResult.error}`);
          }

          // Record on blockchain
          const blockchainResult = await recordIssuanceOnChain({
            licenseId: licenseNumber,
            payloadHash: uploadResult.cid,
            issuerPubKey: licenseData.userId,
            timestamp: Math.floor(issueDate.getTime() / 1000)
          });

          resolve({
            success: true,
            filePath: filePath,
            ipfsHash: uploadResult.cid,
            blockchainTxHash: blockchainResult?.txHash || null,
            fileSize: pdfBuffer.length,
            aesKey: aesKey.toString('base64')
          });
        } catch (error) {
          console.error('Error processing generated PDF:', error);
          reject(error);
        }
      });

      doc.on('error', reject);

      // Generate the license PDF content
      generateLicenseContent(doc, {
        licenseNumber,
        serviceName,
        userInfo,
        applicationData: licenseData.applicationData,
        approvals,
        issueDate,
        expiryDate
      });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate the license PDF content with official styling
 */
function generateLicenseContent(doc, data) {
  const { licenseNumber, serviceName, userInfo, applicationData = {}, approvals, issueDate, expiryDate } = data;

  let currentY = 50; // Start position after header

  // Header with Government Emblem
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor("#1a365d")
    .text("GOVERNMENT OF INDIA", { align: "center" });
  currentY += 30;

  doc
    .fontSize(20)
    .text("DIGITAL LICENSE CERTIFICATE", { align: "center" });
  currentY += 40;

  // Decorative border
  doc
    .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
    .lineWidth(2)
    .stroke("#1a365d");

  // License Number
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("LICENSE NUMBER:", { align: "center" });
  currentY += 25;

  doc
    .fontSize(18)
    .text(licenseNumber, { align: "center" });
  currentY += 40;

  // Service Information Section
  const serviceHeight = 40;
  doc
    .rect(50, currentY, 500, serviceHeight)
    .fill("#f8f9fa")
    .stroke("#dee2e6");

  doc
    .fillColor("#000")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("SERVICE TYPE", 60, currentY + 5);

  doc
    .font("Helvetica")
    .text(serviceName.toUpperCase(), 200, currentY + 5);

  currentY += serviceHeight + 10;

  // Licensee Information Section
  const licenseeHeight = 90;
  doc
    .rect(50, currentY, 500, licenseeHeight)
    .fill("#f8f9fa")
    .stroke("#dee2e6");

  doc
    .fillColor("#000")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("LICENSEE INFORMATION", 60, currentY + 5);

  doc
    .font("Helvetica")
    .fontSize(11)
    .text(`Full Name: ${userInfo.full_name}`, 60, currentY + 25)
    .text(`Email: ${userInfo.email}`, 60, currentY + 40)
    .text(`Phone: ${userInfo.phone}`, 60, currentY + 55)
    .text(`User ID: ${userInfo.id}`, 60, currentY + 70);

  currentY += licenseeHeight + 10;

  // License Details Section
  const licenseDetailsHeight = 70;
  doc
    .rect(50, currentY, 500, licenseDetailsHeight)
    .fill("#f8f9fa")
    .stroke("#dee2e6");

  doc
    .fillColor("#000")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("LICENSE DETAILS", 60, currentY + 5);

  doc
    .font("Helvetica")
    .fontSize(11)
    .text(`Issue Date: ${new Date(issueDate).toLocaleDateString('en-IN')}`, 60, currentY + 25)
    .text(`Expiry Date: ${new Date(expiryDate).toLocaleDateString('en-IN')}`, 60, currentY + 40)
    .text(`Status: ACTIVE`, 60, currentY + 55);

  currentY += licenseDetailsHeight + 10;

  // Application Data Summary
  if (applicationData && typeof applicationData === 'object' && Object.keys(applicationData).length > 0) {
    const appDataHeight = Math.min(120, 40 + (Object.keys(applicationData).length * 15));
    doc
      .rect(50, currentY, 500, appDataHeight)
      .fill("#f8f9fa")
      .stroke("#dee2e6");

    doc
      .fillColor("#000")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("APPLICATION SUMMARY", 60, currentY + 5);

    doc
      .font("Helvetica")
      .fontSize(10);

    let textY = currentY + 25;
    Object.entries(applicationData).slice(0, 5).forEach(([key, value]) => {
      if (typeof value === "object") value = JSON.stringify(value);
      if (textY > currentY + appDataHeight - 20) return; // Prevent overflow

      doc.text(`${key.replace(/_/g, " ")}: ${String(value).substring(0, 50)}`, 60, textY);
      textY += 15;
    });

    currentY += appDataHeight + 10;
  }

  // Approval Information
  if (approvals && approvals.length > 0) {
    const approvalHeight = 70;
    doc
      .rect(50, currentY, 500, approvalHeight)
      .fill("#f8f9fa")
      .stroke("#dee2e6");

    doc
      .fillColor("#000")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("APPROVAL INFORMATION", 60, currentY + 5);

    doc
      .font("Helvetica")
      .fontSize(10);

    let approvalY = currentY + 25;
    approvals.slice(0, 2).forEach(approval => {
      doc.text(`Approved by: ${approval.department_name} Department`, 60, approvalY);
      approvalY += 15;
      doc.text(`Approval Date: ${new Date(approval.approval_date).toLocaleDateString('en-IN')}`, 60, approvalY);
      approvalY += 15;
    });

    currentY += approvalHeight + 10;
  }

  // Digital Signature Section
  const signatureHeight = 50;
  doc
    .rect(50, currentY, 500, signatureHeight)
    .fill("#fff")
    .stroke("#dee2e6");

  doc
    .fillColor("#000")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("DIGITAL SIGNATURE", 60, currentY + 5);

  doc
    .font("Helvetica")
    .fontSize(9)
    .text("This license is digitally signed and verified on the blockchain.", 60, currentY + 20)
    .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 60, currentY + 32);

  currentY += signatureHeight + 20;

  // Footer
  const footerY = doc.page.height - 80;
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#666")
    .text("This is an official government document. Any tampering or forgery is punishable by law.", 50, footerY, {
      width: 500,
      align: "center"
    })
    .text("DigiSewa - Government Digital Services Platform", 50, footerY + 20, {
      width: 500,
      align: "center"
    });

  // Blockchain verification note
  doc
    .fontSize(9)
    .text("Blockchain Verified ✓", 450, footerY + 40);
}

/**
 * Generate a unique license number
 * @param {string} serviceType - The service type
 * @returns {string} - Unique license number
 */
export function generateLicenseNumber(serviceType) {
  const prefix = serviceType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create license record in database
 * @param {Object} licenseData - License data
 * @returns {Promise<Object>} - Created license record
 */
export async function createLicenseRecord(licenseData) {
  const {
    applicationId,
    userId,
    licenseNumber,
    serviceName,
    issueDate,
    expiryDate,
    ipfsHash,
    blockchainTxHash,
    pdfFilePath,
    downloadUrl,
    aesKey
  } = licenseData;

  const result = await db.query(
    `INSERT INTO licenses (
      application_id,
      user_id,
      license_number,
      service_name,
      issue_date,
      expiry_date,
      ipfs_hash,
      blockchain_hash,
      pdf_file_path,
      download_url,
      aes_key,
      status,
      license_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      applicationId,
      userId,
      licenseNumber,
      serviceName,
      issueDate,
      expiryDate,
      ipfsHash,
      blockchainTxHash,
      pdfFilePath,
      downloadUrl,
      aesKey,
      'active',
      JSON.stringify(licenseData)
    ]
  );

  return result.rows[0];
}

/**
 * Check if application is fully approved by all required departments
 * @param {string} applicationId - Application ID
 * @returns {Promise<boolean>} - Whether application is fully approved
 */
export async function isApplicationFullyApproved(applicationId) {
  // Get application details
  const appResult = await db.query(
    `SELECT license_type FROM applications WHERE id = $1`,
    [applicationId]
  );

  if (!appResult.rows.length) return false;

  const licenseType = appResult.rows[0].license_type;

  // Define required approvals based on license type
  const requiredDepartments = getRequiredDepartments(licenseType);

  // Get actual approvals
  const approvalResult = await db.query(
    `SELECT department_name FROM approvals WHERE application_id = $1 AND approval_status = 'approved'`,
    [applicationId]
  );

  const approvedDepartments = approvalResult.rows.map(row => row.department_name);

  // Check if all required departments have approved
  return requiredDepartments.every(dept => approvedDepartments.includes(dept));
}

/**
 * Get required departments for a license type
 * @param {string} licenseType - License type
 * @returns {string[]} - Array of required department names
 */
function getRequiredDepartments(licenseType) {
  const departmentMap = {
    'building-permit': ['Municipal Corporation'],
    'vehicle-registration': ['Regional Transport Office'],
    'drivers-license': ['Regional Transport Office'],
    'fssai-license': ['Food Safety Department'],
    'shop-establishment': ['Labour Department'],
    'income-certificate': ['Revenue Department'],
    'police-verification': ['Police Department']
  };

  return departmentMap[licenseType] || [];
}

/**
 * Process license generation after final approval
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object>} - License generation result
 */
export async function processLicenseGeneration(applicationId) {
  try {
    console.log(`🔄 Processing license generation for application: ${applicationId}`);

    // Check if license already exists for this application FIRST
    const existingLicense = await db.query(
      `SELECT id, license_number FROM licenses WHERE application_id = $1`,
      [applicationId]
    );

    if (existingLicense.rows.length > 0) {
      console.log(`⚠️ License already exists for this application: ${existingLicense.rows[0].license_number}`);
      return {
        success: true,
        license: existingLicense.rows[0],
        existing: true
      };
    }

    // Then check if fully approved
    const isFullyApproved = await isApplicationFullyApproved(applicationId);
    if (!isFullyApproved) {
      throw new Error('Application is not fully approved by all required departments');
    }

    // Get application and user data
    const appResult = await db.query(
      `SELECT a.*, u.full_name, u.email, u.phone
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [applicationId]
    );

    if (!appResult.rows.length) {
      throw new Error('Application not found');
    }

    const application = appResult.rows[0];

    // Get the department for this license type
    const requiredDepartments = getRequiredDepartments(application.license_type);
    if (requiredDepartments.length === 0) {
      throw new Error(`No department mapping found for license type: ${application.license_type}`);
    }
    const departmentName = requiredDepartments[0]; // Each license type maps to exactly one department

    // Check if user already has a license for this department
    const existingDepartmentLicense = await db.query(
      `SELECT l.id, l.license_number, l.service_name, l.issue_date
       FROM licenses l
       WHERE l.user_id = $1 AND l.service_name = $2 AND l.status = 'active'`,
      [application.user_id, formatServiceName(application.license_type)]
    );

    if (existingDepartmentLicense.rows.length > 0) {
      const existing = existingDepartmentLicense.rows[0];
      console.log(`⚠️ User already has an active license for this department: ${existing.license_number} (issued: ${existing.issue_date})`);
      throw new Error(`You already have an active license for ${departmentName} Department. Each user can hold only one license per department.`);
    }

    // Check total number of active licenses for this user (should not exceed 6)
    const userLicenseCount = await db.query(
      `SELECT COUNT(*) as count FROM licenses WHERE user_id = $1 AND status = 'active'`,
      [application.user_id]
    );

    const currentLicenseCount = parseInt(userLicenseCount.rows[0].count);
    if (currentLicenseCount >= 6) {
      console.log(`⚠️ User already has ${currentLicenseCount} active licenses, maximum allowed is 6`);
      throw new Error(`You have reached the maximum limit of 6 licenses per user. You currently have ${currentLicenseCount} active licenses.`);
    }

    // Get approvals
    const approvalsResult = await db.query(
      `SELECT * FROM approvals WHERE application_id = $1 ORDER BY approval_date DESC`,
      [applicationId]
    );

    // Generate license data
    const licenseNumber = generateLicenseNumber(application.license_type);
    const serviceName = formatServiceName(application.license_type);
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

    const licenseData = {
      applicationId,
      userId: application.user_id,
      licenseNumber,
      serviceName,
      userInfo: {
        id: application.user_id,
        full_name: application.full_name,
        email: application.email,
        phone: application.phone
      },
      applicationData: application.application_data || {},
      approvals: approvalsResult.rows,
      issueDate,
      expiryDate
    };

    // Generate PDF
    console.log('📄 Generating license PDF...');
    const pdfResult = await generateLicensePDF(application, licenseNumber, issueDate, expiryDate);

    // Create license record
    const licenseRecord = await createLicenseRecord({
      ...licenseData,
      ipfsHash: pdfResult.ipfsHash,
      blockchainTxHash: pdfResult.blockchainTxHash,
      pdfFilePath: pdfResult.filePath,
      downloadUrl: `/api/licenses/${licenseNumber}/download`,
      aesKey: pdfResult.aesKey
    });

    console.log(`✅ License generated successfully: ${licenseNumber} (${currentLicenseCount + 1}/6 licenses for user)`);

    return {
      success: true,
      license: licenseRecord,
      pdfResult
    };

  } catch (error) {
    console.error('❌ License generation failed:', error);
    throw error;
  }
}

/**
 * Get user's current license information
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User's license information
 */
export async function getUserLicenseInfo(userId) {
  try {
    // Get all active licenses for the user
    const licensesResult = await db.query(
      `SELECT
        l.id,
        l.license_number,
        l.service_name,
        l.issue_date,
        l.expiry_date,
        l.status,
        a.license_type
       FROM licenses l
       JOIN applications a ON l.application_id = a.id
       WHERE l.user_id = $1 AND l.status = 'active'
       ORDER BY l.issue_date DESC`,
      [userId]
    );

    const licenses = licensesResult.rows;
    const licenseCount = licenses.length;

    // Get department mapping to show which departments the user has licenses for
    const departmentMap = {
      'Building Permit License': 'Municipal Corporation',
      'Vehicle Registration Certificate': 'Regional Transport Office',
      'Driver\'s License': 'Regional Transport Office',
      'Food Safety License (FSSAI)': 'Food Safety Department',
      'Shop & Establishment License': 'Labour Department',
      'Income Certificate': 'Revenue Department',
      'Police Verification Certificate': 'Police Department'
    };

    // Group licenses by department
    const licensesByDepartment = {};
    licenses.forEach(license => {
      const department = departmentMap[license.service_name] || 'Unknown Department';
      if (!licensesByDepartment[department]) {
        licensesByDepartment[department] = [];
      }
      licensesByDepartment[department].push(license);
    });

    // Get all available departments
    const allDepartments = [
      'Municipal Corporation',
      'Regional Transport Office',
      'Food Safety Department',
      'Labour Department',
      'Revenue Department',
      'Police Department'
    ];

    // Find departments where user doesn't have a license
    const availableDepartments = allDepartments.filter(dept => !licensesByDepartment[dept]);

    return {
      success: true,
      data: {
        totalLicenses: licenseCount,
        maxAllowed: 6,
        remainingSlots: Math.max(0, 6 - licenseCount),
        licenses: licenses,
        licensesByDepartment: licensesByDepartment,
        availableDepartments: availableDepartments,
        hasReachedLimit: licenseCount >= 6
      }
    };

  } catch (error) {
    console.error('❌ Error getting user license info:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user can apply for a specific license type
 * @param {string} userId - User ID
 * @param {string} licenseType - License type to check
 * @returns {Promise<Object>} - Check result
 */
export async function canUserApplyForLicense(userId, licenseType) {
  try {
    console.log(`🔍 Checking eligibility for user ${userId} to apply for ${licenseType}`);

    // Get the department for this license type
    const requiredDepartments = getRequiredDepartments(licenseType);
    if (requiredDepartments.length === 0) {
      console.log(`❌ Invalid license type: ${licenseType}`);
      return {
        success: false,
        canApply: false,
        reason: `Invalid license type: ${licenseType}`
      };
    }

    const departmentName = requiredDepartments[0];
    const serviceName = formatServiceName(licenseType);

    console.log(`📋 License type: ${licenseType}, Department: ${departmentName}, Service name: ${serviceName}`);

    // ✅ CRITICAL FIX: Only check for ACTIVE licenses (approved ones)
    const existingLicense = await db.query(
      `SELECT l.id, l.license_number, l.issue_date, l.status
       FROM licenses l
       WHERE l.user_id = $1 AND l.service_name = $2 AND l.status = 'active'`,
      [userId, serviceName]
    );

    if (existingLicense.rows.length > 0) {
      console.log(`⚠️ User already has ACTIVE license for this service: ${existingLicense.rows[0].license_number}`);
      return {
        success: true,
        canApply: false,
        reason: `You already have an active ${serviceName} from ${departmentName} Department.`,
        existingLicense: existingLicense.rows[0]
      };
    }

    // ✅ Check for PENDING applications for the same license type
    const pendingApplication = await db.query(
      `SELECT id, status, created_at
       FROM applications
       WHERE user_id = $1 AND license_type = $2 AND status IN ('pending', 'processing')`,
      [userId, licenseType]
    );

    if (pendingApplication.rows.length > 0) {
      console.log(`⚠️ User already has a pending application for this license type`);
      return {
        success: true,
        canApply: false,
        reason: `You already have a pending application for ${serviceName}. Please wait for it to be processed.`
      };
    }

    // Check total ACTIVE license count (should not exceed 6)
    const userLicenseCount = await db.query(
      `SELECT COUNT(*) as count FROM licenses WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const currentCount = parseInt(userLicenseCount.rows[0].count);
    console.log(`📊 User has ${currentCount} active licenses (max: 6)`);

    if (currentCount >= 6) {
      console.log(`⚠️ User has reached license limit: ${currentCount}/6`);
      return {
        success: true,
        canApply: false,
        reason: `You have reached the maximum limit of 6 licenses per user. You currently have ${currentCount} active licenses.`,
        currentLicenseCount: currentCount
      };
    }

    console.log(`✅ User can apply for ${licenseType} (${currentCount}/6 licenses used)`);
    return {
      success: true,
      canApply: true,
      currentLicenseCount: currentCount,
      remainingSlots: 6 - currentCount
    };

  } catch (error) {
    console.error('❌ Error checking if user can apply for license:', error);
    return {
      success: false,
      canApply: false,
      reason: error.message
    };
  }
}

/**
 * Format service name for display
 * @param {string} licenseType - License type
 * @returns {string} - Formatted service name
 */
function formatServiceName(licenseType) {
  const nameMap = {
    'building-permit': 'Building Permit License',
    'vehicle-registration': 'Vehicle Registration Certificate',
    'drivers-license': 'Driver\'s License',
    'fssai-license': 'Food Safety License (FSSAI)',
    'shop-establishment': 'Shop & Establishment License',
    'income-certificate': 'Income Certificate',
    'police-verification': 'Police Verification Certificate'
  };

  return nameMap[licenseType] || licenseType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
