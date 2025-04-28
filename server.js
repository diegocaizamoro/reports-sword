const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const xml2js = require("xml2js");
const chokidar = require("chokidar");
const path = require("path");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

// Habilitar CORS para evitar bloqueos en el navegador
app.use(cors({ origin: "*" }));

const io = socketIo(server, {
    cors: {
        origin: "*", // Puedes cambiarlo por ['http://127.0.0.1:5500'] si usas Live Server
        methods: ["GET", "POST"]
    }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta única para /orbat
// Ruta única para /orbat
app.get("/orbat", (req, res) => {
    fs.readFile("orbat.xml", "utf8", (err, data) => {
        if (err) {
            console.error("❌ Error al enviar orbat.xml:", err);
            return res.status(500).send(err);
        }
        console.log("📄 orbat.xml enviado");
        res.send(data);
    });
});

// Función para enviar actualización del orbat.xml
function sendOrbatUpdate(socket) {
    console.log("🔄 Ejecutando sendOrbatUpdate");

    if (!fs.existsSync("orbat.xml")) {
        console.error("⚠️ El archivo orbat.xml no existe.");
        socket.emit("orbatUpdate", null);
        return;
    }

    // Esperar 500ms antes de leer para asegurar que el archivo no esté siendo escrito aún
    setTimeout(() => {
        fs.readFile("orbat.xml", "utf8", (err, data) => {
            if (err) {
                console.error("❌ Error al leer el archivo:", err);
                socket.emit("orbatUpdate", null);
                return;
            }

            console.log("📄 Contenido de orbat.xml después de esperar:");

            if (!data || data.trim() === "") {
                console.error("⚠️ El archivo orbat.xml está vacío.");
                socket.emit("orbatUpdate", null);
                return;
            }

            const wrappedXml = `<root>${data}</root>`;

            xml2js.parseString(wrappedXml, { explicitRoot: false }, (err, result) => {
                if (err) {
                    console.error("❌ Error al analizar XML:", err.message);
                    socket.emit("orbatUpdate", null);
                    return;
                }

                console.log("✅ Enviando actualización de orbat.xml al cliente:");
                socket.emit("orbatUpdate", result);
            });
        });
    }, 500); // Espera 500ms antes de leer el archivo
}

// Observador para cambios en orbat.xml
// Observador para cambios en orbat.xml
chokidar.watch("orbat.xml").on("change", () => {
    console.log("📝 El archivo orbat.xml ha sido modificado.");

    setTimeout(() => {
        fs.readFile("orbat.xml", "utf8", (err, data) => {
            if (err) {
                console.error("❌ Error al leer orbat.xml:", err);
                return;
            }

            if (!data || data.trim() === "") {
                console.error("⚠️ El archivo orbat.xml está vacío.");
                return;
            }

            // Contar atributos name
            const nameCount = {};
            const nameReplacements = {};
            const regex = /name=['"]([^'"]+)['"]/gi;
            let match;
            let totalNames = 0;

            while ((match = regex.exec(data)) !== null) {
                totalNames++;
                const originalName = match[1];

                // Si ya existe ese nombre, hay que modificar
                if (nameCount[originalName]) {
                    const puntos = ".".repeat(nameCount[originalName]);
                    const newName = originalName + puntos;
                    nameReplacements[match.index] = newName; // guardamos la posición y el nuevo name
                    nameCount[originalName]++;
                } else {
                    nameCount[originalName] = 1;
                }
            }

            console.log("🔍 Total de atributos name encontrados:", totalNames);

            let hayDuplicados = Object.values(nameCount).some(count => count > 1);

            if (!hayDuplicados) {
                console.log("✅ No se encontraron nombres repetidos.");
                io.emit("orbatChange");
                return;
            }

            // Ahora reescribimos el contenido corregido
            let correctedData = "";
            let lastIndex = 0;
            const sortedIndexes = Object.keys(nameReplacements).map(Number).sort((a, b) => a - b);

            sortedIndexes.forEach(index => {
                correctedData += data.slice(lastIndex, index); // todo lo que había antes del name
                const subMatch = /name=['"]([^'"]+)['"]/.exec(data.slice(index));
                if (subMatch) {
                    const matchLength = subMatch[0].length;
                    correctedData += `name="${nameReplacements[index]}"`;
                    lastIndex = index + matchLength;
                }
            });

            correctedData += data.slice(lastIndex); // agregar el resto del archivo

            // Escribir archivo corregido
            fs.writeFile("orbat.xml", correctedData, "utf8", (err) => {
                if (err) {
                    console.error("❌ Error al escribir orbat.xml corregido:", err);
                    return;
                }
                console.log("✅ orbat.xml corregido exitosamente (nombres únicos).");

                // Después de corregir, emitir cambio a clientes
                io.emit("orbatChange");
            });
        });
    }, 500); // Espera 500ms antes de leer
});



// Manejador de conexión de sockets
io.on("connection", (socket) => {
    console.log("✅ Cliente conectado:", socket.id);
    sendOrbatUpdate(socket);

    socket.on("requestUpdate", () => {
        console.log("🔄 Cliente solicitó actualización de orbat.xml");
        sendOrbatUpdate(socket);
    });

    // Enviar fecha actual cada 5 segundos (solo como ejemplo)
    setInterval(() => {
        const fechaActual = new Date().toLocaleString();
        socket.emit("actualizar_fecha", fechaActual);
    }, 5000);

    socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
    });
});

// Iniciar el servidor en el puerto 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
