// Variable global para controlar modo línea de tiempo
window.isTimelineActive = false;

// --- CONFIGURACIÓN ---
const HISTORY_BASE_URL = "http://127.0.0.1:5500/history/"; // Cambia a GitHub raw URL si lo usas online
let historyFiles = [];
let currentIndex = 0;
let isTimelineActive = false;

// --- ELEMENTOS HTML ---
const timelineContainer = document.getElementById("timelineContainer");
const timelineMarks = document.getElementById("timelineMarks");
const enableTimelineCheckbox = document.getElementById("enableTimeline");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

// --- ACTIVAR / DESACTIVAR TIMELINE ---
/*enableTimelineCheckbox.addEventListener("change", function () {
  isTimelineActive = this.checked;
  timelineContainer.style.display = isTimelineActive ? "block" : "none";

  if (isTimelineActive) {
    loadHistoryFiles();
    console.log("Timeline activado");
  } else {
    // Regresar al modo normal de mapa (fetch(serverEscucha))
    console.log("Timeline desactivado, usando servidor en vivo.");
  }
});*/

// --- CARGAR history.json ---
async function loadHistoryFiles() {
  try {
    const resp = await fetch(HISTORY_BASE_URL + "history.json");
    if (!resp.ok) throw new Error("No se pudo cargar history.json");
    historyFiles = await resp.json();

    renderTimelineMarks();
    currentIndex = 0;
    highlightMark(0);
    loadOrbat(historyFiles[0]);

  } catch (err) {
    console.error("Error cargando history:", err);
  }
}

// --- DIBUJAR LOS PUNTOS EN LA LÍNEA ---
function renderTimelineMarks() {
  timelineMarks.innerHTML = ""; // Limpiar contenido
  historyFiles.forEach((filename, index) => {
    const mark = document.createElement("div");
    mark.className = "time-mark";
    mark.dataset.index = index;

    const label = filename.replace("orbat_", "").replace(".xml", "");

    mark.innerHTML = `
      <div class="dot"></div>
      <div class="time-label">${label}</div>
    `;

    mark.addEventListener("click", function () {
      currentIndex = index;
      highlightMark(index);
      loadOrbat(historyFiles[index]);
    });

    timelineMarks.appendChild(mark);
  });
}

// --- DESTACAR EL PUNTO ACTUAL ---
function highlightMark(index) {
  document.querySelectorAll(".time-mark").forEach((m) =>
    m.classList.remove("active")
  );
  const activeMark = document.querySelector(`.time-mark[data-index="${index}"]`);
  if (activeMark) activeMark.classList.add("active");
}

// --- BOTONES SIGUIENTE / ANTERIOR ---
nextBtn.addEventListener("click", function () {
  if (currentIndex < historyFiles.length - 1) {
    currentIndex++;
    highlightMark(currentIndex);
    loadOrbat(historyFiles[currentIndex]);
  }
});

prevBtn.addEventListener("click", function () {
  if (currentIndex > 0) {
    currentIndex--;
    highlightMark(currentIndex);
    loadOrbat(historyFiles[currentIndex]);
  }
});

// --- CARGAR XML Y ACTUALIZAR MAPA / ÁRBOL ---
function loadOrbat(filename) {
  const url = HISTORY_BASE_URL + filename;
  console.log("Cargando:", url);

  fetch(url)
    .then((r) => r.text())
    .then((xmlText) => {
      parseXML(xmlText); // ⬅️ Tu función actual que procesa XML
    })
    .catch((err) => console.error("Error cargando ORBAT:", err));
}

enableTimelineCheckbox.addEventListener("change", function () {
  window.isTimelineActive = this.checked;
  timelineContainer.style.display = window.isTimelineActive ? "block" : "none";

  if (window.isTimelineActive) {
    loadHistoryFiles(); // Activa timeline
  } else {
    console.log("Timeline desactivado, usando servidor en vivo.");
    fetchFromServer(); // ⬅️ Recupera modo real
  }
});
