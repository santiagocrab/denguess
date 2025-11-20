import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def load_and_merge_data(climate_file, cases_file):
    print("Loading and preparing data...")

    try:
        # Load climate data
        climate = pd.read_csv(climate_file)
        climate['date'] = pd.to_datetime(climate['date'], errors='coerce')

        # Load dengue cases
        dengue = pd.read_csv(cases_file)
        dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')

        # Group dengue data to daily total cases (if not already)
        dengue_grouped = dengue.groupby('date')['cases'].sum().reset_index()

        # Create binary label: outbreak if cases > 0
        dengue_grouped['label'] = (dengue_grouped['cases'] > 0).astype(int)

        # Merge on date
        df = pd.merge(climate, dengue_grouped[['date', 'label']], on='date')

        print("Data loaded successfully!")
        return df

    except Exception as e:
        print(f"Error loading or processing files: {e}")
        return None

def train_model(df):
    print("🔁 Training model...")

    try:
        # Drop non-numeric columns if any
        df = df.select_dtypes(include=[np.number])

        # Define features and label
        X = df.drop('label', axis=1)
        y = df['label']

        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

        # Train
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # Predict
        y_pred = model.predict(X_test)

        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

        print("\nMODEL PERFORMANCE:")
        print(f"Accuracy: {acc:.2f}")
        print(f"Precision: {prec:.2f}")
        print(f"Recall: {rec:.2f}")
        print(f"F1 Score: {f1:.2f}")
        print(f"Confusion Matrix — TP: {tp}, TN: {tn}, FP: {fp}, FN: {fn}")

        # Save model
        joblib.dump(model, "rf_dengue_model.pkl")
        print("\nModel saved as rf_dengue_model.pkl!")

    except Exception as e:
        print(f"Error during training: {e}")

# Run the pipeline
if __name__ == "__main__":
    df = load_and_merge_data("climate.csv", "dengue_cases.csv")
    if df is not None:
        train_model(df)