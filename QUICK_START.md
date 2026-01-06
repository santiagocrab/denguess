# Quick Start Reference

## 🚀 Fastest Way to Start (First Time Setup)

### ⚠️ IMPORTANT: Replace the path below with YOUR actual project location!

**How to find your project path:**
1. Open File Explorer
2. Navigate to where you saved the `dengue_rf_model` folder
3. Click in the address bar at the top
4. Copy the full path (e.g., `C:\Users\YourName\Documents\dengue_rf_model`)

### Windows:
```cmd
# Terminal 1 - Backend
# REPLACE the path below with YOUR actual path!
cd C:\Users\YourName\Documents\dengue_rf_model
start_backend.bat

# Terminal 2 - Frontend (open new terminal)
# REPLACE the path below with YOUR actual path!
cd C:\Users\YourName\Documents\dengue_rf_model
start_frontend.bat
```

**Example (if your project is on Desktop):**
```cmd
cd C:\Users\YourName\Desktop\dengue_rf_model
start_backend.bat
```

### Mac/Linux:
```bash
# Terminal 1 - Backend
# REPLACE the path below with YOUR actual path!
cd /Users/YourName/Documents/dengue_rf_model
chmod +x start_backend.sh start_frontend.sh  # First time only
./start_backend.sh

# Terminal 2 - Frontend (open new terminal)
# REPLACE the path below with YOUR actual path!
cd /Users/YourName/Documents/dengue_rf_model
./start_frontend.sh
```

**Example (if your project is in Documents):**
```bash
cd ~/Documents/dengue_rf_model
./start_backend.sh
```

---

## 📍 URLs After Starting

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## ⚙️ Manual Setup (If Scripts Don't Work)

### Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Mac/Linux
# OR
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python app.py
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## ✅ Verify It's Working

1. Open http://localhost:8000/docs → Should show API documentation
2. Open http://localhost:3000 → Should show the website
3. Navigate to a barangay page → Should show predictions

---

## 🔧 Common Issues

| Problem | Solution |
|---------|----------|
| **"The system cannot find the path specified"** | You typed the placeholder path! Replace `path\to\dengue_rf_model` with your actual folder location |
| Python not found | Install Python 3.8+ and add to PATH |
| Node not found | Install Node.js 16+ from nodejs.org |
| Port 8000 in use | Close other app or change port in `app.py` |
| Port 3000 in use | Vite will auto-use next port (3001, 3002...) |
| Module not found | Run `pip install -r requirements.txt` (backend) or `npm install` (frontend) |
| Model not found | Run `python train_model.py` in project root |

---

## 📋 Prerequisites Check

```bash
python --version   # Need 3.8+
node --version     # Need 16+
npm --version      # Should work if node works
```

---

**For detailed instructions, see SETUP_GUIDE.md**

