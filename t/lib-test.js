const {chromium}=require('playwright');
const BASE='http://localhost:8765/';let pass=0,fail=0;
const ok=(c,m)=>{if(c){pass++;}else{fail++;console.log('✗',m);}};
const SVG='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#9bb7a6"/><circle cx="80" cy="70" r="34" fill="#4f6f5d"/></svg>';
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',deviceScaleFactor:1});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
 await p.route(/googleusercontent\.com|blogspot\.com\/.*\.(jpg|png)|bp\.blogspot/,r=>r.fulfill({contentType:'image/svg+xml',body:SVG}));
 await p.goto(BASE);await p.waitForSelector('.hero');
 ok(await p.locator('.chap').count()>=60,'κάρτες κεφαλαίων στην αρχική');
 ok((await p.locator('.stat b').first().textContent())==='872','872 άρθρα στα στατιστικά');
 ok(await p.locator('.cicon svg').count()>40,'εικονίδια κεφαλαίων (πορτρέτα)');
 await p.screenshot({path:'../../shots/home.png'});
 // κεφάλαιο
 await p.click('.chap:has-text("Ιερακόμορφα")');await p.waitForSelector('.chead');
 ok((await p.locator('.chead h1').textContent())==='Ιερακόμορφα','κεφάλαιο Ιερακόμορφα');
 ok(await p.locator('.arow').count()>=60,'λίστα άρθρων κεφαλαίου');
 ok(await p.locator('.chead .btn:has-text("Επισκόπηση")').count()===1,'κουμπί επισκόπησης');
 await p.fill('#cf','πετρ');ok(await p.locator('.arow').count()<10&&await p.locator('.arow').count()>0,'φίλτρο κεφαλαίου');
 await p.screenshot({path:'../../shots/chapter.png'});
 await p.fill('#cf','');
 // άρθρο
 await p.goto(BASE+'#/q/'+encodeURIComponent('πετρίτης'));await p.waitForSelector('.arow');
 ok(await p.locator('.arow').count()>=1,'αναζήτηση πετρίτης');
 ok((await p.locator('.arow b').first().textContent()).includes('Πετρίτης'),'πρώτο αποτέλεσμα Πετρίτης');
 await p.click('.arow >> nth=0');await p.waitForSelector('.prose p');
 ok(await p.locator('.gallery img').count()>=1,'γκαλερί 160px');
 const w=await p.locator('.gallery img').first().evaluate(e=>e.getAttribute('src'));ok(/s160-c/.test(w),'φωτογραφίες σε μέγεθος 160: '+w.slice(-40));
 ok(await p.locator('.arel .rcard').count()>=3,'σχετικά άρθρα');
 ok(/λεπτ|′/.test(await p.locator('.ameta').textContent()),'χρόνος ανάγνωσης');
 await p.screenshot({path:'../../shots/article.png'});
 // μακρύ άρθρο με επικεφαλίδες
 await p.goto(BASE+'#/q/'+encodeURIComponent('Βουνοπετρόκλης'));await p.waitForSelector('.arow');await p.click('.arow >> nth=0');await p.waitForSelector('.prose h4');
 ok(await p.locator('.prose h4, .prose h3').count()>=2,'επικεφαλίδες στο άρθρο');ok(await p.locator('.prose ul li b').count()>=2,'έντονες ετικέτες στις λίστες');
 // auto-link → quick card
 const n=await p.locator('a.sp-link').count();
 // βρες άρθρο με πολλούς συνδέσμους
 for(const q of ['Κιρκινέζι','Γλαρόνια','Σταχτάρα']){ if(await p.locator('a.sp-link').count()>=2)break; await p.goto(BASE+'#/q/'+encodeURIComponent(q));await p.waitForSelector('.arow');await p.click('.arow >> nth=0');await p.waitForSelector('.prose p');}
 const links=await p.locator('a.sp-link').count();console.log('συνδέσμους ειδών στο άρθρο:',links);
 if(links){const spId=(await p.locator('a.sp-link').first().getAttribute('href')).split('/')[2];const spG=await p.evaluate(i=>window.POULIA4_LIB.arts.find(a=>a.id===i).g,spId);await p.locator('a.sp-link').first().click();await p.waitForSelector('.mcard h2');
  ok(await p.locator('.mcard .art-th svg').count()===1,'quick-card: ζωγραφισμένο πορτρέτο');
  await p.waitForSelector('#mPh img',{timeout:5000}).catch(()=>{});
  ok(spG===0||await p.locator('#mPh img').count()>=1,'quick-card: φωτογραφίες 160px (g='+spG+')');
  ok((await p.locator('#mText').textContent()).length>60,'quick-card: κείμενο');
  await p.screenshot({path:'../../shots/quickcard.png'});
  const hash=await p.evaluate(()=>location.hash);
  await p.keyboard.press('Escape');ok(await p.locator('#modal').isHidden(),'Esc κλείνει την κάρτα');
  ok(await p.evaluate(()=>location.hash)===hash,'η σελίδα δεν χάθηκε');
  await p.locator('a.sp-link').first().click();await p.click('.macts .btn >> nth=0');await p.waitForTimeout(400);
  ok(/#\/a\//.test(await p.evaluate(()=>location.hash)),'«Διάβασε το άρθρο» ανοίγει το άρθρο');}
 // reader mode
 await p.click('#btnSet');await p.click('[data-act="fs+"]');await p.click('[data-act="fs+"]');
 ok(await p.evaluate(()=>document.documentElement.style.getPropertyValue('--fs'))==='1.2','A+ ×2 → 1.2');
 await p.click('.th-sepia');ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='sepia','Σέπια');
 await p.waitForTimeout(500);await p.screenshot({path:'../../shots/reader-sepia.png'});
 await p.click('.th-dark');ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='dark','Dark');
 await p.waitForTimeout(500);await p.screenshot({path:'../../shots/reader-dark.png'});
 await p.keyboard.press('Escape');
 await p.reload();await p.waitForSelector('.prose');
 ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='dark'&&await p.evaluate(()=>document.documentElement.style.getPropertyValue('--fs'))==='1.2','οι ρυθμίσεις μένουν μετά από ανανέωση');
 // πρόοδος: κύλιση ως το τέλος
 await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(600);
 ok(await p.locator('#doneTag').isVisible(),'αυτόματο «Διαβασμένο» στο τέλος');
 const id=(await p.evaluate(()=>location.hash)).split('/')[2];
 ok(await p.evaluate(i=>!!JSON.parse(localStorage.getItem('p4lib.read')||'{}')[i],id),'αποθηκεύεται η ολοκλήρωση');
 // πρόοδος κεφαλαίου
 await p.goto(BASE+'#/');await p.waitForSelector('.hero');ok(/διαβασμένα/.test(await p.locator('.chap small').allTextContents().then(a=>a.join('|'))),'πρόοδος στις κάρτες κεφαλαίων');
 ok(await p.locator('.resume').count()===1,'«Συνέχισε την ανάγνωση»');
 // εσωτερικός σύνδεσμος + lightbox
 const gid=await p.evaluate(()=>window.POULIA4_LIB.arts.find(a=>a.g>3).id);await p.goto(BASE+'#/a/'+gid);await p.waitForSelector('.gallery button');await p.click('.gallery button >> nth=0');
 ok(await p.locator('#lightbox').isVisible(),'lightbox ανοίγει');await p.keyboard.press('Escape');ok(await p.locator('#lightbox').isHidden(),'lightbox κλείνει');
 // κινητό
 const m=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true});
 const q=await m.newPage();await q.route(/googleusercontent\.com|bp\.blogspot/,r=>r.fulfill({contentType:'image/svg+xml',body:SVG}));
 await q.goto(BASE);await q.waitForSelector('.hero');
 ok(await q.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'κινητό: χωρίς οριζόντια κύλιση (αρχική)');
 await q.screenshot({path:'../../shots/m-home.png'});
 await q.goto(BASE+'#/a/'+id);await q.waitForSelector('.prose p');
 ok(await q.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'κινητό: χωρίς οριζόντια κύλιση (άρθρο)');
 await q.screenshot({path:'../../shots/m-article.png'});
 await q.goto(BASE+'#/k/c0');await q.waitForSelector('.arow');
 ok(await q.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'κινητό: χωρίς οριζόντια κύλιση (κεφάλαιο)');
 await q.screenshot({path:'../../shots/m-chapter.png'});
 console.log('σφάλματα σελίδας:',errs.length?errs:'κανένα');
 ok(errs.length===0,'κανένα σφάλμα κονσόλας');
 console.log(`\n${pass} επιτυχίες, ${fail} αποτυχίες`);await b.close();process.exit(fail?1:0);
})();
