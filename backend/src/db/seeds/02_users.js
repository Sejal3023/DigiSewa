import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash passwords properly
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('adminpassword', saltRounds);
  const officerPassword = await bcrypt.hash('officerpassword', saltRounds);
  const citizenPassword = await bcrypt.hash('citizenpassword', saltRounds);

  await knex('users').insert([
    { 
      id: uuidv4(), 
      email: 'admin@digisewa.gov.in', 
      full_name: 'Admin User', 
      password_hash: adminPassword, 
      role: 'admin' 
    },
    { 
      id: uuidv4(), 
      email: 'officer1@digisewa.gov.in', 
      full_name: 'Officer One', 
      password_hash: officerPassword, 
      role: 'officer' 
    },
    { 
      id: uuidv4(), 
      email: 'citizen1@digisewa.gov.in', 
      full_name: 'Citizen One', 
      password_hash: citizenPassword, 
      role: 'citizen' 
    },
  ]);
}