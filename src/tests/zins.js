const fs=require('fs');
const load=f=>{const c={};new Function('ctx',fs.readFileSync(f,'utf8')+';ctx.S=simulate;ctx.G=genPath;ctx.RB=RB;ctx.RC=RC;ctx.RE=RE;ctx.DEV=typeof DEV!="undefined"?DEV:null;ctx.BZY=typeof BZY!="undefined"?BZY:null;ctx.IN=IN;ctx.LP=loanPlan;')(c);return c;};
const A=load('engine_alt.js'), B=load('engine.js');
const P=JSON.parse(fs.readFileSync('tests/params.json')); if(P.dcap==null)P.dcap=Infinity;
console.log('model',P.model,'home',P.home,'debt',P.debt,'lzb',P.lzb,'bz',P.bz,'rb',P.rb,'vb',P.vb);
const V={re:.05,rb:.0275,rc:.01,rgo:.025};
const H={home:true,debt:460000,lshare:.5,hshare:.5,lz:.0299,lrate:1725,lsond:5000,hv:640000,hg:0,lzb:8,lz2:.045,fp:.5};
const s=(c,x)=>(c.S(x,true).success*100).toFixed(1);
for (const [n,x] of [['Standard',P],['Eher schwach',{...P,...V}],['mit Haus',{...P,...H}],['Haus schwach',{...P,...H,...V}],['einfaches Modell',{...P,model:'s'}],['Stress Inflation',{...P,stress:'infl'}],['Stress 2022',{...P,stress:'c22'}]]) console.log(n.padEnd(18),'alt',s(A,x),'neu',s(B,x));
// Statistik Anleihen/Zins
const st=(c,x)=>{const Y=50;let rb=[],dv=[],rc=[],bz=[];for(let i=0;i<2000;i++){c.G(x,i,Y);for(let y=0;y<Y;y++){rb.push(c.RB[y]);rc.push(c.RC[y]);if(c.DEV)dv.push(c.DEV[y]);if(c.BZY)bz.push(c.BZY[y]);}}
 const m=a=>a.reduce((s,v)=>s+v,0)/a.length, sd=a=>{const mu=m(a);return Math.sqrt(a.reduce((s,v)=>s+(v-mu)**2,0)/a.length)}, q=(a,p)=>{const t=[...a].sort((x,y)=>x-y);return t[Math.floor(p*(t.length-1))]};
 return `Anleihen Ø ${(m(rb)*100).toFixed(2)} sd ${(sd(rb)*100).toFixed(2)} | Geldmarkt Ø ${(m(rc)*100).toFixed(2)} sd ${(sd(rc)*100).toFixed(2)}`+(dv.length?` | Zinsabw. sd ${(sd(dv)*100).toFixed(2)} 5%/95% ${(q(dv,.05)*100).toFixed(1)}/${(q(dv,.95)*100).toFixed(1)} | Basiszins 5/50/95 ${(q(bz,.05)*100).toFixed(1)}/${(q(bz,.5)*100).toFixed(1)}/${(q(bz,.95)*100).toFixed(1)}`:'');};
console.log('alt:',st(A,P)); console.log('neu:',st(B,P));
// Anschlusszins-Verteilung Haus
const Y=59; const rates=[]; for(let i=0;i<2000;i++){B.G({...P,...H},i,Y); const L=B.LP({...P,...H},Y,Infinity,B.DEV); rates.push(L.rate2);} rates.sort((a,b)=>a-b);
console.log('Rate nach Anschluss (Haus, gesamt): 5/50/95 %', [0.05,0.5,0.95].map(q=>Math.round(rates[Math.floor(q*1999)])).join(' / '), '| ohne Pfad', Math.round(B.LP({...P,...H},Y,Infinity).rate2));
{const x={...P,...H},Y=59; const tot=[],pay=[],xp=[]; for(let i=0;i<2000;i++){B.G(x,i,Y); const L=B.LP(x,Y,Infinity,B.DEV); tot.push(L.LP.reduce((s,v)=>s+v,0)); pay.push(L.payoff==null?99:L.payoff); xp.push(Math.max(...L.XP)/12);} 
const q=(a,p)=>{const t=[...a].sort((x,y)=>x-y);return t[Math.floor(p*(t.length-1))]}; const L0=B.LP(x,Y,Infinity);
console.log('Haus: gezahlt gesamt 5/50/95', [.05,.5,.95].map(p=>Math.round(q(tot,p)/1000)+'k').join(' / '),'| ohne Pfad', Math.round(L0.LP.reduce((s,v)=>s+v,0)/1000)+'k', '| abbezahlt nach 5/50/95', [.05,.5,.95].map(p=>q(pay,p).toFixed(1)).join(' / '), 'ohne Pfad', L0.payoff.toFixed(1), '| höchste Mehr-Rate pro Monat 50/95', Math.round(q(xp,.5)), Math.round(q(xp,.95)));}
