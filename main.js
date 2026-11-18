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
  var items = doc.querySelectorAll('.section__head, .card, .person, .facts li, .compare__col, .work, .step, .qa, .post, .tabs, .contact__in > *');
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
        if (c.classList.contains('is-open')) { return; }
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

/* ===== Услуги: карточка «Подробнее» раскрывается на всю сетку ===== */
  var grid = doc.querySelector('#services .cards');
  if (grid) {
    var DUR = reduce ? 0 : 500, FADE = reduce ? 0 : 220;
    var openCard = null, busy = false;

    function box(el) { return { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; }
    function place(el, b) { el.style.left = b.l + 'px'; el.style.top = b.t + 'px'; el.style.width = b.w + 'px'; el.style.height = b.h + 'px'; }
    function unplace(el) { el.style.left = el.style.top = el.style.width = el.style.height = ''; }
    function placeholder(card, h) { var ph = doc.createElement('div'); ph.className = 'card__ph'; ph.style.minHeight = h + 'px'; card.parentNode.insertBefore(ph, card); return ph; }
    function headerGap() { return (header ? header.offsetHeight : 0) + 16; }

    function expand(card) {
      if (busy || openCard) { return; }
      busy = true; openCard = card;
      card.style.transform = '';
      var from = box(card), gh = grid.offsetHeight;
      var ph = placeholder(card, from.h);
      grid.style.height = gh + 'px';
      grid.classList.add('is-busy');
      card.classList.add('is-floating', 'is-open');
      // меряем итоговую высоту: карточка на всю ширину сетки
      card.style.left = '0px'; card.style.top = '0px'; card.style.width = grid.clientWidth + 'px'; card.style.height = 'auto';
      var toH = card.offsetHeight;
      place(card, from);
      void card.offsetWidth; // фиксируем стартовое положение перед анимацией
      place(card, { l: 0, t: 0, w: grid.clientWidth, h: toH });
      grid.style.height = toH + 'px';

      var gt = grid.getBoundingClientRect().top;
      if (gt < headerGap() || gt > window.innerHeight * 0.5) {
        window.scrollTo({ top: window.scrollY + gt - headerGap(), behavior: reduce ? 'auto' : 'smooth' });
      }

      setTimeout(function () { card.classList.add('is-shown'); }, DUR * 0.45); // содержимое проявляется во время раскрытия
      setTimeout(function () {
        ph.remove();
        grid.classList.add('is-expanded');
        card.classList.remove('is-floating');
        unplace(card); grid.style.height = '';
        card.querySelector('.card__more').setAttribute('aria-expanded', 'true');
        card.querySelector('.card__close').focus({ preventScroll: true });
        busy = false;
      }, DUR);
    }

    function collapse() {
      if (busy || !openCard) { return; }
      busy = true;
      var card = openCard;
      card.classList.remove('is-shown');
      setTimeout(function () {
        var from = box(card);
        // меряем, где карточка окажется в обычной сетке (остальные возвращаются, пока прозрачные)
        grid.classList.remove('is-expanded');
        card.classList.remove('is-open');
        var to = box(card), toGH = grid.offsetHeight;
        var ph = placeholder(card, to.h);
        card.classList.add('is-floating');
        place(card, from);
        grid.style.height = from.h + 'px';
        void card.offsetWidth;
        place(card, to);
        grid.style.height = toGH + 'px';
        grid.classList.remove('is-busy');

        setTimeout(function () {
          ph.remove();
          card.classList.remove('is-floating');
          unplace(card); grid.style.height = '';
          var more = card.querySelector('.card__more');
          more.setAttribute('aria-expanded', 'false');
          more.focus({ preventScroll: true });
          var r = card.getBoundingClientRect();
          if (r.top < headerGap() || r.bottom > window.innerHeight) {
            window.scrollTo({ top: window.scrollY + r.top - headerGap(), behavior: reduce ? 'auto' : 'smooth' });
          }
          openCard = null; busy = false;
        }, DUR);
      }, FADE);
    }

    grid.querySelectorAll('.card').forEach(function (card) {
      var more = card.querySelector('.card__more'), close = card.querySelector('.card__close');
      if (more) { more.addEventListener('click', function () { expand(card); }); }
      if (close) { close.addEventListener('click', collapse); }
    });
    // клик вне раскрытой карточки (кроме окна заявки) сворачивает её
    doc.addEventListener('click', function (e) {
      if (!openCard || openCard.contains(e.target) || e.target.closest('.modal-overlay')) { return; }
      collapse();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !openCard) { return; }
      var md = doc.getElementById('contact-modal');
      if ((md && md.classList.contains('is-open')) || doc.body.classList.contains('nav-open')) { return; }
      collapse();
    });
  }

/* ===== Заявка: модальное окно и отправка в Telegram ===== */
  // Адрес Cloudflare Worker, который пересылает заявку в Telegram (см. worker/README.md).
  // Пока адрес пустой, форма честно сообщает, что заявку нужно оставить по телефону.
  var LEAD_ENDPOINT = 'https://vizitka.pinashin-official.workers.dev';

  var modal = doc.getElementById('contact-modal');
  var form = doc.getElementById('contact-form');
  var lastFocus = null;

  function openModal(e) {
    if (e) { e.preventDefault(); }
    lastFocus = doc.activeElement;
    setMenu(false);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    doc.body.style.overflow = 'hidden';
    setTimeout(function () { var f = doc.getElementById('userName'); if (f) { f.focus(); } }, 50);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    doc.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  if (modal && form) {
    doc.querySelectorAll('[data-modal]').forEach(function (b) { b.addEventListener('click', openModal); });
    doc.getElementById('close-modal-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) { closeModal(); } });
    doc.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) { return; }
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') { // фокус не уходит за пределы окна
        var f = modal.querySelectorAll('button, input:not([tabindex="-1"]), a[href]');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* Маска телефона: +375 (29) 123-45-67 */
    var phone = doc.getElementById('userPhone');
    function fmtPhone(v) {
      var d = v.replace(/\D/g, '');
      if (d.indexOf('375') !== 0) { d = '375' + d.replace(/^(80|8)/, ''); }
      d = d.slice(3, 12);
      var out = '+375';
      if (d.length) { out += ' (' + d.slice(0, 2); }
      if (d.length >= 2) { out += ')'; }
      if (d.length > 2) { out += ' ' + d.slice(2, 5); }
      if (d.length > 5) { out += '-' + d.slice(5, 7); }
      if (d.length > 7) { out += '-' + d.slice(7, 9); }
      return out;
    }
    phone.addEventListener('focus', function () { if (!phone.value) { phone.value = '+375 ('; } });
    phone.addEventListener('blur', function () { if (phone.value.replace(/\D/g, '').length <= 3) { phone.value = ''; } });
    phone.addEventListener('input', function (e) {
      if (e.inputType && e.inputType.indexOf('delete') === 0) { return; } // не мешаем стирать
      phone.value = fmtPhone(phone.value);
    });

    var status = doc.getElementById('form-status');
    var submitBtn = form.querySelector('.modal-submit');
    function say(text, kind) { status.textContent = text; status.className = 'form-status' + (kind ? ' is-' + kind : ''); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl = doc.getElementById('userName'), name = nameEl.value.trim();
      var digits = phone.value.replace(/\D/g, '');
      if (name.length < 2) { say('Напишите, как к вам обращаться.', 'err'); nameEl.focus(); return; }
      if (digits.length !== 12) { say('Проверьте номер: нужно 9 цифр после +375.', 'err'); phone.focus(); return; }
      if (!LEAD_ENDPOINT) {
        say('Форма пока не подключена. Позвоните нам: +375 29 160-61-75.', 'err');
        return;
      }
      submitBtn.disabled = true;
      say('Отправляем…');
      fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone.value, website: doc.getElementById('userSite').value, page: location.href })
      }).then(function (r) {
        if (!r.ok) { throw new Error(r.status); }
        say('Спасибо! Заявка отправлена, мы перезвоним в течение дня.', 'ok');
        form.reset();
        setTimeout(function () { closeModal(); say(''); }, 3000);
      }).catch(function () {
        say('Не получилось отправить. Позвоните нам: +375 29 160-61-75.', 'err');
      }).then(function () { submitBtn.disabled = false; });
    });
  }
})();
