const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const CONSUMER_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'ymail.com',
  'rocketmail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'outlook.co.uk',
  'live.com',
  'live.co.uk',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'aim.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'zoho.com',
  'zohomail.com',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'mail.com',
  'email.com',
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'inbox.ru',
  'list.ru',
  'bk.ru',
  'tutanota.com',
  'tuta.io',
  'fastmail.com',
  'fastmail.fm',
  'hey.com',
  'inbox.com',
  'rediffmail.com',
  'qq.com',
  '163.com',
  '126.com',
  'naver.com',
  'daum.net',
  'hanmail.net',
  'web.de',
  't-online.de',
  'orange.fr',
  'wanadoo.fr',
  'free.fr',
  'libero.it',
  'virgilio.it',
]);

export function extractEmailDomain(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null;
  }
  return email.split('@')[1]?.toLowerCase().trim() || null;
}

export function isConsumerEmailDomain(email) {
  const domain = extractEmailDomain(email);
  if (!domain) return false;
  if (CONSUMER_EMAIL_DOMAINS.has(domain)) return true;

  // Block regional consumer domains such as yahoo.co.in or hotmail.fr
  const [provider, ...rest] = domain.split('.');
  const consumerProviders = new Set([
    'gmail',
    'googlemail',
    'yahoo',
    'ymail',
    'hotmail',
    'outlook',
    'icloud',
    'protonmail',
    'aol',
  ]);
  if (consumerProviders.has(provider) && rest.length >= 1) {
    return true;
  }
  return false;
}

export function isValidEmailFormat(email) {
  return EMAIL_REGEX.test(email);
}

export function isInstitutionalEmail(email) {
  if (!isValidEmailFormat(email)) return false;
  return !isConsumerEmailDomain(email);
}

export function getInstitutionalEmailError(email) {
  const trimmed = typeof email === 'string' ? email.trim() : '';
  if (!trimmed) {
    return 'Institution email is required';
  }
  if (!isValidEmailFormat(trimmed)) {
    return 'Enter a valid email address';
  }
  if (isConsumerEmailDomain(trimmed)) {
    return 'Personal email providers (Gmail, Yahoo, Outlook, and similar) are not allowed. Use an institution email.';
  }
  return null;
}

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}
