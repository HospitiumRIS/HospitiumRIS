const fs = require('fs');
const path = require('path');

const EXTRA = {
  ar: {
    registered_with: 'تم تسجيل الحساب باستخدام:',
    whats_next: 'ما الخطوة التالية؟',
    whats_next_desc: 'حسابك جاهز للاستخدام! انقر على الزر أدناه لتسجيل الدخول والبدء في استخدام Hospitium RIS.',
    login_hint: 'يمكنك الآن تسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور',
  },
  de: {
    registered_with: 'Konto registriert mit:',
    whats_next: 'Was kommt als Nächstes?',
    whats_next_desc: 'Ihr Konto ist einsatzbereit! Klicken Sie auf die Schaltfläche unten, um sich anzumelden und Hospitium RIS zu nutzen.',
    login_hint: 'Sie können sich jetzt mit Ihrer E-Mail-Adresse und Ihrem Passwort anmelden',
  },
  es: {
    registered_with: 'Cuenta registrada con:',
    whats_next: '¿Qué sigue?',
    whats_next_desc: '¡Su cuenta está lista! Haga clic en el botón de abajo para iniciar sesión y comenzar a usar Hospitium RIS.',
    login_hint: 'Ahora puede iniciar sesión con su correo electrónico y contraseña',
  },
  fil: {
    registered_with: 'Nakarehistro ang account gamit ang:',
    whats_next: 'Ano ang Susunod?',
    whats_next_desc: 'Handa nang gamitin ang iyong account! I-click ang button sa ibaba para mag-login at simulan ang Hospitium RIS.',
    login_hint: 'Maaari ka nang mag-login gamit ang iyong email at password',
  },
  fr: {
    registered_with: 'Compte enregistré avec :',
    whats_next: 'Et ensuite ?',
    whats_next_desc: 'Votre compte est prêt ! Cliquez sur le bouton ci-dessous pour vous connecter et commencer à utiliser Hospitium RIS.',
    login_hint: 'Vous pouvez maintenant vous connecter avec votre e-mail et votre mot de passe',
  },
  hi: {
    registered_with: 'खाता इसके साथ पंजीकृत:',
    whats_next: 'आगे क्या?',
    whats_next_desc: 'आपका खाता उपयोग के लिए तैयार है! लॉगिन करने और Hospitium RIS का उपयोग शुरू करने के लिए नीचे दिए गए बटन पर क्लिक करें।',
    login_hint: 'अब आप अपने ईमेल और पासवर्ड से लॉगिन कर सकते हैं',
  },
  id: {
    registered_with: 'Akun terdaftar dengan:',
    whats_next: 'Langkah Selanjutnya?',
    whats_next_desc: 'Akun Anda siap digunakan! Klik tombol di bawah untuk login dan mulai menggunakan Hospitium RIS.',
    login_hint: 'Anda sekarang dapat login dengan email dan kata sandi Anda',
  },
  km: {
    registered_with: 'គណនីបានចុះឈ្មោះជាមួយ:',
    whats_next: 'ជំហានបន្ទាប់?',
    whats_next_desc: 'គណនីរបស់អ្នកត្រៀមប្រើប្រាស់แล้ว! ចុចប៊ូតុងខាងក្រោមដើម្បីចូល និងចាប់ផ្តើមប្រើ Hospitium RIS។',
    login_hint: 'អ្នកអាចចូលដោយប្រើអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក',
  },
  ko: {
    registered_with: '다음으로 등록된 계정:',
    whats_next: '다음 단계는?',
    whats_next_desc: '계정을 사용할 준비가 되었습니다! 아래 버튼을 클릭하여 로그인하고 Hospitium RIS를 사용하세요.',
    login_hint: '이제 이메일과 비밀번호로 로그인할 수 있습니다',
  },
  lo: {
    registered_with: 'ບັນຊີລົງທະບຽນດ້ວຍ:',
    whats_next: 'ຂັ້ນຕອນຕໍ່ໄປ?',
    whats_next_desc: 'ບັນຊີຂອງທ່ານພ້ອມໃຊ້ງານແລ້ວ! ກົດປຸ່ມຂ້າງລຸ່ມເພື່ອເຂົ້າສູ່ລະບົບ ແລະ ເລີ່ມໃຊ້ Hospitium RIS.',
    login_hint: 'ຕອນນີ້ທ່ານສາມາດເຂົ້າສູ່ລະບົບດ້ວຍອີເມວ ແລະ ລະຫັດຜ່ານຂອງທ່ານ',
  },
  ms: {
    registered_with: 'Akaun didaftarkan dengan:',
    whats_next: 'Apa Seterusnya?',
    whats_next_desc: 'Akaun anda sedia untuk digunakan! Klik butang di bawah untuk log masuk dan mula menggunakan Hospitium RIS.',
    login_hint: 'Anda kini boleh log masuk dengan e-mel dan kata laluan anda',
  },
  my: {
    registered_with: 'အောက်ပါအခြေခံစနစ်ဖြင့် အကောင့်မှတ်ပုံတင်ပြီးပါပြီ:',
    whats_next: 'နောက်တဆင့်မှာ ဘာလုပ်မလဲ?',
    whats_next_desc: 'သင့်အကောင့် အသုံးပြုရန် အဆင်သင့်ဖြစ်ပါပြီ! အောက်ပါ ခ dütton ကို နှိပ်ပြီး လော့ဂ်အင်ဝင်ကာ Hospitium RIS ကို စတင်အသုံးပြုပါ။',
    login_hint: 'ယခု သင့်အီးမေးလ်နှင့် စကားဝှက်ဖြင့် လော့ဂ်အင်ဝင်နိုင်ပါပြီ',
  },
  pt: {
    registered_with: 'Conta registrada com:',
    whats_next: 'Próximos passos?',
    whats_next_desc: 'Sua conta está pronta! Clique no botão abaixo para fazer login e começar a usar o Hospitium RIS.',
    login_hint: 'Agora você pode fazer login com seu e-mail e senha',
  },
  sw: {
    registered_with: 'Akaunti imesajiliwa na:',
    whats_next: 'Hatua Inayofuata?',
    whats_next_desc: 'Akaunti yako iko tayari kutumika! Bonyeza kitufe hapa chini kuingia na kuanza kutumia Hospitium RIS.',
    login_hint: 'Sasa unaweza kuingia kwa barua pepe na neno lako la siri',
  },
  tet: {
    registered_with: 'Konta rejistadu ho:',
    whats_next: 'Sa maké?',
    whats_next_desc: 'Ita-boot nia konta prontu atu uza! Klik botão iha ne\'e atu login no hahú uza Hospitium RIS.',
    login_hint: 'Agora ita-boot bele login ho ita-boot nia email no password',
  },
  th: {
    registered_with: 'ลงทะเบียนบัญชีด้วย:',
    whats_next: 'ขั้นตอนถัดไป?',
    whats_next_desc: 'บัญชีของคุณพร้อมใช้งานแล้ว! คลิกปุ่มด้านล่างเพื่อเข้าสู่ระบบและเริ่มใช้ Hospitium RIS',
    login_hint: 'ตอนนี้คุณสามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านของคุณ',
  },
  vi: {
    registered_with: 'Tài khoản đã đăng ký với:',
    whats_next: 'Tiếp theo?',
    whats_next_desc: 'Tài khoản của bạn đã sẵn sàng! Nhấp vào nút bên dưới để đăng nhập và bắt đầu sử dụng Hospitium RIS.',
    login_hint: 'Bạn có thể đăng nhập bằng email và mật khẩu của mình',
  },
  zh: {
    registered_with: '账户注册方式：',
    whats_next: '下一步是什么？',
    whats_next_desc: '您的账户已就绪！点击下方按钮登录并开始使用 Hospitium RIS。',
    login_hint: '您现在可以使用电子邮件和密码登录',
  },
};

const localesDir = path.join(__dirname, '..', 'public', 'locales');

for (const [locale, keys] of Object.entries(EXTRA)) {
  const filePath = path.join(localesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  data.register_success = { ...data.register_success, ...keys };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${locale}.json`);
}

console.log('Done.');
