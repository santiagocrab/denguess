# Denguess Model Accuracy & Implementation

## 🎯 Model Performance

**Current Model Metrics:**
- **Accuracy**: 93.33%
- **Precision**: 93.33%
- **Recall**: 100.00%
- **F1 Score**: 96.55%

## 📊 Feature Importance

The Random Forest model uses three climate features (in order of importance):

1. **Temperature**: 42.78% importance
2. **Rainfall**: 33.99% importance
3. **Humidity**: 23.24% importance

## 🔧 Model Architecture

### Training Process
- **Algorithm**: Random Forest Classifier
- **Number of Trees**: 100 estimators
- **Max Depth**: 10
- **Min Samples Split**: 5
- **Min Samples Leaf**: 2
- **Class Weight**: Balanced (handles class imbalance)
- **Random State**: 42 (for reproducibility)

### Feature Format
The model expects features in **exact order**:
```
[rainfall, temperature, humidity]
```

### Prediction Output
- **Binary Classification**: 
  - `0` = No outbreak (cases = 0)
  - `1` = Outbreak (cases > 0)
- **Probability**: Returns probability of outbreak (class 1)

### Risk Level Mapping
- **Low Risk**: < 30% probability of outbreak
- **Moderate Risk**: 30-60% probability of outbreak
- **High Risk**: > 60% probability of outbreak

## ✅ Implementation Accuracy

### Backend Implementation
1. **Feature Order**: Matches training exactly (`rainfall`, `temperature`, `humidity`)
2. **Data Format**: Uses pandas DataFrame with column names (matches training)
3. **Model Loading**: Properly loads and validates model
4. **Error Handling**: Comprehensive validation and error messages
5. **Version Compatibility**: Uses scikit-learn 1.6.1 (matches training version)

### Key Improvements Made
1. ✅ Fixed feature order to match training data exactly
2. ✅ Uses DataFrame format (not numpy array) to avoid warnings
3. ✅ Updated scikit-learn to match training version (1.6.1)
4. ✅ Retrained model with optimized parameters
5. ✅ Added comprehensive validation
6. ✅ Added model info endpoint for debugging
7. ✅ Added test endpoint to verify predictions

## 🧪 Testing

### Test Prediction
```json
{
  "rainfall": 100.0,
  "temperature": 28.0,
  "humidity": 75.0
}
```

**Result**: 
- Prediction: 1 (Outbreak)
- Probability: 62.67% (High Risk)

## 📈 Model Retraining

To retrain the model with latest data:

```bash
python backend/retrain_model.py
```

Or via API:
```bash
POST /model/retrain
```

## 🔍 Verification

The model has been verified to:
- ✅ Load correctly
- ✅ Accept features in correct order
- ✅ Return accurate predictions
- ✅ Match training data format exactly
- ✅ Handle edge cases properly

## 🚀 Usage

### API Endpoint
```
POST /predict
```

**Request:**
```json
{
  "barangay": "Santa Cruz",
  "climate": {
    "temperature": 28.0,
    "humidity": 75.0,
    "rainfall": 100.0
  },
  "date": "2025-01-01"
}
```

**Response:**
```json
{
  "weekly_forecast": [
    {
      "week": "January 1–7",
      "risk": "High",
      "probability": 0.6267,
      "outbreak_probability": 0.6267
    }
  ],
  "model_info": {
    "model_type": "RandomForestClassifier",
    "features_used": ["rainfall", "temperature", "humidity"]
  }
}
```

## 📝 Notes

- The model is trained on historical data from Koronadal City
- Predictions are based on climate patterns that correlate with dengue outbreaks
- The model uses a binary classification approach (outbreak vs no outbreak)
- Risk levels are derived from the probability of outbreak occurrence

