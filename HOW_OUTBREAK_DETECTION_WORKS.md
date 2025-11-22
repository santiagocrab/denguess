# 🦟 How Denguess Detects Outbreaks

## 📋 Overview

The system uses a **Random Forest Classifier** to predict the probability of a dengue outbreak based on climate conditions and barangay location.

---

## 🎯 What is an "Outbreak"?

**Definition:** An outbreak is defined as **any day with dengue cases > 0**

- ✅ **Outbreak (Class 1)**: `cases > 0` → At least 1 dengue case reported
- ❌ **No Outbreak (Class 0)**: `cases = 0` → Zero dengue cases

This is a **binary classification** problem: the model predicts whether there will be cases or not.

---

## 🔬 Step-by-Step: How the System Detects Outbreaks

### **Step 1: Model Training** (Learning from History)

The model learns from historical data in `dengue_cases.csv` and `climate.csv`:

```python
# From train_model_improved.py, line 85
y_binary = (df_numeric['cases'] > 0).astype(int)
# Creates binary labels:
# - 1 if cases > 0 (OUTBREAK)
# - 0 if cases = 0 (NO OUTBREAK)
```

**Training Data Example:**
```
Date       | Rainfall | Temp | Humidity | Cases | Label
-----------|----------|------|----------|-------|-------
2024-01-15 | 150mm    | 30°C | 80%      | 5     | 1 (OUTBREAK)
2024-01-16 | 20mm     | 25°C | 60%      | 0     | 0 (NO OUTBREAK)
2024-01-17 | 200mm    | 32°C | 85%      | 12    | 1 (OUTBREAK)
```

The model learns patterns like:
- "High rainfall + High temperature → Usually has cases"
- "Low rainfall + Low temperature → Usually no cases"

---

### **Step 2: Making a Prediction** (When You Request Forecast)

When you request a prediction, the system:

#### **2.1 Prepare Features**
```python
# From backend/app.py, lines 323-328
features_df = prepare_features(
    rainfall=100.0,      # mm
    temperature=28.0,   # °C
    humidity=75.0,      # %
    barangay="Morales"  # Location
)
```

The model uses **4 features**:
1. **Rainfall** (mm)
2. **Temperature** (°C)
3. **Humidity** (%)
4. **Barangay** (encoded as number)

#### **2.2 Model Prediction**
```python
# From backend/app.py, lines 334-336
probabilities = model.predict_proba(features_df)[0]
# Returns: [probability_no_outbreak, probability_outbreak]
# Example: [0.35, 0.65] means:
#   - 35% chance of NO outbreak (cases = 0)
#   - 65% chance of OUTBREAK (cases > 0)

outbreak_prob = probabilities[1]  # 0.65 (65%)
```

The Random Forest model:
- Uses **100 decision trees**
- Each tree makes a prediction
- Averages all 100 predictions
- Returns probability between 0.0 and 1.0
8
---

### **Step 3: Convert Probability to Risk Level**

```python
# From backend/app.py, lines 177-192
def get_risk_level(probability: float) -> str:
    if probability < 0.30:      # < 30% chance
        return "Low"
    elif probability < 0.60:    # 30-60% chance
        return "Moderate"
    else:                       # > 60% chance
        return "High"
```

**Risk Level Thresholds:**
- 🟢 **Low Risk**: < 30% probability of outbreak
- 🟡 **Moderate Risk**: 30-60% probability of outbreak
- 🔴 **High Risk**: > 60% probability of outbreak

---

## 📊 Real Example

### Example 1: High Risk (Outbreak Likely)

**Input:**
```
Barangay: Morales
Temperature: 30°C (high)
Rainfall: 150mm (high)
Humidity: 85% (high)
```

**Model Processing:**
```
Tree 1:  "Outbreak" (85% confidence)
Tree 2:  "Outbreak" (72% confidence)
Tree 3:  "Outbreak" (91% confidence)
...
Tree 100: "Outbreak" (68% confidence)

Average: 78% probability of outbreak
```

**Result:**
- **Outbreak Probability**: 78%
- **Risk Level**: **HIGH** (78% > 60%)
- **Interpretation**: Very likely to have dengue cases this week

---

### Example 2: Low Risk (No Outbreak Likely)

**Input:**
```
Barangay: Santa Cruz
Temperature: 25°C (moderate)
Rainfall: 20mm (low)
Humidity: 60% (moderate)
```

**Model Processing:**
```
Tree 1:  "No Outbreak" (15% confidence)
Tree 2:  "No Outbreak" (22% confidence)
Tree 3:  "Outbreak" (35% confidence)
...
Tree 100: "No Outbreak" (18% confidence)

Average: 20% probability of outbreak
```

**Result:**
- **Outbreak Probability**: 20%
- **Risk Level**: **LOW** (20% < 30%)
- **Interpretation**: Unlikely to have dengue cases this week

---

## 🧠 How the Model "Thinks"

The Random Forest model learned patterns from historical data:

### **Pattern 1: Temperature Matters Most**
- **High temperature (30°C+)** → Mosquitoes are more active → Higher outbreak risk
- **Low temperature (25°C-)** → Less mosquito activity → Lower outbreak risk

### **Pattern 2: Rainfall Creates Breeding Sites**
- **High rainfall (100mm+)** → Standing water → Mosquito breeding → Higher outbreak risk
- **Low rainfall (20mm-)** → No standing water → Lower outbreak risk

### **Pattern 3: Humidity Affects Survival**
- **High humidity (80%+)** → Mosquitoes survive better → Higher outbreak risk
- **Low humidity (60%-)** → Less favorable for mosquitoes → Lower outbreak risk

### **Pattern 4: Barangay-Specific Patterns**
- Each barangay has different historical patterns
- Some barangays historically have more cases than others
- The model learns these location-specific patterns

---

## 🔍 Why This Approach Works

### **1. Binary Classification**
- Simple: "Will there be cases or not?"
- Clear threshold: Any cases > 0 = outbreak
- Easy to interpret

### **2. Probability-Based**
- Not just "yes/no" but "how likely?"
- 65% probability is different from 90% probability
- Allows for risk levels (Low/Moderate/High)

### **3. Data-Driven**
- Based on actual historical data from Koronadal City
- Learned from real climate and case patterns
- Adapts to local conditions

### **4. Ensemble Method (100 Trees)**
- Multiple "experts" (trees) vote
- More accurate than single prediction
- Reduces errors

---

## 📈 Model Performance

Based on training data:

- **Accuracy**: 93.33% (correct predictions 93% of the time)
- **Recall**: 100% (never misses an actual outbreak - very important!)
- **F1 Score**: 96.55% (good balance of precision and recall)

**What this means:**
- ✅ The model is very good at detecting when outbreaks will happen
- ✅ It rarely misses a real outbreak (100% recall)
- ✅ It's accurate 93% of the time overall

---

## 🎯 Key Points

1. **Outbreak = Any Cases > 0**
   - Not a specific number, just "are there cases?"

2. **Probability-Based Prediction**
   - Model gives probability (0-100%), not certainty
   - Higher probability = more likely to have cases

3. **Risk Levels Are Thresholds**
   - Low: < 30% chance
   - Moderate: 30-60% chance
   - High: > 60% chance

4. **Based on Climate + Location**
   - Uses current weather conditions
   - Considers barangay-specific patterns
   - Predicts based on historical patterns

5. **Weekly Forecasts**
   - Week 1: Uses current climate data
   - Weeks 2-4: Uses historical monthly averages
   - Each week gets its own prediction

---

## 💡 In Simple Terms

**Think of it like weather prediction:**

1. **Training**: The model learned from history:
   - "When it's hot and rainy, there were usually dengue cases"
   - "When it's cool and dry, there were usually no cases"

2. **Prediction**: When you give it current weather:
   - It compares to historical patterns
   - Says "Based on similar weather in the past, there's a 65% chance of cases"

3. **Risk Level**: Converts probability to action:
   - 65% probability → High Risk → Take preventive measures!

---

## 🔄 Complete Flow Diagram

```
User Input
  ↓
[Climate Data: Temp, Rain, Humidity]
  ↓
[Barangay Location]
  ↓
Feature Preparation
  ↓
Random Forest Model (100 Trees)
  ↓
Each Tree Predicts: "Outbreak?" or "No Outbreak?"
  ↓
Average All 100 Predictions
  ↓
Final Probability (0.0 - 1.0)
  ↓
Convert to Risk Level
  ├─ < 30% → Low Risk 🟢
  ├─ 30-60% → Moderate Risk 🟡
  └─ > 60% → High Risk 🔴
  ↓
Return to User
```

---

## 📝 Summary

**How outbreaks are detected:**

1. ✅ **Definition**: Outbreak = any dengue cases > 0
2. ✅ **Training**: Model learned from historical climate + case data
3. ✅ **Prediction**: Uses current climate + location to predict probability
4. ✅ **Risk Level**: Converts probability to Low/Moderate/High
5. ✅ **Accuracy**: 93% accurate, 100% recall (never misses outbreaks)

The system is designed to be **conservative** - it's better to warn about a potential outbreak that doesn't happen than to miss a real one!

