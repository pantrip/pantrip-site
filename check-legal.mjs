import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const langs=['ko','en','ja','th','ru','es','mn'];
const operator='Sanmaru Studio';
const supportEmail='hello@sanmarustudio.com';
const personalContact=/전\s*성\s*훈|seong[\s-]*hun[\s-]*jeon|jeon[\s-]*seong[\s-]*hun|jsh097610@gmail\.com/i;
const data=JSON.parse(await readFile('legal-content.json','utf8'));
assert.deepEqual(Object.keys(data).sort(),[...langs].sort());
for(const file of ['legal-content.json','build-legal.mjs'])assert(!personalContact.test(await readFile(file,'utf8')),`Personal contact remains: ${file}`);
assert.equal(await readFile('public/legal.css','utf8'),await readFile('legal.css','utf8'));
for(const file of ['public/index.html','public/privacy.html','public/support.html','public/terms.html']){
 const html=await readFile(file,'utf8');assert(html.includes('Pantrip') && !html.includes('ExpiryCheck'));
}
for(const kind of ['privacy','support','terms']){
 const html=await readFile(`public/${kind}.html`,'utf8');
 assert(!personalContact.test(html));
 assert(html.includes(`<p>${operator}<br><a href="mailto:${supportEmail}">${supportEmail}</a></p>`));
 for(const lang of langs)assert(html.includes(`<link rel="alternate" hreflang="${lang}" href="https://pantrip.app/${kind}/${lang}">`));
 assert(html.includes(`<link rel="alternate" hreflang="x-default" href="https://pantrip.app/${kind}">`));
}
for(const file of ['public/index.html',...['privacy','support','terms'].flatMap(kind=>[`public/${kind}.html`,...langs.map(lang=>`public/${kind}/${lang}.html`)])]){
 const html=await readFile(file,'utf8');
 const footer=html.split('<footer')[1].split('</footer>')[0];
 assert(footer.includes('<a class="company-logo" href="https://sanmarustudio.com/">'),`Company home link: ${file}`);
 for(const [,src] of footer.matchAll(/(?:src|srcset)="([^"]+sanmaru-logo[^"]*\.svg)"/g))await readFile(resolve(dirname(file),src));
 assert(footer.includes('alt="Sanmaru Studio" width="135" height="24"'),'Company logo accessible name and dimensions');
}
let checked=0;
for(const lang of langs){
 const source=JSON.stringify(data[lang]);
 assert(!personalContact.test(source));
 assert.deepEqual([...new Set(source.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi))],[supportEmail]);
 assert(data[lang].sections[0][1][0].includes(operator));
 assert(data[lang].terms[0][1][0].includes(operator));
 assert(data[lang].sections[9][1].some(p=>p.includes('2026-10-16')&&p.includes(operator)&&p.includes(supportEmail)));
 assert.equal(data[lang].sections.length,10);
 assert.equal(data[lang].providers.length,7);
 assert.equal(data[lang].support.length,5);
 assert.equal(data[lang].terms.length,9);
 assert(data[lang].termsTitle && data[lang].termsSummary.includes("2026"));
 assert(data[lang].terms[5][1][0].includes("reportaproblem.apple.com"));
 assert(!JSON.stringify(data[lang]).includes('SHA-256'));
 assert(data[lang].providers[6].includes('OpenAI / ChatGPT Sites'));
 assert(!data[lang].providers[6].includes('GitHub'));
 assert(data[lang].sections[6][1][1].includes('Pantrip'));
 assert(data[lang].sections[7][1][3].includes('Pantrip'));
 assert(data[lang].support[4][1][0].includes('P'));
 assert(data[lang].contentsTitle && data[lang].languageTitle);
 assert(data[lang].sections[9][1].some(p=>p.includes('2026-09-29')));
 for(const kind of ['privacy','support','terms']){
  const file=resolve('public',kind,lang+'.html');
  const html=await readFile(file,'utf8');
  assert(html.includes(`<html lang="${lang}">`));
  assert(html.includes(`<link rel="canonical" href="https://pantrip.app/${kind}/${lang}">`));
  for(const code of langs)assert(html.includes(`<link rel="alternate" hreflang="${code}" href="https://pantrip.app/${kind}/${code}">`));
  assert(html.includes(`<link rel="alternate" hreflang="x-default" href="https://pantrip.app/${kind}">`));
  assert(!personalContact.test(html),`Personal contact remains: ${file}`);
  assert(html.includes(`<p>${operator}<br><a href="mailto:${supportEmail}">${supportEmail}</a></p>`));
  assert(html.includes(`${data[lang].updated} · 2026-10-16`));
  assert.deepEqual([...new Set([...html.matchAll(/href="mailto:([^"]+)"/g)].map(m=>m[1]))],[supportEmail]);
  assert(html.includes('Pantrip') && !html.includes('ExpiryCheck'));
  assert(!/<script|__\w+__|YOUR_|localhost|127\.0\.0\.1/i.test(html));
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
  assert(html.includes(`aria-label="${data[lang].contentsTitle}"`));
  const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
   if(href.startsWith('#'))assert(ids.includes(href.slice(1)),`Missing anchor: ${file} ${href}`);
   if(!/^(https:|mailto:|#)/.test(href))await readFile(resolve(dirname(file),href));
  }
  checked++;
 }
}
console.log(`PASS: ${checked} localized + 3 index pages; studio contact, language, content, links and no tracking scripts.`);
