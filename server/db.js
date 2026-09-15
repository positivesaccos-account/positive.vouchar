const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'positive_saccos.db');
const db = new Database(dbPath);

// Enable WAL mode, foreign key constraints, busy timeout, and normal synchronous mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 10000');
db.pragma('synchronous = NORMAL');

function initSchema() {
  db.exec(`
    -- Organizations
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL DEFAULT 'Positive Saving & Credit Co-operative Ltd.',
      name_ne TEXT NOT NULL DEFAULT 'पोजिटिभ बचत तथा ऋण सहकारी संस्था लि.',
      registration_no TEXT DEFAULT 'Reg-7890/065',
      pan_no TEXT DEFAULT '302456789',
      address_en TEXT DEFAULT 'Kathmandu, Nepal',
      address_ne TEXT DEFAULT 'काठमाडौँ, नेपाल',
      phone TEXT DEFAULT '+977-1-4567890',
      email TEXT DEFAULT 'info@positivesaccos.com.np',
      logo_url TEXT DEFAULT '',
      currency_symbol TEXT DEFAULT 'रु.',
      approval_threshold REAL NOT NULL DEFAULT 50000.00,
      auto_manager_review INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Fiscal Years
    CREATE TABLE IF NOT EXISTS fiscal_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL, -- e.g. 2081/82, 2082/83
      start_date_bs TEXT NOT NULL,
      end_date_bs TEXT NOT NULL,
      start_date_ad TEXT NOT NULL,
      end_date_ad TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      is_closed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Roles
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL, -- SUPER_ADMIN, MANAGER, CASHIER, ACCOUNTANT, AUDITOR, VIEWER
      name_en TEXT NOT NULL,
      name_ne TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Permissions
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_ne TEXT NOT NULL,
      description TEXT
    );

    -- Role Permissions mapping
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name_en TEXT NOT NULL,
      full_name_ne TEXT NOT NULL,
      mobile TEXT,
      email TEXT,
      role_id INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      branch TEXT DEFAULT 'Head Office',
      custom_permissions_json TEXT DEFAULT '[]', -- Granular permission overrides
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    -- Chart of Accounts
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_code TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ne TEXT NOT NULL,
      category TEXT NOT NULL, -- ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
      sub_category TEXT,
      is_cash_or_bank INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Voucher Types (40+ cooperative types configurable)
    CREATE TABLE IF NOT EXISTS voucher_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL, -- e.g. CRV, CPV, BRV, BPV, JV, SAV_DEP, LOAN_DISB
      prefix TEXT NOT NULL, -- CRV, CPV, etc.
      category TEXT NOT NULL, -- Cash/Bank, General, Share, Savings, Loan, Income/Expense
      title_en TEXT NOT NULL,
      title_ne TEXT NOT NULL,
      default_payment_mode TEXT DEFAULT 'CASH',
      requires_remarks INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    -- Vouchers
    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_number TEXT UNIQUE NOT NULL,
      fiscal_year_id INTEGER NOT NULL,
      voucher_type_id INTEGER NOT NULL,
      voucher_date_bs TEXT NOT NULL,
      voucher_date_ad TEXT NOT NULL,
      member_name TEXT,
      member_id TEXT,
      account_head_id INTEGER,
      total_amount REAL NOT NULL DEFAULT 0.00,
      amount_in_words_ne TEXT,
      amount_in_words_en TEXT,
      reference_no TEXT,
      cheque_no TEXT,
      payment_mode TEXT DEFAULT 'CASH', -- CASH, BANK, CHEQUE, TRANSFER, ADJUSTMENT
      remarks TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT', 
      -- DRAFT, SUBMITTED, PENDING_APPROVAL, APPROVED, PENDING_MANAGER_REVIEW, REJECTED, POSTED, PRINTED, CANCELLED, REVERSED, VERIFIED
      prepared_by INTEGER NOT NULL,
      checked_by INTEGER,
      approved_by INTEGER,
      verified_by INTEGER,
      rejection_reason TEXT,
      cancellation_reason TEXT,
      reversed_voucher_id INTEGER,
      requires_approval INTEGER NOT NULL DEFAULT 0,
      is_above_threshold INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id),
      FOREIGN KEY (voucher_type_id) REFERENCES voucher_types(id),
      FOREIGN KEY (prepared_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (verified_by) REFERENCES users(id),
      FOREIGN KEY (reversed_voucher_id) REFERENCES vouchers(id)
    );

    -- Voucher Lines (Double entry lines: Total Debit = Total Credit)
    CREATE TABLE IF NOT EXISTS voucher_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      particulars TEXT,
      debit_amount REAL NOT NULL DEFAULT 0.00,
      credit_amount REAL NOT NULL DEFAULT 0.00,
      line_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
    );

    -- Supporting Document Attachments
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_by INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    -- Audit Logs (Full immutable audit trail)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, -- VOUCHER, USER, SETTING, AUTH, REPORT, BACKUP
      entity_id TEXT,
      action TEXT NOT NULL, -- LOGIN, LOGOUT, CREATE, EDIT, SUBMIT, APPROVE, REJECT, VERIFY, PRINT, CANCEL, REVERSE, BACKUP, RESTORE
      user_id INTEGER,
      username TEXT,
      user_role TEXT,
      details TEXT, -- JSON details of change, previous/new value, reason
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Print Logs (Tracks original and reprints)
    CREATE TABLE IF NOT EXISTS print_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      printed_by INTEGER NOT NULL,
      print_type TEXT NOT NULL DEFAULT 'BOTH', -- BOTH, CUSTOMER_ONLY, OFFICE_ONLY
      is_reprint INTEGER NOT NULL DEFAULT 0,
      reprint_number INTEGER NOT NULL DEFAULT 0,
      printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
      FOREIGN KEY (printed_by) REFERENCES users(id)
    );

    -- Backup Logs
    CREATE TABLE IF NOT EXISTS backup_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_type TEXT NOT NULL, -- DAILY_EXCEL, DB_SNAPSHOT, MANUAL_EXPORT
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      records_count INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Members / Parties Reference
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_no TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ne TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- High Performance Financial & Audit Indices
    CREATE INDEX IF NOT EXISTS idx_vouchers_date_bs ON vouchers(voucher_date_bs);
    CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
    CREATE INDEX IF NOT EXISTS idx_vouchers_fy_type ON vouchers(fiscal_year_id, voucher_type_id);
    CREATE INDEX IF NOT EXISTS idx_voucher_lines_account ON voucher_lines(account_id);
    CREATE INDEX IF NOT EXISTS idx_voucher_lines_voucher ON voucher_lines(voucher_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}

function seedData() {
  // Check if organization exists
  const org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
  if (!org) {
    db.prepare(`
      INSERT INTO organizations (
        name_en, name_ne, registration_no, pan_no, address_en, address_ne, phone, email, approval_threshold, auto_manager_review
      ) VALUES (
        'Positive Saving & Credit Co-operative Ltd.',
        'पोजिटिभ बचत तथा ऋण सहकारी संस्था लि.',
        'दर्ता नं. १७/०७९/८०, गोकर्णेश्वर नगरपालिका वडा नं. ८',
        '६२४३३८४७१',
        'Gokarneshwor Municipality-8, Jorpati, Nepal',
        'गोकर्णेश्वर नगरपालिका-८, जोरपाटी, नेपाल',
        '+977-1-9768595892',
        'info@positivesaccos.com.np',
        50000.00,
        1
      )
    `).run();
  }

  // Fiscal Years
  const fy = db.prepare('SELECT id FROM fiscal_years LIMIT 1').get();
  if (!fy) {
    const insertFy = db.prepare(`
      INSERT INTO fiscal_years (code, start_date_bs, end_date_bs, start_date_ad, end_date_ad, is_active, is_closed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    // Seed 2081/82 (previous), 2082/83 (current active), 2083/84 (next)
    insertFy.run('2081/82', '2081-04-01', '2082-03-31', '2024-07-16', '2025-07-15', 0, 1);
    insertFy.run('2082/83', '2082-04-01', '2083-03-31', '2025-07-16', '2026-07-15', 1, 0);
    insertFy.run('2083/84', '2083-04-01', '2084-03-31', '2026-07-16', '2027-07-15', 0, 0);
  }

  // Roles
  const existingRoles = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  if (existingRoles.count === 0) {
    const insertRole = db.prepare(`
      INSERT INTO roles (code, name_en, name_ne, description) VALUES (?, ?, ?, ?)
    `);
    insertRole.run('SUPER_ADMIN', 'Super Administrator', 'सुपर प्रशासक', 'Full system access, settings, user management, backup/restore');
    insertRole.run('MANAGER', 'Manager', 'व्यवस्थापक', 'Review, approve, reject, verify vouchers, audit trail and reports');
    insertRole.run('CASHIER', 'Cashier', 'रोकड अधिकृत / क्यासियर', 'Create, edit draft, submit vouchers, print authorized vouchers');
    insertRole.run('ACCOUNTANT', 'Accountant', 'लेखापाल', 'Voucher entry, journal/adjustment, ledger, reports reconciliation');
    insertRole.run('AUDITOR', 'Auditor', 'लेखापरीक्षक', 'Read-only access to vouchers, audit trails, export reports');
    insertRole.run('VIEWER', 'Viewer', 'अवलोकनकर्ता', 'Read-only viewing of permitted reports');
  }

  // Permissions
  const existingPerms = db.prepare('SELECT COUNT(*) as count FROM permissions').get();
  if (existingPerms.count === 0) {
    const insertPerm = db.prepare(`
      INSERT INTO permissions (code, category, name_en, name_ne, description) VALUES (?, ?, ?, ?, ?)
    `);
    const perms = [
      // Voucher Permissions
      ['voucher:create', 'VOUCHER', 'Create Voucher', 'भौचर प्रविष्टि', 'Can create new vouchers'],
      ['voucher:edit_draft', 'VOUCHER', 'Edit Draft Voucher', 'ड्राफ्ट सम्पादन', 'Can edit draft/returned vouchers'],
      ['voucher:submit', 'VOUCHER', 'Submit Voucher', 'भौचर पेस गर्ने', 'Can submit vouchers for approval/processing'],
      ['voucher:approve', 'VOUCHER', 'Approve Voucher', 'भौचर स्वीकृत गर्ने', 'Can approve pending vouchers'],
      ['voucher:reject', 'VOUCHER', 'Reject Voucher', 'भौचर अस्वीकृत गर्ने', 'Can reject vouchers with reason'],
      ['voucher:verify', 'VOUCHER', 'Verify / Post-Review Voucher', 'भौचर प्रमाणीकरण', 'Can verify vouchers in manager post-review'],
      ['voucher:cancel', 'VOUCHER', 'Cancel Voucher', 'भौचर रद्द गर्ने', 'Can cancel vouchers with reason'],
      ['voucher:reverse', 'VOUCHER', 'Reverse Voucher', 'भौचर उल्ट्याउने (Reversal)', 'Can post reversal adjustment vouchers'],
      ['voucher:print', 'VOUCHER', 'Print Voucher', 'भौचर छाप्ने', 'Can print authorized customer/office copies'],
      ['voucher:reprint', 'VOUCHER', 'Reprint Voucher', 'पुनः छाप्ने (Reprint)', 'Can reprint already issued vouchers'],
      
      // Reports Permissions
      ['report:view_voucher', 'REPORT', 'View Voucher Register', 'भौचर दर्ता हेर्ने', 'Can view voucher registers'],
      ['report:view_books', 'REPORT', 'View Cash/Bank/Day Book', 'रोकड/बैंक/दैनिक खाता', 'Can view accounting cash and bank books'],
      ['report:view_ledger', 'REPORT', 'View General Ledger', 'मुख्य खाता (Ledger)', 'Can view general and account ledgers'],
      ['report:view_trial_balance', 'REPORT', 'View Trial Balance', 'सन्तुलन परीक्षण', 'Can view trial balance'],
      ['report:export_excel', 'REPORT', 'Export Reports to Excel', 'एक्सेल निर्यात', 'Can export financial reports to Excel'],
      
      // Audit Permissions
      ['audit:view_trail', 'AUDIT', 'View Audit Trail', 'लेखापरीक्षण विवरण', 'Can view full immutable audit logs'],
      
      // Admin Permissions
      ['backup:export_daily', 'BACKUP', 'Export Daily Excel Backup', 'दैनिक एक्सेल ब्याकअप', 'Can download daily Excel backup'],
      ['backup:manage_db', 'BACKUP', 'Database Backup & Restore', 'डेटाबेस ब्याकअप र पुनर्स्थापना', 'Can download and restore SQLite DB'],
      ['user:manage', 'ADMIN', 'Manage Users & Permissions', 'प्रयोगकर्ता व्यवस्थापन', 'Can create/modify users and assign roles'],
      ['settings:manage', 'ADMIN', 'Manage Settings & Policies', 'सेटिङ र नीति व्यवस्थापन', 'Can configure threshold, organization, fiscal years']
    ];

    for (const p of perms) {
      insertPerm.run(p[0], p[1], p[2], p[3], p[4]);
    }

    // Map default permissions to roles
    const allPerms = db.prepare('SELECT id, code FROM permissions').all();
    const permMap = {};
    allPerms.forEach(p => permMap[p.code] = p.id);

    const rolesList = db.prepare('SELECT id, code FROM roles').all();
    const roleMap = {};
    rolesList.forEach(r => roleMap[r.code] = r.id);

    const assignPerm = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');

    // SUPER_ADMIN gets everything
    allPerms.forEach(p => {
      assignPerm.run(roleMap['SUPER_ADMIN'], p.id);
    });

    // MANAGER gets approval, review, reports, audit, print, create, submit, etc.
    const managerPerms = [
      'voucher:create', 'voucher:edit_draft', 'voucher:submit', 'voucher:approve',
      'voucher:reject', 'voucher:verify', 'voucher:cancel', 'voucher:reverse',
      'voucher:print', 'voucher:reprint', 'report:view_voucher', 'report:view_books',
      'report:view_ledger', 'report:view_trial_balance', 'report:export_excel',
      'audit:view_trail', 'backup:export_daily'
    ];
    managerPerms.forEach(code => {
      if (permMap[code]) assignPerm.run(roleMap['MANAGER'], permMap[code]);
    });

    // CASHIER: create, edit draft, submit, print authorized vouchers, view basic registers
    const cashierPerms = [
      'voucher:create', 'voucher:edit_draft', 'voucher:submit', 'voucher:print',
      'report:view_voucher', 'report:view_books'
    ];
    cashierPerms.forEach(code => {
      if (permMap[code]) assignPerm.run(roleMap['CASHIER'], permMap[code]);
    });

    // ACCOUNTANT: voucher entry, submit, view all books & ledgers, trial balance, excel export
    const accountantPerms = [
      'voucher:create', 'voucher:edit_draft', 'voucher:submit', 'voucher:print',
      'report:view_voucher', 'report:view_books', 'report:view_ledger',
      'report:view_trial_balance', 'report:export_excel'
    ];
    accountantPerms.forEach(code => {
      if (permMap[code]) assignPerm.run(roleMap['ACCOUNTANT'], permMap[code]);
    });

    // AUDITOR: read-only on all vouchers, reports, trial balance, audit trail, export
    const auditorPerms = [
      'report:view_voucher', 'report:view_books', 'report:view_ledger',
      'report:view_trial_balance', 'report:export_excel', 'audit:view_trail'
    ];
    auditorPerms.forEach(code => {
      if (permMap[code]) assignPerm.run(roleMap['AUDITOR'], permMap[code]);
    });

    // VIEWER: basic view
    const viewerPerms = ['report:view_voucher', 'report:view_books'];
    viewerPerms.forEach(code => {
      if (permMap[code]) assignPerm.run(roleMap['VIEWER'], permMap[code]);
    });
  }

  // Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const rolesList = db.prepare('SELECT id, code FROM roles').all();
    const roleMap = {};
    rolesList.forEach(r => roleMap[r.code] = r.id);

    const salt = bcrypt.genSaltSync(10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name_en, full_name_ne, mobile, email, role_id, is_active, branch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Initial Staff as explicitly specified in prompt: 1 Manager + 1 Cashier + Admin + Auditor
    insertUser.run(
      'admin',
      bcrypt.hashSync('Admin@123', salt),
      'System Administrator',
      'सिस्टम प्रशासक',
      '9851000001',
      'admin@positivesaccos.com.np',
      roleMap['SUPER_ADMIN'],
      1,
      'Head Office'
    );

    insertUser.run(
      'manager',
      bcrypt.hashSync('Manager@123', salt),
      'Kiran Shrestha (Manager)',
      'किरण श्रेष्ठ (व्यवस्थापक)',
      '9851000002',
      'manager@positivesaccos.com.np',
      roleMap['MANAGER'],
      1,
      'Head Office'
    );

    insertUser.run(
      'cashier',
      bcrypt.hashSync('Cashier@123', salt),
      'Sarita Sharma (Cashier)',
      'सरिता शर्मा (रोकड अधिकृत)',
      '9851000003',
      'cashier@positivesaccos.com.np',
      roleMap['CASHIER'],
      1,
      'Head Office'
    );

    insertUser.run(
      'auditor',
      bcrypt.hashSync('Auditor@123', salt),
      'Bikash Adhikari (Auditor)',
      'बिकास अधिकारी (आन्तरिक लेखापरीक्षक)',
      '9851000004',
      'auditor@positivesaccos.com.np',
      roleMap['AUDITOR'],
      1,
      'Head Office'
    );
  }

  // Seed Chart of Accounts
  const coaCount = db.prepare('SELECT COUNT(*) as count FROM chart_of_accounts').get();
  if (coaCount.count === 0) {
    const insertCoa = db.prepare(`
      INSERT INTO chart_of_accounts (account_code, name_en, name_ne, category, sub_category, is_cash_or_bank, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Assets
    insertCoa.run('1001', 'Cash in Hand', 'नगद मौज्दात', 'ASSET', 'Cash', 1, 1);
    insertCoa.run('1002', 'Rastriya Banijya Bank (Current)', 'राष्ट्रिय वाणिज्य बैंक (चल्ती)', 'ASSET', 'Bank', 1, 1);
    insertCoa.run('1003', 'Nepal Bank Ltd (Current)', 'नेपाल बैंक लि. (चल्ती)', 'ASSET', 'Bank', 1, 1);
    insertCoa.run('1101', 'Loan to Members - Regular', 'सदस्य कर्जा - नियमित', 'ASSET', 'Loan Receivable', 0, 1);
    insertCoa.run('1102', 'Loan to Members - Emergency', 'सदस्य कर्जा - आकस्मिक', 'ASSET', 'Loan Receivable', 0, 1);
    insertCoa.run('1103', 'Loan to Members - Business', 'सदस्य कर्जा - व्यवसायिक', 'ASSET', 'Loan Receivable', 0, 1);
    insertCoa.run('1201', 'Office Equipment & Computers', 'कार्यालय उपकरण तथा कम्प्युटर', 'ASSET', 'Fixed Asset', 0, 1);
    insertCoa.run('1202', 'Furniture and Fixtures', 'फर्निचर तथा फिक्चर्स', 'ASSET', 'Fixed Asset', 0, 1);
    insertCoa.run('1301', 'Advance / Staff Imprest', 'कर्मचारी पेस्की तथा इम्प्रिस्ट', 'ASSET', 'Receivables', 0, 1);

    // Liabilities
    insertCoa.run('2001', 'Compulsory Savings', 'अनिवार्य मासिक बचत', 'LIABILITY', 'Member Savings', 0, 1);
    insertCoa.run('2002', 'Voluntary / Optional Savings', 'ऐच्छिक बचत', 'LIABILITY', 'Member Savings', 0, 1);
    insertCoa.run('2003', 'Periodic / Fixed Deposit Savings', 'मुद्दती बचत', 'LIABILITY', 'Member Savings', 0, 1);
    insertCoa.run('2004', 'Child Savings', 'बाल बचत', 'LIABILITY', 'Member Savings', 0, 1);
    insertCoa.run('2101', 'Interest Payable on Savings', 'बचतमा भुक्तानी हुन बाँकी ब्याज', 'LIABILITY', 'Payables', 0, 1);
    insertCoa.run('2102', 'TDS / Tax Payable', 'अग्रिम कर कट्टी (TDS)', 'LIABILITY', 'Payables', 0, 1);

    // Equity
    insertCoa.run('3001', 'Member Share Capital', 'सदस्य सेयर पूँजी', 'EQUITY', 'Share Capital', 0, 1);
    insertCoa.run('3002', 'General Reserve Fund', 'जगेडा कोष', 'EQUITY', 'Reserves', 0, 1);
    insertCoa.run('3003', 'Cooperative Promotion Fund', 'सहकारी प्रवर्द्धन कोष', 'EQUITY', 'Reserves', 0, 1);
    insertCoa.run('3004', 'Retained Earnings', 'संचित नाफा/नोक्सान', 'EQUITY', 'Retained Earnings', 0, 1);

    // Income
    insertCoa.run('4001', 'Interest Income from Loans', 'कर्जा लगानीबाट ब्याज आम्दानी', 'INCOME', 'Interest Income', 0, 1);
    insertCoa.run('4002', 'Loan Service Charge & Processing Fee', 'कर्जा सेवा शुल्क तथा नवीकरण', 'INCOME', 'Fee Income', 0, 1);
    insertCoa.run('4003', 'Loan Penalty Income', 'हर्जाना ब्याज आम्दानी', 'INCOME', 'Penalty Income', 0, 1);
    insertCoa.run('4004', 'Membership Entrance Fee', 'सदस्यता प्रवेश शुल्क', 'INCOME', 'Fee Income', 0, 1);
    insertCoa.run('4005', 'Passbook & Other Sales Income', 'पासबुक तथा अन्य बिक्री आम्दानी', 'INCOME', 'Other Income', 0, 1);

    // Expenses
    insertCoa.run('5001', 'Interest Expense on Member Savings', 'सदस्य बचतमा ब्याज खर्च', 'EXPENSE', 'Interest Expense', 0, 1);
    insertCoa.run('5002', 'Staff Salary and Allowances', 'कर्मचारी तलब तथा भत्ता', 'EXPENSE', 'Personnel', 0, 1);
    insertCoa.run('5003', 'Office Rent', 'कार्यालय घरभाडा', 'EXPENSE', 'Administrative', 0, 1);
    insertCoa.run('5004', 'Electricity and Water Charges', 'बिजुली तथा पानी खर्च', 'EXPENSE', 'Utilities', 0, 1);
    insertCoa.run('5005', 'Printing and Stationery', 'छपाई तथा मसलन्द खर्च', 'EXPENSE', 'Office Supplies', 0, 1);
    insertCoa.run('5006', 'Communication and Internet Expense', 'सञ्चार तथा इन्टरनेट खर्च', 'EXPENSE', 'Utilities', 0, 1);
    insertCoa.run('5007', 'Audit Fee and Legal Expenses', 'लेखापरीक्षण तथा कानुनी खर्च', 'EXPENSE', 'Professional', 0, 1);
    insertCoa.run('5008', 'Software Maintenance and License', 'सफ्टवेयर मर्मत तथा नवीकरण', 'EXPENSE', 'Technology', 0, 1);
    insertCoa.run('5009', 'Meeting and Hospitality Expense', 'बैठक तथा सत्कार खर्च', 'EXPENSE', 'Administrative', 0, 1);
    insertCoa.run('5010', 'Miscellaneous / Petty Expense', 'विविध कार्यालय खर्च', 'EXPENSE', 'Miscellaneous', 0, 1);
  }

  // Seed Voucher Types (All 40+ types categorized)
  const vtCount = db.prepare('SELECT COUNT(*) as count FROM voucher_types').get();
  if (vtCount.count === 0) {
    const insertVt = db.prepare(`
      INSERT INTO voucher_types (code, prefix, category, title_en, title_ne, default_payment_mode, requires_remarks, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const types = [
      // Cash / Bank
      ['CRV', 'CRV', 'Cash / Bank', 'Cash Receipt Voucher (CRV)', 'नगद आम्दानी भौचर (CRV)', 'CASH', 0, 10],
      ['CPV', 'CPV', 'Cash / Bank', 'Cash Payment Voucher (CPV)', 'नगद भुक्तानी भौचर (CPV)', 'CASH', 0, 20],
      ['BRV', 'BRV', 'Cash / Bank', 'Bank Receipt Voucher (BRV)', 'बैंक आम्दानी भौचर (BRV)', 'BANK', 0, 30],
      ['BPV', 'BPV', 'Cash / Bank', 'Bank Payment Voucher (BPV)', 'बैंक भुक्तानी भौचर (BPV)', 'BANK', 0, 40],
      ['C2B', 'C2B', 'Cash / Bank', 'Cash to Bank Transfer', 'नगद बैंकमा दाखिला', 'BANK', 0, 50],
      ['B2C', 'B2C', 'Cash / Bank', 'Bank to Cash Transfer (Cheque Cash)', 'बैंकबाट नगद झिकेको', 'CASH', 0, 60],
      ['B2B', 'B2B', 'Cash / Bank', 'Bank to Bank Transfer', 'बैंक खाता सटही / ट्रान्सफर', 'TRANSFER', 0, 70],
      ['CONTRA', 'CNTR', 'Cash / Bank', 'Contra Voucher', 'कन्ट्रा भौचर (नगद/बैंक समायोजन)', 'TRANSFER', 0, 80],

      // General Accounting
      ['JV', 'JV', 'General Accounting', 'Journal Voucher (JV)', 'जर्नल भौचर (JV)', 'ADJUSTMENT', 0, 100],
      ['ADJ', 'ADJ', 'General Accounting', 'Adjustment Voucher', 'समायोजन भौचर', 'ADJUSTMENT', 1, 110],
      ['CORR', 'CORR', 'General Accounting', 'Correction Voucher', 'त्रुटि संशोधन भौचर', 'ADJUSTMENT', 1, 120],
      ['REV', 'REV', 'General Accounting', 'Reversal Voucher', 'उल्ट्याउने भौचर (Reversal)', 'ADJUSTMENT', 1, 130],
      ['OPB', 'OPB', 'General Accounting', 'Opening Balance Voucher', 'प्रारम्भिक मौज्दात भौचर', 'ADJUSTMENT', 1, 140],
      ['CLOSE_ADJ', 'CLADJ', 'General Accounting', 'Year-End / Closing Adjustment', 'आर्थिक वर्ष अन्त्य समायोजन', 'ADJUSTMENT', 1, 150],
      ['MISC_VCH', 'MISC', 'General Accounting', 'Miscellaneous Voucher', 'विविध भौचर', 'CASH', 1, 160],

      // Share / Membership
      ['SHARE_RCPT', 'SHR', 'Share / Membership', 'Share Purchase / Share Receipt', 'सेयर खरिद / सेयर आम्दानी', 'CASH', 0, 200],
      ['SHARE_REFUND', 'SHREF', 'Share / Membership', 'Share Refund / Withdrawal', 'सेयर फिर्ता / भुक्तानी', 'CASH', 0, 210],
      ['MEM_FEE_RCPT', 'MFEE', 'Share / Membership', 'Membership Fee Receipt', 'सदस्यता प्रवेश शुल्क आम्दानी', 'CASH', 0, 220],
      ['MEM_FEE_REFUND', 'MREF', 'Share / Membership', 'Membership Fee Refund', 'सदस्यता शुल्क फिर्ता', 'CASH', 1, 230],
      ['MEM_OTHER_RCPT', 'MOR', 'Share / Membership', 'Other Member Receipt', 'अन्य सदस्य आम्दानी', 'CASH', 0, 240],
      ['MEM_OTHER_PAY', 'MOP', 'Share / Membership', 'Other Member Payment', 'अन्य सदस्य भुक्तानी', 'CASH', 1, 250],

      // Savings
      ['SAV_DEP', 'SDEP', 'Savings', 'Savings Deposit', 'बचत जम्मा भौचर', 'CASH', 0, 300],
      ['SAV_WITH', 'SWTH', 'Savings', 'Savings Withdrawal', 'बचत भुक्तानी / फिर्ता', 'CASH', 0, 310],
      ['SAV_TRF', 'STRF', 'Savings', 'Savings Transfer', 'बचत रकम रकमान्तर', 'TRANSFER', 0, 320],
      ['SAV_INT_POST', 'SINT', 'Savings', 'Savings Interest Posting', 'बचत ब्याज प्रविष्टि', 'ADJUSTMENT', 0, 330],
      ['SAV_INT_ADJ', 'SIADJ', 'Savings', 'Savings Interest Adjustment', 'बचत ब्याज समायोजन', 'ADJUSTMENT', 1, 340],
      ['SAV_INT_REV', 'SIREV', 'Savings', 'Savings Interest Reversal', 'बचत ब्याज उल्ट्याएको', 'ADJUSTMENT', 1, 350],

      // Loan
      ['LOAN_DISB', 'LDIS', 'Loan', 'Loan Disbursement', 'कर्जा लगानी / भुक्तानी', 'BANK', 0, 400],
      ['LOAN_REPAY', 'LRPY', 'Loan', 'Loan Repayment', 'कर्जा असुली (साँवा/ब्याज)', 'CASH', 0, 410],
      ['LOAN_PRIN_RPY', 'LPRIN', 'Loan', 'Loan Principal Repayment', 'कर्जा साँवा असुली', 'CASH', 0, 420],
      ['LOAN_INT_COLL', 'LINT', 'Loan', 'Loan Interest Collection', 'कर्जा ब्याज असुली', 'CASH', 0, 430],
      ['LOAN_PRIN_INT', 'LPI', 'Loan', 'Loan Principal + Interest Collection', 'कर्जा साँवा तथा ब्याज असुली', 'CASH', 0, 440],
      ['LOAN_INT_POST', 'LIPST', 'Loan', 'Loan Interest Posting', 'कर्जा ब्याज प्रविष्टि', 'ADJUSTMENT', 0, 450],
      ['LOAN_PENALTY', 'LPEN', 'Loan', 'Loan Penalty Collection', 'हर्जाना ब्याज असुली', 'CASH', 0, 460],
      ['LOAN_REBATE', 'LREB', 'Loan', 'Loan Rebate / Discount Adjustment', 'कर्जा छुट / सहुलियत समायोजन', 'ADJUSTMENT', 1, 470],
      ['LOAN_TRF_ADJ', 'LTADJ', 'Loan', 'Loan Transfer / Adjustment', 'कर्जा रकमान्तर तथा समायोजन', 'ADJUSTMENT', 1, 480],
      ['LOAN_WRITEOFF', 'LWROF', 'Loan', 'Loan Provision / Write-off Adjustment', 'कर्जा नोक्सानी तथा अपलेखन समायोजन', 'ADJUSTMENT', 1, 490],

      // Income / Expense
      ['INC_RCPT', 'INCR', 'Income / Expense', 'Income Receipt', 'आम्दानी रसिद / भौचर', 'CASH', 0, 500],
      ['EXP_PAY', 'EXPP', 'Income / Expense', 'Expense Payment', 'खर्च भुक्तानी भौचर', 'CASH', 0, 510],
      ['SALARY_PAY', 'SALP', 'Income / Expense', 'Salary Payment', 'कर्मचारी तलब तथा भत्ता भुक्तानी', 'BANK', 0, 520],
      ['ALLOW_PAY', 'ALLWP', 'Income / Expense', 'Allowance / Benefits Payment', 'भत्ता तथा सुविधा भुक्तानी', 'CASH', 0, 530],
      ['STAT_PURCH', 'STAT', 'Income / Expense', 'Stationery / Office Purchase', 'छपाई तथा कार्यालय सामग्री खरिद', 'CASH', 0, 540],
      ['UTIL_PAY', 'UTIL', 'Income / Expense', 'Utility Payment (Electricity/Water/Net)', 'धारा, बिजुली, टेलिफोन महशुल', 'CASH', 0, 550],
      ['ADV_PAY', 'ADVP', 'Income / Expense', 'Advance Payment', 'पेस्की भुक्तानी', 'CASH', 1, 560],
      ['ADV_SETTLE', 'ADVS', 'Income / Expense', 'Advance Settlement', 'पेस्की फर्छ्यौट', 'ADJUSTMENT', 1, 570],
      ['PETTY_CASH', 'PTTY', 'Income / Expense', 'Petty Cash Expense', 'सानोतिनो फुटकर खर्च (Petty Cash)', 'CASH', 0, 580],
      ['IMPREST_VCH', 'IMPR', 'Income / Expense', 'Imprest Reimbursement', 'इम्प्रिस्ट कोष शोधभर्ना', 'CASH', 0, 590],
      ['ADMIN_EXP', 'ADMN', 'Income / Expense', 'Other Administrative Expense', 'अन्य प्रशासनिक खर्च', 'CASH', 0, 600]
    ];

    for (const t of types) {
      insertVt.run(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7]);
    }
  }

  // Seed sample members for reference
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get();
  if (memberCount.count === 0) {
    const insertMember = db.prepare(`
      INSERT INTO members (member_no, name_en, name_ne, phone, address) VALUES (?, ?, ?, ?, ?)
    `);
    insertMember.run('M-001', 'Ram Bahadur Thapa', 'राम बहादुर थापा', '9841234567', 'Kathmandu-10');
    insertMember.run('M-002', 'Sita Devi Sharma', 'सीता देवी शर्मा', '9841987654', 'Lalitpur-3');
    insertMember.run('M-003', 'Hari Prasad Poudel', 'हरि प्रसाद पौडेल', '9841112233', 'Bhaktapur-2');
    insertMember.run('M-004', 'Gita Kumari KC', 'गीता कुमारी के.सी.', '9841445566', 'Kathmandu-4');
  }
}

initSchema();
seedData();

module.exports = db;
