const State={user:null,permissions:{},master:{},dashboard:null,pengajuan:[],route:'dashboard'};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const dateFmt=s=>s?new Date(s).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}):'-';
function toast(msg,type=''){const e=$('#toast');e.textContent=msg;e.className='toast show '+type;setTimeout(()=>e.className='toast',2800)}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

document.addEventListener('DOMContentLoaded',init);
async function init(){
  bindStatic();
  if(localStorage.getItem('sim_sppd_token')){
    try{await bootstrap();showApp();await Promise.all([loadDashboard(),loadPengajuan()]);return}catch(e){localStorage.removeItem('sim_sppd_token')}
  }
  $('#loginView').classList.remove('hidden');
}
function bindStatic(){
  $('#loginForm').addEventListener('submit',login);
  $('#logoutBtn').addEventListener('click',logout);
  $('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#modalClose').addEventListener('click',closeModal);
  $('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
  $$('.nav[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
  $('#newPengajuanBtn').addEventListener('click',()=>openPengajuanForm());
  $('#searchPengajuan').addEventListener('input',debounce(renderPengajuan,180));
  $('#statusFilter').addEventListener('change',renderPengajuan);
}
async function login(e){
  e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='Memeriksa...';
  try{const r=await API.login($('#loginEmail').value,$('#loginPassword').value);localStorage.setItem('sim_sppd_token',r.data.token);await bootstrap();showApp();await Promise.all([loadDashboard(),loadPengajuan()]);toast('Login berhasil.')}
  catch(err){toast(err.message,'error')}finally{btn.disabled=false;btn.textContent='Masuk'}
}
async function logout(){try{await API.logout()}catch{}localStorage.removeItem('sim_sppd_token');location.reload()}
async function bootstrap(){const r=await API.bootstrap();State.user=r.data.user;State.permissions=r.data.permissions;State.master=r.data.master}
function showApp(){
  $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');
  $('#userName').textContent=State.user.nama;$('#userRole').textContent=State.user.role.replace('_',' ');$('#avatar').textContent=(State.user.nama||'A')[0].toUpperCase();
  $('#newPengajuanBtn').style.display=State.permissions.pengajuan_create?'':'none';
}
function navigate(route){
  State.route=route;$$('.nav[data-route]').forEach(n=>n.classList.toggle('active',n.dataset.route===route));
  $$('.route').forEach(s=>s.classList.remove('active'));
  const built=['dashboard','pengajuan'].includes(route), target=$('#route-'+(built?route:'placeholder'));target.classList.add('active');
  const titles={dashboard:['Dashboard','Ringkasan perjalanan dinas'],pengajuan:['Pengajuan','Pengajuan dan verifikasi perjalanan dinas']};
  const t=titles[route]||[route[0].toUpperCase()+route.slice(1),'Modul pengembangan berikutnya'];$('#pageTitle').textContent=t[0];$('#pageSub').textContent=t[1];
  $('#sidebar').classList.remove('open');
}
async function loadDashboard(){try{const r=await API.dashboard();State.dashboard=r.data;renderDashboard()}catch(e){toast(e.message,'error')}}
function renderDashboard(){
  const c=State.dashboard.cards;
  $('#kpiGrid').innerHTML=[
    ['Perjalanan Bulan Ini',c.totalBulanIni],['Total Estimasi',money(c.totalEstimasi)],['Menunggu Proses',c.pending],['Diverifikasi',c.disetujui]
  ].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
  const status=State.dashboard.status||{}, total=Math.max(1,Object.values(status).reduce((a,b)=>a+b,0));
  $('#statusBars').innerHTML=Object.entries(status).map(([k,v])=>`<div class="status-row"><div class="status-meta"><span>${esc(k)}</span><b>${v}</b></div><div class="bar"><i style="width:${v/total*100}%"></i></div></div>`).join('')||'<p class="muted">Belum ada data.</p>';
  $('#latestList').innerHTML=(State.dashboard.terbaru||[]).map(r=>`<div class="latest-item"><div><b>${esc(r.nomor_pengajuan)}</b><div class="muted">${esc(r.nama_pelaksana)} • ${esc(r.tujuan_lokasi)}</div></div><span class="badge ${esc(r.status)}">${esc(r.status)}</span></div>`).join('')||'<p class="muted">Belum ada pengajuan.</p>';
}
async function loadPengajuan(){try{const r=await API.pengajuanList();State.pengajuan=r.data||[];renderPengajuan()}catch(e){toast(e.message,'error')}}
function renderPengajuan(){
  const q=$('#searchPengajuan').value.toLowerCase(),st=$('#statusFilter').value;
  const rows=State.pengajuan.filter(r=>(!st||r.status===st)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));
  $('#pengajuanBody').innerHTML=rows.map(r=>`<tr><td><b>${esc(r.nomor_pengajuan)}</b></td><td>${esc(r.nama_pelaksana)}</td><td>${esc(r.tujuan_lokasi)}</td><td>${dateFmt(r.tanggal_berangkat)} – ${dateFmt(r.tanggal_kembali)}</td><td>${money(r.estimasi_biaya)}</td><td><span class="badge ${esc(r.status)}">${esc(r.status)}</span></td><td><button class="link-btn" onclick="viewPengajuan('${esc(r.id_pengajuan)}')">Detail</button></td></tr>`).join('')||'<tr><td colspan="7" class="muted">Belum ada data yang sesuai.</td></tr>';
}
function openPengajuanForm(existing=null){
  const draft=existing||JSON.parse(localStorage.getItem(CONFIG.DRAFT_KEY)||'null')||{};
  const locs=(State.master.lokasi||[]).map(l=>`<option value="${esc(l.lokasi_id)}" ${draft.tujuan_lokasi_id===l.lokasi_id?'selected':''}>${esc(l.nama_lokasi)}</option>`).join('');
  $('#modalBody').innerHTML=`<h2>${existing?'Edit':'Pengajuan Baru'}</h2><p class="muted">Draft disimpan lokal secara otomatis agar input tidak hilang.</p>
  <form id="pengajuanForm" class="form-grid">
   <input type="hidden" name="id_pengajuan" value="${esc(draft.id_pengajuan||'')}">
   <label>Tujuan Lokasi<select name="tujuan_lokasi_id" required><option value="">Pilih lokasi</option>${locs}</select></label>
   <label>Alat Angkut<input name="alat_angkut" value="${esc(draft.alat_angkut||'Kendaraan Dinas')}"></label>
   <label>Tanggal Berangkat<input type="date" name="tanggal_berangkat" value="${esc(draft.tanggal_berangkat||'')}" required></label>
   <label>Tanggal Kembali<input type="date" name="tanggal_kembali" value="${esc(draft.tanggal_kembali||'')}" required></label>
   <label class="full">Dasar Perjalanan<textarea name="dasar_perjalanan" rows="2" required>${esc(draft.dasar_perjalanan||'')}</textarea></label>
   <label class="full">Tujuan Kegiatan<textarea name="tujuan_kegiatan" rows="2" required>${esc(draft.tujuan_kegiatan||'')}</textarea></label>
   <label class="full">Maksud Perjalanan<textarea name="maksud_perjalanan" rows="2">${esc(draft.maksud_perjalanan||'')}</textarea></label>
   <label>Waktu Kegiatan<input type="time" name="waktu_kegiatan" value="${esc(draft.waktu_kegiatan||'')}"></label>
   <label>Tempat Kegiatan<input name="tempat_kegiatan" value="${esc(draft.tempat_kegiatan||'')}"></label>
   <label>Jarak (KM)<input type="number" min="0" name="jarak_km" value="${esc(draft.jarak_km||'')}"></label>
   <label>Estimasi Biaya (opsional)<input type="number" min="0" name="estimasi_biaya" value="${esc(draft.estimasi_biaya||'')}"></label>
   <div class="form-actions full"><button type="button" id="saveDraftBtn" class="btn secondary">Simpan Draft</button><button type="submit" class="btn primary">Ajukan</button></div>
  </form>`;
  $('#modal').classList.remove('hidden');
  const f=$('#pengajuanForm');f.addEventListener('input',debounce(()=>localStorage.setItem(CONFIG.DRAFT_KEY,JSON.stringify(Object.fromEntries(new FormData(f)))),350));
  $('#saveDraftBtn').addEventListener('click',()=>saveForm(true));f.addEventListener('submit',e=>{e.preventDefault();saveForm(false,e.submitter)});
}
async function saveForm(draft,btn){
  const f=$('#pengajuanForm'),data=Object.fromEntries(new FormData(f));
  if(btn){btn.disabled=true;btn.textContent='Mengirim...'}
  try{const r=draft?await API.saveDraft(data):await API.submitPengajuan(data);localStorage.removeItem(CONFIG.DRAFT_KEY);toast(r.message);closeModal();await Promise.all([loadPengajuan(),loadDashboard()])}
  catch(e){toast(e.message,'error')}finally{if(btn){btn.disabled=false;btn.textContent='Ajukan'}}
}
function viewPengajuan(id){
  const r=State.pengajuan.find(x=>x.id_pengajuan===id);if(!r)return;
  const canVerify=State.permissions.pengajuan_verify&&r.status==='DIAJUKAN';
  $('#modalBody').innerHTML=`<h2>${esc(r.nomor_pengajuan)}</h2><div class="detail-grid">
  ${[['Pelaksana',r.nama_pelaksana],['Status',r.status],['Tujuan',r.tujuan_lokasi],['Tanggal',dateFmt(r.tanggal_berangkat)+' – '+dateFmt(r.tanggal_kembali)],['Dasar',r.dasar_perjalanan],['Tujuan Kegiatan',r.tujuan_kegiatan],['Estimasi',money(r.estimasi_biaya)],['Catatan',r.catatan_verifikator||'-']].map(x=>`<div class="detail-box"><small>${x[0]}</small><b>${esc(x[1])}</b></div>`).join('')}</div>
  ${canVerify?`<label>Catatan Verifikator<textarea id="verifyNote" rows="3"></textarea></label><div class="form-actions"><button class="btn danger" onclick="verifyPengajuan('${esc(id)}','REJECT')">Tolak</button><button class="btn primary" onclick="verifyPengajuan('${esc(id)}','APPROVE')">Setujui</button></div>`:''}`;
  $('#modal').classList.remove('hidden');
}
async function verifyPengajuan(id,decision){
  try{const r=await API.verify({id_pengajuan:id,decision,catatan:$('#verifyNote')?.value||''});toast(r.message);closeModal();await Promise.all([loadPengajuan(),loadDashboard()])}catch(e){toast(e.message,'error')}
}
function closeModal(){$('#modal').classList.add('hidden');$('#modalBody').innerHTML=''}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
