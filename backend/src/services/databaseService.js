import { postgresPool, query } from '../postgresClient.js';
import { databaseConfig } from '../../config/database.js';

class DatabaseService {
  constructor() {
    this.connectionType = 'PostgreSQL Direct';
  }

  // Generic query method for PostgreSQL
  async query(sql, params = []) {
    try {
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // User operations
  async createUser(userData) {
    const sql = `
      INSERT INTO users (email, full_name, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(sql, [
      userData.email,
      userData.full_name,
      userData.phone,
      userData.password_hash,
      userData.role || 'citizen'
    ]);
    return result[0];
  }

  async getUserByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result[0];
  }

  // Application operations
  async createApplication(applicationData) {
    const sql = `
      INSERT INTO applications (user_id, license_type, status, application_data)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await query(sql, [
      applicationData.user_id,
      applicationData.license_type,
      applicationData.status || 'pending',
      JSON.stringify(applicationData.application_data)
    ]);
    return result[0];
  }

  async getUserApplications(userId) {
    const sql = `
      SELECT a.*, l.license_number, l.expiry_date
      FROM applications a
      LEFT JOIN licenses l ON a.id = l.application_id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;
    return await query(sql, [userId]);
  }

  // License operations
  async createLicense(licenseData) {
    const sql = `
      INSERT INTO licenses (application_id, license_number, expiry_date, blockchain_hash, license_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(sql, [
      licenseData.application_id,
      licenseData.license_number,
      licenseData.expiry_date,
      licenseData.blockchain_hash,
      JSON.stringify(licenseData.license_data)
    ]);
    return result[0];
  }

  // Audit logging
  async logAudit(auditData) {
    const sql = `
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await query(sql, [
      auditData.user_id,
      auditData.action,
      auditData.table_name,
      auditData.record_id,
      JSON.stringify(auditData.old_values),
      JSON.stringify(auditData.new_values),
      auditData.ip_address,
      auditData.user_agent
    ]);
  }

  // Health check
  async healthCheck() {
    try {
      const result = await query('SELECT 1 as health');
      return { status: 'healthy', database: 'PostgreSQL Direct', result: result[0] };
    } catch (error) {
      return { status: 'unhealthy', database: this.connectionType, error: error.message };
    }
  }

  // Get connection info
  getConnectionInfo() {
    return {
      type: this.connectionType,
      config: databaseConfig.postgres
    };
  }
}

export default new DatabaseService();
