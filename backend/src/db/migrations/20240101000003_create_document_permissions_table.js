export async function up(knex) {
  return knex.schema.createTable('document_permissions', (table) => {
    // table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary(); // OLD
    table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary(); // NEW
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE');
    table.uuid('department_id').notNullable().references('id').inTable('departments').onDelete('CASCADE');
    table.string('access_policy').notNullable();
    table.uuid('granted_by').notNullable().references('id').inTable('users');
    table.timestamp('granted_at').defaultTo(knex.fn.now()).notNullable();
    table.unique(['document_id', 'department_id']);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('document_permissions');
}
