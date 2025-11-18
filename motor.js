const fs = require('fs');
const xml2js = require('xml2js');
const express = require('express');

const app = express();
const port = 3000;

// 1️⃣ Convertir XML a JSON
function convertXMLtoJSON(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) return reject(err);
            xml2js.parseString(data, { mergeAttrs: true, explicitArray: false }, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    });
}

// 2️⃣ Extraer información clave del JSON
async function generateReport() {
    try {
        const jsonData = await convertXMLtoJSON('orbat.xml');
        // Verificar si `party` es un array
        let parties = jsonData?.orbat?.parties?.party || [];

// Acceder a los objetos
        let objects = parties.flatMap(p => p?.objects?.object || []);
        let units = parties.flatMap(p => p?.tactical?.formation?.formation?.formation?.unit || []);
        console.log("objects", objects);
        console.log("units", units);
        //console.log("JSON Completo:", JSON.stringify(jsonData, null, 2));


        // Contar tipos de objetos
        let objectTypes = {};
        objects.forEach(obj => {
            let type = obj.type;
            objectTypes[type] = (objectTypes[type] || 0) + 1;
            console.log("objectTypes", objectTypes[type]);

        });

        // Contar tipos de unidades
        let unitTypes = {};
        units.forEach(unit => {
            let type = unit.type;
            unitTypes[type] = (unitTypes[type] || 0) + 1;
        });

        return { objectTypes, unitTypes };

    } catch (error) {
        console.error("Error:", error);
    }
}

// 3️⃣ Servir datos JSON y HTML con gráficos
app.get('/data', async (req, res) => {
    let report = await generateReport();
    res.json(report);
});

app.get('/', (req, res) => {
    res.send(`
    <html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
        <h2>Reporte de ORBATfgfh</h2>
        <canvas id="objectsChart" width="400" height="200"></canvas>
        <canvas id="unitsChart" width="400" height="200"></canvas>
        <script>
            fetch('/data')
            .then(response => response.json())
            .then(data => {
                let ctx1 = document.getElementById('objectsChart').getContext('2d');
                new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(data.objectTypes),
                        datasets: [{
                            label: 'Cantidad de Objetos',
                            data: Object.values(data.objectTypes),
                            backgroundColor: 'blue'
                        }]
                    }
                });

                let ctx2 = document.getElementById('unitsChart').getContext('2d');
                new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(data.unitTypes),
                        datasets: [{
                            label: 'Cantidad de Unidades',
                            data: Object.values(data.unitTypes),
                            backgroundColor: 'red'
                        }]
                    }
                });
            });
        </script>
    </body>
    </html>
    `);
});

// 4️⃣ Iniciar servidor en localhost
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
