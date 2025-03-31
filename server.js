const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const xml2js = require('xml2js');
const chokidar = require('chokidar');
const path = require('path'); // Agregar esta línea

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Sirve archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname))); // Agregar esta línea

// Sirve el archivo orbat.xml al frontend
app.get('/orbat', (req, res) => {
    fs.readFile('orbat.xml', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(data);
        }
    });
});

// Función para analizar el XML y enviar los datos actualizados
function sendOrbatUpdate(socket) {
    fs.readFile('orbat.xml', 'utf8', (err, data) => {
        if (!err) {
            xml2js.parseString(data, (err, result) => {
                if (!err) {
                    socket.emit('orbatUpdate', result);
                }
            });
        }
    });
}

// Monitorea los cambios en orbat.xml y envía actualizaciones a los clientes conectados
chokidar.watch('orbat.xml').on('change', () => {
    io.emit('orbatChange'); // Informa a los clientes que el archivo ha cambiado
});

io.on('connection', (socket) => {
    console.log('Client connected');
    sendOrbatUpdate(socket); // Envía los datos iniciales al cliente recién conectado

    socket.on('requestUpdate', () => {
        sendOrbatUpdate(socket); // Envía los datos actualizados cuando el cliente lo solicita
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});