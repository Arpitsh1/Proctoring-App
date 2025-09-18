from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model
model = YOLO("yolov8n.pt")  # pretrained COCOv8

# Only detect these objects
TARGET_CLASSES = ["cell phone", "laptop"]

@app.route("/detect", methods=["POST"])
def detect():
    if "file" not in request.files:
        return jsonify([])

    file = request.files["file"]
    nparr = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # YOLOv8 prediction
    results = model.predict(img, verbose=False)[0]

    detected_items = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        cls_name = results.names[cls_id]
        if cls_name in TARGET_CLASSES:
            detected_items.append({
                "name": cls_name,
                "confidence": float(box.conf[0]),
                "bbox": box.xyxy[0].tolist()  # [x1,y1,x2,y2]
            })
    return jsonify(detected_items)

if __name__ == "__main__":
    app.run(port=5000)
