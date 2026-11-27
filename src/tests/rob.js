const fs=require('fs');const ctx={};new Function('ctx',fs.readFileSync('engine.js','utf8')+';ctx.S=simulate;ctx.L=loanPlan;ctx.PP=pensionPlan;ctx.ST=STRESS;ctx.LD=typeof leverData==="function"?leverData:null')(ctx);
const P=JSON.parse(fs.readFileSync('tests/params.json')); if(P.dcap==null)P.dcap=Infinity;
const V={re:.05,rb:.0275,rc:.01,rgo:.025};
const bad=[]; const chk=(n,r)=>{ if(!(r.success>=0&&r.success<=1)) bad.push(n+': success '+r.success); for (const k of ['totR','totN','rateR','penR','taxY']) if(r[k]) { for (let j=0;j<r[k].length;j++) if(!isFinite(r[k][j])) { bad.push(n+': '+k+' NaN/Inf @'+j); break; } } return r.success; };
const run=(n,x,lite)=>chk(n,ctx.S({...P,...x},!!lite));
// 1. Randfälle
const cases={ 'nichts':{cap:0,contrib:0}, 'kein Haus':{home:false}, 'keine Rente':{pOn:false}, 'GKV':{kvPriv:false}, 'Zinsbindung 0':{lzb:0}, 'Zinsbindung 30':{lzb:30}, 'Zins danach 0':{lz2:0}, 'Zins danach 10':{lz2:.1},
 'Restschuld 0':{debt:0}, 'Rate 0':{lrate:0,lsond:0}, 'Rate 6000':{lrate:6000}, 'Inflation 0':{inf:0}, 'Inflation 5':{inf:.05}, 'einfaches Modell':{model:'s'}, 'Rente ab 63, Depot ab 60':{pAge:63,retAge:60},
 'Depot ab 70, Rente 67':{retAge:70}, 'Alter 60 heute':{age0:60}, 'Alter 66 heute':{age0:66}, 'Entnahme 0':{net:0}, 'Entnahme 10000':{net:10000}, 'Kosten 1,5':{ter:.015}, 'Gold 20':{wG:.2,wE:.7}, 'Zelt':{tent:true}, 'fest':{wmode:'fix'},
 'Verkauf mit 70':{flows:[{type:'sale',y:34,amt:0}]}, 'Verkauf mit 40 (vor Bindungsende)':{flows:[{type:'sale',y:4,amt:0}]}, 'Erbe 100k mit 50':{flows:[{type:'in',y:14,amt:100000}]}, 'Rentenniveau 0':{pniv:0}, 'PKV 0':{pkv0:0,ktg:0}, 'KTG > Beitrag':{pkv0:200,ktg:300},
 'Steuer Tarif':{ptaxAuto:true}, 'Kirchensteuer':{ptaxAuto:true,kst:.09}, 'Bis 100':{age1:100}, 'Zweitdepot':{trick:true}};
for (const st of ['none',...Object.keys(ctx.ST)]) for (const [n,x] of Object.entries(cases)) run(st+' / '+n,{...x,stress:st},false);
console.log('Randfälle geprüft:',Object.keys(cases).length*(1+Object.keys(ctx.ST).length),'| Probleme:',bad.length); bad.slice(0,15).forEach(b=>console.log('  ',b));
// 2. Monotonie (Richtung muss stimmen)
const mono=[['Sparrate',{contrib:100},{contrib:600},+1],['Vermögen',{cap:100000},{cap:300000},+1],['Entnahme',{net:2500},{net:3500},-1],['Rente',{pens:2500},{pens:3500},+1],['Rentenniveau',{pniv:.40},{pniv:.48},+1],['Rentensteigerung',{pg:.015},{pg:.025},+1],
 ['PKV-Steigerung',{pkvg:.03},{pkvg:.06},-1],['Kosten',{ter:0},{ter:.01},-1],['Anschlusszins',{lz2:.03},{lz2:.06},-1],['Sollzins',{lz:.02},{lz:.04},-1],['Kreditrate-Anteil',{lshare:.5},{lshare:1},-1],['Depotstart',{retAge:65},{retAge:69},+1],['Lebensende',{age1:90},{age1:100},-1],['Aktienrendite',{re:.05},{re:.08},+1],['Kirchensteuer',{ptaxAuto:true,kst:0},{ptaxAuto:true,kst:.09},-1],['Sondertilgung',{lsond:0},{lsond:15000},+1],['Ziel %',{net:2700},{net:3300},-1]];
const viol=[]; for (const sc of [{},V]) for (const [n,a,b,dir] of mono) { const sa=ctx.S({...P,...sc,...a},true).success, sb=ctx.S({...P,...sc,...b},true).success; const ok=dir>0?sb>=sa-0.005:sb<=sa+0.005; if(!ok) viol.push(`${n} (${sc.re?'schwach':'früher'}): ${(sa*100).toFixed(1)} -> ${(sb*100).toFixed(1)}`); }
console.log('Monotonie-Tests:',mono.length*2,'| Verstöße:',viol.length); viol.forEach(v=>console.log('  ',v));
// 3. Kredit: Schuld darf nie wachsen, Zahlungen nie negativ
let lb=0; for (const lz2 of [0,.03,.045,.08,.1]) for (const lzb of [0,5,8,30]) for (const lrate of [300,1000,1725,4000]) { const L=ctx.L({...P,lz2,lzb,lrate,inf:.02},59,Infinity); for(let y=0;y<59;y++){ if(L.DEBT[y+1]>L.DEBT[y]+1) {lb++; break;} if(L.LP[y]<0) {lb++;break;} } }
console.log('Kreditpläne mit wachsender Schuld:',lb);
// 4. Inflation 2 %: Kopplung neutral? Rente deterministisch bei m=2
const a=ctx.PP({...P,inf:.02},59), b=ctx.PP({...P,inf:.02},59,new Float64Array(83).fill(.02),new Float64Array(59));
let md=0; for(let y=0;y<59;y++) md=Math.max(md,Math.abs(a.PN[y]-b.PN[y])); console.log('Rente: Pfad mit konstant 2 % vs. Standard, max. Abweichung',md.toFixed(6));
for (const lz2 of [0,.03,.045,.08,.1]) for (const lzb of [0,5,8,30]) for (const lrate of [300,1000,1725,4000]) { const L=ctx.L({...P,lz2,lzb,lrate,inf:.02},59,Infinity); for(let y=0;y<59;y++){ if(L.DEBT[y+1]>L.DEBT[y]+1) {console.log('wächst: lz2',lz2,'lzb',lzb,'rate',lrate,'Jahr',y); break;} } }
const r0=ctx.S({...P,net:0},false); console.log('net0 wmode',P.wmode);
