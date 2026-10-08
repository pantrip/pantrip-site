(() => {
  const config = window.PANTRIP_SITE || {};
  const language = document.getElementById('language');
  const video = document.getElementById('demo-video');
  const poster = document.getElementById('demo-poster');
  const toggle = document.getElementById('demo-toggle');
  const chapters = document.getElementById('demo-chapters');
  const chapterButtons = [...document.querySelectorAll('[data-demo-time]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const descriptions = {
    ko: '우리 집 식품을 한눈에. 사진으로 등록하고, 나만의 주방에서 소비기한을 챙기세요. Pantrip iPhone 앱.',
    en: 'Your food, at a glance. Add it with a photo and keep track of use-by dates in your own kitchen. Pantrip for iPhone.'
  };
  let lang = 'ko';
  let ready = false;
  let unavailable = false;
  let hasFrame = false;
  let attemptedAutoplay = false;
  let resumeAfterVisibility = false;
  let playRequest = 0;

  function updateControls() {
    toggle.disabled = !ready || unavailable;
    chapters.hidden = !ready || unavailable;
    const action = unavailable ? 'unavailable' : !ready ? 'loading' : video.paused ? 'play' : 'pause';
    const labels = {
      ko: {play: '데모 재생', pause: '데모 일시 정지', loading: '데모 불러오는 중', unavailable: '데모를 재생할 수 없습니다'},
      en: {play: 'Play demo', pause: 'Pause demo', loading: 'Loading demo', unavailable: 'Demo unavailable'}
    };
    toggle.setAttribute('aria-label', labels[lang][action]);
    document.getElementById('demo-play-icon').toggleAttribute('hidden', !video.paused && !unavailable);
    document.getElementById('demo-pause-icon').toggleAttribute('hidden', video.paused || unavailable);
    let active = chapterButtons[0];
    for (const button of chapterButtons) {
      const time = Number(button.dataset.demoTime);
      button.disabled = !ready || unavailable || time >= video.duration;
      if (video.currentTime >= time) active = button;
    }
    chapterButtons.forEach(button => button.setAttribute('aria-pressed', String(button === active)));
  }

  function markUnavailable() {
    unavailable = true;
    ready = false;
    playRequest++;
    if (typeof video.pause === 'function') video.pause();
    video.hidden = true;
    poster.hidden = false;
    updateControls();
  }

  function playDemo() {
    if (!ready || unavailable || document.hidden) return;
    const request = ++playRequest;
    const rejected = () => {
      if (request !== playRequest) return;
      if (video.error) { markUnavailable(); return; }
      video.pause();
      if (!hasFrame) poster.hidden = false;
      updateControls();
    };
    try { Promise.resolve(video.play()).catch(rejected); }
    catch { rejected(); }
  }

  function autoplay() {
    if (!attemptedAutoplay && ready && !unavailable && !motion.matches && !document.hidden) {
      attemptedAutoplay = true;
      playDemo();
    }
  }
  function render() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-ko][data-en]').forEach(el => { el.textContent = el.dataset[lang]; });
    for (const [key, attr] of [['aria', 'aria-label'], ['alt', 'alt'], ['src', 'src']]) {
      document.querySelectorAll(`[data-ko-${key}]`).forEach(el => el.setAttribute(attr, el.getAttribute(`data-${lang}-${key}`)));
    }
    language.textContent = lang === 'ko' ? 'EN' : '한국어';
    language.setAttribute('aria-label', lang === 'ko' ? 'Switch to English' : '한국어로 변경');
    document.querySelector('meta[name="description"]').content = descriptions[lang];
    updateControls();
  }
  try {
    const url = new URL(config.privacyURL);
    if (url.protocol === 'https:') document.getElementById('privacy-link').href = url.href;
  } catch { /* Relative privacy.html stays as written in the page. */ }
  language.addEventListener('click', () => { lang = lang === 'ko' ? 'en' : 'ko'; render(); });
  poster.addEventListener('error', () => {
    if (poster.getAttribute('src') !== poster.dataset.fallbackSrc) poster.setAttribute('src', poster.dataset.fallbackSrc);
  });
  if (poster.complete && !poster.naturalWidth) poster.setAttribute('src', poster.dataset.fallbackSrc);
  video.muted = true;
  video.addEventListener('loadedmetadata', () => { ready = true; updateControls(); autoplay(); });
  video.addEventListener('error', markUnavailable);
  video.addEventListener('playing', () => {
    if (unavailable || document.hidden) { video.pause(); return; }
    hasFrame = true;
    video.hidden = false;
    poster.hidden = true;
    updateControls();
  });
  video.addEventListener('play', updateControls);
  video.addEventListener('pause', updateControls);
  video.addEventListener('timeupdate', updateControls);
  toggle.addEventListener('click', () => {
    if (!ready || unavailable) return;
    attemptedAutoplay = true;
    resumeAfterVisibility = false;
    if (video.paused) playDemo();
    else { playRequest++; video.pause(); }
  });
  chapterButtons.forEach(button => button.addEventListener('click', () => {
    if (button.disabled || document.hidden) return;
    attemptedAutoplay = true;
    resumeAfterVisibility = false;
    try { video.currentTime = Number(button.dataset.demoTime); }
    catch { markUnavailable(); return; }
    updateControls();
    playDemo();
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeAfterVisibility = !video.paused;
      playRequest++;
      video.pause();
    } else if (resumeAfterVisibility && !motion.matches) {
      resumeAfterVisibility = false;
      playDemo();
    } else autoplay();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      resumeAfterVisibility = false;
      playRequest++;
      video.pause();
    } else autoplay();
  });
  render();
  if (video.error || typeof video.play !== 'function') markUnavailable();
  else if (video.readyState >= 1) { ready = true; updateControls(); autoplay(); }
})();
