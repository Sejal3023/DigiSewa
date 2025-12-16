import { Router } from "express";
import { query } from "../../postgresClient.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

const TABLE_APPLICATIONS = "applications";

// GET /officer/applications - pending applications
router.get("/applications", requireAuth, requireRole(["officer", "super_admin"]), async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM ${TABLE_APPLICATIONS} WHERE status = $1 ORDER BY created_at ASC`,
      ["pending"]
    );
    if (result.error) return res.status(500).json({ error: result.error.message });
    res.json({ applications: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;


