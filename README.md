# Gran Canaria · Cuaderno de viaje

Guía en español del 31 de octubre al 5 de noviembre de 2026, con regreso a las 19:30.

Sitio estático para GitHub Pages, sin dependencias de compilación, analítica ni claves de API.

## Contenido
- Seis días completos y alternativa Gáldar/Agaete.
- Horarios orientativos, restaurantes, teléfonos, precios y fuentes.
- Rutas Google Maps y PDF descargable.
- Fotografías de Wikimedia Commons con atribución en `photos.json` y en el pie de página.
- Navegación adaptable a móvil, impresión de todos los días y marcas de visitado locales.

## Publicación
GitHub Pages: rama `main`, carpeta raíz `/`. Todos los enlaces internos son relativos para funcionar bajo `/gran-canaria-2026/`.

## Edición
`index.html`: contenido completo. `style.css`: diseño. `app.js`: navegación y progreso local. `photos.json`: créditos y licencias. `itinerary.json`: copia estructurada del itinerario como referencia; editarlo no regenera por sí solo el HTML.

## Información y licencias
Datos consultados el 31/10/2026; confirmar horarios, precios y accesos. No hay reservas realizadas ni una previsión meteorológica en directo. Las fotografías mantienen las licencias indicadas individualmente; no se concede una licencia global sobre ellas.

## Mapa interactivo
`mapa.html`, `map.js`, `map.css` y `map-points.json`: mapa Leaflet 1.9.4 con filtros por día y tipo, fichas y enlaces Google Maps. Biblioteca incluida localmente en `assets/leaflet` con su licencia BSD. Mapas base de OpenStreetMap; atribución visible y carga bajo demanda, sin precarga ni modo offline. Coordenadas consultadas una sola vez y almacenadas; no se realizan consultas de geocodificación desde la web. Los marcadores aproximados se indican en la lista y fichas. No se representan rutas calculadas ni aparcamientos garantizados.
