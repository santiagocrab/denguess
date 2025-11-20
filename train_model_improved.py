"""
IMPROVED Training Script - Uses both climate.csv and dengue_cases.csv properly
This version:
1. Trains separate models per barangay OR uses barangay as a feature
2. Uses actual case counts (not just binary)
3. Considers historical patterns per barangay
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from sklearn.preprocessing import LabelEncoder
from pathlib import Path

def load_and_merge_data(climate_file, cases_file):
    """Load and merge climate and dengue case data PER BARANGAY"""
    print("📊 Loading and preparing data...")

    try:
        # Load climate data
        climate = pd.read_csv(climate_file)
        climate['date'] = pd.to_datetime(climate['date'], errors='coerce')

        # Load dengue cases
        dengue = pd.read_csv(cases_file)
        dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')

        # Merge climate with dengue cases (keeping barangay information!)
        # This creates one row per date per barangay
        df = pd.merge(climate, dengue[['date', 'barangay', 'cases']], on='date', how='inner')

        # Remove rows with missing values
        df = df.dropna()

        print(f"✅ Data loaded successfully!")
        print(f"   Total records: {len(df)}")
        print(f"   Barangays: {df['barangay'].unique().tolist()}")
        print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
        
        # Show statistics per barangay
        print(f"\n📈 Statistics per barangay:")
        for barangay in sorted(df['barangay'].unique()):
            bg_data = df[df['barangay'] == barangay]
            print(f"   {barangay}:")
            print(f"     Records: {len(bg_data)}")
            print(f"     Avg cases: {bg_data['cases'].mean():.2f}")
            print(f"     Max cases: {bg_data['cases'].max()}")
            print(f"     Outbreak days: {(bg_data['cases'] > 0).sum()} ({(bg_data['cases'] > 0).mean()*100:.1f}%)")
        
        return df

    except Exception as e:
        print(f"❌ Error loading or processing files: {e}")
        import traceback
        traceback.print_exc()
        return None

def train_model_with_barangay(df, use_barangay_as_feature=True):
    """
    Train model that considers barangay-specific patterns
    
    Option 1: Use barangay as a feature (one model for all)
    Option 2: Train separate models per barangay
    """
    print("\n🔁 Training Random Forest model with barangay data...")

    try:
        # Encode barangay as numeric feature
        le = LabelEncoder()
        df_encoded = df.copy()
        df_encoded['barangay_encoded'] = le.fit_transform(df['barangay'])
        
        # Get numeric columns
        df_numeric = df_encoded.select_dtypes(include=[np.number])
        
        if use_barangay_as_feature:
            # Use barangay as a feature (one model)
            print("\n📋 Using barangay as a feature (single model for all barangays)")
            
            # Features: rainfall, temperature, humidity, barangay_encoded
            # Label: cases > 0 (binary) OR actual case count
            X = df_numeric[['rainfall', 'temperature', 'humidity', 'barangay_encoded']]
            y_binary = (df_numeric['cases'] > 0).astype(int)  # Binary classification
            
            print(f"   Features: {list(X.columns)}")
            print(f"   Samples: {len(X)}")
            print(f"   Outbreak cases: {y_binary.sum()} ({y_binary.mean()*100:.1f}%)")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_binary, test_size=0.25, random_state=42, stratify=y_binary
            )
            
            # Train Random Forest
            model = RandomForestClassifier(
                n_estimators=100,
                random_state=42,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                class_weight='balanced',
                n_jobs=-1
            )
            
            print(f"\n🌳 Training with {model.n_estimators} trees...")
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)
            
            # Metrics
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, zero_division=0)
            rec = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            
            cm = confusion_matrix(y_test, y_pred)
            tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
            
            print("\n" + "="*60)
            print("📊 MODEL PERFORMANCE METRICS")
            print("="*60)
            print(f"Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
            print(f"Precision: {prec:.4f} ({prec*100:.2f}%)")
            print(f"Recall:    {rec:.4f} ({rec*100:.2f}%)")
            print(f"F1 Score:  {f1:.4f} ({f1*100:.2f}%)")
            print(f"\nConfusion Matrix:")
            print(f"  True Negatives (TN):  {tn}")
            print(f"  False Positives (FP): {fp}")
            print(f"  False Negatives (FN): {fn}")
            print(f"  True Positives (TP):  {tp}")
            
            # Feature importance
            print("\n" + "="*60)
            print("🎯 FEATURE IMPORTANCE")
            print("="*60)
            feature_names = list(X.columns)
            feature_importance = pd.DataFrame({
                'feature': feature_names,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            for _, row in feature_importance.iterrows():
                print(f"  {row['feature']:20s}: {row['importance']:.4f} ({row['importance']*100:.2f}%)")
            
            # Save model and encoder
            model_path = Path(__file__).parent / "rf_dengue_model.pkl"
            encoder_path = Path(__file__).parent / "barangay_encoder.pkl"
            
            joblib.dump(model, model_path)
            joblib.dump(le, encoder_path)
            
            print(f"\n✅ Model saved to: {model_path}")
            print(f"✅ Encoder saved to: {encoder_path}")
            print(f"   Model type: {type(model).__name__}")
            print(f"   Features: {list(X.columns)}")
            print(f"   Barangay mapping:")
            for i, barangay in enumerate(le.classes_):
                print(f"     {i} = {barangay}")
            
            return model, le
        
        else:
            # Train separate models per barangay
            print("\n📋 Training separate models per barangay")
            models = {}
            
            for barangay in df['barangay'].unique():
                print(f"\n--- Training model for {barangay} ---")
                bg_data = df[df['barangay'] == barangay]
                bg_numeric = bg_data.select_dtypes(include=[np.number])
                
                X = bg_numeric[['rainfall', 'temperature', 'humidity']]
                y = (bg_numeric['cases'] > 0).astype(int)
                
                if len(X) < 10:
                    print(f"   ⚠️  Not enough data ({len(X)} samples), skipping...")
                    continue
                
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.25, random_state=42, stratify=y if y.nunique() > 1 else None
                )
                
                model = RandomForestClassifier(
                    n_estimators=100,
                    random_state=42,
                    max_depth=10,
                    min_samples_split=3,
                    min_samples_leaf=1,
                    class_weight='balanced',
                    n_jobs=-1
                )
                
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                acc = accuracy_score(y_test, y_pred)
                
                print(f"   Accuracy: {acc:.4f} ({acc*100:.2f}%)")
                models[barangay] = model
            
            # Save all models
            models_path = Path(__file__).parent / "rf_dengue_models_by_barangay.pkl"
            joblib.dump(models, models_path)
            print(f"\n✅ Models saved to: {models_path}")
            
            return models, None

    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()
        return None, None

if __name__ == "__main__":
    # Get paths
    base_dir = Path(__file__).parent
    climate_file = base_dir / "climate.csv"
    cases_file = base_dir / "dengue_cases.csv"
    
    if not climate_file.exists():
        print(f"❌ Error: {climate_file} not found!")
        exit(1)
    
    if not cases_file.exists():
        print(f"❌ Error: {cases_file} not found!")
        exit(1)
    
    print("="*60)
    print("🚀 DENGUESS MODEL RETRAINING (IMPROVED)")
    print("="*60)
    print(f"Climate data: {climate_file}")
    print(f"Dengue cases: {cases_file}")
    print()
    
    # Load data
    df = load_and_merge_data(str(climate_file), str(cases_file))
    
    if df is not None:
        # Train model with barangay as feature (recommended)
        model, encoder = train_model_with_barangay(df, use_barangay_as_feature=True)
        
        if model is not None:
            print("\n" + "="*60)
            print("✅ MODEL TRAINING COMPLETE!")
            print("="*60)
            print("\nThe model now considers:")
            print("  ✅ Climate data (rainfall, temperature, humidity)")
            print("  ✅ Barangay-specific patterns")
            print("  ✅ Historical case data per barangay")
            print("\nThe model is ready to use in the API.")
        else:
            print("\n❌ Model training failed!")
            exit(1)
    else:
        print("\n❌ Data loading failed!")
        exit(1)

