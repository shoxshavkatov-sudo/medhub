/* MedHub — клинические тестовые вопросы (RU + UZ). Грузится при входе в раздел «Тесты» (TestsMore в js/app.js).
   sub(«Предмет RU», «Fan UZ») — начинает предмет; q(индекс верного ответа 0–3,
     вопрос RU, [4 варианта RU], пояснение RU, вопрос UZ, [4 варианта UZ], пояснение UZ).
   Варианты в UZ — в том же порядке, что и в RU. Учебный материал, не для клинических решений. */
(function(){
  const T = window.TESTS_MORE = [], SU = window.TEST_SUBJ_UZ = window.TEST_SUBJ_UZ || {};
  let cur = '';
  const sub = (ru, uz) => { cur = ru; SU[ru] = uz; };
  const q = (a, q, o, e, qu, ou, eu) => T.push({s: cur, q, o, a, e, uz: {q: qu, o: ou, e: eu}});

/* ---------- 1_cardio ---------- */
sub("Кардиология", "Kardiologiya");
q(2, "Двойная антитромбоцитарная терапия после ОКС со стентированием обычно продолжается:",
  ["1 неделю", "1 месяц", "12 месяцев", "Пожизненно оба препарата"],
  "Аспирин — пожизненно, ингибитор P2Y12 (тикагрелор, прасугрел или клопидогрел) — 12 месяцев; при высоком риске кровотечения срок сокращают.",
  "Stentlash bilan kechgan O'KS dan keyin ikki tomonlama antitrombotsitar terapiya odatda qancha davom etadi?",
  ["1 hafta", "1 oy", "12 oy", "Ikkala dori umrbod"],
  "Aspirin — umrbod, P2Y12 ingibitori (tikagrelor, prasugrel yoki klopidogrel) — 12 oy; qon ketish xavfi yuqori bo'lsa, muddat qisqartiriladi.");
q(0, "Признак гипертрофии левого желудочка на ЭКГ (индекс Соколова-Лайона):",
  ["S в V1 + R в V5 или V6 >35 мм", "Отклонение ЭОС вправо и высокий R в V1", "PQ >200 мс", "Дельта-волна"],
  "Высокий R в V1 и отклонение оси вправо — признаки гипертрофии правого желудочка.",
  "EKG da chap qorincha gipertrofiyasi belgisi (Sokolov-Layon indeksi):",
  ["V1 dagi S + V5 yoki V6 dagi R >35 mm", "Elektr o'qning o'ngga og'ishi va V1 da baland R", "PQ >200 ms", "Delta to'lqin"],
  "V1 da baland R va o'qning o'ngga og'ishi — o'ng qorincha gipertrofiyasi belgilari.");
q(3, "Классическая триада симптомов аортального стеноза:",
  ["Лихорадка, шум, анемия", "Одышка, кровохарканье, отёки", "Тахикардия, гипотензия, парадоксальный пульс", "Стенокардия, обмороки, одышка"],
  "Появление симптомов резко ухудшает прогноз — показана замена клапана (хирургическая или транскатетерная TAVI).",
  "Aorta stenozining klassik simptomlar triadasi:",
  ["Isitma, shovqin, anemiya", "Hansirash, qon tupurish, shishlar", "Taxikardiya, gipotenziya, paradoksal puls", "Stenokardiya, hushdan ketish, hansirash"],
  "Simptomlar paydo bo'lishi prognozni keskin yomonlashtiradi — klapanni almashtirish (jarrohlik yoki transkateter TAVI) ko'rsatiladi.");
q(1, "Триада Бека (тампонада сердца):",
  ["Лихорадка, шум трения, боль в груди", "Гипотензия, набухание шейных вен, глухие тоны сердца", "Гипертензия, брадикардия, нерегулярное дыхание", "Цианоз, кровохарканье, хрипы"],
  "Также парадоксальный пульс (снижение САД >10 мм рт.ст. на вдохе). Лечение — экстренный перикардиоцентез. Гипертензия + брадикардия + нарушение дыхания — триада Кушинга (внутричерепная гипертензия).",
  "Bek triadasi (yurak tamponadasi):",
  ["Isitma, ishqalanish shovqini, ko'krakda og'riq", "Gipotenziya, bo'yin venalarining bo'rtishi, yurak tonlarining bo'g'iqligi", "Gipertenziya, bradikardiya, notekis nafas", "Sianoz, qon tupurish, xirillashlar"],
  "Shuningdek paradoksal puls (nafas olganda SAB ning >10 mm sim. ust. pasayishi). Davolash — shoshilinch perikardiotsentez. Gipertenziya + bradikardiya + nafas buzilishi — Kushing triadasi (kalla ichi gipertenziyasi).");
q(0, "Целевое АД на лечении у большинства пациентов с артериальной гипертензией младше 65 лет:",
  ["<130/80 мм рт.ст. при хорошей переносимости", "<160/100 мм рт.ст.", "<150/90 мм рт.ст.", "<100/60 мм рт.ст."],
  "Рекомендации ESC/ESH: сначала <140/90, затем при переносимости 120–130/70–79 мм рт.ст.",
  "65 yoshgacha bo'lgan arterial gipertenziyali bemorlarning ko'pchiligida davolash fonida maqsadli AQB:",
  ["Yaxshi o'zlashtirilsa <130/80 mm sim. ust.", "<160/100 mm sim. ust.", "<150/90 mm sim. ust.", "<100/60 mm sim. ust."],
  "ESC/ESH tavsiyalari: avval <140/90, so'ng yaxshi o'zlashtirilsa 120–130/70–79 mm sim. ust.");
q(2, "Препараты, улучшающие прогноз при ХСН со сниженной ФВ («четыре столпа»):",
  ["Дигоксин, фуросемид, нитраты, амиодарон", "Верапамил, дилтиазем, нифедипин, клонидин", "иАПФ/АРНИ, бета-блокатор, антагонист альдостерона, иНГЛТ-2", "Аспирин, клопидогрел, варфарин, гепарин"],
  "Все четыре группы снижают смертность; диуретики лишь устраняют застой и на прогноз не влияют.",
  "OF pasaygan SYuY da prognozni yaxshilovchi dorilar («to'rt ustun»):",
  ["Digoksin, furosemid, nitratlar, amiodaron", "Verapamil, diltiazem, nifedipin, klonidin", "AAF ingibitori/ARNI, beta-blokator, aldosteron antagonisti, NGLT-2 ingibitori", "Aspirin, klopidogrel, varfarin, geparin"],
  "To'rttala guruh o'limni kamaytiradi; diuretiklar faqat dimlanishni bartaraf etadi va prognozga ta'sir qilmaydi.");
q(3, "Наиболее частая причина внезапной сердечной смерти у взрослых:",
  ["Аортальный стеноз", "Миокардит", "ТЭЛА", "Желудочковые аритмии на фоне ИБС"],
  "Около 80% случаев — ФЖ или ЖТ при ишемической болезни сердца; отсюда важность ранней дефибрилляции и ИКД по показаниям.",
  "Kattalarda to'satdan yurak o'limining eng ko'p uchraydigan sababi:",
  ["Aorta stenozi", "Miokardit", "O'ATE", "YuIK fonidagi qorincha aritmiyalari"],
  "Taxminan 80% hollarda — yurak ishemik kasalligidagi qorinchalar fibrillyatsiyasi yoki taxikardiyasi; shu sababli erta defibrillyatsiya va ko'rsatma bo'yicha IKD muhim.");
q(1, "Препарат для контроля ЧСС при ФП у пациента с ХСН со сниженной ФВ:",
  ["Верапамил", "Бета-блокатор (бисопролол), при необходимости + дигоксин", "Дилтиазем", "Нифедипин"],
  "Верапамил и дилтиазем при сниженной ФВ противопоказаны — отрицательный инотропный эффект; нифедипин ЧСС не урежает.",
  "OF pasaygan SYuY bilan og'rigan bemorda BF da YuQS ni nazorat qilish uchun dori:",
  ["Verapamil", "Beta-blokator (bisoprolol), kerak bo'lsa + digoksin", "Diltiazem", "Nifedipin"],
  "OF pasayganda verapamil va diltiazem mumkin emas — manfiy inotrop ta'sir; nifedipin YuQS ni sekinlashtirmaydi.");
q(0, "Антикоагулянт при ФП у пациента с механическим протезом клапана:",
  ["Варфарин (целевое МНО по типу и позиции протеза, чаще 2.5–3.5)", "Апиксабан", "Ривароксабан", "Дабигатран"],
  "ПОАК при механических клапанах противопоказаны: в исследовании с дабигатраном выросли тромбозы и кровотечения.",
  "Mexanik klapan protezi bo'lgan bemorda BF uchun antikoagulyant:",
  ["Varfarin (maqsadli XMN protez turi va joyiga qarab, ko'pincha 2.5–3.5)", "Apiksaban", "Rivaroksaban", "Dabigatran"],
  "Mexanik klapanlarda POAK mumkin emas: dabigatran bilan o'tkazilgan tadqiqotda tromboz va qon ketishlar ko'paygan.");
q(2, "Наиболее чувствительный и специфичный биомаркер некроза миокарда:",
  ["КФК общая", "ЛДГ", "Высокочувствительный тропонин", "Миоглобин"],
  "Тропонин повышается через 1–3 ч и держится 7–14 дней; применяют быстрые протоколы 0/1 ч или 0/2 ч.",
  "Miokard nekrozining eng sezgir va spetsifik biomarkeri:",
  ["Umumiy KFK", "LDG", "Yuqori sezgir troponin", "Mioglobin"],
  "Troponin 1–3 soatdan keyin oshadi va 7–14 kun saqlanadi; 0/1 soat yoki 0/2 soat tezkor protokollari qo'llaniladi.");
q(3, "ЭКГ при инфаркте нижней стенки левого желудочка:",
  ["Подъём ST в V1–V4", "Подъём ST в I, aVL, V5–V6", "Депрессия ST во всех отведениях", "Подъём ST в II, III, aVF"],
  "Нижний ИМ чаще вызван окклюзией правой коронарной артерии; снимите правые отведения (V4R), чтобы исключить ИМ правого желудочка.",
  "Chap qorincha pastki devori infarktida EKG:",
  ["V1–V4 da ST ko'tarilishi", "I, aVL, V5–V6 da ST ko'tarilishi", "Barcha tarmoqlarda ST depressiyasi", "II, III, aVF da ST ko'tarilishi"],
  "Pastki MI ko'pincha o'ng koronar arteriya okklyuziyasidan; o'ng qorincha MI ini istisno qilish uchun o'ng tarmoqlarni (V4R) yozing.");
q(1, "Что нельзя назначать при инфаркте правого желудочка с гипотензией?",
  ["Инфузию физраствора", "Нитраты и диуретики", "Реперфузию (ЧКВ)", "Аспирин"],
  "Правый желудочек зависит от преднагрузки: нитраты и диуретики снижают её и вызывают тяжёлую гипотензию. Нужна инфузия.",
  "Gipotenziya bilan kechgan o'ng qorincha infarktida nimani buyurish mumkin emas?",
  ["Fiziologik eritma infuziyasi", "Nitratlar va diuretiklar", "Reperfuziya (TKA)", "Aspirin"],
  "O'ng qorincha oldingi yuklamaga bog'liq: nitratlar va diuretiklar uni kamaytirib, og'ir gipotenziyaga olib keladi. Infuziya kerak.");
q(0, "Шум при обструктивной гипертрофической кардиомиопатии усиливается при:",
  ["Пробе Вальсальвы и вставании", "Приседании", "Подъёме ног", "Изометрическом сжатии кисти"],
  "Уменьшение преднагрузки (Вальсальва, вставание) усиливает обструкцию выносящего тракта и шум — отличие от аортального стеноза.",
  "Obstruktiv gipertrofik kardiomiopatiyada shovqin qachon kuchayadi?",
  ["Valsalva sinamasi va o'rnidan turganda", "Cho'kkalaganda", "Oyoqlarni ko'targanda", "Kaftni izometrik siqqanda"],
  "Oldingi yuklamaning kamayishi (Valsalva, o'rnidan turish) chiqish yo'li obstruksiyasini va shovqinni kuchaytiradi — aorta stenozidan farqi.");
q(2, "Большие критерии Джонса (острая ревматическая лихорадка):",
  ["Лихорадка, СОЭ ↑, артралгия", "Удлинение PQ, СРБ ↑, лейкоцитоз", "Кардит, полиартрит, хорея, кольцевидная эритема, подкожные узелки", "Гепатомегалия, спленомегалия, желтуха"],
  "Нужно ещё доказательство стрептококковой инфекции (АСЛО, посев). Лихорадка, артралгия, СОЭ/СРБ и удлинение PQ — малые критерии.",
  "Jonsning katta mezonlari (o'tkir revmatik isitma):",
  ["Isitma, EChT ↑, artralgiya", "PQ uzayishi, SRO ↑, leykotsitoz", "Kardit, poliartrit, xoreya, halqasimon eritema, teri osti tugunchalari", "Gepatomegaliya, splenomegaliya, sariqlik"],
  "Streptokokk infeksiyasining isboti (ASLO, ekma) ham kerak. Isitma, artralgiya, EChT/SRO va PQ uzayishi — kichik mezonlar.");
q(3, "Наиболее частый возбудитель инфекционного эндокардита у потребителей инъекционных наркотиков:",
  ["Streptococcus viridans", "Enterococcus faecalis", "Candida albicans", "Staphylococcus aureus"],
  "Часто поражается трикуспидальный клапан с септическими эмболами в лёгкие.",
  "In'eksion giyohvandlarda infeksion endokarditning eng ko'p uchraydigan qo'zg'atuvchisi:",
  ["Streptococcus viridans", "Enterococcus faecalis", "Candida albicans", "Staphylococcus aureus"],
  "Ko'pincha trikuspidal klapan zararlanadi, o'pkaga septik embollar bilan.");
q(0, "Большие критерии Дьюка (инфекционный эндокардит):",
  ["Положительная гемокультура типичным возбудителем и вегетации на ЭхоКГ", "Лихорадка и шум", "Пятна Рота и узелки Ослера", "Спленомегалия и анемия"],
  "Лихорадка, эмболии, узелки Ослера, пятна Джейнуэя и Рота — малые критерии. Диагноз: 2 больших, или 1 большой + 3 малых, или 5 малых.",
  "Dyukning katta mezonlari (infeksion endokardit):",
  ["Tipik qo'zg'atuvchi bilan musbat gemokultura va ExoKG da vegetatsiyalar", "Isitma va shovqin", "Rot dog'lari va Osler tugunchalari", "Splenomegaliya va anemiya"],
  "Isitma, emboliyalar, Osler tugunchalari, Jeynuey va Rot dog'lari — kichik mezonlar. Tashxis: 2 katta, yoki 1 katta + 3 kichik, yoki 5 kichik mezon.");
q(1, "Препарат выбора при стабильной мономорфной желудочковой тахикардии:",
  ["Верапамил", "Амиодарон в/в", "Дигоксин", "Аденозин"],
  "Нестабильная ЖТ — синхронная кардиоверсия. Верапамил при ЖТ опасен: может вызвать коллапс.",
  "Barqaror monomorf qorinchalar taxikardiyasida tanlov dorisi:",
  ["Verapamil", "Amiodaron v/i", "Digoksin", "Adenozin"],
  "Beqaror qorinchalar taxikardiyasida — sinxron kardioversiya. Bunda verapamil xavfli: kollapsga olib kelishi mumkin.");
q(2, "Ритмы, при которых показана дефибрилляция:",
  ["Асистолия", "Электрическая активность без пульса", "Фибрилляция желудочков и ЖТ без пульса", "Синусовая брадикардия"],
  "Асистолия и электрическая активность без пульса не дефибриллируются: СЛР, адреналин 1 мг каждые 3–5 мин и поиск обратимых причин.",
  "Qaysi ritmlarda defibrillyatsiya ko'rsatilgan?",
  ["Asistoliya", "Pulssiz elektr faollik", "Qorinchalar fibrillyatsiyasi va pulssiz qorinchalar taxikardiyasi", "Sinus bradikardiyasi"],
  "Asistoliya va pulssiz elektr faollikda defibrillyatsiya qilinmaydi: YuO'R, har 3–5 daqiqada 1 mg adrenalin va qaytar sabablarni izlash.");
q(3, "Основной метод диагностики расслоения аорты у гемодинамически стабильного пациента:",
  ["Рентгенография грудной клетки", "ЭКГ", "Д-димер", "КТ-ангиография аорты"],
  "Тип A (восходящая аорта) — экстренная операция; тип B — чаще консервативно: бета-блокатор и контроль АД.",
  "Gemodinamikasi barqaror bemorda aorta qatlamlanishini aniqlashning asosiy usuli:",
  ["Ko'krak qafasi rentgenografiyasi", "EKG", "D-dimer", "Aortaning KT-angiografiyasi"],
  "A turi (ko'tariluvchi aorta) — shoshilinch operatsiya; B turi — ko'pincha konservativ: beta-blokator va AQB nazorati.");
q(0, "Целевой уровень ЛПНП у пациента очень высокого сердечно-сосудистого риска (ESC 2019):",
  ["<1.4 ммоль/л и снижение ≥50% от исходного", "<3.0 ммоль/л", "<2.6 ммоль/л", "<4.0 ммоль/л"],
  "Высокий риск — <1.8, умеренный — <2.6, низкий — <3.0 ммоль/л. Основа — высокоинтенсивный статин, при недостижении цели + эзетимиб.",
  "Yurak-qon tomir xavfi juda yuqori bo'lgan bemorda maqsadli PZLP (ESC 2019):",
  ["<1.4 mmol/l va boshlang'ich qiymatdan ≥50% pasayish", "<3.0 mmol/l", "<2.6 mmol/l", "<4.0 mmol/l"],
  "Yuqori xavfda — <1.8, o'rtacha xavfda — <2.6, past xavfda — <3.0 mmol/l. Asos — yuqori intensiv statin, maqsadga erishilmasa + ezetimib.");
q(1, "Пульс Корригана («водяной молоток») характерен для:",
  ["Митрального стеноза", "Аортальной недостаточности", "Тампонады сердца", "Аортального стеноза"],
  "Большое пульсовое давление: быстрый подъём и спад пульсовой волны; также симптом Мюссе и капиллярный пульс Квинке.",
  "Korrigan pulsi («suv bolg'asi») qaysi holat uchun xos?",
  ["Mitral stenoz", "Aorta klapani yetishmovchiligi", "Yurak tamponadasi", "Aorta stenozi"],
  "Katta puls bosimi: puls to'lqinining tez ko'tarilishi va tushishi; shuningdek Myusse simptomi va Kvinke kapillyar pulsi.");
q(3, "Наиболее частое осложнение митрального стеноза:",
  ["Инфаркт миокарда", "Желудочковая тахикардия", "Расслоение аорты", "Фибрилляция предсердий с тромбоэмболиями"],
  "Дилатация левого предсердия → ФП → тромбы в ушке → инсульт. При ревматическом МС с ФП антикоагулянт — варфарин.",
  "Mitral stenozning eng ko'p uchraydigan asorati:",
  ["Miokard infarkti", "Qorinchalar taxikardiyasi", "Aorta qatlamlanishi", "Tromboemboliyalar bilan bo'lmachalar fibrillyatsiyasi"],
  "Chap bo'lmacha kengayishi → BF → quloqchada trombi → insult. Revmatik mitral stenoz va BF da antikoagulyant — varfarin.");
q(0, "Препарат первой линии при гипертензии у пациента с сахарным диабетом и альбуминурией:",
  ["иАПФ или БРА", "Бета-блокатор", "Тиазидный диуретик", "Альфа-адреноблокатор"],
  "Блокада РААС снижает альбуминурию и замедляет нефропатию; иАПФ и БРА вместе не назначают.",
  "Qandli diabet va albuminuriyasi bor bemorda gipertenziya uchun birinchi qator dori:",
  ["AAF ingibitori yoki ARB", "Beta-blokator", "Tiazid diuretik", "Alfa-adrenoblokator"],
  "RAAT blokadasi albuminuriyani kamaytiradi va nefropatiyani sekinlashtiradi; AAF ingibitori va ARB birga buyurilmaydi.");
q(2, "Препарат, противопоказанный при артериальной гипертензии у беременных:",
  ["Метилдопа", "Лабеталол", "Эналаприл", "Нифедипин пролонгированного действия"],
  "иАПФ и БРА фетотоксичны (поражение почек плода). Допустимы метилдопа, лабеталол, нифедипин.",
  "Homiladorlarda arterial gipertenziyada mumkin bo'lmagan dori:",
  ["Metildopa", "Labetalol", "Enalapril", "Uzaytirilgan ta'sirli nifedipin"],
  "AAF ingibitorlari va ARB homila uchun toksik (homila buyraklarini shikastlaydi). Metildopa, labetalol, nifedipin mumkin.");
q(1, "ЭКГ при синдроме Вольфа-Паркинсона-Уайта:",
  ["Удлинённый PQ и узкий QRS", "Короткий PQ, дельта-волна, расширенный QRS", "Подъём ST в V1–V3 с блокадой правой ножки", "Удлинённый QT"],
  "Дополнительный путь проведения (пучок Кента). При ФП на фоне WPW блокаторы АВ-узла (верапамил, дигоксин, аденозин) противопоказаны.",
  "Volf-Parkinson-Uayt sindromida EKG:",
  ["Uzaygan PQ va tor QRS", "Qisqa PQ, delta to'lqin, kengaygan QRS", "O'ng oyoqcha blokadasi bilan V1–V3 da ST ko'tarilishi", "Uzaygan QT"],
  "Qo'shimcha o'tkazuvchi yo'l (Kent tutami). WPW fonidagi BF da AV-tugun blokatorlari (verapamil, digoksin, adenozin) mumkin emas.");
q(2, "Препарат, который нельзя назначать вместе с силденафилом:",
  ["Аспирин", "Аторвастатин", "Нитроглицерин", "Метформин"],
  "Нитраты + ингибиторы ФДЭ-5 вызывают тяжёлую, иногда фатальную гипотензию; интервал — не менее 24–48 ч.",
  "Sildenafil bilan birga buyurish mumkin bo'lmagan dori:",
  ["Aspirin", "Atorvastatin", "Nitroglitserin", "Metformin"],
  "Nitratlar + FDE-5 ingibitorlari og'ir, ba'zan o'limga olib keluvchi gipotenziyaga sabab bo'ladi; oraliq — kamida 24–48 soat.");

/* ---------- 2_internal ---------- */
sub("Внутренние болезни", "Ichki kasalliklar");
q(0, "Спирометрический критерий ХОБЛ:",
  ["ОФВ1/ФЖЕЛ <0.7 после бронхолитика", "ОФВ1 >80% от должного", "Прирост ОФВ1 >12% после бронхолитика", "ЖЁЛ >5 л"],
  "Постбронходилатационное ОФВ1/ФЖЕЛ <0.7 подтверждает стойкую обструкцию; тяжесть оценивают по ОФВ1 (GOLD 1–4).",
  "SO'OK ning spirometrik mezoni:",
  ["Bronxolitikdan keyin OFV1/FJTS <0.7", "OFV1 kerakli qiymatning >80%", "Bronxolitikdan keyin OFV1 ning >12% oshishi", "O'pkaning tiriklik sig'imi >5 l"],
  "Bronxodilatatsiyadan keyingi OFV1/FJTS <0.7 turg'un obstruksiyani tasdiqlaydi; og'irligi OFV1 bo'yicha baholanadi (GOLD 1–4).");
q(2, "Признак обратимой обструкции, характерный для бронхиальной астмы:",
  ["ОФВ1/ФЖЕЛ <0.7", "Снижение диффузионной способности лёгких", "Прирост ОФВ1 ≥12% и ≥200 мл после сальбутамола", "Гиперкапния"],
  "Положительная бронходилатационная проба и суточная вариабельность ПСВ >10% подтверждают астму.",
  "Bronxial astma uchun xos qaytar obstruksiya belgisi:",
  ["OFV1/FJTS <0.7", "O'pkaning diffuziya qobiliyati pasayishi", "Salbutamoldan keyin OFV1 ning ≥12% va ≥200 ml oshishi", "Giperkapniya"],
  "Musbat bronxodilatatsion sinama va NChT ning sutkalik o'zgaruvchanligi >10% astmani tasdiqlaydi.");
q(3, "Наиболее частая причина язвенной болезни желудка и двенадцатиперстной кишки:",
  ["Стресс", "Острая пища", "Гастринома", "Helicobacter pylori"],
  "Вторая причина — НПВС. Эрадикация: ИПП + кларитромицин + амоксициллин или висмутовая квадротерапия, 14 дней.",
  "Oshqozon va o'n ikki barmoqli ichak yara kasalligining eng ko'p uchraydigan sababi:",
  ["Stress", "Achchiq ovqat", "Gastrinoma", "Helicobacter pylori"],
  "Ikkinchi sabab — NYaQV. Eradikatsiya: PPI + klaritromitsin + amoksitsillin yoki vismutli kvadroterapiya, 14 kun.");
q(1, "Тест для подтверждения эрадикации H. pylori:",
  ["Антитела IgG в крови", "Дыхательный уреазный тест не раньше чем через 4 недели после лечения", "Общий анализ крови", "Рентгенография желудка"],
  "Антитела сохраняются месяцами и для контроля непригодны. ИПП отменяют за 2 недели до теста.",
  "H. pylori eradikatsiyasini tasdiqlash testi:",
  ["Qonda IgG antitanalar", "Davolashdan kamida 4 hafta o'tgach ureaza nafas testi", "Umumiy qon tahlili", "Oshqozon rentgenografiyasi"],
  "Antitanalar oylab saqlanadi va nazorat uchun yaramaydi. Testdan 2 hafta oldin PPI to'xtatiladi.");
q(0, "Первоочередные меры при кровотечении из варикозно расширенных вен пищевода:",
  ["Терлипрессин или октреотид + антибиотик + эндоскопическое лигирование", "Только ИПП в/в", "Массивная инфузия до нормального АД", "Срочная лапаротомия"],
  "Трансфузия рестриктивная (цель Hb 70–80 г/л); антибиотик (цефтриаксон) снижает смертность при циррозе.",
  "Qizilo'ngachning varikoz kengaygan venalaridan qon ketganda birinchi navbatdagi choralar:",
  ["Terlipressin yoki oktreotid + antibiotik + endoskopik ligirlash", "Faqat v/i PPI", "Normal AQB gacha massiv infuziya", "Shoshilinch laparotomiya"],
  "Transfuziya cheklangan (maqsad Hb 70–80 g/l); antibiotik (seftriakson) sirrozda o'limni kamaytiradi.");
q(2, "Шкала тяжести цирроза печени:",
  ["CURB-65", "Глазго-Блатчфорд", "Child-Pugh", "Wells"],
  "Child-Pugh: билирубин, альбумин, МНО, асцит, энцефалопатия (классы A, B, C). MELD — для очереди на трансплантацию.",
  "Jigar sirrozi og'irligi shkalasi:",
  ["CURB-65", "Glazgo-Blatchford", "Child-Pugh", "Wells"],
  "Child-Pugh: bilirubin, albumin, XMN, assit, ensefalopatiya (A, B, C sinflari). MELD — transplantatsiya navbati uchun.");
q(3, "Признак, характерный для болезни Крона, а не для язвенного колита:",
  ["Первичный склерозирующий холангит", "Кровь в стуле", "Поражение только прямой кишки", "Перианальные свищи и трансмуральное воспаление"],
  "Крон — сегментарное трансмуральное поражение любого отдела ЖКТ, свищи, стриктуры. ЯК — непрерывное поражение слизистой от прямой кишки; ПСХ чаще при ЯК.",
  "Yarali kolit uchun emas, Kron kasalligi uchun xos belgi:",
  ["Birlamchi sklerozlovchi xolangit", "Najasda qon", "Faqat to'g'ri ichak zararlanishi", "Perianal oqmalar va transmural yallig'lanish"],
  "Kron — OIT ning istalgan qismida segmentar transmural zararlanish, oqmalar, strikturalar. Yarali kolit — to'g'ri ichakdan boshlanuvchi uzluksiz shilliq qavat zararlanishi; BSX ko'proq yarali kolitda.");
q(1, "Две самые частые причины острого панкреатита:",
  ["Гипертриглицеридемия и травма", "Желчнокаменная болезнь и алкоголь", "Лекарства и вирусы", "Гиперкальциемия и ЭРХПГ"],
  "На них приходится около 80% случаев. При билиарном панкреатите холецистэктомию выполняют в ту же госпитализацию.",
  "O'tkir pankreatitning eng ko'p uchraydigan ikki sababi:",
  ["Gipertriglitseridemiya va jarohat", "O't-tosh kasalligi va alkogol", "Dorilar va viruslar", "Giperkalsiyemiya va ERXPG"],
  "Ular hollarning taxminan 80% ini tashkil qiladi. Biliar pankreatitda xolesistektomiya shu gospitalizatsiyaning o'zida bajariladi.");
q(0, "Критерий острого почечного повреждения по KDIGO:",
  ["Рост креатинина ≥26.5 мкмоль/л за 48 ч или в 1.5 раза за 7 дней, либо диурез <0.5 мл/кг/ч ≥6 ч", "Креатинин >500 мкмоль/л", "Протеинурия >3.5 г/сут", "СКФ <60 более 3 месяцев"],
  "СКФ <60 более 3 месяцев — это ХБП; протеинурия >3.5 г/сут — признак нефротического синдрома.",
  "KDIGO bo'yicha buyrakning o'tkir shikastlanishi mezoni:",
  ["48 soatda kreatininning ≥26.5 mkmol/l ga yoki 7 kunda 1.5 baravar oshishi, yoki ≥6 soat diurez <0.5 ml/kg/soat", "Kreatinin >500 mkmol/l", "Proteinuriya >3.5 g/sutka", "3 oydan ortiq KFT <60"],
  "3 oydan ortiq KFT <60 — bu SBK; proteinuriya >3.5 g/sutka — nefrotik sindrom belgisi.");
q(2, "Признаки нефротического синдрома:",
  ["Гематурия, гипертензия, олигурия", "Лейкоцитурия, бактериурия, лихорадка", "Протеинурия >3.5 г/сут, гипоальбуминемия, отёки, гиперлипидемия", "Глюкозурия, полиурия, жажда"],
  "Гематурия + гипертензия + олигурия + отёки — нефритический синдром (например, постстрептококковый гломерулонефрит).",
  "Nefrotik sindrom belgilari:",
  ["Gematuriya, gipertenziya, oliguriya", "Leykotsituriya, bakteriuriya, isitma", "Proteinuriya >3.5 g/sutka, gipoalbuminemiya, shishlar, giperlipidemiya", "Glyukozuriya, poliuriya, chanqoq"],
  "Gematuriya + gipertenziya + oliguriya + shishlar — nefritik sindrom (masalan, streptokokkdan keyingi glomerulonefrit).");
q(3, "Наиболее частая причина хронической болезни почек:",
  ["Поликистоз почек", "Гломерулонефрит", "Пиелонефрит", "Сахарный диабет"],
  "Второе место — артериальная гипертензия. Нефропротекция: контроль АД и гликемии, иАПФ/БРА, иНГЛТ-2.",
  "Surunkali buyrak kasalligining eng ko'p uchraydigan sababi:",
  ["Buyrak polikistozi", "Glomerulonefrit", "Pielonefrit", "Qandli diabet"],
  "Ikkinchi o'rinda — arterial gipertenziya. Nefroproteksiya: AQB va glikemiya nazorati, AAF ingibitori/ARB, NGLT-2 ingibitorlari.");
q(1, "Экстренное показание к гемодиализу:",
  ["Креатинин 300 мкмоль/л без симптомов", "Рефрактерная гиперкалиемия, отёк лёгких, тяжёлый ацидоз, уремический перикардит", "Мочевина 12 ммоль/л", "Гемоглобин 90 г/л"],
  "Мнемоника AEIOU: Acidosis, Electrolytes (K+), Intoxication, Overload, Uremia.",
  "Gemodializga shoshilinch ko'rsatma:",
  ["Simptomsiz kreatinin 300 mkmol/l", "Davolanmaydigan giperkaliyemiya, o'pka shishi, og'ir atsidoz, uremik perikardit", "Mochevina 12 mmol/l", "Gemoglobin 90 g/l"],
  "AEIOU mnemonikasi: Acidosis, Electrolytes (K+), Intoxication, Overload, Uremia.");
q(0, "Лабораторный признак B12-дефицитной анемии:",
  ["Макроцитоз (MCV >100 фл) и гиперсегментация нейтрофилов", "Микроцитоз и низкий ферритин", "Ретикулоцитоз и непрямая гипербилирубинемия", "Шистоциты в мазке"],
  "Возможны неврологические нарушения (фуникулярный миелоз). Причины: атрофический гастрит, веганство, резекция желудка.",
  "B12-tanqislik anemiyasining laborator belgisi:",
  ["Makrotsitoz (MCV >100 fl) va neytrofillarning gipersegmentatsiyasi", "Mikrotsitoz va past ferritin", "Retikulotsitoz va bilvosita giperbilirubinemiya", "Surtmada shistotsitlar"],
  "Nevrologik buzilishlar (funikulyar mieloz) bo'lishi mumkin. Sabablari: atrofik gastrit, veganlik, oshqozon rezeksiyasi.");
q(2, "Лабораторная картина гемолиза:",
  ["Низкие ретикулоциты", "Высокий ферритин и микроцитоз", "Ретикулоцитоз, непрямой билирубин ↑, ЛДГ ↑, гаптоглобин ↓", "Низкое сывороточное железо"],
  "Прямая проба Кумбса отличает иммунный гемолиз от неиммунного.",
  "Gemolizning laborator manzarasi:",
  ["Past retikulotsitlar", "Yuqori ferritin va mikrotsitoz", "Retikulotsitoz, bilvosita bilirubin ↑, LDG ↑, gaptoglobin ↓", "Zardob temirining pastligi"],
  "To'g'ri Kumbs sinamasi immun gemolizni noimmun gemolizdan ajratadi.");
q(3, "Типичный пациент с хроническим лимфолейкозом:",
  ["Ребёнок 2–5 лет с бластами >20%", "Молодой взрослый с филадельфийской хромосомой", "Подросток с опухолью средостения", "Пожилой с лимфоцитозом >5×10⁹/л и тенями Гумпрехта"],
  "ХЛЛ — самый частый лейкоз взрослых в Европе и США; филадельфийская хромосома характерна для ХМЛ.",
  "Surunkali limfoleykozli tipik bemor:",
  ["Blastlari >20% bo'lgan 2–5 yoshli bola", "Filadelfiya xromosomasi bor yosh katta odam", "Ko'ks oralig'i o'smasi bor o'smir", "Limfotsitoz >5×10⁹/l va Gumprext soyalari bor keksa odam"],
  "SLL — Yevropa va AQShda kattalardagi eng ko'p uchraydigan leykoz; Filadelfiya xromosomasi SML uchun xos.");
q(1, "Средство для купирования острого приступа подагры:",
  ["Аллопуринол", "НПВС, колхицин или глюкокортикоид", "Пробенецид", "Аспирин"],
  "Аллопуринол — длительная терапия для снижения мочевой кислоты (цель <360 мкмоль/л), а не средство купирования приступа.",
  "O'tkir podagra xurujini to'xtatish vositasi:",
  ["Allopurinol", "NYaQV, kolxitsin yoki glyukokortikoid", "Probenetsid", "Aspirin"],
  "Allopurinol — siydik kislotasini kamaytirish uchun uzoq muddatli terapiya (maqsad <360 mkmol/l), xurujni to'xtatish vositasi emas.");
q(0, "Антитела, наиболее специфичные для системной красной волчанки:",
  ["Анти-dsDNA и анти-Sm", "Ревматоидный фактор", "АНЦА", "Антицентромерные"],
  "АНА чувствительны (скрининг), но неспецифичны; уровень анти-dsDNA связан с активностью болезни и волчаночным нефритом.",
  "Tizimli qizil yugurik uchun eng spetsifik antitanalar:",
  ["Anti-dsDNA va anti-Sm", "Revmatoid omil", "ANSA", "Antisentromer"],
  "ANA sezgir (skrining), lekin nospetsifik; anti-dsDNA darajasi kasallik faolligi va yugurik nefriti bilan bog'liq.");
q(2, "Ранний и специфичный маркер ревматоидного артрита:",
  ["СОЭ", "HLA-B27", "Антитела к циклическому цитруллинированному пептиду (АЦЦП)", "Мочевая кислота"],
  "Специфичность АЦЦП около 95%; РФ встречается и при других болезнях. Препарат первой линии — метотрексат.",
  "Revmatoid artritning erta va spetsifik markeri:",
  ["EChT", "HLA-B27", "Siklik sitrullinlangan peptidga antitanalar (ASSP)", "Siydik kislotasi"],
  "ASSP spetsifikligi taxminan 95%; RF boshqa kasalliklarda ham uchraydi. Birinchi qator dori — metotreksat.");
q(3, "Заболевание, ассоциированное с HLA-B27 и «бамбуковым» позвоночником:",
  ["Ревматоидный артрит", "Подагра", "Остеоартроз", "Анкилозирующий спондилит"],
  "Воспалительная боль в спине у молодых: утренняя скованность, облегчение после движения; сакроилеит на МРТ.",
  "HLA-B27 va «bambuksimon» umurtqa pog'onasi bilan bog'liq kasallik:",
  ["Revmatoid artrit", "Podagra", "Osteoartroz", "Ankilozlovchi spondilit"],
  "Yoshlarda yallig'lanishli bel og'rig'i: ertalabki karaxtlik, harakatdan keyin yengillashish; MRT da sakroileit.");
q(1, "Стартовый антибиотик при внебольничной пневмонии у амбулаторного пациента без сопутствующих болезней:",
  ["Ципрофлоксацин", "Амоксициллин", "Ванкомицин", "Меропенем"],
  "При аллергии или подозрении на атипичную флору — макролид или доксициклин; респираторные фторхинолоны — резерв.",
  "Yondosh kasalliklari yo'q ambulator bemorda shifoxonadan tashqari pnevmoniyada boshlang'ich antibiotik:",
  ["Siprofloksatsin", "Amoksitsillin", "Vankomitsin", "Meropenem"],
  "Allergiyada yoki atipik flora gumon qilinganda — makrolid yoki doksisiklin; respirator ftorxinolonlar — zaxira.");
q(0, "Типичная рентгенологическая картина вторичного туберкулёза лёгких:",
  ["Инфильтрат или каверна в верхних долях", "Двусторонние базальные инфильтраты", "Плевральный выпот без изменений в лёгких", "Кардиомегалия"],
  "Подтверждение — микроскопия мокроты, Xpert MTB/RIF, посев. Стандартная схема: 2HRZE/4HR.",
  "Ikkilamchi o'pka silining tipik rentgenologik manzarasi:",
  ["Yuqori bo'laklarda infiltrat yoki kaverna", "Ikki tomonlama bazal infiltratlar", "O'pkada o'zgarishsiz plevra suyuqligi", "Kardiomegaliya"],
  "Tasdiq — balg'am mikroskopiyasi, Xpert MTB/RIF, ekma. Standart sxema: 2HRZE/4HR.");
q(2, "Частые причины хронического кашля у некурящего взрослого с нормальной рентгенограммой:",
  ["Рак лёгкого", "ХОБЛ", "Синдром постназального затёка, астма, ГЭРБ", "Туберкулёз"],
  "Не забудьте иАПФ: сухой кашель возникает у 5–20% пациентов.",
  "Rentgenogrammasi normal, chekmaydigan kattada surunkali yo'talning ko'p uchraydigan sabablari:",
  ["O'pka saratoni", "SO'OK", "Postnazal oqish sindromi, astma, GERK", "Sil"],
  "AAF ingibitorlarini unutmang: quruq yo'tal bemorlarning 5–20% ida uchraydi.");
q(3, "Электролитное нарушение, вызывающее высокие «шатровые» зубцы T:",
  ["Гипокалиемия", "Гипокальциемия", "Гипомагниемия", "Гиперкалиемия"],
  "При гипокалиемии — уплощение T, волна U, удлинение QT.",
  "Baland «chodirsimon» T tishchalarni keltirib chiqaradigan elektrolit buzilishi:",
  ["Gipokaliyemiya", "Gipokalsiyemiya", "Gipomagniyemiya", "Giperkaliyemiya"],
  "Gipokaliyemiyada — T ning yassilanishi, U to'lqin, QT uzayishi.");
q(1, "Безопасная скорость коррекции хронической гипонатриемии:",
  ["До 20 ммоль/л за сутки", "Не более 8–10 ммоль/л за 24 ч", "Как можно быстрее до нормы", "Не более 1 ммоль/л за сутки"],
  "Слишком быстрая коррекция вызывает осмотический демиелинизирующий синдром (центральный понтинный миелинолиз).",
  "Surunkali giponatriyemiyani xavfsiz tuzatish tezligi:",
  ["Sutkasiga 20 mmol/l gacha", "24 soatda 8–10 mmol/l dan ko'p emas", "Imkon qadar tez me'yorgacha", "Sutkasiga 1 mmol/l dan ko'p emas"],
  "Juda tez tuzatish osmotik demiyelinlovchi sindromga (markaziy pontin miyelinoliz) olib keladi.");
q(0, "Наиболее частая причина гиперкальциемии у амбулаторных пациентов:",
  ["Первичный гиперпаратиреоз", "Метастазы в кости", "Саркоидоз", "Передозировка витамина D"],
  "У госпитализированных лидирует гиперкальциемия при злокачественных опухолях (ПТГ-родственный пептид, метастазы).",
  "Ambulator bemorlarda giperkalsiyemiyaning eng ko'p uchraydigan sababi:",
  ["Birlamchi giperparatireoz", "Suyaklarga metastazlar", "Sarkoidoz", "Vitamin D dozasining oshib ketishi"],
  "Statsionar bemorlarda xavfli o'smalardagi giperkalsiyemiya yetakchi (PTG ga o'xshash peptid, metastazlar).");

/* ---------- 3_endo ---------- */
sub("Эндокринология", "Endokrinologiya");
q(2, "Диагностический критерий сахарного диабета:",
  ["Глюкоза натощак 6.0 ммоль/л", "HbA1c 5.8%", "HbA1c ≥6.5% или глюкоза натощак ≥7.0 ммоль/л (дважды)", "Глюкозурия"],
  "Также случайная глюкоза ≥11.1 ммоль/л с симптомами или ≥11.1 через 2 ч в ОГТТ.",
  "Qandli diabetning diagnostik mezoni:",
  ["Och qoringa glyukoza 6.0 mmol/l", "HbA1c 5.8%", "HbA1c ≥6.5% yoki och qoringa glyukoza ≥7.0 mmol/l (ikki marta)", "Glyukozuriya"],
  "Shuningdek simptomlar bilan tasodifiy glyukoza ≥11.1 mmol/l yoki OGTT da 2 soatdan keyin ≥11.1.");
q(0, "Препарат первой линии при сахарном диабете 2 типа без противопоказаний:",
  ["Метформин", "Инсулин гларгин", "Глибенкламид", "Акарбоза"],
  "При ССЗ, ХСН или ХБП добавляют иНГЛТ-2 или арГПП-1 независимо от уровня HbA1c.",
  "Qarshi ko'rsatmalar bo'lmaganda 2-tip qandli diabetda birinchi qator dori:",
  ["Metformin", "Insulin glargin", "Glibenklamid", "Akarboza"],
  "YuQTK, SYuY yoki SBK bo'lsa, HbA1c darajasidan qat'i nazar NGLT-2 ingibitori yoki GPP-1 agonisti qo'shiladi.");
q(3, "Первая помощь при гипогликемии у пациента в сознании:",
  ["Инсулин короткого действия", "Глюкагон в/в", "Белковая пища", "15–20 г быстрых углеводов и повторная глюкометрия через 15 мин"],
  "Правило «15/15». Без сознания — 40% глюкоза в/в или глюкагон 1 мг в/м.",
  "Hushi joyida bemorda gipoglikemiyada birinchi yordam:",
  ["Qisqa ta'sirli insulin", "V/i glyukagon", "Oqsilli ovqat", "15–20 g tez so'riluvchi uglevod va 15 daqiqadan keyin qayta glyukometriya"],
  "«15/15» qoidasi. Hushsiz bo'lsa — 40% glyukoza v/i yoki glyukagon 1 mg m/i.");
q(1, "Отличие гиперосмолярного гипергликемического состояния от ДКА:",
  ["Выраженный кетоацидоз", "Глюкоза >30 ммоль/л, осмолярность >320 мосм/кг, кетоза нет или он минимален", "Низкая глюкоза", "Типично для детей с СД 1 типа"],
  "ГГС развивается у пожилых с СД 2 типа на фоне тяжёлой дегидратации; летальность выше, чем при ДКА.",
  "Giperosmolyar giperglikemik holatning DKA dan farqi:",
  ["Yaqqol ketoatsidoz", "Glyukoza >30 mmol/l, osmolyarlik >320 mOsm/kg, ketoz yo'q yoki minimal", "Past glyukoza", "1-tip QD li bolalar uchun xos"],
  "GGH og'ir degidratatsiya fonida 2-tip QD li keksalarda rivojlanadi; o'lim DKA dagidan yuqori.");
q(2, "Лабораторная картина первичного гипотиреоза:",
  ["ТТГ ↓, свободный Т4 ↑", "ТТГ ↓, свободный Т4 ↓", "ТТГ ↑, свободный Т4 ↓", "ТТГ в норме, Т3 ↑"],
  "Самая частая причина — аутоиммунный тиреоидит Хашимото (АТ-ТПО). Лечение — левотироксин.",
  "Birlamchi gipotireozning laborator manzarasi:",
  ["TTG ↓, erkin T4 ↑", "TTG ↓, erkin T4 ↓", "TTG ↑, erkin T4 ↓", "TTG me'yorda, T3 ↑"],
  "Eng ko'p sabab — Xashimoto autoimmun tireoiditi (AT-TPO). Davolash — levotiroksin.");
q(0, "Причина тиреотоксикоза с экзофтальмом и диффузным зобом:",
  ["Болезнь Грейвса (антитела к рецептору ТТГ)", "Тиреоидит Хашимото", "Токсическая аденома", "Подострый тиреоидит де Кервена"],
  "Офтальмопатия и претибиальная микседема специфичны для болезни Грейвса. Лечение: тиамазол, радиойод или операция.",
  "Ekzoftalm va diffuz buqoq bilan kechuvchi tireotoksikoz sababi:",
  ["Greyvs kasalligi (TTG retseptoriga antitanalar)", "Xashimoto tireoiditi", "Toksik adenoma", "De Kerven yarim o'tkir tireoiditi"],
  "Oftalmopatiya va pretibial miksedema Greyvs kasalligi uchun xos. Davolash: tiamazol, radioyod yoki operatsiya.");
q(3, "Препарат выбора при тиреотоксикозе в I триместре беременности:",
  ["Тиамазол", "Радиоактивный йод", "Левотироксин", "Пропилтиоурацил"],
  "Тиамазол в I триместре тератогенен; со II триместра переходят на тиамазол (ПТУ гепатотоксичен). Радиойод при беременности противопоказан.",
  "Homiladorlikning I trimestrida tireotoksikozda tanlov dorisi:",
  ["Tiamazol", "Radioaktiv yod", "Levotiroksin", "Propiltiouratsil"],
  "I trimestrda tiamazol teratogen; II trimestrdan tiamazolga o'tiladi (PTU gepatotoksik). Homiladorlikda radioyod mumkin emas.");
q(1, "Классические признаки первичной надпочечниковой недостаточности (болезнь Аддисона):",
  ["Гипертензия и гипокалиемия", "Гиперпигментация, гипотензия, гипонатриемия, гиперкалиемия", "Стрии и центральное ожирение", "Экзофтальм и тремор"],
  "Гиперпигментация — следствие избытка АКТГ. Аддисонический криз: гидрокортизон 100 мг в/в + физраствор.",
  "Birlamchi buyrak usti bezi yetishmovchiligining (Addison kasalligi) klassik belgilari:",
  ["Gipertenziya va gipokaliyemiya", "Giperpigmentatsiya, gipotenziya, giponatriyemiya, giperkaliyemiya", "Striyalar va markaziy semizlik", "Ekzoftalm va tremor"],
  "Giperpigmentatsiya — AKTG ortiqchaligi oqibati. Addison krizi: gidrokortizon 100 mg v/i + fiziologik eritma.");
q(2, "Скрининговый тест при подозрении на синдром Кушинга:",
  ["Утренний АКТГ", "Глюкоза натощак", "Ночной подавляющий тест с 1 мг дексаметазона или поздневечерний кортизол слюны", "УЗИ надпочечников"],
  "Сначала доказывают гиперкортицизм, затем ищут источник: АКТГ, МРТ гипофиза, КТ надпочечников.",
  "Kushing sindromi gumon qilinganda skrining testi:",
  ["Ertalabki AKTG", "Och qoringa glyukoza", "1 mg deksametazon bilan tungi supressiya testi yoki kechki so'lak kortizoli", "Buyrak usti bezlari UTT si"],
  "Avval giperkortitsizm isbotlanadi, so'ng manba izlanadi: AKTG, gipofiz MRT si, buyrak usti bezlari KT si.");
q(3, "Классическая триада феохромоцитомы на фоне гипертензии:",
  ["Жажда, полиурия, похудание", "Ожирение, стрии, гипертензия", "Тремор, экзофтальм, тахикардия", "Головная боль, потливость, сердцебиение"],
  "Диагноз — метанефрины в плазме или моче. Перед операцией сначала альфа-блокатор, затем бета-блокатор.",
  "Gipertenziya fonida feoxromotsitomaning klassik triadasi:",
  ["Chanqoq, poliuriya, ozish", "Semizlik, striyalar, gipertenziya", "Tremor, ekzoftalm, taxikardiya", "Bosh og'rig'i, terlash, yurak urib ketishi"],
  "Tashxis — plazma yoki siydikda metanefrinlar. Operatsiyadan oldin avval alfa-blokator, so'ng beta-blokator.");
q(0, "Причина вторичной гипертензии с гипокалиемией и низким ренином:",
  ["Первичный гиперальдостеронизм (синдром Конна)", "Стеноз почечной артерии", "Феохромоцитома", "Гипотиреоз"],
  "Скрининг — альдостерон-рениновое соотношение. Лечение — спиронолактон или адреналэктомия при аденоме.",
  "Gipokaliyemiya va past renin bilan kechuvchi ikkilamchi gipertenziya sababi:",
  ["Birlamchi giperaldosteronizm (Konn sindromi)", "Buyrak arteriyasi stenozi", "Feoxromotsitoma", "Gipotireoz"],
  "Skrining — aldosteron-renin nisbati. Davolash — spironolakton yoki adenomada adrenalektomiya.");
q(1, "Целевой HbA1c для большинства взрослых с сахарным диабетом:",
  ["<5.0%", "<7.0% (цель индивидуальна)", "<9.0%", "<10%"],
  "Мягче (<8%) — у пожилых, при частых гипогликемиях и тяжёлых сопутствующих болезнях.",
  "Qandli diabetli kattalarning ko'pchiligi uchun maqsadli HbA1c:",
  ["<5.0%", "<7.0% (maqsad individual)", "<9.0%", "<10%"],
  "Yumshoqroq (<8%) — keksalarda, tez-tez gipoglikemiyada va og'ir yondosh kasalliklarda.");
q(2, "Осложнение диабета, для скрининга которого ежегодно определяют отношение альбумин/креатинин в моче:",
  ["Ретинопатия", "Нейропатия", "Нефропатия", "Гастропарез"],
  "Альбуминурия ≥3 мг/ммоль (30 мг/г) — ранний маркер. Ретинопатию выявляет офтальмолог, нейропатию — тест с монофиламентом.",
  "Skriningi uchun har yili siydikda albumin/kreatinin nisbati aniqlanadigan diabet asorati:",
  ["Retinopatiya", "Neyropatiya", "Nefropatiya", "Gastroparez"],
  "Albuminuriya ≥3 mg/mmol (30 mg/g) — erta marker. Retinopatiyani oftalmolog, neyropatiyani monofilament testi aniqlaydi.");
q(3, "Основной механизм действия иНГЛТ-2 (эмпаглифлозин, дапаглифлозин):",
  ["Стимуляция секреции инсулина", "Подавление продукции глюкозы печенью", "Замедление всасывания углеводов", "Усиление выведения глюкозы с мочой"],
  "Снижают сердечно-сосудистую смертность, госпитализации по ХСН и прогрессирование ХБП. Риски — генитальные инфекции, эугликемический ДКА.",
  "NGLT-2 ingibitorlarining (empagliflozin, dapagliflozin) asosiy ta'sir mexanizmi:",
  ["Insulin sekretsiyasini rag'batlantirish", "Jigarda glyukoza ishlab chiqarilishini susaytirish", "Uglevodlar so'rilishini sekinlashtirish", "Glyukozaning siydik bilan chiqarilishini kuchaytirish"],
  "Yurak-qon tomir o'limini, SYuY bo'yicha gospitalizatsiyalarni va SBK zo'rayishini kamaytiradi. Xavflar — genital infeksiyalar, evglikemik DKA.");
q(1, "Признаки гипокальциемии при осмотре:",
  ["Симптом Мюссе", "Симптомы Хвостека и Труссо", "Симптом Мёрфи", "Симптом Кернига"],
  "Частая причина — повреждение паращитовидных желёз после тиреоидэктомии. Остро — кальция глюконат в/в.",
  "Ko'rikda gipokalsiyemiya belgilari:",
  ["Myusse simptomi", "Xvostek va Trusso simptomlari", "Merfi simptomi", "Kernig simptomi"],
  "Ko'p sabab — tireoidektomiyadan keyin qalqonsimon oldi bezlarining shikastlanishi. O'tkir holatda — kalsiy glyukonat v/i.");
q(0, "Частая причина гиперпролактинемии (кроме беременности и лекарств):",
  ["Пролактинома", "Гипертиреоз", "Синдром Кушинга", "Акромегалия"],
  "Также гипотиреоз и антипсихотики. Лечение пролактиномы — агонисты дофамина (каберголин).",
  "Giperprolaktinemiyaning ko'p uchraydigan sababi (homiladorlik va dorilardan tashqari):",
  ["Prolaktinoma", "Gipertireoz", "Kushing sindromi", "Akromegaliya"],
  "Shuningdek gipotireoz va antipsixotiklar. Prolaktinomani davolash — dofamin agonistlari (kabergolin).");
q(2, "Гормон, избыток которого вызывает акромегалию:",
  ["Пролактин", "АКТГ", "Соматотропный гормон", "ТТГ"],
  "Скрининг — ИФР-1; подтверждение — отсутствие подавления СТГ в ОГТТ. Лечение — транссфеноидальная операция.",
  "Ortiqchaligi akromegaliyaga sabab bo'ladigan gormon:",
  ["Prolaktin", "AKTG", "Somatotrop gormon", "TTG"],
  "Skrining — IFR-1; tasdiq — OGTT da STG ning pasaymasligi. Davolash — transsfenoidal operatsiya.");
q(3, "Типичный признак несахарного диабета:",
  ["Гипергликемия", "Глюкозурия", "Высокая осмолярность мочи", "Полиурия с низкой осмолярностью мочи и жажда"],
  "Центральный (дефицит АДГ) отвечает на десмопрессин; нефрогенный (литий, гиперкальциемия) — нет.",
  "Qandsiz diabetning tipik belgisi:",
  ["Giperglikemiya", "Glyukozuriya", "Siydikning yuqori osmolyarligi", "Siydik osmolyarligi past poliuriya va chanqoq"],
  "Markaziy shakli (ADG tanqisligi) desmopressinga javob beradi; nefrogen shakli (litiy, giperkalsiyemiya) — yo'q.");
q(1, "Метод выбора при узле щитовидной железы >1 см с подозрительными признаками на УЗИ:",
  ["Сцинтиграфия всем", "Тонкоигольная аспирационная биопсия", "КТ шеи", "Определение тиреоглобулина"],
  "Показания к биопсии определяют по TI-RADS; цитологию оценивают по системе Bethesda.",
  "UTT da shubhali belgilari bor >1 sm qalqonsimon bez tuguni uchun tanlov usuli:",
  ["Hammaga ssintigrafiya", "Ingichka ignali aspiratsion biopsiya", "Bo'yin KT si", "Tireoglobulinni aniqlash"],
  "Biopsiyaga ko'rsatmalar TI-RADS bo'yicha belgilanadi; sitologiya Bethesda tizimi bo'yicha baholanadi.");
q(0, "Остеопороз по денситометрии (DXA) у женщины в постменопаузе:",
  ["T-критерий ≤ −2.5", "T-критерий от −1 до −2.5", "Z-критерий ≥ 0", "T-критерий ≥ +1"],
  "От −1 до −2.5 — остеопения. Низкотравматичный перелом означает остеопороз независимо от T. Лечение — бисфосфонаты, кальций, витамин D.",
  "Postmenopauzadagi ayolda densitometriya (DXA) bo'yicha osteoporoz:",
  ["T-mezon ≤ −2.5", "T-mezon −1 dan −2.5 gacha", "Z-mezon ≥ 0", "T-mezon ≥ +1"],
  "−1 dan −2.5 gacha — osteopeniya. Kam travmatik sinish T dan qat'i nazar osteoporozni bildiradi. Davolash — bisfosfonatlar, kalsiy, vitamin D.");

/* ---------- 4_emerg ---------- */
sub("Неотложная помощь", "Shoshilinch yordam");
q(1, "Соотношение компрессий и вдохов при СЛР у взрослого:",
  ["15:2", "30:2", "5:1", "3:1"],
  "Частота 100–120 в минуту, глубина 5–6 см, полное расправление грудной клетки и минимум пауз.",
  "Kattalarda YuO'R da kompressiya va nafas berish nisbati:",
  ["15:2", "30:2", "5:1", "3:1"],
  "Chastota daqiqasiga 100–120, chuqurlik 5–6 sm, ko'krak qafasining to'liq yozilishi va minimal pauzalar.");
q(3, "Доза адреналина при анафилаксии у взрослого:",
  ["1 мг в/в болюсно", "0.1 мг п/к", "10 мг в/м", "0.5 мг в/м (раствор 1 мг/мл) в переднебоковую поверхность бедра"],
  "Повторяют каждые 5 мин при необходимости. Болюс 1 мг в/в — только при остановке сердца.",
  "Kattalarda anafilaksiyada adrenalin dozasi:",
  ["1 mg v/i bolyus", "0.1 mg t/o", "10 mg m/i", "0.5 mg m/i (1 mg/ml eritma) sonning old-yon yuzasiga"],
  "Zarur bo'lsa har 5 daqiqada takrorlanadi. 1 mg v/i bolyus — faqat yurak to'xtaganda.");
q(0, "Антидот при передозировке опиоидов:",
  ["Налоксон", "Флумазенил", "Атропин", "Ацетилцистеин"],
  "Признаки: угнетение сознания, миоз, брадипноэ. Флумазенил — антидот бензодиазепинов, ацетилцистеин — парацетамола.",
  "Opioidlar dozasi oshib ketganda antidot:",
  ["Nalokson", "Flumazenil", "Atropin", "Atsetilsistein"],
  "Belgilar: hushning susayishi, mioz, bradipnoe. Flumazenil — benzodiazepinlar antidoti, atsetilsistein — paratsetamol antidoti.");
q(2, "Антидот при отравлении парацетамолом:",
  ["Налоксон", "Этанол", "N-ацетилцистеин", "Витамин K"],
  "Наиболее эффективен в первые 8 часов; решение о лечении — по номограмме концентрации парацетамола.",
  "Paratsetamoldan zaharlanishda antidot:",
  ["Nalokson", "Etanol", "N-atsetilsistein", "Vitamin K"],
  "Birinchi 8 soatda eng samarali; davolash haqidagi qaror paratsetamol konsentratsiyasi nomogrammasi bo'yicha qabul qilinadi.");
q(1, "Отравление фосфорорганическими соединениями проявляется:",
  ["Мидриазом и сухой кожей", "Миозом, слюнотечением, бронхореей, брадикардией", "Гипертермией без изменения зрачков", "Покраснением кожи и тахикардией"],
  "Холинергический синдром. Лечение: деконтаминация, атропин до «сухих лёгких» и пралидоксим.",
  "Fosfororganik birikmalardan zaharlanish qanday namoyon bo'ladi?",
  ["Midriaz va quruq teri", "Mioz, so'lak oqishi, bronxoreya, bradikardiya", "Qorachiqlar o'zgarmagan gipertermiya", "Terining qizarishi va taxikardiya"],
  "Xolinergik sindrom. Davolash: dekontaminatsiya, «quruq o'pka»gacha atropin va pralidoksim.");
q(3, "Первоочередная мера при отравлении угарным газом:",
  ["Активированный уголь", "Налоксон", "Промывание желудка", "100% кислород через маску (при тяжёлом отравлении — гипербарическая оксигенация)"],
  "Пульсоксиметр показывает ложно нормальную SpO2 — нужен уровень карбоксигемоглобина в газах крови.",
  "Is gazidan zaharlanishda birinchi navbatdagi chora:",
  ["Faollashtirilgan ko'mir", "Nalokson", "Oshqozonni yuvish", "Niqob orqali 100% kislorod (og'ir zaharlanishda — giperbarik oksigenatsiya)"],
  "Pulsoksimetr soxta normal SpO2 ko'rsatadi — qon gazlarida karboksigemoglobin darajasi kerak.");
q(0, "Площадь ожога всей правой руки у взрослого по правилу девяток:",
  ["9%", "18%", "4.5%", "1%"],
  "Голова 9%, каждая рука 9%, каждая нога 18%, передняя и задняя поверхность туловища по 18%, промежность 1%. Ладонь пациента ≈1%.",
  "To'qqizlar qoidasi bo'yicha kattalarda butun o'ng qo'l kuyishining maydoni:",
  ["9%", "18%", "4.5%", "1%"],
  "Bosh 9%, har bir qo'l 9%, har bir oyoq 18%, tananing old va orqa yuzasi 18% dan, oraliq 1%. Bemorning kafti ≈1%.");
q(2, "Формула Паркленда для инфузии при ожогах в первые 24 ч:",
  ["1 мл × масса × % ожога", "2 л на каждые 10% ожога", "4 мл × масса (кг) × % ожога, половина — за первые 8 ч", "10 мл/кг однократно"],
  "Раствор Рингера лактат; объём корректируют по диурезу (у взрослых 0.5 мл/кг/ч).",
  "Kuyishlarda birinchi 24 soatda infuziya uchun Parklend formulasi:",
  ["1 ml × vazn × kuyish %", "Har 10% kuyishga 2 l", "4 ml × vazn (kg) × kuyish %, yarmi — birinchi 8 soatda", "Bir marta 10 ml/kg"],
  "Ringer laktat eritmasi; hajm diurez bo'yicha tuzatiladi (kattalarda 0.5 ml/kg/soat).");
q(1, "Порядок первичного осмотра пострадавшего с тяжёлой травмой:",
  ["Сначала неврологический статус, затем дыхание", "<C>ABCDE: массивное кровотечение, дыхательные пути, дыхание, кровообращение, неврология, полный осмотр", "Сначала рентгенография, затем осмотр", "Сначала подробный анамнез"],
  "Угрожающие жизни состояния устраняют по ходу осмотра; шейный отдел позвоночника фиксируют при соответствующем механизме травмы.",
  "Og'ir jarohat olgan bemorni birlamchi ko'rik tartibi:",
  ["Avval nevrologik holat, keyin nafas", "<C>ABCDE: massiv qon ketish, nafas yo'llari, nafas, qon aylanishi, nevrologiya, to'liq ko'rik", "Avval rentgenografiya, keyin ko'rik", "Avval batafsil anamnez"],
  "Hayotga xavf soluvchi holatlar ko'rik davomida bartaraf etiladi; tegishli jarohat mexanizmida bo'yin umurtqalari fiksatsiya qilinadi.");
q(3, "Признак теплового удара, отличающий его от теплового истощения:",
  ["Обильная потливость", "Тошнота", "Головная боль", "Нарушение сознания при температуре тела >40 °C"],
  "Лечение — немедленное охлаждение (лучше погружение в холодную воду) до <39 °C. Жаропонижающие неэффективны.",
  "Issiq urishini issiqdan holsizlanishdan ajratib turuvchi belgi:",
  ["Ko'p terlash", "Ko'ngil aynishi", "Bosh og'rig'i", "Tana harorati >40 °C da hushning buzilishi"],
  "Davolash — zudlik bilan sovutish (yaxshisi sovuq suvga botirish) <39 °C gacha. Isitma tushiruvchilar samarasiz.");
q(0, "Препараты первой линии при эпилептическом статусе:",
  ["Бензодиазепины (лоразепам или диазепам в/в, мидазолам в/м)", "Сразу фенитоин", "Пропофол", "Магния сульфат"],
  "Если приступ продолжается — вальпроат, леветирацетам или фосфенитоин, далее наркоз в ОРИТ. Магния сульфат — при эклампсии.",
  "Epileptik statusda birinchi qator dorilar:",
  ["Benzodiazepinlar (lorazepam yoki diazepam v/i, midazolam m/i)", "Darhol fenitoin", "Propofol", "Magniy sulfat"],
  "Tutqanoq davom etsa — valproat, levetiratsetam yoki fosfenitoin, so'ng RITB da narkoz. Magniy sulfat — eklampsiyada.");
q(2, "Шкала qSOFA (подозрение на сепсис вне ОРИТ) включает:",
  ["Лихорадку, лейкоцитоз, тахикардию", "Лактат, креатинин, билирубин", "ЧДД ≥22, нарушение сознания, САД ≤100 мм рт.ст.", "SpO2, МНО, тромбоциты"],
  "≥2 балла — высокий риск неблагоприятного исхода. В первый час: лактат, посевы, антибиотики, при гипотензии 30 мл/кг кристаллоидов.",
  "qSOFA shkalasi (RITB dan tashqarida sepsis gumon qilinganda) nimalarni o'z ichiga oladi?",
  ["Isitma, leykotsitoz, taxikardiya", "Laktat, kreatinin, bilirubin", "NS ≥22, hushning buzilishi, SAB ≤100 mm sim. ust.", "SpO2, XMN, trombotsitlar"],
  "≥2 ball — noxush oqibat xavfi yuqori. Birinchi soatda: laktat, ekmalar, antibiotiklar, gipotenziyada 30 ml/kg kristalloidlar.");
q(1, "Целевое среднее АД и вазопрессор первой линии при септическом шоке:",
  ["≥90 мм рт.ст., адреналин", "≥65 мм рт.ст., норадреналин", "≥120 мм рт.ст., дофамин", "≥50 мм рт.ст., вазопрессин"],
  "Норадреналин — препарат первой линии; вазопрессин добавляют при недостаточном ответе.",
  "Septik shokda maqsadli o'rtacha AQB va birinchi qator vazopressor:",
  ["≥90 mm sim. ust., adrenalin", "≥65 mm sim. ust., noradrenalin", "≥120 mm sim. ust., dofamin", "≥50 mm sim. ust., vazopressin"],
  "Noradrenalin — birinchi qator dori; javob yetarli bo'lmasa vazopressin qo'shiladi.");
q(3, "Обратимые причины остановки сердца («4Г и 4Т»):",
  ["Гипергликемия и гипертензия", "Гастрит и гепатит", "Глаукома и гипотиреоз", "Гипоксия, гиповолемия, гипо/гиперкалиемия, гипотермия; тромбоз, тампонада, напряжённый пневмоторакс, токсины"],
  "Их ищут и устраняют во время СЛР — особенно важно при асистолии и электрической активности без пульса.",
  "Yurak to'xtashining qaytar sabablari («4G va 4T»):",
  ["Giperglikemiya va gipertenziya", "Gastrit va gepatit", "Glaukoma va gipotireoz", "Gipoksiya, gipovolemiya, gipo/giperkaliyemiya, gipotermiya; tromboz, tamponada, taranglashgan pnevmotoraks, toksinlar"],
  "Ular YuO'R davomida izlanadi va bartaraf etiladi — ayniqsa asistoliya va pulssiz elektr faollikda muhim.");
q(0, "Положение пострадавшего без сознания с нормальным дыханием (без подозрения на травму позвоночника):",
  ["Устойчивое боковое положение", "На спине с поднятой головой", "На животе", "Сидя"],
  "Предупреждает аспирацию и западение языка; дыхание проверяют регулярно.",
  "Hushsiz, lekin normal nafas olayotgan jabrlanuvchining holati (umurtqa jarohati gumoni yo'q):",
  ["Barqaror yonboshlagan holat", "Boshi ko'tarilgan holda chalqancha", "Qorni bilan", "O'tirgan holda"],
  "Aspiratsiya va til tushib qolishining oldini oladi; nafas muntazam tekshiriladi.");

})();
