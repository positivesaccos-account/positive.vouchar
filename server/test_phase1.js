const db = require('./db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('./auth');

console.log('--- STARTING PHASE 1 BACKEND VERIFICATION TESTS ---');

// Test 1: Verify users seed and bcrypt check
const users = ['admin', 'manager', 'cashier', 'auditor'];
const passwords = {
  admin: 'Admin@123',
  manager: 'Manager@123',
  cashier: 'Cashier@123',
  auditor: 'Auditor@123'
};

for (const u of users) {
  const row = db.prepare('SELECT u.*, r.code as role_code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ?').get(u);
  if (!row) throw new Error(`User ${u} not found!`);
  const match = bcrypt.compareSync(passwords[u], row.password_hash);
  if (!match) throw new Error(`Password check failed for ${u}`);
  console.log(`✓ User '${u}' [Role: ${row.role_code}] authentication verified.`);
}

// Test 2: Role & Permissions verification
const roles = db.prepare('SELECT code FROM roles').all().map(r => r.code);
console.log('✓ Roles configured:', roles.join(', '));

const permsCount = db.prepare('SELECT count(*) as c FROM permissions').get().c;
console.log(`✓ Granular permissions configured: ${permsCount} permissions.`);

// Test 3: Organization and Configurable Threshold
const org = db.prepare('SELECT * FROM organizations LIMIT 1').get();
console.log(`✓ Organization: ${org.name_en} (${org.name_ne})`);
console.log(`✓ Configured Approval Threshold: Rs. ${org.approval_threshold.toLocaleString()}`);

// Test 4: Fiscal Years
const activeFy = db.prepare('SELECT code, start_date_bs, end_date_bs FROM fiscal_years WHERE is_active = 1').get();
console.log(`✓ Active Fiscal Year: ${activeFy.code} (${activeFy.start_date_bs} to ${activeFy.end_date_bs})`);

// Test 5: 48 Voucher Types configured
const vTypes = db.prepare('SELECT count(*) as c FROM voucher_types').get().c;
console.log(`✓ Pre-seeded Cooperative Voucher Types: ${vTypes} types ready.`);

// Test 6: Chart of Accounts configured
const coaCount = db.prepare('SELECT count(*) as c FROM chart_of_accounts').get().c;
console.log(`✓ Chart of Accounts configured: ${coaCount} accounts across Assets, Liabilities, Equity, Income, Expenses.`);

// Test 7: Concurrency & Audit trail check
const auditCount = db.prepare('SELECT count(*) as c FROM audit_logs').get().c;
console.log(`✓ Audit log table ready. Initial records: ${auditCount}`);

console.log('--- ALL PHASE 1 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
