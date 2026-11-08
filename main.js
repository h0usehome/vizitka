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

  /* Линия под шапкой после прокрутки */
  var header = doc.querySelector('.header');
  function onScroll() { if (header) { header.classList.toggle('is-stuck', window.scrollY > 8); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Плавное появление блоков (если что-то пойдёт не так, всё просто покажется) */
  var items = doc.querySelectorAll('.section__head, .card, .person, .facts li, .compare__col, .work, .qa, .contact__in > *');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
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

  /* Год в подвале */
  var y = doc.getElementById('year');
  if (y) { y.textContent = new Date().getFullYear(); }
})();
