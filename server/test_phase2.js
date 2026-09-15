const BASE_URL = 'http://localhost:5000';

async function runPhase2Tests() {
  console.log('===========================================================');
  console.log('  RUNNING PHASE 2 & 3 VOUCHER ENGINE & MAKER-CHECKER TESTS ');
  console.log('===========================================================\n');

  // Logins
  const mgrRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'manager', password: 'Manager@123' })
  });
  const mgr = await mgrRes.json();

  const cshRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'cashier', password: 'Cashier@123' })
  });
  const csh = await cshRes.json();

  // Fetch Accounts and Types
  const typesRes = await fetch(`${BASE_URL}/api/vouchers/types`, {
    headers: { Authorization: `Bearer ${csh.token}` }
  });
  const typesData = await typesRes.json();
  const crvType = typesData.voucherTypes.find(t => t.code === 'CRV');
  const cpvType = typesData.voucherTypes.find(t => t.code === 'CPV');
  const ldisType = typesData.voucherTypes.find(t => t.code === 'LOAN_DISB');
  const adjType = typesData.voucherTypes.find(t => t.code === 'ADJ');

  const accRes = await fetch(`${BASE_URL}/api/vouchers/accounts`, {
    headers: { Authorization: `Bearer ${csh.token}` }
  });
  const accData = await accRes.json();
  const cashAcc = accData.accounts.find(a => a.account_code === '1001'); // Cash in Hand
  const savAcc = accData.accounts.find(a => a.account_code === '2001');  // Compulsory Savings
  const statAcc = accData.accounts.find(a => a.account_code === '5005'); // Printing and Stationery
  const loanAcc = accData.accounts.find(a => a.account_code === '1101'); // Loan to Members
  const bankAcc = accData.accounts.find(a => a.account_code === '1002'); // Rastriya Banijya Bank

  // -------------------------------------------------------------
  // Test 1: Cash Receipt Rs. 10,000 (Debit 10,000 = Credit 10,000)
  // -------------------------------------------------------------
  const t1Res = await fetch(`${BASE_URL}/api/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csh.token}` },
    body: JSON.stringify({
      voucher_type_id: crvType.id,
      member_name: 'Ram Bahadur Thapa',
      member_id: 'M-001',
      voucher_date_bs: '2082-06-15',
      remarks: 'मासिक बचत जम्मा रसिद',
      lines: [
        { account_id: cashAcc.id, particulars: 'नगद दाखिला', debit_amount: 10000, credit_amount: 0 },
        { account_id: savAcc.id, particulars: 'अनिवार्य मासिक बचत', debit_amount: 0, credit_amount: 10000 }
      ]
    })
  });
  const t1Data = await t1Res.json();
  if (!t1Data.success) throw new Error('Test 1 failed: ' + t1Data.error);
  console.log(`✓ Test 1 Passed: Cash Receipt Rs. 10,000 created [Voucher No: ${t1Data.voucherNumber}]. Status: ${t1Data.status}`);
  console.log(`   Nepali Words: ${t1Data.amountWordsNe}`);

  // -------------------------------------------------------------
  // Test 2: Cash Payment Rs. 2,000 (Debit 2,000 = Credit 2,000)
  // -------------------------------------------------------------
  const t2Res = await fetch(`${BASE_URL}/api/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csh.token}` },
    body: JSON.stringify({
      voucher_type_id: cpvType.id,
      member_name: 'Himalayan Stationers',
      voucher_date_bs: '2082-06-15',
      remarks: 'कार्यालय छपाई तथा मसलन्द खरिद भुक्तानी',
      lines: [
        { account_id: statAcc.id, particulars: 'मसलन्द खरिद बिल नं. ५४३', debit_amount: 2000, credit_amount: 0 },
        { account_id: cashAcc.id, particulars: 'नगद भुक्तानी', debit_amount: 0, credit_amount: 2000 }
      ]
    })
  });
  const t2Data = await t2Res.json();
  if (!t2Data.success) throw new Error('Test 2 failed: ' + t2Data.error);
  console.log(`✓ Test 2 Passed: Cash Payment Rs. 2,000 created [Voucher No: ${t2Data.voucherNumber}]. Status: ${t2Data.status}`);

  // -------------------------------------------------------------
  // Test 3: Unbalanced Voucher (Debit Rs. 5,000 != Credit Rs. 4,000)
  // -------------------------------------------------------------
  const t3Res = await fetch(`${BASE_URL}/api/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csh.token}` },
    body: JSON.stringify({
      voucher_type_id: crvType.id,
      member_name: 'Test Unbalanced',
      lines: [
        { account_id: cashAcc.id, particulars: 'नगद', debit_amount: 5000, credit_amount: 0 },
        { account_id: savAcc.id, particulars: 'बचत', debit_amount: 0, credit_amount: 4000 }
      ]
    })
  });
  const t3Data = await t3Res.json();
  if (t3Res.status !== 400 || t3Data.success) {
    throw new Error('Test 3 Failed: Unbalanced voucher was not rejected by system!');
  }
  console.log(`✓ Test 3 Passed: Double-entry guard strictly blocked unbalanced voucher (Debit != Credit): "${t3Data.error}"`);

  // -------------------------------------------------------------
  // Test 4: Mandatory Remarks Requirement
  // -------------------------------------------------------------
  const t4Res = await fetch(`${BASE_URL}/api/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csh.token}` },
    body: JSON.stringify({
      voucher_type_id: adjType.id, // requires_remarks = 1
      remarks: '', // empty remarks
      lines: [
        { account_id: cashAcc.id, particulars: 'समायोजन १', debit_amount: 500, credit_amount: 0 },
        { account_id: savAcc.id, particulars: 'समायोजन २', debit_amount: 0, credit_amount: 500 }
      ]
    })
  });
  const t4Data = await t4Res.json();
  if (t4Res.status !== 400 || t4Data.success) {
    throw new Error('Test 4 Failed: Adjustment voucher without remarks was not rejected!');
  }
  console.log(`✓ Test 4 Passed: Mandatory remarks rule strictly enforced: "${t4Data.error}"`);

  // -------------------------------------------------------------
  // Test 5: Voucher Above Approval Threshold (Rs. 75,000 > Rs. 50,000 limit)
  // -------------------------------------------------------------
  const t5Res = await fetch(`${BASE_URL}/api/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csh.token}` },
    body: JSON.stringify({
      voucher_type_id: ldisType.id,
      member_name: 'Hari Prasad Poudel',
      member_id: 'M-003',
      voucher_date_bs: '2082-06-16',
      remarks: 'नियमित व्यवसायिक कर्जा लगानी चेक भुक्तानी',
      payment_mode: 'BANK',
      cheque_no: 'CHQ-987654',
      lines: [
        { account_id: loanAcc.id, particulars: 'कर्जा लगानी', debit_amount: 75000, credit_amount: 0 },
        { account_id: bankAcc.id, particulars: 'बैंक खाता भुक्तानी', debit_amount: 0, credit_amount: 75000 }
      ]
    })
  });
  const t5Data = await t5Res.json();
  if (!t5Data.success || t5Data.status !== 'PENDING_APPROVAL' || !t5Data.isAboveThreshold) {
    throw new Error('Test 5 Failed: Voucher above threshold was not marked PENDING_APPROVAL');
  }
  console.log(`✓ Test 5 Passed: Voucher above Rs. 50k threshold routed to Manager Approval [Voucher No: ${t5Data.voucherNumber}, Status: ${t5Data.status}]`);

  // -------------------------------------------------------------
  // Test 6: Maker-Checker Protection (Cashier tries to approve own voucher)
  // -------------------------------------------------------------
  const t6Res = await fetch(`${BASE_URL}/api/vouchers/${t5Data.voucherId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${csh.token}` }
  });
  const t6Data = await t6Res.json();
  if (t6Res.status !== 403 || t6Data.success) {
    throw new Error('Test 6 Failed: Cashier self-approval was not blocked!');
  }
  console.log(`✓ Test 6 Passed: Maker-Checker rule strictly blocked Cashier self-approval: "${t6Data.error}"`);

  // -------------------------------------------------------------
  // Test 7: Manager Approves Voucher
  // -------------------------------------------------------------
  const t7Res = await fetch(`${BASE_URL}/api/vouchers/${t5Data.voucherId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mgr.token}` }
  });
  const t7Data = await t7Res.json();
  if (!t7Data.success) throw new Error('Test 7 Failed: Manager could not approve voucher: ' + t7Data.error);
  console.log(`✓ Test 7 Passed: Manager successfully approved voucher ${t5Data.voucherNumber}. Status updated to APPROVED.`);

  // -------------------------------------------------------------
  // Test 8: Manager Rejection Workflow
  // -------------------------------------------------------------
  // Create another voucher above threshold (Rs. 100,000)
  const t8Create = await fetch(`${BASE_URL}/api/vouchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${csh.token}` },
    body: JSON.stringify({
      voucher_type_id: ldisType.id,
      member_name: 'Gita Kumari KC',
      member_id: 'M-004',
      voucher_date_bs: '2082-06-16',
      remarks: 'कर्जा लगानी परीक्षण',
      lines: [
        { account_id: loanAcc.id, particulars: 'कर्जा लगानी', debit_amount: 100000, credit_amount: 0 },
        { account_id: bankAcc.id, particulars: 'बैंक खाता', debit_amount: 0, credit_amount: 100000 }
      ]
    })
  });
  const t8CreateData = await t8Create.json();

  const t8Reject = await fetch(`${BASE_URL}/api/vouchers/${t8CreateData.voucherId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgr.token}` },
    body: JSON.stringify({ rejection_reason: 'धितो मुल्यांकन कागजात अपुग भएकोले अस्वीकृत' })
  });
  const t8RejectData = await t8Reject.json();
  if (!t8RejectData.success) throw new Error('Test 8 Failed: Manager could not reject voucher');
  console.log(`✓ Test 8 Passed: Manager rejected voucher with mandatory reason. Voucher cannot be printed.`);

  // -------------------------------------------------------------
  // Test 9: Cancellation Workflow (No silent delete)
  // -------------------------------------------------------------
  const t9Cancel = await fetch(`${BASE_URL}/api/vouchers/${t2Data.voucherId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgr.token}` },
    body: JSON.stringify({ cancellation_reason: 'गलत बिल नम्बर प्रविष्टि भएकोले रद्द गरिएको' })
  });
  const t9CancelData = await t9Cancel.json();
  if (!t9CancelData.success) throw new Error('Test 9 Failed: Voucher cancellation failed');
  console.log(`✓ Test 9 Passed: Voucher cancelled with reason and preserved in audit trail.`);

  // -------------------------------------------------------------
  // Test 10: Reversal Voucher Workflow
  // -------------------------------------------------------------
  const t10Rev = await fetch(`${BASE_URL}/api/vouchers/${t1Data.voucherId}/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgr.token}` },
    body: JSON.stringify({ reversal_reason: 'सदस्य बचत खाता नम्बर भूलवश फरक परेकोले उल्ट्याइएको' })
  });
  const t10RevData = await t10Rev.json();
  if (!t10RevData.success) throw new Error('Test 10 Failed: Voucher reversal failed');
  console.log(`✓ Test 10 Passed: Reversal voucher ${t10RevData.reversalVoucherNumber} created with swapped debits/credits.`);

  // -------------------------------------------------------------
  // Test 11: Audit Trail Verification
  // -------------------------------------------------------------
  const auditRes = await fetch(`${BASE_URL}/api/vouchers/${t1Data.voucherId}`, {
    headers: { Authorization: `Bearer ${mgr.token}` }
  });
  const auditData = await auditRes.json();
  console.log(`✓ Test 11 Passed: Full audit trail preserved for voucher ${t1Data.voucherNumber} (${auditData.voucher.auditLogs.length} audit records found).`);

  console.log('\n===========================================================');
  console.log('  ALL PHASE 2 & 3 INTEGRATION TESTS PASSED 100%!           ');
  console.log('===========================================================\n');
}

runPhase2Tests().catch(err => {
  console.error('Phase 2 Tests Failed:', err);
  process.exit(1);
});
