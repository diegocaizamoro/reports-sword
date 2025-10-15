// Doughnut Chart
const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
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
});


// personal
const dynamicCtx = document.getElementById('dynamicBarChart').getContext('2d');
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


// municion
const dynamicMunicion = document.getElementById('consumoMunicion').getContext('2d');
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
});


function actualizarGraficoDesdeNodo(padre, nodo) {
    if (!nodo) return;

    const liChildren = Array.from(nodo.children).filter(child => child.tagName === "LI");
    const labels = [];
    const data = [];
    const vivosM = [];
    const muertosM = [];
    const backgroundColors = [];
    const borderColors = [];
    let totalMuertos = 0;
    let totalVivos = 0;
    const labelsDonuc = [];
    liChildren.forEach(child => {
        const progress = child.querySelector(".progress-container");
        // Buscar el nodo <unit>, <automat> o <formation> dentro de este <li>
        const nombre = progress?.getAttribute("name") || progress?.textContent?.trim() || "[sin nombre]";
        labels.push(nombre);
        const [vivos, muertos] = contarMuertosDesdeNombre(nombre);
        vivosM.push(vivos);
        muertosM.push(muertos);
        const color = generarColorAleatorio();
        backgroundColors.push(color);
        borderColors.push('black');
        totalMuertos += muertos;
        totalVivos += vivos;

    });

    // 2. Quitar duplicados con Set
    // Limpiar antes de usar
    const limpio = limpiarConsumoPorRecurso(consumoPorRecurso);

    // Luego extraes los datos
    const labelsMuni = Array.from(limpio.keys());
    const dataMuni = Array.from(limpio.values());
    //const labelsMuni = Array.from(consumoPorRecurso.keys()); // Eje X
    //const dataMuni = Array.from(consumoPorRecurso.values()); // Eje Y
    const nombresUnicos = Array.from(new Set(resourceNamesLimpios));
    //console.log("📦 Recursos encontrados:", nombresUnicos);
    const maxConsumo = Math.max(...data, 10); // Valor mínimo por defecto 10
    dynamicMunicionBarChart.options.scales.x.max = Math.ceil(maxConsumo * 1.1); // 10% más para margen visual

    const labelsConValor = [];
    const dataConValor = [];
    labelsMuni.forEach((label, i) => {
        if (dataMuni[i] > 0) {
            labelsConValor.push(label);
            dataConValor.push(dataMuni[i]);
        }
    });

    dynamicMunicionBarChart.data.labels = labelsConValor;        // Eje X
    dynamicMunicionBarChart.data.datasets[0].data = dataConValor; // Puedes ajustar el valor si tienes cantidades reales
    // Opcional: asignar colores aleatorios
    const backgroundColorsMuertos = generarColoresUnicosMuertos(dataMuni.length);
    dynamicMunicionBarChart.data.datasets[0].backgroundColor = backgroundColorsMuertos;
    dynamicMunicionBarChart.data.datasets[0].borderColor = borderColors;
    dynamicMunicionBarChart.update();





    // Ejemplo:
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
        }
    ];
    actualizarGraficoMultiple(labelsMeses, datasets, padre, totalMuertos, totalVivos);


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

    const backgroundColorsDona = generarColoresUnicos(filteredData.length);
    doughnutChart.data.labels = filteredLabels;
    doughnutChart.data.datasets[0].data = filteredData;
    doughnutChart.data.datasets[0].backgroundColor = backgroundColorsDona;
    doughnutChart.update();

} 