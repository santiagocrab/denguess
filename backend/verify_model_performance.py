"""
Quick verification script to check actual model performance
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
from pathlib import Path

def load_and_merge_data(climate_file, cases_file):
    try:
        climate = pd.read_csv(climate_file)
        climate['date'] = pd.to_datetime(climate['date'], errors='coerce')
        dengue = pd.read_csv(cases_file)
        dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')
        dengue['label'] = (dengue['cases'] > 0).astype(int)
        df = pd.merge(
            dengue[['date', 'barangay', 'cases', 'label']],
            climate[['date', 'rainfall', 'temperature', 'humidity']],
            on='date',
            how='inner'
        )
        df = df.sort_values(['date', 'barangay']).reset_index(drop=True)
        df = df.dropna()
        return df
    except Exception as e:
        print(f"Error: {e}")
        return None

def create_advanced_features(df, barangay_encoder=None):
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

    if 'barangay' in df_fe.columns:
        if barangay_encoder is not None:
            df_fe['barangay_encoded'] = barangay_encoder.transform(df_fe['barangay'])
        else:
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            df_fe['barangay_encoded'] = le.fit_transform(df_fe['barangay'])
    df_fe['month'] = df_fe['date'].dt.month
    df_fe['quarter'] = df_fe['date'].dt.quarter
    df_fe['day_of_year'] = df_fe['date'].dt.dayofyear
    df_fe['month_sin'] = np.sin(2 * np.pi * df_fe['month'] / 12)
    df_fe['month_cos'] = np.cos(2 * np.pi * df_fe['month'] / 12)
    df_fe['day_of_year_sin'] = np.sin(2 * np.pi * df_fe['day_of_year'] / 365)
    df_fe['day_of_year_cos'] = np.cos(2 * np.pi * df_fe['day_of_year'] / 365)
    df_fe['temp_rainfall_interaction'] = df_fe['temperature'] * df_fe['rainfall']
    df_fe['temp_humidity_interaction'] = df_fe['temperature'] * df_fe['humidity']
    df_fe['rainfall_humidity_interaction'] = df_fe['rainfall'] * df_fe['humidity']
    df_fe['temp_rainfall_humidity_interaction'] = df_fe['temperature'] * df_fe['rainfall'] * df_fe['humidity']
    df_fe['rainfall_squared'] = df_fe['rainfall'] ** 2
    df_fe['temperature_squared'] = df_fe['temperature'] ** 2
    df_fe['humidity_squared'] = df_fe['humidity'] ** 2
    df_fe['rainfall_sqrt'] = np.sqrt(df_fe['rainfall'] + 1e-6)
    df_fe['temperature_sqrt'] = np.sqrt(df_fe['temperature'] + 1e-6)
    df_fe['rainfall_temp_ratio'] = df_fe['rainfall'] / (df_fe['temperature'] + 1e-6)
    df_fe['humidity_temp_ratio'] = df_fe['humidity'] / (df_fe['temperature'] + 1e-6)
    df_fe['rainfall_humidity_ratio'] = df_fe['rainfall'] / (df_fe['humidity'] + 1e-6)
    df_fe['mosquito_breeding_index'] = (df_fe['temperature'] - 20) * (df_fe['humidity'] / 100) * (df_fe['rainfall'] / 100)
    df_fe['dengue_risk_index'] = (df_fe['temperature'] / 30) * (df_fe['humidity'] / 80) * np.log1p(df_fe['rainfall'] / 10)
    df_fe['is_rainy_season'] = df_fe['month'].isin([6, 7, 8, 9, 10, 11]).astype(int)
    df_fe['is_dry_season'] = df_fe['month'].isin([12, 1, 2, 3, 4, 5]).astype(int)
    df_fe['is_peak_season'] = df_fe['month'].isin([7, 8, 9]).astype(int)
    df_fe['temp_optimal'] = ((df_fe['temperature'] >= 25) & (df_fe['temperature'] <= 30)).astype(int)
    df_fe['temp_high'] = (df_fe['temperature'] > 30).astype(int)
    df_fe['temp_low'] = (df_fe['temperature'] < 25).astype(int)
    df_fe['humidity_optimal'] = ((df_fe['humidity'] >= 60) & (df_fe['humidity'] <= 80)).astype(int)
    df_fe['humidity_high'] = (df_fe['humidity'] > 80).astype(int)
    df_fe['humidity_low'] = (df_fe['humidity'] < 60).astype(int)
    df_fe['rainfall_high'] = (df_fe['rainfall'] > 100).astype(int)
    df_fe['rainfall_moderate'] = ((df_fe['rainfall'] >= 50) & (df_fe['rainfall'] <= 100)).astype(int)
    df_fe['rainfall_low'] = (df_fe['rainfall'] < 50).astype(int)
    df_fe['high_risk_combination'] = (
        (df_fe['temp_optimal'] == 1) & 
        (df_fe['humidity_optimal'] == 1) & 
        (df_fe['rainfall_high'] == 1)
    ).astype(int)
    df_fe = df_fe.fillna(df_fe.median())
    return df_fe

base_dir = Path(__file__).parent.parent
model_path = base_dir / "rf_dengue_model.pkl"
encoder_path = base_dir / "barangay_encoder.pkl"
feature_names_path = base_dir / "feature_names.pkl"
climate_file = base_dir / "climate.csv"
cases_file = base_dir / "dengue_cases.csv"

print("="*70)
print("VERIFYING MODEL PERFORMANCE")
print("="*70)

# Load model
print("\n1. Loading model...")
model = joblib.load(model_path)
print(f"   Model loaded: {type(model).__name__}")
print(f"   Trees: {model.n_estimators}")

# Load data
print("\n2. Loading data...")
df = load_and_merge_data(str(climate_file), str(cases_file))
print(f"   Total samples: {len(df)}")
print(f"   Outbreak cases: {df['label'].sum()} ({df['label'].mean()*100:.1f}%)")
print(f"   No outbreak: {(df['label'] == 0).sum()} ({(df['label'] == 0).mean()*100:.1f}%)")

# Create features
print("\n3. Creating features...")
barangay_encoder = joblib.load(encoder_path) if encoder_path.exists() else None
df_fe = create_advanced_features(df, barangay_encoder=barangay_encoder)
if feature_names_path.exists():
    feature_names = joblib.load(feature_names_path)
    X = df_fe[feature_names]
else:
    numeric_cols = df_fe.select_dtypes(include=[np.number]).columns.tolist()
    if 'label' in numeric_cols:
        numeric_cols.remove('label')
    if 'cases' in numeric_cols:
        numeric_cols.remove('cases')
    X = df_fe[numeric_cols]
y = df_fe['label']
print(f"   Features: {len(X.columns)}")
print(f"   Samples: {len(X)}")

# Split data (same as training)
print("\n4. Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)
print(f"   Training: {len(X_train)} samples")
print(f"   Test: {len(X_test)} samples")
print(f"   Test - Outbreak: {y_test.sum()} ({y_test.mean()*100:.1f}%)")
print(f"   Test - No Outbreak: {(y_test == 0).sum()} ({(y_test == 0).mean()*100:.1f}%)")

# Predictions
print("\n5. Making predictions...")
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)

print(f"\n   Actual labels: {y_test.values}")
print(f"   Predictions:  {y_pred}")
print(f"   Probabilities: {y_pred_proba[:, 1]}")

# Calculate confusion matrix with explicit labels
print("\n6. Calculating confusion matrix...")
cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
print(f"\n   Confusion Matrix (with labels=[0, 1]):")
print(f"   {cm}")

if cm.size == 4:
    tn, fp, fn, tp = cm.ravel()
    print(f"\n   True Negatives (TN):  {tn}")
    print(f"   False Positives (FP): {fp}")
    print(f"   False Negatives (FN): {fn}")
    print(f"   True Positives (TP):  {tp}")
else:
    print(f"\n   Warning: Confusion matrix shape is {cm.shape}, not 2x2")
    print(f"   Matrix: {cm}")

# Metrics
print("\n7. Calculating metrics...")
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, zero_division=0, labels=[0, 1])
rec = recall_score(y_test, y_pred, zero_division=0, labels=[0, 1])
f1 = f1_score(y_test, y_pred, zero_division=0, labels=[0, 1])

print(f"\n   Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
print(f"   Precision: {prec:.4f} ({prec*100:.2f}%)")
print(f"   Recall:    {rec:.4f} ({rec*100:.2f}%)")
print(f"   F1 Score:  {f1:.4f} ({f1*100:.2f}%)")

# Check if all predictions are the same
print(f"\n8. Analysis:")
print(f"   Unique predictions: {np.unique(y_pred)}")
print(f"   Unique actual: {np.unique(y_test)}")
print(f"   All correct: {(y_test == y_pred).all()}")
print(f"   Correct predictions: {(y_test == y_pred).sum()} out of {len(y_test)}")

print("\n" + "="*70)
print("VERIFICATION COMPLETE")
print("="*70)
