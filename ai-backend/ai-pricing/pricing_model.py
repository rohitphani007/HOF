import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
import joblib

class PropertyPricingModel:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.is_trained = False
        self.r2 = 0.0

    def generate_synthetic_data(self, n_samples=1000):
        np.random.seed(42)
        
        # Features: area (sqft), bedrooms, distance_to_metro (km), age (years), floor, amenities (0 to 5 scale)
        area = np.random.uniform(500, 5000, n_samples)
        bedrooms = np.random.randint(1, 6, n_samples)
        distance_to_metro = np.random.uniform(0.1, 15.0, n_samples)
        age = np.random.uniform(0, 50, n_samples)
        floor = np.random.randint(0, 30, n_samples)
        amenities = np.random.randint(0, 6, n_samples)
        
        # Define a base price and formulate price based on features
        # Example Indian context: Base 5000 INR per sqft
        base_price_per_sqft = 5000
        
        price = (
            area * base_price_per_sqft 
            + (bedrooms * 500000) 
            - (distance_to_metro * 100000)  # closer to metro = higher price
            - (age * 20000)  # older property = lower price
            + (floor * 10000)  # higher floor = slight premium
            + (amenities * 200000)  # more amenities = higher price
        )
        
        # Add some random noise
        noise = np.random.normal(0, price * 0.05, n_samples)
        price = price + noise
        
        # Ensure no negative prices
        price = np.maximum(price, 1000000) 

        df = pd.DataFrame({
            'area': area,
            'bedrooms': bedrooms,
            'distance_to_metro': distance_to_metro,
            'age': age,
            'floor': floor,
            'amenities': amenities,
            'price': price
        })
        return df

    def train(self):
        print("Generating synthetic data...")
        df = self.generate_synthetic_data(1000)
        
        X = df.drop('price', axis=1)
        y = df['price']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("Training Random Forest model...")
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        self.r2 = r2_score(y_test, y_pred)
        self.is_trained = True
        
        print(f"Model trained successfully. Accuracy (R2 Score): {self.r2:.4f}")
        return self.r2

    def predict_price(self, features):
        """
        features: dict or dataframe containing the 6 features
        returns: dict with estimated price and confidence interval
        """
        if not self.is_trained:
            raise ValueError("Model is not trained yet. Call train() first.")
            
        if isinstance(features, dict):
            features = pd.DataFrame([features])
            
        # Ensure column order matches training data
        expected_cols = ['area', 'bedrooms', 'distance_to_metro', 'age', 'floor', 'amenities']
        features = features[expected_cols]
        
        # Get individual tree predictions to calculate confidence interval
        # Scikit-learn's Random Forest trees output predictions that we can use
        tree_predictions = np.array([tree.predict(features.values) for tree in self.model.estimators_])
        
        # Calculate mean prediction and standard deviation
        mean_pred = np.mean(tree_predictions, axis=0)
        std_pred = np.std(tree_predictions, axis=0)
        
        # 95% confidence interval is approximately mean +/- 1.96 * std
        lower_bound = mean_pred - (1.96 * std_pred)
        upper_bound = mean_pred + (1.96 * std_pred)
        
        # For a single prediction, return a dictionary
        if len(features) == 1:
            return {
                'estimated_price': float(mean_pred[0]),
                'lower_bound': float(lower_bound[0]),
                'upper_bound': float(upper_bound[0])
            }
        
        return mean_pred, lower_bound, upper_bound

    def save_model(self, path='property_pricing_model.joblib'):
        if not self.is_trained:
            raise ValueError("Model is not trained yet. Cannot save.")
        joblib.dump(self.model, path)
        print(f"Model saved to {path}")

    def load_model(self, path='property_pricing_model.joblib'):
        self.model = joblib.load(path)
        self.is_trained = True
        print(f"Model loaded from {path}")

if __name__ == "__main__":
    # Test the model
    model = PropertyPricingModel()
    accuracy = model.train()
    
    if accuracy > 0.85:
        print("[SUCCESS] Target accuracy achieved!")
    else:
        print("[FAILED] Target accuracy not achieved. Please check the model.")
        
    sample_input = {
        'area': 1200,
        'bedrooms': 2,
        'distance_to_metro': 2.5,
        'age': 5,
        'floor': 4,
        'amenities': 3
    }
    
    print("\nPredicting for sample input:")
    print(sample_input)
    prediction = model.predict_price(sample_input)
    print(f"\nEstimated Price: INR {prediction['estimated_price']:,.2f}")
    print(f"Confidence Interval: INR {prediction['lower_bound']:,.2f} - INR {prediction['upper_bound']:,.2f}")
