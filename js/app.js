const NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s);
const PL={
 canva:{n:'Canva',min:500,max:500,def:500,mb:10,pre:[],tips:['Artboard wajib 500 × 500 px','Ukuran file maks 10 MB (ideal 2–3 MB)','Wajib berupa set / koleksi tematik, ikon satuan ditolak','Wajib JPG preview bernama sama dengan SVG, dikirim via SFTP','Dilarang hairline (stroke < 0.25 pt)','Ditolak: konten AI, logo / merek, dan elemen yang bisa dibuat di editor Canva']},
 adobe:{n:'Adobe Stock',min:1000,max:4800,def:2000,mb:45,pre:[1000,2000,4000,4800],tips:['Artboard 1000–4800 px (rekomendasi 2000 atau 4000)','Ukuran file maks 45 MB, upload SVG langsung (bukan ZIP)','Ikon satuan dan icon sheet diterima','Stroke harus di-expand jadi shape dan teks di-outline','Group berlabel rapi, tanpa raster tertanam','Background transparan: PNG dibuat otomatis oleh Adobe']}
};
const S={p:'adobe',work:null,vb:[0,0,100,100],file:'',size:0,st:{},ab:2000,date:null,groups:[],titleEdited:false};
const GEN=['icon','vector','symbol','flat design','minimal','graphic','illustration','sign','user interface','web design','app','design element','modern','simple','pictogram'];
const SYN={home:['house','building','real estate','property'],user:['person','profile','avatar','account'],search:['magnifier','find','zoom','explore'],mail:['email','envelope','message','inbox'],heart:['love','like','favorite','romance'],star:['rating','favorite','award','review'],cart:['shopping','ecommerce','store','buy'],shopping:['cart','ecommerce','store','retail'],settings:['gear','configuration','options','control'],camera:['photo','photography','lens','picture'],cloud:['weather','storage','upload','sky'],lock:['security','password','privacy','protection'],bell:['notification','alert','alarm','reminder'],calendar:['date','schedule','event','planner'],clock:['time','watch','schedule','timer'],location:['map','pin','gps','navigation'],chart:['graph','statistics','analytics','business'],phone:['call','mobile','smartphone','contact']};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=b=>b>1048576?(b/1048576).toFixed(2)+' MB':Math.max(1,Math.round(b/1024))+' KB';
const slug=()=>(($('#title').value||S.file.replace(/\.svg$/i,'')||'icon').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'icon');
const kwList=()=>$('#kw').value.split(/[,\n]/).map(s=>s.trim()).filter(Boolean);

function col(v){if(!v||v==='none')return'none';if(v.startsWith('url'))return v;const m=v.match(/rgba?\(\s*(\d+)[, ]+(\d+)[, ]+(\d+)/);return m?'#'+[m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,'0')).join(''):v}

/* ---------- stroke → fill ---------- */
function geom(el){
 const g=n=>parseFloat(el.getAttribute(n))||0,t=el.localName;let it;
 if(t==='path')it=new paper.CompoundPath(el.getAttribute('d')||'');
 else if(t==='rect'){const rx=g('rx')||g('ry'),ry=g('ry')||g('rx'),r=new paper.Rectangle(g('x'),g('y'),g('width'),g('height'));it=(rx||ry)?new paper.Path.Rectangle(r,new paper.Size(rx,ry)):new paper.Path.Rectangle(r)}
 else if(t==='circle')it=new paper.Path.Circle(new paper.Point(g('cx'),g('cy')),g('r'));
 else if(t==='ellipse')it=new paper.Path.Ellipse({center:[g('cx'),g('cy')],radius:[g('rx'),g('ry')]});
 else if(t==='line')it=new paper.Path({segments:[[g('x1'),g('y1')],[g('x2'),g('y2')]]});
 else{const n=(el.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number),s=[];for(let i=0;i+1<n.length;i+=2)s.push([n[i],n[i+1]]);it=new paper.Path({segments:s,closed:t==='polygon'})}
 const ps=it.children?it.children:[it];
 const out=ps.map(p=>{p.flatten(S.tol);return{pts:p.segments.map(s=>[s.point.x,s.point.y]),closed:p.closed}});
 it.remove();return out;
}
function outline(el,I){
 const Sc=1000,d=I.sw/2*Sc,C=ClipperLib,sol=new C.Paths();
 const jt=I.join==='round'?C.JoinType.jtRound:I.join==='bevel'?C.JoinType.jtSquare:C.JoinType.jtMiter;
 const o=new C.ClipperOffset(I.ml,Math.max(.25,d*.02));
 geom(el).forEach(g=>{if(g.pts.length<2)return;
  const p=g.pts.map(q=>({X:Math.round(q[0]*Sc),Y:Math.round(q[1]*Sc)}));
  const et=g.closed?C.EndType.etClosedLine:I.cap==='round'?C.EndType.etOpenRound:I.cap==='square'?C.EndType.etOpenSquare:C.EndType.etOpenButt;
  o.AddPath(p,jt,et)});
 o.Execute(sol,d);
 return sol.map(p=>'M'+p.map(q=>(q.X/Sc).toFixed(2)+' '+(q.Y/Sc).toFixed(2)).join('L')+'Z').join('');
}
function convert(svg){
 const st=S.st={strokes:0,dash:0,grad:svg.querySelectorAll('linearGradient,radialGradient').length,raster:svg.querySelectorAll('image').length,text:svg.querySelectorAll('text').length,filter:svg.querySelectorAll('filter').length,minSw:Infinity};
 const shapes=[...svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse')].filter(e=>!e.closest('clipPath,mask,pattern,marker,symbol,defs'));
 const info=shapes.map(el=>{const c=getComputedStyle(el);return{el,hidden:c.display==='none',fill:col(c.fill),fo:c.fillOpacity,fr:c.fillRule,op:c.opacity,stroke:col(c.stroke),sw:parseFloat(c.strokeWidth)||0,so:c.strokeOpacity,cap:c.strokeLinecap,join:c.strokeLinejoin,ml:parseFloat(c.strokeMiterlimit)||4,dash:c.strokeDasharray&&c.strokeDasharray!=='none'}});
 const gs=[...svg.querySelectorAll('g')].map(g=>{const c=getComputedStyle(g);return[g,c.opacity,c.display==='none']});
 const keep=['transform','clip-path','mask','filter'];
 info.forEach(I=>{const el=I.el;
  if(I.hidden){el.remove();return}
  if(I.stroke!=='none'&&I.sw>0){
   if(I.dash)st.dash++;
   st.minSw=Math.min(st.minSw,I.sw);
   const d=outline(el,I);
   if(d){const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('fill',I.stroke);p.setAttribute('fill-rule','evenodd');
    if(+I.so!==1)p.setAttribute('fill-opacity',I.so);if(+I.op!==1)p.setAttribute('opacity',I.op);
    keep.forEach(k=>{if(el.hasAttribute(k))p.setAttribute(k,el.getAttribute(k))});el.after(p);st.strokes++}
  }
  el.setAttribute('fill',I.fill);
  I.fr==='evenodd'?el.setAttribute('fill-rule','evenodd'):el.removeAttribute('fill-rule');
  +I.fo!==1?el.setAttribute('fill-opacity',I.fo):el.removeAttribute('fill-opacity');
  +I.op!==1?el.setAttribute('opacity',I.op):el.removeAttribute('opacity');
 });
 gs.forEach(([g,op,h])=>{if(h)g.remove();else if(+op!==1)g.setAttribute('opacity',op)});
 svg.querySelectorAll('title,desc,metadata,namedview,style').forEach(e=>e.remove());
 svg.querySelectorAll('*').forEach(e=>{['class','style','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','stroke-opacity'].forEach(a=>e.removeAttribute(a))});
 S.groups=[];const m=new Map();
 svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse').forEach(e=>{if(e.closest('clipPath,mask,pattern,marker,symbol,defs'))return;const f=e.getAttribute('fill');if(f&&f[0]==='#'){if(!m.has(f))m.set(f,[]);m.get(f).push(e)}});
 m.forEach((els,hex)=>S.groups.push({els,cur:hex}));
}

/* ---------- build output ---------- */
function build(){
 if(!S.work)return'';
 const A=S.ab,vb=S.vb,pad=Math.min(40,Math.max(0,+$('#pad').value||0))/100,s=Math.min(A*(1-2*pad)/vb[2],A*(1-2*pad)/vb[3]);
 const tx=(A-vb[2]*s)/2-vb[0]*s,ty=(A-vb[3]*s)/2-vb[1]*s,f=n=>+n.toFixed(5);
 const title=esc($('#title').value.trim()||'Untitled'),cr=esc($('#creator').value.trim()),kws=kwList().map(esc);
 const yr=S.date.getFullYear(),rights=esc(`© ${yr} ${$('#holder').value.trim()||$('#creator').value.trim()}. ${$('#lic').value}`);
 const iso=S.date.toISOString(),desc=`${title}. ${kws.join(', ')}`;
 return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: SVG Prep Studio (${PL[S.p].n} ready) -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${A}" height="${A}" viewBox="0 0 ${A} ${A}">
<title>${title}</title>
<desc>${desc}</desc>
<metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#"><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/><dc:title>${title}</dc:title><dc:creator><cc:Agent><dc:title>${cr}</dc:title></cc:Agent></dc:creator><dc:date>${iso}</dc:date><dc:rights><cc:Agent><dc:title>${rights}</dc:title></cc:Agent></dc:rights><dc:description>${desc}</dc:description><dc:subject><rdf:Bag>${kws.map(k=>`<rdf:li>${k}</rdf:li>`).join('')}</rdf:Bag></dc:subject></cc:Work></rdf:RDF></metadata>
<g id="${slug()}" transform="translate(${f(tx)} ${f(ty)}) scale(${f(s)})">
${S.work.innerHTML}
</g>
</svg>`;
}
const uri=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);

/* ---------- UI refresh ---------- */
function refresh(){
 const n=kwList().length;$('#kwcount').textContent=S.work?`(${n}${n<10?' — minimal 10':''})`:'';
 $('#kwcount').style.color=n<10&&S.work?'var(--wn)':'';
 if(!S.work){checks('');return}
 const svg=build();
 $('#prev').innerHTML=`<img alt="preview" src="${uri(svg)}">`;
 $('#pinfo').textContent=`${S.ab} × ${S.ab} px · ${fmt(new Blob([svg]).size)}`;
 checks(svg);
}
function checks(svg){
 const P=PL[S.p],st=S.st,c=[];
 if(!S.work){$('#chk').innerHTML='<li><span class="i n">•</span>Menunggu file…</li>';return}
 const size=new Blob([svg]).size,n=kwList().length;
 c.push([1,'Format .svg (bukan ZIP / JPEG / AI)']);
 c.push([size<=P.mb*1048576?1:0,`Ukuran file ${fmt(size)} (maks ${P.mb} MB${S.p==='canva'?', ideal 2–3 MB':''})`]);
 c.push([S.ab>=P.min&&S.ab<=P.max?1:0,`Artboard ${S.ab} × ${S.ab} px (aturan ${P.min===P.max?P.min:P.min+'–'+P.max} px)`]);
 c.push([1,`Stroke dikonversi ke shape: ${st.strokes} elemen`]);
 if(st.dash)c.push([0,`${st.dash} stroke putus-putus: pola dash tidak ikut dikonversi, cek hasilnya`]);
 c.push([st.text?0:1,st.text?`${st.text} elemen teks belum di-outline. Ubah teks ke path (Illustrator: Create Outlines) lalu upload ulang`:'Tidak ada teks hidup']);
 c.push([st.raster?0:1,st.raster?`${st.raster} gambar raster tertanam. Hapus sebelum upload`:'Tidak ada raster tertanam']);
 if(st.grad||st.filter)c.push([S.p==='canva'?0:2,`Ada ${st.grad} gradient / ${st.filter} filter. ${S.p==='canva'?'Canva menolak gradient / efek yang tidak perlu':'Pastikan tampil benar di aplikasi lain'}`]);
 c.push([$('#title').value.trim()&&$('#creator').value.trim()?1:0,'Judul dan creator terisi']);
 c.push([n>=10?1:0,`Keyword ${n} (minimal 10)`]);
 c.push([1,`Group berlabel: <g id="${slug()}">`]);
 if(S.p==='canva'){
  const px=st.minSw*(S.ab/Math.max(S.vb[2],S.vb[3]))*(1-2*(+$('#pad').value||0)/100);
  if(isFinite(px)&&px<0.34)c.push([0,'Garis terlalu tipis (di bawah 0.25 pt / hairline). Tebalkan stroke']);
  c.push([2,'Canva: ikon harus berupa set tematik, bukan satuan, dan bukan hasil AI']);
  c.push([2,'Canva: unduh JPG preview, namanya harus sama dengan SVG, kirim via SFTP']);
 }else c.push([2,'Adobe Stock: tandai file sebagai ikon saat upload di Contributor Portal']);
 $('#chk').innerHTML=c.map(([s,t])=>`<li><span class="i ${s===1?'g':s===0?'w':'n'}">${s===1?'✓':s===0?'⚠':'ℹ'}</span><span>${esc(t)}</span></li>`).join('');
}
function renderColors(){
 const box=$('#cols');box.innerHTML='';
 if(!S.groups.length){box.innerHTML='<span class="hint">Tidak ada warna solid yang bisa diubah.</span>';return}
 S.groups.forEach(g=>{const w=document.createElement('label');w.className='sw';w.style.margin='0';
  const i=document.createElement('input');i.type='color';i.value=/^#[0-9a-f]{6}$/i.test(g.cur)?g.cur:'#000000';
  i.oninput=()=>{g.cur=i.value;g.els.forEach(e=>e.setAttribute('fill',i.value));t.textContent=i.value;refresh()};
  const t=document.createElement('span');t.textContent=g.cur;w.append(i,t);box.append(w)});
}
function setPlatform(p){
 S.p=p;const P=PL[p];
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
 $('#ptitle').textContent='Ketentuan '+P.n;$('#tips').innerHTML=P.tips.map(t=>`<li>${esc(t)}</li>`).join('');
 S.ab=P.def;const ab=$('#ab');ab.value=S.ab;ab.min=P.min;ab.max=P.max;ab.disabled=P.min===P.max;
 $('#abhint').textContent=P.min===P.max?'Terkunci sesuai aturan Canva':`Boleh ${P.min}–${P.max} px`;
 $('#presets').innerHTML='';P.pre.forEach(v=>{const b=document.createElement('button');b.className='btn';b.textContent=v;b.onclick=()=>{S.ab=v;ab.value=v;refresh()};$('#presets').append(b)});
 $('#dljpg').hidden=p!=='canva';refresh();
}

/* ---------- keywords ---------- */
function localKw(){
 const w=(($('#title').value||'')+' '+S.file.replace(/\.svg$/i,'')).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2&&!['the','and','icon','svg','vector','copy','final','new','file','untitled'].includes(x));
 const out=[],add=k=>{if(k&&!out.includes(k))out.push(k)};
 w.forEach(x=>{add(x);(SYN[x]||[]).forEach(add)});GEN.forEach(add);return out.slice(0,25);
}
function pngBlob(){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,512,512);x.drawImage(im,0,0,512,512);c.toBlob(b=>b?res(b):rej(),'image/png')};im.onerror=rej;im.src=uri(build())})}
async function aiKw(){
 const st=$('#aistat');st.textContent='AI membuat keyword…';
 try{
  const sm=window.claude&&await claude.use('sample');if(!sm)throw 0;
  const o={modelTier:'quick'};
  try{const l=await sm.limits();if(l&&l.images)o.images=[await pngBlob()]}catch(e){}
  const r=await sm(`You are a microstock SEO expert. Look at the icon (if an image is attached) and its file name "${S.file}". Current title: "${$('#title').value}". Return ONLY JSON: {"title":"short descriptive English title","keywords":[18 to 25 relevant English keywords, most important first, no duplicates]}`,o);
  const j=JSON.parse(r.text.replace(/```json|```/g,'').trim());
  const k=(j.keywords||[]).map(x=>String(x).trim().toLowerCase()).filter(Boolean);
  if(k.length<10)throw 0;
  $('#kw').value=k.join(', ');
  if(j.title&&!S.titleEdited)$('#title').value=String(j.title).slice(0,120);
  st.textContent=`${k.length} keyword dibuat AI dari gambar ikon.`;
 }catch(e){
  if(kwList().length<10)$('#kw').value=localKw().join(', ');
  st.textContent='AI tidak tersedia. Memakai keyword otomatis lokal (cek dan edit manual).';
 }
 refresh();
}

/* ---------- file handling ---------- */
async function handle(file){
 const err=$('#err');err.textContent='';
 if(!file)return;
 if(!/\.svg$/i.test(file.name)&&file.type!=='image/svg+xml'){err.textContent='File harus berformat SVG (.svg).';return}
 if(file.size>PL[S.p].mb*1048576){err.textContent=`Ukuran file ${fmt(file.size)} melebihi batas ${PL[S.p].mb} MB untuk ${PL[S.p].n}.`;return}
 try{
  const text=await file.text(),doc=new DOMParser().parseFromString(text,'image/svg+xml'),r=doc.documentElement;
  if(doc.querySelector('parsererror')||r.localName!=='svg')throw new Error('Isi file bukan SVG yang valid.');
  const svg=document.importNode(r,true);
  svg.querySelectorAll('script,foreignObject').forEach(e=>e.remove());
  svg.querySelectorAll('*').forEach(e=>[...e.attributes].forEach(a=>{if(/^on/i.test(a.name))e.removeAttribute(a.name)}));
  let vb=(svg.getAttribute('viewBox')||'').trim().split(/[\s,]+/).map(Number);
  if(vb.length!==4||vb.some(isNaN)||vb[2]<=0||vb[3]<=0)vb=[0,0,parseFloat(svg.getAttribute('width'))||100,parseFloat(svg.getAttribute('height'))||100];
  S.vb=vb;S.tol=Math.max(vb[2],vb[3])/3000;
  const stage=$('#stage');stage.innerHTML='';stage.appendChild(svg);
  if(!window.paper||!window.ClipperLib)throw new Error('Library konversi gagal dimuat. Periksa koneksi lalu muat ulang.');
  if(!S.ready){paper.setup(document.createElement('canvas'));S.ready=1}
  convert(svg);
  S.work=svg;S.file=file.name;S.size=file.size;S.date=new Date();
  $('#fname').textContent=`${file.name} · ${fmt(file.size)}`;
  $('#date').value=S.date.toISOString().slice(0,10)+' (otomatis)';
  S.titleEdited=false;
  $('#title').value=file.name.replace(/\.svg$/i,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().replace(/^./,c=>c.toUpperCase());
  $('#kw').value=localKw().join(', ');
  ['#dl','#dljpg','#monob'].forEach(i=>$(i).disabled=false);
  renderColors();refresh();aiKw();
 }catch(e){err.textContent=e.message||'Gagal membaca SVG.'}
}

/* ---------- downloads ---------- */
async function save(name,data,type){
 let d=null;try{d=window.claude&&await claude.use('downloads')}catch(e){}
 if(d){try{await d.save({filename:name,data});return}catch(e){if(e&&e.code==='declined')return}}
 const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();
}
$('#dl').onclick=()=>{const svg=build();save(slug()+'.svg',svg,'image/svg+xml');$('#dlmsg').textContent='Metadata, artboard dan stroke→shape sudah tertanam di file SVG.'};
$('#dljpg').onclick=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=500;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,500,500);x.drawImage(im,0,0,500,500);c.toBlob(b=>save(slug()+'.jpg',b,'image/jpeg'),'image/jpeg',.95);$('#dlmsg').textContent='JPG polos tanpa metadata EXIF. Tanamkan metadata dengan tool lain bila diperlukan, nama harus sama dengan SVG.'};im.src=uri(build())};

/* ---------- events ---------- */
$('#tabs').onclick=e=>{const b=e.target.closest('.tab');if(b)setPlatform(b.dataset.p)};
const drop=$('#drop');
drop.onclick=()=>$('#file').click();
$('#file').onchange=e=>{handle(e.target.files[0]);e.target.value=''};
['dragover','dragenter'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>handle(e.dataTransfer.files[0]));
$('#ab').onchange=e=>{const P=PL[S.p];S.ab=Math.min(P.max,Math.max(P.min,Math.round(+e.target.value)||P.def));e.target.value=S.ab;refresh()};
['#pad','#title','#creator','#holder','#lic','#kw'].forEach(i=>$(i).addEventListener('input',()=>{if(i==='#title')S.titleEdited=true;refresh()}));
$('#kwai').onclick=()=>S.work&&aiKw();
$('#kwloc').onclick=()=>{if(S.work){$('#kw').value=localKw().join(', ');$('#aistat').textContent='Keyword lokal dibuat dari judul / nama file.';refresh()}};
$('#monob').onclick=()=>{const v=$('#mono').value;S.groups.forEach(g=>{g.cur=v;g.els.forEach(e=>e.setAttribute('fill',v))});renderColors();refresh()};
setPlatform('adobe');

// Tombol AI hanya relevan di lingkungan Claude; di GitHub Pages dipakai keyword lokal
if(!(window.claude&&window.claude.use))$('#kwai').hidden=true;
