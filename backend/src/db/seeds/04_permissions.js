import { v4 as uuidv4 } from 'uuid';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Check if the required tables exist first
  const tableExists = await knex.schema.hasTable('document_permissions');
  const documentsExists = await knex.schema.hasTable('documents');
  const departmentsExists = await knex.schema.hasTable('departments');
  const usersExists = await knex.schema.hasTable('users');

  if (!tableExists || !documentsExists || !departmentsExists || !usersExists) {
    console.log('Required tables do not exist, skipping document_permissions seed');
    return;
  }

  // Deletes ALL existing entries
  await knex('document_permissions').del();

  // 1. GET VALID IDs FROM THE DATABASE
  // Get a sample document
  const sampleDocument = await knex('documents').select('id').first();
  // Get sample departments
  const itDepartment = await knex('departments').where({ name: 'IT Department' }).select('id').first();
  const hrDepartment = await knex('departments').where({ name: 'HR Department' }).select('id').first();
  // Get a valid user who is doing the granting (use email instead of username)
  const adminUser = await knex('users').where({ email: 'admin@digisewa.gov.in' }).select('id').first();

  // Check if we found the necessary records
  if (!sampleDocument || !itDepartment || !hrDepartment || !adminUser) {
    throw new Error('Could not find necessary documents, departments, or users to create permissions. Please run previous seeds first.');
  }

  // 2. INSERT DATA USING THE REAL, QUERIED IDs
  await knex('document_permissions').insert([
    {
      id: uuidv4(),
      document_id: sampleDocument.id,
      department_id: itDepartment.id,
      access_policy: 'view',
      granted_by: adminUser.id,
      granted_at: new Date(),
    },
    {
      id: uuidv4(),
      document_id: sampleDocument.id,
      department_id: hrDepartment.id,
      access_policy: 'edit',
      granted_by: adminUser.id,
      granted_at: new Date(),
    },
  ]);

  console.log('Document permissions seeded successfully');
}