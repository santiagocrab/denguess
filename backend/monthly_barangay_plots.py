"""
Generate per-barangay monthly plots with actual cases vs predicted cases.
Uses the monthly regressor trained on aggregated monthly data.
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


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

    df["lag_cases_1"] = df.groupby("barangay")["total_cases"].shift(1).fillna(0)
    df["lag_cases_2"] = df.groupby("barangay")["total_cases"].shift(2).fillna(0)
    return df


def main():
    base_dir = Path(__file__).resolve().parent.parent

    model_path = base_dir / "rf_dengue_model_monthly.pkl"
    feature_path = base_dir / "feature_names_monthly.pkl"

    model = joblib.load(model_path)
    feature_cols = joblib.load(feature_path)

    monthly = load_and_aggregate(base_dir)
    monthly = add_temporal_features(monthly)

    X = monthly[feature_cols].astype(float)
    monthly["pred_cases"] = model.predict(X)

    output_dir = base_dir / "figures"
    output_dir.mkdir(exist_ok=True)

    all_months = pd.date_range(monthly["month"].min(), monthly["month"].max(), freq="MS")
    plt.style.use("seaborn-v0_8-whitegrid")

    for barangay, group in monthly.groupby("barangay"):
        filled = (
            group.set_index("month")
            .reindex(all_months)
            .fillna({"total_cases": 0, "pred_cases": 0})
            .reset_index()
            .rename(columns={"index": "month"})
        )

        fig, ax1 = plt.subplots(figsize=(12, 6))

        ax1.plot(
            filled["month"],
            filled["total_cases"],
            color="#1f77b4",
            linewidth=2.5,
            label="Actual Dengue Cases",
        )
        ax1.set_xlabel("Month")
        ax1.set_ylabel("Total Dengue Cases (per month)")

        ax2 = ax1.twinx()
        ax2.plot(
            filled["month"],
            filled["pred_cases"],
            color="#d62728",
            linewidth=2.5,
            label="Predicted Dengue Cases",
        )
        ax2.set_ylabel("Predicted Dengue Cases")

        ax1.set_title(
            f"Monthly Dengue Cases vs Predicted Cases - {barangay}",
            pad=14,
            fontsize=14,
            fontweight="bold",
        )

        lines = ax1.get_lines() + ax2.get_lines()
        labels = [line.get_label() for line in lines]
        ax1.legend(lines, labels, loc="upper left")

        ax1.set_xticks(all_months)
        ax1.set_xticklabels(
            [d.strftime("%Y-%m") for d in all_months],
            rotation=45,
            ha="right",
        )

        plt.tight_layout()

        safe_name = str(barangay).replace(" ", "_").replace("/", "_")
        out_path = output_dir / f"monthly_cases_vs_pred_{safe_name}.png"
        plt.savefig(out_path, dpi=300, bbox_inches="tight")
        plt.close(fig)

    print(f"Saved figures to: {output_dir}")


if __name__ == "__main__":
    main()
