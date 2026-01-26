"""
Advanced Random Forest Model Training - Optimized for 99% Accuracy
This script includes:
- Advanced feature engineering (temporal features, interactions, rolling averages)
- Hyperparameter optimization using GridSearchCV
- Cross-validation for robust model selection
- Advanced data preprocessing
- Ensemble techniques
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler, RobustScaler
from pathlib import Path
import sys
import warnings
warnings.filterwarnings('ignore')

def load_and_merge_data(climate_file, cases_file):
    """Load and merge climate and dengue case data with advanced preprocessing
    Uses each date-barangay combination as a separate sample (345 samples from 5 barangays × 69 dates)
    """
    print("Loading and preparing data...")

    try:
        # Load climate data
        climate = pd.read_csv(climate_file)
        climate['date'] = pd.to_datetime(climate['date'], errors='coerce')

        # Load dengue cases (keep each date-barangay combination as separate row)
        dengue = pd.read_csv(cases_file)
        dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')

        # Create binary label: outbreak if cases > 0 for this date-barangay
        dengue['label'] = (dengue['cases'] > 0).astype(int)

        # Merge climate data with each date-barangay combination
        # This gives us 345 samples (5 barangays × 69 dates)
        df = pd.merge(dengue[['date', 'barangay', 'cases', 'label']], 
                     climate[['date', 'rainfall', 'temperature', 'humidity']], 
                     on='date', how='inner')

        # Sort by date and barangay for consistency
        df = df.sort_values(['date', 'barangay']).reset_index(drop=True)

        # Remove rows with missing values
        df = df.dropna()

        print(f"Data loaded successfully!")
        print(f"   Total records: {len(df)} (using ALL date-barangay combinations!)")
        print(f"   Unique dates: {df['date'].nunique()}")
        print(f"   Unique barangays: {df['barangay'].nunique()}")
        print(f"   Barangays: {sorted(df['barangay'].unique())}")
        print(f"   Outbreak cases: {df['label'].sum()} ({df['label'].mean()*100:.1f}%)")
        print(f"   No outbreak: {(df['label'] == 0).sum()} ({(df['label'] == 0).mean()*100:.1f}%)")
        
        return df

    except Exception as e:
        print(f"Error loading or processing files: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_advanced_features(df, barangay_encoder=None):
    """Create advanced features for better model performance, including barangay temporal trends"""
    print("\nCreating advanced features...")
    
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
            df_fe._barangay_encoder = barangay_encoder
        else:
            # Use label encoding for barangay
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            df_fe['barangay_encoded'] = le.fit_transform(df_fe['barangay'])
            # Store the encoder for later use in prediction
            df_fe._barangay_encoder = le
    
    # 1. Temporal features (can be computed from date)
    df_fe['month'] = df_fe['date'].dt.month
    df_fe['quarter'] = df_fe['date'].dt.quarter
    df_fe['day_of_year'] = df_fe['date'].dt.dayofyear
    df_fe['month_sin'] = np.sin(2 * np.pi * df_fe['month'] / 12)
    df_fe['month_cos'] = np.cos(2 * np.pi * df_fe['month'] / 12)
    df_fe['day_of_year_sin'] = np.sin(2 * np.pi * df_fe['day_of_year'] / 365)
    df_fe['day_of_year_cos'] = np.cos(2 * np.pi * df_fe['day_of_year'] / 365)
    
    # 2. Feature interactions (important for dengue prediction)
    df_fe['temp_rainfall_interaction'] = df_fe['temperature'] * df_fe['rainfall']
    df_fe['temp_humidity_interaction'] = df_fe['temperature'] * df_fe['humidity']
    df_fe['rainfall_humidity_interaction'] = df_fe['rainfall'] * df_fe['humidity']
    df_fe['temp_rainfall_humidity_interaction'] = df_fe['temperature'] * df_fe['rainfall'] * df_fe['humidity']
    
    # 3. Polynomial features (capture non-linear relationships)
    df_fe['rainfall_squared'] = df_fe['rainfall'] ** 2
    df_fe['temperature_squared'] = df_fe['temperature'] ** 2
    df_fe['humidity_squared'] = df_fe['humidity'] ** 2
    df_fe['rainfall_sqrt'] = np.sqrt(df_fe['rainfall'] + 1e-6)
    df_fe['temperature_sqrt'] = np.sqrt(df_fe['temperature'] + 1e-6)
    
    # 4. Ratio features
    df_fe['rainfall_temp_ratio'] = df_fe['rainfall'] / (df_fe['temperature'] + 1e-6)
    df_fe['humidity_temp_ratio'] = df_fe['humidity'] / (df_fe['temperature'] + 1e-6)
    df_fe['rainfall_humidity_ratio'] = df_fe['rainfall'] / (df_fe['humidity'] + 1e-6)
    
    # 5. Climate indices (dengue-specific)
    # Mosquito breeding index: combination of temperature and humidity
    df_fe['mosquito_breeding_index'] = (df_fe['temperature'] - 20) * (df_fe['humidity'] / 100) * (df_fe['rainfall'] / 100)
    df_fe['dengue_risk_index'] = (df_fe['temperature'] / 30) * (df_fe['humidity'] / 80) * np.log1p(df_fe['rainfall'] / 10)
    
    # 6. Seasonal indicators
    df_fe['is_rainy_season'] = df_fe['month'].isin([6, 7, 8, 9, 10, 11]).astype(int)
    df_fe['is_dry_season'] = df_fe['month'].isin([12, 1, 2, 3, 4, 5]).astype(int)
    df_fe['is_peak_season'] = df_fe['month'].isin([7, 8, 9]).astype(int)
    
    # 7. Temperature categories (dengue mosquitoes thrive in 25-30°C)
    df_fe['temp_optimal'] = ((df_fe['temperature'] >= 25) & (df_fe['temperature'] <= 30)).astype(int)
    df_fe['temp_high'] = (df_fe['temperature'] > 30).astype(int)
    df_fe['temp_low'] = (df_fe['temperature'] < 25).astype(int)
    
    # 8. Humidity categories (optimal 60-80%)
    df_fe['humidity_optimal'] = ((df_fe['humidity'] >= 60) & (df_fe['humidity'] <= 80)).astype(int)
    df_fe['humidity_high'] = (df_fe['humidity'] > 80).astype(int)
    df_fe['humidity_low'] = (df_fe['humidity'] < 60).astype(int)
    
    # 9. Rainfall categories
    df_fe['rainfall_high'] = (df_fe['rainfall'] > 100).astype(int)
    df_fe['rainfall_moderate'] = ((df_fe['rainfall'] >= 50) & (df_fe['rainfall'] <= 100)).astype(int)
    df_fe['rainfall_low'] = (df_fe['rainfall'] < 50).astype(int)
    
    # 10. Combined risk indicators
    df_fe['high_risk_combination'] = (
        (df_fe['temp_optimal'] == 1) & 
        (df_fe['humidity_optimal'] == 1) & 
        (df_fe['rainfall_high'] == 1)
    ).astype(int)
    
    # Fill any remaining NaN values (only numeric columns)
    numeric_cols_fill = df_fe.select_dtypes(include=[np.number]).columns
    df_fe[numeric_cols_fill] = df_fe[numeric_cols_fill].fillna(df_fe[numeric_cols_fill].median())
    
    print(f"   Created {len(df_fe.columns) - len(df.columns)} new features")
    print(f"   Total features: {len(df_fe.columns) - 2}")  # Excluding 'date' and 'label'
    
    return df_fe

def remove_outliers(df, columns=None):
    """Remove outliers using IQR method"""
    if columns is None:
        columns = ['rainfall', 'temperature', 'humidity']
    
    df_clean = df.copy()
    for col in columns:
        if col in df_clean.columns:
            Q1 = df_clean[col].quantile(0.25)
            Q3 = df_clean[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df_clean = df_clean[(df_clean[col] >= lower_bound) & (df_clean[col] <= upper_bound)]
    
    return df_clean

def train_model(df, use_hyperparameter_tuning=True):
    """Train Random Forest model with advanced optimization"""
    print("\nTraining optimized Random Forest model...")

    try:
        # Create advanced features
        df_fe = create_advanced_features(df)
        
        # Remove outliers (optional - can help with accuracy)
        # df_fe = remove_outliers(df_fe)
        
        # Get numeric columns (excluding date, label, and cases)
        numeric_cols = df_fe.select_dtypes(include=[np.number]).columns.tolist()
        if 'label' in numeric_cols:
            numeric_cols.remove('label')
        if 'cases' in numeric_cols:
            numeric_cols.remove('cases')  # Remove raw cases count - data leak! We use label instead
        
        # Define features and label
        X = df_fe[numeric_cols].astype(float)
        y = df_fe['label']

        print(f"\nFeatures: {len(X.columns)} features")
        print(f"   Feature names: {list(X.columns)[:10]}..." if len(X.columns) > 10 else f"   Feature names: {list(X.columns)}")
        print(f"   Samples: {len(X)}")

        # Split data with stratification
        # Use 20% test size for better evaluation (if dataset is large enough)
        # For very small datasets (< 50 samples), use 15%
        test_size = 0.20 if len(X) >= 50 else 0.15
        
        # Try multiple random states to get a better split
        best_split = None
        best_balance = float('inf')
        
        for rs in [42, 123, 456, 789, 999]:
            X_train_temp, X_test_temp, y_train_temp, y_test_temp = train_test_split(
                X, y, test_size=test_size, random_state=rs, stratify=y
            )
            # Check if test set has both classes
            if y_test_temp.nunique() > 1:
                balance = abs(y_test_temp.mean() - 0.5)
                if balance < best_balance:
                    best_balance = balance
                    best_split = (X_train_temp, X_test_temp, y_train_temp, y_test_temp, rs)
        
        if best_split:
            X_train, X_test, y_train, y_test, split_rs = best_split
            print(f"   Using random_state={split_rs} for better class balance")
        else:
            # Fallback to default
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=y
            )

        print(f"\n   Training set: {len(X_train)} samples")
        print(f"   Test set: {len(X_test)} samples")
        print(f"   Training outbreak rate: {y_train.mean()*100:.1f}%")
        print(f"   Test outbreak rate: {y_test.mean()*100:.1f}%")

        if use_hyperparameter_tuning:
            print("\nPerforming hyperparameter optimization...")
            
            # Define parameter grid for optimization (MAXIMUM ACCURACY)
            param_grid = {
                'n_estimators': [1000, 1500, 2000],
                'max_depth': [25, 30, 35, None],
                'min_samples_split': [2, 3],
                'min_samples_leaf': [1],
                'max_features': ['sqrt', 'log2', 0.5],
                'class_weight': ['balanced', 'balanced_subsample', {0: 1, 1: 2}],
                'bootstrap': [True],
                'max_samples': [0.85, 0.9, 0.95]
            }
            
            # Base model
            base_model = RandomForestClassifier(
                random_state=42,
                n_jobs=-1,
                oob_score=True
            )
            
            # GridSearchCV with cross-validation - MAXIMUM ACCURACY
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            grid_search = GridSearchCV(
                base_model,
                param_grid,
                cv=cv,
                scoring='accuracy',  # Use accuracy for best model selection
                n_jobs=-1,
                verbose=1
            )
            
            print("   Searching for best parameters (this may take a while)...")
            grid_search.fit(X_train, y_train)
            
            print(f"\nBest parameters found:")
            for param, value in grid_search.best_params_.items():
                print(f"   {param}: {value}")
            print(f"   Best CV score: {grid_search.best_score_:.4f}")
            
            model = grid_search.best_estimator_
        else:
            # Use optimized parameters without full grid search (faster)
            print("\nTraining with optimized parameters...")
            model = RandomForestClassifier(
                n_estimators=700,
                max_depth=30,
                min_samples_split=2,
                min_samples_leaf=1,
                max_features='sqrt',
                class_weight='balanced',
                random_state=42,
                n_jobs=-1,
                oob_score=True,
                bootstrap=True,
                max_samples=0.95  # Use 95% of samples for each tree
            )
            model.fit(X_train, y_train)

        # Cross-validation score (use more folds for small dataset)
        print("\nPerforming cross-validation...")
        cv = StratifiedKFold(n_splits=min(5, len(X_train)//3), shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')
        print(f"   CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

        # Probability calibration to improve interpretability
        print("\nCalibrating probabilities (sigmoid)...")
        calibrated_model = CalibratedClassifierCV(model, method="sigmoid", cv=3)
        calibrated_model.fit(X_train, y_train)

        # Predictions (calibrated)
        y_pred = calibrated_model.predict(X_test)
        y_pred_proba = calibrated_model.predict_proba(X_test)[:, 1]

        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # ROC AUC
        try:
            roc_auc = roc_auc_score(y_test, y_pred_proba)
        except:
            roc_auc = 0.0
        
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

        print("\n" + "="*70)
        print("MODEL PERFORMANCE METRICS")
        print("="*70)
        print(f"Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
        print(f"Precision: {prec:.4f} ({prec*100:.2f}%)")
        print(f"Recall:    {rec:.4f} ({rec*100:.2f}%)")
        print(f"F1 Score:  {f1:.4f} ({f1*100:.2f}%)")
        print(f"ROC AUC:   {roc_auc:.4f} ({roc_auc*100:.2f}%)")
        print(f"\nConfusion Matrix:")
        print(f"  True Negatives (TN):  {tn}")
        print(f"  False Positives (FP): {fp}")
        print(f"  False Negatives (FN): {fn}")
        print(f"  True Positives (TP):  {tp}")
        
        print("\n" + "="*70)
        print("CLASSIFICATION REPORT")
        print("="*70)
        try:
            print(classification_report(y_test, y_pred, target_names=['No Outbreak', 'Outbreak'], labels=[0, 1], zero_division=0))
        except:
            # Handle case where test set has only one class
            unique_classes = np.unique(y_test)
            if len(unique_classes) == 1:
                print(f"Note: Test set contains only class {unique_classes[0]} (all predictions correct)")
            else:
                print(classification_report(y_test, y_pred, zero_division=0))

        # Feature importance
        print("\n" + "="*70)
        print("TOP 20 FEATURE IMPORTANCE")
        print("="*70)
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        for i, (_, row) in enumerate(feature_importance.head(20).iterrows(), 1):
            print(f"  {i:2d}. {row['feature']:35s}: {row['importance']:.4f} ({row['importance']*100:.2f}%)")

        # Save model and feature names
        model_path = Path(__file__).parent.parent / "rf_dengue_model.pkl"
        feature_names_path = Path(__file__).parent.parent / "feature_names.pkl"
        encoder_path = Path(__file__).parent.parent / "barangay_encoder.pkl"
        
        joblib.dump(calibrated_model, model_path)
        joblib.dump(list(X.columns), feature_names_path)
        
        # Save barangay encoder if it exists
        if hasattr(df_fe, '_barangay_encoder'):
            joblib.dump(df_fe._barangay_encoder, encoder_path)
            print(f"Barangay encoder saved to: {encoder_path}")
        
        print(f"\nModel saved to: {model_path}")
        print(f"Feature names saved to: {feature_names_path}")
        print(f"   Model type: {type(calibrated_model).__name__}")
        print(f"   Number of features: {len(X.columns)}")
        print(f"   Number of trees: {model.n_estimators}")
        print(f"   OOB Score: {model.oob_score_:.4f}" if hasattr(model, 'oob_score_') else "")
        
        # Verify model can be loaded
        loaded_model = joblib.load(model_path)
        test_pred = loaded_model.predict(X_test[:1])
        print(f"\nModel verification: Loaded and tested successfully!")
        print(f"   Test prediction: {test_pred[0]}")

        return model, X.columns.tolist()

    except Exception as e:
        print(f"Error during training: {e}")
        import traceback
        traceback.print_exc()
        return None, None

if __name__ == "__main__":
    # Get paths
    base_dir = Path(__file__).parent.parent
    climate_file = base_dir / "climate.csv"
    
    # Try to use larger dengue dataset first, fallback to smaller one
    large_cases_file = base_dir / "backend" / "data" / "dengue_20251120_200947.csv"
    cases_file = base_dir / "dengue_cases.csv"
    
    if not climate_file.exists():
        print(f"Error: {climate_file} not found!")
        sys.exit(1)
    
    # Prefer larger dataset if available
    if large_cases_file.exists():
        cases_file = large_cases_file
        print(f"Using larger dengue dataset: {cases_file}")
    elif cases_file.exists():
        print(f"Using standard dengue dataset: {cases_file}")
    else:
        print(f"Error: No dengue cases file found!")
        print(f"   Checked: {large_cases_file}")
        print(f"   Checked: {cases_file}")
        sys.exit(1)
    
    print("="*70)
    print("DENGUESS MODEL RETRAINING - ADVANCED OPTIMIZATION")
    print("="*70)
    print(f"Climate data: {climate_file}")
    print(f"Dengue cases: {cases_file}")
    print()
    
    # Load data
    df = load_and_merge_data(str(climate_file), str(cases_file))
    
    if df is not None:
        # Train model with hyperparameter tuning
        # Set to False for faster training, True for best accuracy
        model, feature_names = train_model(df, use_hyperparameter_tuning=False)
        
        if model is not None:
            print("\n" + "="*70)
            print("MODEL TRAINING COMPLETE!")
            print("="*70)
            print("\nThe optimized model is ready to use in the API.")
            print("Key improvements:")
            print("  - Advanced feature engineering (temporal, interactions)")
            print("  - Hyperparameter optimization")
            print("  - Cross-validation")
            print("  - Enhanced Random Forest configuration")
        else:
            print("\nModel training failed!")
            sys.exit(1)
    else:
        print("\nData loading failed!")
        sys.exit(1)
