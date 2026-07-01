'use strict';

const fs = require('fs');
const path = require('path');

const en = require('../public/locales/en.json');
const AUTH_KEYS = Object.keys(en.auth);
const OUT = path.join(__dirname, 'locale-auth-translations-data.js');

const COMMON_REGISTER = {
  ar: { reg_create_password: 'إنشاء كلمة المرور', reg_confirm_password: 'تأكيد كلمة المرور', reg_password: 'كلمة المرور', foundation_admin: 'مسؤول المؤسسة', researcher: 'باحث' },
  de: { reg_create_password: 'Passwort erstellen', reg_confirm_password: 'Passwort bestätigen', reg_password: 'Passwort', foundation_admin: 'Stiftungsadministrator', researcher: 'Forscher' },
  es: { reg_create_password: 'Crear contraseña', reg_confirm_password: 'Confirmar contraseña', reg_password: 'Contraseña', foundation_admin: 'Administrador de fundación', researcher: 'Investigador' },
  fil: { reg_create_password: 'Gumawa ng Password', reg_confirm_password: 'Kumpirmahin ang Password', reg_password: 'Password', foundation_admin: 'Tagapangasiwa ng Pundasyon', researcher: 'Mananaliksik' },
  fr: { reg_create_password: 'Créer un mot de passe', reg_confirm_password: 'Confirmer le mot de passe', reg_password: 'Mot de passe', foundation_admin: 'Administrateur de fondation', researcher: 'Chercheur' },
  hi: { reg_create_password: 'पासवर्ड बनाएं', reg_confirm_password: 'पासवर्ड की पुष्टि करें', reg_password: 'पासवर्ड', foundation_admin: 'फाउंडेशन प्रशासक', researcher: 'शोधकर्ता' },
  id: { reg_create_password: 'Buat Kata Sandi', reg_confirm_password: 'Konfirmasi Kata Sandi', reg_password: 'Kata Sandi', foundation_admin: 'Administrator Yayasan', researcher: 'Peneliti' },
  km: { reg_create_password: 'បង្កើតពាក្យសម្ងាត់', reg_confirm_password: 'បញ្ជាក់ពាក្យសម្ងាត់', reg_password: 'ពាក្យសម្ងាត់', foundation_admin: 'អ្នកគ្រប់គ្រងមូលនិធិ', researcher: 'អ្នកស្រាវជ្រាវ' },
  ko: { reg_create_password: '비밀번호 만들기', reg_confirm_password: '비밀번호 확인', reg_password: '비밀번호', foundation_admin: '재단 관리자', researcher: '연구자' },
  lo: { reg_create_password: 'ສ້າງລະຫັດຜ່ານ', reg_confirm_password: 'ຢືນຢັນລະຫັດຜ່ານ', reg_password: 'ລະຫັດຜ່ານ', foundation_admin: 'ຜູ້ບໍລິຫານມູນນິທິ', researcher: 'ນັກຄົ້ນຄວ້າ' },
  ms: { reg_create_password: 'Cipta Kata Laluan', reg_confirm_password: 'Sahkan Kata Laluan', reg_password: 'Kata Laluan', foundation_admin: 'Pentadbir Yayasan', researcher: 'Penyelidik' },
  my: { reg_create_password: 'စကားဝှက်ဖန်တီးရန်', reg_confirm_password: 'စကားဝှက်အတည်ပြုရန်', reg_password: 'စကားဝှက်', foundation_admin: 'ဖောင်ဒေးရှင်းစီမံခန့်ခွဲသူ', researcher: 'သုတေသီ' },
  pt: { reg_create_password: 'Criar senha', reg_confirm_password: 'Confirmar senha', reg_password: 'Senha', foundation_admin: 'Administrador de fundação', researcher: 'Pesquisador' },
  tet: { reg_create_password: 'Kria Password', reg_confirm_password: 'Konfirma Password', reg_password: 'Password', foundation_admin: 'Administrador Fundasaun', researcher: 'Peskador' },
  th: { reg_create_password: 'สร้างรหัสผ่าน', reg_confirm_password: 'ยืนยันรหัสผ่าน', reg_password: 'รหัสผ่าน', foundation_admin: 'ผู้ดูแลมูลนิธิ', researcher: 'นักวิจัย' },
  vi: { reg_create_password: 'Tạo mật khẩu', reg_confirm_password: 'Xác nhận mật khẩu', reg_password: 'Mật khẩu', foundation_admin: 'Quản trị viên quỹ', researcher: 'Nhà nghiên cứu' },
  zh: { reg_create_password: '创建密码', reg_confirm_password: '确认密码', reg_password: '密码', foundation_admin: '基金会管理员', researcher: '研究人员' },
};

const REGISTER_SUCCESS = {
  ar: { title: 'تم التسجيل بنجاح!', subtitle: 'تم إنشاء حسابك. يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.', check_email: 'تحقق من بريدك الإلكتروني', resend: 'إعادة إرسال بريد التفعيل', login: 'العودة إلى تسجيل الدخول' },
  de: { title: 'Registrierung erfolgreich!', subtitle: 'Ihr Konto wurde erstellt. Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu aktivieren.', check_email: 'E-Mail überprüfen', resend: 'Aktivierungs-E-Mail erneut senden', login: 'Zurück zur Anmeldung' },
  es: { title: '¡Registro exitoso!', subtitle: 'Su cuenta ha sido creada. Revise su correo electrónico para activar su cuenta.', check_email: 'Revise su correo electrónico', resend: 'Reenviar correo de activación', login: 'Volver al inicio de sesión' },
  fil: { title: 'Matagumpay ang Pagrehistro!', subtitle: 'Nagawa na ang iyong account. Pakitingnan ang iyong email upang i-activate ang account.', check_email: 'Tingnan ang Iyong Email', resend: 'Ipadala Muli ang Activation Email', login: 'Bumalik sa Login' },
  fr: { title: 'Inscription réussie !', subtitle: 'Votre compte a été créé. Veuillez vérifier votre e-mail pour activer votre compte.', check_email: 'Vérifiez votre e-mail', resend: 'Renvoyer l\'e-mail d\'activation', login: 'Retour à la connexion' },
  hi: { title: 'पंजीकरण सफल!', subtitle: 'आपका खाता बनाया गया है। कृपया अपना खाता सक्रिय करने के लिए अपना ईमेल जांचें।', check_email: 'अपना ईमेल जांचें', resend: 'सक्रियण ईमेल पुनः भेजें', login: 'लॉगिन पर वापस जाएं' },
  id: { title: 'Pendaftaran Berhasil!', subtitle: 'Akun Anda telah dibuat. Silakan periksa email Anda untuk mengaktifkan akun.', check_email: 'Periksa Email Anda', resend: 'Kirim Ulang Email Aktivasi', login: 'Kembali ke Login' },
  km: { title: 'ការចុះឈ្មោះបានជោគជ័យ!', subtitle: 'គណនីរបស់អ្នកត្រូវបានបង្កើត។ សូមពិនិត្យអ៊ីមែលរបស់អ្នកដើម្បីធ្វើឱ្យគណនីសកម្ម។', check_email: 'ពិនិត្យអ៊ីមែលរបស់អ្នក', resend: 'ផ្ញើអ៊ីមែលធ្វើឱ្យសកម្មម្តងទៀត', login: 'ត្រឡប់ទៅចូល' },
  ko: { title: '등록 성공!', subtitle: '계정이 생성되었습니다. 이메일을 확인하여 계정을 활성화하세요.', check_email: '이메일 확인', resend: '활성화 이메일 재전송', login: '로그인으로 돌아가기' },
  lo: { title: 'ລົງທະບຽນສຳເລັດ!', subtitle: 'ບັນຊີຂອງທ່ານຖືກສ້າງແລ້ວ. ກະລຸນາກວດເບິ່ງອີເມວເພື່ອເປີດໃຊ້ບັນຊີ.', check_email: 'ກວດເບິ່ງອີເມວຂອງທ່ານ', resend: 'ສົ່ງອີເມວເປີດໃຊ້ອີກຄັ້ງ', login: 'ກັບໄປໜ້າເຂົ້າສູ່ລະບົບ' },
  ms: { title: 'Pendaftaran Berjaya!', subtitle: 'Akaun anda telah dicipta. Sila semak e-mel anda untuk mengaktifkan akaun.', check_email: 'Semak E-mel Anda', resend: 'Hantar Semula E-mel Pengaktifan', login: 'Kembali ke Log Masuk' },
  my: { title: 'မှတ်ပုံတင်ခြင်း အောင်မြင်ပါသည်!', subtitle: 'သင့်အကောင့်ကို ဖန်တီးပြီးပါပြီ။ အကောင့်ကို အသက်သွင်းရန် အီးမေးလ်ကို စစ်ဆေးပါ။', check_email: 'သင့်အီးမေးလ်ကို စစ်ဆေးပါ', resend: 'အသက်သွင်းအီးမေးလ် ပြန်ပို့ရန်', login: 'လော့ဂ်အင်သို့ ပြန်သွားရန်' },
  pt: { title: 'Registro bem-sucedido!', subtitle: 'Sua conta foi criada. Verifique seu e-mail para ativar sua conta.', check_email: 'Verifique seu e-mail', resend: 'Reenviar e-mail de ativação', login: 'Voltar ao login' },
  tet: { title: 'Rejistu Susesu!', subtitle: 'Ita-boot nia konta kriado ona. Favor hare ita-boot nia email atu ativa konta.', check_email: 'Hare Ita-boot nia Email', resend: 'Haruka Fila Email Ativasaun', login: 'Fila ba Login' },
  th: { title: 'ลงทะเบียนสำเร็จ!', subtitle: 'บัญชีของคุณถูกสร้างแล้ว กรุณาตรวจสอบอีเมลเพื่อเปิดใช้งานบัญชี', check_email: 'ตรวจสอบอีเมลของคุณ', resend: 'ส่งอีเมลเปิดใช้งานอีกครั้ง', login: 'กลับไปหน้าเข้าสู่ระบบ' },
  vi: { title: 'Đăng ký thành công!', subtitle: 'Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để kích hoạt tài khoản.', check_email: 'Kiểm tra email của bạn', resend: 'Gửi lại email kích hoạt', login: 'Quay lại đăng nhập' },
  zh: { title: '注册成功！', subtitle: '您的账户已创建。请检查您的电子邮件以激活账户。', check_email: '检查您的电子邮件', resend: '重新发送激活邮件', login: '返回登录' },
};

const LOCALES = [
  'ar', 'de', 'es', 'fil', 'fr', 'hi', 'id', 'km', 'ko', 'lo', 'ms', 'my', 'pt', 'tet', 'th', 'vi', 'zh',
];

const BUNDLE_DIR = path.join(__dirname, 'locale-auth-bundles');

const translations = {};
for (const code of LOCALES) {
  const bundlePath = path.join(BUNDLE_DIR, `${code}.json`);
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Missing bundle file: ${bundlePath}`);
  }
  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  if (!bundle.auth) {
    throw new Error(`Bundle ${code}.json missing auth section`);
  }
  const authKeys = Object.keys(bundle.auth);
  if (authKeys.length !== AUTH_KEYS.length) {
    throw new Error(`${code}: auth has ${authKeys.length} keys, expected ${AUTH_KEYS.length}`);
  }
  for (const key of AUTH_KEYS) {
    if (!(key in bundle.auth)) {
      throw new Error(`${code}: missing auth key ${key}`);
    }
  }
  if (!COMMON_REGISTER[code]) {
    throw new Error(`Missing COMMON_REGISTER for ${code}`);
  }
  if (!REGISTER_SUCCESS[code]) {
    throw new Error(`Missing REGISTER_SUCCESS for ${code}`);
  }
  translations[code] = {
    auth: bundle.auth,
    common_register: COMMON_REGISTER[code],
    register_success: REGISTER_SUCCESS[code],
  };
}

const output = `'use strict';\n\n/** Auth/register translation bundles for 17 locales. */\nconst translations = ${JSON.stringify(translations, null, 2)};\n\nmodule.exports = translations;\nObject.defineProperty(module.exports, 'default', { value: translations, enumerable: false });\n`;

fs.writeFileSync(OUT, output, 'utf8');
console.log(`Wrote ${OUT} with ${LOCALES.length} locales`);
