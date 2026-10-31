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
  let points = [], filtered = [], routes = {}, variant = 0, map, layer, routeLayer;
  const markers = new Map();
  const filters = document.getElementById('day-filters');
  const list = document.getElementById('place-list');
  const message = document.getElementById('map-message');
  const typeSelect = document.getElementById('place-type');
  const fitButton = document.getElementById('fit-map');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mapsUrl = p => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.query);
  const badge = p => p.kind === 'base' ? {color:'#334b49',short:'B'} : days[p.days[0]];

  const modes = {driving:'En coche',walking:'A pie',transit:'Guagua / taxi',shuttle:'Guagua + a pie'};
  const routePanel = document.getElementById('route-panel');
  function routeFor(day) { const r=routes[day];return r && day===selectedDay && variant ? r.variants[variant-1] : r; }
  function directions(a,b,leg) {
    if (leg.mode==='shuttle') return 'https://grancanariasenderos.com/';
    return 'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(a.query)+'&destination='+encodeURIComponent(b.query)+'&travelmode='+leg.mode;
  }
  function renderRoute() {
    routePanel.replaceChildren(); if(routeLayer)routeLayer.clearLayers();
    if(!Object.keys(routes).length){routePanel.innerHTML='<p>No se han podido cargar las rutas. Recarga la página o consulta el planning.</p>';return;}
    if(typeSelect.value!=='all'){routePanel.innerHTML='<p>Para ver la ruta completa y su orden, elige «Todos los lugares».</p>';return;}
    const keys=selectedDay==='all'?Object.keys(days):[selectedDay];
    keys.forEach(day=>{
      const r=routeFor(day);if(!r)return;
      r.legs.forEach((leg,i)=>{
        const a=points.find(p=>p.id===r.stops[i]),b=points.find(p=>p.id===r.stops[i+1]);
        if(!a||!b||!routeLayer)return;
        const text=`${i+1} → ${i+2} · ${modes[leg.mode]} · ${leg.time}`;
        (leg.segments||[]).forEach(segment=>L.polyline(segment.coordinates,{color:days[day].color,weight:4,opacity:.85,dashArray:segment.mode==='walking'?'3 7':segment.mode==='shuttle'?'10 5':null}).bindTooltip(esc(text),{sticky:true}).bindPopup(`<b>${esc(days[day].label)}</b><p>${esc(a.name)} → ${esc(b.name)}</p><b>${esc(text)}</b><p>${esc(leg.note||'Tiempo orientativo; consulta el recorrido antes de salir.')}</p>${leg.geometryNote?'<p>'+esc(leg.geometryNote)+'</p>':''}<a href="${esc(directions(a,b,leg))}" target="_blank" rel="noopener">${leg.mode==='shuttle'?'Consultar acceso y transporte':'Ver recorrido en Google Maps'} ↗</a>`).addTo(routeLayer));
      });
    });
    if(selectedDay==='all'){routePanel.innerHTML='<h3>Rutas de cada día</h3><p>Elige un día para ver las paradas numeradas, los tiempos entre ellas y las opciones de ruta. Los trazados siguen carreteras y caminos cartografiados.</p>';return;}
    const r=routeFor(selectedDay);if(!r)return;
    const heading=document.createElement('h3');heading.textContent='Ruta en orden de visita';routePanel.append(heading);
    if(routes[selectedDay].variants){
      const label=document.createElement('label');label.textContent='Opción de ruta ';const select=document.createElement('select');select.id='route-variant';
      ['Ruta principal',...routes[selectedDay].variants.map(v=>v.label)].forEach((name,i)=>{const o=document.createElement('option');o.value=i;o.textContent=name;select.append(o);});select.value=variant;
      select.addEventListener('change',()=>{variant=Number(select.value);render();});label.append(select);routePanel.append(label);
    }
    const note=document.createElement('p');note.className='route-note';note.textContent=(r.note?r.note+' ':'')+'Tiempos aproximados. Trazados calculados sobre OpenStreetMap: línea continua por carretera y puntos a pie. Los extremos se ajustan al acceso disponible más cercano; añade el paseo desde el aparcamiento. Consulta posibles cierres antes de salir.';routePanel.append(note);
    const ol=document.createElement('ol');ol.className='route-stops';
    r.stops.forEach((id,i)=>{
      const p=points.find(p=>p.id===id);if(!p)return;const li=document.createElement('li');
      const button=document.createElement('button');button.type='button';button.textContent=p.name;button.disabled=!map;button.addEventListener('click',()=>selectPlace(p));li.append(button);
      if(r.legs[i]){const leg=r.legs[i],next=points.find(p=>p.id===r.stops[i+1]);const detail=document.createElement('div');detail.className='route-leg';detail.innerHTML=`<strong>↓ ${esc(modes[leg.mode])} · ${esc(leg.time)}</strong>${leg.note?'<p>'+esc(leg.note)+'</p>':''}${leg.geometryNote?'<p>'+esc(leg.geometryNote)+'</p>':''}${!leg.segments?.length?'<p>Trazado no disponible; consulta el enlace del tramo.</p>':''}<a href="${esc(directions(p,next,leg))}" target="_blank" rel="noopener">${leg.mode==='shuttle'?'Acceso y guagua':'Ver este tramo'} ↗</a>`;li.append(detail);}
      ol.append(li);
    });routePanel.append(ol);
  }

  function fit() { if (map && filtered.length) { const bounds=L.latLngBounds(filtered.map(p=>[p.lat,p.lng])); routeLayer?.eachLayer(line=>bounds.extend(line.getBounds()));map.fitBounds(bounds,{padding:[35,35],maxZoom:15}); } }
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
    renderRoute();
    filtered = points.filter(p=>(selectedDay==='all'||p.days.includes(selectedDay))&&(typeSelect.value==='all'||p.kind===typeSelect.value));
    [...filters.children].forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.day===selectedDay)));
    document.getElementById('place-count').textContent = `${filtered.length} lugares · ${selectedDay==='all'?'Todo el viaje':days[selectedDay].label}`;
    const planning = document.getElementById('day-planning');
    planning.href = 'index.html#'+(selectedDay==='all'?'inicio':selectedDay);
    planning.textContent = selectedDay==='all'?'Ver planning completo →':'Ver planning de este día →';
    list.replaceChildren(); markers.clear(); if (layer) layer.clearLayers();
    filtered.forEach(p=>{
      const info = badge(p), order = routeFor(selectedDay)?.stops.map((id,i)=>id===p.id?i+1:null).filter(Boolean) || [], symbol = p.kind==='restaurante'?'R':p.kind==='base'?'B':'V';
      const card = document.createElement('article');card.className='place-card';card.style.setProperty('--day-color',info.color);
      card.innerHTML=`<span class="place-category">${esc(types[p.kind])} · ${p.kind==='base'?'Común':esc(days[p.days[0]].label)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${p.approximate?'<small class="approx">Ubicación aproximada</small>':''}<div class="place-actions"><button type="button">Ver en el mapa</button><a href="${esc(mapsUrl(p))}" target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a></div>`;
      card.querySelector('button').disabled = !map;
      card.querySelector('button').addEventListener('click',()=>selectPlace(p));list.append(card);
      if (map) {
        const icon = L.divIcon({className:'trip-pin-wrapper',html:`<span class="trip-pin ${p.kind}" style="--pin-color:${info.color}">${selectedDay!=='all'&&order.length?order.join('/') : symbol}<small>${selectedDay!=='all'?symbol:p.kind==='base'?'':info.short}</small></span>`,iconSize:[34,36],iconAnchor:[17,34],popupAnchor:[0,-29]});
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
    button.addEventListener('click',()=>{selectedDay=d.id;variant=0;const url=new URL(location.href);if(d.id==='all')url.searchParams.delete('dia');else url.searchParams.set('dia',d.id);history.replaceState(null,'',url);render();});filters.append(button);
  });
  typeSelect.addEventListener('change',render);fitButton.addEventListener('click',fit);
  fetch('map-routes.json').then(r=>{if(!r.ok)throw new Error('routes');return r.json();}).then(data=>{routes=data;}).catch(()=>{routes={};}).then(()=>fetch('map-points.json')).then(r=>{if(!r.ok)throw new Error('data');return r.json();}).then(data=>{
    points=data;
    if (typeof L !== 'undefined') {
      map=L.map('trip-map',{scrollWheelZoom:false}).setView([27.98,-15.57],10);
      const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
      tiles.on('tileerror',()=>{message.textContent='No se ha podido cargar parte del mapa base. Las fichas y los enlaces de Google Maps siguen disponibles.';message.hidden=false;});
      routeLayer=L.layerGroup().addTo(map);layer=L.layerGroup().addTo(map);message.hidden=true;
    } else {message.textContent='El mapa no se ha podido cargar. Puedes consultar todos los lugares y abrirlos en Google Maps desde la lista.';}
    render();
  }).catch(()=>{message.textContent='No se han podido cargar los lugares. Recarga la página o consulta las rutas en la guía por días.';fitButton.disabled=true;});
})();
