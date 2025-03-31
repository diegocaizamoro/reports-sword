const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const xml2js = require('xml2js');
const chokidar = require('chokidar');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname)));

// Ruta única para /orbat
app.get('/orbat', (req, res) => {
    fs.readFile('orbat.xml', 'utf8', (err, data) => {
        if (err) {
            console.error('Error al enviar orbat.xml:', err);
            return res.status(500).send(err);
        }
        console.log('orbat.xml enviado');
        res.send(data);
    });
});

// Función para enviar actualización del orbat.xml
function sendOrbatUpdate(socket) {
    console.log('Ejecutando sendOrbatUpdate');

    if (!fs.existsSync('orbat.xml')) {
        console.error('El archivo orbat.xml no existe.');
        socket.emit('orbatUpdate', null);
        return;
    }

    // Esperar 500ms antes de leer para asegurar que el archivo no esté siendo escrito aún
    setTimeout(() => {
        fs.readFile('orbat.xml', 'utf8', (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                socket.emit('orbatUpdate', null);
                return;
            }

            console.log('Contenido de orbat.xml después de esperar:', JSON.stringify(data));

            if (!data || data.trim() === '') {
                console.error('El archivo orbat.xml está vacío.');
                socket.emit('orbatUpdate', null);
                return;
            }

            const wrappedXml = `<root>${data}</root>`;

            xml2js.parseString(wrappedXml, { explicitRoot: false }, (err, result) => {
                if (err) {
                    console.error('Error al analizar XML:', err.message);
                    socket.emit('orbatUpdate', null);
                    return;
                }

                console.log('Enviando actualización de orbat.xml al cliente:', result);
                socket.emit('orbatUpdate', result);
            });
        });
    }, 500); // Espera 500ms antes de leer el archivo
}




// Observador para cambios en orbat.xml
chokidar.watch('orbat.xml').on('change', () => {
    console.log('El archivo orbat.xml ha sido modificado.');

    setTimeout(() => {
        io.emit('orbatChange');
    }, 500); // Espera 500 ms antes de emitir el cambio
});


// Manejador de conexión de sockets
io.on('connection', (socket) => {
    console.log('Cliente conectado');
    sendOrbatUpdate(socket);  // Aquí debe ejecutarse la función

    socket.on('requestUpdate', () => {
        console.log('Cliente solicitó actualización de orbat.xml');
        sendOrbatUpdate(socket);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Iniciar el servidor
server.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
