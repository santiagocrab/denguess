# New Frontend Features Documentation

This document describes the newly integrated frontend features for the Dengue Prediction System.

## 🎯 Overview

The system now includes enhanced visualization, admin capabilities, and improved user experience with the following new features:

1. **Admin Upload Interface with Model Retraining**
2. **Barangay-Based Heatmap Visualization**
3. **Prediction API Integration**
4. **Risk Level Legend Component**
5. **Chart.js Visualizations**

---

## 1. Admin Upload Interface

### Features
- **CSV File Upload**: Admins can upload monthly climate and dengue cases data
- **Auto-Trigger Model Retraining**: After uploading new data, admins can retrain the model with one click
- **Upload History**: View all previously uploaded files with metadata

### Usage
1. Navigate to `/admin` route
2. Upload climate data CSV (columns: `date`, `rainfall`, `temperature`, `humidity`)
3. Upload dengue cases CSV (columns: `date`, `barangay`, `cases`)
4. Click "🔄 Retrain Model" to update the prediction model with new data

### API Endpoints
- `POST /upload/climate` - Upload climate data
- `POST /upload/dengue` - Upload dengue cases data
- `POST /model/retrain` - Retrain the model with latest data
- `GET /uploads` - List all uploaded files

### File Format Examples

**Climate Data (`climate.csv`):**
```csv
date,rainfall,temperature,humidity
2025-01-01,120.5,28.3,75.2
2025-01-02,95.0,29.1,73.8
```

**Dengue Cases (`dengue_cases.csv`):**
```csv
date,barangay,cases
2025-01-01,General Paulino Santos,2
2025-01-01,Morales,1
```

---

## 2. Barangay-Based Heatmap Visualization

### Features
- **Interactive Map**: Shows all 5 barangays in Koronadal City
- **Color-Coded Risk Levels**: 
  - 🟢 Green = Low Risk
  - 🟠 Orange = Moderate Risk
  - 🔴 Red = High Risk
- **Weekly Predictions**: Hover/click on barangays to see 4-week forecasts
- **Real-time Updates**: Automatically refreshes every 5 minutes

### Barangays Included
1. General Paulino Santos
2. Morales
3. Santa Cruz
4. Sto. Niño
5. Zone II

### Component Location
- **Home Page**: Main heatmap visualization
- **Component**: `frontend/src/components/BarangayHeatmap.jsx`

### Usage
The heatmap automatically loads on the home page (`/`) and displays:
- Current risk level for each barangay
- Weekly predictions when clicking on a barangay polygon
- Interactive tooltips with risk information

---

## 3. Prediction API Integration

### New API Endpoint

#### `GET /predict/weekly/{barangay}?start_date=YYYY-MM-DD`

Returns weekly predictions in the requested format:

```json
{
  "barangay": "Zone II",
  "weekly_predictions": {
    "2025-12-01": "Low",
    "2025-12-08": "Moderate",
    "2025-12-15": "High",
    "2025-12-22": "High"
  }
}
```

### Frontend Integration

The frontend uses this endpoint via the `getWeeklyPredictions()` function in `services/api.js`:

```javascript
import { getWeeklyPredictions } from '../services/api'

const prediction = await getWeeklyPredictions('Zone II', '2025-12-01')
// Returns: { barangay: "Zone II", weekly_predictions: {...} }
```

### Batch Predictions

For multiple barangays, use the batch endpoint:

```javascript
import { predictBatch } from '../services/api'

const requests = [
  { barangay: "Zone II", climate: {...}, date: "2025-12-01" },
  { barangay: "Morales", climate: {...}, date: "2025-12-01" }
]

const results = await predictBatch(requests)
```

---

## 4. Risk Level Legend Component

### Features
- **Visual Indicators**: Color-coded risk levels with emojis
- **Reusable Component**: Can be used across multiple pages
- **Responsive Design**: Adapts to mobile and desktop screens

### Component Usage

```jsx
import RiskLegend from '../components/RiskLegend'

<RiskLegend />
```

### Risk Levels

| Level | Color | Emoji | Description |
|-------|-------|-------|-------------|
| Low | Green | 🟢 | Minimal dengue activity expected |
| Moderate | Orange | 🟠 | Increased vigilance recommended |
| High | Red | 🔴 | Take immediate preventive measures |

### Component Location
- **File**: `frontend/src/components/RiskLegend.jsx`
- **Used in**: Home page, Barangay pages

---

## 5. Chart.js Visualizations

### Features
- **Animated Charts**: Bar and line charts for risk trends
- **Dual Y-Axis**: Shows both risk level and probability percentage
- **Interactive Tooltips**: Hover to see detailed information
- **Responsive Design**: Adapts to container size

### Chart Types

#### Bar Chart (Default)
Shows risk levels as colored bars with probability overlay.

#### Line Chart
Shows trend of outbreak probability over time.

### Component Usage

```jsx
import RiskChart from '../components/RiskChart'

<RiskChart 
  weeklyForecast={forecastData} 
  type="bar"  // or "line"
/>
```

### Data Format

The chart expects `weeklyForecast` array with format:
```javascript
[
  {
    week: "July 1–7",
    risk: "Low",
    probability: 0.25,
    outbreak_probability: 0.25
  },
  // ... more weeks
]
```

### Component Location
- **File**: `frontend/src/components/RiskChart.jsx`
- **Dependencies**: `chart.js`, `react-chartjs-2`
- **Used in**: Barangay detail pages

---

## 📊 Weekly Predictions Format

The system now supports the requested weekly predictions format:

### Example Response

```json
{
  "barangay": "Zone II",
  "weekly_predictions": {
    "2025-07-01": "Low",
    "2025-07-08": "Moderate",
    "2025-07-15": "Moderate",
    "2025-07-22": "High"
  }
}
```

### Date Format
- Dates are in `YYYY-MM-DD` format
- Each date represents the start of a 7-day week
- Predictions cover 4 weeks (28 days)

---

## 🔄 Data Flow

### Upload → Retrain → Predict Flow

1. **Admin uploads CSV** → Data saved to `backend/data/`
2. **Admin clicks "Retrain Model"** → Model retrained with new data
3. **Model reloaded** → New predictions use updated model
4. **Frontend fetches predictions** → Heatmap and charts update

### Prediction Flow

1. **User visits home page** → Frontend fetches predictions for all barangays
2. **API processes requests** → Uses current climate data + historical averages
3. **Model generates predictions** → Returns risk levels for 4 weeks
4. **Frontend displays** → Heatmap, charts, and tables update

---

## 🛠️ Technical Details

### Dependencies Added

```json
{
  "chart.js": "^latest",
  "react-chartjs-2": "^latest"
}
```

### New Components

1. `RiskLegend.jsx` - Risk level legend component
2. `BarangayHeatmap.jsx` - Interactive heatmap visualization
3. `RiskChart.jsx` - Chart.js visualization component

### Updated Components

1. `AdminDashboard.jsx` - Added retrain functionality
2. `Home.jsx` - Added heatmap with predictions
3. `BarangayPage.jsx` - Added chart visualization
4. `api.js` - Added new API functions

### New Backend Endpoints

1. `GET /predict/weekly/{barangay}` - Weekly predictions in requested format
2. `POST /model/retrain` - Retrain model endpoint (enhanced)

---

## 🚀 Usage Examples

### Fetching Weekly Predictions

```javascript
import { getWeeklyPredictions } from './services/api'

// Get predictions for a barangay
const predictions = await getWeeklyPredictions(
  'Zone II', 
  '2025-12-01'
)

console.log(predictions.weekly_predictions)
// {
//   "2025-12-01": "Low",
//   "2025-12-08": "Moderate",
//   "2025-12-15": "High",
//   "2025-12-22": "High"
// }
```

### Retraining Model

```javascript
import { retrainModel } from './services/api'

// Retrain after uploading new data
const result = await retrainModel()
console.log(result.message) // "Model retrained successfully"
```

### Displaying Heatmap

```jsx
import BarangayHeatmap from './components/BarangayHeatmap'

const risks = {
  'Zone II': 'High',
  'Morales': 'Moderate',
  // ...
}

const weeklyPreds = {
  'Zone II': {
    '2025-12-01': 'Low',
    '2025-12-08': 'Moderate',
    // ...
  }
}

<BarangayHeatmap 
  barangayRisks={risks}
  weeklyPredictions={weeklyPreds}
/>
```

---

## ✅ Checklist

- [x] Admin upload interface with retrain button
- [x] Barangay heatmap visualization
- [x] Weekly predictions API endpoint
- [x] Risk level legend component
- [x] Chart.js integration
- [x] Home page heatmap integration
- [x] Barangay page chart integration
- [x] API documentation

---

## 📝 Notes

- All features maintain backward compatibility with existing RF model
- Backend-frontend sync via REST API (no Firebase required, but can be added)
- Routing logic updated to support new components
- All components use Tailwind CSS for consistent styling
- Charts are responsive and work on mobile devices

---

## 🔗 Related Files

- `frontend/src/components/RiskLegend.jsx`
- `frontend/src/components/BarangayHeatmap.jsx`
- `frontend/src/components/RiskChart.jsx`
- `frontend/src/pages/AdminDashboard.jsx`
- `frontend/src/pages/Home.jsx`
- `frontend/src/services/api.js`
- `backend/app.py` (new endpoints)

---

**Last Updated**: 2025-01-XX
**Version**: 2.0.0

