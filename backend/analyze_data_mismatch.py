"""
Analyze why we only get 60 samples despite having 345 dengue records
"""
import pandas as pd
from pathlib import Path

base_dir = Path(__file__).parent.parent
large_dengue_file = base_dir / "backend" / "data" / "dengue_20251120_200947.csv"
climate_file = base_dir / "climate.csv"

print("="*70)
print("ANALYZING DATA MISMATCH - Why Only 60 Samples?")
print("="*70)

# Load dengue data
dengue = pd.read_csv(large_dengue_file)
dengue['date'] = pd.to_datetime(dengue['date'], errors='coerce')

print(f"\n1. DENGUE DATA:")
print(f"   Total records: {len(dengue)}")
print(f"   Unique dates: {dengue['date'].nunique()}")
print(f"   Date range: {dengue['date'].min()} to {dengue['date'].max()}")
print(f"   Barangays: {dengue['barangay'].nunique()}")

# Group by date
dengue_grouped = dengue.groupby('date')['cases'].sum().reset_index()
print(f"\n2. DENGUE DATA (Grouped by Date):")
print(f"   Unique dates after grouping: {len(dengue_grouped)}")
print(f"   Date range: {dengue_grouped['date'].min()} to {dengue_grouped['date'].max()}")

# Load climate data
climate = pd.read_csv(climate_file)
climate['date'] = pd.to_datetime(climate['date'], errors='coerce')

print(f"\n3. CLIMATE DATA:")
print(f"   Total records: {len(climate)}")
print(f"   Unique dates: {climate['date'].nunique()}")
print(f"   Date range: {climate['date'].min()} to {climate['date'].max()}")

# Check date overlap
dengue_dates = set(dengue_grouped['date'].dropna())
climate_dates = set(climate['date'].dropna())
overlap = dengue_dates.intersection(climate_dates)
only_dengue = dengue_dates - climate_dates
only_climate = climate_dates - dengue_dates

print(f"\n4. DATE OVERLAP ANALYSIS:")
print(f"   Dates in dengue: {len(dengue_dates)}")
print(f"   Dates in climate: {len(climate_dates)}")
print(f"   Overlapping dates: {len(overlap)} (THIS IS WHY WE ONLY GET {len(overlap)} SAMPLES!)")
print(f"   Dates only in dengue: {len(only_dengue)}")
print(f"   Dates only in climate: {len(only_climate)}")

if len(only_dengue) > 0:
    print(f"\n   Missing climate data for these dengue dates:")
    missing_dates = sorted(list(only_dengue))[:10]
    for date in missing_dates:
        print(f"     - {date.strftime('%Y-%m-%d')}")
    if len(only_dengue) > 10:
        print(f"     ... and {len(only_dengue) - 10} more")

if len(only_climate) > 0:
    print(f"\n   Climate data without dengue cases:")
    extra_dates = sorted(list(only_climate))[:10]
    for date in extra_dates:
        print(f"     - {date.strftime('%Y-%m-%d')}")
    if len(only_climate) > 10:
        print(f"     ... and {len(only_climate) - 10} more")

# Merge
df = pd.merge(climate, dengue_grouped[['date', 'cases']], on='date', how='inner')
df = df.dropna()

print(f"\n5. AFTER MERGING (Inner Join):")
print(f"   Total samples: {len(df)}")
print(f"   This is why we only have {len(df)} samples!")
print(f"   We can only use dates that exist in BOTH files")

print(f"\n6. SOLUTION:")
print(f"   To use all {len(dengue_grouped)} dengue dates, we need climate data for all those dates")
print(f"   Currently missing climate data for {len(only_dengue)} dates")

print("\n" + "="*70)
