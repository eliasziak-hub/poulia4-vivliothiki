const fs=require('fs'),path=require('path');
const L=require('../public/linker.js');
const root=path.join(__dirname,'..','public','data');
global.window={};eval(fs.readFileSync(path.join(root,'index.js'),'utf8'));
const D=window.POULIA4_LIB;
const dict=L.build(D.arts);
console.log('ονόματα στο λεξικό',dict.stats);
const strip=h=>h.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const cnt={},per=[];const A=Object.fromEntries(D.arts.map(a=>[a.id,a]));
let ex=[];
for(let k=0;k<D.chunks;k++){const b=JSON.parse(fs.readFileSync(path.join(root,'b'+k+'.json'),'utf8'));
 for(const id in b){const txt=strip(b[id].h.replace(/<h[34][^>]*>.*?<\/h[34]>/g,' ').replace(/<a [^>]*>.*?<\/a>/g,' '));
  const seen={};const r=L.find(dict,txt,id,seen,0);per.push(r.length);
  for(const x of r){cnt[x.id]=(cnt[x.id]||0)+1; if(ex.length<400&&Math.random()<.02) ex.push(txt.slice(x.s,x.e)+' → '+A[x.id].t);}}}
per.sort((a,b)=>a-b);
console.log('μέσο',(per.reduce((a,b)=>a+b,0)/per.length).toFixed(1),'διάμεσος',per[per.length>>1],'max',per[per.length-1],'μηδέν',per.filter(x=>!x).length);
const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([id,n])=>A[id].t+':'+n);
console.log('πιο συχνά:',top.join(' | '));
console.log(ex.slice(0,40).join('\n'));
