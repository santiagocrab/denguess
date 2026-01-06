# 🔧 Fix Render Build Metadata Error

## ❌ Error You're Seeing:
```
error: metadata-generation-failed
× Encountered error while generating package metadata.
```

## ✅ Solution: Update Build Command

This error happens when pip can't build some packages. Fix it by updating the build command in Render.

### Step 1: Go to Render Dashboard
1. Go to [render.com](https://render.com)
2. Click on your service: **`denguess-backend`**
3. Click **"Settings"** tab

### Step 2: Update Build Command
1. Scroll to **"Build Command"** section
2. **Replace the current build command with:**
   ```bash
   pip install --upgrade pip setuptools wheel && pip install -r backend/requirements.txt
   ```
   
   This will:
   - Upgrade pip to the latest version
   - Install build tools (setuptools, wheel)
   - Then install your requirements

### Step 3: Check Python Version
1. Scroll to **"Environment Variables"** section
2. Make sure you have:
   - **Key:** `PYTHON_VERSION`
   - **Value:** `3.9.18` (or `3.9.0` - but 3.9.18 is more stable)

### Step 4: Save and Redeploy
1. Click **"Save Changes"** at the bottom
2. Render will automatically redeploy
3. Wait 3-5 minutes for the build to complete

---

## ✅ Alternative: Simpler Build Command

If the above doesn't work, try this simpler version:

```bash
pip install --upgrade pip && pip install -r backend/requirements.txt
```

---

## 🎯 Complete Settings Checklist

Make sure these are all set correctly:

**Build Command:**
```bash
pip install --upgrade pip setuptools wheel && pip install -r backend/requirements.txt
```

**Start Command:**
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Root Directory:**
- Leave **empty** (blank)

**Environment Variables:**
- `PYTHON_VERSION` = `3.9.18` (or `3.9.0`)

---

## 📝 What This Fixes

The error happens because:
- Some packages (like pandas, numpy, scikit-learn) need to compile C extensions
- Render's build environment might be missing build tools
- Upgrading pip and installing setuptools/wheel fixes this

---

## ✅ After Fix

Once you save and redeploy, you should see in the logs:
```
Successfully installed pip 25.3.1
Successfully installed setuptools wheel
Collecting fastapi...
Successfully installed fastapi uvicorn pandas...
```

Your backend should then build successfully! 🎉


