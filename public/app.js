(() => {
  const config = window.PANTRIP_SITE || {};
  const language = document.getElementById('language');
  const descriptions = {
    ko: '우리 집 식품을 한눈에. 사진으로 등록하고, 나만의 주방에서 소비기한을 챙기세요. Pantrip iPhone 앱.',
    en: 'Your food, at a glance. Add it with a photo and keep track of use-by dates in your own kitchen. Pantrip for iPhone.'
  };
  let lang = 'ko';
  function render() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-ko][data-en]').forEach(el => { el.textContent = el.dataset[lang]; });
    // data-ko-aria / data-ko-alt / data-ko-src (and their data-en-* pair) localize attributes.
    for (const [key, attr] of [['aria', 'aria-label'], ['alt', 'alt'], ['src', 'src']]) {
      document.querySelectorAll(`[data-ko-${key}]`).forEach(el => el.setAttribute(attr, el.getAttribute(`data-${lang}-${key}`)));
    }
    language.textContent = lang === 'ko' ? 'EN' : '한국어';
    language.setAttribute('aria-label', lang === 'ko' ? 'Switch to English' : '한국어로 변경');
    document.querySelector('meta[name="description"]').content = descriptions[lang];
  }
  try {
    const url = new URL(config.privacyURL);
    if (url.protocol === 'https:') document.getElementById('privacy-link').href = url.href;
  } catch { /* Relative privacy.html stays as written in the page. */ }
  language.addEventListener('click', () => { lang = lang === 'ko' ? 'en' : 'ko'; render(); });
  render();
})();
