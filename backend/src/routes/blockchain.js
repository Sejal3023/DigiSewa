import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { getTransaction, recordIssuanceOnChain, recordRevocationOnChain } from "../blockchain/blockchainService.js";

const router = Router();

router.post("/recordIssuance", requireAuth, requireRole(["officer", "super_admin"]), async (req, res, next) => {
  try {
    const { licenseId, payloadHash, issuerPubKey, timestamp } = req.body;
    if (!licenseId || !payloadHash || !timestamp) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const chain = await recordIssuanceOnChain({ licenseId, payloadHash, issuerPubKey: issuerPubKey || "server", timestamp });
    res.json(chain);
  } catch (err) {
    next(err);
  }
});

router.post("/recordRevocation", requireAuth, requireRole(["officer", "super_admin"]), async (req, res, next) => {
  try {
    const { licenseId, reason, timestamp } = req.body;
    if (!licenseId || !timestamp) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const chain = await recordRevocationOnChain({ licenseId, reason: reason || "revoked", timestamp });
    res.json(chain);
  } catch (err) {
    next(err);
  }
});

router.get("/tx/:txHash", requireAuth, async (req, res, next) => {
  try {
    const tx = await getTransaction(req.params.txHash);
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

export default router;


