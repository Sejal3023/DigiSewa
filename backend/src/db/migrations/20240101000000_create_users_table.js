/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    table.text('email').notNullable().unique();
    table.text('full_name').notNullable();
    table.text('phone');
    table.text('password_hash').notNullable();
    table.text('role').notNullable().defaultTo('citizen');
    table.timestamps(true, true); // creates created_at and updated_at
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('users');
}