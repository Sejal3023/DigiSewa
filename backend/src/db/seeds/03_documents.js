import { v4 as uuidv4 } from 'uuid';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('documents').del();
  
  // Get a real user ID for the owner
  const citizenUser = await knex('users').where({ email: 'citizen1@digisewa.gov.in' }).select('id').first();
  
  if (!citizenUser) {
    throw new Error('Could not find citizen user to assign as document owner');
  }

  await knex('documents').insert([
    {
      id: uuidv4(),
      name: 'Sample Document 1',
      cid: 'QmSampleCID1',
      owner: citizenUser.id, // Use the real user ID
      aesKey: 'sampleAESKey1',
      uploaded_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Sample Document 2',
      cid: 'QmSampleCID2',
      owner: citizenUser.id, // Use the real user ID
      aesKey: 'sampleAESKey2',
      uploaded_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Sample Document 3',
      cid: 'QmSampleCID3',
      owner: citizenUser.id, // Use the real user ID
      aesKey: 'sampleAESKey3',
      uploaded_at: new Date(),
    },
  ]);
}