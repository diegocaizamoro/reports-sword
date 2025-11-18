function limpiarConsumoPorRecurso(consumoPorRecurso) {
    const palabrasProhibidas = ["Food", "Water", "Diesel", "Kerosene"];

    const nuevoMap = new Map();

    for (const [clave, valor] of consumoPorRecurso.entries()) {
        const contieneProhibida = palabrasProhibidas.some(p => clave.includes(p));

        if (!contieneProhibida) {
            nuevoMap.set(clave, valor);
        }
    }

    return nuevoMap;
}


function generarColorAleatorio() {
    let nuevoColor;
    do {
        const r = Math.floor(Math.random() * 156 + 100);
        const g = Math.floor(Math.random() * 156 + 100);
        const b = Math.floor(Math.random() * 156 + 100);
        nuevoColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
    } while (nuevoColor === ultimoColor); // repetir hasta que sea distinto

    ultimoColor = nuevoColor;
    return nuevoColor;
}

//funcion para muertos generar colres
function generarColoresUnicosMuertos(cantidad) {
    const colores = [];
    for (let i = 0; i < cantidad; i++) {
        const hue = Math.floor((360 / cantidad) * i); // separa los tonos en el círculo cromático
        colores.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colores;
}


//funcion para dona generar colres
function generarColoresUnicos(cantidad) {
    const colores = [];
    for (let i = 0; i < cantidad; i++) {
        const hue = Math.floor((360 / cantidad) * i); // separa los tonos en el círculo cromático
        colores.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colores;
}