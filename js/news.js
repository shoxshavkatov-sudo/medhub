/* =====================================================================
   MedHub — НОВОСТИ / YANGILIKLAR / NEWS
   =====================================================================

   RU — как добавить новость:
     1. Скопируйте шаблон ниже (от addNews до ");").
     2. Вставьте его под строкой «НОВОСТИ НИЖЕ».
     3. Замените дату и текст → «Commit changes».
     Порядок не важен: сайт сам сортирует новости по дате (новые сверху).
     Новость появится на сайте через 1–2 минуты (после пересборки Render).

   UZ — yangilik qo'shish:
     1. Pastdagi shablonni nusxalang (addNews dan ");" gacha).
     2. Uni «НОВОСТИ НИЖЕ» qatoridan keyin qo'ying.
     3. Sana va matnni almashtiring → «Commit changes».
     Tartib muhim emas: sayt yangiliklarni sanasi bo'yicha saralaydi.
     Yangilik 1–2 daqiqadan keyin saytda chiqadi.

   ---------------------------------------------------------------------
   ШАБЛОН / SHABLON:

   addNews({
     date:  '2026-11-11',                  // дата / sana: YYYY-MM-DD
     title: `Заголовок / Sarlavha`,
     text:  `Текст новости.
   Можно писать в несколько строк. Ko'p qatorli matn ham bo'ladi.`,
     image: 'img/news/photo.jpg',          // необязательно / ixtiyoriy
     link:  'https://t.me/...',            // необязательно / ixtiyoriy
     pinned: true,                         // закрепить сверху / tepada qotirish (ixtiyoriy)
   });

   Три языка (необязательно) / Uch tilda (ixtiyoriy):
     title: { uz: `Sarlavha`, ru: `Заголовок`, en: `Title` },
     text:  { uz: `Matn`,     ru: `Текст`,     en: `Text` },
   Если язык не заполнен, показывается другой. / Til bo'lmasa, boshqasi ko'rsatiladi.

   ВАЖНО / MUHIM:
   • Заголовок и текст пишите в обратных кавычках `...` (клавиша Ё / ~).
     Тогда апостроф в o'quv, g'alaba ничего не ломает.
     Sarlavha va matnni `...` ichida yozing — shunda o' va g' muammo qilmaydi.
   • Внутри `...` нельзя символ ` . / `...` ichida ` belgisi bo'lmasin.
   • Картинки загружайте в папку img/news/ / Rasmlarni img/news/ papkasiga yuklang.
   • Скрыть новость: удалите блок или добавьте  hidden: true,
     Yashirish: blokni o'chiring yoki  hidden: true,  qo'shing.
   • Удобнее: генератор кода на сайте — откройте сайт с ?editor в конце адреса,
     раздел «Новости» → «Добавить новость».
     Qulayroq: saytni manzil oxirida ?editor bilan oching → «Yangiliklar» → «Yangilik qo'shish».
   ===================================================================== */

window.MEDHUB_NEWS = [];
function addNews(item){ window.MEDHUB_NEWS.push(item); }

/* ===================== НОВОСТИ НИЖЕ / YANGILIKLAR PASTDA ===================== */

addNews({
  date: '2026-11-11',
  title: {
    uz: `MedHub'da «Yangiliklar» bo'limi ishga tushdi`,
    ru: `В MedHub появился раздел «Новости»`,
    en: `MedHub now has a News section`
  },
  text: {
    uz: `Endi platformadagi barcha e'lonlar va yangiliklar shu yerda chiqadi. Yangi xabarlar yuqoridagi tugmada son bilan ko'rsatiladi.`,
    ru: `Теперь все объявления и новости платформы будут публиковаться здесь. О новых записях подскажет счётчик на кнопке вверху.`,
    en: `All platform announcements and news will be posted here. The counter on the top button shows unread posts.`
  },
});
