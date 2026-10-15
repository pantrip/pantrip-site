// Public homepage contract: node check-public.mjs
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'public');
const file=p=>resolve(root,p);
assert.equal(readFileSync(file('app-ads.txt'),'utf8'),'google.com, pub-5326804589747186, DIRECT, f08c47fec0942fa0\n','AdMob publisher declaration must be exact plain text');
const html=readFileSync(file('index.html'),'utf8');

// Document shell and site identity (kept from the previous homepage).
assert(html.startsWith('<!doctype html>\n<html lang="ko">'),'Full document; JavaScript switches <html lang>');
assert(html.includes('<meta charset="utf-8">'));
assert(html.includes('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'),'Viewport covers the safe areas');
assert(html.includes(':root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}'),'Safe-area and [hidden] reset');
assert(/<style>\n@import url\('https:\/\/fonts\.googleapis\.com\//.test(html),'Font @import is the first rule');
assert(html.includes('<title>Pantrip: Food &amp; Kitchen</title>'));
assert(html.includes('<meta name="google-site-verification" content="oeRmYQ1gHrO_SfnqCqhU_MF8tc5xIbpoDs0QWFrdCNo" />'));
assert(html.includes('<link rel="canonical" href="https://pantrip.app/">'));
assert(html.includes('<meta name="referrer" content="no-referrer">'));
assert(!/document\.title\s*=/.test(html),'The page keeps its static title');
assert(html.includes('<meta property="og:url" content="https://pantrip.app/">'));
assert(!/noindex/i.test(html),'The public homepage can be indexed');
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema['@context'],'https://schema.org');
assert.deepEqual(schema['@graph'].map(node=>node['@type']),['WebSite','SoftwareApplication']);
assert.equal(schema['@graph'][1].operatingSystem,'iOS');
assert(!('offers' in schema['@graph'][1])&&!('aggregateRating' in schema['@graph'][1]),'Do not invent prices or ratings');
const robots=readFileSync(file('robots.txt'),'utf8');
assert(robots.includes('User-agent: *\nAllow: /')&&robots.includes('Disallow: /admin')&&robots.includes('Disallow: /api'));
assert(robots.includes('Sitemap: https://pantrip.app/sitemap.xml'));
const sitemap=readFileSync(file('sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
assert.equal(urls.length,25,'Homepage and 24 policy/support pages');
assert.equal(new Set(urls).size,25,'No duplicate URLs');
for(const url of urls){
 const path=new URL(url).pathname;
 assert.equal(new URL(url).origin,'https://pantrip.app');
 assert(!/admin|api|\.html/.test(path),'Only clean public production URLs');
 const page=readFileSync(file(path==='/'?'index.html':path.slice(1)+'.html'),'utf8');
 assert(page.includes(`<link rel="canonical" href="${url}">`),`Sitemap and canonical agree: ${url}`);
}
// Favicons: dot-matrix app icon at the declared sizes (PNG IHDR width/height).
for(const [rel,size,name] of [['icon',32,'favicon-32.png'],['icon',16,'favicon-16.png'],['apple-touch-icon',180,'apple-touch-icon.png'],[null,512,'app-icon.png']]) {
 if(rel) assert(html.includes(`<link rel="${rel}" `) && html.includes(`sizes="${size}x${size}" href="assets/${name}"`),`Favicon link ${name}`);
 const png=readFileSync(file('assets/'+name));
 assert.equal(png.readUInt32BE(16),size,`${name} width`);assert.equal(png.readUInt32BE(20),size,`${name} height`);
}

// No tracking, no fake store link, nothing private, only the allowed third-party hosts.
assert(!html.includes('apps.apple.com'),'No fake download URL');
assert(!/\/admin|swagger/i.test(html),'No admin or API documentation links');
assert(!/googletagmanager|gtag\(|google-analytics|adsbygoogle|amplitude|plausible|clarity\.ms|facebook\.net/i.test(html),'No analytics or ad scripts');
const allowed=['cdn.jsdelivr.net','fonts.googleapis.com','commons.wikimedia.org','creativecommons.org','poly.pizza','schema.org'];
for(const [,h] of html.matchAll(/https:\/\/([a-z0-9.-]+)\//g)) assert(allowed.includes(h)||/(^|\.)pantrip\.app$/.test(h),`Unexpected host ${h}`);
for(const [,src] of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) assert.fail(`No script files besides the import map: ${src}`);
const importMap=JSON.parse(html.match(/<script type="importmap">([^<]+)<\/script>/)[1]);
assert.deepEqual(importMap.imports,{three:'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','three/addons/':'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/'},'three.js pinned to 0.160.0 on jsDelivr');

// Markup: unique ids, anchors, images with size and alt.
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Unique DOM ids');
const dim=`(?:\\d+|'\\+[\\w.]+\\+')`;   // a number, or a value filled in by the catalog script
for(const [tag] of html.matchAll(/<img\b[^>]*>/g)) assert(new RegExp(`\\bwidth="${dim}"`).test(tag) && new RegExp(`\\bheight="${dim}"`).test(tag) && /\balt="/.test(tag),`Image size and alt: ${tag}`);

// Story order, then the footer with policies, contact and the Google sign-in explanation.
const order=['id="s1"','id="s2"','id="s3"','id="departures"','id="knolling"','id="pass"','</main>','<footer class="foot">','id="google-signin"','</footer>'].map(s=>html.indexOf(s));
assert(order.every((at,i)=>at>=0&&(i===0||at>order[i-1])),'Sections follow the story, then the footer');
const footer=html.slice(html.indexOf('<footer class="foot">'),html.indexOf('</footer>'));
for(const page of ['privacy.html','terms.html','support.html']) assert(footer.includes(`href="${page}"`),`Footer links ${page}`);
assert(footer.includes('href="mailto:jsh097610@gmail.com">jsh097610@gmail.com</a>'),'Contact email in the footer');
assert(/<details class="disclosure" id="google-signin">\s*<summary data-t="gsiQ">Google 로그인은 어디에 사용하나요\?<\/summary>/.test(footer),'Collapsed Google sign-in explanation');
assert(!/<details[^>]*\bopen\b/.test(html),'Disclosures start collapsed');

// Language catalogs: every one of the 10 languages carries every key.
const local=v=>JSON.parse(JSON.stringify(v));   // values from the vm realm, compared as plain data
const block=name=>{const at=html.indexOf(`var ${name}={`);assert(at>=0,`Catalog ${name}`);return local(vm.runInNewContext('('+html.slice(at+name.length+5,html.indexOf('\n};\n',at)+2)+')'));};
const LANGS=['ko','en','ja','es','de','fr','th','ru','mn','vi'];
assert.deepEqual(local(vm.runInNewContext(html.match(/var SUP=(\[[^\]]+\]);/)[1])),LANGS,'Ten supported languages');
assert.deepEqual([...html.matchAll(/<option value="(\w+)" lang="\1">/g)].map(m=>m[1]),LANGS,'Language selector lists all ten');
const L=block('L'),CR=block('CR'),UI=block('UI');
const FT=JSON.parse(html.match(/var FT=(\{.*\});\n/)[1]);
for(const [name,cat] of [['L',L],['CR',CR],['UI',UI],['FT',FT]]) {
 assert.deepEqual(Object.keys(cat).sort(),[...LANGS].sort(),`${name} covers every language`);
 const keys=JSON.stringify(Object.keys(cat.ko).sort());
 for(const lang of LANGS){
  assert.equal(JSON.stringify(Object.keys(cat[lang]).sort()),keys,`${name}.${lang} has every key`);
  for(const [k,v] of Object.entries(cat[lang])) assert(typeof v==='object'||String(v).trim(),`${name}.${lang}.${k} is filled`);
 }
}
for(const lang of LANGS) assert.deepEqual(Object.keys(UI[lang].tiers).sort(),['basic','extended','prestige','signature'],`UI.${lang} names every tier`);
for(const [,k] of html.matchAll(/data-t(?:-alt|-aria)?="(\w+)"/g)) assert(k in L.ko || k in FT.ko,`Catalog key ${k} exists`);
for(const [,k] of html.matchAll(/data-c(?:-aria)?="(\w+)"/g)) assert(k in UI.ko,`Catalog key ${k} exists`);
// Google sign-in explanation: the site's existing Korean/English wording, unchanged.
assert.equal(FT.ko.gsiQ,'Google 로그인은 어디에 사용하나요?');
assert.equal(FT.en.gsiQ,'What is Google sign-in used for?');
assert.equal(FT.ko.gsiA,'Google 로그인은 Google 계정을 Pantrip 계정에 연결하여 다시 로그인하고 계정의 포인트와 구매한 아이템을 이용하는 데 사용합니다. Google 비밀번호는 Pantrip에 전달되지 않습니다. 식품 동기화에 별도로 동의하면 식품 정보와 사진을 계정에 저장하고 다른 로그인 기기와 동기화합니다. 로그인만으로 식품 동기화가 켜지지는 않습니다. Apple 로그인도 지원합니다.');
assert.equal(FT.en.gsiA,'Google sign-in connects your Google identity to your Pantrip account so you can sign in again and access account points and purchased items. Pantrip does not receive your Google password. If you separately enable food sync, food records and photos are saved to your account and synced with other signed-in devices. Signing in does not automatically enable food sync. Apple sign-in is also supported.');
assert(footer.includes(`<p data-t="gsiA">${FT.ko.gsiA}</p>`),'Korean explanation is in the static markup');
for(const lang of LANGS) assert(/Google/.test(FT[lang].gsiQ)&&/Pantrip/.test(FT[lang].gsiA)&&/Apple/.test(FT[lang].gsiA),`Google sign-in explanation in ${lang}`);
assert.equal(FT.ko.notesDates,'기한 알림은 식품의 안전성을 판단하지 않아요. 상품 표시와 보관 방법을 따라 주세요.');
assert.equal(FT.en.notesDates,'Dates are reminders, not food safety advice. Follow the product label and storage instructions.');
console.log('PASS: document shell, verification, canonical, referrer, favicons, policy links, contact, Google sign-in in 10 languages');

// Motion: reduced motion gets static frames and no autoplay.
assert(html.includes("matchMedia('(prefers-reduced-motion: reduce)')"),'Reduced motion is read in script');
assert(/@media \(prefers-reduced-motion:reduce\)/.test(html),'Reduced motion CSS');
assert(html.includes('html.static .stage .still{opacity:1;visibility:visible}'),'Static frames for reduced motion and no WebGL');
assert(/<video class="gate-vid" muted playsinline loop preload="none"/.test(html) && !/<video[^>]*\sautoplay/.test(html),'Entrance video never autoplays from markup');
console.log('PASS: unique ids, image sizes, 10-language catalogs, reduced motion');

// Assets: everything the markup and scripts reference exists, in the right format.
const refs=new Set();
for(const [,url] of html.matchAll(/\b(?:src|href|poster|srcset)="([^"]+)"/g)) {
 if(url.startsWith('#')&&url.length>1) assert(ids.includes(url.slice(1)),`Missing anchor ${url}`);
 else if(!/^(#|mailto:|https:|')/.test(url)) refs.add(url);
}
for(const [,url] of html.matchAll(/['"](assets\/[\w./-]+\.\w+)['"]/g)) refs.add(url);
const names=local(vm.runInNewContext(html.match(/const NAMES = (\[[^\]]+\]);/)[1]));
for(const n of names) refs.add(`assets/products/${n}.glb`);
const snap=JSON.parse(readFileSync(file('assets/catalog/snapshot.json'),'utf8'));
assert.equal(snap.asOf.revisionNumber,709,'Catalog snapshot revision');
assert(snap.kitchens.length>=8 && snap.products.length && snap.decor.length && snap.package.items.length,'Catalog snapshot has kitchens, products, decor and the package');
assert(snap.kitchens.some(k=>k.id==='hanok'&&k.video),'Default departure has an entrance video');
for(const k of snap.kitchens) for(const p of [k.video,k.poster,k.preview?.src]) if(p) refs.add(p);
for(const it of [...snap.products,...snap.decor,...snap.package.items]) refs.add(it.image);
refs.add(snap.package.image);
for(const url of refs) assert(existsSync(file(url)),`Missing asset ${url}`);
const magic=(p,at,len)=>readFileSync(file(p)).subarray(at,at+len).toString('latin1');
for(const url of refs) {
 if(url.endsWith('.glb')) assert.equal(magic(url,0,4),'glTF',`${url} is binary glTF`);
 if(url.endsWith('.mp4')) assert.equal(magic(url,4,4),'ftyp',`${url} is MP4`);
 if(url.endsWith('.webp')) assert.equal(magic(url,8,4),'WEBP',`${url} is WebP`);
}
for(const glb of [...refs].filter(u=>u.endsWith('.glb'))) {
 const buf=readFileSync(file(glb)),json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString());
 for(const ext of json.extensionsRequired||[]) assert(['KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(ext),`${glb} needs no extra decoder (${ext})`);
}
console.log(`PASS: ${refs.size} referenced assets exist (glTF/MP4/WebP signatures), catalog snapshot rev ${snap.asOf.revisionNumber}`);
