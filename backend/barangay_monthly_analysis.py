"""
Barangay-level monthly evaluation and visualization for dengue outbreak prediction.

This script:
1) Loads the trained Random Forest model, barangay encoder, and input datasets.
2) Builds extended features (including barangay temporal trends).
3) Generates outbreak probabilities for each record.
4) Aggregates by barangay + month.
5) Prints barangay-level monthly evaluation metrics.
6) Saves publication-quality per-barangay time-series figures.
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.metrics import roc_auc_score

from retrain_model import create_advanced_features


def load_data(base_dir: Path) -> pd.DataFrame:
    """Load dengue cases and climate data, then merge on date."""
    climate_path = base_dir / "climate.csv"
    dengue_path = base_dir / "dengue_cases.csv"

    climate = pd.read_csv(climate_path)
    climate["date"] = pd.to_datetime(climate["date"], errors="coerce")

    dengue = pd.read_csv(dengue_path)
    dengue["date"] = pd.to_datetime(dengue["date"], errors="coerce")
    dengue["label"] = (dengue["cases"] > 0).astype(int)

    df = pd.merge(
        dengue[["date", "barangay", "cases", "label"]],
        climate[["date", "rainfall", "temperature", "humidity"]],
        on="date",
        how="inner",
    )
    df = df.sort_values(["date", "barangay"]).reset_index(drop=True)
    return df.dropna()


def build_features(df: pd.DataFrame, encoder, feature_names) -> pd.DataFrame:
    """Create model features aligned to the trained model."""
    df_fe = create_advanced_features(df, barangay_encoder=encoder)
    return df_fe[feature_names]


def aggregate_monthly(df: pd.DataFrame, probs: np.ndarray) -> pd.DataFrame:
    """Aggregate total cases and average predicted probability by barangay-month."""
    out = df.copy()
    out["pred_prob"] = probs
    out["month"] = out["date"].dt.to_period("M").dt.to_timestamp()

    monthly = (
        out.groupby(["barangay", "month"])
        .agg(
            total_cases=("cases", "sum"),
            avg_pred_prob=("pred_prob", "mean"),
        )
        .reset_index()
        .sort_values(["barangay", "month"])
    )
    return monthly


def evaluate_monthly(monthly: pd.DataFrame) -> pd.DataFrame:
    """Compute simple barangay-level monthly evaluation metrics."""
    results = []
    for barangay, group in monthly.groupby("barangay"):
        corr = group["total_cases"].corr(group["avg_pred_prob"])
        # Monthly outbreak label: any cases in the month
        y_true = (group["total_cases"] > 0).astype(int)
        try:
            auc = roc_auc_score(y_true, group["avg_pred_prob"])
        except ValueError:
            auc = np.nan
        results.append(
            {
                "barangay": barangay,
                "monthly_corr_cases_vs_prob": corr,
                "monthly_roc_auc": auc,
            }
        )
    return pd.DataFrame(results)


def plot_barangay_series(monthly: pd.DataFrame, output_dir: Path) -> None:
    """Create per-barangay monthly time-series figures (publication quality)."""
    output_dir.mkdir(exist_ok=True)

    # Ensure all months appear in each plot
    all_months = pd.date_range(monthly["month"].min(), monthly["month"].max(), freq="MS")

    plt.style.use("seaborn-v0_8-whitegrid")

    for barangay, group in monthly.groupby("barangay"):
        filled = (
            group.set_index("month")
            .reindex(all_months)
            .fillna({"total_cases": 0, "avg_pred_prob": 0})
            .reset_index()
            .rename(columns={"index": "month"})
        )

        fig, ax1 = plt.subplots(figsize=(12, 6))

        # Left axis: total cases (blue solid line)
        ax1.plot(
            filled["month"],
            filled["total_cases"],
            color="#1f77b4",
            linewidth=2.5,
            label="Total Dengue Cases",
        )
        ax1.set_ylabel("Total Dengue Cases (per month)")
        ax1.set_xlabel("Month")

        # Right axis: average predicted probability (red solid line)
        ax2 = ax1.twinx()
        ax2.plot(
            filled["month"],
            filled["avg_pred_prob"],
            color="#d62728",
            linewidth=2.5,
            label="Avg Predicted Outbreak Probability",
        )
        ax2.set_ylabel("Average Predicted Outbreak Probability")
        ax2.set_ylim(0, 1)

        ax1.set_title(
            f"Monthly Dengue Cases vs Predicted Outbreak Probability - {barangay}",
            pad=14,
            fontsize=14,
            fontweight="bold",
        )

        # Legend (clear and non-overlapping)
        lines = ax1.get_lines() + ax2.get_lines()
        labels = [line.get_label() for line in lines]
        ax1.legend(lines, labels, loc="upper left")

        # Show all months on the x-axis
        ax1.set_xticks(all_months)
        ax1.set_xticklabels(
            [d.strftime("%Y-%m") for d in all_months],
            rotation=45,
            ha="right",
        )

        plt.tight_layout()

        safe_name = str(barangay).replace(" ", "_").replace("/", "_")
        out_path = output_dir / f"monthly_cases_vs_prob_{safe_name}.png"
        plt.savefig(out_path, dpi=300, bbox_inches="tight")
        plt.close(fig)


def main():
    base_dir = Path(__file__).resolve().parent.parent

    # Load artifacts
    model = joblib.load(base_dir / "rf_dengue_model.pkl")
    encoder = joblib.load(base_dir / "barangay_encoder.pkl")
    feature_names = joblib.load(base_dir / "feature_names.pkl")

    # Load and prepare data
    df = load_data(base_dir)
    X = build_features(df, encoder, feature_names)

    # Predict outbreak probabilities
    probs = model.predict_proba(X)[:, 1]

    # Aggregate by barangay and month
    monthly = aggregate_monthly(df, probs)

    # Evaluate barangay-level monthly performance
    metrics = evaluate_monthly(monthly)
    print("\nBarangay-level monthly evaluation:")
    print(metrics.to_string(index=False))

    # Plot per barangay
    output_dir = base_dir / "barangay_monthly_figures"
    plot_barangay_series(monthly, output_dir)
    print(f"\nSaved figures to: {output_dir}")


if __name__ == "__main__":
    main()
