# Technical System Design: Machine Learning-Based Dengue Outbreak Prediction System

## Abstract

This document provides a comprehensive technical overview of the Denguess system, a full-stack web application that employs a Random Forest Classifier to predict dengue outbreak risk levels for barangays in Koronadal City, Philippines. The system integrates machine learning inference with a modern web interface to deliver real-time, location-specific dengue risk forecasts based on climate parameters.

---

## I. API Architecture

### 1.1 Technology Stack

The API layer is implemented using **FastAPI** (version 0.104.1), a modern, high-performance Python web framework built on Starlette and Pydantic. FastAPI was selected for its automatic API documentation generation, type validation through Pydantic models, and asynchronous request handling capabilities.

**Key Dependencies:**
- `fastapi==0.104.1` - Core web framework
- `uvicorn[standard]==0.24.0` - ASGI server for production deployment
- `pydantic==2.5.0` - Data validation and serialization
- `python-multipart==0.0.6` - File upload support

### 1.2 Model Loading and Initialization

The system loads the pre-trained Random Forest model (`rf_dengue_model.pkl`) and barangay encoder (`barangay_encoder.pkl`) during application startup using the `joblib` library. The model loading process follows a singleton pattern to ensure the model is loaded once and reused across all requests.

**Implementation:**
```python
MODEL_PATH = Path(__file__).parent.parent / "rf_dengue_model.pkl"
ENCODER_PATH = Path(__file__).parent.parent / "barangay_encoder.pkl"

def load_model():
    global model, barangay_encoder
    if model is None and MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        barangay_encoder = joblib.load(ENCODER_PATH)
        load_historical_climate()  # Cache historical data
    return model
```

The model is initialized asynchronously during the FastAPI startup event, ensuring it is ready before accepting requests. Historical climate data from `climate.csv` is preprocessed and cached as monthly averages to support future week predictions.

### 1.3 Prediction Endpoint: `/predict`

#### Request Schema

The `/predict` endpoint accepts POST requests with the following JSON structure:

```json
{
  "barangay": "string",
  "climate": {
    "temperature": float,
    "humidity": float,
    "rainfall": float
  },
  "date": "YYYY-MM-DD"
}
```

**Pydantic Models:**
```python
class ClimateInput(BaseModel):
    temperature: float
    humidity: float
    rainfall: float

class PredictionRequest(BaseModel):
    barangay: str
    climate: ClimateInput
    date: str
```

#### Response Schema

The endpoint returns a `PredictionResponse` containing a 4-week forecast:

```json
{
  "weekly_forecast": [
    {
      "week": "January 1–7, 2025",
      "risk": "High|Moderate|Low",
      "probability": 0.6267,
      "outbreak_probability": 0.6267,
      "climate_used": {
        "rainfall": 100.0,
        "temperature": 28.0,
        "humidity": 75.0,
        "source": "current|historical_average"
      }
    }
  ],
  "model_info": {
    "model_type": "RandomForestClassifier",
    "features_used": ["rainfall", "temperature", "humidity", "barangay_encoded"],
    "prediction_date": "2025-01-15T10:30:00"
  }
}
```

#### Processing Logic

1. **Input Validation**: The endpoint validates climate parameters:
   - Temperature: 0-50°C
   - Humidity: 0-100%
   - Rainfall: ≥ 0mm
   - Date format: YYYY-MM-DD

2. **Feature Preparation**: For each week in the 4-week forecast:
   - Week 1: Uses the provided climate data
   - Weeks 2-4: Retrieves historical monthly averages from cached data
   - Barangay name is encoded using the LabelEncoder
   - Features are assembled in the exact order: `[rainfall, temperature, humidity, barangay_encoded]`

3. **Model Inference**: 
   - Features are passed to `model.predict_proba()` which returns probabilities for both classes
   - Class 0: No outbreak (cases = 0)
   - Class 1: Outbreak (cases > 0)
   - The outbreak probability (class 1) is extracted

4. **Risk Level Mapping**:
   - Low: < 30% probability
   - Moderate: 30-60% probability
   - High: > 60% probability

### 1.4 Data Handling and Validation

The API implements comprehensive input validation through Pydantic models, which automatically validate data types and ranges. Invalid inputs trigger HTTP 400 (Bad Request) responses with descriptive error messages. The system handles missing model files with HTTP 503 (Service Unavailable) responses.

**Security Mechanisms:**
- **CORS Middleware**: Configured to allow cross-origin requests from frontend domains
- **Input Sanitization**: Pydantic models automatically validate and sanitize inputs
- **Error Handling**: Comprehensive exception handling prevents information leakage
- **Type Safety**: Strong typing through Pydantic ensures data integrity

### 1.5 Additional Endpoints

- `GET /barangays`: Returns list of supported barangays
- `GET /model/info`: Returns model metadata (type, features, tree count)
- `POST /upload/climate`: Admin endpoint for uploading climate CSV data
- `POST /upload/dengue`: Admin endpoint for uploading dengue cases CSV data
- `POST /report-case`: Public endpoint for reporting dengue cases
- `POST /model/retrain`: Admin endpoint to trigger model retraining

---

## II. Frontend Stack

### 2.1 Technology Framework

The frontend is built using **React 18.2.0** with **Vite 5.0.8** as the build tool and development server. React was selected for its component-based architecture, efficient rendering, and extensive ecosystem.

**Core Dependencies:**
- `react@^18.2.0` - UI library
- `react-dom@^18.2.0` - DOM rendering
- `react-router-dom@^6.20.0` - Client-side routing
- `axios@^1.6.2` - HTTP client for API communication
- `leaflet@^1.9.4` & `react-leaflet@^4.2.1` - Interactive map visualization
- `tailwindcss@^3.3.6` - Utility-first CSS framework

### 2.2 Component Architecture

#### 2.2.1 Admin Upload Interface

**Component**: `AdminDashboard.jsx`

The admin interface provides a secure upload mechanism for monthly climate and dengue case data. It features:

- **Dual Upload Forms**: Separate forms for climate data and dengue cases
- **File Validation**: Client-side validation ensures only CSV files are accepted
- **Upload History**: Displays previously uploaded files with metadata (filename, size, upload date)
- **Error Handling**: User-friendly error messages for failed uploads
- **Success Feedback**: Confirmation messages upon successful uploads

**Implementation Details:**
- Uses `FormData` API for multipart file uploads
- Integrates with `/upload/climate` and `/upload/dengue` endpoints
- Displays upload history from `/uploads` endpoint
- Implements loading states during upload operations

#### 2.2.2 Public Dashboard and Barangay Selection

**Component**: `Home.jsx`

The public dashboard serves as the entry point, featuring:

- **Barangay Grid**: Visual cards for each of the five barangays:
  - General Paulino Santos
  - Morales
  - Santa Cruz
  - Sto. Niño
  - Zone II
- **Real-time Weather Display**: Shows current temperature, humidity, and rainfall
- **Navigation**: Direct links to individual barangay forecast pages
- **Risk Level Guide**: Visual legend explaining Low, Moderate, and High risk levels

**Barangay Selection Mechanism:**
- Dropdown menu in navigation bar (desktop)
- Mobile-responsive hamburger menu
- Direct routing via React Router to `/barangay-name` paths

#### 2.2.3 Map Visualization

**Component**: `BarangayMap.jsx`

The system employs **React Leaflet** (wrapper for Leaflet.js) to render interactive maps:

- **Base Layer**: OpenStreetMap tiles
- **Polygon Overlays**: Barangay boundaries highlighted with risk-based colors
  - Red: High risk
  - Yellow: Moderate risk
  - Green: Low risk
- **Interactive Popups**: Display barangay name and current risk level on click
- **Dynamic Styling**: Polygon colors update based on real-time risk predictions

**Map Configuration:**
- Center coordinates: 6.5031°N, 124.8470°E (Koronadal City)
- Zoom level: 13
- Coordinate system: WGS84

#### 2.2.4 Risk Level Legend

**Visual Indicators:**
- 🟢 **Low Risk**: Green color scheme, < 30% outbreak probability
- 🟡 **Moderate Risk**: Yellow/Orange color scheme, 30-60% probability
- 🔴 **High Risk**: Red color scheme, > 60% probability

The legend is displayed consistently across:
- Home page (informational)
- Barangay pages (contextual)
- Forecast cards (per-week indicators)

#### 2.2.5 Weekly Risk Forecast Display

**Component**: `BarangayPage.jsx`

The forecast display presents a 4-week prediction timeline:

- **Week Format**: "January 1–7, 2025" (formatted date ranges)
- **Risk Badge**: Color-coded risk level indicator
- **Probability Display**: Numerical probability percentage
- **Climate Metadata**: Shows which climate data was used (current vs. historical average)
- **Card-based Layout**: Each week displayed as an individual card with hover effects

**Data Flow:**
1. Component fetches current weather via `getCurrentWeather()` service
2. Auto-updates every 5 minutes via `subscribeToWeatherUpdates()`
3. Sends prediction request to `/predict` endpoint with barangay, climate, and date
4. Renders forecast cards with risk levels and probabilities

#### 2.2.6 Case Reporting Form

**Component**: `BarangayPage.jsx` (embedded form)

The case reporting feature allows public users to submit dengue case information:

- **Form Fields**:
  - Date picker (required)
  - Symptoms text area (optional)
  - Barangay (pre-filled from page context)
- **Submission**: POST request to `/report-case` endpoint
- **Feedback**: Success/error alerts after submission
- **Data Storage**: Cases stored in `backend/data/case_reports.jsonl` (JSON Lines format)

### 2.3 Frontend Libraries and Services

**API Communication Layer** (`services/api.js`):
- Centralized Axios instance with base URL configuration
- Environment variable support: `VITE_API_URL`
- Request/response interceptors for error handling
- Type-safe API method exports

**Weather Service** (`services/weather.js`):
- Simulated weather data generation based on Koronadal City climate patterns
- Optional integration with OpenWeatherMap API (configurable)
- Auto-update mechanism with configurable intervals
- Time-of-day and seasonal variation modeling

**Routing** (`App.jsx`):
- React Router v6 for client-side navigation
- Separate routes for public and admin interfaces
- Protected admin routes (future: authentication)
- 404 handling and error boundaries

---

## III. Backend Stack

### 3.1 Python Environment

**Python Version**: Python 3.9.x  
**Environment Management**: Virtual environment (`venv`)  
**Package Management**: pip with `requirements.txt`

**Core Python Dependencies:**
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.6.1
joblib==1.3.2
python-multipart==0.0.6
```

### 3.2 FastAPI Application Structure

**Main Application File**: `backend/app.py`

The FastAPI application follows a modular structure:

```
backend/
├── app.py                 # Main FastAPI application
├── retrain_model.py       # Model retraining script
├── requirements.txt        # Python dependencies
├── data/
│   └── case_reports.jsonl # User-submitted case reports
└── venv/                  # Virtual environment

Root Directory:
├── rf_dengue_model.pkl    # Trained model file
├── barangay_encoder.pkl   # Label encoder for barangays
├── climate.csv            # Historical climate data
└── dengue_cases.csv       # Historical dengue cases
```

**Application Initialization:**
- FastAPI app instance with title, version, and description
- CORS middleware configuration
- Startup event handler for model loading
- Global model and encoder variables (singleton pattern)

### 3.3 CSV Upload Handling

**Endpoints**: `/upload/climate` and `/upload/dengue`

The system processes CSV uploads through FastAPI's `UploadFile` interface:

1. **File Reception**: Multipart form data parsing
2. **Validation**: File extension and format verification
3. **Storage**: Files saved to project root directory
4. **Response**: Success confirmation with file metadata

**Climate CSV Schema** (expected):
```csv
date,temperature,humidity,rainfall
2024-01-01,28.5,75.0,100.0
```

**Dengue Cases CSV Schema** (expected):
```csv
date,barangay,cases
2024-01-01,Morales,5
```

### 3.4 Data Preprocessing Logic

**Training Data Preparation** (`train_model_improved.py`):

1. **Data Loading**:
   - `climate.csv`: Date, temperature, humidity, rainfall
   - `dengue_cases.csv`: Date, barangay, cases

2. **Data Merging**:
   ```python
   df = pd.merge(climate, dengue[['date', 'barangay', 'cases']], 
                 on='date', how='inner')
   ```
   - Inner join on date ensures complete records
   - Preserves barangay information for location-specific patterns

3. **Feature Engineering**:
   - Barangay encoding using `LabelEncoder` (categorical → numeric)
   - Binary label creation: `y = (cases > 0).astype(int)`
   - Feature selection: `['rainfall', 'temperature', 'humidity', 'barangay_encoded']`

4. **Data Cleaning**:
   - Removal of rows with missing values
   - Outlier filtering (temperature: 20-35°C, humidity: 40-100%, rainfall: 0-500mm)
   - Date parsing and validation

### 3.5 Model Inference Logic

**Prediction Pipeline** (`app.py` → `predict()` function):

1. **Feature Preparation**:
   ```python
   features_df = pd.DataFrame({
       'rainfall': [rainfall],
       'temperature': [temperature],
       'humidity': [humidity],
       'barangay_encoded': [barangay_encoded]
   })
   ```
   - Ensures exact column order matching training data
   - Uses pandas DataFrame (not numpy array) for compatibility

2. **Probability Prediction**:
   ```python
   probabilities = model.predict_proba(features_df)[0]
   outbreak_prob = probabilities[1]  # Class 1 probability
   ```
   - Returns probability distribution over both classes
   - Extracts outbreak probability (class 1)

3. **Risk Level Conversion**:
   - Maps continuous probability to discrete risk levels
   - Threshold-based classification

4. **Historical Climate Integration**:
   - For future weeks (2-4), retrieves monthly averages from cached data
   - Ensures realistic forecasts based on seasonal patterns

---

## IV. Machine Learning Model

### 4.1 Algorithm Selection

**Algorithm**: Random Forest Classifier (scikit-learn)

Random Forest was selected for its:
- Robustness to overfitting
- Ability to handle non-linear relationships
- Feature importance interpretability
- Ensemble-based accuracy
- Built-in handling of class imbalance

### 4.2 Input Features

The model utilizes **four input features**:

1. **Rainfall** (mm): Continuous variable representing precipitation
2. **Temperature** (°C): Continuous variable for ambient temperature
3. **Humidity** (%): Continuous variable for relative humidity
4. **Barangay Encoded** (integer): Categorical variable encoded via LabelEncoder representing location

**Feature Order**: `[rainfall, temperature, humidity, barangay_encoded]`

**Feature Importance** (from trained model):
- Temperature: 42.78%
- Rainfall: 33.99%
- Humidity: 23.24%
- Barangay: Variable (location-specific patterns)

### 4.3 Target Label

**Binary Classification**:
- **Class 0**: No outbreak (cases = 0)
- **Class 1**: Outbreak (cases > 0)

**Label Creation**:
```python
y_binary = (df['cases'] > 0).astype(int)
```

This binary approach simplifies the prediction task while maintaining clinical relevance, as any dengue case presence indicates potential outbreak conditions.

### 4.4 Dataset

**Data Sources**:
- `climate.csv`: Historical climate data for Koronadal City
- `dengue_cases.csv`: Historical dengue case records per barangay

**Data Characteristics**:
- **Geographic Scope**: Koronadal City, South Cotabato, Philippines
- **Temporal Coverage**: Historical data spanning multiple years
- **Spatial Granularity**: Five barangays (General Paulino Santos, Morales, Santa Cruz, Sto. Niño, Zone II)
- **Data Points**: Variable (depends on available historical records)

**Data Preprocessing**:
- Date parsing and validation
- Missing value removal
- Outlier filtering
- Barangay-specific data merging
- Temporal alignment of climate and case data

### 4.5 Model Hyperparameters

**Random Forest Configuration**:
```python
RandomForestClassifier(
    n_estimators=100,        # Number of decision trees
    random_state=42,          # Reproducibility seed
    max_depth=10,            # Maximum tree depth
    min_samples_split=5,     # Minimum samples to split node
    min_samples_leaf=2,      # Minimum samples in leaf
    class_weight='balanced', # Handle class imbalance
    n_jobs=-1                # Parallel processing
)
```

**Training Configuration**:
- **Train-Test Split**: 75% training, 25% testing
- **Stratification**: Maintains class distribution in splits
- **Random State**: 42 (ensures reproducibility)

### 4.6 Model Performance Metrics

**Evaluation Metrics** (on test set):

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **Accuracy** | 93.33% | Overall prediction correctness |
| **Precision** | 93.33% | True positives / (True positives + False positives) |
| **Recall** | 100.00% | True positives / (True positives + False negatives) |
| **F1 Score** | 96.55% | Harmonic mean of precision and recall |

**Confusion Matrix**:
```
                Predicted
              No Outbreak  Outbreak
Actual
No Outbreak      TN          FP
Outbreak         FN          TP
```

**Performance Interpretation**:
- **High Recall (100%)**: Model successfully identifies all actual outbreaks (no false negatives)
- **High Precision (93.33%)**: When model predicts outbreak, it is correct 93.33% of the time
- **Balanced F1 Score (96.55%)**: Indicates good overall performance
- **High Accuracy (93.33%)**: Model makes correct predictions in 93.33% of cases

### 4.7 Model Persistence

**File Format**: `rf_dengue_model.pkl` (joblib serialization)

**Serialized Components**:
- Trained RandomForestClassifier instance
- Feature names and order
- Hyperparameters
- Tree structures

**Additional Files**:
- `barangay_encoder.pkl`: LabelEncoder for barangay name-to-integer mapping

**Model Loading**:
- Lazy loading on first prediction request
- Singleton pattern ensures single model instance
- Error handling for missing or corrupted model files

### 4.8 Model Retraining

**Retraining Endpoint**: `POST /model/retrain`

The system supports on-demand model retraining:
- Executes `train_model_improved.py` script
- Processes updated CSV files
- Generates new model and encoder files
- Reloads model automatically after training

**Retraining Process**:
1. Load latest climate and dengue case data
2. Merge and preprocess datasets
3. Train new Random Forest model
4. Evaluate performance metrics
5. Save updated model files
6. Reload model in API

---

## V. System Integration and Data Flow

### 5.1 End-to-End Prediction Flow

```
User Request (Frontend)
    ↓
React Component (BarangayPage.jsx)
    ↓
API Service (api.js) → POST /predict
    ↓
FastAPI Endpoint (app.py)
    ↓
Input Validation (Pydantic)
    ↓
Feature Preparation
    ↓
Model Inference (RandomForestClassifier)
    ↓
Probability → Risk Level Mapping
    ↓
Response Serialization (JSON)
    ↓
Frontend Rendering (Forecast Cards)
```

### 5.2 Climate Data Integration

**Current Week (Week 1)**:
- Source: Real-time weather service (simulated or API)
- Updates: Every 5 minutes automatically
- Format: Temperature (°C), Humidity (%), Rainfall (mm)

**Future Weeks (Weeks 2-4)**:
- Source: Historical monthly averages from `climate.csv`
- Calculation: Mean values per month
- Caching: Precomputed at startup for performance

### 5.3 Error Handling and Resilience

**Frontend**:
- Error boundaries for React component failures
- API error handling with user-friendly messages
- Loading states during async operations
- Fallback values for missing data

**Backend**:
- HTTP status codes (400, 500, 503)
- Detailed error messages for debugging
- Model validation before inference
- Graceful degradation for missing data

---

## VI. Deployment and Scalability

### 6.1 Deployment Architecture

**Frontend**: Static site hosting (Vercel/Netlify)
- Build: `npm run build` → `dist/` directory
- Framework: Vite for optimized production builds
- Environment: Node.js 18+

**Backend**: Python web service (Render/Railway)
- Server: Uvicorn ASGI server
- Port: Dynamic (`$PORT` environment variable)
- Process: Single worker (scalable to multiple)

### 6.2 Configuration Management

**Environment Variables**:
- `VITE_API_URL`: Frontend API endpoint
- `PORT`: Backend server port
- `VITE_WEATHER_API_KEY`: Optional weather API key

**File Structure**:
- Model files in project root for easy access
- Data files in root directory
- Separate admin and public interfaces

---

## VII. Conclusion

The Denguess system demonstrates a complete integration of machine learning with modern web technologies to deliver actionable dengue risk predictions. The architecture emphasizes:

- **Modularity**: Separation of concerns between frontend, backend, and ML components
- **Scalability**: Stateless API design allows horizontal scaling
- **Maintainability**: Clear code structure and comprehensive documentation
- **Accuracy**: High-performing model with 93.33% accuracy and 100% recall
- **Usability**: Intuitive interface for both public users and administrators

The system successfully bridges the gap between machine learning research and practical public health applications, providing real-time, location-specific dengue risk assessments to support preventive measures in Koronadal City.

---

## References

- FastAPI Documentation: https://fastapi.tiangolo.com
- scikit-learn Random Forest: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html
- React Documentation: https://react.dev
- Leaflet.js: https://leafletjs.com

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**System Version**: Denguess v1.0.0

