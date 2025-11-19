// Doughnut Chart
/*const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
const doughnutChart = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            data: [65, 25, 10],
            backgroundColor: []
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,  // permite que se adapte al div
        plugins: {
            legend: {
                labels: {
                    font: { size: 15, weight: 'bold' }
                }
            }
        }
    }
});*/


// personal
/*const dynamicCtx = document.getElementById('dynamicBarChart').getContext('2d');
const dynamicBarChart = new Chart(dynamicCtx, {
    type: 'bar',
    data: [],
    options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: '',
                font: { size: 14, weight: 'bold' },
                color: '#000'
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderWidth: 1,
                borderColor: '#ccc',
                callbacks: {
                    title: function (context) {
                        // título superior del tooltip (ej. nombre de la unidad)
                        return context[0].label;
                    },
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const valor = context.parsed.x; // eje X, porque es horizontal

                        // calcula el total sumando los datasets para esa barra
                        const total = context.chart.data.datasets
                            .map(ds => ds.data[context.dataIndex])
                            .reduce((a, b) => a + b, 0);

                        // calcula porcentaje
                        const porcentaje = ((valor / total) * 100).toFixed(1);

                        // texto mostrado en el tooltip
                        return `${label}: ${valor} de ${total} (${porcentaje}%)`;
                    }
                }
            },
            legend: { position: 'top' }
        },
        scales: {
            x: { stacked: true },
            y: { stacked: true }
        }
    }
});
*/

// municion
/*const dynamicMunicion = document.getElementById('consumoMunicion').getContext('2d');
const dynamicMunicionBarChart = new Chart(dynamicMunicion, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Munición',
            data: [],
            backgroundColor: [],  // se llena dinámicamente con un color por barra
            borderColor: [],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    font: {
                        size: 15,          // ← tamaño del label
                        weight: 'bold'     // ← negrita
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value}`;
                    }
                }
            },
            datalabels: {
                color: '#000',
                anchor: 'end',
                align: 'right',
                font: {
                    weight: 'bold',
                    size: 12
                },
                formatter: value => value // Muestra el número de muertos
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                // Puedes quitar "max: 100" si deseas que se ajuste automáticamente
            }
        }
    },
    plugins: [ChartDataLabels] // <-- Activa el plugin
});*/

//lineas
/*const linePersonal = document.getElementById('dynamicLineChartPersonal').getContext('2d');
const linePersonalChart = new Chart(linePersonal, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,  // permite que se adapte al div
        plugins: {
            legend: {
                labels: {
                    font: { size: 15, weight: 'bold' }
                }
            }
        }
    }
});*/

//lineas personal
/*const lineMunicion = document.getElementById('lineMunicionHtml').getContext('2d');
const lineMunicionChart = new Chart(lineMunicion, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,  // permite que se adapte al div
        plugins: {
            legend: {
                labels: {
                    font: { size: 15, weight: 'bold' }
                }
            }
        }
    }
});*/


function actualizarGraficoDesdeNodo(padre, nodo) {
    if (!nodo) return;

    const liChildren = Array.from(nodo.children).filter(child => child.tagName === "LI");
    const labels = [];
    const data = [];
    const vivosM = [];
    const muertosM = [];
    const heridosM = [];
    const backgroundColors = [];
    const borderColors = [];
    let totalMuertos = 0;
    let totalVivos = 0;
    let totalHeridos = 0;
    const labelsDonuc = [];
    liChildren.forEach(child => {
        const progress = child.querySelector(".progress-container");
        // Buscar el nodo <unit>, <automat> o <formation> dentro de este <li>
        const nombre = progress?.getAttribute("name") || progress?.textContent?.trim() || "[sin nombre]";
        labels.push(nombre);
        const [vivos, muertos, heridos] = contarMuertosDesdeNombre(nombre);
        vivosM.push(vivos);
        muertosM.push(muertos);
        heridosM.push(heridos);
        const color = generarColorAleatorio();
        backgroundColors.push(color);
        borderColors.push('black');
        totalMuertos += muertos;
        totalVivos += vivos;
        totalHeridos += heridos;


    });

    // 2. Quitar duplicados con Set
    // Limpiar antes de usar
    const limpio = limpiarConsumoPorRecurso(consumoPorRecurso);
    const limpioAsignado = limpiarConsumoPorRecurso(asignadoPorRecurso);
    // Luego extraes los datos
    const labelsMuni = Array.from(limpio.keys());
    const dataMuni = Array.from(limpio.values());

    //const labelsMuniAsignado = Array.from(limpioAsignado.keys());
    const dataMuniAsignado = Array.from(limpioAsignado.values());

    //const labelsMuni = Array.from(consumoPorRecurso.keys()); // Eje X
    //const dataMuni = Array.from(consumoPorRecurso.values()); // Eje Y
    const nombresUnicos = Array.from(new Set(resourceNamesLimpios));
    //console.log("📦 Recursos encontrados:", nombresUnicos);
    const maxConsumo = Math.max(...data, 10); // Valor mínimo por defecto 10
    //dynamicMunicionBarChart.options.scales.x.max = Math.ceil(maxConsumo * 1.1); // 10% más para margen visual

    //solo mayores a cero
    const labelsConValor = [];
    const dataConValor = [];
    const dataAsignadoConValor = [];
    labelsMuni.forEach((label, i) => {
        if (dataMuni[i] > 0) {
            labelsConValor.push(label);
            dataConValor.push(dataMuni[i]);
            dataAsignadoConValor.push(dataMuniAsignado[i]);
        }
    });

    //dynamicMunicionBarChart.data.labels = labelsConValor;        // Eje X
    //dynamicMunicionBarChart.data.datasets[0].data = dataConValor; // Puedes ajustar el valor si tienes cantidades reales
    // Opcional: asignar colores aleatorios
    const backgroundColorsMuertos = generarColoresUnicosMuertos(dataMuni.length);
    //dynamicMunicionBarChart.data.datasets[0].backgroundColor = backgroundColorsMuertos;
    //dynamicMunicionBarChart.data.datasets[0].borderColor = borderColors;
    //dynamicMunicionBarChart.update();





    // barras personal:
    const labelsMeses = labels;
    const datasets = [
        {
            label: 'Vivos',
            data: vivosM,
            backgroundColor: 'rgb(82, 227, 0)'
        },
        {
            label: 'Bajas',
            data: muertosM,
            backgroundColor: 'rgb(39, 30, 0)'
        },
        {
            label: 'Heridos',
            data: heridosM,
            backgroundColor: 'rgba(189, 42, 140, 1)'
        }
    ];
    //actualizarGraficoMultiple(labelsMeses, datasets, padre, totalMuertos, totalVivos, totalHeridos);


    //donuc
    const filteredLabels = [];
    const filteredData = [];

    labelsMuni.forEach((label, i) => {
        if (dataMuni[i] > 0) {
            filteredLabels.push(label);
            filteredData.push(dataMuni[i]);
        }
    });

    // labels.forEach((labelM, i) => {
    /*if (totalMuertos > 0) { comentado antes mandaba los muertos aqui
        filteredLabels.push("muertos");
        filteredData.push(totalMuertos);
    }*/
    //});

    /*const backgroundColorsDona = generarColoresUnicos(filteredData.length);
    doughnutChart.data.labels = filteredLabels;
    doughnutChart.data.datasets[0].data = filteredData;
    doughnutChart.data.datasets[0].backgroundColor = backgroundColorsDona;
    doughnutChart.update();*/


    //lines municion
    /*const datasetsLine = [
        {
            label: 'Asignado',
            data: dataAsignadoConValor,
            backgroundColor: 'rgb(82, 227, 0)'
        },
        {
            label: 'Consumido',
            data: filteredData,
            backgroundColor: 'rgba(244, 7, 66, 1)'
        }
    ];


    lineMunicionChart.data.labels = labelsConValor;//eje x labels
    lineMunicionChart.data.datasets = datasetsLine;
    lineMunicionChart.update();*/


    actualizarGraficoLinePersonal(vivosM, muertosM, heridosM, labelsMeses);
    // Crear el gráfico con los datos simulados
    // 🚀 Ejemplo de datos dinámicos (podrían venir de un API, archivo JSON o base de datos)
    const datosDinamicos = [
        { name: 'Vivos', y: totalVivos },
        { name: 'Muertos', y: totalMuertos },
        { name: 'Heridos', y: totalHeridos }
    ];
    crearGraficoDonutPersonal(datosDinamicos, parseInt(totalVivos + totalMuertos + totalHeridos), padre);

    // Datos dinámicos
    const seriesData = [
        {
            name: 'Vivos',
            data: vivosM
        },
        {
            name: 'Muertos',
            data: muertosM
        },
        {
            name: 'Heridos',
            data: heridosM
        }
    ];
    crearGraficoBarraPersonal(seriesData, labelsMeses, padre)


    // Series dinámicas
    const dataMunicion = [
        { name: 'Asignado', data: dataAsignadoConValor },
        { name: 'Consumo', data: filteredData }

    ];
    crearGraficoBarraMunicion(dataMunicion, labelsConValor, padre);


    const eficienciaM = vivosM.map((v, i) => {
        const h = heridosM[i] || 0;
        const m = muertosM[i] || 0;
        const total = v + h + m;
        return total > 0 ? 100 - (parseFloat((((total - v) / total) * 100).toFixed(2))) : 0;
    });
    const dataSeries = {
        eficiencia: eficienciaM
    };
    crearGraficoLineasPersonal(dataSeries, labelsMeses, padre);



    const eficienciaMuni = dataAsignadoConValor.map((asigna, i) => {
        const consumidoMuni = filteredData[i] || 0;
        return asigna > 0 ? 100 - (((consumidoMuni) / asigna) * 100) : 0;
    });
    const dataSeriesMuni = {
        eficiencia: eficienciaMuni
    };
    crearGraficoLineasMunicion(dataSeriesMuni, labelsConValor, padre);

    //crearGraficoLineaTiempoPersonal(null,null,null);

}

/*function actualizarGraficoMultiple(labels, datasets, padre, muertosTotal = 0, vivosTotal = 0, heridosTotal = 0) {
    dynamicBarChart.data.labels = labels;
    dynamicBarChart.data.datasets = datasets;
    dynamicBarChart.options.plugins.title.text = padre + " - Total efectivos: " + parseInt(muertosTotal + vivosTotal + heridosTotal) + " - Total vivos: " + vivosTotal + " - Total bajas: " + muertosTotal + " - Total heridos: " + heridosTotal;
    dynamicBarChart.update();
}*/

/*function actualizarGraficoLinePersonal(vivos, muertos, labelsConValor) {
    const datasetsLine = [
        {
            label: 'Vivos',
            data: vivos,
            backgroundColor: 'rgb(82, 227, 0)'
        },
        {
            label: 'Muertos',
            data: muertos,
            backgroundColor: 'rgba(244, 7, 66, 1)'
        }
    ];


    linePersonalChart.data.labels = labelsConValor;//eje x labels
    linePersonalChart.data.datasets = datasetsLine;
    linePersonalChart.update();
}*/

/*function actualizarGraficoLinePersonal(vivos, muertos, labelsConValor) {
    // Validar que los arrays tengan la misma longitud
    if (vivos.length !== muertos.length) {
        console.error("Error: los arrays vivos y muertos no tienen la misma longitud.");
        return;
    }

    // Calcular eficiencia y deficiencia
    const eficiencia = muertos.map((m, i) => {
        const total = m + vivos[i];
        return total > 0 ? (m / total) * 100 : 0;
    });

    const deficiencia = eficiencia.map(e => 100 - e);

    // Crear datasets con los porcentajes
    const datasetsLine = [
        {
            label: 'Deficiencia (%)',
            data: eficiencia,
            borderColor: 'rgba(244, 7, 66, 1)',
            backgroundColor: 'rgba(244, 7, 66, 0.3)',
            fill: false,
            tension: 0.3, // suaviza la línea
            borderWidth: 2,
            pointRadius: 4,
        },
        {
            label: 'Eficiencia (%)',
            data: deficiencia,
            borderColor: 'rgba(82, 227, 0, 1)',
            backgroundColor: 'rgba(82, 227, 0, 0.3)',
            fill: false,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
        }
    ];

    // Asignar los nuevos datos
    linePersonalChart.data.labels = labelsConValor; // Eje X
    linePersonalChart.data.datasets = datasetsLine;

    // Actualizar el gráfico
    linePersonalChart.update();
}*/

function actualizarGraficoLinePersonal(vivos, muertos, heridos, labelsConValor) {
    // Validar que los arrays tengan la misma longitud
    if (vivos.length !== muertos.length) {
        console.error("Error: los arrays vivos y muertos no tienen la misma longitud.");
        return;
    }

    // Calcular eficiencia y deficiencia
    const eficiencia = muertos.map((m, i) => {
        const total = m + vivos[i] + heridos[i];
        return total;
    });

    const deficiencia = muertos.map((m, i) => {
        const total = (vivos[i] + m) - m;
        if (total < 0) {
            return 0;
        } else {
            return total;
        }

    });

    // Crear datasets con los porcentajes
    /*const datasetsLine = [
        {
            label: 'Actual',
            data: deficiencia,
            borderColor: 'rgba(244, 7, 66, 1)',
            backgroundColor: 'rgba(244, 7, 66, 0.3)',
            fill: false,
            //tension: 0.3, // suaviza la línea
            borderWidth: 2,
            pointRadius: 4,
        },
        {
            label: 'Inicial',
            data: eficiencia,
            borderColor: 'rgba(82, 227, 0, 1)',
            backgroundColor: 'rgba(82, 227, 0, 0.3)',
            fill: false,
            //tension: 0.3,
            borderWidth: 2,
            pointRadius: 4,
        }
    ];

    // Asignar los nuevos datos
    linePersonalChart.data.labels = labelsConValor; // Eje X
    linePersonalChart.data.datasets = datasetsLine;

    // Actualizar el gráfico
    linePersonalChart.update();*/
}

// 🎯 Función para crear el gráfico con datos dinámicos
function crearGraficoDonutPersonal(data, total, padre) {
    Highcharts.setOptions({
        lang: {
            decimalPoint: ',',
            thousandsSep: '' // ❌ elimina la coma en los miles
        }
    });
    Highcharts.chart('container-donuc', {
        chart: {
            type: 'pie'
        },
        title: {
            text: padre
        },
        exporting: {
            csv: {
                itemDelimiter: ';', // útil para Excel en español
                decimalPoint: ',',  // formato numérico correcto
                columnHeaderFormatter: function (item, key) {
                    if (!item || item instanceof Highcharts.Axis) {
                        return 'Categoría';
                    }
                    return key === 'y' ? 'Personal' : 'Estado';
                }
            }
        },
        tooltip: {
            useHTML: true,
            formatter: function () {
                // this.y = valor absoluto de cada categoría
                // this.percentage = porcentaje que calcula Highcharts automáticamente
                return `
        <b>${this.point.name}</b><br>
        ${this.y} de ${total} (${this.percentage.toFixed(1)}%)
      `;
            }
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: { enabled: true, format: '{point.name}: {point.percentage:.1f}%' },
                showInLegend: true
            }
        },
        series: [{
            name: 'Personal',
            colorByPoint: true,
            data: data // 👈 Aquí se insertan los datos dinámicos
        }]
    });
}
function crearGraficoBarraPersonal(data, categorias, padre) {
    Highcharts.setOptions({
        lang: {
            decimalPoint: ',',
            thousandsSep: '' // ❌ elimina la coma en los miles
        }
    });
    Highcharts.chart('container-barras-personal', {
        chart: {
            type: 'column'
        },
        title: {
            text: padre
        },
        exporting: {
            csv: {
                itemDelimiter: ';', // útil para Excel en español
                decimalPoint: ',',  // formato numérico correcto

            }
        },
        xAxis: {
            categories: categorias
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Cantidad de trofeos'
            },
            stackLabels: {
                enabled: true
            }
        },
        legend: {
            align: 'left',
            x: 70,
            verticalAlign: 'top',
            y: 70,
            floating: false,
            backgroundColor: 'var(--highcharts-background-color, #ffffff)',
            borderColor: 'var(--highcharts-neutral-color-20, #cccccc)',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            headerFormat: '<b>{point.category}</b><br/>',
            pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true
                }
            }
        },
        series: data
    });
}

function crearGraficoBarraMunicion(data, categorias, padre) {
    Highcharts.chart('consumoMunicion', {
        chart: {
            type: 'bar'
        },
        title: {
            text: padre
        },

        xAxis: {
            categories: categorias,
            title: { text: null },
            gridLineWidth: 1,
            lineWidth: 0
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Unidades',
                align: 'high'
            },
            labels: {
                overflow: 'justify'
            },
            gridLineWidth: 0
        },
        tooltip: {
            valueSuffix: ' unidades'
        },
        plotOptions: {
            bar: {
                borderRadius: '50%',
                dataLabels: {
                    enabled: true
                },
                groupPadding: 0.1
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -20,
            y: 20,
            floating: false, // evita que tape el gráfico
            borderWidth: 1,
            backgroundColor: 'var(--highcharts-background-color, #ffffff)',
            shadow: false
        },
        credits: { enabled: false },
        series: data
    });
}

function crearGraficoLineasPersonal(dataSeries, categorias, padre) {
    Highcharts.chart('container-line-personal', {
        chart: {
            type: 'line',
            backgroundColor: '#f9fafb', // fondo suave
            style: { fontFamily: 'Segoe UI, sans-serif' },
            animation: true
        },

        title: {
            text: padre,
            align: 'center',
            style: {
                color: '#333',
                fontWeight: 'bold',
                fontSize: '18px'
            }
        },

        xAxis: {
            categories: categorias,
            labels: {
                style: { color: '#555', fontSize: '12px' }
            },
            lineColor: '#ccc'
        },

        yAxis: {
            title: { text: 'Eficiencia (%)' },
            labels: {
                format: '{value}%',
                style: { color: '#555', fontSize: '12px' }
            },
            gridLineColor: '#e0e0e0'
        },

        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            itemStyle: { fontSize: '13px' }
        },

        tooltip: {
            shared: true,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#ccc',
            borderRadius: 8,
            shadow: true,
            style: { fontSize: '13px' },
            headerFormat: '<b>{point.key}</b><br/>',
            pointFormat: '{series.name}: <b>{point.y:.2f}%</b>'
        },

        plotOptions: {
            series: {
                marker: {
                    enabled: true,
                    radius: 5, // tamaño del punto
                    symbol: 'circle',
                    fillColor: '#ffffff',
                    lineWidth: 2,
                    lineColor: '#007bff' // borde del punto
                },
                lineWidth: 4, // grosor de la línea
                states: {
                    hover: {
                        lineWidth: 5
                    }
                },
                dataLabels: {
                    enabled: true,
                    format: '{y:.1f}%',
                    style: {
                        color: '#333',
                        textOutline: 'none',
                        fontWeight: 'bold'
                    }
                },
                color: '#007bff', // color de la línea
                animation: {
                    duration: 1200
                }
            }
        },

        series: [
            {
                name: 'Eficiencia',
                data: dataSeries.eficiencia
            }
        ],

        responsive: {
            rules: [{
                condition: { maxWidth: 500 },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    });
}

function crearGraficoLineasMunicion(dataSeries, categorias, padre) {
    Highcharts.chart('container-line-municion', {
        chart: {
            type: 'line',
            backgroundColor: '#f9fafb', // fondo suave
            style: { fontFamily: 'Segoe UI, sans-serif' },
            animation: true
        },

        title: {
            text: padre,
            align: 'center',
            style: {
                color: '#333',
                fontWeight: 'bold',
                fontSize: '18px'
            }
        },

        xAxis: {
            categories: categorias,
            labels: {
                style: { color: '#555', fontSize: '12px' }
            },
            lineColor: '#ccc'
        },

        yAxis: {
            title: { text: 'Eficiencia (%)' },
            labels: {
                format: '{value}%',
                style: { color: '#555', fontSize: '12px' }
            },
            gridLineColor: '#e0e0e0'
        },

        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            itemStyle: { fontSize: '13px' }
        },

        tooltip: {
            shared: true,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderColor: '#ccc',
            borderRadius: 8,
            shadow: true,
            style: { fontSize: '13px' },
            headerFormat: '<b>{point.key}</b><br/>',
            pointFormat: '{series.name}: <b>{point.y:.2f}%</b>'
        },

        plotOptions: {
            series: {
                marker: {
                    enabled: true,
                    radius: 5, // tamaño del punto
                    symbol: 'circle',
                    fillColor: '#ffffff',
                    lineWidth: 2,
                    lineColor: '#007bff' // borde del punto
                },
                lineWidth: 4, // grosor de la línea
                states: {
                    hover: {
                        lineWidth: 5
                    }
                },
                dataLabels: {
                    enabled: true,
                    format: '{y:.1f}%',
                    style: {
                        color: '#333',
                        textOutline: 'none',
                        fontWeight: 'bold'
                    }
                },
                color: '#007bff', // color de la línea
                animation: {
                    duration: 1200
                }
            }
        },

        series: [
            {
                name: 'Eficiencia',
                data: dataSeries.eficiencia
            }
        ],

        responsive: {
            rules: [{
                condition: { maxWidth: 500 },
                chartOptions: {
                    legend: {
                        layout: 'horizontal',
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            }]
        }
    });
}


function crearGraficoLineaTiempoPersonal(dataSeries, categorias, padre) {
    const btn = document.getElementById('play-pause-button'),
        input = document.getElementById('play-range'),
        startRound = 0,
        endRound = 20,
        animationDuration = 1000;

    // General helper functions
    const arrToAssociative = arr => {
        const tmp = {};
        arr.forEach(item => {
            tmp[item[0]] = item[1];
        });

        return tmp;
    };

    const formatPoints = [];

    const chart = Highcharts.chart('container-line-time', {
        chart: {
            type: 'line',
            marginRight: 110,
            animation: {
                duration: animationDuration,
                easing: t => t
            }
        },
        title: {
            text: '',
            floating: true,
            align: 'left',
            x: 70,
            y: 50
        },
        data: {
            csv: document.getElementById('csv').innerText,
            itemDelimiter: '\t',
            complete: function (options) {
                // Store the data for later use, and remove it from the series
                for (let i = 0; i < options.series.length; i++) {
                    formatPoints[i] = arrToAssociative(options.series[i].data);
                    options.series[i].data = null;
                }
            }
        },
        xAxis: {
            allowDecimals: false,
            min: startRound,
            max: endRound,
            title: {
                text: 'Tiempo #',
                align: 'high',
                textAlign: 'left',
                x: 20,
                y: -20
            }
        },
        yAxis: {
            reversedStacks: false,
            max: 300,
            title: {
                text: 'Muertos'
            }
        },
        tooltip: {
            split: true,
            headerFormat: '<span style="font-size: 1.2em">{point.x}</span>',
            pointFormat: '{series.name}: {point.y} Points',
            crosshairs: true
        },
        plotOptions: {
            line: {
                animation: false,
                pointStart: startRound,
                marker: {
                    enabled: false
                }
            }
        },
        annotations: [
            {
                crop: false,
                labelOptions: {
                    borderWidth: 0,
                    backgroundColor: undefined,
                    align: 'left',
                    verticalAlign: 'middle',
                    overflow: 'allow',
                    style: {
                        pointerEvents: 'none',
                        transition: 'opacity 0.5s'
                    },
                    x: -8,
                    y: -1
                },
                labels: new Array(10).fill({
                    text: 0,
                    point: {
                        x: 0,
                        xAxis: 0,
                        y: 0,
                        yAxis: 0
                    }
                })
            }
        ],

        responsive: {
            rules: [
                {
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        chart: {
                            marginTop: 80
                        },
                        title: {
                            floating: false,
                            x: 0,
                            y: 20
                        },
                        yAxis: {
                            labels: {
                                align: 'left',
                                x: 0,
                                y: -3
                            },
                            tickLength: 0,
                            title: {
                                align: 'high',
                                reserveSpace: false,
                                rotation: 0,
                                textAlign: 'left',
                                y: -20
                            }
                        }
                    }
                }
            ]
        }
    });

    function pause(button) {
        button.title = 'play';
        button.className = 'fa fa-play';
        clearTimeout(chart.sequenceTimer);
        chart.sequenceTimer = undefined;
    }

    /*function update(sliderClicked) {

        const series = chart.series,
            labels = chart.annotations[0].labels,
            yearIndex = input.value - startRound,
            dataLength = series[0].options.data.length;

        // If slider moved back in time
        if (yearIndex < dataLength - 1) {
            for (let i = 0; i < series.length; i++) {
                const seriesData = series[i].options.data.slice(0, yearIndex);
                series[i].setData(seriesData, false);
            }
        }

        // If slider moved forward in time
        if (yearIndex > dataLength - 1) {
            const remainingYears = yearIndex - dataLength;
            for (let i = 0; i < series.length; i++) {
                for (let j = input.value - remainingYears; j < input.value; j++) {
                    series[i].addPoint([formatPoints[i][j]], false);
                }
            }
        }

        const nextnums = [];
        // Add current year if applicable, and update labels
        for (let i = 0; i < series.length; i++) {
            const newY = formatPoints[i][input.value];
            labels[i].options.point.x = yearIndex;
            labels[i].options.point.y = newY;

            if (yearIndex === 0) {
                labels[i].options.text =
                    `<span style="color:${series[i].color}">●</span>
                ${series[i].name}</span>`;
            }
            nextnums.push(newY);
            if (series[i].options.data.length <= yearIndex) {
                series[i].addPoint(newY, false);
            }
        }

        if (sliderClicked) {
            chart.redraw(false);
        } else {
            chart.redraw();
        }

        input.value = parseInt(input.value, 10) + 1;

        if (input.value > endRound) {
            // Auto-pause
            pause(btn);
        }
    }

    function play(button) {
        // Reset slider at the end
        if (input.value > endRound) {
            input.value = startRound;
        }
        button.title = 'pause';
        button.className = 'fa fa-pause';
        chart.sequenceTimer = setInterval(function () {
            update(false);
        }, animationDuration);
    }

    btn.addEventListener('click', function () {
        if (chart.sequenceTimer) {
            pause(this);
        } else {
            play(this);
        }
    });

    update(true); // Move to initial position
    update(false); // Animate to the first point immediately
    play(btn); // Start the animation

    // Trigger the update on the range bar click.
    input.addEventListener('click', function () {
        update(true);
    });
    // Stop animation when clicking and dragging range bar
    input.addEventListener('input', function () {
        pause(btn);
        update(true);
    });*/


}

