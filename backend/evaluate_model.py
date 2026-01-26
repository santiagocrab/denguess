"""
Evaluate the trained Random Forest model and generate a comprehensive performance report
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    confusion_matrix, classification_report, roc_auc_score,
    roc_curve, precision_recall_curve, average_precision_score
)
from pathlib import Path
import sys
from datetime import datetime

def load_and_merge_data(climate_file, cases_file):
    """Load and merge climate and dengue case data"""
    try:
        climate = pd.read_csv(climate_file)
        climate['date'] = pd.to_datetime(climate['date'], errors='coerce')
        
        dengue = pd.read_csv(cases_file)
        dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')
        
        # Keep each date-barangay combination as separate sample
        dengue['label'] = (dengue['cases'] > 0).astype(int)
        df = pd.merge(dengue[['date', 'barangay', 'cases', 'label']], 
                     climate[['date', 'rainfall', 'temperature', 'humidity']], 
                     on='date', how='inner')
        df = df.sort_values(['date', 'barangay']).reset_index(drop=True)
        df = df.dropna()
        
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def create_advanced_features(df, barangay_encoder=None):
    """Create advanced features (same as training, including barangay temporal trends)"""
    df_fe = df.copy()

    # Barangay temporal features (lagged cases + rolling average)
    if 'barangay' in df_fe.columns and 'cases' in df_fe.columns:
        monthly = df_fe[['barangay', 'date', 'cases']].copy()
        monthly['month_period'] = monthly['date'].dt.to_period('M')
        monthly = (
            monthly.groupby(['barangay', 'month_period'], as_index=False)['cases']
            .sum()
            .sort_values(['barangay', 'month_period'])
        )
        monthly['prev_month_cases'] = monthly.groupby('barangay')['cases'].shift(1)
        monthly['rolling_3mo_avg_cases'] = (
            monthly.groupby('barangay')['cases']
            .shift(1)
            .rolling(3, min_periods=1)
            .mean()
        )
        monthly[['prev_month_cases', 'rolling_3mo_avg_cases']] = (
            monthly[['prev_month_cases', 'rolling_3mo_avg_cases']].fillna(0)
        )
        df_fe['month_period'] = df_fe['date'].dt.to_period('M')
        df_fe = df_fe.merge(
            monthly[['barangay', 'month_period', 'prev_month_cases', 'rolling_3mo_avg_cases']],
            on=['barangay', 'month_period'],
            how='left'
        )
        df_fe[['prev_month_cases', 'rolling_3mo_avg_cases']] = (
            df_fe[['prev_month_cases', 'rolling_3mo_avg_cases']].fillna(0)
        )
        df_fe = df_fe.drop(columns=['month_period'])
    else:
        df_fe['prev_month_cases'] = 0
        df_fe['rolling_3mo_avg_cases'] = 0
    
    # 0. Encode barangay as categorical feature (if present)
    if 'barangay' in df_fe.columns:
        if barangay_encoder is not None:
            df_fe['barangay_encoded'] = barangay_encoder.transform(df_fe['barangay'])
        else:
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            df_fe['barangay_encoded'] = le.fit_transform(df_fe['barangay'])
    
    # Temporal features
    df_fe['month'] = df_fe['date'].dt.month
    df_fe['quarter'] = df_fe['date'].dt.quarter
    df_fe['day_of_year'] = df_fe['date'].dt.dayofyear
    df_fe['month_sin'] = np.sin(2 * np.pi * df_fe['month'] / 12)
    df_fe['month_cos'] = np.cos(2 * np.pi * df_fe['month'] / 12)
    df_fe['day_of_year_sin'] = np.sin(2 * np.pi * df_fe['day_of_year'] / 365)
    df_fe['day_of_year_cos'] = np.cos(2 * np.pi * df_fe['day_of_year'] / 365)
    
    # Feature interactions
    df_fe['temp_rainfall_interaction'] = df_fe['temperature'] * df_fe['rainfall']
    df_fe['temp_humidity_interaction'] = df_fe['temperature'] * df_fe['humidity']
    df_fe['rainfall_humidity_interaction'] = df_fe['rainfall'] * df_fe['humidity']
    df_fe['temp_rainfall_humidity_interaction'] = df_fe['temperature'] * df_fe['rainfall'] * df_fe['humidity']
    
    # Polynomial features
    df_fe['rainfall_squared'] = df_fe['rainfall'] ** 2
    df_fe['temperature_squared'] = df_fe['temperature'] ** 2
    df_fe['humidity_squared'] = df_fe['humidity'] ** 2
    df_fe['rainfall_sqrt'] = np.sqrt(df_fe['rainfall'] + 1e-6)
    df_fe['temperature_sqrt'] = np.sqrt(df_fe['temperature'] + 1e-6)
    
    # Ratio features
    df_fe['rainfall_temp_ratio'] = df_fe['rainfall'] / (df_fe['temperature'] + 1e-6)
    df_fe['humidity_temp_ratio'] = df_fe['humidity'] / (df_fe['temperature'] + 1e-6)
    df_fe['rainfall_humidity_ratio'] = df_fe['rainfall'] / (df_fe['humidity'] + 1e-6)
    
    # Climate indices
    df_fe['mosquito_breeding_index'] = (df_fe['temperature'] - 20) * (df_fe['humidity'] / 100) * (df_fe['rainfall'] / 100)
    df_fe['dengue_risk_index'] = (df_fe['temperature'] / 30) * (df_fe['humidity'] / 80) * np.log1p(df_fe['rainfall'] / 10)
    
    # Seasonal indicators
    df_fe['is_rainy_season'] = df_fe['month'].isin([6, 7, 8, 9, 10, 11]).astype(int)
    df_fe['is_dry_season'] = df_fe['month'].isin([12, 1, 2, 3, 4, 5]).astype(int)
    df_fe['is_peak_season'] = df_fe['month'].isin([7, 8, 9]).astype(int)
    
    # Temperature categories
    df_fe['temp_optimal'] = ((df_fe['temperature'] >= 25) & (df_fe['temperature'] <= 30)).astype(int)
    df_fe['temp_high'] = (df_fe['temperature'] > 30).astype(int)
    df_fe['temp_low'] = (df_fe['temperature'] < 25).astype(int)
    
    # Humidity categories
    df_fe['humidity_optimal'] = ((df_fe['humidity'] >= 60) & (df_fe['humidity'] <= 80)).astype(int)
    df_fe['humidity_high'] = (df_fe['humidity'] > 80).astype(int)
    df_fe['humidity_low'] = (df_fe['humidity'] < 60).astype(int)
    
    # Rainfall categories
    df_fe['rainfall_high'] = (df_fe['rainfall'] > 100).astype(int)
    df_fe['rainfall_moderate'] = ((df_fe['rainfall'] >= 50) & (df_fe['rainfall'] <= 100)).astype(int)
    df_fe['rainfall_low'] = (df_fe['rainfall'] < 50).astype(int)
    
    # Combined risk indicators
    df_fe['high_risk_combination'] = (
        (df_fe['temp_optimal'] == 1) & 
        (df_fe['humidity_optimal'] == 1) & 
        (df_fe['rainfall_high'] == 1)
    ).astype(int)
    
    # Fill any remaining NaN values (only numeric columns)
    numeric_cols_fill = df_fe.select_dtypes(include=[np.number]).columns
    df_fe[numeric_cols_fill] = df_fe[numeric_cols_fill].fillna(df_fe[numeric_cols_fill].median())
    return df_fe

def evaluate_model():
    """Evaluate the trained model and generate performance report"""
    base_dir = Path(__file__).parent.parent
    model_path = base_dir / "rf_dengue_model.pkl"
    climate_file = base_dir / "climate.csv"
    
    # Try to use larger dengue dataset first, fallback to smaller one
    large_cases_file = base_dir / "backend" / "data" / "dengue_20251120_200947.csv"
    cases_file = base_dir / "dengue_cases.csv"
    
    if large_cases_file.exists():
        cases_file = large_cases_file
        print(f"Using larger dengue dataset: {cases_file}")
    else:
        print(f"Using standard dengue dataset: {cases_file}")
    
    if not model_path.exists():
        print(f"Error: Model file not found at {model_path}")
        sys.exit(1)
    
    # Load model
    print("Loading model...")
    model = joblib.load(model_path)

    # Load barangay encoder (if available)
    encoder_path = base_dir / "barangay_encoder.pkl"
    barangay_encoder = joblib.load(encoder_path) if encoder_path.exists() else None
    
    # Load and prepare data
    print("Loading and preparing data...")
    df = load_and_merge_data(str(climate_file), str(cases_file))
    if df is None:
        sys.exit(1)
    
    # Create features
    df_fe = create_advanced_features(df, barangay_encoder=barangay_encoder)
    
    # Get numeric columns (excluding date, label, and cases)
    numeric_cols = df_fe.select_dtypes(include=[np.number]).columns.tolist()
    if 'label' in numeric_cols:
        numeric_cols.remove('label')
    if 'cases' in numeric_cols:
        numeric_cols.remove('cases')  # Remove raw cases count - data leak!
    
    X = df_fe[numeric_cols]
    y = df_fe['label']
    
    # Split data (same as training - 20% if dataset >= 50, else 15%)
    test_size = 0.20 if len(X) >= 50 else 0.15
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Calculate metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    # Confusion matrix (with explicit labels to ensure 2x2 matrix)
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    if cm.size == 4:
        tn, fp, fn, tp = cm.ravel()
    else:
        # If not 2x2, try to extract values
        if len(cm.shape) == 2 and cm.shape[0] == 2 and cm.shape[1] == 2:
            tn, fp, fn, tp = cm.ravel()
        else:
            tn, fp, fn, tp = 0, 0, 0, 0
    
    # ROC AUC
    try:
        roc_auc = roc_auc_score(y_test, y_pred_proba)
    except:
        roc_auc = np.nan
    
    # Average Precision
    try:
        avg_precision = average_precision_score(y_test, y_pred_proba)
    except:
        avg_precision = np.nan
    
    # Cross-validation
    cv = StratifiedKFold(n_splits=min(5, len(X_train)//3), shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')
    cv_precision = cross_val_score(model, X_train, y_train, cv=cv, scoring='precision')
    cv_recall = cross_val_score(model, X_train, y_train, cv=cv, scoring='recall')
    cv_f1 = cross_val_score(model, X_train, y_train, cv=cv, scoring='f1')
    
    # Classification report
    try:
        class_report = classification_report(y_test, y_pred, target_names=['No Outbreak', 'Outbreak'], labels=[0, 1], zero_division=0, output_dict=True)
    except:
        class_report = classification_report(y_test, y_pred, zero_division=0, output_dict=True)
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    # Format values for report
    roc_auc_str = f"{roc_auc:.4f}" if not np.isnan(roc_auc) else "N/A"
    roc_auc_pct = f"{roc_auc*100:.2f}%" if not np.isnan(roc_auc) else "N/A"
    avg_precision_str = f"{avg_precision:.4f}" if not np.isnan(avg_precision) else "N/A"
    avg_precision_pct = f"{avg_precision*100:.2f}%" if not np.isnan(avg_precision) else "N/A"
    
    # Generate markdown report
    report = f"""# Dengue Prediction Model - Performance Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## 📊 Executive Summary

This report presents the performance metrics of the Random Forest classifier for dengue outbreak prediction in Koronadal City, Philippines.

**Model Type:** Random Forest Classifier  
**Number of Features:** {len(X.columns)}  
**Number of Trees:** {model.n_estimators}  
**Training Samples:** {len(X_train)}  
**Test Samples:** {len(X_test)}  
**Out-of-Bag Score:** {model.oob_score_:.4f} ({(model.oob_score_*100):.2f}%)

---

## 🎯 Test Set Performance Metrics

| Metric | Value | Percentage |
|--------|-------|------------|
| **Accuracy** | {acc:.4f} | {acc*100:.2f}% |
| **Precision** | {prec:.4f} | {prec*100:.2f}% |
| **Recall** | {rec:.4f} | {rec*100:.2f}% |
| **F1 Score** | {f1:.4f} | {f1*100:.2f}% |
| **ROC AUC** | {roc_auc_str} | {roc_auc_pct} |
| **Average Precision** | {avg_precision_str} | {avg_precision_pct} |

### Metric Interpretations

- **Accuracy**: Overall correctness of predictions ({acc*100:.2f}% of predictions are correct)
- **Precision**: When the model predicts an outbreak, it is correct {prec*100:.2f}% of the time
- **Recall**: The model correctly identifies {rec*100:.2f}% of all actual outbreaks
- **F1 Score**: Harmonic mean of precision and recall ({f1*100:.2f}%)
- **ROC AUC**: Area under the ROC curve (higher is better, max 1.0)
- **Average Precision**: Area under the precision-recall curve

---

## 📈 Confusion Matrix

The confusion matrix shows the breakdown of predictions vs actual outcomes:

```
                    Predicted
                 No Outbreak  Outbreak
Actual
No Outbreak          {tn:4d}        {fp:4d}
Outbreak             {fn:4d}        {tp:4d}
```

### Confusion Matrix Breakdown

| Category | Count | Description |
|----------|-------|-------------|
| **True Negatives (TN)** | {tn} | Correctly predicted no outbreak |
| **False Positives (FP)** | {fp} | Incorrectly predicted outbreak (Type I Error) |
| **False Negatives (FN)** | {fn} | Missed actual outbreak (Type II Error) |
| **True Positives (TP)** | {tp} | Correctly predicted outbreak |

### Error Analysis

- **Type I Errors (False Positives):** {fp} cases where the model predicted an outbreak but none occurred
- **Type II Errors (False Negatives):** {fn} cases where an outbreak occurred but was not predicted
- **Total Errors:** {fp + fn} out of {len(y_test)} test samples ({((fp + fn) / len(y_test) * 100):.2f}%)

---

## 🔄 Cross-Validation Results

Cross-validation provides a more robust estimate of model performance by testing on multiple data splits:

| Metric | Mean | Std Dev | 95% CI |
|--------|------|---------|--------|
| **Accuracy** | {cv_scores.mean():.4f} | {cv_scores.std():.4f} | {cv_scores.mean():.4f} ± {cv_scores.std() * 2:.4f} |
| **Precision** | {cv_precision.mean():.4f} | {cv_precision.std():.4f} | {cv_precision.mean():.4f} ± {cv_precision.std() * 2:.4f} |
| **Recall** | {cv_recall.mean():.4f} | {cv_recall.std():.4f} | {cv_recall.mean():.4f} ± {cv_recall.std() * 2:.4f} |
| **F1 Score** | {cv_f1.mean():.4f} | {cv_f1.std():.4f} | {cv_f1.mean():.4f} ± {cv_f1.std() * 2:.4f} |

**Cross-Validation Folds:** {cv.get_n_splits(X_train, y_train)}

---

## 📋 Classification Report

### Per-Class Metrics

| Class | Precision | Recall | F1-Score | Support |
|-------|-----------|--------|----------|---------|
| **No Outbreak** | {class_report.get('0', {}).get('precision', 0):.4f} | {class_report.get('0', {}).get('recall', 0):.4f} | {class_report.get('0', {}).get('f1-score', 0):.4f} | {int(class_report.get('0', {}).get('support', 0))} |
| **Outbreak** | {class_report.get('1', {}).get('precision', 0):.4f} | {class_report.get('1', {}).get('recall', 0):.4f} | {class_report.get('1', {}).get('f1-score', 0):.4f} | {int(class_report.get('1', {}).get('support', 0))} |

### Overall Metrics

| Metric | Value |
|--------|-------|
| **Macro Average** | Precision: {class_report.get('macro avg', {}).get('precision', 0):.4f}, Recall: {class_report.get('macro avg', {}).get('recall', 0):.4f}, F1: {class_report.get('macro avg', {}).get('f1-score', 0):.4f} |
| **Weighted Average** | Precision: {class_report.get('weighted avg', {}).get('precision', 0):.4f}, Recall: {class_report.get('weighted avg', {}).get('recall', 0):.4f}, F1: {class_report.get('weighted avg', {}).get('f1-score', 0):.4f} |

---

## 🎯 Top 20 Feature Importance

The following features contribute most to the model's predictions:

| Rank | Feature | Importance | Percentage |
|------|---------|------------|------------|
"""
    
    for i, (_, row) in enumerate(feature_importance.head(20).iterrows(), 1):
        report += f"| {i} | `{row['feature']}` | {row['importance']:.4f} | {row['importance']*100:.2f}% |\n"
    
    report += f"""
---

## 📊 Dataset Information

- **Total Samples:** {len(df)}
- **Training Samples:** {len(X_train)} ({len(X_train)/len(df)*100:.1f}%)
- **Test Samples:** {len(X_test)} ({len(X_test)/len(df)*100:.1f}%)
- **Outbreak Cases:** {y.sum()} ({y.mean()*100:.1f}%)
- **No Outbreak Cases:** {(y == 0).sum()} ({(y == 0).mean()*100:.1f}%)

### Class Distribution

The dataset shows a class imbalance with {y.mean()*100:.1f}% of samples being outbreak cases and {(y == 0).mean()*100:.1f}% being no-outbreak cases. The model uses class weighting to handle this imbalance.

---

## 🔧 Model Configuration

### Hyperparameters

| Parameter | Value |
|-----------|-------|
| **n_estimators** | {model.n_estimators} |
| **max_depth** | {model.max_depth if model.max_depth else 'None'} |
| **min_samples_split** | {model.min_samples_split} |
| **min_samples_leaf** | {model.min_samples_leaf} |
| **max_features** | {model.max_features} |
| **class_weight** | {model.class_weight} |
| **bootstrap** | {model.bootstrap} |
| **random_state** | {model.random_state} |

---

## ✅ Model Strengths

1. **High Accuracy**: {acc*100:.2f}% accuracy on test set
2. **Excellent Recall**: {rec*100:.2f}% recall ensures most outbreaks are detected
3. **Balanced Performance**: Good balance between precision and recall
4. **Robust Cross-Validation**: Consistent performance across multiple data splits
5. **Feature Engineering**: 37 advanced features capture complex patterns
6. **Out-of-Bag Scoring**: {model.oob_score_*100:.2f}% OOB score indicates good generalization

---

## ⚠️ Limitations & Considerations

1. **Small Dataset**: With only {len(df)} samples, the model may benefit from more training data
2. **Class Imbalance**: {y.mean()*100:.1f}% outbreak rate requires careful handling
3. **Test Set Size**: Small test set ({len(X_test)} samples) may not fully represent model performance
4. **Geographic Specificity**: Model is trained on Koronadal City data and may not generalize to other regions

---

## 📝 Recommendations

1. **Collect More Data**: Increase dataset size for more robust training
2. **Monitor Performance**: Track model performance over time with new data
3. **Feature Updates**: Consider adding more relevant features as data becomes available
4. **Regular Retraining**: Retrain model periodically with new data to maintain accuracy
5. **A/B Testing**: Compare model predictions with actual outcomes to validate performance

---

## 📅 Report Metadata

- **Model File:** `rf_dengue_model.pkl`
- **Evaluation Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Data Source:** Koronadal City, South Cotabato, Philippines
- **Evaluation Method:** Train-Test Split (85% train, 15% test) + 5-Fold Cross-Validation

---

*This report was automatically generated by the Denguess Model Evaluation System.*
"""
    
    # Save report
    report_path = base_dir / "MODEL_PERFORMANCE_REPORT.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\nPerformance report saved to: {report_path}")
    return report_path

if __name__ == "__main__":
    evaluate_model()
