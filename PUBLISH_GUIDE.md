# 🚀 Step-by-Step Website Publishing Guide

Follow these steps to publish your Denguess website for free!

---

## 📋 Quick Overview

You need to deploy **2 parts**:
1. **Backend** (FastAPI) → Render.com (free)
2. **Frontend** (React) → Vercel.com (free)

**Total time: ~15 minutes**

---

## 🎯 Part 1: Deploy Backend to Render (5-10 minutes)

### Step 1: Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended) or email

### Step 2: Create New Web Service
1. In your Render dashboard, click **"New +"** → **"Web Service"**
2. **Option A: Connect GitHub** (Recommended)
   - Click **"Connect GitHub"**
   - Authorize Render
   - Select your repository: `dengue_rf_model`
   - Click **"Connect"**
   
   **Option B: Manual Upload**
   - Click **"Public Git repository"**
   - Enter your repo URL
   - Or use **"Manual Deploy"** to upload files

### Step 3: Configure Backend Settings
Fill in these settings:

```
Name: denguess-backend
Environment: Python 3
Region: Choose closest to you
Branch: main (or master)
Root Directory: (leave empty)
```

**Build Command:**
```bash
pip install -r backend/requirements.txt
```

**Start Command:**
```bash
cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Step 4: Important - File Structure
Make sure Render can access these files. The backend expects:
- `rf_dengue_model.pkl` (in root directory)
- `barangay_encoder.pkl` (in root directory)
- `climate.csv` (in root directory)
- `dengue_cases.csv` (in root directory)

**If using GitHub**: These files should already be in your repo.

**If manual upload**: Upload these files to the root of your Render service.

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. **Copy your backend URL** - it will look like:
   ```
   https://denguess-backend.onrender.com
   ```
   ⚠️ **SAVE THIS URL!** You'll need it for the frontend.

### Step 6: Test Backend
1. Visit: `https://your-backend-url.onrender.com/docs`
2. You should see the FastAPI documentation page
3. If you see it, backend is working! ✅

---

## 🎯 Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Update API URL
Before deploying, update the frontend to use your backend URL.

**Option A: Update code directly**
1. Open `frontend/src/services/api.js`
2. Change line 3 to:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.onrender.com'
   ```
   (Replace `your-backend-url` with your actual Render URL)

**Option B: Use environment variable** (Recommended)
1. Create file: `frontend/.env.production`
2. Add this line:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   (Replace with your actual backend URL)

### Step 2: Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with **GitHub** (recommended)

### Step 3: Import Project
1. Click **"Add New..."** → **"Project"**
2. **Option A: Import from GitHub**
   - Find your repository: `dengue_rf_model`
   - Click **"Import"**
   
   **Option B: Deploy manually**
   - Click **"Browse"** and select your `frontend` folder
   - Or drag and drop the `frontend` folder

### Step 4: Configure Build Settings
Vercel should auto-detect Vite, but verify these settings:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 5: Add Environment Variable (if using .env)
1. In Vercel project settings, go to **"Environment Variables"**
2. Click **"Add"**
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com`
   - **Environment**: Production, Preview, Development (check all)

### Step 6: Deploy
1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. **Copy your frontend URL** - it will look like:
   ```
   https://denguess.vercel.app
   ```
   🎉 **This is your live website!**

---

## ✅ Part 3: Test Your Live Website

1. **Visit your frontend URL**
   - Example: `https://denguess.vercel.app`

2. **Test the features:**
   - ✅ Homepage loads
   - ✅ Can navigate to different pages
   - ✅ Try making a prediction
   - ✅ Check if it connects to backend
   - ✅ Map displays correctly

3. **Check browser console** (F12)
   - Should see no errors
   - API calls should succeed

4. **If something doesn't work:**
   - Check the troubleshooting section below

---

## 🔧 Troubleshooting

### Backend Issues

**Problem: Backend not accessible**
- ✅ Check Render logs (in Render dashboard)
- ✅ Verify all files are uploaded
- ✅ Check `requirements.txt` is correct
- ✅ Wait a few minutes (first deployment takes time)

**Problem: Model not found**
- ✅ Make sure `rf_dengue_model.pkl` is in root directory
- ✅ Check file paths in `app.py` are correct
- ✅ Verify files are committed to Git (if using GitHub)

**Problem: Backend sleeps**
- ✅ Render free tier sleeps after 15 min inactivity
- ✅ First request after sleep takes 30-60 seconds
- ✅ This is normal for free tier

### Frontend Issues

**Problem: Can't connect to backend**
- ✅ Check API URL is correct in `api.js` or `.env`
- ✅ Verify backend URL is accessible (visit `/docs`)
- ✅ Check CORS is enabled (already configured)
- ✅ Check browser console for errors

**Problem: Build fails**
- ✅ Run `npm run build` locally first
- ✅ Check for errors in build logs
- ✅ Verify all dependencies in `package.json`
- ✅ Make sure Node version is 18+ (Vercel auto-handles this)

**Problem: 404 errors on routes**
- ✅ Check `vercel.json` or `netlify.toml` has redirect rules
- ✅ Should redirect all routes to `index.html`

---

## 📝 Important Notes

### Free Tier Limitations

**Render (Backend):**
- ⏰ May sleep after 15 min inactivity
- 🐌 First request after sleep is slow (30-60s)
- 💾 500MB storage limit
- ⏱️ 750 hours/month free

**Vercel (Frontend):**
- ✅ No sleep (always on)
- ✅ Fast CDN
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments

### Security Notes

- 🔒 CORS is currently set to allow all origins (`*`)
- 🔒 For production, consider restricting to your frontend domain
- 🔒 No sensitive data should be in code
- 🔒 Use environment variables for secrets

---

## 🎉 Success Checklist

- [ ] Backend deployed and accessible at `/docs`
- [ ] Frontend deployed and accessible
- [ ] Frontend can connect to backend
- [ ] Predictions work
- [ ] All pages load correctly
- [ ] No console errors
- [ ] Website is fast and responsive

---

## 🌐 Custom Domain (Optional)

Both Render and Vercel support free custom domains:

**Vercel:**
1. Go to project settings → Domains
2. Add your domain
3. Follow DNS instructions

**Render:**
1. Go to service settings → Custom Domain
2. Add your domain
3. Update DNS records

---

## 📞 Need Help?

1. **Check logs** on your hosting platform
2. **Test locally** first to isolate issues
3. **Review** the deployment guides:
   - `DEPLOYMENT_GUIDE.md` - Detailed guide
   - `QUICK_DEPLOY.md` - Quick reference
   - `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist

---

## 🚀 You're Done!

Your website is now live! Share your frontend URL with the world!

**Example URLs:**
- Frontend: `https://denguess.vercel.app`
- Backend API: `https://denguess-backend.onrender.com`
- API Docs: `https://denguess-backend.onrender.com/docs`

---

**Happy Deploying! 🎊**

