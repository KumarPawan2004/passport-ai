import cv2
import mediapipe as mp
from flask import Flask, request, jsonify, send_file
from rembg import remove
import numpy as np
from PIL import Image
from flask_cors import CORS
import os
 
app = Flask(__name__)
CORS(app)
# Initialize MediaPipe
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(
    model_selection=1,
    min_detection_confidence=0.5
)

# 🔍 Face Detection + Crop
def detect_and_crop_face(image):
    img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detection.process(img_rgb)

    if results.detections:
        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box

        h, w, _ = image.shape
        x = int(bbox.xmin * w)
        y = int(bbox.ymin * h)
        width = int(bbox.width * w)
        height = int(bbox.height * h)

        # Passport padding
        top_pad = int(0.6 * height)
        bottom_pad = int(0.4 * height)
        side_pad = int(0.4 * width)

        x1 = max(0, x - side_pad)
        y1 = max(0, y - top_pad)
        x2 = min(w, x + width + side_pad)
        y2 = min(h, y + height + bottom_pad)

        face = image[y1:y2, x1:x2]

        # Resize to passport size
        passport = cv2.resize(face, (413, 531))
        return passport

    return None


# ✨ Natural Enhancement
def enhance_image(image):
    return cv2.convertScaleAbs(image, alpha=1.1, beta=10)


# 🧠 SAFE Background Removal (PIL-based)
def remove_background(image):
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)

    output = remove(pil_image)

    output = np.array(output)

    # 🔥 FIX: Convert RGBA (RGB) → BGR
    output = cv2.cvtColor(output, cv2.COLOR_RGBA2BGRA)

    return output
# 🎨 SAFE White Background
def add_white_background(image):
    if image.shape[2] == 4:
        alpha = image[:, :, 3] / 255.0

        b = image[:, :, 0].astype(np.float32)
        g = image[:, :, 1].astype(np.float32)
        r = image[:, :, 2].astype(np.float32)

        # White background
        white = 255.0

        b = alpha * b + (1 - alpha) * white
        g = alpha * g + (1 - alpha) * white
        r = alpha * r + (1 - alpha) * white

        result = cv2.merge([b, g, r])

        return np.clip(result, 0, 255).astype(np.uint8)

    return image


def create_4x_passport(photo):
    h, w, _ = photo.shape
    gap = 20

    canvas = np.ones((h * 2 + gap, w * 2 + gap, 3), dtype=np.uint8) * 255

    canvas[0:h, 0:w] = photo
    canvas[0:h, w+gap:2*w+gap] = photo
    canvas[h+gap:2*h+gap, 0:w] = photo
    canvas[h+gap:2*h+gap, w+gap:2*w+gap] = photo

    return canvas

# 🏠 Home Route
@app.route('/')
def home():
    return "Server is running!"


# ⚙️ Main Processing Route
@app.route('/process', methods=['POST'])
def process():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"})

        file = request.files['image']

        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Step 1: Face crop
        face = detect_and_crop_face(image)
        if face is None:
            return jsonify({"error": "No face detected"})

        cv2.imwrite("debug_face.jpg", face)

        # Step 2: Background removal
        bg_removed = remove_background(face)
        cv2.imwrite("debug_bg_removed.png", bg_removed)

        # Step 3: Add white background
        clean_bg = add_white_background(bg_removed)
        cv2.imwrite("debug_clean_bg.jpg", clean_bg)

        # Step 4: Smooth
        clean_bg = cv2.bilateralFilter(clean_bg, 7, 50, 50)

        # Step 5: Enhance
        final_image = enhance_image(clean_bg)

        # Step 6: Create 4 copies
        final_image = create_4x_passport(final_image)

        # Save output
        output_path = "output.jpg"
        cv2.imwrite(output_path, final_image)

        return jsonify({
            "message": "Passport photo generated successfully",
            "file": output_path
        })


    except Exception as e:
        return jsonify({"error": str(e)})



@app.route('/output.jpg')
def get_output():
    return send_file("output.jpg", mimetype='image/jpeg')
# ▶️ Run Server
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)