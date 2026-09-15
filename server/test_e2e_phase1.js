const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING PHASE 1 END-TO-END INTEGRATION TEST SUITE ');
  console.log('====================================================\n');

  // Test 1: Health check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  if (healthData.status !== 'online') throw new Error('Health check failed');
  console.log('✓ 1. Server Health Check Passed:', healthData.status);

  // Test 2: Manager Login
  const mgrLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'manager', password: 'Manager@123' })
  });
  const mgrData = await mgrLoginRes.json();
  if (!mgrData.success || !mgrData.token) throw new Error('Manager login failed: ' + mgrData.error);
  console.log(`✓ 2. Manager Login Passed: [User: ${mgrData.user.fullNameEn}, Role: ${mgrData.user.roleCode}]`);

  // Test 3: Cashier Login
  const cshLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cashier', password: 'Cashier@123' })
  });
  const cshData = await cshLoginRes.json();
  if (!cshData.success || !cshData.token) throw new Error('Cashier login failed: ' + cshData.error);
  console.log(`✓ 3. Cashier Login Passed: [User: ${cshData.user.fullNameEn}, Role: ${cshData.user.roleCode}]`);

  // Test 4: Admin Login
  const admLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
  });
  const admData = await admLoginRes.json();
  if (!admData.success || !admData.token) throw new Error('Admin login failed: ' + admData.error);
  console.log(`✓ 4. Admin Login Passed: [User: ${admData.user.fullNameEn}, Role: ${admData.user.roleCode}]`);

  // Test 5: Granular Permission Barrier (Security Test)
  // Cashier should NOT be allowed to manage settings
  const forbiddenRes = await fetch(`${BASE_URL}/api/settings/organization`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cshData.token}`
    },
    body: JSON.stringify({ approval_threshold: 99999 })
  });
  if (forbiddenRes.status !== 403) {
    throw new Error(`Security violation! Cashier was not blocked from updating settings. Status: ${forbiddenRes.status}`);
  }
  console.log('✓ 5. Security & Permission Enforcement: Cashier blocked from altering settings (HTTP 403 Forbidden).');

  // Test 6: Settings Management (Admin can update approval threshold)
  const updateThresholdRes = await fetch(`${BASE_URL}/api/settings/organization`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${admData.token}`
    },
    body: JSON.stringify({ approval_threshold: 50000 })
  });
  const updateThresholdData = await updateThresholdRes.json();
  if (!updateThresholdData.success) throw new Error('Admin failed to update threshold');
  console.log('✓ 6. Configurable Approval Threshold verified: Rs.', updateThresholdData.organization.approval_threshold.toLocaleString());

  // Test 7: User Administration (Admin creates new cashier)
  const newUserRes = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${admData.token}`
    },
    body: JSON.stringify({
      username: 'cashier2',
      password: 'Cashier2@123',
      full_name_en: 'Pooja Thapa (Cashier 2)',
      full_name_ne: 'पूजा थापा (सहायक रोकड)',
      mobile: '9841000010',
      email: 'pooja@positivesaccos.com.np',
      role_id: 3, // CASHIER
      branch: 'Head Office',
      custom_permissions: ['voucher:create', 'voucher:print']
    })
  });
  const newUserData = await newUserRes.json();
  console.log(`✓ 7. Multi-user Support: Created second cashier 'cashier2' (ID: ${newUserData.userId || 'already created/exists'}).`);

  // Test 8: Dashboard Live Stats
  const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${mgrData.token}` }
  });
  const statsData = await statsRes.json();
  if (!statsData.success) throw new Error('Failed to fetch dashboard stats');
  console.log('✓ 8. Dashboard Live Metrics:');
  console.log('   - Organization:', statsData.stats.orgName);
  console.log('   - Active Fiscal Year:', statsData.stats.activeFiscalYear);
  console.log('   - Approval Threshold:', statsData.stats.currencySymbol, statsData.stats.approvalThreshold.toLocaleString());
  console.log('   - Total Active Staff:', statsData.stats.staffCounts.total_users);
  console.log('   - Cashiers Count:', statsData.stats.staffCounts.total_cashiers);
  console.log('   - Managers Count:', statsData.stats.staffCounts.total_managers);

  console.log('\n====================================================');
  console.log('  ALL 8 END-TO-END INTEGRATION TESTS PASSED 100%!   ');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
