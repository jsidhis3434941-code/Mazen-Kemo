/* ============ 1) أدوات الأمان والمساعدة ============ */

// اختصار لجلب عنصر من الصفحة
const $=s=>document.querySelector(s);

// [أمان 2] esc: بتحول أي نص لنص آمن قبل ما يتعرض، فمحدش يقدر يحقن كود HTML/JS في اسمك أو في أسماء الأكل
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// [أمان 3] num: بتتأكد إن الرقم فعلا رقم وفي مدى منطقي (مثلا الوزن مش 9999)، وإلا بترجع قيمة افتراضية
const num=(v,min,max,def)=>{v=parseFloat(v);return isFinite(v)?Math.min(max,Math.max(min,v)):def};

// تاريخ النهاردة بصيغة YYYY-MM-DD (مفتاح سجل اليوم)
const today=()=>new Date().toISOString().slice(0,10);

/* ============ 2) التخزين (على جهاز اللاعب فقط) ============ */
const KEY='masar3a_v1';
// الحالة الافتراضية: p=بيانات اللاعب، log=سجل الأيام، w=الأوزان، sw=البدائل المختارة، cf=أكل مضاف
let S={p:null,log:{},w:[],sw:{},cf:[],tab:'home',day:new Date().getDay(),open:null};

// [أمان 4] تحميل البيانات داخل try/catch + فحص الشكل، عشان لو حد لخبط التخزين التطبيق ما يقعش
function load(){try{const r=JSON.parse(localStorage.getItem(KEY)||'null');
 if(r&&typeof r==='object'){S.log=r.log&&typeof r.log==='object'?r.log:{};S.w=Array.isArray(r.w)?r.w.slice(-200):[];
 S.sw=r.sw&&typeof r.sw==='object'?r.sw:{};S.cf=Array.isArray(r.cf)?r.cf.slice(0,100):[];
 if(r.p&&typeof r.p==='object')S.p=clean(r.p);}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({p:S.p,log:S.log,w:S.w,sw:S.sw,cf:S.cf}))}catch(e){}}

// تنظيف بيانات اللاعب: كل حقل بيتفحص ويتحدد له مدى
function clean(p){return{name:String(p.name||'').slice(0,30),age:num(p.age,10,70,18),h:num(p.h,120,230,170),w:num(p.w,30,200,70),
 tw:num(p.tw,30,200,70),male:p.male!==false,goal:['lose','gain','keep','cut'].includes(p.goal)?p.goal:'keep',
 act:num(p.act,1.2,1.9,1.55),allergy:String(p.allergy||'').slice(0,60),bottle:num(p.bottle,200,2000,500)}}

/* ============ 3) قاعدة الأكل (لكل 100 جرام) ============ */
// cat: P=بروتين، C=كارب، S=سناك. k=سعرات، p=بروتين، c=كارب، f=دهون
const FOODS=[
{id:'chk',n:'صدور فراخ',k:165,p:31,c:0,f:3.6,cat:'P'},{id:'tun',n:'تونة',k:116,p:26,c:0,f:1,cat:'P'},
{id:'egg',n:'بيض',k:143,p:13,c:1,f:10,cat:'P'},{id:'bef',n:'لحمة قليلة الدهن',k:210,p:26,c:0,f:12,cat:'P'},
{id:'fsh',n:'سمك مشوي',k:120,p:22,c:0,f:3,cat:'P'},
{id:'ric',n:'رز مطبوخ',k:130,p:2.7,c:28,f:.3,cat:'C'},{id:'oat',n:'شوفان',k:380,p:13,c:66,f:7,cat:'C'},
{id:'brd',n:'عيش بلدي',k:265,p:9,c:49,f:3,cat:'C'},{id:'pot',n:'بطاطس مسلوقة',k:77,p:2,c:17,f:.1,cat:'C'},
{id:'pas',n:'مكرونة مسلوقة',k:158,p:6,c:31,f:1,cat:'C'},
{id:'ban',n:'موز',k:89,p:1,c:23,f:.3,cat:'S'},{id:'nut',n:'مكسرات',k:600,p:20,c:20,f:50,cat:'S'},
{id:'yog',n:'زبادي يوناني',k:60,p:10,c:4,f:.4,cat:'S'},{id:'dat',n:'تمر',k:280,p:2,c:75,f:0,cat:'S'}];
const allFoods=()=>FOODS.concat(S.cf);

// الوجبات الخمس: ساعة الأكل + نسبة من سعرات اليوم + مكوناتها
const MEALS=[{k:'b',t:'الفطار',h:'8:00',r:.25,i:['P','C']},{k:'s1',t:'سناك',h:'11:00',r:.10,i:['S']},
{k:'l',t:'الغدا',h:'14:00',r:.30,i:['P','C']},{k:'s2',t:'سناك',h:'17:00',r:.10,i:['S']},{k:'d',t:'العشا',h:'20:00',r:.25,i:['P','C']}];
const DAYS=['الأحد','الاتنين','التلات','الأربع','الخميس','الجمعة','السبت'];
// أيام التمرين: 4 أيام في الأسبوع (الأحد/التلات/الخميس/السبت) والباقي راحة
const TD=[0,2,4,6];

/* ============ 4) الحسابات الذكية ============ */
// BMI + BMR (معادلة Mifflin-St Jeor) + السعرات + الماكروز
function calc(p){
 const bmi=p.w/Math.pow(p.h/100,2);
 const bmr=10*p.w+6.25*p.h-5*p.age+(p.male?5:-161);
 const adj={lose:-.2,gain:.15,keep:0,cut:-.25}[p.goal];
 const kcal=bmr*p.act*(1+adj);
 const prot=p.w*2.2, fat=p.w*.9, carb=Math.max(50,(kcal-prot*4-fat*9)/4);
 return{bmi,bmr,kcal,prot,fat,carb,water:p.w*35};
}
// يوم تمرين = سعرات أعلى 8% وكارب أكتر، يوم راحة = أقل 8%
const dayK=(c,d)=>c.kcal*(TD.includes(d)?1.08:.92);

// يبني خطة يوم كامل: لكل وجبة مكوناتها بالجرامات من نفس سعرات الوجبة
function plan(d){
 const c=calc(S.p),K=dayK(c,d),list=allFoods(),bad=S.p.allergy.trim();
 return MEALS.map((m,mi)=>({m,items:m.i.map((cat,ii)=>{
  // نستبعد أي أكل اسمه مكتوب في خانة الحساسية
  const pool=list.filter(f=>f.cat===cat&&!(bad&&f.n.includes(bad)));
  const key=d+'-'+mi+'-'+ii, chosen=pool.find(f=>f.id===S.sw[key]);
  const f=chosen||pool[(d+mi)%pool.length];
  const share=m.i.length===1?1:(ii===0?.45:.55), kc=K*m.r*share;
  const g=Math.max(5,Math.round(kc/f.k*100/5)*5), x=g/100;
  return{f,g,key,cat,pool,k:Math.round(f.k*x),p:Math.round(f.p*x),c:Math.round(f.c*x)};
 })}));
}

// نقاط: يوم مكتمل +100، يوم ناقص -20
function done(d){const l=S.log[d];if(!l)return false;const c=calc(S.p);
 return Object.keys(l.m||{}).length>=5&&(l.w||0)>=Math.ceil(c.water/S.p.bottle)&&(l.s||0)>=7}
function points(){let t=0;for(const d in S.log)t+=done(d)?100:(d<today()?-20:0);return t}
const tl=()=>(S.log[today()]=S.log[today()]||{m:{},w:0,s:0});

/* ============ 5) مكونات الشكل ============ */
// دايرة نسبة مئوية (SVG)
function ring(pct,label){const r=40,c=2*Math.PI*r,v=Math.min(1,pct);
 return `<div><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="${r}" fill="none" stroke="#2a2a2a" stroke-width="10"/>
 <circle cx="50" cy="50" r="${r}" fill="none" stroke="#e10600" stroke-width="10" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-v)}" transform="rotate(-90 50 50)"/>
 <text x="50" y="57" text-anchor="middle" fill="#fff" font-size="22" font-weight="800">${Math.round(v*100)}%</text></svg><div>${label}</div></div>`}

/* ============ 6) الشاشات ============ */
// شاشة التسجيل الذكي (Onboarding)
function onb(){return `<h1>MASAR<b>3</b>A</h1><p class="mut">سجّل بياناتك مرة واحدة، والتطبيق يحسب كل حاجة.</p><div class="card">
<label>الاسم</label><input id="n" maxlength="30"><label>السن</label><input id="a" type="number" inputmode="numeric">
<label>النوع</label><select id="g"><option value="1">ذكر</option><option value="0">أنثى</option></select>
<label>الطول (سم)</label><input id="h" type="number" inputmode="numeric"><label>الوزن الحالي (كجم)</label><input id="w" type="number" inputmode="decimal">
<label>الوزن المستهدف (كجم)</label><input id="tw" type="number" inputmode="decimal">
<label>الهدف</label><select id="go"><option value="lose">تخسيس</option><option value="gain">تضخيم</option><option value="keep">تثبيت وزن</option><option value="cut">تنشيف قبل بطولة</option></select>
<label>مستوى النشاط</label><select id="ac"><option value="1.375">خفيف</option><option value="1.55" selected>متوسط</option><option value="1.725">عالي</option><option value="1.9">عالي جدا</option></select>
<label>حساسية من أكل معين؟ (اكتب اسمه)</label><input id="al" maxlength="60">
<label>الازازة اللي بتشرب بيها (مل)</label><input id="bt" type="number" value="500" inputmode="numeric">
<button onclick="reg()" style="width:100%">ابدأ</button></div>`}

// حفظ بيانات التسجيل بعد تنظيفها
function reg(){S.p=clean({name:$('#n').value,age:$('#a').value,male:$('#g').value==='1',h:$('#h').value,w:$('#w').value,tw:$('#tw').value,
 goal:$('#go').value,act:$('#ac').value,allergy:$('#al').value,bottle:$('#bt').value});S.w.push({d:today(),w:S.p.w});save();R()}

// الرئيسية: 3 دواير + النقاط + ملخص الحسابات
function home(){const c=calc(S.p),l=tl(),nb=Math.ceil(c.water/S.p.bottle);
 return `<h1>أهلا ${esc(S.p.name||'يا بطل')} <b>●</b></h1><p class="mut">${DAYS[new Date().getDay()]} — ${TD.includes(new Date().getDay())?'يوم تمرين':'يوم راحة'}</p>
 <div class="card rings">${ring(Object.keys(l.m).length/5,'الأكل')}${ring(l.w/nb,'المياه')}${ring(l.s/8,'النوم')}</div>
 <div class="card row"><div><div class="mut">نقاطك</div><div class="big">${points()}</div></div><div class="mut">كمّل اليوم كله = 100 نقطة</div></div>
 <div class="card"><div class="row"><span>BMI</span><b>${c.bmi.toFixed(1)}</b></div><div class="row"><span>BMR</span><b>${Math.round(c.bmr)} سعر</b></div>
 <div class="row"><span>سعرات اليوم</span><b>${Math.round(dayK(c,new Date().getDay()))}</b></div>
 <div class="row"><span>بروتين / كارب / دهون</span><b>${Math.round(c.prot)} / ${Math.round(c.carb)} / ${Math.round(c.fat)} جم</b></div></div>`}

// الخطة الأسبوعية + زر "ما عنديش ده" بـ 3 بدائل
function meals(){const d=S.day,pl=plan(d),l=tl(),isT=d===new Date().getDay();
 let h=`<h2>خطة الأسبوع</h2><div class="chips">${DAYS.map((n,i)=>`<div class="chip ${i===d?'on':''}" onclick="S.day=${i};R()">${n}</div>`).join('')}</div>
 <p class="mut">${TD.includes(d)?'يوم تمرين: كارب وبروتين أعلى':'يوم راحة: كارب أقل'}</p>`;
 pl.forEach(x=>{const chk=isT&&l.m[x.m.k];
  h+=`<div class="card"><div class="row"><b>${x.m.t} — ${x.m.h}</b>${isT?`<button class="sm ${chk?'':'g'}" onclick="tg('${x.m.k}')">${chk?'تم ✓':'خلصت'}</button>`:''}</div>`;
  x.items.forEach(it=>{h+=`<div class="row" style="margin-top:8px"><span>${esc(it.f.n)} <span class="tag">${it.g} جم</span></span><span class="mut">${it.k} سعر · ${it.p} بروتين</span></div>
  <button class="sm g" onclick="S.open=S.open==='${it.key}'?null:'${it.key}';R()">ما عنديش ده</button>`;
  if(S.open===it.key){h+=`<div class="chips" style="margin-top:6px">${it.pool.filter(f=>f.id!==it.f.id).slice(0,3).map(f=>`<div class="chip" onclick="sw('${it.key}','${esc(f.id)}')">${esc(f.n)} (${Math.round(it.k/f.k*100/5)*5} جم)</div>`).join('')}</div>`}});
  h+='</div>'});return h}
const tg=k=>{const l=tl();l.m[k]?delete l.m[k]:l.m[k]=1;save();R()};
const sw=(k,id)=>{S.sw[k]=id;S.open=null;save();R()};

// المياه: الازايز بتتملي بالضغط
function water(){const c=calc(S.p),l=tl(),nb=Math.ceil(c.water/S.p.bottle)+(TD.includes(new Date().getDay())?1:0);
 let b='';for(let i=0;i<nb;i++)b+=`<span class="bottle ${i<l.w?'f':''}" onclick="wt(${i})"></span>`;
 return `<h2>المياه</h2><div class="card"><p>اشرب <b>${nb}</b> ازايز من بتاعتك الـ ${S.p.bottle} مل</p><div>${b}</div>
 <p class="mut">اتشرب ${l.w} من ${nb} · منبه كل ساعتين</p><button class="g" onclick="rem()">فعّل التنبيهات</button></div>`}
const wt=i=>{const l=tl();l.w=l.w===i+1?i:i+1;save();R()};
// تنبيه كل ساعتين طول ما التطبيق مفتوح (الإشعارات الحقيقية في الخلفية محتاجة سيرفر)
function rem(){try{Notification.requestPermission().then(p=>{if(p==='granted')setInterval(()=>new Notification('MASAR3A','يلا اشرب ازازة 💧'),7200000)})}catch(e){alert('المتصفح مش بيدعم التنبيهات')}}

// التمرين: قبل / أثناء / بعد
function train(){const d=new Date().getDay(),t=TD.includes(d),w=S.p.w;
 if(!t)return `<h2>التمرين</h2><div class="card">النهاردة يوم راحة. الأكل أقل كارب، ركز على النوم والمياه.</div>`;
 return `<h2>تمرين النهاردة (3 ساعات)</h2><div class="card"><b>قبل التمرين</b><p>موز + قهوة، قبل التمرين بساعتين.</p></div>
 <div class="card"><b>أثناء التمرين</b><p>اشرب ${Math.round(w*3.5)} مل مياه كل نص ساعة.</p></div>
 <div class="card"><b>بعد التمرين (خلال 45 دقيقة)</b><p>وجبة استشفاء: ${Math.round(w*.4)} جم بروتين + ${Math.round(w*.8)} جم كارب سريع.</p></div>`}

// النوم: وقت النوم المقترح + تخفيف الشدة لو نمت قليل
function sleep(){const l=tl(),low=l.s>0&&l.s<7;
 return `<h2>النوم والاستشفاء</h2><div class="card"><p>نام <b>11:00</b> واصحى <b>7:00</b> = 8 ساعات.</p>
 <label>نمت كام ساعة امبارح؟</label><input id="sl" type="number" step="0.5" value="${l.s||''}" inputmode="decimal"><button onclick="ss()">سجّل</button>
 ${low?`<p style="color:#ff6b6b">نمت قليل. خفف شدة التمرين 20% النهاردة وزود المياه.</p>`:''}</div>`}
const ss=()=>{tl().s=num($('#sl').value,0,16,0);save();R()};

// المزيد: قائمة التسوق + تتبع الوزن + إدارة الأكل
function more(){
 // قائمة التسوق: نجمع جرامات كل صنف في 7 أيام
 const tot={};for(let d=0;d<7;d++)plan(d).forEach(x=>x.items.forEach(i=>tot[i.f.n]=(tot[i.f.n]||0)+i.g));
 const sh=Object.entries(tot).map(([n,g])=>`<div class="row"><span>${esc(n)}</span><b>${g>=1000?(g/1000).toFixed(1)+' كجم':g+' جم'}</b></div>`).join('');
 // رسم بياني للوزن (SVG)
 const ws=S.w.map(x=>x.w),mn=Math.min(...ws)-1,mx=Math.max(...ws)+1;
 const pts=ws.map((v,i)=>`${ws.length<2?150:i*300/(ws.length-1)},${100-(v-mn)/(mx-mn)*90}`).join(' ');
 return `<h2>قائمة التسوق الأسبوعية</h2><div class="card">${sh}</div>
 <h2>تتبع الوزن</h2><div class="card"><svg viewBox="0 0 300 100" style="width:100%"><polyline points="${pts}" fill="none" stroke="#e10600" stroke-width="3"/></svg>
 <label>وزنك الأحد ده (كجم)</label><input id="nw" type="number" step="0.1" inputmode="decimal"><button onclick="aw()">سجّل الوزن</button></div>
 <h2>إضافة أكل (لوحة التحكم)</h2><div class="card"><label>الاسم</label><input id="fn" maxlength="30"><label>سعرات / بروتين / كارب / دهون (لكل 100 جم)</label>
 <div class="row"><input id="fk" placeholder="سعرات" style="width:23%"><input id="fp" placeholder="بروتين" style="width:23%"><input id="fc" placeholder="كارب" style="width:23%"><input id="ff" placeholder="دهون" style="width:23%"></div>
 <label>النوع</label><select id="fcat"><option value="P">بروتين</option><option value="C">كارب</option><option value="S">سناك</option></select>
 <button onclick="af()">أضف</button><p class="mut">مضاف: ${S.cf.length} صنف</p></div>
 <button class="g" onclick="if(confirm('مسح كل البيانات؟')){localStorage.removeItem('${KEY}');location.reload()}">مسح بياناتي</button>`}
const aw=()=>{S.w.push({d:today(),w:num($('#nw').value,30,200,S.p.w)});save();R()};
const af=()=>{const n=$('#fn').value.trim().slice(0,30);if(!n)return;
 S.cf.push({id:'c'+Date.now(),n,k:num($('#fk').value,0,900,100),p:num($('#fp').value,0,100,0),c:num($('#fc').value,0,100,0),f:num($('#ff').value,0,100,0),cat:$('#fcat').value});save();R()};

/* ============ 7) الرسم والتنقل ============ */
const TABS={home,meals,water,train,sleep,more};
const NAV=[['home','🏠','الرئيسية'],['meals','🍗','الأكل'],['water','💧','مياه'],['train','🥊','تمرين'],['sleep','😴','نوم'],['more','☰','المزيد']];
function R(){const a=$('#app');
 if(!S.p){a.innerHTML=onb();$('nav')&&$('nav').remove();return}
 a.innerHTML=TABS[S.tab]();
 // شريط التنقل السفلي
 let n=$('nav');if(!n){n=document.createElement('nav');document.body.appendChild(n)}
 n.innerHTML=NAV.map(x=>`<button class="${S.tab===x[0]?'on':''}" onclick="S.tab='${x[0]}';R();scrollTo(0,0)"><span>${x[1]}</span>${x[2]}</button>`).join('')}
load();R();