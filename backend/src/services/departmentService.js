import { v4 as uuidv4 } from 'uuid';
import { query } from '../../postgresClient.js'; // Use postgresClient instead

// Get all departments
export const getAllDepartments = async () => {
  try {
    const result = await query('SELECT * FROM departments');
    const departments = result.rows || result;
    return departments.map(dept => ({
      id: dept.id,
      name: dept.name,
    }));
  } catch (error) {
    console.error('Error getting all departments:', error);
    throw new Error('Failed to retrieve departments');
  }
};

// Get a department by ID
export const getDepartmentById = async (id) => {
  try {
    const result = await query('SELECT * FROM departments WHERE id = $1', [id]);
    const department = (result.rows && result.rows[0]) || result[0];
    if (!department) {
      return null;
    }
    return {
      id: department.id,
      name: department.name,
    };
  } catch (error) {
    console.error('Error getting department by ID:', error);
    throw new Error('Failed to retrieve department');
  }
};

// Create a new department (for seeding or admin use)
export const createDepartment = async (name) => {
  const id = uuidv4();
  try {
    await query('INSERT INTO departments (id, name) VALUES ($1, $2)', [id, name]);
    return { id, name };
  } catch (error) {
    console.error('Error creating department:', error);
    throw new Error('Failed to create department');
  }
};