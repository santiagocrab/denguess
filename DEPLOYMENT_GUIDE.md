# 🚀 Free Deployment Guide for Denguess

This guide will help you publish your Denguess application for free so the public can access it.

---

## 📋 Overview

You need to deploy **2 parts**:
1. **Frontend** (React/Vite) - Public website
2. **Backend** (FastAPI) - API server

**Recommended Free Hosting:**
- **Frontend**: Vercel or Netlify (easiest)
- **Backend**: Render or Railway (best for Python)

---

## 🎯 Option 1: Vercel (Frontend) + Render (Backend) - RECOMMENDED

### **Step 1: Deploy Backend to Render**

1. **Create Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (free)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Or upload files manually

3. **Configure Backend**
   ```
   Name: denguess-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

4. **Add Environment Variables** (if needed)
   - Go to "Environment" tab
   - Add any required variables

5. **Upload Files**
   - Upload these files to Render:
     - `backend/app.py`
     - `backend/requirements.txt`
     - `rf_dengue_model.pkl` (model file)
     - `barangay_encoder.pkl` (encoder file)
     - `climate.csv` (data file)
     - `dengue_cases.csv` (data file)

6. **Get Backend URL**
   - After deployment, Render gives you a URL like:
   - `https://denguess-backend.onrender.com`
   - **Copy this URL!** You'll need it for the frontend

---

### **Step 2: Update Frontend API URL**

1. **Update API Configuration**
   - Open `frontend/src/services/api.js`
   - Change the API URL to your Render backend URL:
   ```javascript
   const API_URL = 'https://denguess-backend.onrender.com';
   ```

---

### **Step 3: Deploy Frontend to Vercel**

1. **Create Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (free)

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Or drag and drop the `frontend` folder

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Add Environment Variables** (if needed)
   - Go to "Settings" → "Environment Variables"
   - Add `VITE_API_URL` if you use it

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your public URL: `https://denguess.vercel.app`

---

## 🎯 Option 2: Netlify (Frontend) + Railway (Backend)

### **Step 1: Deploy Backend to Railway**

1. **Create Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub (free tier available)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Or upload files

3. **Configure Service**
   - Add a new service
   - Select "Python" template
   - Railway auto-detects FastAPI

4. **Add Files**
   - Upload backend files
   - Railway will auto-install dependencies

5. **Get Backend URL**
   - Railway gives you a URL like:
   - `https://denguess-backend.up.railway.app`

---

### **Step 2: Deploy Frontend to Netlify**

1. **Create Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub (free)

2. **Deploy Site**
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub or drag `frontend` folder

3. **Build Settings**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

4. **Deploy**
   - Click "Deploy site"
   - Get your URL: `https://denguess.netlify.app`

---

## 🔧 Configuration Files Needed

I'll create these files for you:

1. **`vercel.json`** - For Vercel deployment
2. **`netlify.toml`** - For Netlify deployment
3. **`render.yaml`** - For Render backend
4. **`railway.json`** - For Railway backend
5. **`.env.example`** - Environment variables template

---

## 📝 Important Notes

### **Backend Requirements:**
- Must include model files (`.pkl`)
- Must include data files (`.csv`)
- Must have `requirements.txt`
- Must use `$PORT` environment variable

### **Frontend Requirements:**
- Must update API URL to backend
- Must build successfully (`npm run build`)
- Must handle CORS (already configured in backend)

### **File Size Limits:**
- **Vercel**: 100MB per deployment
- **Netlify**: 100MB per deployment
- **Render**: 500MB free tier
- **Railway**: 500MB free tier

### **Free Tier Limits:**
- **Vercel**: Unlimited deployments, 100GB bandwidth
- **Netlify**: 100GB bandwidth, 300 build minutes/month
- **Render**: 750 hours/month (may sleep after inactivity)
- **Railway**: $5 free credit/month

---

## 🚨 Common Issues & Solutions

### **Issue 1: Backend Sleeps (Render)**
- **Problem**: Free tier sleeps after 15 min inactivity
- **Solution**: Use a cron job to ping it, or upgrade to paid

### **Issue 2: CORS Errors**
- **Problem**: Frontend can't access backend
- **Solution**: Backend already has CORS configured, just ensure correct URL

### **Issue 3: Model Files Not Found**
- **Problem**: Backend can't find `.pkl` files
- **Solution**: Make sure all files are in the same directory as `app.py`

### **Issue 4: Build Fails**
- **Problem**: Frontend build errors
- **Solution**: Check `npm run build` works locally first

---

## ✅ Quick Checklist

Before deploying:

- [ ] Backend runs locally (`python app.py`)
- [ ] Frontend builds locally (`npm run build`)
- [ ] API URL updated in frontend
- [ ] All model files included
- [ ] All data files included
- [ ] Environment variables set (if needed)
- [ ] CORS configured (already done)

---

## 🎉 After Deployment

Once deployed:

1. **Test Backend**: Visit `https://your-backend-url.com/docs`
   - Should see FastAPI documentation

2. **Test Frontend**: Visit `https://your-frontend-url.com`
   - Should see your website
   - Try making a prediction

3. **Share Your URL**: Share the frontend URL with the public!

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)

---

## 💡 Pro Tips

1. **Use GitHub**: Connect repos to hosting for auto-deploy
2. **Custom Domain**: All platforms support free custom domains
3. **Environment Variables**: Keep sensitive data in env vars
4. **Monitoring**: Use platform dashboards to monitor usage
5. **Backup**: Keep local copies of all files

---

Good luck with your deployment! 🚀

