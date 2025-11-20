
let bando = "friend"
let colorBando = "0x0055ff"
let serverEscucha = "http://localhost:3000/orbat.xml"
let ultimoColor = null;
let xmlDoc;
const resourceNamesLimpios = [];
const consumoPorRecurso = new Map();
const asignadoPorRecurso = new Map();
/*window.onload = function () {
    //fetch('https://raw.githubusercontent.com/diegocaizamoro/reports-sword/refs/heads/main/orbat.xml') // para produccion
    fetch(serverEscucha) //para pruebas
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo cargar el archivo orbat.xml");
            }
            return response.text();
        })
        .then(xmlText => {
            parseXML(xmlText);
        })
        .catch(error => console.error("Error al cargar el ORBAT:", error));
};*/

window.onload = function () {
  if (window.isTimelineActive) {
    console.log("Timeline activo: no se carga serverEscucha");
    return; // Evita cargar desde serverEscucha
  }
  fetchFromServer();
};

// Convertimos el código que tenías a una función reutilizable
function fetchFromServer() {
  fetch(serverEscucha)
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo orbat.xml");
      }
      return response.text();
    })
    .then(xmlText => {
      parseXML(xmlText); // Procesa mapa y árbol normalmente
    })
    .catch(error => console.error("Error al cargar el ORBAT:", error));
}


function parseXML(xmlText) {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(xmlText, "text/xml");
    window.xmlDoc = parser.parseFromString(xmlText, "application/xml");


    // Buscar el nodo <parties> principal
    const partiesNode = xmlDoc.getElementsByTagName("parties")[0];
    if (!partiesNode) {
        console.error("No se encontró el nodo <parties>");
        return;
    }

    // Obtener SOLO los <party> dentro de <parties> que tengan type="enemy"
    const parties = Array.from(partiesNode.getElementsByTagName("party"))
        .filter(party => party.getAttribute("type") === bando);

    const treeContainer = document.getElementById("treeContent");
    treeContainer.innerHTML = ""; // Limpiar contenido anterior

    let ul = document.createElement("ul");
    ul.className = "tree";

    parties.forEach(party => {
        const partyName = party.getAttribute("name");

        let liParty = document.createElement("li");
        liParty.textContent = partyName;
        liParty.className = "folder";
        liParty.onclick = function (event) { toggleChildren(event, this); };

        let ulTactical = document.createElement("ul");
        ulTactical.className = "tree hidden";

        const tactical = party.getElementsByTagName("tactical")[0];
        if (tactical) {
            extractFormations(tactical, ulTactical);
        }

        liParty.appendChild(ulTactical);
        ul.appendChild(liParty);
    });

    treeContainer.appendChild(ul);
}

function extractUnits(automatNode, parentElement) {
    // Verificar si el automat pertenece a un <party type="enemy">
    let currentNode = automatNode;
    let isEnemy = false;

    while (currentNode) {
        if (currentNode.tagName === "party") {
            isEnemy = currentNode.getAttribute("type") === bando;
            break;
        }
        currentNode = currentNode.parentElement;
    }

    if (!isEnemy) return 0; // Salir si no pertenece a un party enemigo

    const units = automatNode.children;
    let operationalValues = [];

    Array.from(units).forEach(unit => {
        if (unit.tagName === "unit") {
            const unitName = unit.getAttribute("name");
            let equipments = unit.getElementsByTagName("equipments")[0];

            let operationalState = equipments && equipments.getAttribute("operational-state")
                ? parseFloat(equipments.getAttribute("operational-state"))
                : 0;

            operationalValues.push(operationalState);

            let liUnit = document.createElement("li");
            liUnit.className = "file";
            liUnit.textContent = unitName;

            let progressBar = createProgressBar(operationalState, unitName);
            liUnit.appendChild(progressBar);
            parentElement.appendChild(liUnit);

        }
    });

    let avgOperational = operationalValues.length > 0
        ? operationalValues.reduce((a, b) => a + b, 0) / operationalValues.length
        : 0;

    return avgOperational;
}


function extractAutomats(formationNode, parentElement) {
    // Verifica si forma parte de un party enemy
    let current = formationNode;
    let isEnemy = false;

    while (current) {
        if (current.tagName === "party") {
            isEnemy = current.getAttribute("type") === bando;
            break;
        }
        current = current.parentElement;
    }

    if (!isEnemy) return 0; // Ignora si no es enemigo

    const automats = formationNode.children;
    let operationalValues = [];

    Array.from(automats).forEach(automat => {
        if (automat.tagName === "automat") {
            let liAutomat = document.createElement("li");
            liAutomat.className = "folder";
            liAutomat.textContent = automat.getAttribute("name");

            let ulUnits = document.createElement("ul");
            ulUnits.className = "tree hidden";

            let avgOperational = extractUnits(automat, ulUnits);
            operationalValues.push(avgOperational);

            let progressBar = createProgressBar(avgOperational, liAutomat.textContent);
            liAutomat.appendChild(progressBar);
            liAutomat.appendChild(ulUnits);
            liAutomat.onclick = function (event) { toggleChildren(event, this); };

            parentElement.appendChild(liAutomat);
        }
    });

    return operationalValues.length > 0
        ? operationalValues.reduce((a, b) => a + b, 0) / operationalValues.length
        : 0;
}


function calculateAvgOperationalFromUnits(node) {
    let unitStates = [];

    function recurse(currentNode) {
        if (currentNode.tagName === "unit") {
            let equipments = currentNode.getElementsByTagName("equipments")[0];
            let opState = equipments?.getAttribute("operational-state");
            if (opState !== null && opState !== undefined) {
                unitStates.push(parseFloat(opState));
            }
        }

        Array.from(currentNode.children || []).forEach(child => recurse(child));
    }

    recurse(node);

    if (unitStates.length === 0) return 0;
    return unitStates.reduce((a, b) => a + b, 0) / unitStates.length;
}

function extractFormations(parentNode, parentElement) {
    let current = parentNode;
    let isEnemy = false;

    while (current) {
        if (current.tagName === "party") {
            isEnemy = current.getAttribute("type") === bando;
            break;
        }
        current = current.parentElement;
    }

    if (!isEnemy) return 0;

    const formations = Array.from(parentNode.children).filter(child => child.tagName === "formation");
    let totalOperationalValues = [];

    formations.forEach(formation => {
        const formationName = formation.getAttribute("name");

        let liFormation = document.createElement("li");
        liFormation.textContent = formationName;
        liFormation.className = "folder";
        liFormation.onclick = function (event) { toggleChildren(event, this); };

        let ulSubFormations = document.createElement("ul");
        ulSubFormations.className = "tree hidden";

        extractFormations(formation, ulSubFormations); // construir el árbol
        extractAutomats(formation, ulSubFormations);   // construir los automats

        // Aquí es donde se aplica la nueva lógica
        let avgOperational = calculateAvgOperationalFromUnits(formation);

        let progressBar = createProgressBar(avgOperational, formationName);
        liFormation.appendChild(progressBar);
        liFormation.appendChild(ulSubFormations);
        parentElement.appendChild(liFormation);

        totalOperationalValues.push(avgOperational);
    });

    return totalOperationalValues.length > 0
        ? totalOperationalValues.reduce((a, b) => a + b, 0) / totalOperationalValues.length
        : 0;
}

function createProgressBar(value, unitName) {
    let percentage = Math.max(0, Math.min(value * 100, 100));
    let color = percentage < 34 ? "#f4a9a9" : percentage < 67 ? "yellow" : "#99e699";

    let container = document.createElement("div");
    container.className = "progress-container";
    container.setAttribute("name", unitName);  // Asigna el nombre de la unidad al contenedor

    let bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = percentage + "%";
    bar.style.backgroundColor = color;
    bar.style.position = "relative";
    bar.style.textAlign = "center";
    bar.style.color = "black";
    bar.style.fontSize = "15px";
    bar.style.lineHeight = "15px"; // Centrar el texto verticalmente
    bar.textContent = Math.floor(percentage) + "%"; // Agregar el porcentaje dentro de la barra
    container.appendChild(bar);
    return container;
}

function toggleChildren(event, element) {
    event.stopPropagation();
    let children = element.querySelector("ul");
    // Buscar el <ul> hijo inmediato (si existe)
    const span = element.querySelector(".progress-container") || element.querySelector("span");
    const padre = span?.getAttribute("name") || span?.textContent?.trim() || "[sin nombre]";
    resourceNamesLimpios.length = 0;
    consumoPorRecurso.clear();
    asignadoPorRecurso.clear();
    if (children) {
        let isHidden = children.classList.contains("hidden");
        children.classList.toggle("hidden", !isHidden);
        element.classList.toggle("open", isHidden);
        actualizarGraficoDesdeNodo(padre, children);
    }
}

//funcion donde imprime los hijos inmediatos
function printImmediateChildren(ulElement) {
    const liChildren = Array.from(ulElement.children).filter(child => child.tagName === "LI");

    //console.log("📂 Hijos inmediatos:");
    liChildren.forEach(child => {
        let nameSpan = Array.from(child.children).find(el => el.tagName === "SPAN");

        if (nameSpan) {
           // console.log("- " + nameSpan.textContent.trim());
        } else {
            // Captura el texto directo del <li> (ignorando el <ul>)
            const directText = child.firstChild?.textContent?.trim();
            if (directText) {
                //console.log("- " + directText);
            } else {
                //console.log("⚠️ Nodo hijo sin nombre visible");
            }
        }
    });
}
// Refrescar valores de orbat.xml cada 8s sin reconstruir el árbol
setInterval(() => {

    // 🚫 Si está activada la línea de tiempo, NO actualizar desde servidor
    if (window.isTimelineActive) {
        console.log("⏸ Timeline activa: no se actualiza desde serverEscucha");
        return;
    }
    fetch(serverEscucha)
        .then(response => response.text())
        .then(xmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            // Obtener todos los elementos con atributo "name"
            const elementsWithName = xmlDoc.querySelectorAll('[name]');
            const nameMap = new Map();

            elementsWithName.forEach(el => {
                let originalName = el.getAttribute("name");
                let count = nameMap.get(originalName) || 0;

                if (count > 0) {
                    // Agregar puntos al nombre
                    let newName = originalName + '.'.repeat(count);
                    el.setAttribute("name", newName);
                }

                // Actualizar el contador
                nameMap.set(originalName, count + 1);
            });

            updateOperationalValues(xmlDoc);
        })
        .catch(err => console.error("Error actualizando valores ORBAT:", err));
}, 8000);

// Escapar nombre seguro
function cssEscape(str) {
    return str.replace(/([ !"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

function updateOperationalValues(xmlDoc) {
    const parties = Array.from(xmlDoc.getElementsByTagName("party"))
        .filter(party =>
            party.getAttribute("type") === bando &&
            party.getAttribute("color") === colorBando
        );

    parties.forEach(party => {
        const unitMap = new Map();
        const tactical = party.querySelector("tactical");
        if (!tactical) return;

        // ========== 1. UNITS ==========
        const automats = Array.from(
            tactical.querySelectorAll(`automat[color='${colorBando}']`)
        );

        automats.forEach(automat => {
            const units = Array.from(automat.getElementsByTagName("unit"))
                .filter(unit =>
                    unit.getAttribute("color") === colorBando &&
                    unit.getElementsByTagName("unit").length === 0 &&
                    party.contains(unit) // asegura que esté en este party
                );

            units.forEach(unit => {
                const unitName = unit.getAttribute("name");
                const equipments = unit.getElementsByTagName("equipments")[0];
                const operationalState = equipments && equipments.getAttribute("operational-state")
                    ? parseFloat(equipments.getAttribute("operational-state"))
                    : 0;

                if (!unitMap.has(unitName)) {
                    unitMap.set(unitName, operationalState);

                    const safeName = cssEscape(unitName);
                    const container = document.querySelector(`.progress-container[name="${safeName}"]`);
                    if (container) updateProgressBar(container, operationalState);
                }
            });
        });

        // ========== 2. AUTOMATS ==========
        automats.forEach(automat => {
            const automatName = automat.getAttribute("name");

            const units = Array.from(automat.getElementsByTagName("unit"))
                .filter(unit =>
                    unit.getAttribute("color") === colorBando &&
                    unit.getElementsByTagName("unit").length === 0 &&
                    party.contains(unit)
                );

            let total = 0;
            let count = 0;

            units.forEach(unit => {
                const name = unit.getAttribute("name");
                if (unitMap.has(name)) {
                    total += unitMap.get(name);
                    count++;
                }
            });

            /*if (automatName === "VCI 1/4") {
                units.forEach(unit => {
                    const name = unit.getAttribute("name");
                    const id = unit.getAttribute("id");
                    console.log(name, id)
                });

            }*/

            const avg = count > 0 ? total / count : 0;
            unitMap.set(automatName, avg);

            const safeName = cssEscape(automatName);
            const container = document.querySelector(`.progress-container[name="${safeName}"]`);
            if (container) updateProgressBar(container, avg);
        });

        // ========== 3. FORMATIONS ==========
        const formations = Array.from(
            tactical.querySelectorAll(`formation[color='${colorBando}']`)
        ).reverse();


        formations.forEach(formation => {
            const formationName = formation.getAttribute("name");
            let total = 0;
            let count = 0;

            const children = Array.from(formation.children);

            const automatNodes = children
                .filter(child => child.tagName === "automat" && child.getAttribute("color") === colorBando);
            automatNodes.forEach(automat => {
                const name = automat.getAttribute("name");
                if (unitMap.has(name)) {
                    total += unitMap.get(name);
                    count++;
                }
            });

            const subFormations = children
                .filter(child => child.tagName === "formation" && child.getAttribute("color") === colorBando);
            subFormations.forEach(sub => {
                const name = sub.getAttribute("name");
                if (unitMap.has(name)) {
                    total += unitMap.get(name);
                    count++;
                }
            });

            const avg = count > 0 ? total / count : 0;
            unitMap.set(formationName, avg);

            const safeName = cssEscape(formationName);
            const container = document.querySelector(`.progress-container[name="${safeName}"]`);
            if (container) updateProgressBar(container, avg);
        });

        // ========== 4. PARTY ==========
        const partyName = party.getAttribute("name");
        let total = 0;
        let count = 0;

        const rootFormations = Array.from(tactical.children)
            .filter(f => f.tagName === "formation" && f.getAttribute("color") === colorBando);

        rootFormations.forEach(formation => {
            const name = formation.getAttribute("name");
            if (unitMap.has(name)) {
                total += unitMap.get(name);
                count++;
            }
        });

        const avg = count > 0 ? total / count : 0;
        unitMap.set(partyName, avg);

        const safeName = cssEscape(partyName);
        const container = document.querySelector(`.progress-container[name="${safeName}"]`);
        if (container) updateProgressBar(container, avg);
    });
}

function updateProgressBar(container, value) {
    const bar = container.querySelector(".progress-bar");

    const percentage = Math.max(0, Math.min(value * 100, 100));
    const color = percentage < 34 ? "#f4a9a9" : percentage < 67 ? "yellow" : "#99e699";

    bar.style.width = percentage + "%";
    bar.style.backgroundColor = color;
    bar.textContent = Math.floor(percentage) + "%";
}




function contarMuertosDesdeNombre(nombreUnidad) {
    if (!window.xmlDoc) {
        console.warn("❌ xmlDoc no cargado");
        return 0;
    }

    // Buscar nodo en el XML que tenga atributo name que comience con el nombre dado
    const nodoRaiz = Array.from(window.xmlDoc.querySelectorAll("[name]"))
        .find(n => n.getAttribute("name") === nombreUnidad || n.getAttribute("name")?.startsWith(nombreUnidad));

    if (!nodoRaiz) {
        console.warn(`⚠️ No se encontró nodo XML con name="${nombreUnidad}"`);
        return 0;
    }

    // Recursivamente contar muertos a partir de ese nodo
    return contarMuertosRecursivo(nodoRaiz);
}

function contarMuertosRecursivo(xmlNode) {
    let muertos = 0;
    let vivos = 0;
    let heridos = 0;

    // Si el nodo es unit y tiene equipments
    if (xmlNode.tagName === "unit") {
        const equipmentList = xmlNode.querySelectorAll("equipment");

        /*equipmentList.forEach(eq => {
            const humans = eq.querySelectorAll("human");
            humans.forEach(h => {
                if (h.hasAttribute("state")) {
                    const state = h.getAttribute("state");

                    if (state === "dead" || state === "u3") {
                        muertos++;
                    }
                } else {
                    // NO tiene atributo state
                    vivos++;
                }
            });
        });*/
        //se aregla la funcion para que calcule vivos, muertos y heridos
        equipmentList.forEach(eq => {
            const humans = eq.querySelectorAll("human");
            humans.forEach(h => {
                if (h.hasAttribute("state")) {
                    const state = h.getAttribute("state");

                    if (state === "dead") {
                        muertos++;
                    }
                    /* if (state === "ue") {
                                           
                     }*/

                } else {
                    // NO tiene atributo state
                    vivos++;
                }
                if (h.hasAttribute("injury")) {
                    heridos++;
                    //console.log("herido encontrado", heridos)
                }

            });
        });

        // Verifica también los humanos fuera de <equipment> si es necesario:
        const allHumans = document.querySelectorAll("human");
        //console.log("Total de humanos en todo el documento:", allHumans.length);




        const resourcetList = xmlNode.querySelectorAll("resource");
        resourcetList.forEach(r => {
            const rawName = r.getAttribute("name");
            const consumoStr = r.getAttribute("total-consumption");
            const asignadoStr = r.getAttribute("quantity");

            if (rawName && consumoStr && asignadoStr) {
                const nombreLimpio = rawName.replace(/\.*$/, "").trim();

                const consumoNum = parseFloat(consumoStr) || 0;
                const asignadoNum = parseFloat(asignadoStr) || 0;

                const consumo = (consumoNum % 1 >= 0.6) ? Math.ceil(consumoNum) : Math.floor(consumoNum);
                const asignado = (asignadoNum % 1 >= 0.6) ? Math.ceil(asignadoNum) : Math.floor(asignadoNum);
                // Sumar al total acumulado
                if (consumoPorRecurso.has(nombreLimpio)) {
                    consumoPorRecurso.set(nombreLimpio, consumoPorRecurso.get(nombreLimpio) + consumo);
                    asignadoPorRecurso.set(nombreLimpio, asignadoPorRecurso.get(nombreLimpio) + asignado);

                } else {
                    consumoPorRecurso.set(nombreLimpio, consumo);
                    asignadoPorRecurso.set(nombreLimpio, asignado);

                }
            }
        });


    }

    // Recorrer hijos recursively (formation, automat, unit)
    const hijos = Array.from(xmlNode.children).filter(n =>
        ["formation", "automat", "unit"].includes(n.tagName)
    );

    hijos.forEach(hijo => {
        //[vivos, muertos] += contarMuertosRecursivo(hijo);
        //vivos += contarMuertosRecursivo(hijo);
        const [v, m, h] = contarMuertosRecursivo(hijo);
        vivos += v;
        muertos += m;
        heridos += h;
    });



    return [vivos, muertos, heridos];
}