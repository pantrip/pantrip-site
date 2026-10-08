// Public homepage behavior and links: node check-public.mjs
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'public');
assert.equal(readFileSync(resolve(root,'app-ads.txt'),'utf8'),'google.com, pub-5326804589747186, DIRECT, f08c47fec0942fa0\n','AdMob publisher declaration must be exact plain text');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Unique DOM ids');
const assetURLs=new Set();
for(const [,url] of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)) {
 if(url.startsWith('#')&&url.length>1) assert(ids.includes(url.slice(1)),`Missing anchor ${url}`);
 else if(!/^(#|mailto:|https:)/.test(url)) assetURLs.add(url);
}
for (const [,tag] of html.matchAll(/(<[^>]+aria-label="[^"]+"[^>]*>)/g)) {
 if(!tag.includes('id="language"')) assert(tag.includes('data-ko-aria=') && tag.includes('data-en-aria='),'Localized region label');
}
for (const [,id] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert(new RegExp(`<h2 id="${id}" data-ko="[^"]+" data-en="[^"]+"`).test(html),`Section ${id} is named by a localized h2`);
for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
 assert(/\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag) && /\balt="/.test(tag),`Image size and alt: ${tag}`);
 if(!tag.includes('alt=""')) assert(tag.includes('data-ko-alt=') && tag.includes('data-en-alt='),`Localized alt: ${tag}`);
}
assert(!html.includes('apps.apple.com'),'No fake download URL');
assert(!html.includes('kitchen-preview.mp4') && !existsSync(resolve(root,'assets/kitchen-preview.mp4')),'Old development-build video is gone');
const videos=[...html.matchAll(/<video\b[^>]*>/g)];
assert.equal(videos.length,1,'One shared app demo video');
const videoTag=videos[0][0];
assert(videoTag.includes('src="assets/pantrip-demo-en.mp4"') && videoTag.includes('poster="assets/pantrip-demo-en-poster.jpg"'),'Shared English video and poster');
for(const attr of ['muted','loop','playsinline']) assert(new RegExp(`\\s${attr}(?:\\s|>)`).test(videoTag),`Demo ${attr}`);
assert(videoTag.includes('preload="metadata"') && !/\sautoplay(?:\s|>)/.test(videoTag),'Autoplay starts only after checking motion and visibility');
assert(!videoTag.includes('data-ko-src') && !videoTag.includes('data-en-src'),'Language changes do not reload the demo');
assert(!/class="(?:eyebrow|lead|sub|body|note|facts|credit)/.test(html),'Marketing subtitles and image descriptions removed');
assert.equal([...html.matchAll(/<figcaption\b/g)].length,12,'Only individual kitchen names retain captions');
const css=readFileSync(resolve(root,'style.css'),'utf8');
assert(css.includes('prefers-reduced-motion:reduce'));
assert(css.includes('forced-colors:active'));
assert(css.includes('prefers-color-scheme:dark'));
assert(css.includes(':focus-visible') && !css.includes('@keyframes'),'Keyboard focus and no marketing animations');
assert(!/<(?:button|a|p|strong|summary|figcaption)[^>]*class="[^"]*dot-text/.test(html),'Small text and controls must be solid');
assert(html.includes('<title>Pantrip: Food &amp; Kitchen</title>'));
assert(html.includes('<h1 class="brand-title" data-ko="우리 집 식품을 한눈에" data-en="Your food, at a glance">'),'One short localized hero heading');
assert(html.includes('google-site-verification'));
assert(html.includes('<link rel="canonical" href="https://pantrip.app/">'));
assert(html.includes('<meta name="referrer" content="no-referrer">'));
assert(html.includes('Google sign-in') && html.includes('jsh097610@gmail.com'));
assert(!html.includes('ExpiryCheck') && !html.includes('/admin') && !html.includes('swagger'));
for(const page of ['privacy.html','support.html','terms.html']) assert(html.includes('href="'+page+'"'));
// Favicons: current dot-matrix app icon at the declared sizes (PNG IHDR width/height).
for(const [rel,size,file] of [['icon',32,'favicon-32.png'],['icon',16,'favicon-16.png'],['apple-touch-icon',180,'apple-touch-icon.png'],[null,512,'app-icon.png']]) {
 if(rel) assert(html.includes(`<link rel="${rel}"`) && html.includes(`sizes="${size}x${size}" href="assets/${file}"`),`Favicon link ${file}`);
 const png=readFileSync(resolve(root,'assets',file));
 assert.equal(png.readUInt32BE(16),size,`${file} width`);assert.equal(png.readUInt32BE(20),size,`${file} height`);
}
// Story order, then collapsed demo notes and the Google sign-in explanation before the footer.
const order=['class="brand-title"','id="demo-video"','id="photo"','id="shapes"','id="kitchens"','id="reminders"','id="contact"','id="demo-notes"','id="google-signin"','</main>','<footer'].map(s=>html.indexOf(s));
assert(order.every((at,i)=>at>=0&&(i===0||at>order[i-1])),'Sections follow the App Store story');
assert(/<details class="disclosure" id="google-signin">\s*<summary><span data-ko="Google 로그인은 어디에 사용하나요\?" data-en="What is Google sign-in used for\?">/.test(html),'Collapsed Google sign-in explanation');
assert(!/<details[^>]*\bopen\b/.test(html),'Both disclosures start collapsed');
assert(/<\/details>\s*<\/main>\s*<footer/.test(html),'Google sign-in explanation sits just above the footer');
const kitchens=[...html.matchAll(/<li><figure><img src="assets\/kitchen-(\w+)\.jpg"[^>]*data-ko-alt="([^"]+)" data-en-alt="([^"]+)"><figcaption data-ko="([^"]+)" data-en="([^"]+)">/g)];
assert.equal(kitchens.length,12,'Twelve kitchen cards with localized names');
for(const [,id,koAlt,enAlt,ko,en] of kitchens) assert(koAlt.startsWith(ko)&&enAlt.startsWith(en),`Kitchen ${id} alt names its caption`);
assert.equal(new Set(kitchens.map(k=>k[4])).size,12,'Kitchen names are distinct');
const notes=html.match(/<details class="disclosure" id="demo-notes">([\s\S]*?)<\/details>/)?.[1];
assert(notes,'Image and demo disclosure exists');
for(const text of ['이미지·데모 안내','Image &amp; demo notes','실제 앱 녹화','app recordings','편집 장면','edited product and kitchen renders','예시 데이터','sample data','USDA ARS','USDA Agricultural Research Service','https://commons.wikimedia.org/wiki/File:Fuji_apple.jpg','일부 주방은 포인트가 필요합니다.','Some kitchens require points.','기한 알림은 식품의 안전성을 판단하지 않아요.','Dates are reminders, not food safety advice.'])
 assert(notes.includes(text),`Retained in demo notes: ${text}`);

// Run app.js against the real markup: every localized tag in index.html becomes a mock element.
function parse(tag){
 const attrs={};for(const [,k,v] of tag.matchAll(/\s([\w-]+)="([^"]*)"/g)) attrs[k]=v.replace(/&amp;/g,'&');
 for(const attr of ['hidden','disabled']) if(new RegExp(`\\s${attr}(?:\\s|>)`).test(tag)) attrs[attr]='';
 const dataset={};for(const [k,v] of Object.entries(attrs)) if(k.startsWith('data-')) dataset[k.slice(5).replace(/-(\w)/g,(_,c)=>c.toUpperCase())]=v;
 return {attrs,dataset,handlers:{},textContent:'',hidden:/\shidden(?:\s|>)/.test(tag),disabled:/\sdisabled(?:\s|>)/.test(tag),
  addEventListener(type,fn){this.handlers[type]=fn;},emit(type){this.handlers[type]?.();},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
  toggleAttribute(k,force){if(force) this.attrs[k]='';else delete this.attrs[k];},hasAttribute(k){return k in this.attrs;}};
}
function run(config={},options={}){
 const elements=[...html.matchAll(/<(?!\/)[^>]+>/g)].map(m=>parse(m[0]));
 const byId=id=>elements.find(el=>el.attrs.id===id);
 const video=byId('demo-video'),poster=byId('demo-poster');
 Object.assign(video,{paused:true,currentTime:0,duration:options.duration ?? 24.5,readyState:options.readyState ?? 0,playCalls:0,pauseCalls:0,error:options.videoError ?? null,
  play(){this.playCalls++;if(options.throwPlay) throw new Error('Playback unavailable');if(options.rejectPlay) return Promise.reject(new Error('Autoplay rejected'));this.paused=false;this.emit('play');this.emit('playing');return Promise.resolve();},
  pause(){this.pauseCalls++;this.paused=true;this.emit('pause');}});
 if(options.unsupported) video.play=undefined;
 Object.assign(poster,{complete:!!options.posterFailed,naturalWidth:options.posterFailed ? 0 : 720});
 const motion={matches:!!options.reducedMotion,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}};
 const meta={content:''};
 const document={documentElement:{},hidden:!!options.hidden,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},getElementById:byId,querySelector:q=>{assert.equal(q,'meta[name="description"]');return meta;},
  querySelectorAll:q=>{const names=[...q.matchAll(/\[([\w-]+)\]/g)].map(m=>m[1]);return elements.filter(el=>names.every(n=>n in el.attrs));}};
 vm.runInNewContext(readFileSync(resolve(root,'app.js'),'utf8'),{document,window:{PANTRIP_SITE:config,matchMedia:q=>{assert.equal(q,'(prefers-reduced-motion: reduce)');return motion;}},URL});
 return {byId,document,meta,elements,video,poster,motion,buttons:elements.filter(el=>'data-demo-time' in el.attrs)};
}
const setup={window:{}};vm.runInNewContext(readFileSync(resolve(root,'config.js'),'utf8'),setup);
const a=run(setup.window.PANTRIP_SITE),get=a.byId;
const localized=a.elements.filter(el=>'data-ko' in el.attrs&&'data-en' in el.attrs);
assert(localized.length>30,'Localized headings, controls and notes found');
assert.equal(a.document.documentElement.lang,'ko');
assert(localized.every(el=>el.textContent===el.dataset.ko&&el.dataset.ko&&el.dataset.en),'Korean copy by default');
assert.equal(a.video.attrs.src,'assets/pantrip-demo-en.mp4');
assert.equal(a.poster.attrs.src,'assets/pantrip-demo-en-poster.jpg');
get('language').handlers.click();
assert.equal(a.document.documentElement.lang,'en');
assert(localized.every(el=>el.textContent===el.dataset.en),'Every localized text swaps to English');
assert.equal(a.video.attrs.src,'assets/pantrip-demo-en.mp4','Demo stays in English after language change');
assert.equal(a.poster.attrs.src,'assets/pantrip-demo-en-poster.jpg','Poster does not swap');
for(const [id,en] of [['photo-title','Snap a photo. Add your food.'],['shapes-title','Your food, now in 3D'],['kitchens-title','A kitchen that’s all yours'],['reminders-title','Keep track of use-by dates']])
 assert.equal(get(id).textContent,en,`Heading ${id} in English`);
assert.equal(a.elements.filter(el=>'data-ko-src' in el.attrs).length,2,'Only static widgets swap image sources');
assert(a.elements.filter(el=>'data-ko-src' in el.attrs).every(el=>el.attrs.src===el.attrs['data-en-src']&&el.attrs.src.includes('-en.')),'Widget images swap to English');
assert(a.elements.filter(el=>'data-ko-alt' in el.attrs).every(el=>el.attrs.alt===el.attrs['data-en-alt']),'Alt text swaps to English');
assert(a.elements.filter(el=>'data-ko-aria' in el.attrs&&el.attrs.id!=='demo-toggle').every(el=>el.attrs['aria-label']===el.attrs['data-en-aria']),'Region labels swap to English');
assert.equal(get('demo-toggle').attrs['aria-label'],'Loading demo','Playback state label is localized');
assert.equal(get('language').textContent,'한국어');assert(a.meta.content.startsWith('Your food'));
get('language').handlers.click();
assert(localized.every(el=>el.textContent===el.dataset.ko),'Back to Korean');
assert.equal(get('language').attrs['aria-label'],'Switch to English');
assert.equal(get('privacy-link').attrs.href,'privacy.html');
const b=run({privacyURL:'https://example.com/privacy'});
assert.equal(b.byId('privacy-link').href,'https://example.com/privacy');

// Media behavior uses controlled mocks; this is not browser autoplay or visual verification.
assert.equal(a.buttons.length,5,'Five demo chapters');
assert.deepEqual(a.buttons.map(button=>Number(button.dataset.demoTime)),[0,5,12.5,16.5,20.5],'Chapter times follow the demo edit');
assert(get('demo-toggle').disabled && get('demo-chapters').hidden,'Unavailable controls are inert while loading');
assert(!get('demo-toggle').hidden,'Play/pause button always remains visible');
a.video.emit('loadedmetadata');
assert.equal(a.video.playCalls,1,'Visible page autoplays once metadata is ready');
assert(a.video.muted && a.poster.hidden,'Muted playback replaces the poster');
assert(!get('demo-toggle').disabled && !get('demo-chapters').hidden,'Loaded controls are usable');
assert.equal(get('demo-toggle').attrs['aria-label'],'데모 일시 정지');
assert(get('demo-play-icon').hasAttribute('hidden') && !get('demo-pause-icon').hasAttribute('hidden'),'Pause icon while playing uses actual SVG attributes');
get('language').emit('click');
assert.equal(get('demo-toggle').attrs['aria-label'],'Pause demo');
const beforeLanguagePlayCalls=a.video.playCalls;
get('language').emit('click');
assert.equal(a.video.playCalls,beforeLanguagePlayCalls,'Language change does not restart playback');
get('demo-toggle').emit('click');
assert(a.video.paused && get('demo-pause-icon').hasAttribute('hidden') && !get('demo-play-icon').hasAttribute('hidden'),'Manual pause updates SVG icon attributes');
assert.equal(get('demo-toggle').attrs['aria-label'],'데모 재생');
get('demo-toggle').emit('click');
assert(!a.video.paused,'Manual play resumes playback');
for(const button of a.buttons){
 button.emit('click');
 assert.equal(a.video.currentTime,Number(button.dataset.demoTime),'Chapter seeks to its requested time');
 assert(!a.video.paused && button.attrs['aria-pressed']==='true','Chapter plays and becomes active');
 assert.equal(a.buttons.filter(button=>button.attrs['aria-pressed']==='true').length,1,'Exactly one active chapter');
}
a.video.currentTime=0;a.video.emit('timeupdate');
assert.equal(a.buttons[0].attrs['aria-pressed'],'true','Looping returns to the first chapter');
a.document.hidden=true;a.document.handlers.visibilitychange();
assert(a.video.paused,'Background tab pauses playback');
const beforeResume=a.video.playCalls;
a.document.hidden=false;a.document.handlers.visibilitychange();
assert.equal(a.video.playCalls,beforeResume+1,'Returning resumes a previously playing demo');
get('demo-toggle').emit('click');
a.document.hidden=true;a.document.handlers.visibilitychange();
a.document.hidden=false;a.document.handlers.visibilitychange();
assert(a.video.paused && a.video.playCalls===beforeResume+1,'Returning preserves a manual pause');

const reduced=run({}, {reducedMotion:true});
reduced.video.emit('loadedmetadata');
assert.equal(reduced.video.playCalls,0,'Reduced motion starts on the poster');
assert(!reduced.poster.hidden && !reduced.byId('demo-toggle').disabled,'Reduced motion still permits explicit playback');
reduced.buttons[1].emit('click');
assert.equal(reduced.video.currentTime,5,'Reduced motion allows a deliberate chapter choice');
assert.equal(reduced.video.playCalls,1);
reduced.motion.handlers.change();
assert(reduced.video.paused,'Enabling reduced motion pauses playback');
reduced.document.hidden=true;reduced.document.handlers.visibilitychange();
reduced.document.hidden=false;reduced.document.handlers.visibilitychange();
assert.equal(reduced.video.playCalls,1,'Reduced motion prevents automatic resumption');

const hidden=run({}, {hidden:true});
hidden.video.emit('loadedmetadata');
assert.equal(hidden.video.playCalls,0,'A page opened in the background does not autoplay');
hidden.document.hidden=false;hidden.document.handlers.visibilitychange();
assert.equal(hidden.video.playCalls,1,'First visibility can start the demo');

const rejectedOptions={rejectPlay:true},rejected=run({},rejectedOptions);
rejected.video.emit('loadedmetadata');
await new Promise(resolve=>setImmediate(resolve));
assert(rejected.video.paused && !rejected.poster.hidden,'Autoplay rejection keeps a poster');
assert(!rejected.byId('demo-toggle').disabled,'Autoplay rejection retains manual play');
rejectedOptions.rejectPlay=false;rejected.byId('demo-toggle').emit('click');
assert(!rejected.video.paused && rejected.poster.hidden,'Manual play works after autoplay rejection');

const failed=run();failed.video.emit('loadedmetadata');
failed.video.error={code:4};failed.video.emit('error');
assert(failed.video.paused && failed.video.hidden && !failed.poster.hidden,'Video errors restore the poster');
assert(failed.byId('demo-toggle').disabled && failed.byId('demo-chapters').hidden,'Video errors disable unusable controls');
failed.byId('language').emit('click');
assert.equal(failed.byId('demo-toggle').attrs['aria-label'],'Demo unavailable');
const failedPlayCalls=failed.video.playCalls;
failed.byId('demo-toggle').emit('click');failed.buttons[0].emit('click');
assert.equal(failed.video.playCalls,failedPlayCalls,'Unavailable controls cannot play');
failed.poster.emit('error');
assert.equal(failed.poster.attrs.src,'assets/hero-en.webp','Missing poster falls back to the original English capture');
failed.poster.emit('error');
assert.equal(failed.poster.attrs.src,'assets/hero-en.webp','Fallback failure does not loop');

const unsupported=run({}, {unsupported:true});
assert(unsupported.byId('demo-toggle').disabled && unsupported.byId('demo-chapters').hidden && !unsupported.poster.hidden,'No media support retains fallback with inert controls');
const earlyError=run({}, {videoError:{code:4}});
assert(earlyError.video.hidden && earlyError.byId('demo-toggle').disabled && !earlyError.poster.hidden,'A video error before initialization still restores the poster');
const cached=run({}, {readyState:1,posterFailed:true});
assert.equal(cached.video.playCalls,1,'Metadata loaded before initialization also starts playback');
assert.equal(cached.poster.attrs.src,'assets/hero-en.webp','A poster error before initialization still falls back');
const thrown=run({}, {throwPlay:true});thrown.video.emit('loadedmetadata');
assert(!thrown.poster.hidden && !thrown.byId('demo-toggle').disabled,'Synchronous play rejection also keeps manual controls');
const short=run({}, {duration:8});short.video.emit('loadedmetadata');
assert(short.buttons.slice(2).every(button=>button.disabled),'Chapters beyond the available duration are disabled');
short.buttons[2].emit('click');
assert.equal(short.video.currentTime,0,'Disabled chapters cannot seek');

console.log('PASS: mocked media autoplay/rejection, chapters, play/pause, visibility, reduced motion, load errors and poster fallback');
console.log('PASS: KO/EN headings/labels/widgets, shared English demo, 12 kitchens, disclosures, attribution and policy links');
for(const url of assetURLs) assert(existsSync(resolve(root,url)),`Missing asset ${url}`);
const mp4=readFileSync(resolve(root,'assets/pantrip-demo-en.mp4'));
assert(mp4.length>1000 && mp4.subarray(4,8).toString()==='ftyp','Demo asset is an MP4 file');
const poster=readFileSync(resolve(root,'assets/pantrip-demo-en-poster.jpg'));
assert(poster.length>1000 && poster[0]===0xff && poster[1]===0xd8,'Demo poster is a JPEG file');
console.log('PASS: referenced assets/anchors, MP4/JPEG signatures, image dimensions and favicons');
