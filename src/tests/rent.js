const fs=require('fs');const ctx={};new Function('ctx',fs.readFileSync('engine.js','utf8')+';ctx.S=simulate;ctx.RL=rentalLoan;ctx.RF=rentalFlows;ctx.PP=pensionPlan;ctx.PXT=PXT')(ctx);
const P=JSON.parse(fs.readFileSync('tests/params.json')); if(P.dcap==null)P.dcap=Infinity;
const V={re:.05,rb:.0275,rc:.01,rgo:.025};
const R={rOn:true,rv:300000,rdebt:200000,rlz:.035,rlzb:10,rlz2:.045,rrate:1000,rrent:1100,rkost:190,rafaE:4200,rvac:.04,rmg:.02,rhg:0,rbuyY:2020,rtax:.35,rSaleAge:0};
const q={...P,...R}, Y=q.age1-q.age0, RY=q.retAge-q.age0;
const L=ctx.RL(q,Y,Infinity); const ones=new Float64Array(Y+1).fill(1); ctx.PP(q,Y);
const out=new Float64Array(Y); const det=ctx.RF(q,Y,L,Infinity,ones,ones,ctx.PXT,RY,out);
const r=x=>Math.round(x);
console.log('Jahr 1 pro Monat:',JSON.stringify(Object.fromEntries(Object.entries(det.first).map(([k,v])=>[k,r(v)]))));
console.log('Kredit abbezahlt nach',L.payoff.toFixed(1),'Jahren (Alter',(q.age0+L.payoff).toFixed(1)+')','| danach:',JSON.stringify(Object.fromEntries(Object.entries(det.after||{}).map(([k,v])=>[k,r(v)]))));
console.log('Zufluss pro Monat in ausgewählten Jahren:',[0,5,10,20,25,31,40].map(y=>(q.age0+y)+': '+r(out[y]/12)).join(' | '));
const s=x=>(ctx.S(x,true).success*100).toFixed(1);
console.log('Erfolg ohne / mit Immobilie: Eher schwach',s({...P,...V}),'/',s({...q,...V}),' | Wie früher',s(P),'/',s(q));
console.log('Verkauf mit 67:',s({...q,...V,rSaleAge:67}),'/',s({...q,rSaleAge:67}));
const f=ctx.S({...q},false); const med=a=>{const t=Float64Array.from(a).sort();return t[Math.floor(t.length/2)]}; 
const N=f.totR.length/(Y+1); console.log('Netto-Vermögen mit 67 typisch (real):', r(med(f.netR.slice(RY*N,(RY+1)*N))),'Depot', r(med(f.totR.slice(RY*N,(RY+1)*N))));
const mono=[['Miete',{rrent:900},{rrent:1300},1],['Kosten',{rkost:100},{rkost:300},-1],['AfA',{rafaE:2000},{rafaE:6000},1],['Restschuld',{rdebt:100000},{rdebt:250000},-1],['Zins',{rlz:.02},{rlz:.05},-1],['Leerstand',{rvac:0},{rvac:.1},-1],['Grenzsteuer',{rtax:.25},{rtax:.45},0],["Mietsteigerung",{rmg:.01},{rmg:.03},1]];
for (const [n,a,b,d] of mono){const x=ctx.S({...q,...V,...a},true).success*100,y=ctx.S({...q,...V,...b},true).success*100; console.log(n.padEnd(15),x.toFixed(1),'->',y.toFixed(1), d>0?(y>=x-0.5?'ok':'FALSCH'):d<0?(y<=x+0.5?'ok':'FALSCH'):'(Richtung offen)');}
for (const ex of [{rdebt:0,rrate:0},{rrent:0},{rv:0,rdebt:0,rrate:0,rrent:0},{rSaleAge:40},{rSaleAge:40,rbuyY:2024},{rrate:300},{retAge:60,pAge:67},{pOn:false},{rafaE:0},{rbuyY:1960}]) { const r=ctx.S({...q,...ex},false); const bad=[...r.totR].some(v=>!isFinite(v))||!(r.success>=0); console.log(JSON.stringify(ex), (r.success*100).toFixed(1), bad?'NaN!':''); }
console.log('leer, ohne Kaufpreis:', (ctx.S({...q,rv:0,rdebt:0,rrate:0,rrent:0,rbuy:0},true).success*100).toFixed(1), 'vs ohne Immobilie', (ctx.S(P,true).success*100).toFixed(1));
