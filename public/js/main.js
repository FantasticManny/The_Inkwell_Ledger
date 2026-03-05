/*   Nav Toggle   */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
    navToggle.classList.toggle('open', open);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/*   Comment char counter           ── */
const textarea  = document.getElementById('body');
const charCount = document.getElementById('charCount');

if (textarea && charCount) {
  const updateCount = () => {
    const len = textarea.value.length;
    charCount.textContent = `${len} / 2000`;
    charCount.style.color = len > 1800 ? '#f76f6f' : '';
  };
  textarea.addEventListener('input', updateCount);
  updateCount();
}

/*   Comment form prevent double-submit      ── */
const commentForm = document.getElementById('commentForm');
if (commentForm) {
  commentForm.addEventListener('submit', (e) => {
    const btn = commentForm.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Posting…';
    }
  });
}

/*   Scroll reveal               */
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.post-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`;
    observer.observe(el);
  });
}
