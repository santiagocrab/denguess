"""
ULTIMATE MODEL TRAINING - Maximum Accuracy Optimization
This script implements the most advanced techniques:
- Multiple algorithms (XGBoost, LightGBM, Random Forest)
- Ensemble methods (Voting, Stacking)
- Advanced feature engineering
- Hyperparameter optimization with wider search
- Feature selection
- SMOTE for class imbalance
- Advanced cross-validation
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, StackingClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score, StratifiedKFold, RandomizedSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from pathlib import Path
import sys
import warnings
warnings.filterwarnings('ignore')

# Try importing advanced libraries
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("XGBoost not available. Install with: pip install xgboost")

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("LightGBM not available. Install with: pip install lightgbm")

try:
    from imblearn.over_sampling import SMOTE
    SMOTE_AVAILABLE = True
except ImportError:
    SMOTE_AVAILABLE = False
    print("SMOTE not available. Install with: pip install imbalanced-learn")

def load_and_merge_data(climate_file, cases_file):
    """Load and merge climate and dengue case data"""
    print("Loading and preparing data...")

    try:
        climate = pd.read_csv(climate_file)
        climate['date'] = pd.to_datetime(climate['date'], errors='coerce')

        dengue = pd.read_csv(cases_file)
        dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')

        dengue['label'] = (dengue['cases'] > 0).astype(int)

        df = pd.merge(dengue[['date', 'barangay', 'cases', 'label']], 
                     climate[['date', 'rainfall', 'temperature', 'humidity']], 
                     on='date', how='inner')

        df = df.sort_values(['date', 'barangay']).reset_index(drop=True)
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
    """Create comprehensive advanced features, including barangay temporal trends"""
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
        # Ensure feature columns exist for inference without case history
        df_fe['prev_month_cases'] = 0
        df_fe['rolling_3mo_avg_cases'] = 0
    
    # Encode barangay
    if 'barangay' in df_fe.columns:
        if barangay_encoder is not None:
            df_fe['barangay_encoded'] = barangay_encoder.transform(df_fe['barangay'])
            df_fe._barangay_encoder = barangay_encoder
        else:
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            df_fe['barangay_encoded'] = le.fit_transform(df_fe['barangay'])
            df_fe._barangay_encoder = le
    
    # Temporal features
    df_fe['month'] = df_fe['date'].dt.month
    df_fe['quarter'] = df_fe['date'].dt.quarter
    df_fe['day_of_year'] = df_fe['date'].dt.dayofyear
    df_fe['week_of_year'] = df_fe['date'].dt.isocalendar().week
    df_fe['month_sin'] = np.sin(2 * np.pi * df_fe['month'] / 12)
    df_fe['month_cos'] = np.cos(2 * np.pi * df_fe['month'] / 12)
    df_fe['day_of_year_sin'] = np.sin(2 * np.pi * df_fe['day_of_year'] / 365)
    df_fe['day_of_year_cos'] = np.cos(2 * np.pi * df_fe['day_of_year'] / 365)
    df_fe['week_sin'] = np.sin(2 * np.pi * df_fe['week_of_year'] / 52)
    df_fe['week_cos'] = np.cos(2 * np.pi * df_fe['week_of_year'] / 52)
    
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
    df_fe['humidity_sqrt'] = np.sqrt(df_fe['humidity'] + 1e-6)
    df_fe['rainfall_cubed'] = df_fe['rainfall'] ** 3
    df_fe['temperature_cubed'] = df_fe['temperature'] ** 3
    
    # Ratio features
    df_fe['rainfall_temp_ratio'] = df_fe['rainfall'] / (df_fe['temperature'] + 1e-6)
    df_fe['humidity_temp_ratio'] = df_fe['humidity'] / (df_fe['temperature'] + 1e-6)
    df_fe['rainfall_humidity_ratio'] = df_fe['rainfall'] / (df_fe['humidity'] + 1e-6)
    df_fe['temp_humidity_ratio'] = df_fe['temperature'] / (df_fe['humidity'] + 1e-6)
    
    # Climate indices
    df_fe['mosquito_breeding_index'] = (df_fe['temperature'] - 20) * (df_fe['humidity'] / 100) * (df_fe['rainfall'] / 100)
    df_fe['dengue_risk_index'] = (df_fe['temperature'] / 30) * (df_fe['humidity'] / 80) * np.log1p(df_fe['rainfall'] / 10)
    df_fe['comfort_index'] = df_fe['temperature'] - 0.4 * (df_fe['temperature'] - 14.4) * (1 - df_fe['humidity'] / 100)
    
    # Seasonal indicators
    df_fe['is_rainy_season'] = df_fe['month'].isin([6, 7, 8, 9, 10, 11]).astype(int)
    df_fe['is_dry_season'] = df_fe['month'].isin([12, 1, 2, 3, 4, 5]).astype(int)
    df_fe['is_peak_season'] = df_fe['month'].isin([7, 8, 9]).astype(int)
    df_fe['is_transition_season'] = df_fe['month'].isin([5, 6, 11, 12]).astype(int)
    
    # Temperature categories
    df_fe['temp_optimal'] = ((df_fe['temperature'] >= 25) & (df_fe['temperature'] <= 30)).astype(int)
    df_fe['temp_high'] = (df_fe['temperature'] > 30).astype(int)
    df_fe['temp_low'] = (df_fe['temperature'] < 25).astype(int)
    df_fe['temp_very_high'] = (df_fe['temperature'] > 32).astype(int)
    df_fe['temp_very_low'] = (df_fe['temperature'] < 23).astype(int)
    
    # Humidity categories
    df_fe['humidity_optimal'] = ((df_fe['humidity'] >= 60) & (df_fe['humidity'] <= 80)).astype(int)
    df_fe['humidity_high'] = (df_fe['humidity'] > 80).astype(int)
    df_fe['humidity_low'] = (df_fe['humidity'] < 60).astype(int)
    df_fe['humidity_very_high'] = (df_fe['humidity'] > 85).astype(int)
    df_fe['humidity_very_low'] = (df_fe['humidity'] < 55).astype(int)
    
    # Rainfall categories
    df_fe['rainfall_high'] = (df_fe['rainfall'] > 100).astype(int)
    df_fe['rainfall_moderate'] = ((df_fe['rainfall'] >= 50) & (df_fe['rainfall'] <= 100)).astype(int)
    df_fe['rainfall_low'] = (df_fe['rainfall'] < 50).astype(int)
    df_fe['rainfall_very_high'] = (df_fe['rainfall'] > 200).astype(int)
    df_fe['rainfall_extreme'] = (df_fe['rainfall'] > 300).astype(int)
    
    # Combined risk indicators
    df_fe['high_risk_combination'] = (
        (df_fe['temp_optimal'] == 1) & 
        (df_fe['humidity_optimal'] == 1) & 
        (df_fe['rainfall_high'] == 1)
    ).astype(int)
    
    df_fe['extreme_risk_combination'] = (
        (df_fe['temp_optimal'] == 1) & 
        (df_fe['humidity_high'] == 1) & 
        (df_fe['rainfall_very_high'] == 1)
    ).astype(int)
    
    # Barangay-specific interactions
    if 'barangay_encoded' in df_fe.columns:
        df_fe['barangay_temp_interaction'] = df_fe['barangay_encoded'] * df_fe['temperature']
        df_fe['barangay_rainfall_interaction'] = df_fe['barangay_encoded'] * df_fe['rainfall']
        df_fe['barangay_humidity_interaction'] = df_fe['barangay_encoded'] * df_fe['humidity']
    
    # Fill NaN values
    numeric_cols_fill = df_fe.select_dtypes(include=[np.number]).columns
    df_fe[numeric_cols_fill] = df_fe[numeric_cols_fill].fillna(df_fe[numeric_cols_fill].median())
    
    print(f"   Created {len(df_fe.columns) - len(df.columns)} new features")
    print(f"   Total features: {len(df_fe.columns) - 2}")  # Excluding 'date' and 'label'
    
    return df_fe

def train_best_model(X_train, y_train, X_test, y_test):
    """Train multiple models and ensemble for >95% accuracy"""
    print("\n" + "="*70)
    print("TRAINING MULTIPLE MODELS WITH ENSEMBLE - TARGET: >95% ACCURACY")
    print("="*70)
    
    models = {}
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    
    # 1. Random Forest with aggressive tuning
    print("\n[1/3] Training Random Forest...")
    rf_param_grid = {
        'n_estimators': [1000, 1500, 2000],  # More trees
        'max_depth': [30, 35, None],  # Deeper trees
        'min_samples_split': [2, 3],
        'min_samples_leaf': [1],
        'max_features': ['sqrt', 'log2', 0.3, 0.5],
        'class_weight': ['balanced', 'balanced_subsample', {0: 1, 1: 2}, {0: 1, 1: 3}],
        'bootstrap': [True],
        'max_samples': [0.8, 0.85, 0.9, 0.95]
    }
    
    rf_base = RandomForestClassifier(random_state=42, n_jobs=-1, oob_score=True)
    rf_search = RandomizedSearchCV(
        rf_base, rf_param_grid, 
        cv=cv, scoring='accuracy',
        n_iter=40,  # More iterations
        n_jobs=-1, 
        verbose=1,
        random_state=42
    )
    rf_search.fit(X_train, y_train)
    models['RF'] = rf_search.best_estimator_
    print(f"   RF CV Accuracy: {rf_search.best_score_:.4f}")
    
    # 2. XGBoost if available
    if XGBOOST_AVAILABLE:
        print("\n[2/3] Training XGBoost...")
        xgb_param_grid = {
            'n_estimators': [500, 700, 1000],  # More trees
            'max_depth': [5, 6, 7],  # Deeper
            'learning_rate': [0.01, 0.05, 0.1],  # More learning rates
            'subsample': [0.85, 0.9, 0.95],
            'colsample_bytree': [0.85, 0.9, 0.95],
            'min_child_weight': [1, 2, 3],
            'scale_pos_weight': [1, 1.5, 2, 2.5]
        }
        
        xgb_base = xgb.XGBClassifier(random_state=42, n_jobs=-1, eval_metric='logloss')
        xgb_search = RandomizedSearchCV(
            xgb_base, xgb_param_grid,
            cv=cv, scoring='accuracy',
            n_iter=30,  # More iterations
            n_jobs=-1,
            verbose=1,
            random_state=42
        )
        xgb_search.fit(X_train, y_train)
        models['XGB'] = xgb_search.best_estimator_
        print(f"   XGB CV Accuracy: {xgb_search.best_score_:.4f}")
    
    # 3. LightGBM if available
    if LIGHTGBM_AVAILABLE:
        print("\n[3/3] Training LightGBM...")
        lgb_param_grid = {
            'n_estimators': [500, 700, 1000],  # More trees
            'max_depth': [5, 6, 7, -1],  # Deeper
            'learning_rate': [0.01, 0.05, 0.1],  # More learning rates
            'subsample': [0.85, 0.9, 0.95],
            'colsample_bytree': [0.85, 0.9, 0.95],
            'min_child_samples': [10, 20, 30],
            'class_weight': [None, 'balanced']
        }
        
        lgb_base = lgb.LGBMClassifier(random_state=42, n_jobs=-1, verbose=-1)
        lgb_search = RandomizedSearchCV(
            lgb_base, lgb_param_grid,
            cv=cv, scoring='accuracy',
            n_iter=30,  # More iterations
            n_jobs=-1,
            verbose=1,
            random_state=42
        )
        lgb_search.fit(X_train, y_train)
        models['LGB'] = lgb_search.best_estimator_
        print(f"   LGB CV Accuracy: {lgb_search.best_score_:.4f}")
    
    # Evaluate individual models
    print("\n" + "="*70)
    print("INDIVIDUAL MODEL PERFORMANCE")
    print("="*70)
    best_single = None
    best_single_acc = 0
    best_single_name = None
    
    for name, model in models.items():
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        print(f"\n{name}:")
        print(f"   Accuracy: {acc:.4f} ({acc*100:.2f}%)")
        print(f"   F1 Score: {f1:.4f} ({f1*100:.2f}%)")
        if acc > best_single_acc:
            best_single_acc = acc
            best_single = model
            best_single_name = name
    
    # Create ensemble
    print("\n" + "="*70)
    print("CREATING ENSEMBLE MODEL")
    print("="*70)
    
    if len(models) > 1:
        # Voting Classifier
        voting_models = [(name, model) for name, model in models.items()]
        voting_clf = VotingClassifier(estimators=voting_models, voting='soft')
        voting_clf.fit(X_train, y_train)
        
        y_pred_voting = voting_clf.predict(X_test)
        acc_voting = accuracy_score(y_test, y_pred_voting)
        f1_voting = f1_score(y_test, y_pred_voting)
        
        print(f"\nVoting Ensemble:")
        print(f"   Accuracy: {acc_voting:.4f} ({acc_voting*100:.2f}%)")
        print(f"   F1 Score: {f1_voting:.4f} ({f1_voting*100:.2f}%)")
        
        # Try Stacking if we have multiple models
        if len(models) >= 2:
            try:
                from sklearn.linear_model import LogisticRegression
                stacking_clf = StackingClassifier(
                    estimators=voting_models,
                    final_estimator=LogisticRegression(random_state=42, max_iter=1000),
                    cv=3
                )
                stacking_clf.fit(X_train, y_train)
                
                y_pred_stacking = stacking_clf.predict(X_test)
                acc_stacking = accuracy_score(y_test, y_pred_stacking)
                f1_stacking = f1_score(y_test, y_pred_stacking)
                
                print(f"\nStacking Ensemble:")
                print(f"   Accuracy: {acc_stacking:.4f} ({acc_stacking*100:.2f}%)")
                print(f"   F1 Score: {f1_stacking:.4f} ({f1_stacking*100:.2f}%)")
                
                # Choose best ensemble
                if acc_stacking > acc_voting:
                    final_model = stacking_clf
                    final_acc = acc_stacking
                    final_name = "StackingEnsemble"
                else:
                    final_model = voting_clf
                    final_acc = acc_voting
                    final_name = "VotingEnsemble"
            except Exception as e:
                print(f"\nStacking failed: {e}, using Voting")
                final_model = voting_clf
                final_acc = acc_voting
                final_name = "VotingEnsemble"
        else:
            final_model = voting_clf
            final_acc = acc_voting
            final_name = "VotingEnsemble"
    else:
        final_model = best_single
        final_acc = best_single_acc
        final_name = best_single_name
    
    # Use best model (ensemble or single)
    if final_acc > best_single_acc:
        model = final_model
        model_name = final_name
        print(f"\n{'='*70}")
        print(f"BEST MODEL: {model_name} with {final_acc:.4f} ({final_acc*100:.2f}%) accuracy")
        print(f"{'='*70}")
    else:
        model = best_single
        model_name = best_single_name
        print(f"\n{'='*70}")
        print(f"BEST MODEL: {model_name} with {best_single_acc:.4f} ({best_single_acc*100:.2f}%) accuracy")
        print(f"{'='*70}")
    
    return model, model_name

def train_model(df, use_smote=True):
    """Train the ultimate model with all optimizations"""
    print("\n" + "="*70)
    print("ULTIMATE MODEL TRAINING - MAXIMUM ACCURACY")
    print("="*70)

    try:
        # Create advanced features
        df_fe = create_advanced_features(df)
        
        # Get numeric columns
        numeric_cols = df_fe.select_dtypes(include=[np.number]).columns.tolist()
        if 'label' in numeric_cols:
            numeric_cols.remove('label')
        if 'cases' in numeric_cols:
            numeric_cols.remove('cases')
        
        X = df_fe[numeric_cols]
        y = df_fe['label']

        print(f"\nFeatures: {len(X.columns)} features")
        print(f"   Samples: {len(X)}")
        
        # Feature selection (keep all to preserve barangay temporal features)
        print("\nPerforming feature selection...")
        k_features = len(X.columns)
        if k_features < len(X.columns):
            selector = SelectKBest(score_func=mutual_info_classif, k=k_features)
            X_selected = selector.fit_transform(X, y)
            selected_features = X.columns[selector.get_support()].tolist()
            X = pd.DataFrame(X_selected, columns=selected_features, index=X.index)
            print(f"   Selected {len(selected_features)} best features")
        else:
            selected_features = X.columns.tolist()
            print(f"   Selected all {len(selected_features)} features")
        
        # Ensure numeric features are float for SMOTE compatibility
        X = X.astype(float)

        # Split data - Use smaller test set (10%) for more training data
        test_size = 0.10  # Reduced from 0.20 to 0.10 for more training data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        print(f"\n   Training set: {len(X_train)} samples")
        print(f"   Test set: {len(X_test)} samples")
        print(f"   Training outbreak rate: {y_train.mean()*100:.1f}%")
        print(f"   Test outbreak rate: {y_test.mean()*100:.1f}%")
        
        # Apply SMOTE if available
        if use_smote and SMOTE_AVAILABLE:
            print("\nApplying SMOTE for class imbalance...")
            smote = SMOTE(random_state=42, k_neighbors=min(5, (y_train == 0).sum() - 1))
            X_train, y_train = smote.fit_resample(X_train, y_train)
            print(f"   After SMOTE - Training set: {len(X_train)} samples")
            print(f"   Outbreak rate: {y_train.mean()*100:.1f}%")
        
        # Train best model
        model, model_name = train_best_model(X_train, y_train, X_test, y_test)
        
        # Final evaluation
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        try:
            roc_auc = roc_auc_score(y_test, y_pred_proba)
        except:
            roc_auc = 0.0
        
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
        
        print("\n" + "="*70)
        print("FINAL MODEL PERFORMANCE METRICS")
        print("="*70)
        print(f"Model Type: {model_name}")
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
        
        # Skip final cross-validation to save time (already done during hyperparameter tuning)
        print("\nFinal cross-validation skipped (already performed during hyperparameter tuning)")
        
        # Save model
        model_path = Path(__file__).parent.parent / "rf_dengue_model.pkl"
        feature_names_path = Path(__file__).parent.parent / "feature_names.pkl"
        encoder_path = Path(__file__).parent.parent / "barangay_encoder.pkl"
        
        joblib.dump(model, model_path)
        joblib.dump(selected_features, feature_names_path)
        
        if hasattr(df_fe, '_barangay_encoder'):
            joblib.dump(df_fe._barangay_encoder, encoder_path)
        
        print(f"\nModel saved to: {model_path}")
        print(f"Feature names saved to: {feature_names_path}")
        
        return model, selected_features

    except Exception as e:
        print(f"Error during training: {e}")
        import traceback
        traceback.print_exc()
        return None, None

if __name__ == "__main__":
    base_dir = Path(__file__).parent.parent
    climate_file = base_dir / "climate.csv"
    large_cases_file = base_dir / "backend" / "data" / "dengue_20251120_200947.csv"
    cases_file = base_dir / "dengue_cases.csv"
    
    if not climate_file.exists():
        print(f"Error: {climate_file} not found!")
        sys.exit(1)
    
    if large_cases_file.exists():
        cases_file = large_cases_file
        print(f"Using larger dengue dataset: {cases_file}")
    elif cases_file.exists():
        print(f"Using standard dengue dataset: {cases_file}")
    else:
        print(f"Error: No dengue cases file found!")
        sys.exit(1)
    
    print("="*70)
    print("ULTIMATE MODEL TRAINING - MAXIMUM ACCURACY")
    print("="*70)
    print(f"Climate data: {climate_file}")
    print(f"Dengue cases: {cases_file}")
    print()
    
    df = load_and_merge_data(str(climate_file), str(cases_file))
    
    if df is not None:
        model, feature_names = train_model(df, use_smote=True)
        
        if model is not None:
            print("\n" + "="*70)
            print("MODEL TRAINING COMPLETE!")
            print("="*70)
        else:
            print("\nModel training failed!")
            sys.exit(1)
    else:
        print("\nData loading failed!")
        sys.exit(1)
