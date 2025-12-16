import { Router } from "express";
import { requireAuth } from '../middleware/authMiddleware.js';
import db from '../db/pg_client.js';

const router = Router();

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================
router.get('/user', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    console.log(`📥 Fetching notifications for user: ${userId}`);

    // Get notifications for the user (using receiver_id instead of user_id)
    const notifications = await db.query(
      `SELECT
        id,
        title,
        message,
        type,
        CASE WHEN status = 'read' THEN true ELSE false END as read,
        application_id as related_application_id,
        created_at
      FROM notifications
      WHERE receiver_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const totalResult = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE receiver_id = $1 AND is_deleted = false',
      [userId]
    );

    const total = parseInt(totalResult.rows[0].count);

    console.log(`✅ Found ${notifications.rows.length} notifications for user ${userId}`);

    res.json({
      success: true,
      data: notifications.rows,
      total,
      limit: parseInt(limit.toString()),
      offset: parseInt(offset.toString())
    });

  } catch (error) {
    console.error('❌ Error fetching notifications:', error);

    // Handle case where notifications table doesn't exist yet
    if (error.message && error.message.includes('relation "notifications" does not exist')) {
      console.log('📋 Notifications table does not exist yet, returning empty array');
      res.json({
        success: true,
        data: [],
        total: 0,
        limit: parseInt(limit.toString()),
        offset: parseInt(offset.toString())
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📥 Marking notification ${id} as read for user: ${userId}`);

    // Update notification as read (only if it belongs to the user)
    const result = await db.query(
      `UPDATE notifications
       SET status = 'read', read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND receiver_id = $2 AND is_deleted = false
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or access denied'
      });
    }

    console.log(`✅ Notification ${id} marked as read`);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);

    // Handle case where notifications table doesn't exist yet
    if (error.message && error.message.includes('relation "notifications" does not exist')) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or access denied'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📥 Marking all notifications as read for user: ${userId}`);

    // Update all unread notifications as read
    const result = await db.query(
      `UPDATE notifications
       SET status = 'read', read_at = CURRENT_TIMESTAMP
       WHERE receiver_id = $1 AND status = 'unread' AND is_deleted = false
       RETURNING *`,
      [userId]
    );

    console.log(`✅ Marked ${result.rows.length} notifications as read`);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);

    // Handle case where notifications table doesn't exist yet
    if (error.message && error.message.includes('relation "notifications" does not exist')) {
      console.log('📋 Notifications table does not exist yet, no notifications to mark as read');
      res.json({
        success: true,
        data: [],
        count: 0
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ==========================================
// CREATE NOTIFICATION (for internal use)
// ==========================================
router.post('/', requireAuth, async (req, res) => {
  try {
    const { userId, title, message, type = 'info', relatedApplicationId } = req.body;

    // Only allow admins to create notifications
    if (req.user.role !== 'super_admin' && req.user.role !== 'officer') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    console.log(`📥 Creating notification for user: ${userId}`);

    const result = await db.query(
      `INSERT INTO notifications (receiver_id, title, message, type, application_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, message, type, relatedApplicationId]
    );

    console.log(`✅ Notification created with ID: ${result.rows[0].id}`);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creating notification:', error);

    // Handle case where notifications table doesn't exist yet
    if (error.message && error.message.includes('relation "notifications" does not exist')) {
      return res.status(500).json({
        success: false,
        error: 'Notifications system not available yet'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ==========================================
// DELETE NOTIFICATION
// ==========================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📥 Deleting notification ${id} for user: ${userId}`);

    // Soft delete notification (only if it belongs to the user)
    const result = await db.query(
      'UPDATE notifications SET is_deleted = true WHERE id = $1 AND receiver_id = $2 AND is_deleted = false RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or access denied'
      });
    }

    console.log(`✅ Notification ${id} deleted`);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);

    // Handle case where notifications table doesn't exist yet
    if (error.message && error.message.includes('relation "notifications" does not exist')) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or access denied'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;
