### **🤖 PERSON 2: AI/ML LEAD**

**Responsibilities**: Build pricing model, create API, generate sample data

#### **Hours 0-2: Setup**
* [ ] Install Python, create virtual environment
* [ ] Install Flask, scikit-learn, pandas, numpy
* [ ] Create `ai-pricing` folder structure
* [ ] Test Python installation

**Deliverable**: Working Python environment

---

#### **Hours 2-5: Build Pricing Model**
* [ ] Create `pricing_model.py`
* [ ] Implement `PropertyPricingModel` class
  - Generate synthetic training data (1000 properties)
  - Features: area, bedrooms, distance_to_metro, age, floor, amenities
  - Train Random Forest model
  - Predict price function with confidence intervals
* [ ] Test the model with sample inputs
* [ ] Achieve model accuracy >0.85

**Deliverable**: Trained ML model that predicts property prices

---

#### **Hours 5-7: Create Sample Property Data**
* [ ] Create `sample_properties.py`
* [ ] Generate 5-6 diverse properties:
  - Luxury apartment (high-end)
  - Budget studio (affordable)
  - Family home (mid-range)
  - Commercial property
  - Vacation property
* [ ] Include images (use Unsplash URLs)
* [ ] Each property should have realistic Indian addresses

**Deliverable**: Sample property dataset with images

---

#### **Hours 7-9: Build Flask API**
* [ ] Create `app.py`
* [ ] API endpoints:
  - `POST /api/predict-price` - Price prediction
  - `GET /api/sample-properties` - Return sample properties
  - `GET /api/health` - Health check
* [ ] Add CORS support for frontend
* [ ] Test all endpoints with Postman/browser
* [ ] Run on port 5000

**Deliverable**: Running Flask API on localhost:5000

---

#### **Hours 9-10: Documentation & Integration**
* [ ] Create `AI_API_README.md`:
  - How to run the API
  - API endpoint documentation
  - Example requests/responses
* [ ] Test with curl commands
* [ ] Share sample property JSON with Person 3 (Frontend)
* [ ] Share API endpoints with Person 4 (Integration)

**Critical Handoff**: Give Person 3 sample property data structure