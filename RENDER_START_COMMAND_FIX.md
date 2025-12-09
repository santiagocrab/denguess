# 🔧 Fix: "Could not import module app" Error

## ❌ Error:
```
ERROR: Error loading ASGI app. Could not import module "app".
```

## ✅ Solution: Update Start Command in Render

The start command needs to be set correctly in Render dashboard.

### Step 1: Go to Render Settings
1. Go to [render.com](https://render.com)
2. Click your service: **`denguess-backend`**
3. Click **"Settings"** tab

### Step 2: Update Start Command
1. Scroll to **"Start Command"** section
2. **Replace it with one of these options:**

**Option A (Recommended):**
```bash
cd backend && python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Option B (Alternative):**
```bash
cd backend && PYTHONPATH=/opt/render/project/src:$PYTHONPATH uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Option C (If above don't work):**
```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

### Step 3: Save and Redeploy
1. Click **"Save Changes"**
2. Render will automatically redeploy
3. Wait 2-3 minutes

---

## 🎯 Why This Happens

The error occurs because:
- uvicorn can't find the `app` module
- The working directory might not be set correctly
- Python path might not include the backend directory

Using `python -m uvicorn` ensures Python finds the module correctly.

---

## ✅ Complete Settings Checklist

**Build Command:**
```bash
pip install --upgrade pip setuptools wheel && pip install -r backend/requirements.txt
```

**Start Command:**
```bash
cd backend && python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Root Directory:**
- Leave **empty** (blank)

**Environment Variables:**
- `PYTHON_VERSION` = `3.9.18`

---

## 🆘 If Still Not Working

Try Option C (without `cd backend`):
```bash
python -m uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

This runs from the root directory and imports `backend.app`.

---

## ✅ After Fix

You should see in logs:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

Your backend should then be live! 🎉


