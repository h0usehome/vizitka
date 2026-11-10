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

  /* Небоскрёбы по бокам и верхолазы: едут по фасадам вместе с прокруткой */
  (function () {
    var city = doc.createElement('div'); city.className = 'city'; city.setAttribute('aria-hidden', 'true');
    // [x %, ширина %, верх %, глубина: 0 дальний, 1 ближний]
    var LEFT = [[8,36,16,0],[44,38,30,0],[0,34,36,1],[30,30,52,1],[58,42,44,1]];
    var RIGHT = [[52,40,20,0],[12,38,34,0],[66,34,40,1],[34,32,56,1],[0,30,46,1]];
    function sky(arr, id) {
      var s = '<svg class="city__svg" width="100%" height="100%"><defs>' +
        '<pattern id="w' + id + '" width="12" height="16" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="6" height="8" rx="1"/></pattern>' +
        '<pattern id="l' + id + '" width="36" height="48" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="6" height="8" rx="1"/><rect x="15" y="20" width="6" height="8" rx="1"/><rect x="27" y="36" width="6" height="8" rx="1"/></pattern></defs>';
      arr.forEach(function (b) {
        var g = (0.5 + b[3] * 0.5).toFixed(2), geo = 'x="' + b[0] + '%" y="' + b[2] + '%" width="' + b[1] + '%" height="' + (100 - b[2]) + '%"';
        s += '<g opacity="' + g + '"><rect class="b" ' + geo + '/><rect class="win" ' + geo + ' style="fill:url(#w' + id + ')"/><rect class="lit" ' + geo + ' style="fill:url(#l' + id + ')"/>' +
          '<line class="ant" x1="' + (b[0] + b[1] / 2) + '%" x2="' + (b[0] + b[1] / 2) + '%" y1="' + (b[2] - 4) + '%" y2="' + b[2] + '%"/></g>';
      });
      return s + '</svg>';
    }
    function man(color, prop) {
      return '<div class="climber" style="--c:' + color + '"><span class="climber__rope"></span><div class="climber__body">' +
        '<svg viewBox="0 0 44 74" width="44" height="74">' +
        '<g class="leg-l"><rect class="suit" x="15" y="45" width="6" height="19" rx="3"/><rect class="shoe" x="14" y="62" width="8" height="5" rx="2"/></g>' +
        '<g class="leg-r"><rect class="suit" x="23" y="45" width="6" height="19" rx="3"/><rect class="shoe" x="22" y="62" width="8" height="5" rx="2"/></g>' +
        '<rect class="suit" x="14" y="28" width="16" height="20" rx="5"/><rect class="belt" x="14" y="41" width="16" height="3"/>' +
        '<g class="arm-l"><line x1="15" y1="31" x2="19" y2="11"/><circle class="glove" cx="19" cy="10" r="3"/></g>' +
        '<g class="arm-r"><line x1="29" y1="31" x2="25" y2="11"/><circle class="glove" cx="25" cy="10" r="3"/></g>' +
        '<rect class="gear" x="19.5" y="0" width="5" height="9" rx="2"/>' +
        '<circle class="suit" cx="22" cy="20" r="9"/><rect class="visor" x="16" y="17" width="12" height="6" rx="3"/><circle class="shine" cx="19" cy="19.5" r="1.2"/>' +
        prop + '</svg></div></div>';
    }
    var tablet = '<rect class="prop" x="30" y="44" width="11" height="8" rx="1.5"/>';
    var lens = '<circle class="prop" cx="36" cy="47" r="4"/><line class="propl" x1="39" y1="50" x2="42" y2="54"/>';
    city.innerHTML = '<div class="city__side city__side--l">' + sky(LEFT, 'l') + man('var(--dev)', tablet) + '</div>' +
                     '<div class="city__side city__side--r">' + sky(RIGHT, 'r') + man('var(--seo)', lens) + '</div>';
    doc.body.appendChild(city);
    if (reduce) { return; }

    var mq = window.matchMedia('(min-width:1280px)');
    var men = Array.prototype.map.call(city.querySelectorAll('.climber'), function (el) {
      return { el: el, body: el.querySelector('.climber__body'), y: 84, v: 0 };
    });
    function tick(ts) {
      if (mq.matches) {
        var max = root.scrollHeight - window.innerHeight, p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        var lo = 84, hi = window.innerHeight - 96;
        var target = [lo + (hi - lo) * p, lo + (hi - lo) * (0.14 + 0.86 * p)];
        men.forEach(function (m, i) {
          var ny = m.y + (target[i] - m.y) * (i ? 0.055 : 0.085), v = ny - m.y;
          m.y = ny; m.v += (v - m.v) * 0.2;
          m.el.classList.toggle('is-moving', Math.abs(m.v) > 0.25);
          m.el.classList.toggle('is-up', m.v < 0);
          var ang = Math.max(-16, Math.min(16, -m.v * 1.8)) + Math.sin(ts / 900 + i * 2) * 3;
          m.el.style.transform = 'translate3d(0,' + ny.toFixed(1) + 'px,0)';
          m.body.style.transform = 'rotate(' + ang.toFixed(2) + 'deg)';
        });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* Год в подвале */
  var y = doc.getElementById('year');
  if (y) { y.textContent = new Date().getFullYear(); }
})();