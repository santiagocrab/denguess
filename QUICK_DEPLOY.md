# ⚡ Quick Deployment Steps

## 🎯 Easiest Method: Vercel + Render (Recommended)

### **1. Deploy Backend (5 minutes)**

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repo OR upload files manually
4. Configure:
   - **Name**: `denguess-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Upload these files to Render:
   ```
   backend/app.py
   backend/requirements.txt
   rf_dengue_model.pkl
   barangay_encoder.pkl
   climate.csv
   dengue_cases.csv
   ```
6. Click "Create Web Service"
7. **Copy your backend URL** (e.g., `https://denguess-backend.onrender.com`)

---

### **2. Update Frontend API URL**

1. Open `frontend/src/services/api.js`
2. Change line 3 to your backend URL:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://denguess-backend.onrender.com'
   ```
   OR create a `.env` file in `frontend/`:
   ```
   VITE_API_URL=https://denguess-backend.onrender.com
   ```

---

### **3. Deploy Frontend (3 minutes)**

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repo OR drag `frontend` folder
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable (if using .env):
   - Key: `VITE_API_URL`
   - Value: `https://denguess-backend.onrender.com`
6. Click "Deploy"
7. **Copy your frontend URL** (e.g., `https://denguess.vercel.app`)

---

## ✅ Done!

Your website is now live at your Vercel URL!

**Test it:**
- Visit your frontend URL
- Try making a prediction
- Check if it connects to backend

---

## 🔧 Alternative: Netlify (Frontend)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `frontend` folder
3. Configure build:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variable: `VITE_API_URL`
5. Deploy!

---

## 📝 Important Notes

- **Backend may sleep** on Render free tier (wakes up on first request)
- **First request** might be slow (cold start)
- **Model files** must be in the same directory as `app.py` on Render
- **CORS** is already configured in backend

---

## 🆘 Troubleshooting

**Backend not working?**
- Check Render logs
- Make sure all files are uploaded
- Verify `requirements.txt` is correct

**Frontend can't connect?**
- Check API URL is correct
- Verify CORS is enabled (already done)
- Check browser console for errors

**Build fails?**
- Run `npm run build` locally first
- Check for errors in build logs
- Make sure all dependencies are in `package.json`

---

## 🎉 Share Your Site!

Once deployed, share your frontend URL with the public!

Example: `https://denguess.vercel.app`

