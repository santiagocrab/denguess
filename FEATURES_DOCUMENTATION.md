# 🎯 New Frontend Features Documentation

This document describes the newly integrated frontend features for the Denguess system.

---

## 📋 Overview of New Features

1. ✅ **Admin Upload Interface with Auto-Retrain**
2. ✅ **Barangay-Based Heatmap Visualization**
3. ✅ **Enhanced Prediction API Integration**
4. ✅ **Risk Level Legend Component**
5. ✅ **Weekly Prediction Blocks with Dates**
6. ✅ **Chart.js Integration for Data Visualization**

---

## 1. Admin Upload Interface

### Location
`/admin` route - `AdminDashboard.jsx`

### Features
- **CSV File Upload**
  - Upload monthly climate data (date, rainfall, temperature, humidity)
  - Upload monthly dengue cases data (date, barangay, cases)
  
- **Auto-Retrain Toggle**
  - Toggle switch to enable/disable automatic model retraining
  - When enabled, model automatically retrains after each upload
  - Manual retrain button available at all times

- **Upload History**
  - View all uploaded files with timestamps
  - File size and modification date displayed

### API Integration
- `POST /upload/climate` - Upload climate CSV
- `POST /upload/dengue` - Upload dengue cases CSV
- `POST /model/retrain` - Trigger model retraining
- `GET /uploads` - List all uploaded files

### Usage
1. Navigate to `/admin`
2. Toggle "Auto-Retrain Model" on/off
3. Select CSV file and upload
4. If auto-retrain is enabled, model retrains automatically
5. Or click "Manually Retrain Model Now" button

---

## 2. Barangay-Based Heatmap Visualization

### Location
- Homepage (`Home.jsx`) - Shows all barangays
- Individual barangay pages (`BarangayPage.jsx`) - Shows single barangay

### Features
- **Interactive Map**
  - All 5 barangays displayed on single map
  - Color-coded by risk level:
    - 🟢 Green = Low Risk
    - 🟠 Orange = Moderate Risk
    - 🔴 Red = High Risk
  
- **Real-time Risk Display**
  - Fetches current predictions for all barangays
  - Updates automatically when data changes
  - Tooltips show barangay name and risk level
  - Popups show detailed information

### Components
- `BarangayHeatmap.jsx` - Main heatmap component
- `BarangayMap.jsx` - Single barangay map (existing, enhanced)

### API Integration
- `getAllBarangayPredictions()` - Fetches predictions for all barangays
- Uses existing `/predict` endpoint for each barangay

---

## 3. Prediction API Integration

### Enhanced API Service
Location: `frontend/src/services/api.js`

### New Functions

#### `getBarangayPredictions(barangay, date)`
Returns predictions in the requested format:
```json
{
  "barangay": "Zone II",
  "weekly_predictions": {
    "2025-12-01": "Low",
    "2025-12-08": "Moderate",
    "2025-12-15": "High",
    "2025-12-22": "High"
  },
  "full_forecast": [...]
}
```

#### `getAllBarangayPredictions(date)`
Returns predictions for all barangays:
```json
{
  "General Paulino Santos": { ... },
  "Morales": { ... },
  "Santa Cruz": { ... },
  "Sto. Niño": { ... },
  "Zone II": { ... }
}
```

#### `retrainModel()`
Triggers model retraining on the backend.

### Backend Endpoints Used
- `POST /predict` - Get predictions (existing)
- `POST /model/retrain` - Retrain model (existing)
- `GET /barangays` - Get barangay list (existing)

---

## 4. Risk Level Legend Component

### Location
`frontend/src/components/RiskLegend.jsx`

### Features
- **Visual Risk Display**
  - 🟢 Low Risk (< 30% probability)
  - 🟠 Moderate Risk (30-60% probability)
  - 🔴 High Risk (> 60% probability)

### Usage
```jsx
import RiskLegend from '../components/RiskLegend'

<RiskLegend />
```

### Displayed On
- Homepage
- All barangay pages
- Can be added to any page

---

## 5. Weekly Prediction Blocks with Dates

### Location
`BarangayPage.jsx`

### Features
- **Date Range Display**
  - Shows week ranges: "July 1–7", "July 8–14", etc.
  - Calculated from selected start date
  
- **Prediction Blocks**
  - Each week displayed as a card
  - Color-coded by risk level
  - Shows:
    - Week range (e.g., "July 1–7")
    - Risk level with icon
    - Probability percentage
    - Climate data used (current or historical)

### Example Display
```
🟢 July 1–7
Week 1 of 4
🟢 Low Risk (25%)
📊 Current data • 100mm • 28°C • 75%
```

---

## 6. Chart.js Integration

### Installation
```bash
npm install chart.js react-chartjs-2
```

### Component
Location: `frontend/src/components/RiskChart.jsx`

### Chart Types
1. **Line Chart**
   - Shows risk level trend over 4 weeks
   - Dual Y-axis: Risk level (1-3) and Probability (0-100%)

2. **Bar Chart**
   - Shows probability percentage per week
   - Color-coded by risk level

3. **Doughnut Chart**
   - Shows distribution of risk levels
   - Counts: Low, Moderate, High weeks

### Usage
```jsx
import RiskChart from '../components/RiskChart'

<RiskChart forecast={forecast} type="line" />
// type can be: 'line', 'bar', or 'doughnut'
```

### Displayed On
- Individual barangay pages
- Toggle between chart types
- Updates automatically with forecast data

---

## 📁 File Structure

```
frontend/src/
├── components/
│   ├── BarangayHeatmap.jsx      # NEW: All barangays heatmap
│   ├── BarangayMap.jsx          # Enhanced: Single barangay map
│   ├── RiskLegend.jsx           # NEW: Risk level legend
│   └── RiskChart.jsx            # NEW: Chart.js visualizations
├── pages/
│   ├── AdminDashboard.jsx       # Enhanced: Auto-retrain feature
│   ├── BarangayPage.jsx         # Enhanced: Charts, dates, legend
│   └── Home.jsx                 # Enhanced: Heatmap display
└── services/
    └── api.js                    # Enhanced: New API functions
```

---

## 🔌 API Endpoints

### Existing (Enhanced)
- `POST /predict` - Get weekly forecast
- `POST /upload/climate` - Upload climate CSV
- `POST /upload/dengue` - Upload dengue cases CSV
- `POST /model/retrain` - Retrain model
- `GET /uploads` - List uploaded files
- `GET /barangays` - Get barangay list

### New Functions (Frontend)
- `getBarangayPredictions(barangay, date)` - Get formatted predictions
- `getAllBarangayPredictions(date)` - Get all barangay predictions
- `retrainModel()` - Trigger retraining

---

## 🎨 UI/UX Enhancements

### Color Scheme
- **Low Risk:** Green (#10b981)
- **Moderate Risk:** Orange/Amber (#f59e0b)
- **High Risk:** Red (#ef4444)

### Components
- All components use Tailwind CSS
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Hover effects and interactive elements

---

## 📊 Data Flow

### Prediction Flow
```
User selects barangay
    ↓
Frontend calls getBarangayPredictions()
    ↓
API: POST /predict
    ↓
Backend: Random Forest model inference
    ↓
Response: Weekly forecast with dates
    ↓
Frontend: Display in cards + charts
```

### Upload & Retrain Flow
```
Admin uploads CSV
    ↓
API: POST /upload/climate or /upload/dengue
    ↓
Backend: Save file
    ↓
If auto-retrain enabled:
    ↓
API: POST /model/retrain
    ↓
Backend: Retrain model
    ↓
Frontend: Show success message
```

---

## 🔄 Integration with Existing System

### Backward Compatible
- ✅ All existing features still work
- ✅ Existing API endpoints unchanged
- ✅ No breaking changes to backend
- ✅ RF model connection maintained

### New Features
- ✅ Auto-retrain toggle in admin
- ✅ Heatmap on homepage
- ✅ Charts on barangay pages
- ✅ Enhanced date display
- ✅ Risk legend component

---

## 🚀 Future Enhancements

### Potential Additions
1. **Firebase Integration**
   - Store predictions in Firebase Realtime Database
   - Sync across devices
   - Historical data tracking

2. **Advanced Charts**
   - Time series analysis
   - Comparison charts
   - Export to PDF/CSV

3. **Notifications**
   - Alert when risk level changes
   - Email/SMS notifications
   - Push notifications

4. **Data Export**
   - Export predictions to CSV
   - Generate reports
   - Download charts as images

---

## 📝 Notes

- All features use existing REST API
- No Firebase required (optional for future)
- Chart.js is optional but recommended
- All components are responsive
- Tailwind CSS used for styling

---

## ✅ Testing Checklist

- [ ] Admin can upload CSV files
- [ ] Auto-retrain works when enabled
- [ ] Manual retrain button works
- [ ] Heatmap shows all barangays
- [ ] Heatmap colors match risk levels
- [ ] Charts display correctly
- [ ] Weekly prediction blocks show dates
- [ ] Risk legend displays correctly
- [ ] All pages are responsive
- [ ] API calls work correctly

---

**All new features are integrated and ready to use!** 🎉

