# ✅ Deployment Checklist

Use this checklist before deploying your Denguess application.

## 📦 Pre-Deployment

### Backend Files
- [ ] `backend/app.py` - Main API file
- [ ] `backend/requirements.txt` - Python dependencies
- [ ] `rf_dengue_model.pkl` - Trained model (must be in root or backend/)
- [ ] `barangay_encoder.pkl` - Barangay encoder (must be in root or backend/)
- [ ] `climate.csv` - Climate data
- [ ] `dengue_cases.csv` - Dengue cases data

### Frontend Files
- [ ] `frontend/package.json` - Node dependencies
- [ ] `frontend/src/` - All source files
- [ ] `frontend/index.html` - Entry point
- [ ] `frontend/vite.config.js` - Vite configuration

### Configuration Files
- [ ] `vercel.json` - For Vercel deployment
- [ ] `netlify.toml` - For Netlify deployment
- [ ] `render.yaml` - For Render backend
- [ ] `.gitignore` - Git ignore rules

---

## 🔧 Configuration

### Backend
- [ ] CORS configured (already done - allows all origins)
- [ ] Model path correct (uses `Path(__file__).parent.parent`)
- [ ] Port uses `$PORT` environment variable (for Render/Railway)
- [ ] All dependencies in `requirements.txt`

### Frontend
- [ ] API URL updated in `api.js` or `.env` file
- [ ] Build command works: `npm run build`
- [ ] All dependencies in `package.json`
- [ ] Environment variables set (if using)

---

## 🧪 Testing

### Local Testing
- [ ] Backend runs: `python backend/app.py`
- [ ] Backend accessible: `http://localhost:8000/docs`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Frontend runs: `npm run dev`
- [ ] Frontend connects to backend
- [ ] Predictions work
- [ ] All pages load correctly

---

## 🚀 Deployment Steps

### Backend (Render)
- [ ] Account created on Render
- [ ] New Web Service created
- [ ] All backend files uploaded
- [ ] Build command set: `pip install -r backend/requirements.txt`
- [ ] Start command set: `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
- [ ] Backend URL copied (e.g., `https://denguess-backend.onrender.com`)
- [ ] Backend accessible at `/docs` endpoint

### Frontend (Vercel/Netlify)
- [ ] Account created on Vercel/Netlify
- [ ] Project created
- [ ] API URL updated in frontend code or environment variables
- [ ] Build settings configured
- [ ] Environment variables set (if using)
- [ ] Deployment successful
- [ ] Frontend URL copied

---

## ✅ Post-Deployment

### Testing
- [ ] Frontend loads correctly
- [ ] Can navigate between pages
- [ ] API calls work (check browser console)
- [ ] Predictions work
- [ ] Map displays correctly
- [ ] All features functional

### Security
- [ ] CORS configured properly (consider restricting origins)
- [ ] No sensitive data in code
- [ ] Environment variables used for secrets

### Performance
- [ ] Pages load quickly
- [ ] API responses are fast
- [ ] No console errors

---

## 📝 Notes

- **Render free tier**: May sleep after 15 min inactivity (wakes on first request)
- **First request**: May be slow due to cold start
- **File paths**: Make sure model files are accessible from backend directory
- **CORS**: Currently allows all origins - consider restricting for production

---

## 🆘 If Something Goes Wrong

1. **Check logs** on your hosting platform
2. **Test locally** first to isolate issues
3. **Verify file paths** are correct
4. **Check environment variables** are set
5. **Review CORS settings** if API calls fail
6. **Check browser console** for frontend errors

---

## 🎉 Success!

Once everything is checked and working:
- [ ] Share your frontend URL
- [ ] Test from different devices
- [ ] Monitor for any issues
- [ ] Consider adding custom domain

---

**Your site is live! 🚀**

