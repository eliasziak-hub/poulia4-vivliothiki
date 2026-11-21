const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch();const svg=fs.readFileSync(path.join(__dirname,'../public/icons/icon.svg'),'utf8');
const out=(n)=>path.join(__dirname,'../public/icons',n);
async function shot(html,size,file){const p=await b.newPage({viewport:{width:size,height:size}});await p.setContent('<body style="margin:0;background:transparent">'+html+'</body>');await p.screenshot({path:out(file),omitBackground:true});await p.close();}
const img=(s,extra='')=>`<div style="width:${s}px;height:${s}px;${extra}">${svg.replace('<svg ','<svg width="'+s+'" height="'+s+'" ')}</div>`;
await shot(img(192),192,'icon-192.png');await shot(img(512),512,'icon-512.png');await shot(img(180),180,'apple-touch-icon.png');await shot(img(32),32,'favicon-32.png');
// maskable: γεμάτο φόντο, το σύμβολο μέσα στην ασφαλή ζώνη 80%
const inner=svg.replace('<svg ','<svg width="410" height="410" ');
await shot(`<div style="width:512px;height:512px;background:#1f5c4d;display:grid;place-items:center"><div style="width:410px;height:410px;transform:scale(1)">${inner}</div></div>`,512,'icon-maskable-512.png');
await b.close();})();
