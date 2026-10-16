// Exercise the same geometry/smoothing code the page executes; no browser or new dependency needed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
const context = { window: {} };
vm.runInNewContext(html.match(/<script id="story-geometry">([\s\S]*?)<\/script>/)[1], context);
const { progress, follow, fitTags, quietDelay } = context.window.PT_STORY;

assert.equal(quietDelay(-Infinity, 0), 0, 'No input permits initial preparation');
assert.equal(quietDelay(0, 100), 80, 'Preparation waits until 180 ms after the latest input');
assert.equal(quietDelay(100, 179), 101, 'New input restarts the quiet interval rather than using a fixed timeout');
assert.equal(quietDelay(100, 279), 1);
assert.equal(quietDelay(100, 280), 0);
assert.equal(quietDelay(100, 900), 0);

// Drive the production async gate: input during an existing wait postpones background work again.
let clock = 0;
const timers = [], gateAt = html.indexOf('  let lastInput =');
const gate = { window: { PT_STORY: { quietDelay } }, scrollY: 0, performance: { now: () => clock }, root: { classList: { contains: () => true } }, setTimeout: (resolve, delay) => timers.push({ resolve, delay }) };
vm.runInNewContext(html.slice(gateAt, html.indexOf('\n  renderer.setSize', gateAt)) + '\nwindow.waitForQuiet = waitForQuiet; window.noteInput = noteInput;', gate);
gate.window.noteInput();
const waiting = gate.window.waitForQuiet();
assert.equal(timers[0].delay, 180);
clock = 100; gate.scrollY = 400; gate.window.noteInput();
clock = 180; timers.shift().resolve(); await Promise.resolve();
assert.equal(timers[0].delay, 100, 'Input while waiting restarts the required quiet interval');
clock = 280; gate.scrollY = 600; timers.shift().resolve(); await Promise.resolve();
assert.equal(timers[0].delay, 180, 'A changed scroll position is caught even before its scroll event arrives');
clock = 460; timers.shift().resolve(); await waiting;
assert.equal(timers.length, 0);

assert.equal(progress(10, 3300, 1000), 0);
assert.equal(progress(-1150, 3300, 1000), 0.5);
assert.equal(progress(-3000, 3300, 1000), 1);
assert.equal(progress(-100, 0, 0), 1);
assert.equal(progress(-1012.5, 2300, 1000), progress(-810, 1840, 800), 'Proportional rotation preserves local progress');
assert.equal(follow(0, 0.9, 1 / 60, true), 0.9, 'Restored/entered scenes start at their actual progress');
assert.equal(follow(0.1, 0.8, 1 / 60, false), 0.8, 'Large scroll jumps do not replay a scene from the beginning');
let p = 0.4, count = 0;
while (p !== 0.5 && ++count < 120) p = follow(p, 0.5, 1 / 60, false);
assert.equal(p, 0.5, 'Scroll easing settles so no idle RAF is required');
assert(count < 60);

// A large scroll inside S3 still draws the consumption/check/disappearance sequence.
const tags3 = Array.from({ length: 6 }, () => ({ el: { setAttribute() {}, classList: { toggle() {} } }, set(label) { this.label = label; }, place: () => null }));
const timeline = { window: { PT_STORY: context.window.PT_STORY, PT_I18N: { dday: n => 'D-' + n } }, tags3, S3b: { ready: true, items: tags3.map(() => ({ userData: {} })) }, clamp: n => Math.min(1, Math.max(0, n)), smooth: () => 0 };
vm.runInNewContext(html.slice(html.indexOf('  const SIX = ['), html.indexOf('  const S3a =')) + html.slice(html.indexOf('  const tagState ='), html.indexOf('  /* ---------- layout + loop')) + '\nwindow.dayAt = p => { const s = { p }; return ' + html.match(/const day = ([^;]+);/)[1] + '; }; window.tags3Update = tags3Update;', timeline);
assert(html.includes('window.PT_STORY.follow(s.p, target, dt, !s.visible, s.id !== \'s3\')'), 'Only S3 disables the large-jump shortcut');
assert.equal(follow(0, 0.8, 1 / 60, true, false), 0.8, 'Entering or restoring S3 still jumps to its actual progress');
p = 0.18;
for (const target of [0.38, 0.18]) {
  const labels = []; count = 0;
  do {
    timeline.window.tags3Update(p, timeline.window.dayAt(p), { x: 0, y: 0, w: 300, h: 240 });
    labels.push(tags3[0].label);
    if (p === target) break;
    p = follow(p, target, count === 0 ? 0.1 : 1 / 60, false, false);
  } while (++count < 120);
  assert(labels.includes('✓'), 'Large forward and reverse scrolls after idle pass through the tofu completion badge');
  assert.equal(p, target, 'S3 easing settles exactly with no permanent idle RAF');
  assert(count < 60, 'S3 catches up in a finite interval');
  assert.equal(labels.at(-1), target === 0.38 ? null : 'D-2', 'Consumed food disappears and returns when scrolling back');
}
let maxSettlingFrames = 0;
for (const firstDt of [1 / 60, 0.1]) for (const [start, target] of [[0, 1], [1, 0], [0.08, 0.97], [0.97, 0.08], [0.12, 0.96], [0.96, 0.12]]) {
  const completed = new Set(); p = start; count = 0;
  do {
    timeline.window.tags3Update(p, timeline.window.dayAt(p), { x: 0, y: 0, w: 300, h: 240 });
    tags3.forEach((tag, i) => { if (tag.label === '✓') completed.add(i); });
    if (p === target) break;
    const next = follow(p, target, count === 0 ? firstDt : 1 / 60, false, false);
    assert(Math.abs(next - p) <= 0.040000000001, 'Large S3 moves cannot skip a completion interval in one frame');
    p = next;
  } while (++count < 120);
  assert.equal(completed.size, 6, `All six food completion badges appear while moving ${start} to ${target}`);
  assert.equal(p, target, 'Full-range S3 moves settle exactly');
  assert(count < 60, 'Even full-range S3 moves settle within 60 frames');
  maxSettlingFrames = Math.max(maxSettlingFrames, count);
}
console.log(`PASS: all six S3 completion badges survive large forward/reverse moves and idle resume (max ${maxSettlingFrames} settling frames)`);

function verifyBoxes(tags, bounds) {
  const boxes = fitTags(tags, bounds);
  assert.equal(boxes.length, tags.length);
  boxes.forEach((box, i) => {
    assert(box.x >= bounds.x && box.y >= bounds.y, `Label ${i} starts inside the pane`);
    assert(box.x + box.w <= bounds.x + bounds.w + 0.01, `Label ${i} ends inside the pane horizontally`);
    assert(box.y + box.h <= bounds.y + bounds.h + 0.01, `Label ${i} ends inside the pane vertically`);
    for (const other of boxes.slice(i + 1)) {
      assert(box.x + box.w + 5.9 <= other.x || other.x + other.w + 5.9 <= box.x || box.y + box.h + 5.9 <= other.y || other.y + other.h + 5.9 <= box.y, 'Day/check badges must not overlap');
    }
  });
}
for (const width of [256, 272, 335, 480, 600]) for (const height of [60, 100, 160, 260]) {
  const bounds = { x: 24, y: 340, w: width, h: height };
  const compact = width < 360 || height < 134;
  const tags = Array.from({ length: 6 }, (_, i) => ({ x: 24 + width / 2 + (i % 3) * 3, y: 350 + height / 2 + Math.floor(i / 3) * 2, w: compact ? 36 : 132, h: compact ? 19 : 26 }));
  verifyBoxes(tags, bounds);
}
verifyBoxes([], { x: 0, y: 0, w: 320, h: 568 });
verifyBoxes(Array.from({ length: 6 }, () => ({ x: 140, y: 25, w: 62, h: 24 })), { x: 0, y: 0, w: 280, h: 50 });
verifyBoxes([{ x: 140, y: 25, w: 620, h: 24 }], { x: 0, y: 0, w: 280, h: 50 });

const boot = html.match(/<script>\s*(\/\* Decide live vs static[\s\S]*?)<\/script>/)[1];
function bootstrap(webgl, reduced) {
  const classes = new Set(), style = {}, events = [];
  const root = { classList: { add: (...items) => items.forEach(item => classes.add(item)), remove: item => classes.delete(item) }, style: { setProperty: (name, value) => style[name] = value }, appendChild() {} };
  let delayed, resized;
  const browser = {
    window: {}, location: { search: '' }, Event: class { constructor(type) { this.type = type; } },
    innerWidth: 320, height: 568, scrollY: 500,
    addEventListener: (name, callback) => { if (name === 'resize') resized = callback; },
    scrollTo: (x, y) => { browser.scrollY = y; },
    document: { documentElement: root, querySelectorAll: () => [section], dispatchEvent: event => events.push(event.type), createElement: () => ({ getContext: () => webgl, style: {}, getBoundingClientRect: () => ({ height: browser.height }), remove() {} }) },
    matchMedia: () => ({ matches: reduced }), setTimeout: callback => delayed = callback
  };
  const section = { offsetTop: 0, get offsetHeight() { return parseFloat(style['--story-height']) * 3.3; }, getBoundingClientRect: () => ({ top: -browser.scrollY, bottom: section.offsetHeight - browser.scrollY }) };
  vm.runInNewContext(boot, browser);
  return { classes, style, events, delayed, resized, browser };
}
const loading = bootstrap(true, false);
assert(loading.classes.has('live'));
assert.equal(loading.style['--story-height'], '568px');
loading.delayed();
assert(loading.classes.has('static') && loading.classes.has('fallback'));
assert(!loading.classes.has('live'));
assert.equal(loading.style['--story-height'], '568px', 'Late failures retain the story height');
assert(loading.events.includes('pt-static'), 'Late failure renders poster labels');
loading.browser.height = 480;
loading.resized();
assert.equal(loading.style['--story-height'], '568px', 'Browser chrome changes do not alter the story height');
loading.browser.height = 320;
loading.browser.innerWidth = 568;
loading.resized();
assert.equal(loading.style['--story-height'], '320px', 'Rotation still updates geometry after a module/loading failure');
assert(Math.abs(loading.browser.scrollY - 500 * 320 / 568) < 0.001, 'Rotation retains the local position after fallback');
for (const state of [bootstrap(false, false), bootstrap(true, true)]) {
  assert(state.classes.has('static') && !state.classes.has('fallback'), 'No WebGL/reduced motion keeps the original short static story');
}
assert(html.includes('html.static:not(.fallback) #s1'), 'Only initial static mode collapses the long scroll distances');
assert([...html.matchAll(/<picture class="still">([\s\S]*?)<\/picture>/g)].every(match => !match[1].includes('loading="lazy"')), 'The three small fallback posters load before entering distant story sections');
assert(html.includes('.tag{transform-origin:0 0}'), 'Scaled dense labels use the same top-left origin as their measured boxes');
assert(html.includes('.stage:not([data-ready]) .anim-only,.stage:not([data-ready]) .anim-only *{visibility:hidden!important}'), 'Live overlays and their descendants remain invisible until layout and drawing are complete');
console.log('PASS: input-aware preparation gate, story progress, finite settling, collision-free day badges, stable late-loading fallback');
