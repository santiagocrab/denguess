"""
Train a monthly barangay-level RandomForestRegressor using aggregated cases and climate.

Key features:
- Monthly aggregation per barangay
- Lagged cases (1-2 months)
- Month index and seasonal sin/cos encoding
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def load_and_aggregate(base_dir: Path) -> pd.DataFrame:
    """Load dengue + climate data and aggregate monthly per barangay."""
    climate_path = base_dir / "climate.csv"
    dengue_path = base_dir / "dengue_cases.csv"
    large_cases_file = base_dir / "backend" / "data" / "dengue_20251120_200947.csv"
    if large_cases_file.exists():
        dengue_path = large_cases_file

    climate = pd.read_csv(climate_path)
    climate["date"] = pd.to_datetime(climate["date"], errors="coerce")

    dengue = pd.read_csv(dengue_path)
    dengue["date"] = pd.to_datetime(dengue["date"], errors="coerce")

    df = pd.merge(
        dengue[["date", "barangay", "cases"]],
        climate[["date", "rainfall", "temperature", "humidity"]],
        on="date",
        how="inner",
    )
    df = df.dropna().sort_values(["barangay", "date"]).reset_index(drop=True)
    df["month"] = df["date"].dt.to_period("M").dt.to_timestamp()

    monthly = (
        df.groupby(["barangay", "month"], as_index=False)
        .agg(
            total_cases=("cases", "sum"),
            rainfall=("rainfall", "mean"),
            temperature=("temperature", "mean"),
            humidity=("humidity", "mean"),
        )
        .sort_values(["barangay", "month"])
    )
    return monthly


def add_temporal_features(monthly: pd.DataFrame) -> pd.DataFrame:
    """Add temporal and lag features per barangay."""
    df = monthly.copy()
    df["month_num"] = df["month"].dt.month
    df["month_sin"] = np.sin(2 * np.pi * df["month_num"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month_num"] / 12)

    unique_months = sorted(df["month"].unique())
    month_index_map = {m: i for i, m in enumerate(unique_months)}
    df["month_index"] = df["month"].map(month_index_map).astype(int)

    df["lag_cases_1"] = df.groupby("barangay")["total_cases"].shift(1)
    df["lag_cases_2"] = df.groupby("barangay")["total_cases"].shift(2)
    df[["lag_cases_1", "lag_cases_2"]] = df[["lag_cases_1", "lag_cases_2"]].fillna(0)
    return df


def time_based_split(df: pd.DataFrame, test_months: int = 6):
    """Split by time using the last N months as test set."""
    all_months = sorted(df["month"].unique())
    cutoff = all_months[-test_months] if len(all_months) > test_months else all_months[-1]
    train_df = df[df["month"] < cutoff].copy()
    test_df = df[df["month"] >= cutoff].copy()
    return train_df, test_df


def train_regressor(train_df: pd.DataFrame, test_df: pd.DataFrame):
    """Train RF regressor and evaluate."""
    feature_cols = [
        "rainfall",
        "temperature",
        "humidity",
        "month_index",
        "month_sin",
        "month_cos",
        "lag_cases_1",
        "lag_cases_2",
    ]

    X_train = train_df[feature_cols].astype(float)
    y_train = train_df["total_cases"].astype(float)
    X_test = test_df[feature_cols].astype(float)
    y_test = test_df["total_cases"].astype(float)

    model = RandomForestRegressor(
        n_estimators=800,
        max_depth=20,
        min_samples_split=2,
        min_samples_leaf=1,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = r2_score(y_test, preds)
    corr = np.corrcoef(y_test, preds)[0, 1] if len(y_test) > 1 else np.nan

    metrics = {
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
        "corr": corr,
        "test_samples": len(y_test),
    }
    return model, feature_cols, metrics


def main():
    base_dir = Path(__file__).resolve().parent.parent

    monthly = load_and_aggregate(base_dir)
    monthly = add_temporal_features(monthly)
    train_df, test_df = time_based_split(monthly, test_months=6)

    model, feature_cols, metrics = train_regressor(train_df, test_df)

    model_path = base_dir / "rf_dengue_model_monthly.pkl"
    feature_path = base_dir / "feature_names_monthly.pkl"
    joblib.dump(model, model_path)
    joblib.dump(feature_cols, feature_path)

    print("Monthly regressor evaluation:")
    for key, val in metrics.items():
        if isinstance(val, float):
            print(f"  {key}: {val:.4f}")
        else:
            print(f"  {key}: {val}")

    print(f"Saved model: {model_path}")
    print(f"Saved feature list: {feature_path}")


if __name__ == "__main__":
    main()
