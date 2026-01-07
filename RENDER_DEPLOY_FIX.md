# 🚨 URGENT: Deploy Backend to Render to Fix CORS Errors

## ⚠️ The Problem

Your backend on Render **hasn't been updated** with the new CORS configuration. That's why you're seeing CORS errors.

## ✅ Quick Fix (5 minutes)

### Step 1: Go to Render Dashboard
1. Go to [render.com](https://render.com)
2. Log in to your account
3. Find your backend service: `denguess-backend`

### Step 2: Manual Deploy
1. Click on your backend service
2. Go to **"Manual Deploy"** tab (or click the three dots menu)
3. Select **"Deploy latest commit"**
4. Click **"Deploy"**

### Step 3: Wait for Deployment
- Watch the deployment logs
- Wait for "Live" status (2-3 minutes)
- You'll see: "✅ Your service is live at https://denguess-backend.onrender.com"

### Step 4: Test
1. Visit: `https://denguess-backend.onrender.com/health`
2. Should return: `{"status": "healthy", "model_loaded": true}`
3. Check browser DevTools → Network tab
4. Look for `Access-Control-Allow-Origin: *` header

## 🔍 Verify CORS is Working

Open browser console and run:
```javascript
fetch('https://denguess-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
```

Should work without CORS errors!

## 🎯 What Was Fixed in the Code

1. ✅ CORS middleware added
2. ✅ Explicit CORS headers on all responses
3. ✅ OPTIONS preflight handling
4. ✅ Error handling improved

## ⚡ After Deployment

Once deployed:
- ✅ CORS errors will disappear
- ✅ Frontend will connect to backend
- ✅ Predictions will load
- ✅ Heatmap will work

## 🆘 Still Not Working?

1. **Check Render Logs:**
   - Go to your service → "Logs" tab
   - Look for errors

2. **Check Service Status:**
   - Should be "Live" (green)
   - If "Sleeping", wake it up first

3. **Verify Environment:**
   - Make sure Python version is correct
   - Check if all dependencies installed

4. **Test Backend Directly:**
   - Visit: `https://denguess-backend.onrender.com/`
   - Should see API info

## 📝 Important Notes

- **Render auto-deploy might be disabled** - that's why you need manual deploy
- **Backend might be sleeping** - wake it up by visiting the health endpoint
- **First request after sleep takes 30-60 seconds** - be patient

## ✅ Success Checklist

- [ ] Backend deployed on Render
- [ ] Service status is "Live"
- [ ] Health endpoint returns 200 OK
- [ ] CORS headers present in response
- [ ] Frontend can connect to backend
- [ ] No CORS errors in browser console
