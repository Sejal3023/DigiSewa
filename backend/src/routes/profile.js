import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import db from '../db/pg_client.js';

const router = Router();

// GET /profile - Get user profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT 
        id, email, full_name, phone, role, 
        created_at, updated_at
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];

   // Get user statistics
const statsResult = await db.query(
  `SELECT 
    COUNT(*)::integer as total_applications,
    COUNT(*) FILTER (WHERE status = 'approved')::integer as approved,
    COUNT(*) FILTER (WHERE status = 'pending')::integer as pending,
    COUNT(*) FILTER (WHERE status = 'processing')::integer as processing
   FROM applications 
   WHERE user_id = $1`,
  [userId]
);

console.log('📊 Stats for user:', userId, statsResult.rows[0]); // ✅ Debug log

res.json({
  success: true,
  data: {
    profile: user,
    stats: statsResult.rows[0] || {
      total_applications: 0,
      approved: 0,
      pending: 0,
      processing: 0
    }
  }
});
 } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});


// PUT /profile - Update user profile
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, address, city, state, pincode } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, address = $3, city = $4, state = $5, pincode = $6, updated_at = NOW()
       WHERE id = $7 
       RETURNING id, email, full_name, phone, address, city, state, pincode, role, updated_at`,
      [full_name, phone, address, city, state, pincode, userId]
    );

    // Log activity
    await logUserActivity(userId, 'PROFILE_UPDATE', 'Updated profile information', req);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});


// GET /profile/activity - Get user activity log
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT action, description, ip_address, created_at
       FROM user_activity 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

// Helper function to log activity (export this)
export async function logUserActivity(userId, action, description, req) {
  try {
    await db.query(
      `INSERT INTO user_activity (user_id, action, description, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId, 
        action, 
        description, 
        req.ip || req.connection.remoteAddress, 
        req.headers['user-agent']
      ]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}


export default router;
