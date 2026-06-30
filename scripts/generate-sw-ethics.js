const fs = require('fs');
const path = require('path');

const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ethics-form-locale-en.json'), 'utf8')
);

const sw = {
  project_summary_alert:
    'Muhtasari wa Mradi (Muhtasari Rahisi): Toa muhtasari mfupi kwa lugha rahisi kwa hadhira isiyo na utaalamu.',
  project_overview: 'Muhtasari wa Mradi',
  study_title: 'Kichwa cha Utafiti *',
  study_title_placeholder: 'Weka kichwa kamili cha utafiti wako',
  study_title_helper: 'Tumia lugha wazi na ya kuelezea',
  lay_summary: 'Muhtasari Rahisi (Lugha ya Kawaida) *',
  lay_summary_placeholder:
    'Eleza utafiti wako kwa maneno rahisi yanayoeleweka na kila mtu. Epuka istilahi za kiufundi.',
  lay_summary_helper: 'Andika kwa hadhira ya jumla bila ujuzi maalum',
  research_aims: 'Malengo ya Utafiti *',
  research_aims_placeholder: 'Utafiti huu unalenga kufikia nini? Ni maswali gani utajibu?',
  research_aims_helper: 'Eleza wazi malengo kuu',
  research_significance: 'Umuhimu wa Utafiti *',
  research_significance_placeholder:
    'Kwa nini utafiti huu ni muhimu? Ni faida gani kwa washiriki, sayansi, au jamii?',
  research_significance_helper: 'Eleza thamani na athari za utafiti huu',
  investigator_cvs_alert:
    'CV za Watafiti Zinahitajika: Lazima utoe ushahidi wa sifa na uzoefu wa timu ya utafiti.',
  principal_investigator: 'Mchunguzi Mkuu',
  full_name: 'Jina Kamili *',
  orcid_id: 'Kitambulisho cha ORCID *',
  orcid_id_optional: 'Kitambulisho cha ORCID',
  orcid_placeholder: '0000-0000-0000-0000',
  orcid_helper: 'Weka kitambulisho chako cha ORCID',
  email: 'Barua pepe *',
  phone_number: 'Nambari ya Simu *',
  institution: 'Taasisi *',
  department: 'Idara *',
  qualifications: 'Sifa na Uzoefu *',
  qualifications_placeholder: 'Eleza kwa ufupi sifa na uzoefu wako wa utafiti',
  qualifications_helper: 'Jumuisha digrii, vyeti, na uzoefu unaofaa',
  co_investigators: 'Wachunguzi Wenza',
  role: 'Jukumu',
  co_investigator_chip: '{{name}} - {{role}} (ORCID: {{orcid}})',
  scientific_validity_alert:
    'Uhalali wa Kisayansi: Onyesha kwamba muundo wa utafiti wako unaweza kujibu swali la utafiti.',
  research_design: 'Muundo na Mbinu za Utafiti',
  research_type: 'Aina ya Utafiti *',
  research_type_other: 'Tafadhali eleza aina ya utafiti *',
  research_type_clinical_trial: 'Jaribio la Kliniki',
  research_type_observational: 'Utafiti wa Uchunguzi',
  research_type_survey: 'Utafiti wa Dodosi',
  research_type_interview: 'Utafiti wa Mahojiano',
  research_type_laboratory: 'Utafiti wa Maabara',
  research_type_secondary: 'Uchambuzi wa Data ya Sekondari',
  research_type_community: 'Utafiti wa Jamii',
  research_type_other_option: 'Nyingine',
  scientific_validity: 'Uhalali wa Kisayansi *',
  scientific_validity_placeholder:
    'Eleza jinsi muundo wa utafiti wako unahakikisha utafiti unaweza kujibu swali la utafiti',
  scientific_validity_helper: 'Hakikisha mbinu na mwelekeo wako',
  research_procedures: 'Taratiibu za Utafiti *',
  research_procedures_placeholder:
    'Toa maelezo ya hatua kwa hatua ya kile washiriki wataombwa kufanya',
  research_procedures_helper: 'Kuwa mahususi kuhusu taratiibu zote zinazohusisha washiriki',
  data_analysis_plan: 'Mpango wa Uchambuzi wa Data *',
  data_analysis_plan_placeholder:
    'Eleza jinsi taarifa zilizokusanywa zitachakatwa na kufasiriwa',
  data_analysis_plan_helper: 'Jumuisha mbinu za takwimu au uchambuzi wa ubora',
  research_timeline: 'Ratiba ya Utafiti *',
  research_timeline_placeholder: 'Toa ratiba ya kina ya shughuli za utafiti wako',
  research_timeline_helper: 'Jumuisha hatua muhimu na awamu',
  study_duration: 'Muda wa Utafiti (miezi) *',
  start_date: 'Tarehe ya Kuanza *',
  end_date: 'Tarehe ya Mwisho *',
  funding_source: 'Chanzo cha Ufadhili',
  funding_source_helper: 'Acha wazi ikiwa hakuna ufadhili',
  funding_amount: 'Kiasi cha Ufadhili',
  participants_alert:
    'Muhimu: Eleza wazi nani anaweza kushiriki na haki za kujumuisha makundi walio hatarini.',
  participant_recruitment: 'Uajiri na Uchaguzi wa Washiriki',
  study_population: 'Idadi ya Watu wa Utafiti *',
  study_population_placeholder: 'Eleza idadi lengwa ya watu kwa utafiti wako',
  study_population_helper: 'Kuwa mahususi kuhusu sifa za kidemografia',
  sample_size: 'Ukubwa wa Sampuli *',
  sample_size_helper: 'Hakikisha ukubwa wa sampuli ikiwezekana',
  inclusion_criteria: 'Vigezo vya Kujumuishwa *',
  inclusion_criteria_placeholder: 'Vigezo vilivyoelezwa wazi vya nani ANAWEZA kushiriki',
  inclusion_criteria_helper: 'Orodhesha vigezo vyote washiriki lazima vikidhi',
  exclusion_criteria: 'Vigezo vya Kutengwa *',
  exclusion_criteria_placeholder: 'Vigezo vilivyoelezwa wazi vya nani HAWAWEZI kushiriki',
  exclusion_criteria_helper: 'Orodhesha vigezo vyote vya kutengwa washiriki',
  recruitment_strategy: 'Mkakati wa Uajiri *',
  recruitment_strategy_placeholder: 'Washiriki watajuliwa na kuwasiliana vipi?',
  recruitment_strategy_helper: 'Eleza njia zote za uajiri kwa undani',
  recruitment_materials: 'Maelezo ya Nyenzo za Uajiri *',
  recruitment_materials_placeholder:
    'Eleza vipeperushi, barua pepe, machapisho ya mitandao, au hati zitakazotumika',
  recruitment_materials_helper: 'Nakala za nyenzo halisi lazima ziambatanishwe',
  vulnerable_populations: 'Makundi Walio Hatarini Yanahusika *',
  vuln_children: 'Watoto (chini ya miaka 18)',
  vuln_pregnant: 'Wanawake Wajawazito',
  vuln_prisoners: 'Wafungwa',
  vuln_mental: 'Watu Wenye Ulemavu wa Akili',
  vuln_economic: 'Walio Katika Uchumi Duni',
  vuln_education: 'Walio Katika Elimu Duni',
  vulnerable_group_justification: 'Haki ya Kujumuisha Kundi Hatarini *',
  vulnerable_group_justification_placeholder:
    'Toa haki maalum ya kujumuisha makundi walio hatarini',
  vulnerable_group_justification_helper:
    'Eleza kwa nini kundi hili lazima lijumuishwe na jinsi litakavyolindwa',
  power_imbalance: 'Mazingatio ya Usawa wa Nguvu',
  power_imbalance_placeholder:
    'Ikiwa una uhusiano na washiriki, eleza jinsi utazuia kulazimishwa',
  power_imbalance_helper: 'Shughulikia uhusiano unaoweza kuathiri ushiriki wa hiari',
  third_party_permissions: 'Ruhusa za Wahusika Wengine',
  third_party_permissions_placeholder:
    'Orodhesha ruhusa zinazohitajika kutoka shule, hospitali, au mashirika mengine',
  third_party_permissions_helper: 'Barua za msaada lazima ziambatanishwe',
  informed_consent_alert:
    'Idhini ya Kujua: Onyesha kwamba washiriki wanaweza kufanya uamuzi wa hiari na wenye taarifa.',
  informed_consent_process: 'Mchakato wa Idhini ya Kujua',
  informed_consent_process_field: 'Mchakato wa Idhini ya Kujua *',
  informed_consent_process_placeholder: 'Eleza JINSI na LINI idhini itatafutwa',
  informed_consent_process_helper: 'Jumuisha maelezo kuhusu taratibu na muda wa idhini',
  capacity_assessment: 'Tathmini ya Uwezo *',
  capacity_assessment_placeholder:
    'Utathmini vipi kama mshiriki anaelewa taarifa zilizotolewa?',
  capacity_assessment_helper: 'Eleza mbinu za kuhakikisha uelewa',
  voluntary_participation: 'Taarifa ya Ushiriki wa Hiari *',
  voluntary_participation_placeholder:
    'Thibitisha kwamba ushiriki ni wa hiari kabisa na washiriki wanaweza kujiondoa wakati wowote',
  voluntary_participation_helper: 'Eleza jinsi hili litawasilishwa',
  withdrawal_process: 'Mchakato wa Kujiondoa *',
  withdrawal_process_placeholder: 'Eleza mchakato wa washiriki kujiondoa kutoka utafitini',
  withdrawal_process_helper: 'Jumuisha kinachotokea kwa data yao wakiujiondoa',
  participant_costs_compensation: 'Gharama na Malipo ya Washiriki',
  participant_costs: 'Gharama za Washiriki *',
  participant_costs_placeholder:
    "Je, washiriki watakuwa na gharama? Andika 'Hakuna' ikiwa hakuna gharama.",
  participant_costs_helper: 'Kuwa wazi kuhusu gharama zozote kwa washiriki',
  reimbursement: 'Urejeshaji',
  reimbursement_placeholder:
    'Je, washiriki watarejeshwa gharama? Eleza mchakato wa urejeshaji.',
  incentives: 'Motisha',
  incentives_placeholder:
    'Je, washiriki watapata motisha? Eleza kiasi na haki.',
  incentives_helper: 'Hakikisha motisha hazilazimishi',
  data_management: 'Usimamizi wa Data na Usiri',
  data_collection_methods: 'Mbinu za Ukusanyaji wa Data *',
  data_collection_methods_placeholder: 'Eleza mbinu zote za ukusanyaji wa data',
  data_collection_methods_helper: 'Toleo la mwisho la zana lazima liambatanishwe',
  anonymization_method: 'Mbinu ya Kutokutambulisha *',
  anonymization_method_placeholder: 'Data itafanywa isiyotambulika vipi?',
  anonymization_method_helper: 'Eleza mchakato maalum wa kutokutambulisha',
  data_storage_location: 'Mahali pa Kuhifadhi Data *',
  data_storage_location_placeholder: 'Data itahifadhiwa wapi?',
  data_storage_location_helper: 'Kuwa mahususi kuhusu uhifadhi wa kimwili na kidijitali',
  data_storage_security: 'Usalama wa Uhifadhi wa Data *',
  data_storage_security_placeholder:
    'Eleza hatua za usalama (usimbaji fiche, nenosiri, udhibiti wa ufikiaji)',
  data_storage_security_helper: 'Eleza jinsi data italindwa dhidi ya ufikiaji usioruhusiwa',
  data_retention_period: 'Kipindi cha Kuhifadhi Data *',
  data_retention_period_placeholder: 'mfano, miaka 5 baada ya kuchapishwa',
  data_retention_period_helper: 'Fuata mahitaji ya taasisi au wafadhili',
  data_disposal_protocol: 'Itifaki ya Uondoaji wa Data *',
  data_disposal_protocol_placeholder: 'Eleza itifaki za uharibifu wa rekodi nyeti',
  data_disposal_protocol_helper: 'Jumuisha mbinu za kufuta/kuharibu kwa usalama',
  confidentiality_measures: 'Hatua za Usiri *',
  confidentiality_measures_placeholder:
    'Eleza hatua zote za kulinda usiri na faragha ya washiriki',
  risk_benefit_alert:
    'Uchambuzi wa Hatari-Faida: Onyesha kwamba faida zinazidi hatari na hatari zimepunguzwa.',
  risk_identification: 'Utambuzi na Kupunguza Hatari',
  physical_risks: 'Hatari za Kimwili *',
  physical_risks_placeholder:
    "Tambua hatari zozote za kimwili. Andika 'Hakuna' ikiwa hakuna hatari.",
  physical_risks_helper: 'Jumuisha usumbufu, majeraha, au athari za afya',
  psychological_risks: 'Hatari za Kisaikolojia *',
  psychological_risks_placeholder:
    "Tambua hatari za kisaikolojia. Andika 'Hakuna' ikiwa hakuna hatari.",
  psychological_risks_helper: 'Zingatia mada nyeti au uzoefu wa kiwewe',
  social_risks: 'Hatari za Kijamii *',
  social_risks_placeholder:
    "Tambua hatari za kijamii. Andika 'Hakuna' ikiwa hakuna hatari.",
  legal_risks: 'Hatari za Kisheria *',
  legal_risks_placeholder: "Tambua hatari za kisheria. Andika 'Hakuna' ikiwa hakuna hatari.",
  economic_risks: 'Hatari za Kiuchumi *',
  economic_risks_placeholder:
    "Tambua hatari za kiuchumi. Andika 'Hakuna' ikiwa hakuna hatari.",
  risk_mitigation: 'Mikakati ya Kupunguza Hatari *',
  risk_mitigation_placeholder: 'Eleza hatua maalum za kupunguza hatari zote',
  risk_mitigation_helper: 'Shughulikia kila aina ya hatari iliyotambuliwa hapo juu',
  benefits_analysis: 'Uchambuzi wa Faida',
  direct_benefits: 'Faida za Moja kwa Moja kwa Washiriki *',
  direct_benefits_placeholder:
    "Washiriki watapata faida gani za moja kwa moja? Andika 'Hakuna' ikiwa hakuna.",
  direct_benefits_helper: 'Kuwa realist - si utafiti wote una faida za moja kwa moja',
  indirect_benefits: 'Faida za Moja kwa Moja (Sayansi/Jamii) *',
  indirect_benefits_placeholder: 'Ni faida gani kwa sayansi au jamii?',
  indirect_benefits_helper: 'Eleza athari pana ya utafiti',
  risk_benefit_analysis: 'Uchambuzi wa Hatari-Faida *',
  risk_benefit_analysis_placeholder: 'Eleza kwa nini faida zinazidi hatari',
  risk_benefit_analysis_helper: 'Toa tathmini ya usawa',
  conflict_of_interest: 'Ufichuzi wa Migogoro ya Maslahi *',
  no_conflict: 'Hakuna mgogoro wa maslahi',
  conflict_exists: 'Mgogoro wa maslahi upo',
  conflict_details: 'Maelezo ya Migogoro ya Maslahi *',
  conflict_details_placeholder: 'Fichua maslahi yoyote ya kifedha au ya kibinafsi',
  conflict_details_helper: 'Uwazi kamili unahitajika',
  previous_ethics_approval: 'Idhini ya Maadili ya Awali',
  no_previous_approval: 'Hakuna idhini ya awali',
  previous_approval_yes: 'Iliidhinishwa na kamati nyingine hapo awali',
  previous_approval_details: 'Maelezo ya Idhini ya Awali *',
  previous_approval_details_placeholder:
    'Toa nambari ya kumbukumbu, taasisi, na tarehe ya idhini ya awali',
  documentation_alert:
    'Nyaraka Lazima: Vitu vyote vilivyochaguliwa lazima viambatanishwe na ombi lako.',
  documentation_checklist: 'Orodha ya Nyaraka Zinazohitajika',
  check_documents: 'Chagua nyaraka zote zitakazoambatanishwa:',
  pis_title: 'Karatasi ya Taarifa kwa Washiriki (PIS) *',
  pis_desc:
    'Inaeleza utafiti kwa lugha rahisi; inajumuisha mawasiliano ya PI na Kamati ya Maadili',
  consent_form: 'Fomu ya Idhini *',
  consent_form_desc:
    'Hati rasmi kwa saini ya mshiriki (au hati ya mdomo/toleo la mtandaoni)',
  research_protocol: 'Itifaki ya Utafiti *',
  research_protocol_desc: 'Mpango kamili wa kisayansi ukijumuisha marejeo na ratiba ya kina',
  recruitment_materials_doc: 'Nyenzo za Uajiri *',
  recruitment_materials_doc_desc:
    'Nakala za vipeperushi, barua pepe, machapisho ya mitandao, au hati',
  data_collection_tools: 'Zana za Ukusanyaji wa Data *',
  data_collection_tools_desc:
    'Toleo la mwisho la dodosi, ratiba za mahojiano, au orodha za uchunguzi',
  letters_of_support: 'Barua za Msaada',
  letters_of_support_desc: 'Ruhusa kutoka mashirika ya wahusika wengine ikiwa inafaa',
  investigator_cvs: 'CV za Watafiti *',
  investigator_cvs_desc: 'Ushahidi wa sifa na uzoefu wa timu ya utafiti',
  additional_comments: 'Maoni ya Ziada',
  additional_comments_placeholder: 'Taarifa au ufafanuzi wowote wa ziada ungependa kutoa',
  consistency_check:
    'Ukaguzi wa Ulinganifu: Hakikisha idadi ya washiriki, kichwa cha utafiti, na taratiibu zinalingana katika nyaraka zote.',
  review_application: 'Kagua Ombi Lako',
  review_alert:
    'Tafadhali kagua taarifa zote kwa makini kabla ya kuwasilisha. Unaweza kuhifadhi kama rasimu na kurudi baadaye.',
  research_team: 'Timu ya Utafiti',
  participants_ethics: 'Washiriki na Maadili',
  review_title: 'Kichwa:',
  review_research_type: 'Aina ya Utafiti:',
  review_duration: 'Muda:',
  review_sample_size: 'Ukubwa wa Sampuli:',
  months_suffix: ' miezi',
  review_pi: 'Mchunguzi Mkuu:',
  review_orcid: 'ORCID:',
  review_institution: 'Taasisi:',
  review_co_investigators: 'Wachunguzi Wenza:',
  review_vulnerable: 'Makundi Walio Hatarini:',
  review_conflict: 'Migogoro ya Maslahi:',
  review_previous_approval: 'Idhini ya Awali:',
  documentation_checklist_review: 'Orodha ya Nyaraka',
  review_pis: 'Karatasi ya Taarifa kwa Washiriki',
  review_consent: 'Fomu ya Idhini',
  review_protocol: 'Itifaki ya Utafiti',
  review_recruitment: 'Nyenzo za Uajiri',
  review_data_tools: 'Zana za Ukusanyaji wa Data',
  review_cvs: 'CV za Watafiti',
  yes_disclosed: 'Ndiyo - Imefichuliwa',
  attached: 'Imeambatanishwa',
  not_attached: 'Haijaambatanishwa',
  before_submitting:
    'Kabla ya kuwasilisha: Hakikisha nyaraka zote zinazomhusu washiriki zinatumia lugha wazi bila istilahi. Thibitisha ulinganifu katika nyaraka zote.',
};

// Ensure all keys from English exist
for (const key of Object.keys(en)) {
  if (!sw[key]) sw[key] = en[key];
}

fs.writeFileSync(
  path.join(__dirname, 'ethics-form-locale-sw.json'),
  `${JSON.stringify(sw, null, 2)}\n`
);
console.log('Generated ethics-form-locale-sw.json');
