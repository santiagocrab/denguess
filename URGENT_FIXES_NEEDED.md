# 🚨 URGENT: Two Critical Deployments Needed

## ⚠️ Current Issues

1. **CORS Errors** - Backend on Render hasn't been updated
2. **30s Timeout** - Vercel frontend hasn't deployed new 90s timeout code
3. **Backend Sleeping** - Render free tier puts backend to sleep

## ✅ Solution: Deploy Both Services

### 🔴 STEP 1: Deploy Backend to Render (CRITICAL - Fixes CORS)

**Why:** Backend code has CORS fixes but hasn't been deployed to Render yet.

**Steps:**
1. Go to [render.com](https://render.com) → Login
2. Find your service: `denguess-backend`
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait 2-3 minutes for deployment
5. Verify: Visit `https://denguess-backend.onrender.com/health`
   - Should return: `{"status": "healthy", "model_loaded": true}`
   - Check Network tab → Should see `Access-Control-Allow-Origin: *` header

**Result:** CORS errors will disappear ✅

---

### 🟡 STEP 2: Redeploy Frontend to Vercel (Fixes Timeout)

**Why:** Vercel is still using old code with 30s timeout. New code has 90s timeout.

**Steps:**
1. Go to [vercel.com](https://vercel.com) → Your project
2. Go to **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
   - OR trigger a new deployment by pushing to GitHub
4. Wait 2-3 minutes for build
5. Verify: Check browser console
   - Should see: `[API] Base URL: https://denguess-backend.onrender.com`
   - Timeout errors should stop

**Result:** 90s timeout will be active ✅

---

### 🔵 STEP 3: Wake Up Backend (If Sleeping)

**Why:** Render free tier puts backend to sleep after 15 minutes.

**Steps:**
1. Visit: `https://denguess-backend.onrender.com/health`
2. Wait 30-60 seconds (first request wakes it up)
3. Should return: `{"status": "healthy"}`

**Keep It Awake (Recommended):**
- Use [UptimeRobot.com](https://uptimerobot.com) (free)
- Monitor: `https://denguess-backend.onrender.com/health`
- Interval: 5 minutes
- Keeps backend awake 24/7

---

## 📊 Current Status

| Service | Status | Action Needed |
|---------|--------|---------------|
| Backend Code | ✅ Fixed (on GitHub) | ⚠️ **Deploy to Render** |
| Frontend Code | ✅ Fixed (on GitHub) | ⚠️ **Redeploy to Vercel** |
| CORS Config | ✅ Fixed | ⚠️ **Deploy backend** |
| Timeout | ✅ Fixed (90s) | ⚠️ **Redeploy frontend** |

---

## 🎯 After Both Deployments

✅ CORS errors will stop  
✅ Timeout errors will stop  
✅ Backend will respond  
✅ Predictions will load  
✅ Heatmap will work  
✅ No more "Unknown" predictions  

---

## 🔍 Verify Everything Works

1. **Backend Health:**
   ```
   https://denguess-backend.onrender.com/health
   ```
   Should return: `{"status": "healthy", "model_loaded": true}`

2. **CORS Headers:**
   - Open browser DevTools → Network tab
   - Make a request to backend
   - Check response headers
   - Should see: `Access-Control-Allow-Origin: *`

3. **Frontend Console:**
   - Should see: `[API] Base URL: https://denguess-backend.onrender.com`
   - Should see: `[API] Environment: Production`
   - No CORS errors
   - No timeout errors (or 90s timeout, not 30s)

---

## ⚡ Quick Checklist

- [ ] Deploy backend to Render (Manual Deploy → Latest commit)
- [ ] Redeploy frontend to Vercel (Redeploy latest)
- [ ] Wake up backend (visit health endpoint)
- [ ] Set up UptimeRobot (optional but recommended)
- [ ] Test frontend - should work now!

---

## 🆘 Still Having Issues?

1. **Check Render Logs:**
   - Render dashboard → Your service → Logs tab
   - Look for errors

2. **Check Vercel Logs:**
   - Vercel dashboard → Your project → Deployments → Click deployment → Logs
   - Look for build errors

3. **Check Browser Console:**
   - F12 → Console tab
   - Look for specific error messages

4. **Verify Environment Variables:**
   - Vercel → Settings → Environment Variables
   - Should have: `VITE_API_URL` = `https://denguess-backend.onrender.com`

---

## 📝 Summary

**The code is fixed and on GitHub.**  
**You just need to deploy it to both services.**

1. **Render** - Deploy backend (fixes CORS)
2. **Vercel** - Redeploy frontend (fixes timeout)
3. **Wake backend** - Visit health endpoint
4. **Done!** - Everything should work
