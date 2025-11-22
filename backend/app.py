from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from pathlib import Path
import warnings

# Suppress sklearn version warnings
warnings.filterwarnings('ignore', category=UserWarning)

app = FastAPI(title="Denguess API", version="1.0.0", description="AI-Powered Dengue Prediction System")

# CORS middleware
# Allow all origins in production (you can restrict this to specific domains)
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    # Add your production frontend URLs here
    # "https://denguess.vercel.app",
    # "https://denguess.netlify.app",
]

# In production, you might want to allow all origins or specific ones
# For now, we'll allow all for easier deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to allowed_origins list for production security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
MODEL_PATH = Path(__file__).parent.parent / "rf_dengue_model.pkl"
ENCODER_PATH = Path(__file__).parent.parent / "barangay_encoder.pkl"
CLIMATE_DATA_PATH = Path(__file__).parent.parent / "climate.csv"
model = None
barangay_encoder = None
historical_climate = None  # Cache historical climate data
feature_names = ['rainfall', 'temperature', 'humidity', 'barangay_encoded']  # Includes barangay!

def load_historical_climate():
    """Load and cache historical climate data for weekly averages"""
    global historical_climate
    if historical_climate is None and CLIMATE_DATA_PATH.exists():
        try:
            df = pd.read_csv(CLIMATE_DATA_PATH)
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df = df.dropna()
            
            # Filter out invalid data (negative values, extreme outliers)
            df = df[
                (df['rainfall'] >= 0) & (df['rainfall'] <= 500) &
                (df['temperature'] >= 20) & (df['temperature'] <= 35) &
                (df['humidity'] >= 40) & (df['humidity'] <= 100)
            ]
            
            # Calculate average by month (more reliable than week)
            df['month'] = df['date'].dt.month
            monthly_avg = df.groupby('month').agg({
                'rainfall': 'mean',
                'temperature': 'mean',
                'humidity': 'mean'
            }).round(2)
            
            historical_climate = monthly_avg.to_dict('index')
            print(f"✅ Historical climate data loaded!")
            print(f"   Monthly averages calculated for {len(monthly_avg)} months")
            return historical_climate
        except Exception as e:
            print(f"⚠️  Error loading historical climate: {e}")
            return None
    return historical_climate

def get_historical_climate_for_date(target_date: datetime, base_climate: dict = None):
    """
    Get historical average climate for a specific date.
    Uses month-based averages from historical data.
    Falls back to base_climate if historical data not available.
    """
    historical = load_historical_climate()
    
    if historical is None:
        # Fallback to base climate if no historical data
        if base_climate:
            return base_climate
        return {'rainfall': 100.0, 'temperature': 28.0, 'humidity': 75.0}
    
    # Get month of target date
    month = target_date.month
    
    # Get historical average for that month
    if month in historical:
        return {
            'rainfall': float(historical[month]['rainfall']),
            'temperature': float(historical[month]['temperature']),
            'humidity': float(historical[month]['humidity'])
        }
    else:
        # Fallback to base climate or default
        if base_climate:
            return base_climate
        return {'rainfall': 100.0, 'temperature': 28.0, 'humidity': 75.0}

def load_model():
    global model, barangay_encoder
    if model is None and MODEL_PATH.exists():
        try:
            model = joblib.load(MODEL_PATH)
            print(f"✅ Model loaded successfully!")
            print(f"   Model type: {type(model).__name__}")
            if hasattr(model, 'n_estimators'):
                print(f"   Number of trees: {model.n_estimators}")
            if hasattr(model, 'feature_names_in_'):
                print(f"   Expected features: {list(model.feature_names_in_)}")
            
            # Load barangay encoder if it exists
            if ENCODER_PATH.exists():
                barangay_encoder = joblib.load(ENCODER_PATH)
                print(f"✅ Barangay encoder loaded!")
                print(f"   Barangays: {list(barangay_encoder.classes_)}")
            else:
                print(f"⚠️  Barangay encoder not found - using fallback")
            
            # Load historical climate data
            load_historical_climate()
            
            return model
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            import traceback
            traceback.print_exc()
            return None
    return model

# Initialize model on startup
@app.on_event("startup")
async def startup_event():
    model = load_model()
    if model is None:
        print("⚠️  WARNING: Model not loaded! Predictions will fail.")
    else:
        print("🚀 Denguess API ready!")

# Request/Response models
class ClimateInput(BaseModel):
    temperature: float
    humidity: float
    rainfall: float

class PredictionRequest(BaseModel):
    barangay: str
    climate: ClimateInput
    date: str

class ClimateUsed(BaseModel):
    rainfall: float
    temperature: float
    humidity: float
    source: str

class WeeklyForecast(BaseModel):
    week: str
    risk: str
    probability: float
    outbreak_probability: float
    climate_used: Optional[ClimateUsed] = None

class PredictionResponse(BaseModel):
    weekly_forecast: List[WeeklyForecast]
    model_info: Optional[dict] = None

# Barangay list
BARANGAYS = [
    "General Paulino Santos",
    "Morales",
    "Santa Cruz",
    "Sto. Niño",
    "Zone II"
]

def get_risk_level(probability: float) -> str:
    """
    Convert prediction probability to risk level.
    Based on the model's probability of outbreak (cases > 0).
    
    Thresholds optimized for dengue prediction:
    - Low: < 30% chance of outbreak
    - Moderate: 30-60% chance of outbreak  
    - High: > 60% chance of outbreak
    """
    if probability < 0.30:
        return "Low"
    elif probability < 0.60:
        return "Moderate"
    else:
        return "High"

def format_week_range(start_date: datetime) -> str:
    """Format date range for week display"""
    end_date = start_date + timedelta(days=6)
    start_str = start_date.strftime("%B %d")
    end_str = end_date.strftime("%d")
    if start_date.month == end_date.month:
        return f"{start_str}–{end_str}"
    else:
        return f"{start_str} – {end_date.strftime('%B %d')}"

def prepare_features(rainfall: float, temperature: float, humidity: float, barangay: str) -> pd.DataFrame:
    """
    Prepare features in the exact format the model expects.
    Uses DataFrame with column names to match training data.
    NOW INCLUDES BARANGAY as a feature!
    """
    # Encode barangay
    if barangay_encoder is not None:
        try:
            barangay_encoded = barangay_encoder.transform([barangay])[0]
        except ValueError:
            # Barangay not in encoder, use default (most common)
            print(f"⚠️  Barangay '{barangay}' not in encoder, using default")
            barangay_encoded = 0
    else:
        # Fallback: map barangay names to numbers
        barangay_map = {
            "General Paulino Santos": 0,
            "Morales": 1,
            "Santa Cruz": 2,
            "Sto. Niño": 3,
            "Zone II": 4
        }
        barangay_encoded = barangay_map.get(barangay, 0)
    
    # Create DataFrame with exact column names and order from training
    features_df = pd.DataFrame({
        'rainfall': [rainfall],
        'temperature': [temperature],
        'humidity': [humidity],
        'barangay_encoded': [barangay_encoded]
    })
    
    # Ensure correct column order
    features_df = features_df[feature_names]
    
    return features_df

@app.get("/")
async def root():
    return {
        "message": "Denguess API - AI-Powered Dengue Prediction",
        "status": "running",
        "model_loaded": model is not None
    }

@app.get("/barangays")
async def get_barangays():
    return {"barangays": BARANGAYS}

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded model"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    info = {
        "model_type": type(model).__name__,
        "model_loaded": True,
        "feature_names": feature_names,
    }
    
    if hasattr(model, 'n_estimators'):
        info["n_estimators"] = model.n_estimators
    if hasattr(model, 'feature_names_in_'):
        info["expected_features"] = list(model.feature_names_in_)
    
    return info

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Generate weekly dengue risk forecast using Random Forest model.
    
    Features must be in exact order: rainfall, temperature, humidity
    """
    try:
        model = load_model()
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded. Please ensure rf_dengue_model.pkl exists.")
        
        # Validate inputs
        if not (0 <= request.climate.temperature <= 50):
            raise HTTPException(status_code=400, detail="Temperature must be between 0 and 50°C")
        if not (0 <= request.climate.humidity <= 100):
            raise HTTPException(status_code=400, detail="Humidity must be between 0 and 100%")
        if request.climate.rainfall < 0:
            raise HTTPException(status_code=400, detail="Rainfall cannot be negative")
        
        # Parse start date
        try:
            start_date = datetime.strptime(request.date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Generate 4 weeks of forecasts
        weekly_forecast = []
        
        # Base climate from user input (for week 1)
        base_climate = {
            'rainfall': request.climate.rainfall,
            'temperature': request.climate.temperature,
            'humidity': request.climate.humidity
        }
        
        for week_num in range(4):
            week_start = start_date + timedelta(weeks=week_num)
            
            # Week 1: Use current/input climate data
            # Weeks 2-4: Use historical averages for those specific dates
            if week_num == 0:
                # First week uses the input climate data
                climate_data = base_climate
            else:
                # Future weeks use historical averages for that time of year
                climate_data = get_historical_climate_for_date(week_start, base_climate)
            
            # Prepare features in exact format model expects
            # Order: rainfall, temperature, humidity, barangay_encoded (as per training)
            features_df = prepare_features(
                rainfall=climate_data['rainfall'],
                temperature=climate_data['temperature'],
                humidity=climate_data['humidity'],
                barangay=request.barangay
            )
            
            # Get prediction probability
            # predict_proba returns [probability_class_0, probability_class_1]
            # class_0 = no outbreak (cases = 0)
            # class_1 = outbreak (cases > 0)
            probabilities = model.predict_proba(features_df)[0]
            no_outbreak_prob = probabilities[0]
            outbreak_prob = probabilities[1]
            
            # Use outbreak probability for risk assessment
            probability = float(outbreak_prob)
            
            # Convert to risk level
            risk = get_risk_level(probability)
            
            # Format week range
            week_str = format_week_range(week_start)
            
            weekly_forecast.append({
                "week": week_str,
                "risk": risk,
                "probability": round(probability, 4),  # More precision
                "outbreak_probability": round(probability, 4),
                "climate_used": {
                    "rainfall": round(climate_data['rainfall'], 1),
                    "temperature": round(climate_data['temperature'], 1),
                    "humidity": round(climate_data['humidity'], 1),
                    "source": "current" if week_num == 0 else "historical_average"
                }
            })
        
        # Get model info
        model_info = {
            "model_type": type(model).__name__,
            "features_used": feature_names,
            "prediction_date": datetime.now().isoformat()
        }
        
        return PredictionResponse(
            weekly_forecast=weekly_forecast,
            model_info=model_info
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Prediction error: {error_details}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/batch")
async def predict_batch(requests: List[PredictionRequest]):
    """Batch prediction for multiple barangays/dates"""
    results = []
    for req in requests:
        try:
            response = await predict(req)
            results.append({
                "barangay": req.barangay,
                "date": req.date,
                "forecast": response.weekly_forecast,
                "model_info": response.model_info
            })
        except Exception as e:
            results.append({
                "barangay": req.barangay,
                "date": req.date,
                "error": str(e)
            })
    return {"results": results}

@app.post("/predict/test")
async def test_prediction():
    """Test endpoint to verify model is working correctly"""
    try:
        model = load_model()
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Test with sample data from training
        test_features = prepare_features(
            rainfall=100.0,
            temperature=28.0,
            humidity=75.0,
            barangay="Santa Cruz"
        )
        
        prediction = model.predict(test_features)[0]
        probabilities = model.predict_proba(test_features)[0]
        
        return {
            "status": "success",
            "test_features": {
                "rainfall": 100.0,
                "temperature": 28.0,
                "humidity": 75.0
            },
            "prediction": int(prediction),
            "probabilities": {
                "no_outbreak": float(probabilities[0]),
                "outbreak": float(probabilities[1])
            },
            "risk_level": get_risk_level(float(probabilities[1]))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test error: {str(e)}")

@app.post("/upload/climate")
async def upload_climate_data(file: UploadFile = File(...)):
    """Upload new climate CSV data"""
    try:
        # Read uploaded file
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        
        # Validate columns
        required_cols = ["date", "rainfall", "temperature", "humidity"]
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {', '.join(required_cols)}"
            )
        
        # Save to data directory
        data_dir = Path(__file__).parent / "data"
        data_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = data_dir / f"climate_{timestamp}.csv"
        df.to_csv(file_path, index=False)
        
        return {
            "message": "Climate data uploaded successfully",
            "filename": file.filename,
            "saved_as": str(file_path),
            "rows": len(df)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.post("/upload/dengue")
async def upload_dengue_data(file: UploadFile = File(...)):
    """Upload new dengue cases CSV data"""
    try:
        # Read uploaded file
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        
        # Validate columns
        required_cols = ["date", "barangay", "cases"]
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {', '.join(required_cols)}"
            )
        
        # Save to data directory
        data_dir = Path(__file__).parent / "data"
        data_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = data_dir / f"dengue_{timestamp}.csv"
        df.to_csv(file_path, index=False)
        
        return {
            "message": "Dengue cases data uploaded successfully",
            "filename": file.filename,
            "saved_as": str(file_path),
            "rows": len(df)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.get("/uploads")
async def list_uploads():
    """List all uploaded data files"""
    data_dir = Path(__file__).parent / "data"
    if not data_dir.exists():
        return {"uploads": []}
    
    files = []
    for file_path in data_dir.glob("*.csv"):
        stat = file_path.stat()
        files.append({
            "filename": file_path.name,
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
        })
    
    return {"uploads": files}

@app.post("/report-case")
async def report_case(
    barangay: str = Query(..., description="Barangay name"),
    date: str = Query(..., description="Date of case"),
    symptoms: Optional[str] = Query(None, description="Symptoms description")
):
    """Allow anonymous reporting of dengue cases/symptoms"""
    try:
        # In production, save to database
        # For now, just log the report
        report = {
            "barangay": barangay,
            "date": date,
            "symptoms": symptoms,
            "reported_at": datetime.now().isoformat()
        }
        
        # Save to reports file
        reports_dir = Path(__file__).parent / "data"
        reports_dir.mkdir(exist_ok=True)
        reports_file = reports_dir / "case_reports.jsonl"
        
        import json
        with open(reports_file, "a") as f:
            f.write(json.dumps(report) + "\n")
        
        return {
            "message": "Case report submitted successfully",
            "report": report
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report error: {str(e)}")

@app.post("/model/retrain")
async def retrain_model():
    """
    Retrain the Random Forest model with latest data.
    This ensures maximum accuracy.
    """
    try:
        import subprocess
        import sys
        
        retrain_script = Path(__file__).parent / "retrain_model.py"
        if not retrain_script.exists():
            raise HTTPException(status_code=404, detail="Retrain script not found")
        
        # Run retraining script
        result = subprocess.run(
            [sys.executable, str(retrain_script)],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent.parent)
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Retraining failed: {result.stderr}"
            )
        
        # Reload model
        global model
        model = None
        model = load_model()
        
        return {
            "message": "Model retrained successfully",
            "output": result.stdout,
            "model_loaded": model is not None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
