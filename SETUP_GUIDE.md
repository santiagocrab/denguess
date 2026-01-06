# Complete Setup and Startup Guide

This guide will help you set up and run the Dengue Prediction System on a new computer.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Python 3.8 or higher**
   - Check if installed: `python --version` or `python3 --version`
   - Download from: https://www.python.org/downloads/
   - ⚠️ **Important**: During installation, check "Add Python to PATH"

2. **Node.js 16 or higher**
   - Check if installed: `node --version`
   - Download from: https://nodejs.org/
   - This also installs npm (Node Package Manager)

3. **Git** (optional, if cloning from repository)
   - Check if installed: `git --version`
   - Download from: https://git-scm.com/downloads

### Verify Installation

Open your terminal/command prompt and run:
```bash
python --version    # Should show Python 3.8 or higher
node --version      # Should show v16 or higher
npm --version       # Should show version number
```

---

## 🚀 Step-by-Step Setup

### Step 1: Get the Project Files

**Option A: If you have the project folder**
- Copy the entire `dengue_rf_model` folder to your new computer

**Option B: If cloning from Git**
```bash
git clone <repository-url>
cd dengue_rf_model
```

### Step 2: Verify Required Files

Make sure these files exist in the project root:
- ✅ `rf_dengue_model.pkl` (the trained model)
- ✅ `barangay_encoder.pkl` (barangay encoder)
- ✅ `climate.csv` (climate data)
- ✅ `dengue_cases.csv` (dengue cases data)
- ✅ `backend/` folder with `app.py` and `requirements.txt`
- ✅ `frontend/` folder with `package.json`

**⚠️ If `rf_dengue_model.pkl` is missing**, you'll need to train the model first:
```bash
python train_model.py
```

---

## 🔧 Backend Setup (Python/FastAPI)

### For Windows:

1. **Open Command Prompt or PowerShell**
   - Press `Win + R`, type `cmd`, press Enter

2. **Navigate to the project directory**
   ```cmd
   cd path\to\dengue_rf_model
   ```

3. **Navigate to backend folder**
   ```cmd
   cd backend
   ```

4. **Create virtual environment**
   ```cmd
   python -m venv venv
   ```
   (This may take a minute)

5. **Activate virtual environment**
   ```cmd
   venv\Scripts\activate
   ```
   You should see `(venv)` at the start of your command prompt.

6. **Install Python dependencies**
   ```cmd
   pip install -r requirements.txt
   ```
   (This may take 2-5 minutes depending on your internet speed)

7. **Verify installation**
   ```cmd
   python -c "import fastapi; print('FastAPI installed successfully')"
   ```

### For Mac/Linux:

1. **Open Terminal**
   - Press `Cmd + Space`, type "Terminal", press Enter (Mac)
   - Or open Terminal application (Linux)

2. **Navigate to the project directory**
   ```bash
   cd /path/to/dengue_rf_model
   ```

3. **Navigate to backend folder**
   ```bash
   cd backend
   ```

4. **Create virtual environment**
   ```bash
   python3 -m venv venv
   ```

5. **Activate virtual environment**
   ```bash
   source venv/bin/activate
   ```
   You should see `(venv)` at the start of your terminal prompt.

6. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

7. **Verify installation**
   ```bash
   python -c "import fastapi; print('FastAPI installed successfully')"
   ```

---

## 🎨 Frontend Setup (React/Vite)

### For Windows:

1. **Open a NEW Command Prompt or PowerShell**
   - Keep the backend terminal open if you plan to start it later
   - Or you can set up frontend first, then start both

2. **Navigate to the project directory**
   ```cmd
   cd path\to\dengue_rf_model
   ```

3. **Navigate to frontend folder**
   ```cmd
   cd frontend
   ```

4. **Install Node.js dependencies**
   ```cmd
   npm install
   ```
   (This may take 2-5 minutes depending on your internet speed)

5. **Verify installation**
   ```cmd
   npm list --depth=0
   ```
   You should see packages like react, vite, etc.

### For Mac/Linux:

1. **Open a NEW Terminal window**
   - Keep the backend terminal open if you plan to start it later

2. **Navigate to the project directory**
   ```bash
   cd /path/to/dengue_rf_model
   ```

3. **Navigate to frontend folder**
   ```bash
   cd frontend
   ```

4. **Install Node.js dependencies**
   ```bash
   npm install
   ```

5. **Verify installation**
   ```bash
   npm list --depth=0
   ```

---

## ▶️ Starting the Application

You need to run **both** the backend and frontend servers. They must run simultaneously in separate terminal windows.

### Method 1: Using Startup Scripts (Easiest)

#### Windows:

**Terminal 1 - Backend:**
```cmd
cd path\to\dengue_rf_model
start_backend.bat
```

**Terminal 2 - Frontend:**
```cmd
cd path\to\dengue_rf_model
start_frontend.bat
```

#### Mac/Linux:

**Terminal 1 - Backend:**
```bash
cd /path/to/dengue_rf_model
chmod +x start_backend.sh    # Only needed first time
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
cd /path/to/dengue_rf_model
chmod +x start_frontend.sh   # Only needed first time
./start_frontend.sh
```

### Method 2: Manual Start (More Control)

#### Backend (Terminal 1):

**Windows:**
```cmd
cd path\to\dengue_rf_model\backend
venv\Scripts\activate
python app.py
```

**Mac/Linux:**
```bash
cd /path/to/dengue_rf_model/backend
source venv/bin/activate
python app.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Frontend (Terminal 2):

**Windows:**
```cmd
cd path\to\dengue_rf_model\frontend
npm run dev
```

**Mac/Linux:**
```bash
cd /path/to/dengue_rf_model/frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## ✅ Verification Steps

### 1. Check Backend is Running

Open your web browser and visit:
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/

You should see:
- The FastAPI documentation page (Swagger UI) at `/docs`
- A JSON response at the root `/`

### 2. Check Frontend is Running

Open your web browser and visit:
- **Frontend Application**: http://localhost:3000

You should see:
- The Dengue Prediction System homepage
- Navigation menu
- Barangay selection

### 3. Test the Connection

1. Open the frontend at http://localhost:3000
2. Navigate to any barangay page
3. Try adjusting climate parameters
4. Check if predictions appear

If predictions work, everything is connected correctly! ✅

---

## 🔍 Troubleshooting

### Problem: "python: command not found" or "python3: command not found"

**Solution:**
- Make sure Python is installed and added to PATH
- On Windows: Reinstall Python and check "Add Python to PATH"
- On Mac/Linux: Try `python3` instead of `python`

### Problem: "node: command not found" or "npm: command not found"

**Solution:**
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation
- Verify with `node --version`

### Problem: Backend shows "ModuleNotFoundError"

**Solution:**
```bash
# Make sure virtual environment is activated
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Then reinstall:
pip install -r requirements.txt
```

### Problem: Frontend shows "Cannot find module"

**Solution:**
```bash
cd frontend
rm -rf node_modules    # Mac/Linux
# OR
rmdir /s node_modules  # Windows

npm install
```

### Problem: "Port 8000 already in use" (Backend)

**Solution:**
- Another application is using port 8000
- Close the other application, or
- Change the port in `backend/app.py` (line 614):
  ```python
  uvicorn.run(app, host="0.0.0.0", port=8001)  # Change to 8001
  ```
- Update frontend `vite.config.js` to point to new port

### Problem: "Port 3000 already in use" (Frontend)

**Solution:**
- Close the application using port 3000, or
- Vite will automatically try the next available port (3001, 3002, etc.)
- Check the terminal output for the actual port number

### Problem: "Model file not found" error

**Solution:**
- Make sure `rf_dengue_model.pkl` exists in the project root (not in backend folder)
- If missing, train the model:
  ```bash
  python train_model.py
  ```

### Problem: CORS errors in browser console

**Solution:**
- Make sure backend is running on port 8000
- Make sure frontend is running on port 3000
- Check that `backend/app.py` has CORS configured (it should allow all origins by default)

### Problem: Frontend can't connect to backend

**Solution:**
1. Verify backend is running (check http://localhost:8000/docs)
2. Check `frontend/vite.config.js` proxy settings point to `http://localhost:8000`
3. Make sure both servers are running simultaneously

---

## 📝 Quick Reference

### Backend Commands
```bash
# Setup (one time)
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Start (every time)
cd backend
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate     # Windows
python app.py
```

### Frontend Commands
```bash
# Setup (one time)
cd frontend
npm install

# Start (every time)
cd frontend
npm run dev
```

### URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎯 Summary Checklist

Before starting, ensure:
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Project files copied to new computer
- [ ] `rf_dengue_model.pkl` exists in project root
- [ ] Backend virtual environment created and activated
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Two terminal windows ready (one for backend, one for frontend)

To start:
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Both terminals showing no errors
- [ ] Browser can access both URLs

---

## 💡 Tips

1. **Keep both terminals open** - You need both servers running simultaneously
2. **Check terminal output** - Errors will appear in the terminal windows
3. **Use browser developer tools** - Press F12 to see console errors
4. **Start backend first** - It's helpful to start backend before frontend
5. **Save your work** - The startup scripts will remember your setup

---

## 🆘 Still Having Issues?

1. **Check the README.md** for additional information
2. **Review error messages** in terminal windows carefully
3. **Verify file paths** - Make sure you're in the correct directories
4. **Check Python/Node versions** - Ensure they meet requirements
5. **Try restarting** - Sometimes a simple restart helps

Good luck! 🚀

