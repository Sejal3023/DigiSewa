import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/pg_client.js';
import databaseConfig from '../../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'digisewa-admin-secret-key-2024';

export class AdminAuthService {
  // Verify admin credentials - ✅ UPDATED to use unified users table
  static async verifyCredentials(email, password, adminCode) {
    try {
      console.log('🔍 Admin login attempt:', { email, adminCode });

      // ===================================================================
      // UNIFIED AUTHENTICATION: Check users table for admin/officer roles
      // ===================================================================

      // Find user with admin or officer role
      const userRows = await db.query(
        `SELECT u.*, o.badge_number, o.permissions as officer_permissions
         FROM users u
         LEFT JOIN officers o ON u.id = o.user_id
         WHERE u.email = $1 AND u.is_active = true AND u.role IN ('officer', 'super_admin')
         LIMIT 1`,
        [email]
      );

      const user = userRows?.rows?.[0] || userRows?.[0];
      console.log('👤 User found:', user ? { id: user.id, email: user.email, role: user.role } : 'No user found');

      if (!user) {
        return { success: false, error: 'Invalid admin credentials' };
      }

      // ✅ ADD PASSWORD HASH VALIDATION
      console.log('🔐 Password verification details:', {
        inputLength: password.length,
        hashLength: user.password_hash?.length,
        hashPrefix: user.password_hash?.substring(0, 10),
        isBcryptHash: user.password_hash?.startsWith('$2b$') || user.password_hash?.startsWith('$2a$')
      });

      // ✅ CHECK IF HASH IS VALID BCRYPT FORMAT
      if (!user.password_hash || user.password_hash.length !== 60 ||
          (!user.password_hash.startsWith('$2b$') && !user.password_hash.startsWith('$2a$'))) {
        console.error('❌ INVALID HASH FORMAT - not a bcrypt hash');
        return { success: false, error: 'System error: Invalid password format' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      console.log('🔐 Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        return { success: false, error: 'Invalid admin credentials' };
      }

      // Verify access code based on role
      if (user.role === 'officer') {
        // For officers, check their access code
        if (user.access_code !== adminCode) {
          return { success: false, error: 'Invalid department access code' };
        }
      } else if (user.role === 'super_admin') {
        // For super admins, verify access code from admin_access_codes table
        const accessRows = await db.query(
          'SELECT * FROM admin_access_codes WHERE code = $1 AND is_active = true LIMIT 1',
          [adminCode]
        );
        const accessCode = accessRows?.rows?.[0] || accessRows?.[0];
        if (!accessCode) {
          return { success: false, error: 'Invalid or expired admin access code' };
        }
        if (accessCode.expires_at && new Date() > new Date(accessCode.expires_at)) {
          return { success: false, error: 'Admin access code has expired' };
        }
      }

      // Update last login
      await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          department: user.department,
          badgeNumber: user.badge_number,
          permissions: user.officer_permissions || user.permissions || null
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Create session for super admins
      if (user.role === 'super_admin') {
        await db.query(
          'INSERT INTO admin_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)',
          [user.id, token, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]
        );
      }

      // Return unified user format
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          department: user.department,
          badge_number: user.badge_number,
          permissions: user.officer_permissions || user.permissions || null
        },
        token
      };

    } catch (error) {
      console.error('Admin auth error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // ✅ ALL OTHER METHODS STAY EXACTLY THE SAME - NO CHANGES

  // Verify admin token
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // For super admins, check session
      if (decoded.role === 'super_admin') {
        const sessionRows = await db.query(
          'SELECT 1 FROM admin_sessions WHERE session_token = $1 AND expires_at > NOW() LIMIT 1',
          [token]
        );
        const session = sessionRows?.rows?.[0] || sessionRows?.[0];
        if (!session) {
          return { valid: false, error: 'Invalid or expired session' };
        }
      }

      return { valid: true, user: decoded };

    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  // Get admin user by ID
  static async getAdminById(userId) {
    try {
      const result = await db.query(
        `SELECT u.*, o.badge_number, o.permissions as officer_permissions
         FROM users u
         LEFT JOIN officers o ON u.id = o.user_id
         WHERE u.id = $1 AND u.is_active = true AND u.role IN ('officer', 'super_admin')`,
        [userId]
      );
      const user = result?.rows?.[0] || result?.[0];
      if (!user) return { success: false, error: 'Admin user not found' };
      return { success: true, admin: user };
    } catch (error) {
      console.error('Get admin error:', error);
      return { success: false, error: 'Failed to get admin user' };
    }
  }

  // Logout admin (invalidate session)
  static async logout(token) {
    try {
      await db.query('DELETE FROM admin_sessions WHERE session_token = $1', [token]);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  // Get all admin users (for super admin only)
  static async getAllAdmins() {
    try {
      const result = await db.query(
        `SELECT
          u.id,
          u.email,
          u.full_name,
          u.role,
          u.department,
          u.is_active,
          u.last_login,
          u.created_at,
          o.badge_number
         FROM users u
         LEFT JOIN officers o ON u.id = o.user_id
         WHERE u.role IN ('officer', 'super_admin')
         ORDER BY u.created_at DESC`
      );
      return { success: true, admins: result.rows || result };
    } catch (error) {
      console.error('Get all admins error:', error);
      return { success: false, error: 'Failed to fetch admin users' };
    }
  }

  // Create new admin user (for super admin only)
  static async createAdmin(adminData, createdBy) {
    try {
      if (createdBy.role !== 'super_admin') {
        return { success: false, error: 'Insufficient permissions' };
      }

      // ✅ ADD PASSWORD VALIDATION
      if (!adminData.password || adminData.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }

      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      // ✅ ADD HASH VALIDATION
      console.log('🔐 Generated hash details:', {
        length: hashedPassword.length,
        prefix: hashedPassword.substring(0, 7),
        isBcrypt: hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')
      });

      if (hashedPassword.length !== 60) {
        throw new Error('Invalid bcrypt hash generated');
      }

      // Insert into users table
      const result = await db.query(
        `INSERT INTO users (email, full_name, password_hash, role, department, employee_id, access_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, full_name, role, department`,
        [
          adminData.email,
          adminData.fullName,
          hashedPassword,
          adminData.role,
          adminData.department,
          adminData.employeeId || null,
          adminData.accessCode || null
        ]
      );

      const newAdmin = result.rows?.[0] || result[0];

      // If creating an officer, also insert into officers table
      if (adminData.role === 'officer') {
        await db.query(
          `INSERT INTO officers (user_id, department, badge_number, permissions)
           VALUES ($1, $2, $3, $4)`,
          [
            newAdmin.id,
            adminData.department,
            adminData.badgeNumber || null,
            adminData.permissions || null
          ]
        );
      }

      return { success: true, admin: newAdmin };
    } catch (error) {
      console.error('Create admin error:', error);
      return { success: false, error: 'Failed to create admin user' };
    }
  }
}
