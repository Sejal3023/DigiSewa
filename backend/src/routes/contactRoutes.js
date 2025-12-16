import express from 'express';
import db from '../db/pg_client.js'; // your PostgreSQL client
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const id = uuidv4();
    const createdAt = new Date();
    const updatedAt = new Date();

    await db.query(
      `INSERT INTO contact_messages (id, first_name, last_name, email, subject, message, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'new',$7,$8)`,
      [id, firstName, lastName, email, subject, message, createdAt, updatedAt]
    );

    // ✅ Send a proper JSON response
    res.status(200).json({ success: true, message: 'Contact message submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

export default router;
