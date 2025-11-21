/*proj4.defs(
  "EPSG:32717",
  "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs"
);*/
let previousStates = {}; // Guarda estados anteriores por unidad
// Capas base
const layers = {
  osm: new ol.layer.Tile({
    visible: true,
    source: new ol.source.OSM(),
  }),

  topo: new ol.layer.Tile({
    visible: false,
    source: new ol.source.XYZ({
      url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    }),
  }),

  esriTerrain: new ol.layer.Tile({
    visible: false,
    source: new ol.source.XYZ({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
    }),
  }),

  esriSat: new ol.layer.Tile({
    visible: false,
    source: new ol.source.XYZ({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    }),
  }),
};

// Mapa
const map = new ol.Map({
  controls: [new ol.control.FullScreen(), new ol.control.ScaleLine()],
  target: "map",
  layers: Object.values(layers),
  view: new ol.View({
    center: ol.proj.fromLonLat([-78.48, -0.18]), // Quito ejemplo
    zoom: 12,
  }),
});

// Selector de capas
document
  .getElementById("baseLayerSelect")
  .addEventListener("change", function () {
    const selectedLayer = this.value;

    for (const key in layers) {
      layers[key].setVisible(key === selectedLayer);
    }
  });

// --- Overlay del popup ---
const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");
const popupCloser = document.getElementById("popup-closer");

const overlay = new ol.Overlay({
  element: popup,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});
map.addOverlay(overlay);

// --- Cerrar popup ---
popupCloser.onclick = function () {
  overlay.setPosition(undefined);
  popupCloser.blur();
  return false;
};

// --- Evento de click para mostrar popup ---
map.on("singleclick", function (evt) {
  let featureFound = false;

  map.forEachFeatureAtPixel(
    evt.pixel,
    function (feature) {
      const realFeature = feature.get("features")
        ? feature.get("features")[0]
        : feature;

      const percentage = realFeature.get("percentage") || 0;
      const roundedPerc = percentage.toFixed(2); // redondea a 2 decimales

      // Color dinámico según porcentaje (puedes reutilizar tu lógica actual)
      const barColor =
        percentage < 34 ? "#f4a9a9" : percentage < 67 ? "yellow" : "#99e699";

      popupContent.innerHTML = `
  <div style="font-size:12px; line-height:1.4; max-width:220px;">
    <span>
    ${realFeature.get("formationName")?.split("/")[0] || ""}/
      ${realFeature.get("parentName")?.split("/")[0] || ""} / 
      <span style="color:blue; font-weight:bold;">
        ${realFeature.get("name") || ""}
      </span>
    </span><br>
    <div style="
      width: 100%;
      height: 20px;
      border-radius: 5px;
      background-color: #ddddddff;
      overflow: hidden;
      border: 1px solid #999;
      position: relative;
    ">
      <div style="
        width: ${percentage}%;
        height: 100%;
        background-color: ${barColor};
        transition: width 0.5s;
      "></div>

      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        font-weight: bold;
        color: #000;
      ">
        ${roundedPerc}%
      </div>
    </div>
  </div>
`;

      overlay.setPosition(evt.coordinate);
      featureFound = true;
    },
    {
      hitTolerance: 10, // Mejor manejo del clic
    }
  );

  if (!featureFound) overlay.setPosition(undefined);
});

map.on("pointermove", function (evt) {
  const hit = map.hasFeatureAtPixel(evt.pixel, {
    hitTolerance: 10, // Aumenta el área de detección en píxeles
  });
  map.getTargetElement().style.cursor = hit ? "pointer" : "";
});

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
          fill: new ol.style.Fill({ color: "#6e9fefff" }),
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
        /* text: text
          ? new ol.style.Text({
              text: text,
              font: "15px Arial",
              fill: new ol.style.Fill({ color: "#050505ff" }),
              //stroke: new ol.style.Stroke({ color: "#000", width: 3 }),
              offsetY: -15,
            })
          : null,*/
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

  const units = extractUnitsMapa(data);
  updateMap(units);
});

socket.on("orbatChange", () => {
  socket.emit("requestUpdate");
});

// Extraer las unidades con coordenadas del orbat.xml parseado por xml2js
function extractUnitsMapa(obj) {
  const results = [];
  searchUnits(obj, results);
  return results;
}

function searchUnits(node, results, parentName = null, formationName = null) {
  if (!node || typeof node !== "object") return;

  // Si el nodo actual es un <formation>, guardamos su nombre
  if (node.$?.name && node.hasOwnProperty("automat")) {
    formationName = node.$.name;
  }

  // Si el nodo actual es un <automat>, guardamos su nombre como padre
  if (node.$?.name && node.unit) {
    parentName = node.$.name;
  }

  if (node.unit) {
    (node.unit || []).forEach((u) => {
      if (u.position && u.position[0]?.$?.x && u.position[0]?.$?.y) {
        let opState = null;
        if (u.equipments && u.equipments[0]?.$?.["operational-state"]) {
          opState = parseFloat(u.equipments[0].$["operational-state"]) * 100;
        }

        results.push({
          name: u.$?.name || "Unit",
          parentName: parentName || "Sin automat",
          formationName: formationName || "Sin formation", // 👈 Nueva propiedad
          x: parseFloat(u.position[0].$.x),
          y: parseFloat(u.position[0].$.y),
          mgrs: u.position[0]._?.trim() || null,
          percentage: opState || 0,
        });
      }
    });
  }

  Object.values(node).forEach((child) => {
    if (Array.isArray(child)) {
      child.forEach((c) => searchUnits(c, results, parentName, formationName));
    } else if (typeof child === "object") {
      searchUnits(child, results, parentName, formationName);
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
  const view = map.getView();

  // 🔹 Obtener los features actuales del mapa
  const existingFeatures = unitSource.getFeatures();
  const featureMap = new Map(existingFeatures.map((f) => [f.get("name"), f]));

  units.forEach((u) => {
    if (!u.mgrs) return;
    const [lon, lat] = mgrsToLatLon(u.mgrs);
    if (!lon || !lat) return;

    let feature = featureMap.get(u.name);

    // === Si el feature ya existe → solo actualizar ===
    if (feature) {
      // 📌 Actualizar posición solamente si cambió
      const geom = feature.getGeometry();
      const newCoords = ol.proj.fromLonLat([lon, lat]);
      geom.setCoordinates(newCoords);

      // 🎯 Detectar ataque comparando historial
      const prev = previousStates[u.name];
      if (!window.isTimelineActive) {
        if (prev !== undefined && u.percentage < prev) {
          alertVoice(`Unidad ${u.name} bajo ataque`);
          flashUnit(u.name);
        }
      }

      previousStates[u.name] = u.percentage;

      // 🎨 Actualizar color y atributos
      feature.setProperties({
        percentage: u.percentage,
        formationName: u.formationName,
        parentName: u.parentName,
        color:
          u.percentage < 34
            ? "#f4a9a9"
            : u.percentage < 67
            ? "yellow"
            : "#99e699",
      });
    } else {
      // === ⚠ Si no existe, es nueva unidad → la creamos ===
      const newFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
        formationName: u.formationName,
        parentName: u.parentName,
        name: u.name,
        percentage: u.percentage,
        color:
          u.percentage < 34
            ? "#f4a9a9"
            : u.percentage < 67
            ? "yellow"
            : "#99e699",
      });
      unitSource.addFeature(newFeature);
    }
  });

  // 👁 Mantener vista sin mover ni recargar nada
  view.setCenter(view.getCenter());
  view.setZoom(view.getZoom());
}

//fuincion para mapa con linea de tiempo********************
//******************************************************** */
function processOrbatForMap(xmlDoc) {
  const units = [];

  function recursiveSearch(node, parentName = null, formationName = null) {
    if (!node || !node.tagName) return; // Ignorar nodos no válidos

    // Detectar <formation>
    if (node.tagName === "formation" && node.getAttribute("name")) {
      formationName = node.getAttribute("name");
    }

    // Detectar <automat>
    if (node.tagName === "automat" && node.getAttribute("name")) {
      parentName = node.getAttribute("name");
    }

    // Detectar <unit>
    if (node.tagName === "unit") {
      const position = node.querySelector("position");
      const equipments = node.querySelector("equipments");

      if (position) {
        const mgrs = (position.textContent || "").trim();
        const x = parseFloat(position.getAttribute("x"));
        const y = parseFloat(position.getAttribute("y"));

        let percentage = 0;
        if (equipments && equipments.getAttribute("operational-state")) {
          percentage =
            parseFloat(equipments.getAttribute("operational-state")) * 100;
        }

        units.push({
          name: node.getAttribute("name") || "Sin nombre",
          parentName: parentName || "Sin padre",
          formationName: formationName || "Sin formation",
          mgrs,
          x,
          y,
          percentage,
        });
      }
    }

    // Recorrer los HIJOS reales (ElementNodes)
    Array.from(node.children).forEach((child) =>
      recursiveSearch(child, parentName, formationName)
    );
  }

  recursiveSearch(xmlDoc.documentElement); // Inicia desde raíz
  updateMap(units); // ⬅️ Usa tu función original, sin tocarla
}

function flashUnit(unitName) {
  const feature = unitSource
    .getFeatures()
    .find((f) => f.get("name") === unitName);
  if (!feature) return;

  feature.setStyle(
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: 15,
        fill: new ol.style.Fill({ color: "rgba(255,0,0,0.8)" }),
        stroke: new ol.style.Stroke({ color: "#fff", width: 2 }),
      }),
    })
  );

  // Restaurar el estilo luego de 2 segundos
  setTimeout(() => {
    feature.setStyle(null);
  }, 2000);
}

function alertVoice(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "es-ES"; // o "en-US"
  msg.rate = 1;
  speechSynthesis.speak(msg);
}

// Capa de puntos con estilo visible
const unitLayer = new ol.layer.Vector({
  source: unitSource,
  style: function (feature, resolution) {
    const zoom = map.getView().getZoom();

    // No mostrar nada si estamos muy lejos
    if (zoom < 12) {
      return null;
    }

    // Punto base
    let baseStyle = new ol.style.Style({
      image: new ol.style.Circle({
        radius: zoom < 11 ? 6 : 10, // más pequeño si el zoom es bajo
        fill: new ol.style.Fill({ color: feature.get("color") }),
        stroke: new ol.style.Stroke({ color: "#000", width: 1 }),
      }),
    });

    // Mostrar texto solo si el zoom es alto
    /*if (zoom >= 1) {
      baseStyle.setText(
        new ol.style.Text({
          text: `${feature.get("name")} (${feature.get("percentage") || 0}%)`,
          font: "bold 12px Arial",
          fill: new ol.style.Fill({ color: "#ffffff" }),
          stroke: new ol.style.Stroke({ color: "#000000", width: 3 }),
          offsetY: -15,
        })
      );
    }*/

    return baseStyle;
  },
});

map.addLayer(unitLayer);
