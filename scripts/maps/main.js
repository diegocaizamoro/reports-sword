proj4.defs("EPSG:32717", "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs");




// Capas base
const layers = {
  osm: new ol.layer.Tile({
    visible: true,
    source: new ol.source.OSM()
  }),

  topo: new ol.layer.Tile({
    visible: false,
    source: new ol.source.XYZ({
      url: "https://tile.opentopomap.org/{z}/{x}/{y}.png"
    }),
  }),

  esriTerrain: new ol.layer.Tile({
    visible: false,
    source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'
    })
  }),

  esriSat: new ol.layer.Tile({
    visible: false,
    source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    })
  }),
};

// Mapa
 const map = new ol.Map({
  target: 'map',
  layers: Object.values(layers),
  view: new ol.View({
    center: ol.proj.fromLonLat([-78.48, -0.18]), // Quito ejemplo
    zoom: 12
  })
});

// Selector de capas
document.getElementById('baseLayerSelect').addEventListener('change', function() {
  const selectedLayer = this.value;

  for (const key in layers) {
    layers[key].setVisible(key === selectedLayer);
  }
});

/*// Capa satelital (ESRI)
const satelliteLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  }),
});

// Capa de etiquetas (OSM solo labels)
const labelsLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
  }),
  opacity: 0.75, // Transparencia para que se vea encima del satélite
});

// Agregar ambas capas al mapa
const map = new ol.Map({
  target: "map",
  layers: [satelliteLayer, labelsLayer],
  view: new ol.View({
    center: ol.proj.fromLonLat([-78.5, -1.6]),
    zoom: 6,
  }),
});*/

// Fuente básica donde metemos puntos UNIT
let unitSource = new ol.source.Vector();

// Fuente de clustering (agrupación automática)
let clusterSource = new ol.source.Cluster({
  distance: 50, // Ajusta: distancia en píxeles entre puntos para agrupar
  source: unitSource,
});

// Capa vectorial con estilo dinámico (cluster o unit)
// --- clusterLayer (usa clusterSource que toma unitSource) ---
const clusterLayer = new ol.layer.Vector({
  source: clusterSource,
  style: function (feature) {
    const features = feature.get("features");
    const size = features.length;
    const zoom = map.getView().getZoom();

    if (size > 1) {
      // Si es cluster, dibujar círculo grande con número
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
    } else {
      // Si es unidad individual, dibujar solo si zoom > cierto nivel
      const unit = features[0];
      const text = zoom >= 10 ? unit.get("name") : ""; // cambiar 10 por el nivel deseado

      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          fill: new ol.style.Fill({ color: "#79a1f2ff" }),
          stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
        }),
        text: text
          ? new ol.style.Text({
              text: text,
              font: "15px Arial",
              fill: new ol.style.Fill({ color: "#050505ff" }),
              //stroke: new ol.style.Stroke({ color: "#000", width: 3 }),
              offsetY: -15,
            })
          : null,
      });
    }
  },
});

// --- NO crear ni añadir unitLayer ---

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
          mgrs: u.position[0]._?.trim() || null, // <<< Extrae el MGRS
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

function mgrsToLatLon(mgrsString) {
  try {
    const [lon, lat] = mgrs.toPoint(mgrsString.trim()); // ← método correcto
    return [lon, lat]; // OpenLayers usa lon,lat
  } catch (e) {
    console.error(`Error MGRS inválido: ${mgrsString}`, e);
    return [null, null];
  }
}

// Función para actualizar puntos en el mapa con conversión desde MGRS
function updateMap(units) {
  console.log(units);
  unitSource.clear();

  const features = units
    .filter((u) => u.mgrs) // Usamos el MGRS, no x,y
    .map((u) => {
      const [lon, lat] = mgrsToLatLon(u.mgrs); // 🔹 Convertir MGRS a lat/lon
      const coords = ol.proj.fromLonLat([lon, lat]);

      return new ol.Feature({
        geometry: new ol.geom.Point(coords),
        name: u.name || "Unidad sin nombre",
        mgrs: u.mgrs, // <- opcional, para popup o tooltip
      });
    });

  unitSource.addFeatures(features);

  if (features.length > 0) {
    map.getView().fit(unitSource.getExtent(), {
      padding: [50, 50, 50, 50],
      maxZoom: 13,
      duration: 1000,
    });
  }
}


// Capa de puntos con estilo visible
const unitLayer = new ol.layer.Vector({
  source: unitSource,
  style: function (feature) {
    return new ol.style.Style({
      /* image: new ol.style.Circle({
        radius: 10, // tamaño del punto (puedes subir a 8 o 10)
        fill: new ol.style.Fill({ color: '#ff0000' }), // rojo visible
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 1 }),
      }),*/
      text: new ol.style.Text({
        // text: feature.get('name'), // muestra el nombre encima
        font: "15px Arial",
        overflow: true,
        fill: new ol.style.Fill({ color: "#000000ff" }),
        stroke: new ol.style.Stroke({ color: "#000000", width: 3 }),
        offsetY: -15, // separa el texto del punto
      }),
    });
  },
});
map.addLayer(unitLayer);





