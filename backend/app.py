import cv2
import numpy as np
import mediapipe as mp
from rembg import remove
import gradio as gr
from PIL import Image
import io
import os

# MediaPipe
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

def detect_and_crop_face(image):
    img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = face_detection.process(img_rgb)

    if results.detections:
        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box

        h, w, _ = img.shape
        x = int(bbox.xmin * w)
        y = int(bbox.ymin * h)
        width = int(bbox.width * w)
        height = int(bbox.height * h)

        # ADDED: Padding to make it look like a passport photo (include hair and shoulders)
        padding_y = int(height * 0.6) # Add 60% of face height as padding top and bottom
        padding_x = int(width * 0.5)  # Add 50% of face width as padding left and right

        # ADDED: Bounds checking to prevent crashing if the face is near the edge
        start_y = max(0, y - padding_y)
        end_y = min(h, y + height + padding_y)
        start_x = max(0, x - padding_x)
        end_x = min(w, x + width + padding_x)

        face = img[start_y:end_y, start_x:end_x]
        
        # Resize to standard passport ratio (e.g., 2x2 inches)
        face = cv2.resize(face, (413, 531)) 
        return face

    # If no face is found, return the original image resized
    return cv2.resize(img, (413, 531))

def remove_background(image):
    _, buffer = cv2.imencode('.png', image)
    output = remove(buffer.tobytes())
    nparr = np.frombuffer(output, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

def add_white_bg(image):
    if image.shape[2] == 4:
        alpha = image[:, :, 3] / 255.0
        white = np.ones_like(image[:, :, :3]) * 255
        result = image[:, :, :3] * alpha[..., None] + white * (1 - alpha[..., None])
        return result.astype(np.uint8)
    return image

def process(image):
    face = detect_and_crop_face(image)
    bg_removed = remove_background(face)
    final = add_white_bg(bg_removed)
    # Convert BGR back to RGB for Gradio to display correctly
    final_rgb = cv2.cvtColor(final, cv2.COLOR_BGR2RGB)
    return final_rgb

iface = gr.Interface(
    fn=process,
    inputs=gr.Image(type="pil"),
    outputs=gr.Image(type="numpy"),
    title="AI Passport Photo Generator",
)

# MANDATORY RENDER FIX: Bind to 0.0.0.0 and explicitly allow your Vercel URL
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    iface.launch(
        server_name="0.0.0.0", 
        server_port=port, 
        cors_allowed_origins=["https://passport-ai-three.vercel.app"]
    )