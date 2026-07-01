const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const filNewsPage = {
  title: 'Balita at Mga Update',
  subtitle:
    'Manatiling may alam tungkol sa pinakabagong pag-unlad, feature, at mga anunsyo mula sa HospitiumRIS',
  read_more: 'Magbasa Pa',
  published: 'Na-publish',
  category: 'Kategorya',
  author: 'May-akda',
  no_news: 'Walang available na artikulo ng balita',
  back: 'Balita',
  press_release: 'Pahayag sa Midya',
  share_title: 'Ibahagi ang artikulong ito',
  for_more_info: 'Para sa Karagdagang Impormasyon',
  pr_team: 'Koponan sa Ugnayang Pampubliko',
  tcc_name: 'Training Centre in Communication',
  faculty: 'Faculty of Science Technology and Innovation',
  building: 'Gecaga Institute Bldg., University of Nairobi',
  landline: 'Telepono (landline):',
  email_label: 'Email:',
  website_label: 'Website:',
  share_twitter: 'X / Twitter',
  share_linkedin: 'LinkedIn',
  share_facebook: 'Facebook',
  share_email: 'Email',
  share_email_subject: 'Ipinakilala ng TCC Africa ang HospitiumRIS',
  share_email_body:
    'Basahin ang buong press release: https://hospitium.hospitiumris.org/news/tcc-africa-introduces-hospitiumris',
  share_tweet_text:
    'Ipinakilala ng TCC Africa ang HospitiumRIS upang Palakasin ang Pamamahala ng Pananaliksik at Pagpreserba ng Kaalaman sa mga Institusyon ng Kalusugan',
  articles: {
    tcc_africa_introduces_hospitiumris: {
      title:
        'Ipinakilala ng TCC Africa ang HospitiumRIS upang Palakasin ang Pamamahala ng Pananaliksik at Pagpreserba ng Kaalaman sa mga Institusyon ng Kalusugan',
      excerpt:
        'Inilunsad ng TCC Africa ang HospitiumRIS, isang komprehensibong platform na idinisenyo upang palakasin ang pamamahala ng pananaliksik at mapreserba ang kaalamang institusyonal sa mga institusyon ng kalusugan sa buong Africa.',
      category: 'Pahayag sa Midya',
      author: 'TCC Africa',
    },
  },
  article_tcc: {
    p1_prefix: '',
    tcc_link: 'Training Centre in Communication (TCC Africa)',
    p1_mid: ' ay ipinakilala ang ',
    hospitium_link: 'HospitiumRIS',
    p1_suffix:
      ', isang bukas na sistema ng impormasyon at pamamahala ng pananaliksik na idinisenyo upang suportahan ang mga ospital, institusyon ng kalusugan, at kapaligiran ng pananaliksik sa kalusugan sa pag-oorganisa, pagsubaybay, at pamamahala ng mga aktibidad sa pananaliksik sa loob ng sentralisadong imprastrukturang digital.',
    p2:
      'Ang HospitiumRIS ay idinisenyo upang tulungan ang mga institusyon ng kalusugan at pananaliksik na mapabuti ang pamamahala ng mga proyekto sa pananaliksik, pag-aaral sa kalusugan, publikasyon, dataset, proseso ng pagsunod sa regulasyon, at kaalamang institusyonal. Pinapalakas ng platform ang pag-uulat ng institusyon, pagpapakita ng pananaliksik, pamamahala ng metadata, at pangmatagalang pagpreserba ng mga output na pang-akademiko at pang-klinika, habang sinusuportahan ang pamamahala sa pananaliksik, kahandaan sa pag-audit, at kakayahang makipag-ugnayan sa pandaigdigang kapaligiran ng pananaliksik.',
    p3:
      'Habang lalong dumarami ang data ng pananaliksik at kalusugan na nililikha ng mga institusyon ng kalusugan, marami pa rin ang humaharap sa mga hamon na may kaugnayan sa naka-fragmentong sistema ng pamamahala ng pananaliksik, limitadong pagpapakita ng output ng institusyon, hindi pare-parehong kasanayan sa metadata, at kahirapan sa pagpreserba ng alaala ng institusyon sa paglipas ng panahon. Tinutugunan ng HospitiumRIS ang mga puwang na ito sa pamamagitan ng pinagsamang imprastruktura na nagse-sentro sa administrasyon ng pananaliksik at mga proseso ng pamamahala ng kaalaman.',
    p4:
      'Pinapayagan ng platform ang mga institusyon na pamahalaan ang mga proyekto sa pananaliksik, protocol, at pag-apruba; magsagawa ng pagsulat ng akademikong proposal at proposal ng proyekto nang magkasama; subaybayan ang mga publikasyon, dataset, pag-aaral sa kalusugan, at grey literature; isama ang mga profile at kaugnayan ng mananaliksik; at suportahan ang kakayahang makipag-ugnayan sa pandaigdigang sistema ng Persistent Identifier (PID) tulad ng DOI at ORCID.',
    p5:
      'Partikular na mahalaga ang HospitiumRIS para sa mga ospital na pangturo at rerefer, ospital ng unibersidad, instituto ng pananaliksik sa medisina, organisasyon ng pampublikong kalusugan, kapaligiran ng pagsubok sa kalusugan, at mga sentro ng pananaliksik sa kalusugan na nagnanais palakasin ang koordinasyon sa pananaliksik, pagsunod sa regulasyon, at pagpapakita ng akademikong gawa.',
    p6:
      'Sa konsepto, gumagana ang HospitiumRIS bilang Sistema ng Impormasyon sa Pananaliksik (RIS) na nakatuon sa kalusugan, na nagsasama ng administrasyon ng pananaliksik, mga repository ng institusyon, pamamahala ng metadata, analitika ng pananaliksik, pagpreserba ng kaalaman, at imprastrukturang pang-akademiko na may PID sa iisang kapaligiran.',
    p7:
      'Ayon sa TCC Africa, ipinapakita ng HospitiumRIS ang mas malawak na pagtatalaga ng organisasyon na palakasin ang imprastruktura ng pananaliksik at kaalaman ng Africa sa pamamagitan ng mga bukas, magkakaugnay, at institusyon ang nagtutulak na digital na solusyon na nagpapabuti sa pagpapakita, pamamahala, at pangmatagalang pagpreserba ng mga output ng pananaliksik.',
    p8:
      'Sa pamamagitan ng pagsuporta sa pamamahala ng siklo ng buhay ng pananaliksik at pagpapalakas ng mga kapaligiran ng pananaliksik ng institusyon, layunin ng HospitiumRIS na tulungan ang mga institusyon ng kalusugan na mapabuti ang kahusayan sa operasyon, mapalakas ang kolaborasyon, palakasin ang integridad ng pananaliksik, at tiyakin na ang mahalagang siyentipiko at klinikal na kaalaman ay manatiling madiskubre, naa-access, at magagamit muli para sa mga susunod na henerasyon.',
  },
};

const myArticle = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'my-article-tcc.json'), 'utf8')
);

const myPath = path.join(root, 'public/locales/my.json');
const my = JSON.parse(fs.readFileSync(myPath, 'utf8'));

const research = myArticle.article_tcc.p2.match(/သုတ[^\s]+/)[0].replace(/[,၊]/g, '');
myArticle.article_tcc.p5 =
  `HospitiumRIS သည် သင်ကြားရေးနှင့် လွှဲပြောင်းဆေးရုံများ၊ တက္ကသိုလ်ဆေးရုံများ၊ ဆေးဘက်ဆိုင်ရာ ${research} အဖွဲ့အစည်းများ၊ ပြည်သူ့ကျန်းမာရေး အဖွဲ့အစည်းများ၊ လူနာအခြေပြု ${research} စမ်းသပ်မှု နယ်ပယ်များနှင့် ကျန်းမာရေး ${research} အဖွဲ့အစည်းများအတွက် ${research} ညှိနှိုင်းမှု၊ စည်းမျဉ်း လိုက်နာမှုနှင့် ပညာရပ်မြင်သာမှုကို မြှင့်တင်လိုသူများအတွက် အထူးသင့်လျော်သည်။`;

my.news_page.subtitle = myArticle.subtitle;
my.news_page.articles.tcc_africa_introduces_hospitiumris.excerpt = myArticle.excerpt;
my.news_page.article_tcc = myArticle.article_tcc;

function apply(locale, newsPage) {
  const localePath = path.join(root, 'public/locales', `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  data.news_page = newsPage;
  fs.writeFileSync(localePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${locale}.json`);
}

apply('fil', filNewsPage);
apply('my', my.news_page);

console.log('my p5:', my.news_page.article_tcc.p5);
