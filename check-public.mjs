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
for(const [,url] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
 if(url.startsWith('#')&&url.length>1) assert(ids.includes(url.slice(1)),`Missing anchor ${url}`);
 else if(!/^(#|mailto:|https:)/.test(url)) assert(existsSync(resolve(root,url)),`Missing asset ${url}`);
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
assert(!html.includes('<video') && !existsSync(resolve(root,'assets/kitchen-preview.mp4')),'Old development-build video is gone');
const css=readFileSync(resolve(root,'style.css'),'utf8');
assert(css.includes('prefers-reduced-motion:reduce'));
assert(css.includes('forced-colors:active'));
assert(css.includes('prefers-color-scheme:dark'));
assert(!/<(?:button|a|p|strong|summary|figcaption)[^>]*class="[^"]*dot-text/.test(html),'Small text and controls must be solid');
assert(html.includes('<title>Pantrip: Food &amp; Kitchen</title>'));
assert(html.includes('<h1 class="brand-title">Pantrip: Food &amp; Kitchen</h1>'));
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
// Story order, then the collapsed Google sign-in explanation as the last thing before the footer.
const order=['class="brand-title"','id="photo"','id="shapes"','id="kitchens"','id="reminders"','id="contact"','<details class="signin','</main>','<footer'].map(s=>html.indexOf(s));
assert(order.every((at,i)=>at>=0&&(i===0||at>order[i-1])),'Sections follow the App Store story');
assert(/<details class="signin" id="google-signin">\s*<summary><span data-ko="Google 로그인은 어디에 사용하나요\?" data-en="What is Google sign-in used for\?">/.test(html),'Collapsed Google sign-in explanation');
assert(!/<details[^>]*\bopen\b/.test(html),'Google sign-in explanation starts collapsed');
assert(/<\/details>\s*<\/main>\s*<footer/.test(html),'Google sign-in explanation sits just above the footer');
const kitchens=[...html.matchAll(/<li><figure><img src="assets\/kitchen-(\w+)\.jpg"[^>]*data-ko-alt="([^"]+)" data-en-alt="([^"]+)"><figcaption data-ko="([^"]+)" data-en="([^"]+)">/g)];
assert.equal(kitchens.length,12,'Twelve kitchen cards with localized names');
for(const [,id,koAlt,enAlt,ko,en] of kitchens) assert(koAlt.startsWith(ko)&&enAlt.startsWith(en),`Kitchen ${id} alt names its caption`);
assert.equal(new Set(kitchens.map(k=>k[4])).size,12,'Kitchen names are distinct');
assert(html.includes('일부 주방은 포인트가 필요합니다.'));
assert(html.includes('위젯 표시 예시') && html.includes('Widget preview (sample data)'));

// Run app.js against the real markup: every localized tag in index.html becomes a mock element.
function parse(tag){
 const attrs={};for(const [,k,v] of tag.matchAll(/\s([\w-]+)="([^"]*)"/g)) attrs[k]=v.replace(/&amp;/g,'&');
 const dataset={};for(const [k,v] of Object.entries(attrs)) if(k.startsWith('data-')) dataset[k.slice(5).replace(/-(\w)/g,(_,c)=>c.toUpperCase())]=v;
 return {attrs,dataset,handlers:{},textContent:'',addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];}};
}
function run(config){
 const elements=[...html.matchAll(/<(?!\/)[^>]+>/g)].map(m=>parse(m[0]));
 const byId=id=>elements.find(el=>el.attrs.id===id);
 const meta={content:''};
 const document={documentElement:{},getElementById:byId,querySelector:q=>{assert.equal(q,'meta[name="description"]');return meta;},
  querySelectorAll:q=>{const names=[...q.matchAll(/\[([\w-]+)\]/g)].map(m=>m[1]);return elements.filter(el=>names.every(n=>n in el.attrs));}};
 vm.runInNewContext(readFileSync(resolve(root,'app.js'),'utf8'),{document,window:{PANTRIP_SITE:config},URL});
 return {byId,document,meta,elements};
}
const setup={window:{}};vm.runInNewContext(readFileSync(resolve(root,'config.js'),'utf8'),setup);
const a=run(setup.window.PANTRIP_SITE),get=a.byId;
const localized=a.elements.filter(el=>'data-ko' in el.attrs&&'data-en' in el.attrs);
assert(localized.length>40,'Localized copy found');
assert.equal(a.document.documentElement.lang,'ko');
assert(localized.every(el=>el.textContent===el.dataset.ko&&el.dataset.ko&&el.dataset.en),'Korean copy by default');
assert.equal(get('hero-capture').attrs.src,'assets/hero-ko.webp');
get('language').handlers.click();
assert.equal(a.document.documentElement.lang,'en');
assert(localized.every(el=>el.textContent===el.dataset.en),'Every localized text swaps to English');
assert.equal(get('hero-capture').attrs.src,'assets/hero-en.webp','Hero capture swaps with language');
assert(get('hero-capture').attrs.alt.includes('car factory'));
for(const [id,en] of [['photo-title','Snap a photo. Add your food.'],['shapes-title','Your food, now in 3D'],['kitchens-title','A kitchen that’s all yours'],['reminders-title','Keep track of use-by dates']])
 assert.equal(get(id).textContent,en,`Heading ${id} in English`);
assert(a.elements.filter(el=>'data-ko-src' in el.attrs).every(el=>el.attrs.src===el.attrs['data-en-src']&&el.attrs.src.includes('-en.')),'Widget and hero images swap to English');
assert(a.elements.filter(el=>'data-ko-alt' in el.attrs).every(el=>el.attrs.alt===el.attrs['data-en-alt']),'Alt text swaps to English');
assert(a.elements.filter(el=>'data-ko-aria' in el.attrs).every(el=>el.attrs['aria-label']===el.attrs['data-en-aria']),'Region labels swap to English');
assert.equal(get('language').textContent,'한국어');assert(a.meta.content.startsWith('Your food'));
get('language').handlers.click();
assert(localized.every(el=>el.textContent===el.dataset.ko)&&get('hero-capture').attrs.src==='assets/hero-ko.webp','Back to Korean');
assert.equal(get('language').attrs['aria-label'],'Switch to English');
assert.equal(get('privacy-link').attrs.href,'privacy.html');
const b=run({privacyURL:'https://example.com/privacy'});
assert.equal(b.byId('privacy-link').href,'https://example.com/privacy');
console.log('PASS: assets/anchors, image sizes + localized alts, 12 kitchens, story order, favicons, KO/EN text+image+label swap, privacy config');
console.log('PASS: Pantrip brand, verification meta, collapsed Google sign-in explanation and public policy links');
