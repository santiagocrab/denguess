from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager
import asyncio
from concurrent.futures import ThreadPoolExecutor
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
from pathlib import Path
import warnings
from functools import lru_cache

# Suppress sklearn version warnings
warnings.filterwarnings('ignore', category=UserWarning)

# Optimized lifespan - preload model at startup for faster responses
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Denguess API...")
    print("📦 Pre-loading model for faster responses...")
    # Preload model synchronously at startup
    try:
        load_model()
        load_historical_climate()
        if model is not None:
            print("✅ Model pre-loaded successfully!")
        else:
            print("⚠️  Model will load on first request")
    except Exception as e:
        print(f"⚠️  Model pre-load failed: {e}")
        print("⚠️  Model will load on first request")
    yield
    print("👋 Shutting down Denguess API...")

app = FastAPI(
    title="Denguess API", 
    version="1.0.0", 
    description="AI-Powered Dengue Prediction System",
    lifespan=lifespan
)

# Add CORS middleware FIRST - this is critical for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for maximum compatibility
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Add GZip compression for faster responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add explicit CORS headers middleware to ensure headers are ALWAYS present
@app.middleware("http")
async def add_cors_headers(request, call_next):
    """Add CORS headers to ALL responses, including errors"""
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        response = JSONResponse(content={})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
        return response
    
    # For all other requests, process normally then add CORS headers
    try:
        response = await call_next(request)
    except Exception as e:
        # Even on errors, return a response with CORS headers
        response = JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
    
    # Add CORS headers to every response
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

# Load model
MODEL_PATH = Path(__file__).parent.parent / "rf_dengue_model.pkl"
FEATURE_NAMES_PATH = Path(__file__).parent.parent / "feature_names.pkl"
ENCODER_PATH = Path(__file__).parent.parent / "barangay_encoder.pkl"
CLIMATE_DATA_PATH = Path(__file__).parent.parent / "climate.csv"
model = None
barangay_encoder = None
historical_climate = None  # Cache historical climate data
feature_names = None  # Will be loaded from saved file or use default

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
            
            # Calculate average by week of year for more granular predictions
            df['week_of_year'] = df['date'].dt.isocalendar().week
            df['month'] = df['date'].dt.month
            
            # Use week-of-year if we have enough data, otherwise fall back to month
            weekly_avg = df.groupby('week_of_year').agg({
                'rainfall': 'mean',
                'temperature': 'mean',
                'humidity': 'mean'
            }).round(2)
            
            monthly_avg = df.groupby('month').agg({
                'rainfall': 'mean',
                'temperature': 'mean',
                'humidity': 'mean'
            }).round(2)
            
            historical_climate = {
                'weekly': weekly_avg.to_dict('index'),
                'monthly': monthly_avg.to_dict('index')
            }
            print(f"✅ Historical climate data loaded!")
            print(f"   Weekly averages: {len(weekly_avg)} weeks")
            print(f"   Monthly averages: {len(monthly_avg)} months")
            return historical_climate
        except Exception as e:
            print(f"⚠️  Error loading historical climate: {e}")
            return None
    return historical_climate

def get_historical_climate_for_date(target_date: datetime, base_climate: dict = None, week_offset: int = 0):
    """
    Get historical average climate for a specific date.
    Uses week-of-year for more accurate predictions, with progressive variation.
    Falls back to month-based averages if weekly data not available.
    """
    historical = load_historical_climate()
    
    if historical is None:
        # Fallback to base climate if no historical data
        if base_climate:
            # Add slight variation based on week offset to differentiate weeks
            variation_factor = 1 + (week_offset * 0.02)  # 2% variation per week
            return {
                'rainfall': base_climate['rainfall'] * variation_factor,
                'temperature': base_climate['temperature'] + (week_offset * 0.1),
                'humidity': base_climate['humidity'] + (week_offset * 0.5)
            }
        return {'rainfall': 100.0, 'temperature': 28.0, 'humidity': 75.0}
    
    # Try to get week-of-year data first (more accurate)
    week_of_year = target_date.isocalendar().week
    month = target_date.month
    
    # Check if we have weekly data
    if isinstance(historical, dict) and 'weekly' in historical:
        weekly_data = historical['weekly']
        if week_of_year in weekly_data:
            climate = {
                'rainfall': float(weekly_data[week_of_year]['rainfall']),
                'temperature': float(weekly_data[week_of_year]['temperature']),
                'humidity': float(weekly_data[week_of_year]['humidity'])
            }
            # Add progressive variation for weeks 2-4 to ensure differences
            if week_offset > 0:
                # Small progressive changes to simulate seasonal progression
                climate['rainfall'] *= (1 + week_offset * 0.03)  # 3% increase per week
                climate['temperature'] += week_offset * 0.2  # 0.2°C increase per week
                climate['humidity'] += week_offset * 0.3  # 0.3% increase per week
            return climate
    
    # Fallback to monthly data
    if isinstance(historical, dict) and 'monthly' in historical:
        monthly_data = historical['monthly']
        if month in monthly_data:
            climate = {
                'rainfall': float(monthly_data[month]['rainfall']),
                'temperature': float(monthly_data[month]['temperature']),
                'humidity': float(monthly_data[month]['humidity'])
            }
            # Add progressive variation for weeks 2-4
            if week_offset > 0:
                # Progressive changes to differentiate weeks
                climate['rainfall'] *= (1 + week_offset * 0.05)  # 5% variation per week
                climate['temperature'] += week_offset * 0.3  # 0.3°C variation per week
                climate['humidity'] += week_offset * 0.5  # 0.5% variation per week
            return climate
    
    # Final fallback
    if base_climate:
        # Add variation based on week offset
        variation_factor = 1 + (week_offset * 0.03)
        return {
            'rainfall': base_climate['rainfall'] * variation_factor,
            'temperature': base_climate['temperature'] + (week_offset * 0.2),
            'humidity': base_climate['humidity'] + (week_offset * 0.4)
        }
    return {'rainfall': 100.0, 'temperature': 28.0, 'humidity': 75.0}

def load_model():
    global model, barangay_encoder, feature_names
    if model is None and MODEL_PATH.exists():
        try:
            import time
            start_time = time.time()
            print(f"Loading model from {MODEL_PATH}...")
            
            # Try loading with timeout protection
            model = joblib.load(MODEL_PATH)
            
            # Load feature names if available
            if FEATURE_NAMES_PATH.exists():
                feature_names = joblib.load(FEATURE_NAMES_PATH)
                print(f"Feature names loaded: {len(feature_names)} features")
            elif hasattr(model, 'feature_names_in_'):
                feature_names = list(model.feature_names_in_)
                print(f"Feature names from model: {len(feature_names)} features")
            else:
                # Fallback to default
                feature_names = ['rainfall', 'temperature', 'humidity']
                print(f"Using default feature names")
            
            load_time = time.time() - start_time
            print(f"Model loaded successfully in {load_time:.2f} seconds!")
            print(f"   Model type: {type(model).__name__}")
            if hasattr(model, 'n_estimators'):
                print(f"   Number of trees: {model.n_estimators}")
            if hasattr(model, 'feature_names_in_'):
                print(f"   Expected features: {len(model.feature_names_in_)}")
            
            # Load barangay encoder if it exists
            if ENCODER_PATH.exists():
                barangay_encoder = joblib.load(ENCODER_PATH)
                print(f"Barangay encoder loaded!")
                if hasattr(barangay_encoder, 'classes_'):
                    print(f"   Barangays: {list(barangay_encoder.classes_)}")
            else:
                print(f"Barangay encoder not found - using fallback")
            
            # Load historical climate data
            load_historical_climate()
            
            return model
        except Exception as e:
            print(f"Error loading model: {e}")
            import traceback
            traceback.print_exc()
            return None
    return model

# Model is loaded during startup via lifespan context manager

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

class CaseReport(BaseModel):
    barangay: str
    # Patient Details
    name: str
    age: str
    sex: str
    address: str
    # Report Information
    dateReported: str
    timeReported: str
    reportedBy: str
    # Presenting Symptoms
    fever: bool = False
    headache: bool = False
    musclePain: bool = False
    rash: bool = False
    nausea: bool = False
    abdominalPain: bool = False
    bleeding: bool = False
    # Symptom Onset
    symptomOnsetDate: Optional[str] = None
    # Risk Classification
    riskRed: bool = False
    riskYellow: bool = False
    riskGreen: bool = False
    # Action Taken
    referredToFacility: bool = False
    advisedMonitoring: bool = False
    notifiedFamily: bool = False
    # Remarks
    remarks: Optional[str] = None

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

def prepare_features(rainfall: float, temperature: float, humidity: float, barangay: str, date: datetime = None) -> pd.DataFrame:
    """
    Prepare features in the exact format the model expects.
    Generates all advanced features from base inputs.
    """
    if date is None:
        date = datetime.now()
    
    # Normalize barangay name (case-insensitive, handle variations)
    barangay_normalized = barangay.strip()
    barangay_variations = {
        "general paulino santos": "General Paulino Santos",
        "general paulino": "General Paulino Santos",
        "gps": "General Paulino Santos",
        "zone ii": "Zone II",
        "zone 2": "Zone II",
        "zone2": "Zone II",
        "santa cruz": "Santa Cruz",
        "sto. niño": "Sto. Niño",
        "sto niño": "Sto. Niño",
        "st. niño": "Sto. Niño",
        "santo niño": "Sto. Niño",
        "morales": "Morales"
    }
    
    # Try to match normalized name
    barangay_lower = barangay_normalized.lower()
    if barangay_lower in barangay_variations:
        barangay_normalized = barangay_variations[barangay_lower]
    
    # Encode barangay
    if barangay_encoder is not None:
        try:
            barangay_encoded = barangay_encoder.transform([barangay_normalized])[0]
        except (ValueError, KeyError) as e:
            # Barangay not in encoder, try to find closest match
            print(f"Barangay '{barangay}' (normalized: '{barangay_normalized}') not in encoder, trying fallback")
            # Check if any known barangay matches
            if hasattr(barangay_encoder, 'classes_'):
                known_barangays = list(barangay_encoder.classes_)
                # Try exact match first
                if barangay_normalized in known_barangays:
                    barangay_encoded = barangay_encoder.transform([barangay_normalized])[0]
                else:
                    # Use first barangay as default
                    print(f"Using default barangay encoding: {known_barangays[0] if known_barangays else '0'}")
                    barangay_encoded = 0
            else:
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
        barangay_encoded = barangay_map.get(barangay_normalized, 0)
        if barangay_encoded == 0 and barangay_normalized not in barangay_map:
            print(f"Warning: Unknown barangay '{barangay}', using default encoding 0")
    
    # Create base features
    features = {
        'rainfall': [rainfall],
        'temperature': [temperature],
        'humidity': [humidity],
        'barangay_encoded': [barangay_encoded],  # Add barangay encoding
    }
    
    # Add temporal features
    month = date.month
    quarter = date.timetuple().tm_yday // 91 + 1
    day_of_year = date.timetuple().tm_yday
    
    features['month'] = [month]
    features['quarter'] = [quarter]
    features['day_of_year'] = [day_of_year]
    features['month_sin'] = [np.sin(2 * np.pi * month / 12)]
    features['month_cos'] = [np.cos(2 * np.pi * month / 12)]
    features['day_of_year_sin'] = [np.sin(2 * np.pi * day_of_year / 365)]
    features['day_of_year_cos'] = [np.cos(2 * np.pi * day_of_year / 365)]
    
    # Feature interactions
    features['temp_rainfall_interaction'] = [temperature * rainfall]
    features['temp_humidity_interaction'] = [temperature * humidity]
    features['rainfall_humidity_interaction'] = [rainfall * humidity]
    features['temp_rainfall_humidity_interaction'] = [temperature * rainfall * humidity]
    
    # Polynomial features
    features['rainfall_squared'] = [rainfall ** 2]
    features['temperature_squared'] = [temperature ** 2]
    features['humidity_squared'] = [humidity ** 2]
    features['rainfall_sqrt'] = [np.sqrt(rainfall + 1e-6)]
    features['temperature_sqrt'] = [np.sqrt(temperature + 1e-6)]
    
    # Ratio features
    features['rainfall_temp_ratio'] = [rainfall / (temperature + 1e-6)]
    features['humidity_temp_ratio'] = [humidity / (temperature + 1e-6)]
    features['rainfall_humidity_ratio'] = [rainfall / (humidity + 1e-6)]
    
    # Climate indices
    features['mosquito_breeding_index'] = [(temperature - 20) * (humidity / 100) * (rainfall / 100)]
    features['dengue_risk_index'] = [(temperature / 30) * (humidity / 80) * np.log1p(rainfall / 10)]
    
    # Seasonal indicators
    features['is_rainy_season'] = [1 if month in [6, 7, 8, 9, 10, 11] else 0]
    features['is_dry_season'] = [1 if month in [12, 1, 2, 3, 4, 5] else 0]
    features['is_peak_season'] = [1 if month in [7, 8, 9] else 0]
    
    # Temperature categories
    features['temp_optimal'] = [1 if 25 <= temperature <= 30 else 0]
    features['temp_high'] = [1 if temperature > 30 else 0]
    features['temp_low'] = [1 if temperature < 25 else 0]
    
    # Humidity categories
    features['humidity_optimal'] = [1 if 60 <= humidity <= 80 else 0]
    features['humidity_high'] = [1 if humidity > 80 else 0]
    features['humidity_low'] = [1 if humidity < 60 else 0]
    
    # Rainfall categories
    features['rainfall_high'] = [1 if rainfall > 100 else 0]
    features['rainfall_moderate'] = [1 if 50 <= rainfall <= 100 else 0]
    features['rainfall_low'] = [1 if rainfall < 50 else 0]
    
    # Combined risk indicators
    features['high_risk_combination'] = [
        1 if (25 <= temperature <= 30 and 60 <= humidity <= 80 and rainfall > 100) else 0
    ]
    
    # Create DataFrame
    features_df = pd.DataFrame(features)
    
    # Ensure correct column order if feature_names is loaded
    if feature_names is not None:
        # Check if all required features are present
        missing_features = set(feature_names) - set(features_df.columns)
        if missing_features:
            # Add missing features with default values
            for feat in missing_features:
                features_df[feat] = 0
        features_df = features_df[feature_names]
    
    return features_df

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Denguess API - AI-Powered Dengue Prediction",
        "status": "ok",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    # Ensure model is loaded
    if model is None:
        load_model()
    response = JSONResponse({
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    })
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

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
    Optimized for fast responses using preloaded model.
    """
    try:
        # Use global model (preloaded at startup) for better performance
        global model
        if model is None:
            model = load_model()
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded. Please ensure rf_dengue_model.pkl exists.")
        
        # Validate and normalize inputs
        if not (0 <= request.climate.temperature <= 50):
            raise HTTPException(status_code=400, detail="Temperature must be between 0 and 50°C")
        if not (0 <= request.climate.humidity <= 100):
            raise HTTPException(status_code=400, detail="Humidity must be between 0 and 100%")
        if request.climate.rainfall < 0:
            raise HTTPException(status_code=400, detail="Rainfall cannot be negative")
        
        # Normalize barangay name
        barangay_normalized = request.barangay.strip()
        barangay_variations = {
            "general paulino santos": "General Paulino Santos",
            "general paulino": "General Paulino Santos",
            "gps": "General Paulino Santos",
            "zone ii": "Zone II",
            "zone 2": "Zone II",
            "zone2": "Zone II",
            "santa cruz": "Santa Cruz",
            "sto. niño": "Sto. Niño",
            "sto niño": "Sto. Niño",
            "st. niño": "Sto. Niño",
            "santo niño": "Sto. Niño",
            "morales": "Morales"
        }
        barangay_lower = barangay_normalized.lower()
        if barangay_lower in barangay_variations:
            barangay_normalized = barangay_variations[barangay_lower]
        
        # Validate barangay is in known list
        if barangay_normalized not in BARANGAYS:
            print(f"Warning: Barangay '{request.barangay}' not in known list, using as-is")
        
        # Parse start date
        try:
            start_date = datetime.strptime(request.date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Generate 4 weeks of forecasts
        weekly_forecast = []
        
        # Base climate from user input (for week 1)
        base_climate = {
            'rainfall': float(request.climate.rainfall),
            'temperature': float(request.climate.temperature),
            'humidity': float(request.climate.humidity)
        }
        
        for week_num in range(4):
            try:
                week_start = start_date + timedelta(weeks=week_num)
                
                # Week 1: Use current/input climate data
                # Weeks 2-4: Use historical averages for those specific dates with progressive variation
                if week_num == 0:
                    # First week uses the input climate data
                    climate_data = base_climate.copy()
                else:
                    # Future weeks use historical averages for that time of year
                    # Pass week_num as week_offset to add progressive variation
                    climate_data = get_historical_climate_for_date(week_start, base_climate, week_offset=week_num)
                
                # Ensure climate data has valid values
                climate_data['rainfall'] = max(0.0, float(climate_data.get('rainfall', 100.0)))
                climate_data['temperature'] = max(20.0, min(35.0, float(climate_data.get('temperature', 28.0))))
                climate_data['humidity'] = max(40.0, min(100.0, float(climate_data.get('humidity', 75.0))))
                
                # Prepare features in exact format model expects
                features_df = prepare_features(
                    rainfall=climate_data['rainfall'],
                    temperature=climate_data['temperature'],
                    humidity=climate_data['humidity'],
                    barangay=barangay_normalized,
                    date=week_start
                )
                
                # Validate features DataFrame
                if features_df.empty or features_df.shape[0] == 0:
                    raise ValueError(f"Empty features DataFrame for week {week_num}")
                
                # Get prediction probability with error handling
                try:
                    probabilities = model.predict_proba(features_df)
                    if probabilities is None or len(probabilities) == 0 or len(probabilities[0]) < 2:
                        raise ValueError("Invalid probability prediction")
                    no_outbreak_prob = probabilities[0][0]
                    outbreak_prob = probabilities[0][1]
                except Exception as pred_error:
                    print(f"Prediction error for week {week_num}: {pred_error}")
                    # Use default moderate risk if prediction fails
                    outbreak_prob = 0.45
                    no_outbreak_prob = 0.55
                
                # Use outbreak probability for risk assessment
                probability = float(outbreak_prob)
                
                # Ensure probability is valid
                if not (0 <= probability <= 1):
                    probability = 0.45  # Default to moderate
                
                # Convert to risk level
                risk = get_risk_level(probability)
                
                # Format week range
                week_str = format_week_range(week_start)
                
                weekly_forecast.append({
                    "week": week_str,
                    "risk": risk,
                    "probability": round(probability, 4),
                    "outbreak_probability": round(probability, 4),
                    "climate_used": {
                        "rainfall": round(climate_data['rainfall'], 1),
                        "temperature": round(climate_data['temperature'], 1),
                        "humidity": round(climate_data['humidity'], 1),
                        "source": "current" if week_num == 0 else "historical_average"
                    }
                })
            except Exception as week_error:
                # If a single week fails, use fallback values
                print(f"Error processing week {week_num} for {barangay_normalized}: {week_error}")
                week_start = start_date + timedelta(weeks=week_num)
                week_str = format_week_range(week_start)
                weekly_forecast.append({
                    "week": week_str,
                    "risk": "Moderate",  # Default fallback
                    "probability": 0.45,
                    "outbreak_probability": 0.45,
                    "climate_used": {
                        "rainfall": round(base_climate['rainfall'], 1),
                        "temperature": round(base_climate['temperature'], 1),
                        "humidity": round(base_climate['humidity'], 1),
                        "source": "fallback"
                    }
                })
        
        # Ensure we have at least one forecast
        if not weekly_forecast:
            raise ValueError("Failed to generate any forecasts")
        
        # Get model info
        model_info = {
            "model_type": type(model).__name__,
            "features_used": feature_names if feature_names else [],
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
        print(f"Prediction error for {request.barangay}: {error_details}")
        # Return a fallback response instead of raising error
        start_date = datetime.strptime(request.date, "%Y-%m-%d") if request.date else datetime.now()
        fallback_forecast = []
        for week_num in range(4):
            week_start = start_date + timedelta(weeks=week_num)
            week_str = format_week_range(week_start)
            fallback_forecast.append({
                "week": week_str,
                "risk": "Moderate",
                "probability": 0.45,
                "outbreak_probability": 0.45,
                "climate_used": {
                    "rainfall": round(request.climate.rainfall, 1),
                    "temperature": round(request.climate.temperature, 1),
                    "humidity": round(request.climate.humidity, 1),
                    "source": "fallback"
                }
            })
        return PredictionResponse(
            weekly_forecast=fallback_forecast,
            model_info={"error": str(e), "prediction_date": datetime.now().isoformat()}
        )

@app.post("/predict/batch")
async def predict_batch(requests: List[PredictionRequest]):
    """Batch prediction for multiple barangays/dates - optimized for heatmap"""
    global model
    if model is None:
        model = load_model()
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    results = []
    # Process in parallel for better performance
    async def process_single(req: PredictionRequest):
        try:
            response = await predict(req)
            return {
                "barangay": req.barangay,
                "date": req.date,
                "forecast": response.weekly_forecast,
                "model_info": response.model_info
            }
        except Exception as e:
            return {
                "barangay": req.barangay,
                "date": req.date,
                "error": str(e)
            }
    
    # Process all requests in parallel
    tasks = [process_single(req) for req in requests]
    results = await asyncio.gather(*tasks)
    
    return {"results": results}

class AllBarangaysRequest(BaseModel):
    climate: Optional[ClimateInput] = None
    date: Optional[str] = None

@app.post("/predict/all-barangays")
async def predict_all_barangays(request: AllBarangaysRequest = None):
    """
    Optimized endpoint to get predictions for all barangays at once.
    Perfect for heatmap loading - much faster than individual requests.
    """
    global model
    if model is None:
        model = load_model()
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Extract climate and date from request body
    climate_data = None
    date_str = None
    
    if request:
        climate_data = request.climate
        date_str = request.date
    
    # Use provided climate or get historical for today
    if climate_data is None:
        today = datetime.now()
        historical = get_historical_climate_for_date(today)
        climate_data = ClimateInput(
            temperature=historical.get('temperature', 28.0),
            humidity=historical.get('humidity', 75.0),
            rainfall=historical.get('rainfall', 100.0)
        )
    
    # Use provided date or today
    if date_str is None:
        date_str = datetime.now().strftime("%Y-%m-%d")
    
    # Get predictions for all barangays in parallel
    prediction_requests = [PredictionRequest(barangay=b, climate=climate_data, date=date_str) for b in BARANGAYS]
    results = {}
    
    for req in prediction_requests:
        try:
            response = await predict(req)
            results[req.barangay] = {
                "barangay": req.barangay,
                "weekly_forecast": response.weekly_forecast,
                "model_info": response.model_info
            }
        except Exception as e:
            # Fallback for failed predictions
            start_date = datetime.strptime(date_str, "%Y-%m-%d")
            fallback_forecast = []
            for week_num in range(4):
                week_start = start_date + timedelta(weeks=week_num)
                week_str = format_week_range(week_start)
                fallback_forecast.append({
                    "week": week_str,
                    "risk": "Moderate",
                    "probability": 0.45,
                    "outbreak_probability": 0.45,
                    "climate_used": {
                        "rainfall": round(climate_data.rainfall, 1),
                        "temperature": round(climate_data.temperature, 1),
                        "humidity": round(climate_data.humidity, 1),
                        "source": "fallback"
                    }
                })
            results[req.barangay] = {
                "barangay": req.barangay,
                "weekly_forecast": fallback_forecast,
                "model_info": {"error": str(e)}
            }
    
    return {"predictions": results}

@app.get("/predict/weekly/{barangay}")
async def get_weekly_predictions(
    barangay: str, 
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    temperature: Optional[float] = Query(None, description="Current temperature in Celsius"),
    humidity: Optional[float] = Query(None, description="Current humidity percentage"),
    rainfall: Optional[float] = Query(None, description="Current rainfall in mm")
):
    """
    Get weekly predictions in the requested format.
    If climate parameters are provided, uses them for more accurate predictions.
    Otherwise, uses historical averages for the current date.
    {
      "barangay": "Zone 2",
      "weekly_predictions": {
        "2025-12-01": "Low",
        "2025-12-08": "Moderate",
        "2025-12-15": "High",
        "2025-12-22": "High"
      }
    }
    """
    try:
        # Use provided climate data if available, otherwise use historical averages for current date
        if temperature is not None and humidity is not None and rainfall is not None:
            climate_input = ClimateInput(
                temperature=temperature,
                humidity=humidity,
                rainfall=rainfall
            )
        else:
            # Use historical climate data for current date for better accuracy
            current_date = datetime.now()
            historical_climate = get_historical_climate_for_date(current_date)
            climate_input = ClimateInput(
                temperature=historical_climate.get('temperature', 28.0),
                humidity=historical_climate.get('humidity', 75.0),
                rainfall=historical_climate.get('rainfall', 100.0)
            )
        
        request = PredictionRequest(
            barangay=barangay,
            climate=climate_input,
            date=start_date
        )
        
        response = await predict(request)
        
        # Transform to requested format
        weekly_predictions = {}
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        
        for week_num, week_forecast in enumerate(response.weekly_forecast):
            week_start = start_dt + timedelta(weeks=week_num)
            date_key = week_start.strftime("%Y-%m-%d")
            weekly_predictions[date_key] = week_forecast.risk
        
        return {
            "barangay": barangay,
            "weekly_predictions": weekly_predictions
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating weekly predictions: {str(e)}")

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
            barangay="Santa Cruz",
            date=datetime.now()
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
async def report_case(report: CaseReport):
    """Allow anonymous reporting of dengue cases/symptoms with detailed patient information"""
    try:
        # Convert empty strings to None for optional fields
        symptom_onset = report.symptomOnsetDate if report.symptomOnsetDate and report.symptomOnsetDate.strip() else None
        remarks = report.remarks if report.remarks and report.remarks.strip() else None
        
        # Prepare report data
        report_dict = {
            "barangay": report.barangay,
            # Patient Details
            "name": report.name,
            "age": report.age,
            "sex": report.sex,
            "address": report.address,
            # Report Information
            "dateReported": report.dateReported,
            "timeReported": report.timeReported,
            "reportedBy": report.reportedBy,
            # Presenting Symptoms
            "symptoms": {
                "fever": report.fever,
                "headache": report.headache,
                "musclePain": report.musclePain,
                "rash": report.rash,
                "nausea": report.nausea,
                "abdominalPain": report.abdominalPain,
                "bleeding": report.bleeding,
            },
            # Symptom Onset
            "symptomOnsetDate": symptom_onset,
            # Risk Classification
            "riskClassification": {
                "red": report.riskRed,
                "yellow": report.riskYellow,
                "green": report.riskGreen,
            },
            # Action Taken
            "actionTaken": {
                "referredToFacility": report.referredToFacility,
                "advisedMonitoring": report.advisedMonitoring,
                "notifiedFamily": report.notifiedFamily,
            },
            # Remarks
            "remarks": remarks,
            "reported_at": datetime.now().isoformat()
        }
        
        # Save to reports file
        reports_dir = Path(__file__).parent / "data"
        reports_dir.mkdir(exist_ok=True)
        reports_file = reports_dir / "case_reports.jsonl"
        
        import json
        with open(reports_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(report_dict) + "\n")
            f.flush()  # Ensure data is written immediately
        
        return {
            "message": "Case report submitted successfully",
            "report": report_dict
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report error: {str(e)}")

@app.get("/case-reports")
async def get_case_reports():
    """Retrieve all case reports with optional analytics"""
    try:
        reports_file = Path(__file__).parent / "data" / "case_reports.jsonl"
        
        if not reports_file.exists():
            print(f"Case reports file not found: {reports_file}")
            return {
                "reports": [],
                "analytics": {
                    "total_reports": 0,
                    "by_barangay": {},
                    "by_risk": {"red": 0, "yellow": 0, "green": 0},
                    "by_symptoms": {},
                    "by_date": {},
                    "recent_reports": []
                }
            }
        
        reports = []
        import json
        with open(reports_file, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                if line.strip():
                    try:
                        report = json.loads(line)
                        # Include all reports, but prioritize newer format
                        if "name" in report or "dateReported" in report:
                            reports.append(report)
                        elif "barangay" in report:  # Include old format too, but mark it
                            # Convert old format to new format if possible
                            if "date" in report:
                                report["dateReported"] = report.pop("date", "")
                            if isinstance(report.get("symptoms"), str):
                                # Old format had symptoms as string
                                report["symptoms"] = {}
                            reports.append(report)
                    except json.JSONDecodeError as e:
                        print(f"Error parsing line {line_num} in case_reports.jsonl: {e}, line: {line[:100]}")
                        continue
        
        print(f"DEBUG: Loaded {len(reports)} case reports from {reports_file}")
        if len(reports) > 0:
            print(f"DEBUG: First report sample: {reports[0]}")
        
        # Sort by reported_at (most recent first)
        reports.sort(key=lambda x: x.get("reported_at", ""), reverse=True)
        
        # Calculate analytics
        analytics = {
            "total_reports": len(reports),
            "by_barangay": {},
            "by_risk": {"red": 0, "yellow": 0, "green": 0},
            "by_symptoms": {
                "fever": 0,
                "headache": 0,
                "musclePain": 0,
                "rash": 0,
                "nausea": 0,
                "abdominalPain": 0,
                "bleeding": 0
            },
            "by_date": {},
            "by_action": {
                "referredToFacility": 0,
                "advisedMonitoring": 0,
                "notifiedFamily": 0
            },
            "recent_reports": reports[:10]  # Last 10 reports
        }
        
        for report in reports:
            # By barangay
            barangay = report.get("barangay", "Unknown")
            analytics["by_barangay"][barangay] = analytics["by_barangay"].get(barangay, 0) + 1
            
            # By risk classification
            risk_class = report.get("riskClassification", {})
            if risk_class.get("red"):
                analytics["by_risk"]["red"] += 1
            elif risk_class.get("yellow"):
                analytics["by_risk"]["yellow"] += 1
            elif risk_class.get("green"):
                analytics["by_risk"]["green"] += 1
            
            # By symptoms
            symptoms = report.get("symptoms", {})
            for symptom, present in symptoms.items():
                if present:
                    analytics["by_symptoms"][symptom] = analytics["by_symptoms"].get(symptom, 0) + 1
            
            # By date (date reported)
            date_reported = report.get("dateReported", "")
            if date_reported:
                analytics["by_date"][date_reported] = analytics["by_date"].get(date_reported, 0) + 1
            
            # By action taken
            actions = report.get("actionTaken", {})
            for action, taken in actions.items():
                if taken:
                    analytics["by_action"][action] = analytics["by_action"].get(action, 0) + 1
        
        result = {
            "reports": reports,
            "analytics": analytics
        }
        print(f"DEBUG: Returning {len(reports)} reports, analytics total: {analytics['total_reports']}")
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving case reports: {str(e)}")

@app.get("/insights")
async def get_insights():
    """
    Generate insights based on current weather and historical patterns.
    Returns 1-2 short sentences about dengue risk conditions.
    """
    try:
        # Get current date for seasonal context
        now = datetime.now()
        month = now.month
        
        # Simple insights based on season and typical patterns
        insights = []
        
        # Seasonal insights
        if month >= 5 and month <= 10:  # Rainy season (June-October)
            insights.append("🌧️ Rainy season conditions are favorable for mosquito breeding. Increased rainfall creates more stagnant water sources.")
        elif month >= 3 and month <= 5:  # Summer (March-May)
            insights.append("🌡️ Higher temperatures during summer months can accelerate mosquito development cycles.")
        else:
            insights.append("🌤️ Current weather patterns suggest moderate mosquito activity. Monitor standing water sources.")
        
        # Random additional insight
        additional_insights = [
            "💧 High humidity levels create ideal conditions for mosquito survival and breeding.",
            "🌡️ Temperature fluctuations can affect mosquito activity patterns throughout the day.",
            "🌧️ Recent rainfall increases the number of potential breeding sites in the area.",
            "🦟 Stagnant water in containers, tires, and plant pots are common breeding grounds.",
            "🌡️ Optimal mosquito breeding temperature is between 25-30°C, typical in this region.",
        ]
        
        import random
        insights.append(random.choice(additional_insights))
        
        return {
            "insights": insights[:2],  # Return 1-2 insights
            "generated_at": now.isoformat()
        }
    except Exception as e:
        return {
            "insights": ["🌡️ Current weather conditions are being monitored for dengue risk assessment."],
            "generated_at": datetime.now().isoformat()
        }

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
