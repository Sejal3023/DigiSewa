import { v4 as uuidv4 } from 'uuid';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('departments').del()
  await knex('departments').insert([
    { id: uuidv4(), name: 'Food Safety Department' },
    { id: uuidv4(), name: 'Labour Department' },
    { id: uuidv4(), name: 'Regional Transport Office' },
    { id: uuidv4(), name: 'Police Department' },
    { id: uuidv4(), name: 'Revenue Department' },
    { id: uuidv4(), name: 'Municipal Corporation' },
  ]);
}
