(function () {
  'use strict';
  var doc = document, root = doc.documentElement;

  /* Мобильное меню */
  var burger = doc.querySelector('.burger');
  var nav = doc.getElementById('nav');
  function setMenu(open) {
    if (!burger || !nav) { return; }
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    doc.body.classList.toggle('nav-open', open);
  }
  if (burger && nav) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 820) { setMenu(false); } });
  }

  /* Палитра по ссылке для примерки: ?palette=forest | violet | ochre | indigo */
  var m = /[?&]palette=(indigo|forest|violet|ochre)/.exec(location.search);
  if (m) { root.setAttribute('data-palette', m[1]); }

  /* Полоса прокрутки страницы */
  var bar = doc.querySelector('.progress');
  function progress() {
    if (!bar) { return; }
    var h = root.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
  }
  window.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  progress();

  /* Линия под шапкой после прокрутки */
  var header = doc.querySelector('.header');
  function onScroll() { if (header) { header.classList.toggle('is-stuck', window.scrollY > 8); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Плавное появление блоков (если что-то пойдёт не так, всё просто покажется) */
  var items = doc.querySelectorAll('.section__head, .card, .person, .facts li, .compare__col, .work, .qa, .post, .tabs, .contact__in > *');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) {
      // Соседние блоки появляются по очереди
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
      el.classList.add('reveal'); io.observe(el);
    });
    // Страховка: через 2,5 секунды показываем всё, что не успело появиться
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 2500);
  }

  /* В «Частых вопросах» раскрыт один ответ за раз */
  var qa = doc.querySelectorAll('.qa');
  qa.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) { qa.forEach(function (o) { if (o !== d) { o.open = false; } }); }
    });
  });

  /* Выбор ниши в «Какой сайт нужен» */
  var cmp = doc.querySelector('.compare'), nTabs = doc.querySelectorAll('.tabs [data-i]');
  // [адрес плохого, заголовок плохого, адрес хорошего, заголовок, текст, кнопка, три плюса]
  var N = [
    ['kompaniya-stroy-uslugi.ru','ДОБРО ПОЖАЛОВАТЬ НА НАШ САЙТ','kompaniya.by','Ремонт квартир под ключ за 45 дней','Фиксированная цена в договоре. Приедем на замер бесплатно.','Рассчитать стоимость','Цена в договоре|Гарантия 3 года|Отчёт по этапам'],
    ['magazin-vse-dlya-vas.ru','ИНТЕРНЕТ-МАГАЗИН ТОВАРОВ ДЛЯ ВСЕХ','kofe-obzharka.by','Кофе из обжарки в день заказа','Доставка за 2 часа. На первый заказ скидка 10%.','Выбрать кофе','Свежая обжарка|Доставка от 2 часов|Возврат за 14 дней'],
    ['med-centr-zdorovie-plus.ru','МЕДИЦИНСКИЙ ЦЕНТР ЗДОРОВЬЕ ПЛЮС','zuby.by','Лечим зубы без боли. Запись на сегодня','Осмотр и план лечения бесплатно. Цены в прайсе, без сюрпризов.','Записаться на приём','Без боли|Цены в прайсе|Гарантия на работу'],
    ['yurist-pravo-konsultaciya.ru','ЮРИДИЧЕСКИЕ УСЛУГИ ДЛЯ ВСЕХ','pravo.by','Вернём деньги по спорному договору','Первая консультация бесплатно. Оплата за результат.','Описать ситуацию','Бесплатный разбор|Оплата за результат|Ответ за 1 день'],
    ['[адрес-вашего-клиента].ru','[ЗАГОЛОВОК КАК У ВСЕХ]','[адрес].by','[Что вы продаёте и кому]','[Одно предложение с выгодой и сроком]','[Действие]','[Плюс 1]|[Плюс 2]|[Плюс 3]']
  ];
  function niche(i) {
    var n = N[i], g = n[6].split('|'), u = cmp.querySelectorAll('.mock__bar span');
    u[0].textContent = n[0]; u[1].textContent = n[2];
    cmp.querySelector('.bad-title').textContent = n[1];
    cmp.querySelector('.good-title').textContent = n[3];
    cmp.querySelector('.good-text').textContent = n[4];
    cmp.querySelector('.good-btn').textContent = n[5];
    cmp.querySelectorAll('.good-row b').forEach(function (b, k) { b.textContent = g[k]; });
  }
  if (cmp) {
    nTabs.forEach(function (t) {
      t.addEventListener('click', function () {
        if (t.getAttribute('aria-pressed') === 'true') { return; }
        nTabs.forEach(function (o) { o.setAttribute('aria-pressed', o === t ? 'true' : 'false'); });
        cmp.classList.add('is-swap');
        setTimeout(function () { niche(+t.dataset.i); cmp.classList.remove('is-swap'); }, 180);
      });
    });
  }

  /* Фильтр статей в блоге */
  var fb = doc.querySelectorAll('.tabs [data-f]'), posts = doc.querySelectorAll('.posts--blog .post');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.f, shown = 0;
      fb.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      posts.forEach(function (p) { var ok = f === 'all' || p.dataset.cat === f; p.hidden = !ok; if (ok) { shown++; } });
      var em = doc.querySelector('.empty'); if (em) { em.hidden = shown > 0; }
    });
  });

  /* Курсор: кольцо, магнитные кнопки, подсветка под указателем */
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && !reduce) {
    var ring = doc.createElement('div'); ring.className = 'cursor'; ring.setAttribute('aria-hidden', 'true'); doc.body.appendChild(ring);
    var cx = 0, cy = 0, tx = 0, ty = 0, run = false;
    function tick() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      ring.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.1) { requestAnimationFrame(tick); } else { run = false; }
    }
    doc.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; ring.classList.add('is-on');
      if (!run) { run = true; requestAnimationFrame(tick); }
      ring.classList.toggle('is-link', !!e.target.closest('a, button, summary'));
      var s = e.target.closest('.card, .post, .hero');
      if (s) { var r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
      var b = e.target.closest('.btn');
      if (b) { var q = b.getBoundingClientRect(); b.style.setProperty('--tx', ((e.clientX - q.left - q.width / 2) * 0.18).toFixed(1) + 'px'); b.style.setProperty('--ty', ((e.clientY - q.top - q.height / 2) * 0.3).toFixed(1) + 'px'); }
    });
    doc.addEventListener('pointerout', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (b && !b.contains(e.relatedTarget)) { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); }
    });
    doc.addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
    doc.addEventListener('pointerup', function () { ring.classList.remove('is-down'); });
    doc.documentElement.addEventListener('mouseleave', function () { ring.classList.remove('is-on'); });
  }

  /* Год в подвале */
  var y = doc.getElementById('year');
  if (y) { y.textContent = new Date().getFullYear(); }
})();