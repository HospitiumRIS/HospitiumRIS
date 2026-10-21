import { maskEmail, maskPhone, maskName, maskDonor, resolveIncomingPii } from './dp-test.mjs';
const cases = [
  ['email', maskEmail('joy.owango@gmail.com')],
  ['email short', maskEmail('a@tcc.africa')],
  ['phone intl', maskPhone('+254 712 345 678')],
  ['phone local', maskPhone('0712345678')],
  ['phone short', maskPhone('5551234')],
  ['name individual', maskName('Joy Owango', 'Individual')],
  ['name no type', maskName('Dr. Stephen Gaikia', null)],
  ['name hyphen', maskName('Mary-Anne Wanjiku', 'Individual')],
  ['name corporate', maskName('Safaricom Foundation', 'Corporate')],
  ['name foundation', maskName('Gates Foundation', 'Foundation')],
  ['keep stored on masked', resolveIncomingPii('j***@gmail.com', 'joy@gmail.com')],
  ['accept new value', resolveIncomingPii('new@x.org', 'joy@gmail.com')],
];
cases.forEach(([k, v]) => console.log(k.padEnd(22), JSON.stringify(v)));
console.log(JSON.stringify(maskDonor({ id: 'd1', donorName: 'Jane Doe', donorEmail: 'jane@x.com', donorPhone: '+1 202 555 0147', donorType: 'Individual', isAnonymous: false, displayName: 'Jane Doe' })));
console.log(JSON.stringify(maskDonor({ id: 'd2', donorName: 'Secret', donorEmail: 's@x.com', isAnonymous: true })));
