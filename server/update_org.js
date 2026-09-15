const db = require('./db.js');

const res = db.prepare(`
  UPDATE organizations SET
    registration_no = 'दर्ता नं. १७/०७९/८०, गोकर्णेश्वर नगरपालिका वडा नं. ८',
    pan_no = '६२४३३८४७१',
    phone = '+977-1-9768595892',
    email = 'positivesaccos@gmail.com',
    logo_url = '/logo.png',
    address_en = 'Gokarneshwor Municipality-8, Jorpati, Nepal',
    address_ne = 'गोकर्णेश्वर नगरपालिका-८, जोरपाटी, नेपाल',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`).run();

const updated = db.prepare('SELECT * FROM organizations WHERE id = 1').get();
console.log('--- ORGANIZATION DETAILS UPDATED ---');
console.log('Organization (NE):', updated.name_ne);
console.log('Organization (EN):', updated.name_en);
console.log('Registration No  :', updated.registration_no);
console.log('PAN Number       :', updated.pan_no);
console.log('Contact Phone    :', updated.phone);
console.log('Address (Nepali) :', updated.address_ne);
console.log('Address (English):', updated.address_en);
console.log('------------------------------------');
