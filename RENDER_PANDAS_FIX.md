# 🔧 Fix Render Pandas Build Error

## ❌ Error You're Seeing:
```
error: metadata-generation-failed
× Encountered error while generating package metadata.
-> pandas
```

This is a **Render backend** error, not Vercel!

---

## ✅ Solution: Update Render Build Command

The pandas package needs build tools to compile. Fix it in Render:

### Step 1: Go to Render Dashboard
1. Go to [render.com](https://render.com)
2. Click on your service: **`denguess-backend`**
3. Click **"Settings"** tab

### Step 2: Update Build Command
1. Scroll to **"Build Command"** section
2. **Replace it with:**
   ```bash
   pip install --upgrade pip setuptools wheel && pip install -r backend/requirements.txt
   ```

### Step 3: Check Python Version
1. Scroll to **"Environment Variables"** section
2. Make sure you have:
   - **Key:** `PYTHON_VERSION`
   - **Value:** `3.9.18` (or `3.9.0`)

### Step 4: Save and Redeploy
1. Click **"Save Changes"**
2. Render will automatically redeploy
3. Wait 3-5 minutes

---

## 🎯 Why This Happens

Pandas (and numpy, scikit-learn) need to compile C extensions. The build environment needs:
- Updated pip
- setuptools
- wheel (build tools)

The updated build command installs these first, then your packages.

---

## ✅ After Fix

You should see in logs:
```
Successfully installed pip 25.3.1
Successfully installed setuptools wheel
Collecting pandas...
Successfully installed pandas numpy scikit-learn...
```

---

## 📝 Note

This is your **backend** deployment on Render.
Your **frontend** deployment on Vercel is separate and should work fine once backend is fixed!


