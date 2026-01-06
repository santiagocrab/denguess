# 🌡️ How Climate Data Works in Denguess

This document explains how the system gets current climate data and how it handles future weeks in the forecast.

---

## 📊 Two Sources of Climate Data

The system uses **two different sources** for climate data:

1. **Current Week (Week 1)**: Uses **real-time/simulated weather data**
2. **Future Weeks (Weeks 2-4)**: Uses **historical monthly averages** from `climate.csv`

---

## 🌤️ Current Climate Data (Week 1)

### **Location**: `frontend/src/services/weather.js`

### **How It Works:**

The system has **two options** for getting current weather:

#### **Option 1: Simulated Weather (Currently Active)**

The system generates **realistic simulated weather data** based on:
- **Time of day** (warmer during day, cooler at night)
- **Season** (rainy season vs. dry season)
- **Koronadal City's typical climate patterns**

**Code Logic:**
```javascript
// Temperature varies by time of day
const baseTemp = 27.5°C
const tempVariation = varies by hour (warmer during day)
const seasonalTemp = +1.5°C in summer months
Final temperature = baseTemp + tempVariation + seasonalTemp + random variation

// Humidity is higher at night and during rainy season
Base humidity = 75%
+5% at night (6pm-6am)
+8% during rainy season (June-October)

// Rainfall probability
Rainy season (June-October): 15-40% chance of rain
Dry season: 5% chance of rain
If rain occurs: 10-160mm in rainy season, 5-55mm in dry season
```

**Example:**
- **Time**: 2:00 PM in July (rainy season)
- **Temperature**: ~30°C (warm afternoon)
- **Humidity**: ~83% (high, rainy season)
- **Rainfall**: 0-150mm (depends on random chance)

#### **Option 2: Real Weather API (Available but Not Active)**

The code includes support for **OpenWeatherMap API** (commented out):

```javascript
// To use real weather data:
// 1. Get free API key from openweathermap.org
// 2. Add to .env: VITE_WEATHER_API_KEY=your_key_here
// 3. Uncomment the OpenWeatherMap code in weather.js
```

**How to Enable Real Weather:**
1. Sign up at [openweathermap.org](https://openweathermap.org) (free tier available)
2. Get your API key
3. Add to `frontend/.env`:
   ```
   VITE_WEATHER_API_KEY=your_api_key_here
   ```
4. Uncomment lines 14-26 in `frontend/src/services/weather.js`

---

### **Auto-Update Mechanism**

The weather data **auto-updates every 5 minutes**:

```javascript
// From BarangayPage.jsx
useEffect(() => {
  const updateWeather = (weatherData) => {
    setWeather(weatherData)
    setLastUpdate(new Date())
    setClimateData({
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      rainfall: weatherData.rainfall,
    })
  }

  // Get weather immediately
  getCurrentWeather().then(updateWeather)
  
  // Then update every 5 minutes (300,000ms)
  const cleanup = subscribeToWeatherUpdates(updateWeather, 300000)
  
  return cleanup
}, [])
```

**What Happens:**
1. Page loads → Gets current weather immediately
2. Every 5 minutes → Fetches new weather data
3. Updates displayed values automatically
4. Triggers new prediction if climate changes significantly

---

## 📅 Future Weeks Climate Data (Weeks 2-4)

### **Location**: `backend/app.py` → `get_historical_climate_for_date()`

### **Source**: Historical data from `climate.csv`

### **How It Works:**

The system uses **monthly averages** from your historical `climate.csv` file:

```python
# Step 1: Load climate.csv
df = pd.read_csv('climate.csv')

# Step 2: Calculate monthly averages
monthly_avg = df.groupby('month').agg({
    'rainfall': 'mean',
    'temperature': 'mean',
    'humidity': 'mean'
})

# Step 3: For future week, get the month's average
# Example: If week 2 is in February, use February's average
month = target_date.month  # 1-12
climate_data = monthly_avg[month]
```

**Example:**
```
If you request forecast starting January 25, 2025:
- Week 1 (Jan 25-31): Uses current/simulated weather
- Week 2 (Feb 1-7): Uses February's historical average
- Week 3 (Feb 8-14): Uses February's historical average
- Week 4 (Feb 15-21): Uses February's historical average

If you request forecast starting January 1, 2025:
- Week 1 (Jan 1-7): Uses current/simulated weather
- Week 2 (Jan 8-14): Uses January's historical average
- Week 3 (Jan 15-21): Uses January's historical average
- Week 4 (Jan 22-28): Uses January's historical average
```

**Why Monthly Averages?**
- More reliable than weekly averages (more data points)
- Captures seasonal patterns
- Accounts for typical weather for that time of year
- Based on actual historical data from Koronadal City

---

## 🔄 Complete Flow

### **When User Requests Forecast:**

```
1. User visits BarangayPage
   ↓
2. Frontend calls getCurrentWeather()
   ↓
3. Gets current weather (simulated or real API)
   ↓
4. Sends to backend with prediction request:
   {
     barangay: "Morales",
     climate: {
       temperature: 28.5,
       humidity: 78,
       rainfall: 120
     },
     date: "2025-01-25"
   }
   ↓
5. Backend processes:
   - Week 1: Uses provided climate data
   - Week 2: Calculates date → Gets month → Uses monthly average
   - Week 3: Calculates date → Gets month → Uses monthly average
   - Week 4: Calculates date → Gets month → Uses monthly average
   ↓
6. Returns 4-week forecast with climate_used info
```

---

## 📊 Example: Complete Forecast

**Request Date**: January 25, 2025  
**Current Weather**: Temperature 28°C, Humidity 75%, Rainfall 100mm

**Forecast Response:**
```json
{
  "weekly_forecast": [
    {
      "week": "January 25–31, 2025",
      "risk": "Moderate",
      "probability": 0.45,
      "climate_used": {
        "rainfall": 100.0,
        "temperature": 28.0,
        "humidity": 75.0,
        "source": "current"
      }
    },
    {
      "week": "February 1–7, 2025",
      "risk": "High",
      "probability": 0.72,
      "climate_used": {
        "rainfall": 88.5,
        "temperature": 27.2,
        "humidity": 72.8,
        "source": "historical_avg"
      }
    },
    {
      "week": "February 8–14, 2025",
      "risk": "High",
      "probability": 0.72,
      "climate_used": {
        "rainfall": 88.5,
        "temperature": 27.2,
        "humidity": 72.8,
        "source": "historical_avg"
      }
    },
    {
      "week": "February 15–21, 2025",
      "risk": "High",
      "probability": 0.72,
      "climate_used": {
        "rainfall": 88.5,
        "temperature": 27.2,
        "humidity": 72.8,
        "source": "historical_avg"
      }
    }
  ]
}
```

**Explanation:**
- **Week 1**: Uses your current weather (100mm rain, 28°C, 75% humidity)
- **Weeks 2-4**: Uses February's historical average from `climate.csv` (88.5mm, 27.2°C, 72.8% humidity)

---

## 🔍 Where Data Comes From

### **Current Weather (Week 1)**
- **Source**: `frontend/src/services/weather.js`
- **Type**: Simulated (realistic patterns) OR Real API (OpenWeatherMap)
- **Updates**: Every 5 minutes automatically
- **Location**: Koronadal City coordinates (6.5031°N, 124.8470°E)

### **Historical Averages (Weeks 2-4)**
- **Source**: `climate.csv` file in project root
- **Type**: Actual historical data from Koronadal City
- **Calculation**: Monthly averages (mean of all data for each month)
- **Cached**: Loaded once at startup, stored in memory

---

## 🛠️ How to Use Real Weather Data

### **Step 1: Get API Key**
1. Go to [openweathermap.org](https://openweathermap.org)
2. Sign up for free account
3. Get your API key from dashboard

### **Step 2: Configure**
1. Create `frontend/.env` file:
   ```
   VITE_WEATHER_API_KEY=your_api_key_here
   ```

2. Edit `frontend/src/services/weather.js`:
   - Uncomment lines 14-26 (OpenWeatherMap code)
   - Comment out lines 28-66 (simulated data)

### **Step 3: Deploy**
- The `.env` file will be used in production
- Make sure to add `VITE_WEATHER_API_KEY` to your hosting platform's environment variables

---

## 📈 Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│           CURRENT WEATHER (Week 1)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Option A: Simulated (Current)                 │
│  ┌─────────────────────────────────────┐       │
│  │ weather.js                          │       │
│  │ - Time of day → Temperature         │       │
│  │ - Season → Humidity                 │       │
│  │ - Random chance → Rainfall          │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Option B: Real API (Available)                │
│  ┌─────────────────────────────────────┐       │
│  │ OpenWeatherMap API                  │       │
│  │ - Real-time temperature             │       │
│  │ - Real-time humidity                │       │
│  │ - Real-time rainfall                │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Auto-updates every 5 minutes                  │
└─────────────────────────────────────────────────┘
                    ↓
            Sent to Backend API
                    ↓
┌─────────────────────────────────────────────────┐
│        FUTURE WEEKS (Weeks 2-4)                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Source: climate.csv                            │
│  ┌─────────────────────────────────────┐       │
│  │ Historical Monthly Averages          │       │
│  │                                       │       │
│  │ January:  133.8mm, 27.0°C, 77.5%    │       │
│  │ February:  88.5mm, 27.2°C, 72.8%    │       │
│  │ March:     53.5mm, 28.1°C, 70.8%    │       │
│  │ ... (all 12 months)                  │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  Calculated at startup, cached in memory        │
└─────────────────────────────────────────────────┘
                    ↓
            Used for predictions
                    ↓
        Returns 4-week forecast
```

---

## 🎯 Key Points

1. **Week 1**: Uses **current/simulated weather** (updates every 5 min)
2. **Weeks 2-4**: Uses **historical monthly averages** from `climate.csv`
3. **Simulated data**: Realistic patterns based on Koronadal City climate
4. **Real API**: Available but requires OpenWeatherMap API key
5. **Historical data**: Based on actual past weather from your CSV file
6. **Auto-update**: Current weather refreshes automatically
7. **Monthly averages**: More reliable than weekly (more data points)

---

## 💡 Why This Approach?

### **Current Week (Real-time)**
- ✅ Most accurate for immediate predictions
- ✅ Reflects actual current conditions
- ✅ Updates automatically

### **Future Weeks (Historical Averages)**
- ✅ More realistic than guessing
- ✅ Based on actual historical patterns
- ✅ Accounts for seasonal variations
- ✅ No need for weather forecasts (which may be inaccurate)

---

## 📝 Summary

**Current Climate:**
- Source: Simulated weather service (or real API if configured)
- Updates: Every 5 minutes automatically
- Location: Koronadal City

**Future Weeks:**
- Source: Monthly averages from `climate.csv`
- Calculation: Mean of all historical data for each month
- Cached: Loaded once at backend startup

This hybrid approach gives you **accurate current predictions** and **realistic future forecasts** based on historical patterns! 🌡️📊

