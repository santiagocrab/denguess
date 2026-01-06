# 🔧 Fix Render Build Error

## ❌ Error You're Seeing:
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

## ✅ Solution: Update Build Command in Render

### Step 1: Go to Render Dashboard
1. Go to [render.com](https://render.com)
2. Sign in
3. Click on your service: **`denguess-backend`**

### Step 2: Go to Settings
1. Click the **"Settings"** tab (top navigation)

### Step 3: Update Build Command
1. Scroll down to **"Build Command"** section
2. **Change it from:**
   ```
   pip install -r requirements.txt
   ```
   
   **To:**
   ```
   pip install -r backend/requirements.txt
   ```

### Step 4: Save and Redeploy
1. Scroll down and click **"Save Changes"**
2. Render will automatically start a new deployment
3. Wait 2-3 minutes for it to complete

---

## ✅ Correct Settings for Render

Make sure these are set correctly:

**Build Command:**
```bash
pip install -r backend/requirements.txt
```

**Start Command:**
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Root Directory:**
- Leave **empty** (blank)

---

## 🎯 Quick Fix Steps

1. **Render Dashboard** → Your service
2. **Settings** tab
3. **Build Command** → Change to: `pip install -r backend/requirements.txt`
4. **Save Changes**
5. **Wait for redeploy** (2-3 minutes)

---

## ✅ After Fix

Once fixed, you should see in the logs:
```
Installing dependencies from backend/requirements.txt...
Successfully installed fastapi uvicorn pandas...
```

Your backend should then work! 🎉


