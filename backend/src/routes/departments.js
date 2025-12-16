import express from 'express';
const router = express.Router();
import * as departmentService from '../services/departmentService.js'; // Fixed import
import { requireAuth } from '../middleware/authMiddleware.js';

// Apply authMiddleware to all department routes
router.use(requireAuth);

// Get all departments
router.get('/', async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.json(departments);
  } catch (error) {
    next(error);
  }
});

// Get a specific department by ID
router.get('/:id', async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json(department);
  } catch (error) {
    next(error);
  }
});

export default router;