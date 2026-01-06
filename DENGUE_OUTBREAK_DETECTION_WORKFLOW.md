# 🌡️ Dengue Outbreak Detection Workflow - Machine Learning Application

**System:** Denguess - AI-Powered Dengue Prediction System  
**Location:** Koronadal City, South Cotabato, Philippines  
**Model:** Random Forest Classifier with Advanced Feature Engineering  
**Version:** 2.0 (Optimized)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Data Pipeline](#data-pipeline)
4. [Feature Engineering](#feature-engineering)
5. [Model Training Workflow](#model-training-workflow)
6. [Prediction Workflow](#prediction-workflow)
7. [Evaluation & Monitoring](#evaluation--monitoring)
8. [Deployment Architecture](#deployment-architecture)
9. [Best Practices](#best-practices)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Executive Summary

The Dengue Outbreak Detection System uses machine learning to predict dengue outbreak periods based on climate data and historical case records. The system processes climate variables (temperature, humidity, rainfall) through an advanced Random Forest model to classify periods as **Outbreak** or **Non-Outbreak**, enabling proactive public health interventions.

### Key Capabilities

- ✅ **Real-time Prediction**: Weekly forecasts for 4 weeks ahead
- ✅ **High Accuracy**: 94.18% cross-validation accuracy
- ✅ **Multi-Barangay Support**: Predictions for 5 barangays in Koronadal City
- ✅ **Advanced Features**: 37 engineered features capturing temporal and interaction patterns
- ✅ **Automated Retraining**: Model updates with new data
- ✅ **Risk Classification**: Low, Moderate, High risk levels

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DENGUE OUTBREAK DETECTION SYSTEM              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│  Data Sources  │   │  ML Pipeline    │   │   API Layer   │
│                │   │                 │   │                │
│ • Climate CSV  │──▶│ • Preprocessing │──▶│ • FastAPI      │
│ • Cases CSV    │   │ • Feature Eng.  │   │ • Predictions  │
│ • Historical   │   │ • Model Training│   │ • Dashboard   │
└────────────────┘   │ • Evaluation    │   └────────────────┘
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Model Storage  │
                     │                 │
                     │ • rf_model.pkl  │
                     │ • features.pkl  │
                     └─────────────────┘
```

---

## 📊 Data Pipeline

### 1. Data Collection

#### Input Data Sources

**Climate Data (`climate.csv`)**
```csv
date,temperature,humidity,rainfall
2020-01-01,27.45,73,161.2
2020-02-01,27.9,66,29.1
...
```

**Dengue Cases Data (`dengue_cases.csv`)**
```csv
date,barangay,cases
2020-01-01,General Paulino Santos,4
2020-01-01,Morales,4
...
```

### 2. Data Preprocessing Workflow

```
┌──────────────┐
│  Raw Data    │
│  (CSV Files) │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│  Data Validation    │
│  • Date parsing     │
│  • Type checking    │
│  • Range validation │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Data Cleaning     │
│  • Remove NaN      │
│  • Handle outliers │
│  • Date alignment  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Data Merging       │
│  • Join on date     │
│  • Aggregate cases  │
│  • Create labels    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Label Creation     │
│  • Binary:          │
│    - 0 = No Outbreak│
│    - 1 = Outbreak   │
└─────────────────────┘
```

### 3. Data Validation Rules

| Field | Validation | Range |
|-------|-----------|-------|
| **Temperature** | Numeric, non-null | 20-35°C |
| **Humidity** | Numeric, non-null | 40-100% |
| **Rainfall** | Numeric, non-null | 0-500mm |
| **Date** | Valid date format | YYYY-MM-DD |
| **Cases** | Integer, non-negative | ≥ 0 |

### 4. Label Generation

```python
# Binary Classification
label = 1 if cases > 0 else 0

# Where:
# 0 = Non-Outbreak Period (no dengue cases)
# 1 = Outbreak Period (one or more cases)
```

---

## 🔧 Feature Engineering

### Feature Engineering Pipeline

```
┌─────────────────┐
│  Base Features  │
│  • Temperature  │
│  • Humidity     │
│  • Rainfall     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      Feature Engineering Layer          │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 1. Temporal Features             │  │
│  │    • month, quarter, day_of_year │  │
│  │    • month_sin, month_cos        │  │
│  │    • day_of_year_sin/cos         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 2. Interaction Features          │  │
│  │    • temp × rainfall              │  │
│  │    • temp × humidity              │  │
│  │    • rainfall × humidity          │  │
│  │    • temp × rainfall × humidity   │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 3. Polynomial Features            │  │
│  │    • temperature², rainfall²      │  │
│  │    • √temperature, √rainfall      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 4. Ratio Features                │  │
│  │    • rainfall/temperature         │  │
│  │    • humidity/temperature         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 5. Climate Indices                │  │
│  │    • mosquito_breeding_index      │  │
│  │    • dengue_risk_index            │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 6. Categorical Features           │  │
│  │    • temp_optimal, temp_high      │  │
│  │    • humidity_optimal             │  │
│  │    • rainfall_high, rainfall_low  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 7. Seasonal Indicators            │  │
│  │    • is_rainy_season              │  │
│  │    • is_peak_season               │  │
│  └──────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────┐
│  37 Engineered Features  │
└──────────────────────────┘
```

### Feature Categories

#### 1. Temporal Features (7 features)
- **Month**: 1-12
- **Quarter**: 1-4
- **Day of Year**: 1-365
- **Cyclical Encoding**: sin/cos transformations for seasonality

#### 2. Interaction Features (4 features)
- Temperature × Rainfall
- Temperature × Humidity
- Rainfall × Humidity
- Temperature × Rainfall × Humidity

#### 3. Polynomial Features (5 features)
- Squared: temperature², rainfall², humidity²
- Square Root: √temperature, √rainfall

#### 4. Ratio Features (3 features)
- Rainfall/Temperature
- Humidity/Temperature
- Rainfall/Humidity

#### 5. Climate Indices (2 features)
- **Mosquito Breeding Index**: `(temp - 20) × (humidity/100) × (rainfall/100)`
- **Dengue Risk Index**: `(temp/30) × (humidity/80) × log(rainfall/10 + 1)`

#### 6. Categorical Features (9 features)
- Temperature categories: optimal (25-30°C), high (>30°C), low (<25°C)
- Humidity categories: optimal (60-80%), high (>80%), low (<60%)
- Rainfall categories: high (>100mm), moderate (50-100mm), low (<50mm)

#### 7. Seasonal Indicators (3 features)
- Rainy season (June-November)
- Dry season (December-May)
- Peak season (July-September)

#### 8. Combined Risk Indicators (1 feature)
- High-risk combination: optimal temp + optimal humidity + high rainfall

**Total: 37 Features**

---

## 🤖 Model Training Workflow

### Complete Training Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│              MODEL TRAINING WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

Step 1: Data Loading
├── Load climate.csv
├── Load dengue_cases.csv
├── Parse dates
└── Validate data integrity
         │
         ▼
Step 2: Data Merging
├── Merge on date
├── Aggregate cases by date
├── Create binary labels (outbreak = 1, no outbreak = 0)
└── Sort by date
         │
         ▼
Step 3: Feature Engineering
├── Create temporal features
├── Create interaction features
├── Create polynomial features
├── Create ratio features
├── Create climate indices
├── Create categorical features
└── Create seasonal indicators
         │
         ▼
Step 4: Data Splitting
├── Train: 85% (51 samples)
├── Test: 15% (9 samples)
├── Stratified split (maintains class distribution)
└── Random state: 42 (reproducibility)
         │
         ▼
Step 5: Hyperparameter Optimization (Optional)
├── GridSearchCV with 5-fold cross-validation
├── Parameter grid:
│   • n_estimators: [200, 300, 500]
│   • max_depth: [15, 20, 25, None]
│   • min_samples_split: [2, 4, 6]
│   • min_samples_leaf: [1, 2, 3]
│   • max_features: ['sqrt', 'log2', None]
│   • class_weight: ['balanced', 'balanced_subsample']
└── Scoring: F1 score
         │
         ▼
Step 6: Model Training
├── Random Forest Classifier
├── Best parameters:
│   • n_estimators: 300
│   • max_depth: 20
│   • min_samples_split: 2
│   • min_samples_leaf: 1
│   • max_features: 'sqrt'
│   • class_weight: 'balanced'
│   • bootstrap: True
│   • random_state: 42
└── Fit on training data
         │
         ▼
Step 7: Model Evaluation
├── Predict on test set
├── Calculate metrics:
│   • Accuracy
│   • Precision
│   • Recall
│   • F1 Score
│   • ROC AUC
├── Generate confusion matrix
└── Cross-validation (5-fold)
         │
         ▼
Step 8: Model Persistence
├── Save model: rf_dengue_model.pkl
├── Save feature names: feature_names.pkl
└── Verify model can be loaded
```

### Training Configuration

```python
RandomForestClassifier(
    n_estimators=300,          # Number of trees
    max_depth=20,               # Maximum tree depth
    min_samples_split=2,        # Minimum samples to split
    min_samples_leaf=1,         # Minimum samples in leaf
    max_features='sqrt',        # Features per split
    class_weight='balanced',   # Handle class imbalance
    bootstrap=True,            # Bootstrap sampling
    oob_score=True,            # Out-of-bag scoring
    random_state=42,           # Reproducibility
    n_jobs=-1                  # Parallel processing
)
```

### Training Metrics

| Metric | Value |
|--------|-------|
| **Training Samples** | 51 |
| **Test Samples** | 9 |
| **Features** | 37 |
| **Trees** | 300 |
| **Cross-Validation Accuracy** | 94.18% ± 9.52% |
| **Out-of-Bag Score** | 94.12% |

---

## 🔮 Prediction Workflow

### Real-Time Prediction Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│              PREDICTION WORKFLOW                             │
└─────────────────────────────────────────────────────────────┘

Step 1: Input Reception
├── Receive request:
│   • Barangay name
│   • Date (start date)
│   • Climate data (optional):
│     - Temperature (°C)
│     - Humidity (%)
│     - Rainfall (mm)
└── Validate inputs
         │
         ▼
Step 2: Climate Data Preparation
├── Week 1: Use provided climate data
├── Weeks 2-4: Use historical averages
│   • Get monthly/weekly averages
│   • Apply progressive variation
│   • Ensure realistic forecasts
└── Fallback to defaults if needed
         │
         ▼
Step 3: Feature Generation
├── For each week (1-4):
│   ├── Extract date features:
│   │   • month, quarter, day_of_year
│   │   • month_sin, month_cos
│   │   • day_of_year_sin, day_of_year_cos
│   ├── Create interaction features
│   ├── Create polynomial features
│   ├── Create ratio features
│   ├── Create climate indices
│   ├── Create categorical features
│   └── Create seasonal indicators
└── Generate 37 features per week
         │
         ▼
Step 4: Model Inference
├── Load trained model
├── Prepare feature DataFrame
│   • Ensure correct column order
│   • Match training feature names
├── Predict probabilities:
│   • predict_proba() → [P(no outbreak), P(outbreak)]
└── Extract outbreak probability
         │
         ▼
Step 5: Risk Classification
├── Convert probability to risk level:
│   • Low Risk: < 30%
│   • Moderate Risk: 30-60%
│   • High Risk: > 60%
└── Assign risk label
         │
         ▼
Step 6: Response Generation
├── Format weekly forecasts:
│   • Week range (e.g., "Jan 1-7")
│   • Risk level (Low/Moderate/High)
│   • Probability (0.0-1.0)
│   • Climate data used
└── Return JSON response
```

### Prediction API Flow

```python
# Example API Request
POST /predict
{
    "barangay": "Morales",
    "date": "2025-01-15",
    "climate": {
        "temperature": 28.5,
        "humidity": 75.0,
        "rainfall": 120.0
    }
}

# Example API Response
{
    "weekly_forecast": [
        {
            "week": "January 15-21",
            "risk": "High",
            "probability": 0.85,
            "climate_used": {
                "rainfall": 120.0,
                "temperature": 28.5,
                "humidity": 75.0,
                "source": "current"
            }
        },
        // ... weeks 2-4
    ],
    "model_info": {
        "model_type": "RandomForestClassifier",
        "features_used": 37,
        "prediction_date": "2025-01-06T08:00:00"
    }
}
```

### Risk Level Mapping

| Probability Range | Risk Level | Interpretation | Action |
|-------------------|------------|----------------|--------|
| **0.0 - 0.30** | 🟢 **Low** | Minimal outbreak risk | Normal monitoring |
| **0.30 - 0.60** | 🟡 **Moderate** | Moderate outbreak risk | Increased surveillance |
| **0.60 - 1.0** | 🔴 **High** | High outbreak risk | Alert & preventive measures |

---

## 📈 Evaluation & Monitoring

### Model Evaluation Metrics

#### 1. Performance Metrics

```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
Precision = TP / (TP + FP)
Recall = TP / (TP + FN)
F1 Score = 2 × (Precision × Recall) / (Precision + Recall)
```

#### 2. Confusion Matrix

```
                    Predicted
                 No Outbreak  Outbreak
Actual
No Outbreak         TN         FP
Outbreak            FN         TP
```

#### 3. Cross-Validation

- **Method**: Stratified K-Fold (5 folds)
- **Purpose**: Robust performance estimation
- **Current Performance**: 94.18% ± 9.52%

### Monitoring Workflow

```
┌─────────────────────────────────────────┐
│         MODEL MONITORING                │
└─────────────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐
│Weekly  │ │Monthly │ │Quarterly│
│Monitor │ │Review  │ │Audit   │
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    ▼          ▼          ▼
┌─────────────────────────────────┐
│  Monitoring Metrics:            │
│  • Prediction accuracy          │
│  • Model drift detection        │
│  • Feature importance changes   │
│  • Data quality checks          │
└─────────────────────────────────┘
```

### Retraining Triggers

1. **Automatic Retraining**
   - After new data uploads
   - Weekly scheduled retraining
   - When accuracy drops below threshold

2. **Manual Retraining**
   - Admin dashboard trigger
   - After significant data collection
   - Model performance degradation

---

## 🚀 Deployment Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SYSTEM                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐
│   Frontend       │         │   Backend API    │
│   (React/Vite)   │◄───────►│   (FastAPI)     │
│                 │         │                 │
│ • Dashboard      │         │ • /predict      │
│ • Heatmap        │         │ • /model/info   │
│ • Barangay Pages │         │ • /upload/*     │
└─────────────────┘         └────────┬────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Model Service     │
                          │                     │
                          │ • Load model        │
                          │ • Feature prep      │
                          │ • Prediction        │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Data Storage      │
                          │                     │
                          │ • rf_model.pkl      │
                          │ • feature_names.pkl │
                          │ • climate.csv       │
                          │ • dengue_cases.csv │
                          └─────────────────────┘
```

### Deployment Checklist

- [ ] Model trained and validated
- [ ] Model file saved (`rf_dengue_model.pkl`)
- [ ] Feature names saved (`feature_names.pkl`)
- [ ] API endpoints tested
- [ ] Frontend integrated
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Performance monitoring set up
- [ ] Documentation updated
- [ ] Backup strategy in place

---

## ✅ Best Practices

### 1. Data Quality

- ✅ **Validate inputs**: Check ranges, types, formats
- ✅ **Handle missing data**: Remove or impute appropriately
- ✅ **Outlier detection**: Filter extreme values
- ✅ **Data versioning**: Track data changes

### 2. Model Management

- ✅ **Version control**: Track model versions
- ✅ **Reproducibility**: Use random seeds
- ✅ **Model validation**: Test before deployment
- ✅ **A/B testing**: Compare model versions

### 3. Feature Engineering

- ✅ **Domain knowledge**: Use dengue-specific features
- ✅ **Temporal patterns**: Capture seasonality
- ✅ **Feature interactions**: Model complex relationships
- ✅ **Feature selection**: Remove irrelevant features

### 4. Monitoring

- ✅ **Performance tracking**: Monitor accuracy over time
- ✅ **Data drift detection**: Identify distribution changes
- ✅ **Error logging**: Track prediction errors
- ✅ **User feedback**: Collect real-world outcomes

### 5. Deployment

- ✅ **API versioning**: Support multiple model versions
- ✅ **Error handling**: Graceful failure modes
- ✅ **Caching**: Cache predictions for performance
- ✅ **Documentation**: Clear API and usage docs

---

## 🔍 Troubleshooting Guide

### Common Issues

#### 1. Low Prediction Accuracy

**Symptoms:**
- Accuracy < 90%
- High false positive/negative rate

**Solutions:**
- Check data quality
- Retrain with more data
- Adjust hyperparameters
- Review feature engineering

#### 2. Model Loading Errors

**Symptoms:**
- `FileNotFoundError` for model file
- Feature mismatch errors

**Solutions:**
- Verify model file exists
- Check feature names match
- Ensure correct file paths
- Re-train model if needed

#### 3. Prediction Errors

**Symptoms:**
- API returns errors
- Invalid predictions

**Solutions:**
- Validate input data
- Check feature generation
- Verify model compatibility
- Review error logs

#### 4. Performance Issues

**Symptoms:**
- Slow predictions
- High memory usage

**Solutions:**
- Optimize feature generation
- Cache model loading
- Use model compression
- Scale infrastructure

---

## 📚 Technical Specifications

### System Requirements

| Component | Requirement |
|-----------|-------------|
| **Python** | 3.8+ |
| **scikit-learn** | 1.6.1 |
| **pandas** | 2.1.3 |
| **numpy** | 1.26.2 |
| **FastAPI** | 0.104.1 |
| **Memory** | 2GB+ |
| **Storage** | 500MB+ |

### Model Specifications

| Parameter | Value |
|-----------|-------|
| **Algorithm** | Random Forest Classifier |
| **Trees** | 300 |
| **Max Depth** | 20 |
| **Features** | 37 |
| **Training Time** | ~2-5 minutes |
| **Prediction Time** | <100ms |

---

## 🎓 Key Learnings & Insights

### What Makes This System Effective

1. **Advanced Feature Engineering**
   - 37 features capture complex patterns
   - Temporal features handle seasonality
   - Interaction features model relationships

2. **Robust Model Architecture**
   - Random Forest handles non-linearity
   - Class weighting addresses imbalance
   - Cross-validation ensures reliability

3. **Real-World Integration**
   - Historical climate data
   - Multi-barangay support
   - Weekly forecasting

4. **Continuous Improvement**
   - Automated retraining
   - Performance monitoring
   - Data collection pipeline

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review prediction accuracy
- **Monthly**: Retrain model with new data
- **Quarterly**: Full system audit
- **Annually**: Model architecture review

### Contact & Resources

- **Documentation**: See `MODEL_PERFORMANCE_REPORT.md`
- **API Docs**: `/docs` endpoint
- **Code Repository**: GitHub repository
- **Issue Tracking**: GitHub Issues

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| **2.0** | 2025-01-06 | Advanced feature engineering, hyperparameter optimization |
| **1.0** | 2024-XX-XX | Initial release with basic features |

---

**Last Updated:** 2025-01-06  
**Maintained By:** Denguess Development Team  
**Status:** ✅ Production Ready

---

*This workflow document provides a comprehensive guide to the dengue outbreak detection system. For specific implementation details, refer to the source code and API documentation.*
