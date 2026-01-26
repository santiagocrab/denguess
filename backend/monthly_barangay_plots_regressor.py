"""
Generate per-barangay monthly plots for actual vs predicted dengue cases.

Outputs PNGs with:
- X-axis: Month
- Blue line: Actual monthly dengue cases
- Red line: Predicted monthly dengue cases
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def load_and_prepare(base_dir: Path) -> pd.DataFrame:
    """Load data and aggregate by barangay-month with temporal features."""
    climate_path = base_dir / "climate.csv"
    dengue_path = base_dir / "dengue_cases.csv"

    climate = pd.read_csv(climate_path)
    climate["date"] = pd.to_datetime(climate["date"], errors="coerce")

    dengue = pd.read_csv(dengue_path)
    dengue["date"] = pd.to_datetime(dengue["date"], errors="coerce")

    df = pd.merge(
        dengue[["date", "barangay", "cases"]],
        climate[["date", "rainfall", "temperature", "humidity"]],
        on="date",
        how="inner",
    ).dropna()

    df["month"] = df["date"].dt.to_period("M").dt.to_timestamp()

    monthly = (
        df.groupby(["barangay", "month"], as_index=False)
        .agg(
            cases=("cases", "sum"),
            rainfall=("rainfall", "mean"),
            temperature=("temperature", "mean"),
            humidity=("humidity", "mean"),
        )
        .sort_values(["barangay", "month"])
    )

    # Temporal features
    min_month = monthly["month"].min()
    monthly["month_index"] = (monthly["month"].dt.to_period("M") - min_month.to_period("M")).apply(lambda x: x.n)
    monthly["month_num"] = monthly["month"].dt.month
    monthly["month_sin"] = np.sin(2 * np.pi * monthly["month_num"] / 12)
    monthly["month_cos"] = np.cos(2 * np.pi * monthly["month_num"] / 12)
    monthly["lag_1_cases"] = monthly.groupby("barangay")["cases"].shift(1).fillna(0)
    monthly["lag_2_cases"] = monthly.groupby("barangay")["cases"].shift(2).fillna(0)

    return monthly


def main():
    base_dir = Path(__file__).resolve().parent.parent
    model_path = base_dir / "rf_dengue_monthly_regressor.pkl"
    feature_path = base_dir / "monthly_feature_names.pkl"

    model = joblib.load(model_path)
    feature_cols = joblib.load(feature_path)

    monthly = load_and_prepare(base_dir)
    monthly["pred_cases"] = model.predict(monthly[feature_cols].astype(float))

    out_dir = base_dir / "monthly_regressor_figures"
    out_dir.mkdir(exist_ok=True)

    plt.style.use("seaborn-v0_8-whitegrid")

    for barangay, group in monthly.groupby("barangay"):
        fig, ax = plt.subplots(figsize=(12, 6))

        ax.plot(
            group["month"],
            group["cases"],
            color="#1f77b4",
            linewidth=2.5,
            label="Actual Monthly Dengue Cases",
        )
        ax.plot(
            group["month"],
            group["pred_cases"],
            color="#d62728",
            linewidth=2.5,
            label="Predicted Monthly Dengue Cases",
        )

        ax.set_title(
            f"Monthly Dengue Cases vs Predicted Cases - {barangay}",
            pad=14,
            fontsize=14,
            fontweight="bold",
        )
        ax.set_xlabel("Month")
        ax.set_ylabel("Dengue Cases (per month)")
        ax.legend(loc="upper left")

        ax.set_xticks(group["month"])
        ax.set_xticklabels(
            [d.strftime("%Y-%m") for d in group["month"]],
            rotation=45,
            ha="right",
        )

        plt.tight_layout()

        safe_name = str(barangay).replace(" ", "_").replace("/", "_")
        out_path = out_dir / f"monthly_cases_vs_pred_{safe_name}.png"
        plt.savefig(out_path, dpi=300, bbox_inches="tight")
        plt.close(fig)

    print(f"Saved figures to: {out_dir}")


if __name__ == "__main__":
    main()
