# Dengue Prediction System - Koronadal City

A full-stack web application for predicting dengue risk levels in five barangays of Koronadal City using a Random Forest machine learning model.

## 🏗️ Architecture

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite + Tailwind CSS
- **Model**: Random Forest Classifier (scikit-learn)
- **Maps**: React Leaflet

## 📁 Project Structure

```
dengue_rf_model/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── data/              # Uploaded CSV files (created at runtime)
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
├── rf_dengue_model.pkl    # Trained model
├── climate.csv            # Climate data
├── dengue_cases.csv       # Dengue cases data
└── train_model.py         # Model training script
```

## 🚀 Quick Start

### Option 1: Using Startup Scripts (Recommended)

**Linux/Mac:**
```bash
# Terminal 1 - Start Backend
./start_backend.sh

# Terminal 2 - Start Frontend
./start_frontend.sh
```

**Windows:**
```bash
# Command Prompt 1 - Start Backend
start_backend.bat

# Command Prompt 2 - Start Frontend
start_frontend.bat
```

### Option 2: Manual Setup

## 🚀 Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Ensure the model file exists in the parent directory:
```bash
# The model should be at: ../rf_dengue_model.pkl
# If not, run the training script first:
cd ..
python train_model.py
cd backend
```

5. Start the FastAPI server:
```bash
python app.py
# Or use uvicorn directly:
uvicorn app:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Verify Setup

1. **Check Backend**: Visit `http://localhost:8000/docs` to see the API documentation
2. **Check Frontend**: Visit `http://localhost:3000` to see the application
3. **Test Prediction**: Navigate to any barangay page and adjust climate parameters to see predictions

## 📡 API Endpoints

### Prediction
- `POST /predict` - Generate weekly dengue risk forecast
  ```json
  {
    "barangay": "Santa Cruz",
    "climate": {
      "temperature": 32.1,
      "humidity": 80,
      "rainfall": 120
    },
    "date": "2025-07-01"
  }
  ```

### Data Upload
- `POST /upload/climate` - Upload climate data CSV
- `POST /upload/dengue` - Upload dengue cases CSV
- `GET /uploads` - List all uploaded files

### Case Reporting
- `POST /report-case?barangay=...&date=...&symptoms=...` - Report dengue case/symptoms

### Barangays
- `GET /barangays` - Get list of barangays

## 🎯 Features

### Public Pages
- **Home**: Overview of all barangays
- **Barangay Pages**: Individual pages for each of the 5 barangays:
  - General Paulino Santos
  - Morales
  - Santa Cruz
  - Sto. Niño
  - Zone II
- **Information Desk**: Dengue prevention tips, symptoms, and emergency contacts

### Admin Dashboard
- Upload climate data CSV files
- Upload dengue cases CSV files
- View upload history
- Trigger predictions

### Barangay Pages Include:
- Interactive map with risk visualization
- Weekly dengue risk forecast (4 weeks)
- Climate parameter controls
- Anonymous case reporting form
- Risk level legend

## 📊 Risk Levels

- **🟢 Low Risk**: Probability < 30% - Minimal dengue activity expected
- **🟡 Moderate Risk**: Probability 30-60% - Increased vigilance recommended
- **🔴 High Risk**: Probability > 60% - Take preventive measures immediately

## 📝 CSV Format Requirements

### Climate Data (`climate.csv`)
```csv
date,rainfall,temperature,humidity
2025-01-01,161.2,27.45,73
```

### Dengue Cases (`dengue_cases.csv`)
```csv
date,barangay,cases
2025-01-01,General Paulino Santos,4
```

## 🔧 Development

### Backend Development
```bash
cd backend
uvicorn app:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
The FastAPI app can be deployed using:
- Gunicorn + Uvicorn workers
- Docker
- Cloud platforms (Heroku, AWS, etc.)

## 🐛 Troubleshooting

1. **Model not found**: Ensure `rf_dengue_model.pkl` exists in the project root. Run `python train_model.py` to generate it.

2. **CORS errors**: Check that the backend CORS settings include your frontend URL.

3. **Port conflicts**: Change ports in `vite.config.js` (frontend) or `app.py` (backend).

4. **Missing dependencies**: Run `pip install -r requirements.txt` (backend) and `npm install` (frontend).

## 📄 License

This project is for educational and public health purposes.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- Tests pass (if applicable)
- Documentation is updated

## 📞 Support

For issues or questions, please contact the development team or refer to the Information Desk page in the application.

# denguess
