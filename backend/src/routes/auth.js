import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/authMiddleware.js";
import { signerAddress } from "../blockchain/blockchainService.js";
import db from '../db/pg_client.js';

const router = Router();

// User registration
router.post("/register", async (req, res) => {
  try {
    const { email, full_name, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      'INSERT INTO users (email, full_name, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role',
      [email, full_name, phone, passwordHash, 'citizen']
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        phone: user.phone 
      },
      process.env.JWT_SECRET || 'digisewa-secret-key-2024',
      { expiresIn: '24h' }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/profile", requireAuth, async (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    email: user.email,
    role: user.role || "citizen",
    phone: user.phone,
    metadata: user.user_metadata || {},
    issuerAddress: signerAddress,
  });
});

export default router;