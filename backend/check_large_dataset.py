"""
Check the large dengue dataset
"""
import pandas as pd
from pathlib import Path

base_dir = Path(__file__).parent.parent
large_dengue_file = base_dir / "backend" / "data" / "dengue_20251120_200947.csv"
climate_file = base_dir / "climate.csv"

print("="*70)
print("CHECKING LARGE DENGUE DATASET")
print("="*70)

# Load large dengue file
dengue = pd.read_csv(large_dengue_file)
print(f"\nLarge Dengue File:")
print(f"   Total rows: {len(dengue)}")
print(f"   Columns: {list(dengue.columns)}")
print(f"   Date range: {dengue['date'].min()} to {dengue['date'].max()}")
print(f"   Unique dates: {dengue['date'].nunique()}")
print(f"   Unique barangays: {dengue['barangay'].nunique()}")
print(f"   Barangays: {sorted(dengue['barangay'].unique())}")

# Check cases distribution
print(f"\nCases Distribution:")
print(f"   Total cases: {dengue['cases'].sum()}")
print(f"   Days with cases: {(dengue['cases'] > 0).sum()}")
print(f"   Days with no cases: {(dengue['cases'] == 0).sum()}")
print(f"   Outbreak rate: {(dengue['cases'] > 0).mean()*100:.1f}%")

# Group by date
dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')
dengue_grouped = dengue.groupby('date')['cases'].sum().reset_index()
dengue_grouped['label'] = (dengue_grouped['cases'] > 0).astype(int)

print(f"\nAfter Grouping by Date:")
print(f"   Unique dates: {len(dengue_grouped)}")
print(f"   Outbreak days: {dengue_grouped['label'].sum()} ({dengue_grouped['label'].mean()*100:.1f}%)")
print(f"   No outbreak days: {(dengue_grouped['label'] == 0).sum()} ({(dengue_grouped['label'] == 0).mean()*100:.1f}%)")

# Check climate data
climate = pd.read_csv(climate_file)
climate['date'] = pd.to_datetime(climate['date'], errors='coerce')
print(f"\nClimate Data:")
print(f"   Total records: {len(climate)}")
print(f"   Unique dates: {climate['date'].nunique()}")

# Merge
df = pd.merge(climate, dengue_grouped[['date', 'label']], on='date', how='inner')
df = df.dropna()

print(f"\nAfter Merging with Climate:")
print(f"   Total samples: {len(df)}")
print(f"   Outbreak cases: {df['label'].sum()} ({df['label'].mean()*100:.1f}%)")
print(f"   No outbreak cases: {(df['label'] == 0).sum()} ({(df['label'] == 0).mean()*100:.1f}%)")

print(f"\nWith 20% test split:")
print(f"   Test samples: {int(len(df) * 0.20)}")
print(f"   Training samples: {int(len(df) * 0.80)}")

print("\n" + "="*70)
