// Nepali Number to Words Converter for Cooperative Financial Vouchers

const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const nepaliWords0to99 = [
  'शून्य', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
  'दश', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस',
  'बीस', 'एक्काइस', 'बाइस', 'तेइस', 'चौबिस', 'पच्चिस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तिस',
  'तीस', 'एकत्तिस', 'बत्तिस', 'तेत्तिस', 'चौँतीस', 'पैँतिस', 'छत्तीस', 'सैँतीस', 'अठतीस', 'उनन्चालीस',
  'चालीस', 'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चवालीस', 'पैँतालीस', 'छयालीस', 'सड्चालीस', 'अठचालीस', 'उनन्चास',
  'पचास', 'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चउन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठ्ठी',
  'साठ्ठी', 'एकसट्ठी', 'बासट्ठी', 'त्रिसट्ठी', 'चौंसट्ठी', 'पैंसट्ठी', 'छयसट्ठी', 'सत्सट्ठी', 'अठसट्ठी', 'उनन्सत्तरी',
  'सत्तरी', 'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छयहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'असी', 'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सत्तासी', 'अठासी', 'उनान्नब्बे',
  'नब्बे', 'एकान्नब्बे', 'बयानब्बे', 'त्रियान्नब्बे', 'चौरानब्बे', 'पञ्चानब्बे', 'छयान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्ब्बे', 'उनान्सय'
];

function convertPart(n) {
  if (n === 0) return '';
  if (n < 100) return nepaliWords0to99[n];
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return nepaliWords0to99[hundred] + ' सय' + (rest > 0 ? ' ' + nepaliWords0to99[rest] : '');
}

/**
 * Convert numeric amount to standard Nepali Currency Words
 * Example: 25000 -> "रु. पच्चिस हजार मात्र।"
 * Example: 10500.50 -> "रु. दश हजार पाँच सय पचास पैसा मात्र।"
 */
function amountToNepaliWords(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return '';
  const num = Math.abs(parseFloat(amount));
  if (num === 0) return 'रु. शून्य मात्र।';

  const parts = num.toFixed(2).split('.');
  let rupees = parseInt(parts[0], 10);
  const paisa = parseInt(parts[1], 10);

  let result = '';

  // Arba (100 Crore = 1,00,00,00,000)
  if (rupees >= 1000000000) {
    const arba = Math.floor(rupees / 1000000000);
    result += nepaliWords0to99[arba] + ' अर्ब ';
    rupees %= 1000000000;
  }

  // Crore (1,00,00,000)
  if (rupees >= 10000000) {
    const crore = Math.floor(rupees / 10000000);
    result += nepaliWords0to99[crore] + ' करोड ';
    rupees %= 10000000;
  }

  // Lakh (1,00,000)
  if (rupees >= 100000) {
    const lakh = Math.floor(rupees / 100000);
    result += nepaliWords0to99[lakh] + ' लाख ';
    rupees %= 100000;
  }

  // Thousand (1,000)
  if (rupees >= 1000) {
    const thousand = Math.floor(rupees / 1000);
    result += nepaliWords0to99[thousand] + ' हजार ';
    rupees %= 1000;
  }

  // Hundred and remainder
  if (rupees > 0) {
    result += convertPart(rupees) + ' ';
  }

  result = result.trim();
  if (result) {
    result = 'रु. ' + result;
  }

  if (paisa > 0) {
    result += (result ? ' ' : 'रु. ') + nepaliWords0to99[paisa] + ' पैसा';
  }

  return result + ' मात्र।';
}

// English converter
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertHundred(num) {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num > 0) {
    str += ones[num] + ' ';
  }
  return str.trim();
}

function amountToEnglishWords(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return '';
  const num = Math.abs(parseFloat(amount));
  if (num === 0) return 'Zero Rupees Only';

  const parts = num.toFixed(2).split('.');
  let rupees = parseInt(parts[0], 10);
  const paisa = parseInt(parts[1], 10);

  let result = '';

  if (rupees >= 10000000) {
    const crore = Math.floor(rupees / 10000000);
    result += convertHundred(crore) + ' Crore ';
    rupees %= 10000000;
  }
  if (rupees >= 100000) {
    const lakh = Math.floor(rupees / 100000);
    result += convertHundred(lakh) + ' Lakh ';
    rupees %= 100000;
  }
  if (rupees >= 1000) {
    const thousand = Math.floor(rupees / 1000);
    result += convertHundred(thousand) + ' Thousand ';
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertHundred(rupees) + ' ';
  }

  result = result.trim();
  let finalStr = result ? result + ' Rupees' : '';
  if (paisa > 0) {
    finalStr += (finalStr ? ' and ' : '') + convertHundred(paisa) + ' Paisa';
  }

  return (finalStr + ' Only').trim();
}

function toNepaliNumber(numStr) {
  if (numStr === null || numStr === undefined) return '';
  return String(numStr).replace(/\d/g, d => nepaliDigits[d]);
}

module.exports = {
  amountToNepaliWords,
  amountToEnglishWords,
  toNepaliNumber
};
