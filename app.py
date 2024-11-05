from flask import Flask, render_template, request, jsonify
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import base64
import cv2
import os

app = Flask(__name__)

# Obtenir le chemin absolu du répertoire courant
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Chemins absolus vers le modèle et les labels
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'Model-20241102_105616.keras')
CLASS_LABELS_PATH = os.path.join(BASE_DIR, 'models', 'class_labels_20241102_105616.npy')

# Charger le modèle et les labels au démarrage
try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Le fichier modèle n'a pas été trouvé : {MODEL_PATH}")
    if not os.path.exists(CLASS_LABELS_PATH):
        raise FileNotFoundError(f"Le fichier des labels n'a pas été trouvé : {CLASS_LABELS_PATH}")

    model = load_model(MODEL_PATH)
    class_labels = np.load(CLASS_LABELS_PATH, allow_pickle=True).tolist()
    IMG_SIZE = (224, 224)  # Assurez-vous que cela correspond à la taille d'entrée de votre modèle
    print("Modèle et labels chargés avec succès.")
except Exception as e:
    print(f"Erreur lors du chargement du modèle ou des labels : {e}")
    exit(1)  # Arrêter l'exécution si le modèle ne peut pas être chargé

def preprocess_image(image):
    # Convertir l'image en format approprié
    image = cv2.resize(image, IMG_SIZE)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = image.astype('float32') / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.route('/')
def index():
    return render_template('index.html', class_labels=class_labels)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        img_data_list = data['images']  # Liste d'images encodées en base64

        if not isinstance(img_data_list, list) or len(img_data_list) == 0:
            raise ValueError("Aucune image reçue.")

        processed_images = []
        for img_data in img_data_list:
            # Décoder l'image base64
            header, encoded = img_data.split(',', 1)
            image_bytes = base64.b64decode(encoded)
            image = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(image, cv2.IMREAD_COLOR)

            # Vérifier si l'image a été correctement chargée
            if image is None:
                raise ValueError("Une des images n'a pas pu être décodée.")

            # Prétraiter l'image
            processed_image = preprocess_image(image)
            processed_images.append(processed_image)

        # Convertir en tableau numpy
        batch_images = np.vstack(processed_images)  # Shape: (batch_size, 224, 224, 3)

        # Faire les prédictions en batch
        predictions = model.predict(batch_images)  # Shape: (batch_size, num_classes)

        # Moyenniser les prédictions
        avg_prediction = np.mean(predictions, axis=0)
        predicted_class = np.argmax(avg_prediction)
        confidence = avg_prediction[predicted_class]
        predicted_label = class_labels[predicted_class]

        # Préparer la réponse avec toutes les probabilités moyennées
        response = {
            'label': predicted_label,
            'confidence': float(confidence),
            'probabilities': {class_labels[i]: float(prob) for i, prob in enumerate(avg_prediction)}
        }

        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    # Pour accepter les connexions externes, utilisez host='0.0.0.0'
    app.run(debug=True, host='0.0.0.0', port=5005)
