import os
import sys

# Removed sys.path hack, using proper module imports instead
from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_pricing.pricing_model import PropertyPricingModel
from ai_pricing.sample_properties import get_sample_properties

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Initialize model
current_dir = os.path.dirname(os.path.abspath(__file__))
ai_pricing_dir = os.path.join(current_dir, 'ai_pricing')

model = PropertyPricingModel()
model_path = os.path.join(ai_pricing_dir, 'property_pricing_model.joblib')

try:
    if os.path.exists(model_path):
        model.load_model(model_path)
    else:
        print("Training model for the first time...")
        model.train()
        model.save_model(model_path)
except Exception as e:
    print(f"Model initialization error: {e}")
    print("Training a new model...")
    model.train()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_trained": model.is_trained
    })

@app.route('/api/sample-properties', methods=['GET'])
def sample_properties():
    try:
        properties = get_sample_properties()
        return jsonify({
            "status": "success",
            "data": properties
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/predict-price', methods=['POST'])
def predict_price():
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400
            
        required_fields = ['area', 'bedrooms', 'distance_to_metro', 'age', 'floor', 'amenities']
        
        # Check for missing fields
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
            
        # Extract features
        features = {field: data[field] for field in required_fields}
        
        # Make prediction
        prediction = model.predict_price(features)
        
        return jsonify({
            "status": "success",
            "data": {
                "estimated_price": prediction['estimated_price'],
                "lower_bound": prediction['lower_bound'],
                "upper_bound": prediction['upper_bound'],
                "currency": "INR"
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
