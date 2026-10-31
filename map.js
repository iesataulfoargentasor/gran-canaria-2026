(() => {
  'use strict';
  const days = {
    'dia-31': {label:'31 oct · Llegada',short:'31',color:'#475569'},
    'dia-1': {label:'1 nov · Teror y Arucas',short:'1',color:'#a94821'},
    'dia-2': {label:'2 nov · El sur',short:'2',color:'#1767a5'},
    'dia-3': {label:'3 nov · Cumbre',short:'3',color:'#39722f'},
    'dia-4': {label:'4 nov · Las Palmas',short:'4',color:'#854b99'},
    'dia-5': {label:'5 nov · Telde',short:'5',color:'#a33260'},
    'alternativa': {label:'Alternativa · Gáldar y Agaete',short:'A',color:'#8b670e'}
  };
  const types = {visita:'Visita',restaurante:'Restaurante',base:'Base / transporte'};
  const requested = new URLSearchParams(location.search).get('dia');
  let selectedDay = days[requested] ? requested : 'all';
  let points = [], filtered = [], map, layer;
  const markers = new Map();
  const filters = document.getElementById('day-filters');
  const list = document.getElementById('place-list');
  const message = document.getElementById('map-message');
  const typeSelect = document.getElementById('place-type');
  const fitButton = document.getElementById('fit-map');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mapsUrl = p => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.query);
  const badge = p => p.kind === 'base' ? {color:'#334b49',short:'B'} : days[p.days[0]];
  function fit() { if (map && filtered.length) map.fitBounds(filtered.map(p=>[p.lat,p.lng]), {padding:[35,35],maxZoom:15}); }
  function popup(p) {
    const dayText = p.kind==='base' ? 'Punto común del viaje' : p.days.map(d=>days[d].label).join(' · ');
    return `<div class="place-popup"><span class="eyebrow">${esc(types[p.kind])} · ${esc(dayText)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${p.approximate?'<p class="approx">Ubicación aproximada: entorno de la dirección.</p>':''}<a href="${esc(mapsUrl(p))}" target="_blank" rel="noopener noreferrer">Cómo llegar en Google Maps ↗</a></div>`;
  }
  function selectPlace(p) {
    if (!map) return;
    map.setView([p.lat,p.lng],16);
    markers.get(p.id)?.openPopup();
    if (window.matchMedia('(max-width: 760px)').matches) document.querySelector('.map-view').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function render() {
    filtered = points.filter(p=>(selectedDay==='all'||p.days.includes(selectedDay))&&(typeSelect.value==='all'||p.kind===typeSelect.value));
    [...filters.children].forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.day===selectedDay)));
    document.getElementById('place-count').textContent = `${filtered.length} lugares · ${selectedDay==='all'?'Todo el viaje':days[selectedDay].label}`;
    const planning = document.getElementById('day-planning');
    planning.href = 'index.html#'+(selectedDay==='all'?'inicio':selectedDay);
    planning.textContent = selectedDay==='all'?'Ver planning completo →':'Ver planning de este día →';
    list.replaceChildren(); markers.clear(); if (layer) layer.clearLayers();
    filtered.forEach(p=>{
      const info = badge(p), symbol = p.kind==='restaurante'?'R':p.kind==='base'?'B':'V';
      const card = document.createElement('article');card.className='place-card';card.style.setProperty('--day-color',info.color);
      card.innerHTML=`<span class="place-category">${esc(types[p.kind])} · ${p.kind==='base'?'Común':esc(days[p.days[0]].label)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${p.approximate?'<small class="approx">Ubicación aproximada</small>':''}<div class="place-actions"><button type="button">Ver en el mapa</button><a href="${esc(mapsUrl(p))}" target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div>`;
      card.querySelector('button').disabled = !map;
      card.querySelector('button').addEventListener('click',()=>selectPlace(p));list.append(card);
      if (map) {
        const icon = L.divIcon({className:'trip-pin-wrapper',html:`<span class="trip-pin ${p.kind}" style="--pin-color:${info.color}">${symbol}<small>${p.kind==='base'?'':info.short}</small></span>`,iconSize:[34,36],iconAnchor:[17,34],popupAnchor:[0,-29]});
        const marker=L.marker([p.lat,p.lng],{icon,title:p.name,alt:`${types[p.kind]}: ${p.name}`,keyboard:true}).bindPopup(popup(p),{maxWidth:310}).addTo(layer);
        markers.set(p.id,marker);
      }
    });
    if (!filtered.length) list.innerHTML='<p class="empty-results">No hay lugares de este tipo para el día elegido. Prueba «Todos los lugares».</p>';
    fitButton.disabled=!map||!filtered.length;
    fit();
  }
  [{id:'all',label:'Todos los días',color:'#183d3b'},...Object.entries(days).map(([id,d])=>({id,...d}))].forEach(d=>{
    const button=document.createElement('button');button.type='button';button.dataset.day=d.id;button.style.setProperty('--day-color',d.color);button.textContent=d.label;button.setAttribute('aria-pressed',String(d.id===selectedDay));
    button.addEventListener('click',()=>{selectedDay=d.id;const url=new URL(location.href);if(d.id==='all')url.searchParams.delete('dia');else url.searchParams.set('dia',d.id);history.replaceState(null,'',url);render();});filters.append(button);
  });
  typeSelect.addEventListener('change',render);fitButton.addEventListener('click',fit);
  fetch('map-points.json').then(r=>{if(!r.ok)throw new Error('data');return r.json();}).then(data=>{
    points=data;
    if (typeof L !== 'undefined') {
      map=L.map('trip-map',{scrollWheelZoom:false}).setView([27.98,-15.57],10);
      const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
      tiles.on('tileerror',()=>{message.textContent='No se ha podido cargar parte del mapa base. Las fichas y los enlaces de Google Maps siguen disponibles.';message.hidden=false;});
      layer=L.layerGroup().addTo(map);message.hidden=true;
    } else {message.textContent='El mapa no se ha podido cargar. Puedes consultar todos los lugares y abrirlos en Google Maps desde la lista.';}
    render();
  }).catch(()=>{message.textContent='No se han podido cargar los lugares. Recarga la página o consulta las rutas en la guía por días.';fitButton.disabled=true;});
})();
