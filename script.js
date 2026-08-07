/* =========================================================
   ПСИХОЛОГ — ЛЕНДИНГ: скрипты
   1. Мобильное меню
   2. Подсветка активного пункта навигации при скролле
   3. Плавное появление блоков при скролле
   4. Дыхательный виджет — квадратное дыхание
   5. Валидация мини-анкеты записи
   6. Заглушка для кнопок «Скачать PDF»
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Мобильное меню ---------- */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- 2. Активный пункт меню при скролле ---------- */
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const sections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = `#${entry.target.id}`;
          const link = document.querySelector(`[data-nav-link][href="${id}"]`);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    sections.forEach((section) => spyObserver.observe(section));
  }

  /* ---------- 3. Плавное появление блоков ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 4. Дыхательный виджет — квадратное дыхание ---------- */
  const breathToggle = document.getElementById('breathToggle');
  const breathDot = document.getElementById('breathDot');
  const breathPhase = document.getElementById('breathPhase');
  const breathTimer = document.getElementById('breathTimer');

  // 4 равные фазы по 4 секунды — точка проходит одну сторону квадрата за фазу.
  // Анимация точки задана одним CSS-циклом на 16s (см. .breath__dot.is-active
  // в styles.css) и стартует одновременно с этим таймером, поэтому отдельно
  // синхронизировать длительности здесь не нужно.
  const BREATH_PHASES = [
    { name: 'Вдох', duration: 4 },
    { name: 'Задержка', duration: 4 },
    { name: 'Выдох', duration: 4 },
    { name: 'Пауза', duration: 4 },
  ];

  let breathRunning = false;
  let breathCountdown = null;
  let breathAdvanceTimeout = null;

  function runBreathPhase(index) {
    const phase = BREATH_PHASES[index];

    breathPhase.textContent = phase.name;
    let secondsLeft = phase.duration;
    breathTimer.textContent = String(secondsLeft);

    clearInterval(breathCountdown);
    breathCountdown = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        breathTimer.textContent = String(secondsLeft);
      }
    }, 1000);

    clearTimeout(breathAdvanceTimeout);
    breathAdvanceTimeout = setTimeout(() => {
      const nextIndex = (index + 1) % BREATH_PHASES.length;
      runBreathPhase(nextIndex);
    }, phase.duration * 1000);
  }

  function startBreathing() {
    breathRunning = true;
    breathToggle.textContent = 'Остановить';
    breathToggle.setAttribute('aria-pressed', 'true');

    // сброс, чтобы CSS-анимация точки всегда стартовала заново от угла
    breathDot.classList.remove('is-active');
    void breathDot.offsetWidth;
    breathDot.classList.add('is-active');

    runBreathPhase(0);
  }

  function stopBreathing() {
    breathRunning = false;
    breathToggle.textContent = 'Начать';
    breathToggle.setAttribute('aria-pressed', 'false');
    clearInterval(breathCountdown);
    clearTimeout(breathAdvanceTimeout);
    breathDot.classList.remove('is-active');
    breathPhase.textContent = 'Вдох';
    breathTimer.textContent = '4';
  }

  if (breathToggle) {
    breathToggle.addEventListener('click', () => {
      if (breathRunning) {
        stopBreathing();
      } else {
        startBreathing();
      }
    });
  }

  // Ссылка «Попробовать» в блоке «Полезные материалы» ведёт к виджету дыхания
  const scrollToBreathLink = document.querySelector('[data-scroll-to-breath]');
  if (scrollToBreathLink) {
    scrollToBreathLink.addEventListener('click', (e) => {
      e.preventDefault();
      const breathBlock = document.getElementById('breath');
      if (breathBlock) {
        breathBlock.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        if (!breathRunning) startBreathing();
      }
    });
  }

  /* ---------- 5. Валидация мини-анкеты записи ---------- */
  const bookingForm = document.getElementById('bookingForm');
  const formSuccess = document.getElementById('formSuccess');

  function setFieldError(fieldName, message) {
    const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
    const fieldWrap = errorEl ? errorEl.closest('.form__field') : null;
    if (errorEl) errorEl.textContent = message;
    if (fieldWrap) fieldWrap.classList.toggle('has-error', Boolean(message));
  }

  if (bookingForm) {
    const submitBtn = document.getElementById('formSubmitBtn');
    const submitError = document.getElementById('formSubmitError');

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = bookingForm.querySelector('#name');
      const contactInput = bookingForm.querySelector('#contact');
      const consentInput = bookingForm.querySelector('#consent');

      let isValid = true;
      let firstInvalid = null;

      if (!nameInput.value.trim()) {
        setFieldError('name', 'Подскажите, как к вам обращаться');
        isValid = false;
        firstInvalid = firstInvalid || nameInput;
      } else {
        setFieldError('name', '');
      }

      if (!contactInput.value.trim()) {
        setFieldError('contact', 'Укажите номер телефона, чтобы я могла(мог) ответить');
        isValid = false;
        firstInvalid = firstInvalid || contactInput;
      } else {
        setFieldError('contact', '');
      }

      if (!consentInput.checked) {
        setFieldError('consent', 'Нужно согласие на обработку персональных данных');
        isValid = false;
        firstInvalid = firstInvalid || consentInput;
      } else {
        setFieldError('consent', '');
      }

      if (!isValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (submitError) submitError.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем…';
      }

      // Отправка в Formspree (см. action у #bookingForm).
      // Формат fetch + Accept: application/json нужен, чтобы Formspree
      // вернул JSON вместо редиректа на свою страницу — тогда сайт
      // может сам показать блок #formSuccess, не покидая страницу.
      const formData = new FormData(bookingForm);

      fetch(bookingForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })
        .then((response) => {
          if (!response.ok) throw new Error('Formspree ответил с ошибкой');

          bookingForm.hidden = true;
          formSuccess.hidden = false;
          formSuccess.setAttribute('tabindex', '-1');
          formSuccess.focus();
        })
        .catch(() => {
          if (submitError) submitError.hidden = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить заявку';
          }
        });
    });
  }

  /* ---------- 6. Заглушка для кнопок «Скачать PDF» ---------- */
  const toast = document.getElementById('toast');
  let toastTimeout = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  document.querySelectorAll('.material-card__btn[data-material]').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Заменить на реальную ссылку на PDF, когда файлы будут готовы
      showToast('Материал скоро будет доступен для скачивания');
    });
  });

  /* ---------- 7. Показать все теги специализации ---------- */
  const tagsToggle = document.getElementById('tagsToggle');
  const tagsToggleLabel = document.getElementById('tagsToggleLabel');
  const extraTags = document.querySelectorAll('.tag--extra');

  if (tagsToggle && extraTags.length) {
    tagsToggle.addEventListener('click', () => {
      const isExpanded = tagsToggle.getAttribute('aria-expanded') === 'true';
      extraTags.forEach((tag) => { tag.hidden = isExpanded; });
      tagsToggle.setAttribute('aria-expanded', String(!isExpanded));
      if (tagsToggleLabel) tagsToggleLabel.textContent = isExpanded ? 'Показать все темы' : 'Скрыть';
    });
  }
});
