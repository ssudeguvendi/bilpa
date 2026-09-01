const KEY='bilpa-stock-v1';
const state=JSON.parse(localStorage.getItem(KEY)||'null')||{products:[],carts:[],counts:[]};
const $=s=>document.querySelector(s); const save=()=>{localStorage.setItem(KEY,JSON.stringify(state));render()};
const nextCode=(prefix,arr)=>`${prefix}-${String(arr.length+1).padStart(6,'0')}`;
function render(){
 $('#productCount').textContent=state.products.length;
 $('#stockTotal').textContent=state.products.reduce((a,p)=>a+(Number(p.stock)||0),0);
 $('#cartCount').textContent=state.carts.length;
 $('#differenceTotal').textContent=state.counts.reduce((a,c)=>a+Math.abs(c.difference||0),0);
 const q=($('#productSearch').value||'').toLowerCase(); const series=$('#seriesFilter').value;
 const ps=state.products.filter(p=>(!q||[p.name,p.code,p.barcode,p.series,p.color].join(' ').toLowerCase().includes(q))&&(!series||p.series===series));
 $('#products').innerHTML=ps.length?ps.map(p=>`<div class="row"><div><b>${esc(p.name)}</b><br><span class="code">${p.code} · ${p.barcode}</span></div><div><small>${esc(p.series||'Seri yok')} · ${esc(p.color||'')}</small></div><div class="qty">Stok: ${p.stock}</div><div><small>${esc(p.size||'')}</small></div><div class="actions"><button class="ghost" onclick="editStock('${p.id}')">Stok</button></div></div>`).join(''):'<p class="muted">Henüz ürün yok. İlk ürünü ekleyelim.</p>';
 const seriesSet=[...new Set(state.products.map(p=>p.series).filter(Boolean))]; $('#seriesFilter').innerHTML='<option value="">Tüm seriler</option>'+seriesSet.map(s=>`<option>${esc(s)}</option>`).join('');
 $('#carts').innerHTML=state.carts.length?state.carts.map(c=>`<div class="row"><div><b>${esc(c.name)}</b><br><span class="code">${c.code}</span></div><div><small>${c.productIds.length} ürün tanımlı</small></div><div></div><div></div><div><button class="ghost" onclick="startCount('${c.id}')">Sayımı Başlat</button></div></div>`).join(''):'<p class="muted">Henüz araba tanımlanmadı.</p>';
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').hidden=false}
$('#closeModal').onclick=()=>$('#modal').hidden=true; $('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').hidden=true};
$('#addProductBtn').onclick=()=>openModal(`<div class="form"><h2>Yeni Ürün</h2><label>Ürün adı<input id="fName" placeholder="Örn. Flatstone"></label><label>Seri<input id="fSeries" placeholder="Örn. Banyo"></label><label>Renk<input id="fColor" placeholder="Örn. Antrasit"></label><label>Ölçü<input id="fSize" placeholder="Örn. 800x500"></label><label>Başlangıç stoku<input id="fStock" type="number" min="0" value="0"></label><button class="primary" id="saveProduct">Ürünü Kaydet</button></div>`);
$('#modal').addEventListener('click',e=>{if(e.target.id==='saveProduct'){const name=$('#fName').value.trim();if(!name)return alert('Ürün adı gerekli.');const id=crypto.randomUUID();const code=nextCode('BLP',state.products);state.products.push({id,code,barcode:code,name,series:$('#fSeries').value.trim(),color:$('#fColor').value.trim(),size:$('#fSize').value.trim(),stock:Number($('#fStock').value)||0});$('#modal').hidden=true;save()}});
$('#addCartBtn').onclick=()=>openModal(`<div class="form"><h2>Yeni Araba</h2><label>Araba adı<input id="cName" placeholder="Örn. Araba 01"></label><button class="primary" id="saveCart">Arabayı Kaydet</button></div>`);
$('#modal').addEventListener('click',e=>{if(e.target.id==='saveCart'){const name=$('#cName').value.trim()||`Araba ${state.carts.length+1}`;state.carts.push({id:crypto.randomUUID(),code:`AR-${String(state.carts.length+1).padStart(3,'0')}`,name,productIds:[]});$('#modal').hidden=true;save()}});
window.editStock=id=>{const p=state.products.find(x=>x.id===id);const n=prompt(`${p.name}\nMevcut stok: ${p.stock}\nYeni stok:`,p.stock);if(n!==null&&!isNaN(Number(n))){p.stock=Math.max(0,Number(n));save()}};
let activeCount=null;
window.startCount=id=>{const c=state.carts.find(x=>x.id===id);activeCount={cartId:id,items:{}};$('#countSession').hidden=false;$('#countSession').innerHTML=`<b>${esc(c.name)} sayımı açık</b><div class="muted">Barkodları tek tek okut. Aynı barkod her okutulduğunda miktar 1 artar.</div><div id="countItems"></div><br><button class="primary" onclick="finishCount()">Sayımı Bitir</button>`;$('#scanInput').focus();renderCount()};
function renderCount(){if(!activeCount)return;$('#countItems').innerHTML=Object.entries(activeCount.items).map(([code,q])=>{const p=state.products.find(x=>x.barcode===code);return `<div class="count-item"><span>${esc(p?.name||'Bilinmeyen')} <span class="code">${esc(code)}</span></span><b>${q}</b></div>`}).join('')||'<p class="muted">Henüz okutma yok.</p>'}
$('#scanBtn').onclick=scan;$('#scanInput').addEventListener('keydown',e=>{if(e.key==='Enter')scan()});
function scan(){const code=$('#scanInput').value.trim().toUpperCase();if(!code)return;if(!activeCount)return alert('Önce bir araba için “Sayımı Başlat” seç.');if(!state.products.some(p=>p.barcode===code))return alert('Bu barkod BİLPA sisteminde kayıtlı değil.');activeCount.items[code]=(activeCount.items[code]||0)+1;$('#scanInput').value='';renderCount();$('#scanInput').focus()}
window.finishCount=()=>{const c=state.carts.find(x=>x.id===activeCount.cartId);let difference=0;Object.entries(activeCount.items).forEach(([code,count])=>{const p=state.products.find(x=>x.barcode===code);difference+=count-(p?.stock||0)});state.counts.push({id:crypto.randomUUID(),cartId:c.id,date:new Date().toISOString(),items:activeCount.items,difference});activeCount=null;$('#countSession').hidden=true;save();alert('Sayım kaydedildi. Fark: '+difference)};
$('#productSearch').oninput=render;$('#seriesFilter').onchange=render;
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
let deferred;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{if(deferred){deferred.prompt();deferred=null}};
render();