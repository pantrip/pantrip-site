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
