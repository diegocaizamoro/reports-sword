proj4.defs(
  "EPSG:32717",
  "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs"
);

const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([0, 0]),
    zoom: 4,
  }),
});

// Fuente básica donde metemos puntos UNIT
let unitSource = new ol.source.Vector();

// Fuente de clustering (agrupación automática)
let clusterSource = new ol.source.Cluster({
  distance: 50, // Ajusta: distancia en píxeles entre puntos para agrupar
  source: unitSource,
});

// Capa vectorial con estilo dinámico (cluster o unit)
const clusterLayer = new ol.layer.Vector({
  source: clusterSource,
  style: function (feature) {
    const size = feature.get("features").length;

    // Si es grupo (cluster)
    if (size > 1) {
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 20,
          fill: new ol.style.Fill({ color: "#2b7cff" }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
        }),
        text: new ol.style.Text({
          text: String(size),
          fill: new ol.style.Fill({ color: "#fff" }),
          font: "bold 13px Arial",
        }),
      });
    }

    // Si es un UNIT individual
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({ color: "#ff5722" }),
        stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
      }),
    });
  },
});

map.addLayer(clusterLayer);

// Conexión Socket.io con tu server.js
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Conectado a servidor Socket");
  socket.emit("requestUpdate");
});

socket.on("orbatUpdate", (data) => {
  console.log("📡 Actualización de orbat recibida");

  const units = extractUnits(data);
  updateMap(units);
});

socket.on("orbatChange", () => {
  socket.emit("requestUpdate");
});

// Extraer las unidades con coordenadas del orbat.xml parseado por xml2js
function extractUnits(obj) {
  const results = [];
  searchUnits(obj, results);
  return results;
}

function searchUnits(node, results) {
  if (!node || typeof node !== "object") return;

  if (node.unit) {
    (node.unit || []).forEach((u) => {
      if (u.position && u.position[0]?.$?.x && u.position[0]?.$?.y) {
        results.push({
          name: u.$?.name || "Unit",
          x: parseFloat(u.position[0].$.x),
          y: parseFloat(u.position[0].$.y),
        });
      }
    });
  }

  Object.values(node).forEach((child) => {
    if (Array.isArray(child)) {
      child.forEach((c) => searchUnits(c, results));
    } else if (typeof child === "object") {
      searchUnits(child, results);
    }
  });
}

function convertLocalToLonLat(x, y) {
  // Centrar cerca de Ecuador (aprox Quito)
  const baseLon = -78.5; // Centro de Ecuador
  const baseLat = -1.7;

  // Escalamiento (cada unidad local equivale a 0.00005° aprox)
  const scaledLon = baseLon + (x * 0.00005);
  const scaledLat = baseLat + (y * 0.00005);

  return [scaledLon, scaledLat];
}

// Función para actualizar puntos en el mapa con conversión desde MGRS
function updateMap(units) {
  unitSource.clear();

  const features = units
    .filter((u) => u.x && u.y)
    .map((u) => {
      const [lon, lat] = convertLocalToLonLat(u.x, u.y);
      const coords = ol.proj.fromLonLat([lon, lat]);
      console.log(`📍 ${u.name} → Local(${u.x},${u.y}) → lat:${lat}, lon:${lon}`);

      return new ol.Feature({
        geometry: new ol.geom.Point(coords),
        //name: u.name,
      });
    });

  unitSource.addFeatures(features);
  console.log(`📍 ${features.length} unidades dibujadas correctamente`);

  if (features.length > 0) {
    map.getView().fit(unitSource.getExtent(), {
      padding: [50, 50, 50, 50],
      maxZoom: 13,
      duration: 1000,
    });
  }
}

// Capa de puntos con estilo visible
/*const unitLayer = new ol.layer.Vector({
  source: unitSource,
  style: function (feature) {
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 6, // tamaño del punto (puedes subir a 8 o 10)
        fill: new ol.style.Fill({ color: '#ff0000' }), // rojo visible
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 1 }),
      }),
      text: new ol.style.Text({
        text: feature.get('name'), // muestra el nombre encima
        font: '12px Arial',
        overflow: true,
        fill: new ol.style.Fill({ color: '#ffffff' }),
        stroke: new ol.style.Stroke({ color: '#000000', width: 3 }),
        offsetY: -15, // separa el texto del punto
      }),
    });
  },
});
map.addLayer(unitLayer);*/