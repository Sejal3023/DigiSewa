import { Router } from "express";
import { query } from "../../postgresClient.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { ethers } from "ethers";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import db from '../db/pg_client.js';

const router = Router();

const TABLE_LICENSES = "licenses";

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE_LICENSES} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "License not found" });
    res.json({ license: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/verify", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM ${TABLE_LICENSES} WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "License not found" });

    const data = result.rows[0];

    // Optional: Fetch on-chain data for cross-check
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const abiPath = path.resolve(__dirname, "../blockchain/contractABI.json");
    const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
    const onchain = await contract.getIssuance(id);

    const onchainHash = onchain[1];
    const valid = onchainHash && onchainHash === data.payload_hash && !onchain[4];
    res.json({ valid, onchain });
  } catch (err) {
    next(err);
  }
});

// GET /licenses/user/certificates - Get authenticated user's licenses/certificates
router.get('/user/certificates', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const result = await db.query(
      `SELECT l.*, a.license_type 
       FROM licenses l 
       JOIN applications a ON l.application_id = a.id 
       WHERE l.user_id = $1 AND l.status = 'active'
       ORDER BY l.issue_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user certificates'
    });
  }
});

import { downloadFromPinata, decryptData } from '../services/pinataService.js';
import { getUserLicenseInfo, canUserApplyForLicense } from '../services/licenseService.js';

// GET /licenses/:licenseNumber/download - Download license PDF
router.get("/:licenseNumber/download", requireAuth, async (req, res) => {
  try {
    const { licenseNumber } = req.params;
    const userId = req.user.id;

    console.log(`📥 Downloading license: ${licenseNumber} for user: ${userId}`);

    // Get license details
    const licenseResult = await db.query(
      `SELECT id, license_number, ipfs_hash, aes_key, blockchain_hash FROM licenses WHERE license_number = $1 AND user_id = $2`,
      [licenseNumber, userId]
    );

    if (!licenseResult.rows.length) {
      return res.status(404).json({ error: "License not found or access denied" });
    }

    const license = licenseResult.rows[0];

    console.log(`License data:`, {
      id: license.id,
      license_number: license.license_number,
      ipfs_hash: license.ipfs_hash,
      aes_key: license.aes_key ? 'present' : 'missing',
      blockchain_hash: license.blockchain_hash
    });

    if (!license.ipfs_hash || !license.aes_key) {
      return res.status(404).json({
        error: "License file not available",
        details: {
          hasIpfsHash: !!license.ipfs_hash,
          hasAesKey: !!license.aes_key
        }
      });
    }

    // Download encrypted PDF from IPFS
    const downloadResult = await downloadFromPinata(license.ipfs_hash);
    if (!downloadResult.success) {
      console.error('Failed to download from IPFS:', downloadResult.error);
      return res.status(500).json({ error: "Failed to retrieve license file" });
    }

    // Decrypt the PDF
    const decryptedPdf = decryptData(downloadResult.data, license.aes_key);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${licenseNumber}.pdf"`);
    res.setHeader('Content-Length', decryptedPdf.length);

    // Send the decrypted PDF
    res.send(decryptedPdf);

  } catch (error) {
    console.error('❌ Error downloading license:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download license',
      error: error.message
    });
  }
});

// GET /licenses/:id/details - Get detailed license information
router.get("/:id/details", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        l.*,
        a.license_type,
        a.application_data,
        a.submission_date,
        u.full_name as user_name,
        u.email as user_email
       FROM licenses l
       JOIN applications a ON l.application_id = a.id
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1 AND l.user_id = $2`,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "License not found or access denied" });
    }

    const license = result.rows[0];

    res.json({
      success: true,
      data: {
        id: license.id,
        license_number: license.license_number,
        service_name: license.service_name,
        issue_date: license.issue_date,
        expiry_date: license.expiry_date,
        status: license.status,
        blockchain_hash: license.blockchain_hash,
        ipfs_hash: license.ipfs_hash,
        application_type: license.license_type,
        application_data: license.application_data,
        submission_date: license.submission_date,
        user_info: {
          name: license.user_name,
          email: license.user_email
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching license details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch license details',
      error: error.message
    });
  }
});

// GET /licenses/user/info - Get user's license information and limits
router.get("/user/info", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting license info for user: ${userId}`);

    const result = await getUserLicenseInfo(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error getting user license info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get license information',
      error: error.message
    });
  }
});

// GET /licenses/check-eligibility/:licenseType - Check if user can apply for a specific license type
router.get("/check-eligibility/:licenseType", requireAuth, async (req, res) => {
  try {
    const { licenseType } = req.params;
    const userId = req.user.userId || req.user.id;

    console.log(`🔍 Checking eligibility for user ${userId} for license ${licenseType}`);

    if (!userId) {
      return res.status(401).json({
        success: false,
        canApply: false,
        reason: "User authentication required"
      });
    }

    const result = await canUserApplyForLicense(userId, licenseType);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        canApply: false,
        reason: result.reason || 'Eligibility check failed'
      });
    }

    res.json({
      success: true,
      canApply: result.canApply,
      reason: result.reason,
      currentLicenseCount: result.currentLicenseCount,
      remainingSlots: result.remainingSlots
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({
      success: false,
      canApply: false,
      reason: 'Internal server error during eligibility check'
    });
  }
});

export default router;
