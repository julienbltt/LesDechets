// Obtenir les éléments du DOM
const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const labelElement = document.getElementById('label');
const confidenceElement = document.getElementById('confidence');
const historyContainer = document.getElementById('history');
const historyChartCtx = document.getElementById('historyChart').getContext('2d');
const resetHistoryButton = document.getElementById('resetHistory');
const spinner = document.getElementById('spinner');
const resultIcon = document.getElementById('resultIcon');
const distributionChartCtx = document.getElementById('distributionChart').getContext('2d');
const averageConfidenceChartCtx = document.getElementById('averageConfidenceChart').getContext('2d');

// Initialiser les graphiques Chart.js
let confidenceChart = null;
let historyChart = null;
let distributionChart = null;
let averageConfidenceChart = null;

// Définir les couleurs prédéfinies
const predefinedColors = [
    "#1db954", // Vert
    "#ff4500", // Orange Rouge
    "#ffd700", // Or
    "#00ced1", // Turquoise Foncé
    "#ff69b4", // Rose Foncé
    "#9370db", // Violet Moyen
    "#3cb371", // Vert Mer Moyen
    "#ff6347", // Tomate
    "#20b2aa", // Vert de Mer Clair
    "#dc143c", // Cramoisi
    "#ff1493", // Rose Profond
    "#8a2be2", // Violet Bleu
    "#00ff7f", // Vert Printemps
    "#ffa500", // Orange
    "#00bfff", // Bleu Ciel Profond
    // Ajouter plus de couleurs si nécessaire
];

// Assigner dynamiquement les couleurs aux classes
const classColors = {};
classLabels.forEach((label, index) => {
    classColors[label] = predefinedColors[index % predefinedColors.length];
});

// Fonction pour créer ou mettre à jour le graphique de confiance
function createConfidenceChart(ctx, labels, data, chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Confiance (%)',
                data: data,
                backgroundColor: labels.map(label => classColors[label] || getRandomColor()),
                borderColor: labels.map(label => classColors[label] || '#ffffff'),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // Graphique à barres horizontal
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.x}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#e0e0e0',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}

// Fonction pour créer ou mettre à jour le graphique d'historique
function createHistoryChart(historyData) {
    const labels = historyData.map(entry => entry.timestamp);
    const data = historyData.map(entry => (entry.confidence * 100).toFixed(2));

    if (historyChart) {
        historyChart.destroy();
    }

    historyChart = new Chart(historyChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Confiance Moyenne (%)',
                data: data,
                fill: true,
                backgroundColor: 'rgba(29, 185, 84, 0.2)',
                borderColor: 'rgba(29, 185, 84, 1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, labels: { color: '#e0e0e0' } },
                title: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#e0e0e0',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}

// Fonction pour créer ou mettre à jour le graphique de répartition des classes
function createDistributionChart(distributionData) {
    const labels = Object.keys(distributionData);
    const data = Object.values(distributionData).map(prob => (prob * 100).toFixed(2));
    const backgroundColors = labels.map(label => classColors[label] || getRandomColor());

    if (distributionChart) {
        distributionChart.destroy();
    }

    distributionChart = new Chart(distributionChartCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Répartition des Classes (%)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#121212',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e0e0e0' } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

// Fonction pour générer une couleur aléatoire (fallback)
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const constraints = { 
    video: { 
        facingMode: { ideal: "environment" } // Privilégie la caméra arrière 
    }, 
    audio: false 
};

// Accéder à la webcam
navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Erreur d'accès à la webcam: " + err);
        alert("Impossible d'accéder à la webcam. Veuillez vérifier les permissions.");
    });

// Capture et classification via webcam
captureButton.addEventListener('click', () => {
    const numberOfImages = 10;
    const interval = 100; // Intervalle en millisecondes entre les captures
    let capturedImages = [];
    let captureCount = 0;

    // Afficher le spinner
    spinner.style.display = 'block';

    captureButton.disabled = true;
    captureButton.textContent = 'Capture en cours...';

    const captureInterval = setInterval(() => {
        // Créer un canvas pour capturer l'image
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convertir l'image en base64
        const dataURL = canvas.toDataURL('image/jpeg');
        capturedImages.push(dataURL);
        captureCount++;

        if (captureCount >= numberOfImages) {
            clearInterval(captureInterval);
            sendPredictions(capturedImages);
            captureButton.disabled = false;
            captureButton.textContent = 'Capturer et Classifier';
        }
    }, interval);
});

// Fonction pour envoyer les images capturées au serveur
function sendPredictions(images) {
    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ images: images })
    })
    .then(response => response.json())
    .then(data => {
        // Cacher le spinner
        spinner.style.display = 'none';

        if (data.error) {
            labelElement.textContent = `Erreur: ${data.error}`;
            confidenceElement.textContent = '';
            if (confidenceChart) confidenceChart.destroy();
            resultIcon.src = '/static/icons/default.png';
            labelElement.style.color = '#e0e0e0';
            return;
        }

        labelElement.textContent = `${data.label}`;
        confidenceElement.textContent = `${(data.confidence * 100).toFixed(2)}%`;

        // Mettre à jour l'icône et la couleur
        const classColor = classColors[data.label] || '#ffffff';
        labelElement.style.color = classColor;
        resultIcon.style.borderColor = classColor;
        resultIcon.src = `/static/icons/${data.label}.png`; // Assurez-vous que l'icône existe

        // Ajouter au historique
        addToHistory(data.label, data.confidence);

        // Préparer les données pour le graphique de confiance
        const labels = Object.keys(data.probabilities);
        const probabilities = Object.values(data.probabilities).map(prob => (prob * 100).toFixed(2));

        // Créer ou mettre à jour le graphique de confiance
        const chartCtx = document.getElementById('confidenceChart').getContext('2d');
        confidenceChart = createConfidenceChart(chartCtx, labels, probabilities, confidenceChart);

        // Mettre à jour le graphique d'historique
        createHistoryChart(getHistoryData());

        // Mettre à jour le graphique de répartition
        createDistributionChart(data.probabilities);
    })
    .catch(error => {
        // Cacher le spinner
        spinner.style.display = 'none';

        console.error('Erreur lors de la prédiction:', error);
        alert("Une erreur est survenue lors de la prédiction.");
        captureButton.disabled = false;
        captureButton.textContent = 'Capturer et Classifier';
    });
}

// Fonction pour ajouter une entrée à l'historique
function addToHistory(label, confidence) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
        label: label,
        confidence: confidence,
        timestamp: timestamp
    };

    // Stocker l'historique dans le localStorage
    let historyData = JSON.parse(localStorage.getItem('history')) || [];
    historyData.unshift(entry); // Ajouter en début de tableau

    // Limiter l'historique à 20 entrées pour éviter la surcharge
    if (historyData.length > 20) {
        historyData.pop();
    }

    localStorage.setItem('history', JSON.stringify(historyData));

    // Mettre à jour l'affichage de l'historique
    displayHistory();
}

// Fonction pour afficher l'historique des classifications
function displayHistory() {
    const historyData = getHistoryData();
    historyContainer.innerHTML = '';

    historyData.forEach(entry => {
        const historyItem = document.createElement('div');
        historyItem.className = 'list-group-item';
        historyItem.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1" style="color: ${classColors[entry.label] || '#ffffff'};">${entry.label}</h5>
                <small>${(entry.confidence * 100).toFixed(2)}% - ${entry.timestamp}</small>
            </div>
        `;
        historyContainer.appendChild(historyItem);
    });

    // Mettre à jour le graphique d'historique
    createHistoryChart(historyData);
}

// Fonction pour obtenir les données de l'historique
function getHistoryData() {
    return JSON.parse(localStorage.getItem('history')) || [];
}

// Fonction pour réinitialiser l'historique
resetHistoryButton.addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment réinitialiser l'historique des classifications ?")) {
        localStorage.removeItem('history');
        displayHistory();
    }
});

// Initialiser l'affichage de l'historique au chargement de la page
window.onload = function() {
    displayHistory();
};
