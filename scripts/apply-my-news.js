const fs = require('fs');
const path = require('path');

const newsPage = {
  title: 'သတင်းများနှင့် အပ်ဒိတ်များ',
  subtitle:
    'HospitiumRIS ၏ နောက်ဆုံးပေါ် development များ၊ features များနှင့် ကြေညာချက်များကို update ရယူပါ',
  read_more: 'ဆက်ဖတ်ရန်',
  published: 'ထုတ်ဝေသည့်ရက်',
  category: 'အမျိုးအစား',
  author: 'ရေးသားသူ',
  no_news: 'သတင်းဆောင်းပါးများ မရှိပါ',
  back: 'သတင်းများ',
  press_release: 'သတင်းထုတ်ပြန်ချက်',
  share_title: 'ဤဆောင်းပါးကို မျှဝေရန်',
  for_more_info: 'နောက်ထပ်အချက်အလက်',
  pr_team: 'ပြည်သူ့ဆက်ဆံရေးအဖွဲ့',
  tcc_name: 'Training Centre in Communication',
  faculty: 'Faculty of Science Technology and Innovation',
  building: 'Gecaga Institute Bldg., University of Nairobi',
  landline: 'ဖုန်းလိုင်း:',
  email_label: 'အီးမေးလ်:',
  website_label: 'ဝဘ်ဆိုက်:',
  share_twitter: 'X / Twitter',
  share_linkedin: 'LinkedIn',
  share_facebook: 'Facebook',
  share_email: 'အီးမေးလ်',
  share_email_subject: 'TCC Africa မှ HospitiumRIS ကို မိတ်ဆက်',
  share_email_body:
    'သတင်းထုတ်ပြန်ချက်အပြည့်အစုံ ဖတ်ရန်: https://hospitium.hospitiumris.org/news/tcc-africa-introduces-hospitiumris',
  share_tweet_text:
    'TCC Africa မှ HospitiumRIS ကို ကျန်းမာရေးအဖွဲ့အစည်းများတွင် သုတေသနစီမံခန့်ခွဲမှုနှင့် အသိပညာသိမ်းဆည်းခြင်းကို မြှင့်တင်ရန် မိတ်ဆက်',
  articles: {
    tcc_africa_introduces_hospitiumris: {
      title:
        'TCC Africa မှ HospitiumRIS ကို ကျန်းမာရေးအဖွဲ့အစည်းများတွင် သုတေသနစီမံခန့်ခွဲမှုနှင့် အသိပညာသိမ်းဆည်းခြင်းကို မြှင့်တင်ရန် မိတ်ဆက်',
      excerpt:
        'TCC Africa သည် Africa အနှံ့ရှိ ကျန်းမာရေးအဖွဲ့အစည်းများတွင် သုတေသနစီမံခန့်ခွဲမှုကို မြှင့်တင်ပြီး အဖွဲ့အစည်းအသိပညာကို သိမ်းဆည်းရန် ဒီဇိုင်းထုတ်ထားသော comprehensive platform HospitiumRIS ကို မိတ်ဆက်ခဲ့သည်။',
      category: 'သတင်းထုတ်ပြန်ချက်',
      author: 'TCC Africa',
    },
  },
  article_tcc: {
    p1_prefix: '',
    tcc_link: 'Training Centre in Communication (TCC Africa)',
    p1_mid: ' မှ ',
    hospitium_link: 'HospitiumRIS',
    p1_suffix:
      ', ဆေးရုံများ၊ ကျန်းမာရေးအဖွဲ့အစည်းများနှင့် clinical research environments များအား centralized digital infrastructure တစ်ခုအတွင်း သုတေသလုပ်ငန်းစဉ်များကို စီစဉ်၊ ခြေရာခံနှင့် စီမံခန့်ခွဲနိုင်ရန် ဒီဇိုင်းထုတ်ထားသော open research information and management system တစ်ခုဖြစ်သည်။',
    p2:
      'HospitiumRIS သည် ကျန်းမာရေးနှင့် သုတေသန အဖွဲ့အစည်းများအား သုတေသန project များ၊ clinical studies၊ publications၊ datasets၊ compliance processes နှင့် institutional knowledge စီမံခန့်ခွဲမှုကို တိုးတက်စေရန် ဒီဇိုင်းထုတ်ထားသည်။ Platform သည် institutional reporting၊ research visibility၊ metadata management နှင့် scholarly and clinical outputs ၏ long-term preservation ကို မြှင့်တင်ပြီး research governance၊ audit readiness နှင့် global research ecosystems တွင် interoperability ကို support ပေးသည်။',
    p3:
      'ကျန်းမာရေးအဖွဲ့အစည်းများသည် သုတေသနနှင့် clinical data ကို ပိုမိုများပြားစွာ ထုတ်လုပ်လာသည့်အခါ အများစုသည် ခွဲထွက်နေသော research management systems၊ institutional outputs ၏ limited visibility၊ inconsistent metadata practices နှင့် institutional memory ကို ရေရှည်သိမ်းဆည်းရာတွင် ခက်ခဲမှုများကို ကြုံတွေ့နေရသည်။ HospitiumRIS သည် research administration နှင့် knowledge management processes များကို centralized လုပ်သော unified infrastructure ဖြင့် ဤကွာဟချက်များကို ဖြေရှင်းပေးသည်။',
    p4:
      'Platform သည် အဖွဲ့အစည်းများအား research projects၊ protocols နှင့် approvals များကို manage လုပ်နိုင်စေပြီး collaborative academic and project proposal writing လုပ်ဆောင်နိုင်သည်။ publications၊ datasets၊ clinical studies နှင့် grey literature များကို track လုပ်နိုင်ပြီး researcher profiles နှင့် affiliations များကို integrate လုပ်နိုင်ကာ DOI နှင့် ORCID ကဲ့သို့သော global Persistent Identifier (PID) systems များနှင့် interoperability ကို support ပေးသည်။',
    p5:
      'HospitiumRIS သည် teaching and referral hospitals၊ university hospitals၊ medical research institutes၊ public health organizations၊ clinical trial environments နှင့် health research centers များအတွက် research coordination၊ compliance နှင့် scholarly visibility ကို strengthen လုပ်လိုသူများအတွက် especially relevant ဖြစ်သည်။',
    p6:
      'Conceptually, HospitiumRIS သည် healthcare-focused Research Information System (RIS) အဖြစ် research administration၊ institutional repositories၊ metadata management၊ research analytics၊ knowledge preservation နှင့် PID-enabled scholarly infrastructure များကို environment တစ်ခုတည်းတွင် integrate လုပ်သည်။',
    p7:
      'TCC Africa ၏ အဆိုအရ HospitiumRIS သည် open၊ interoperable နှင့် institutionally driven digital solutions များမှတစ်ဆင့် Africa ၏ research and knowledge infrastructure ကို strengthen လုပ်ရန် organization ၏ broader commitment ကို reflect လုပ်ပြီး research outputs ၏ visibility၊ governance နှင့် long-term preservation ကို improve လုပ်သည်။',
    p8:
      'Research lifecycle management ကို support လုပ်ခြင်းနှင့် institutional research ecosystems ကို strengthen လုပ်ခြင်းဖြင့် HospitiumRIS သည် healthcare institutions များအား operational efficiency improve လုပ်ရန်၊ collaboration enhance လုပ်ရန်၊ research integrity strengthen လုပ်ရန်နှင့် valuable scientific and clinical knowledge များသည် future generations အတွက် discoverable၊ accessible နှင့် reusable ဖြစ်နေစေရန် ensure လုပ်ရန် aim လုပ်သည်။',
  },
};

const myPath = path.join(__dirname, '../public/locales/my.json');
const my = JSON.parse(fs.readFileSync(myPath, 'utf8'));
my.news_page = newsPage;
fs.writeFileSync(myPath, JSON.stringify(my, null, 2) + '\n', 'utf8');
console.log('Applied my news_page translations');
