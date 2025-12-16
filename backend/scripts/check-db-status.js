import 'dotenv/config';
import { getDatabaseStatus } from '../config/database.js';

console.log('Current Database Configuration:');
console.log(getDatabaseStatus());

