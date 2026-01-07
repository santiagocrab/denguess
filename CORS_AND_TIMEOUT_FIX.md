# 🔧 CORS and Timeout Fix Guide

## ✅ CORS Configuration Fixed

The CORS middleware has been updated to:
- Allow all origins (`*`)
- Include all necessary HTTP methods
- Add proper headers for preflight requests
- Cache preflight requests for 1 hour

## ⚠️ Main Issue: Backend Timeouts

The errors show your backend on Render is **timing out**:
- `timeout of 60000ms exceeded`
- `timeout of 5000ms exceeded`

This happens because:
1. **Render Free Tier**: Backend goes to sleep after 15 minutes of inactivity
2. **Cold Start**: First request after sleep takes 30-60 seconds to wake up
3. **Model Loading**: Loading the ML model takes time on first request

## 🚀 Solutions

### Option 1: Keep Backend Awake (Recommended)

Use a service like **UptimeRobot** (free) to ping your backend every 5 minutes:

1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Create a free account
3. Add a new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://denguess-backend.onrender.com/health`
   - **Interval**: 5 minutes
4. This keeps your backend awake 24/7

### Option 2: Upgrade Render Plan

Upgrade to Render's **Starter Plan** ($7/month):
- Backend stays awake 24/7
- No cold starts
- Faster response times

### Option 3: Optimize Model Loading

The backend now preloads the model at startup, but you can also:
- Use a smaller model file
- Optimize the model loading process
- Add model caching

## 🔍 Verify Backend is Working

1. **Check Backend Health:**
   ```
   https://denguess-backend.onrender.com/health
   ```
   Should return: `{"status": "healthy", "model_loaded": true}`

2. **Check Backend Root:**
   ```
   https://denguess-backend.onrender.com/
   ```
   Should return API info

3. **Test from Browser:**
   Open the URLs above in your browser to see if they respond

## 📝 Environment Variable Check

Make sure in **Vercel** you have:
- **Key**: `VITE_API_URL`
- **Value**: `https://denguess-backend.onrender.com`
- **Environment**: All (Production, Preview, Development)

## 🎯 Quick Fix Steps

1. **Wake up your backend:**
   - Visit: `https://denguess-backend.onrender.com/health`
   - Wait 30-60 seconds for it to wake up
   - Refresh your Vercel frontend

2. **Set up UptimeRobot:**
   - Keeps backend awake automatically
   - Free forever
   - Takes 2 minutes to set up

3. **Redeploy Backend (if needed):**
   - Go to Render dashboard
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete

## ✅ After Fixing

Once the backend is awake and responding:
- CORS errors will disappear
- Timeout errors will stop
- Predictions will load normally
- Heatmap will show valid risks (Low/Moderate/High)

## 🆘 Still Having Issues?

1. **Check Render Logs:**
   - Go to Render dashboard
   - Click on your backend service
   - Check "Logs" tab for errors

2. **Check Backend Status:**
   - Render dashboard shows if service is "Live" or "Sleeping"
   - If sleeping, wake it up by visiting the health endpoint

3. **Verify CORS:**
   - Open browser DevTools (F12)
   - Check Network tab
   - Look for CORS headers in response

## 📊 Expected Behavior

**After Backend Wakes Up:**
- Health check: < 1 second
- Predictions: 2-5 seconds
- No CORS errors
- No timeout errors

**If Backend is Sleeping:**
- First request: 30-60 seconds (wake up time)
- Subsequent requests: < 5 seconds
- Use UptimeRobot to prevent sleep
