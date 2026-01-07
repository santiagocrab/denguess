# 🔧 Render Deployment Fix Guide

## 🚨 Common Deployment Failures & Solutions

### Issue 1: "Module not found" or Import Errors

**Solution:**
1. Check `backend/requirements.txt` has all dependencies
2. Make sure Python version matches (3.9.18)
3. Verify all imports are correct

### Issue 2: "Model file not found"

**Solution:**
The backend looks for model files in the **root directory** (parent of backend/):
- `rf_dengue_model.pkl` - Must be in root
- `barangay_encoder.pkl` - Must be in root  
- `climate.csv` - Must be in root

**To fix:**
1. Make sure these files are in your GitHub repo root
2. Check: `https://github.com/santiagocrab/denguess`
3. If missing, add them:
   ```bash
   git add rf_dengue_model.pkl barangay_encoder.pkl climate.csv
   git commit -m "Add model files"
   git push origin main
   ```

### Issue 3: Build Command Fails

**Current build command:**
```bash
pip install --upgrade pip setuptools wheel && pip install -r backend/requirements.txt
```

**If it fails, try:**
```bash
cd backend && pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
```

### Issue 4: Start Command Fails

**Current start command:**
```bash
cd backend && python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Alternative if it fails:**
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Issue 5: Python Version Mismatch

**Check Render Settings:**
1. Go to Render dashboard → Your service
2. Settings → Environment
3. Make sure Python version is set to **3.9.18** or **3.9**

### Issue 6: Syntax Errors

**Check logs:**
1. Go to Render dashboard → Your service
2. Click "Logs" tab
3. Look for error messages
4. Common errors:
   - Missing imports
   - Syntax errors
   - Indentation errors

## 🔍 How to Check Deployment Logs

1. Go to [render.com](https://render.com) → Your service
2. Click **"Logs"** tab
3. Look for:
   - **Build logs** (during deployment)
   - **Runtime logs** (after deployment)
4. Look for error messages in red

## ✅ Step-by-Step Fix

### Step 1: Check Render Logs
1. Go to Render dashboard
2. Click on `denguess-backend` service
3. Click **"Logs"** tab
4. Scroll to see the error message
5. **Copy the error message** - this tells us what's wrong

### Step 2: Common Fixes

**If error says "No module named X":**
- Add missing package to `backend/requirements.txt`
- Redeploy

**If error says "File not found":**
- Make sure model files are in GitHub repo root
- Check file paths in `app.py`

**If error says "Syntax error":**
- Check the line number mentioned
- Fix the syntax error
- Push to GitHub

**If error says "Port already in use":**
- Make sure start command uses `$PORT` variable
- Should be: `--port $PORT`

### Step 3: Manual Deploy After Fix

1. Fix the issue locally
2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Fix deployment issue"
   git push origin main
   ```
3. Go to Render → Manual Deploy → Deploy latest commit

## 🆘 Still Failing?

**Share the error message from Render logs and I'll help fix it!**

Common things to check:
- [ ] All model files in GitHub repo root
- [ ] `requirements.txt` has all dependencies
- [ ] Python version matches (3.9.18)
- [ ] Build command is correct
- [ ] Start command is correct
- [ ] No syntax errors in `app.py`
