// Bilingual dictionary: Nepali (Primary) and English (Secondary)
export const translations = {
  ne: {
    appTitle: 'पोजिटिभ बचत तथा ऋण सहकारी संस्था लि.',
    appSubtitle: 'डिजिटल भौचर, आन्तरिक लेखा नियन्त्रण तथा लेखापरीक्षण प्रणाली',
    loginTitle: 'प्रणाली लगइन',
    loginSubtitle: 'कृपया आफ्नो प्रयोगकर्ता नाम र गोप्य पासवर्ड राख्नुहोस्',
    username: 'प्रयोगकर्ता नाम',
    password: 'गोप्य पासवर्ड',
    loginBtn: 'लगइन गर्नुहोस्',
    loggingIn: 'लगइन हुँदैछ...',
    logout: 'लगआउट',
    switchLang: 'English',
    branch: 'शाखा',
    headOffice: 'केन्द्रीय कार्यालय',
    fiscalYear: 'आर्थिक वर्ष',
    threshold: 'स्वीकृति सीमा',
    autoReview: 'समीक्षा नियम',
    
    // Navigation
    menu: {
      dashboard: 'ड्यासबोर्ड',
      newVoucher: 'नयाँ भौचर',
      voucherRegister: 'भौचर दर्ता',
      pendingApproval: 'स्वीकृति पर्खिरहेको',
      pendingReview: 'व्यवस्थापक समीक्षा',
      accounts: 'खाता विवरण (COA)',
      members: 'सदस्य / पक्ष',
      reports: 'वित्तीय प्रतिवेदनहरू',
      auditTrail: 'लेखापरीक्षण विवरण',
      backup: 'ब्याकअप र निर्यात',
      users: 'प्रयोगकर्ता व्यवस्थापन',
      settings: 'प्रणाली सेटिङ'
    },

    // Roles
    roles: {
      SUPER_ADMIN: 'सुपर प्रशासक',
      MANAGER: 'व्यवस्थापक',
      CASHIER: 'रोकड अधिकृत / क्यासियर',
      ACCOUNTANT: 'लेखापाल',
      AUDITOR: 'लेखापरीक्षक',
      VIEWER: 'अवलोकनकर्ता'
    },

    // Statuses
    status: {
      DRAFT: 'ड्राफ्ट (Draft)',
      SUBMITTED: 'पेस गरिएको',
      PENDING_APPROVAL: 'स्वीकृति पर्खिरहेको (> सीमा)',
      APPROVED: 'स्वीकृत',
      PENDING_MANAGER_REVIEW: 'व्यवस्थापक समीक्षा पर्खिरहेको',
      REJECTED: 'अस्वीकृत',
      POSTED: 'जारी गरिएको (Posted)',
      PRINTED: 'मुद्रित (Printed)',
      CANCELLED: 'रद्द गरिएको',
      REVERSED: 'उल्ट्याइएको (Reversed)',
      VERIFIED: 'प्रमाणीकृत'
    },

    // Dashboard Cards
    dash: {
      todayVouchers: 'आजका कुल भौचर',
      todayReceipt: 'आजको नगद आम्दानी',
      todayPayment: 'आजको नगद भुक्तानी',
      todayVolume: 'आजको कुल कारोबार',
      pendingApprovalCount: 'स्वीकृति आवश्यक (> रु. ५०,०००)',
      pendingReviewCount: 'व्यवस्थापक समीक्षा बाँकी',
      quickActions: 'द्रुत भौचर प्रविष्टि',
      recentVouchers: 'हालसालै जारी गरिएका भौचरहरू',
      viewAll: 'सबै हेर्नुहोस्',
      voucherNo: 'भौचर नं.',
      date: 'मिति (वि.सं.)',
      type: 'भौचर प्रकार',
      party: 'सदस्य / पक्ष',
      amount: 'रकम (रु.)',
      statusHeader: 'स्थिति',
      preparedBy: 'तयार गर्ने',
      action: 'कार्य',
      noVouchers: 'आज कुनै पनि भौचर प्रविष्टि भएको छैन। नयाँ भौचर सिर्जना गर्न माथिका बटनहरू प्रयोग गर्नुहोस्।'
    },

    // Settings
    settings: {
      title: 'सहकारी तथा प्रणाली सेटिङहरू',
      subtitle: 'संस्था विवरण, स्वीकृति सीमा र आर्थिक वर्ष व्यवस्थापन',
      orgTab: 'संस्था विवरण',
      thresholdTab: 'स्वीकृति सीमा (Maker-Checker)',
      fyTab: 'आर्थिक वर्षहरू',
      orgNameEn: 'संस्थाको नाम (English)',
      orgNameNe: 'संस्थाको नाम (नेपाली)',
      regNo: 'दर्ता नम्बर',
      panNo: 'स्थायी लेखा नं. (PAN)',
      addressEn: 'ठेगाना (English)',
      addressNe: 'ठेगाना (नेपाली)',
      phone: 'सम्पर्क फोन / मोबाइल',
      email: 'ईमेल ठेगाना',
      thresholdTitle: 'स्वीकृति सीमा कन्फिगरेसन',
      thresholdDesc: 'यस सीमा भन्दा बढी रकम भएका सबै भौचरहरू मुद्रण/जारी हुनु अघि व्यवस्थापकको अनिवार्य स्वीकृति आवश्यक पर्दछ। सीमा भित्रका भौचरहरू क्यासियरले सिधै जारी गर्न सक्छन् तर पछि व्यवस्थापकले समीक्षा गर्नुपर्छ।',
      thresholdAmount: 'स्वीकृति सीमा रकम (रु.)',
      saveSettings: 'सेटिङ सुरक्षित गर्नुहोस्',
      saving: 'सुरक्षित हुँदैछ...',
      fyTitle: 'आर्थिक वर्ष व्यवस्थापन',
      addFy: 'नयाँ आर्थिक वर्ष थप्नुहोस्',
      fyCode: 'आर्थिक वर्ष कोड (जस्तै २०८३/८४)',
      startDateBs: 'सुरु मिति (वि.सं.)',
      endDateBs: 'अन्त्य मिति (वि.सं.)',
      active: 'सक्रिय',
      closed: 'बन्द भएको',
      activate: 'सक्रिय बनाउनुहोस्',
      closeYear: 'आर्थिक वर्ष बन्द गर्नुहोस्'
    },

    // Users
    users: {
      title: 'कर्मचारी तथा प्रयोगकर्ता व्यवस्थापन',
      subtitle: 'नयाँ कर्मचारी खाता, भूमिका (Role) तथा व्यक्तिगत अधिकार (Permissions) व्यवस्थापन',
      addUser: 'नयाँ प्रयोगकर्ता थप्नुहोस्',
      fullNameEn: 'पूरा नाम (English)',
      fullNameNe: 'पूरा नाम (नेपाली)',
      role: 'भूमिका (Role)',
      selectRole: 'भूमिका छान्नुहोस्',
      status: 'स्थिति',
      activeStatus: 'सक्रिय',
      inactiveStatus: 'निष्क्रिय',
      lastLogin: 'पछिल्लो लगइन',
      permissionsTitle: 'थप व्यक्तिगत अधिकारहरू (Granular Permissions)',
      permissionsDesc: 'कर्मचारीको भूमिका बाहेक थप व्यक्तिगत अधिकार तोक्न तलका विकल्पहरू छान्नुहोस्:',
      saveUser: 'प्रयोगकर्ता सुरक्षित गर्नुहोस्',
      resetPassword: 'पासवर्ड परिवर्तन',
      edit: 'सम्पादन'
    }
  },

  en: {
    appTitle: 'Positive Saving & Credit Co-operative Ltd.',
    appSubtitle: 'Digital Voucher, Internal Accounting Control & Audit System',
    loginTitle: 'System Login',
    loginSubtitle: 'Enter your credentials to access the digital voucher engine',
    username: 'Username',
    password: 'Password',
    loginBtn: 'Sign In',
    loggingIn: 'Signing in...',
    logout: 'Logout',
    switchLang: 'नेपाली',
    branch: 'Branch',
    headOffice: 'Head Office',
    fiscalYear: 'Fiscal Year',
    threshold: 'Approval Limit',
    autoReview: 'Review Policy',
    
    // Navigation
    menu: {
      dashboard: 'Dashboard',
      newVoucher: 'New Voucher',
      voucherRegister: 'Voucher Register',
      pendingApproval: 'Pending Approval',
      pendingReview: 'Manager Review',
      accounts: 'Chart of Accounts',
      members: 'Members / Parties',
      reports: 'Financial Reports',
      auditTrail: 'Audit Trail',
      backup: 'Backup & Export',
      users: 'Users & Permissions',
      settings: 'System Settings'
    },

    // Roles
    roles: {
      SUPER_ADMIN: 'Super Administrator',
      MANAGER: 'Manager',
      CASHIER: 'Cashier',
      ACCOUNTANT: 'Accountant',
      AUDITOR: 'Auditor',
      VIEWER: 'Viewer'
    },

    // Statuses
    status: {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      PENDING_APPROVAL: 'Pending Approval (> Limit)',
      APPROVED: 'Approved',
      PENDING_MANAGER_REVIEW: 'Pending Manager Review',
      REJECTED: 'Rejected',
      POSTED: 'Posted',
      PRINTED: 'Printed',
      CANCELLED: 'Cancelled',
      REVERSED: 'Reversed',
      VERIFIED: 'Verified'
    },

    // Dashboard Cards
    dash: {
      todayVouchers: "Today's Vouchers",
      todayReceipt: "Today's Cash Receipts",
      todayPayment: "Today's Cash Payments",
      todayVolume: "Today's Turnover Volume",
      pendingApprovalCount: 'Approval Required (> Rs. 50k)',
      pendingReviewCount: 'Pending Manager Review',
      quickActions: 'Quick Voucher Entry',
      recentVouchers: 'Recently Posted Vouchers',
      viewAll: 'View All',
      voucherNo: 'Voucher No.',
      date: 'Date (BS)',
      type: 'Voucher Type',
      party: 'Member / Party',
      amount: 'Amount (Rs.)',
      statusHeader: 'Status',
      preparedBy: 'Prepared By',
      action: 'Action',
      noVouchers: 'No vouchers recorded for today yet. Use the quick entry buttons above.'
    },

    // Settings
    settings: {
      title: 'Cooperative & System Settings',
      subtitle: 'Manage organization profile, approval threshold limit, and fiscal years',
      orgTab: 'Organization Details',
      thresholdTab: 'Approval Limit (Maker-Checker)',
      fyTab: 'Fiscal Years',
      orgNameEn: 'Organization Name (English)',
      orgNameNe: 'Organization Name (Nepali)',
      regNo: 'Registration Number',
      panNo: 'PAN Number',
      addressEn: 'Address (English)',
      addressNe: 'Address (Nepali)',
      phone: 'Contact Phone / Mobile',
      email: 'Email Address',
      thresholdTitle: 'Approval Threshold Configuration',
      thresholdDesc: 'Vouchers with total amount exceeding this threshold strictly require Manager approval before printing or issuing. Vouchers within this limit can be processed immediately by cashiers and queued for manager post-review.',
      thresholdAmount: 'Approval Threshold Limit (Rs.)',
      saveSettings: 'Save Settings',
      saving: 'Saving...',
      fyTitle: 'Fiscal Year Management',
      addFy: 'Add New Fiscal Year',
      fyCode: 'Fiscal Year Code (e.g. 2083/84)',
      startDateBs: 'Start Date (BS)',
      endDateBs: 'End Date (BS)',
      active: 'Active',
      closed: 'Closed',
      activate: 'Set Active',
      closeYear: 'Close Fiscal Year'
    },

    // Users
    users: {
      title: 'Staff & User Access Management',
      subtitle: 'Configure staff logins, maker-checker roles, and granular permission overrides',
      addUser: 'Add New Staff User',
      fullNameEn: 'Full Name (English)',
      fullNameNe: 'Full Name (Nepali)',
      role: 'Role',
      selectRole: 'Select Role',
      status: 'Status',
      activeStatus: 'Active',
      inactiveStatus: 'Inactive',
      lastLogin: 'Last Login',
      permissionsTitle: 'Granular Permissions Override',
      permissionsDesc: 'Customize specific permissions for this individual user beyond default role privileges:',
      saveUser: 'Save User',
      resetPassword: 'Change Password',
      edit: 'Edit'
    }
  }
};
