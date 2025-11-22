# How the Machine Learning Model Predicts Dengue Risk

## 🌳 Random Forest Algorithm Explained

### What is Random Forest?

Random Forest is an **ensemble learning** method that combines multiple decision trees to make predictions. Think of it like asking 100 experts (trees) to vote on whether there will be a dengue outbreak, and taking the majority vote.

### How It Works

#### 1. **Training Phase** (Learning from Historical Data)

```
Historical Data:
┌─────────────┬──────────────┬───────────┬──────────┬────────┐
│ Date        │ Rainfall(mm) │ Temp(°C)  │ Humidity │ Cases  │
├─────────────┼──────────────┼───────────┼──────────┼────────┤
│ 2020-01-01  │ 161.2        │ 27.45     │ 73       │ 4      │
│ 2020-02-01  │ 29.1         │ 27.90     │ 66       │ 7      │
│ 2020-03-01  │ 51.8         │ 28.80     │ 65       │ 0      │
│ ...         │ ...          │ ...       │ ...      │ ...    │
└─────────────┴──────────────┴───────────┴──────────┴────────┘
```

The model learns patterns like:
- "When temperature > 28°C AND rainfall > 100mm → outbreak likely"
- "When humidity < 70% AND temperature < 27°C → no outbreak"
- Complex combinations of all three features

#### 2. **Decision Trees** (100 Trees in Our Model)

Each tree asks a series of yes/no questions:

```
Example Decision Tree:
                    Temperature > 28°C?
                   /                  \
                 Yes                  No
                 /                      \
        Rainfall > 100mm?        Humidity > 75%?
        /            \              /            \
      Yes           No           Yes           No
      /              \            /              \
  OUTBREAK      Check more...  OUTBREAK    NO OUTBREAK
```

#### 3. **Ensemble Voting** (100 Trees Vote)

```
Tree 1:  "Outbreak" (probability: 0.85)
Tree 2:  "Outbreak" (probability: 0.72)
Tree 3:  "No Outbreak" (probability: 0.35)
Tree 4:  "Outbreak" (probability: 0.91)
...
Tree 100: "Outbreak" (probability: 0.68)

Final Prediction = Average of all 100 trees
                 = 0.6267 (62.67% probability of outbreak)
```

## 🔍 Step-by-Step Prediction Process

### When You Request a Prediction:

**Input:**
```json
{
  "temperature": 28.0,
  "humidity": 75.0,
  "rainfall": 100.0
}
```

### Step 1: Feature Preparation
```python
# Backend prepares features in exact order
features = pd.DataFrame({
    'rainfall': [100.0],
    'temperature': [28.0],
    'humidity': [75.0]
})
```

### Step 2: Model Processing
```python
# Each of the 100 trees evaluates the input
for tree in random_forest.trees:
    prediction = tree.predict(features)
    probability = tree.predict_proba(features)
    
# All 100 trees vote
final_probability = average(all_tree_probabilities)
```

### Step 3: Probability Calculation
```python
# Model returns probabilities for both classes
probabilities = model.predict_proba(features)
# [probability_no_outbreak, probability_outbreak]
# Example: [0.3733, 0.6267]

outbreak_probability = probabilities[1]  # 62.67%
```

### Step 4: Risk Level Assignment
```python
if outbreak_probability < 0.30:
    risk = "Low"
elif outbreak_probability < 0.60:
    risk = "Moderate"
else:
    risk = "High"  # 62.67% > 60% → High Risk
```

## 📊 Feature Importance (What Matters Most)

The model learned from historical data which features are most important:

1. **Temperature (42.78% importance)**
   - Most important factor
   - Higher temperatures → more mosquito activity → higher dengue risk

2. **Rainfall (33.99% importance)**
   - Second most important
   - Standing water from rain → mosquito breeding grounds

3. **Humidity (23.24% importance)**
   - Still important but less than others
   - Affects mosquito survival and breeding

## 🎯 Real Example

### Example 1: High Risk Scenario
```
Input:
  Temperature: 30°C (high)
  Rainfall: 150mm (high)
  Humidity: 80% (high)

Model Thinking:
  - High temperature → mosquitoes active
  - High rainfall → standing water → breeding
  - High humidity → mosquitoes survive better
  
Prediction: 85% probability of outbreak → HIGH RISK
```

### Example 2: Low Risk Scenario
```
Input:
  Temperature: 25°C (moderate)
  Rainfall: 20mm (low)
  Humidity: 60% (moderate)

Model Thinking:
  - Moderate temperature → less mosquito activity
  - Low rainfall → no standing water
  - Moderate humidity → less favorable conditions
  
Prediction: 15% probability of outbreak → LOW RISK
```

## 🔬 Why Random Forest Works Well

1. **Handles Non-Linear Relationships**
   - Can capture complex patterns like "high temp + high rain = outbreak"
   - Not just simple linear relationships

2. **Robust to Outliers**
   - Multiple trees average out errors
   - One wrong tree doesn't ruin the prediction

3. **Feature Interactions**
   - Automatically finds relationships between features
   - Example: "Temperature matters more when rainfall is high"

4. **Probability Output**
   - Not just yes/no, but confidence level
   - 60% probability is different from 90% probability

## 📈 Model Performance

Our model achieves:
- **93.33% Accuracy**: Correct predictions 93% of the time
- **96.55% F1 Score**: Good balance of precision and recall
- **100% Recall**: Never misses an actual outbreak (very important!)

## 🧠 The Learning Process

### What the Model Learned:

From 60 historical records, the model learned patterns like:

1. **Temperature Patterns:**
   - When temperature > 28°C → higher outbreak risk
   - Optimal mosquito breeding temperature range

2. **Rainfall Patterns:**
   - Rainfall > 100mm → creates breeding sites
   - Seasonal patterns (rainy season = more outbreaks)

3. **Combined Patterns:**
   - High temp + High rain = Very high risk
   - Low temp + Low rain = Low risk
   - Moderate conditions = Moderate risk

## 🔄 Prediction Flow Diagram

```
User Input (Climate Data)
         ↓
Feature Preparation (rainfall, temp, humidity)
         ↓
100 Decision Trees Evaluate
         ↓
Each Tree Votes (probability)
         ↓
Average All Votes
         ↓
Final Probability (0.0 - 1.0)
         ↓
Risk Level Assignment
    (Low / Moderate / High)
         ↓
Return Prediction to User
```

## 💡 Key Insights

1. **The model doesn't "know" about dengue** - it only learned patterns from data
2. **It's probabilistic** - gives probability, not certainty
3. **It's data-driven** - based on historical patterns in Koronadal City
4. **It's ensemble-based** - 100 trees working together for accuracy
5. **It's feature-based** - uses climate data to predict health outcomes

## 🎓 In Simple Terms

Imagine you're trying to predict if it will rain tomorrow. You look at:
- Cloud cover
- Temperature
- Humidity

A Random Forest is like asking 100 weather experts, each with different experience, to predict. Then you take the average of their predictions. That's more accurate than asking just one expert!

For dengue prediction, we're doing the same thing but with:
- Temperature
- Rainfall  
- Humidity

And the "experts" are 100 decision trees that learned from historical data.

