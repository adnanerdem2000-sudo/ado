/* ================= ayarlar (v142: tuş düzeni → Kontroller penceresi, 169) ================= */
const SET_KEY='kariyer-ayarlar';
function setsGet(){try{return JSON.parse(localStorage.getItem(SET_KEY)||'{}')||{};}catch(e){return {};}}
function setsPut(o){try{localStorage.setItem(SET_KEY,JSON.stringify(o));}catch(e){}}
const LAY_DEF={a:{r:14,b:30,s:86},b:{r:112,b:16,s:68},c:{r:30,b:132,s:64},d:{r:124,b:104,s:58}};
const LAY_LBL={atk:{a:'ŞUT',b:'PAS',c:'KOŞ',d:null},def:{a:'KAY',b:'MÜDAHALE',c:'KOŞ',d:'PRES'}};
function layOf(g){const s=setsGet(),L=(s.lay&&s.lay[g])||{};const o={};for(const k of ['a','b','c','d'])o[k]=Object.assign({},LAY_DEF[k],L[k]||{});return o;}
/* v142: düğme yerleri artık ctl_layout_v142'de (169); padCtx sarmalayıcısı bağlama göre uygular. Eski 'lay' kaydı ilk açılışta oraya taşınır. */
function applyLayout(g){}
let LAYG='atk';
function openSettings(){
  openModal(`<h3>Ayarlar</h3><p class="sub-h" style="margin:4px 0 8px"><span>Kontroller</span></p>
  <div class="ctl-entry"><div><b>Dokunmatik düzen ve klavye tuşları</b><small>Topa sahipken, top rakipteyken ve kaleciyken düğmelerin yeri, boyutu, saydamlığı; joystick eli; bilgisayarda tuş atama.</small></div><button class="cta sm" data-act="ctlOpen">Düzenle</button></div>
  <p class="sub-h" style="margin:14px 0 6px"><span>Oyun</span></p>
  ${fsOK()?`<label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="autofs" ${G&&G.autoFS===false?'':'checked'}> Maça çıkınca otomatik tam ekran</label>`:''}
  <label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="themeTog" ${setsGet().theme==='klasik'?'':'checked'}> Profesyonel arayüz (ayrıntılı)</label>
  <label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="rpTog" ${setsGet().rp===false?'':'checked'}> Gollerden sonra ağır çekim tekrar</label>
  ${G&&isPl()?`<label class="hurt" style="margin:0"><input type="checkbox" data-act="trscene" ${G.trScene!==false?'checked':''}> Maç önü idmanını sahada oyna</label>`:''}
  ${G?`<p class="sub-h" style="margin:14px 0 6px"><span>Kariyerdeki ismin</span></p><div class="rn"><input id="rnIn" value="${esc(G.p.name||'')}" maxlength="28" autocomplete="off"><button class="btn" data-act="rename">Kaydet</button></div>`:''}<div class="offer-btns" style="margin-top:12px"><button class="btn" data-act="help">Nasıl oynanır?</button>${G?'<button class="btn" data-act="toMenu">Kariyer seçimine dön</button>':''}</div>`);}
