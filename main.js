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

  /* Объёмный наклон: карточки услуг, «О нас», логотип */
  if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    doc.querySelectorAll('.card, .person, .logo').forEach(function (c) {
      var k = c.classList.contains('logo') ? { p: 420, a: 18, b: 22, l: -2 } : { p: 900, a: 9, b: 11, l: -6 };
      // когда карточка уже появилась, снимаем «появление», чтобы оно не мешало наклону
      c.addEventListener('transitionend', function (e) {
        if (e.target === c && e.propertyName === 'transform' && c.classList.contains('is-in')) { c.classList.remove('reveal', 'is-in'); }
      });
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = 'perspective(' + k.p + 'px) rotateX(' + (-y * k.a).toFixed(2) + 'deg) rotateY(' + (x * k.b).toFixed(2) + 'deg) translateY(' + k.l + 'px)';
        c.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%');
        c.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(0) + '%');
        c.style.setProperty('--sx', (-x * 22).toFixed(0) + 'px');
        c.style.setProperty('--sy', (18 - y * 12).toFixed(0) + 'px');
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  /* Год в подвале */
  var y = doc.getElementById('year');
  if (y) { y.textContent = new Date().getFullYear(); }

/* Слайдер проектов "Что мы уже сделали" */
  var track = doc.querySelector('.slider-track');
  var prevBtn = doc.querySelector('.prev-btn');
  var nextBtn = doc.querySelector('.next-btn');

  if (track && prevBtn && nextBtn) {
    var slides = track.querySelectorAll('.work');
    var currentIndex = 0;

    function updateSlider() {
      track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
    }

    nextBtn.addEventListener('click', function () {
      if (currentIndex < slides.length - 1) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      updateSlider();
    });

    prevBtn.addEventListener('click', function () {
      if (currentIndex > 0) {
        currentIndex--;
      } else {
        currentIndex = slides.length - 1;
      }
      updateSlider();
    });
  }


})();

