const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const labelElement = document.getElementById('label');
const confidenceElement = document.getElementById('confidence');
const imageUpload = document.getElementById('imageUpload');
const uploadButton = document.getElementById('upload');
const uploadLabelElement = document.getElementById('uploadLabel');
const uploadConfidenceElement = document.getElementById('uploadConfidence');
const previewImage = document.getElementById('previewImage');
const historyContainer = document.getElementById('history');

// Initialiser les graphiques Chart.js
let confidenceChart = null;
let uploadConfidenceChart = null;

// Fonction pour créer ou mettre à jour un graphique
function createChart(ctx, labels, data, chartInstance) {
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
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Accéder à la webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Erreur d'accès à la webcam: " + err);
    });

// Capture et classification via webcam
captureButton.addEventListener('click', () => {
    // Créer un canvas pour capturer l'image
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir l'image en base64
    const dataURL = canvas.toDataURL('image/jpeg');
    
    // Envoyer l'image au serveur pour la prédiction
    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: dataURL })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            labelElement.textContent = `Erreur: ${data.error}`;
            confidenceElement.textContent = '';
            if (confidenceChart) confidenceChart.destroy();
            return;
        }
        labelElement.textContent = `Classe: ${data.label}`;
        confidenceElement.textContent = `Confiance: ${(data.confidence * 100).toFixed(2)}%`;
        
        // Ajouter au historique
        addToHistory(data.label, data.confidence, 'Webcam');

        // Préparer les données pour le graphique
        const labels = Object.keys(data.probabilities);
        const probabilities = Object.values(data.probabilities).map(prob => (prob * 100).toFixed(2));
        
        // Créer ou mettre à jour le graphique
        const chartCtx = document.getElementById('confidenceChart').getContext('2d');
        confidenceChart = createChart(chartCtx, labels, probabilities, confidenceChart);
    })
    .catch(error => {
        console.error('Erreur lors de la prédiction:', error);
    });
});

// Gestion du téléchargement d'images
uploadButton.addEventListener('click', () => {
    const file = imageUpload.files[0];
    if (!file) {
        alert("Veuillez sélectionner une image à télécharger.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const dataURL = event.target.result;
        
        // Afficher la prévisualisation de l'image téléchargée
        previewImage.src = dataURL;
        previewImage.style.display = 'block';
        
        // Envoyer l'image au serveur pour la prédiction
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: dataURL })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                uploadLabelElement.textContent = `Erreur: ${data.error}`;
                uploadConfidenceElement.textContent = '';
                if (uploadConfidenceChart) uploadConfidenceChart.destroy();
                return;
            }
            uploadLabelElement.textContent = `Classe: ${data.label}`;
            uploadConfidenceElement.textContent = `Confiance: ${(data.confidence * 100).toFixed(2)}%`;
            
            // Ajouter au historique
            addToHistory(data.label, data.confidence, 'Téléchargement');

            // Préparer les données pour le graphique
            const labels = Object.keys(data.probabilities);
            const probabilities = Object.values(data.probabilities).map(prob => (prob * 100).toFixed(2));
            
            // Créer ou mettre à jour le graphique
            const chartCtx = document.getElementById('uploadConfidenceChart').getContext('2d');
            uploadConfidenceChart = createChart(chartCtx, labels, probabilities, uploadConfidenceChart);
        })
        .catch(error => {
            console.error('Erreur lors de la prédiction:', error);
        });
    }
    reader.readAsDataURL(file);
});

// Fonction pour ajouter une entrée à l'historique
function addToHistory(label, confidence, type) {
    const entry = document.createElement('div');
    entry.className = 'list-group-item list-group-item-action flex-column align-items-start';
    entry.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${label}</h5>
            <small>${(confidence * 100).toFixed(2)}%</small>
        </div>
        <p class="mb-1">Type: ${type}</p>
    `;
    historyContainer.prepend(entry); // Ajoute en haut de la liste
}
