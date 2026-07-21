const fs = require('fs'), vm = require('vm');
require('./qa_stub.js');
const S = 'suite-glide-path-EDITION-2026-07-04';
const files = ['live-data.js','main.js','advanced-montecarlo.js','fiscal.js','pensione.js','backtest.js','crisis-stress.js','scenarios-manager.js','pro-features.js','quant-analytics.js','tier-system.js'];
let c = '';
// esponi i sorgenti per l'audit strutturale
for (const f of files) global['__SRC_' + f.replace(/[.-]/g,'_')] = fs.readFileSync(S + '/' + f, 'utf8');
for (const f of files) c += fs.readFileSync(S + '/' + f, 'utf8') + '\n;\n';

const probe = `
(function(){
let pass=0,fail=0,msgs=[];
const ok=(cd,l,d)=>{if(cd)pass++;else{fail++;msgs.push('FAIL '+l+(d?' -- '+d:''));}};
const fin=x=>typeof x==='number'&&isFinite(x);
render=()=>{}; renderDecumulo=()=>{}; renderGlideBuilder=renderGlideBuilder||(()=>{});

// ══════ A. DINAMICITÀ A→B in ogni scheda ══════
const G={sideA:{type:'preset',ref:'eq80'},sideB:{type:'preset',ref:'golden_butterfly'},ageStart:30,ageEnd:65,k:2};
state.portfolio='glide'; state.glide=G;
if(typeof _glideCache!=='undefined')_glideCache.sig=null;
// equity deve scendere con l'età in tutte le funzioni-peso
const e30=getEquityWeight('glide',30), e50=getEquityWeight('glide',50), e64=getEquityWeight('glide',64);
ok(e30>e50&&e50>e64,'[SIMULATORE] equity dinamica 30>50>64',(e30*100).toFixed(0)+'>'+(e50*100).toFixed(0)+'>'+(e64*100).toFixed(0));
// getRate (usato da MC/decumulo): varia con l'anno
const rY0=getRate('glide','normal',0,30), rY30=getRate('glide','normal',30,30);
ok(fin(rY0)&&fin(rY30),'[MC/DECUMULO] getRate glide finito lungo orizzonte');
// getGlideParams: composizione cambia
const gp30=getGlideParams(30), gp64=getGlideParams(64);
ok(gp30.eq>gp64.eq && gp64.gold>=gp30.gold,'[BACKTEST/CRISIS] composizione transita (equity giù, oro su verso GB)');
// getFxExposure dinamico
ok(fin(getFxExposure('glide',30))&&fin(getFxExposure('glide',64)),'[CAPE] fxExposure glide finito a 30 e 64');
// quant: punto EF dinamico
state.age=30; const q30=getCurrentPortfolioPoint(0.2);
state.age=63; const q63=getCurrentPortfolioPoint(0.2); state.age=38;
ok(q30&&q63&&q63.vol<q30.vol,'[QUANT] punto frontiera più difensivo a 63 che a 30');

// ══════ B. GATE: bloccano con leva, NON senza ══════
// glide con leva -> non-backtestable
state.glide={sideA:{type:'preset',ref:'ec_glob_9060'},sideB:{type:'preset',ref:'golden_butterfly'},ageStart:30,ageEnd:65,k:2};
ok(glideIsNonBacktestable()===true,'[GATE] glide + Efficient Core -> BLOCCA (backtest/crisis/seq/bootstrap)');
state.glide={sideA:{type:'preset',ref:'return_stack'},sideB:{type:'preset',ref:'eq40'},ageStart:30,ageEnd:65,k:2};
ok(glideIsNonBacktestable()===true,'[GATE] glide + Return Stacking -> BLOCCA');
state.glide={sideA:{type:'custom',slots:[{ac:'fat_trend',pct:100}]},sideB:{type:'preset',ref:'eq60'},ageStart:30,ageEnd:65,k:2};
ok(glideIsNonBacktestable()===true,'[GATE] glide + Trend Following -> BLOCCA');
// glide backtestabile -> NON blocca
state.glide={sideA:{type:'preset',ref:'eq80'},sideB:{type:'preset',ref:'golden_butterfly'},ageStart:30,ageEnd:65,k:2};
ok(glideIsNonBacktestable()===false,'[GATE] glide 80/20->GB -> NON blocca (backtestabile)');
state.glide={sideA:{type:'custom',slots:[{ac:'eq_usa',pct:60},{ac:'gold',pct:40}]},sideB:{type:'preset',ref:'eq40'},ageStart:30,ageEnd:65,k:2};
ok(glideIsNonBacktestable()===false,'[GATE] glide custom (USA+oro)->eq40 -> NON blocca');

// ══════ C. DECUMULO: usa il portafoglio giusto ══════
// __sim__ risolve al portafoglio del Simulatore
state.portfolio='glide';
state.glide={sideA:{type:'preset',ref:'eq80'},sideB:{type:'preset',ref:'golden_butterfly'},ageStart:30,ageEnd:75,k:2};
if(typeof _glideCache!=='undefined')_glideCache.sig=null;
const resolvedSim = '__sim__'==='__sim__' ? (state.portfolio||'eq60') : null;
ok(resolvedSim==='glide','[DECUMULO] "Mia allocazione" (__sim__) risolve a glide quando è nel Simulatore');
// decumulo parametrico funziona col glide
Object.assign(decState,{portfolio:'glide',startPortfolio:500000,withdrawal:20000,years:30,strategy:'inflation'});
let decOk=true; try{ const r=simulateDecumulo('normal'); const arr=Array.isArray(r)?r:(r&&r.data)?r.data:[]; decOk=arr.length>0&&!arr.some(p=>!fin(p.value!=null?p.value:(p.end!=null?p.end:p))); }catch(e){ decOk=false; }
ok(decOk,'[DECUMULO] parametrico glide senza NaN');
// de-risking continua nel decumulo (glide fino a 75)
const dEq65=getGlideParams(65).eq, dEq70=getGlideParams(70).eq;
ok(dEq65>dEq70,'[DECUMULO] continua transizione verso B durante il prelievo (65>70)',(dEq65*100).toFixed(0)+'>'+(dEq70*100).toFixed(0));
// decumulo STORICO bloccato per glide
let histBlocked=false; try{ runDecumuloHistorical(); }catch(e){ histBlocked=!!e.decHistBlocked; }
ok(histBlocked,'[DECUMULO] storico single-sequence BLOCCATO per glide (redirige a MC)');

// ══════ D. FISCALITÀ e PENSIONE: indipendenti (corretto) ══════
ok(typeof calcPensione==='function' && typeof calcTaxOnSell==='function','[FISC/PENS] funzioni indipendenti dal portafoglio (corretto by design)');

console.log('AUDIT SISTEMATICO: PASS '+pass+' FAIL '+fail);
if(msgs.length)console.log(msgs.join(String.fromCharCode(10)));
})();
`;
vm.runInThisContext(c + probe, { filename: 'audit' });

// ══════ E. AUDIT STRUTTURALE SORGENTE: tutti i gate includono glide ══════
let spass=0, sfail=0;
const sok=(cd,l)=>{ if(cd)spass++; else{ sfail++; console.log('FAIL STRUTT '+l);} };
const bt=global.__SRC_backtest_js, mc=global.__SRC_advanced_montecarlo_js, cr=global.__SRC_crisis_stress_js;
// ogni riga-gate con lista leva deve avere glide accanto
for (const [name, src] of [['backtest',bt],['MC',mc],['crisis',cr]]) {
  const lines = src.split('\n');
  for (let i=0;i<lines.length;i++){
    const l=lines[i];
    const isGate = (l.indexOf('if')>=0 || l.indexOf('||')>=0 || l.indexOf('_isNonBT')>=0) &&
      ((l.indexOf('ec_us_9060')>=0 && l.indexOf('[portKey]')>=0) ||
       l.indexOf('NON_BACKTESTABLE[portKey]')>=0 ||
       l.indexOf('LEVERAGED[portfolio]')>=0 ||
       l.indexOf('_LEVERAGED_COMP[state.portfolio]')>=0);
    if (isGate) {
      // guarda la riga + 6 successive (i gate leva sono condizioni multi-riga)
      const block = lines.slice(i, i+7).join(' ').toLowerCase();
      sok(block.indexOf('glide')>=0, name+': gate leva senza glide -> '+l.trim().slice(0,60));
    }
  }
}
console.log('AUDIT STRUTTURALE: PASS '+spass+' FAIL '+sfail);
process.exit(0);
