# ⚡ Quick Deployment Reference Card

## 🎯 One-Page Deployment Cheat Sheet

### Backend (Render.com)
```
URL: https://render.com
Service Type: Web Service
Environment: Python 3
Build: pip install -r backend/requirements.txt
Start: cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Required Files in Root:**
- ✅ `rf_dengue_model.pkl`
- ✅ `barangay_encoder.pkl`
- ✅ `climate.csv`
- ✅ `dengue_cases.csv`

**Test:** `https://your-backend.onrender.com/docs`

---

### Frontend (Vercel.com)
```
URL: https://vercel.com
Framework: Vite
Root: frontend
Build: npm run build
Output: dist
```

**Environment Variable:**
```
VITE_API_URL=https://your-backend.onrender.com
```

**Test:** Visit your Vercel URL

---

## 📝 5-Minute Checklist

### Before Deploying
- [ ] Backend runs locally: `python backend/app.py`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] All model files exist in root directory

### Deploy Backend
- [ ] Create Render account
- [ ] Create Web Service
- [ ] Set build/start commands
- [ ] Upload files (or connect GitHub)
- [ ] Copy backend URL

### Deploy Frontend
- [ ] Update API URL in `api.js` or `.env`
- [ ] Create Vercel account
- [ ] Import project
- [ ] Set environment variable
- [ ] Deploy

### After Deploying
- [ ] Test backend at `/docs`
- [ ] Test frontend URL
- [ ] Make a prediction
- [ ] Check browser console (no errors)

---

## 🔗 Important URLs

After deployment, you'll have:
- **Backend API:** `https://your-backend.onrender.com`
- **API Docs:** `https://your-backend.onrender.com/docs`
- **Frontend:** `https://your-app.vercel.app`

---

## 🆘 Quick Fixes

**Backend not working?**
→ Check Render logs
→ Verify files are in root directory
→ Wait 2-3 minutes for first deployment

**Frontend can't connect?**
→ Check API URL is correct
→ Verify backend is accessible at `/docs`
→ Check browser console for CORS errors

**Build fails?**
→ Test locally first: `npm run build`
→ Check for missing dependencies
→ Review build logs

---

## 📚 Full Guides

- `PUBLISH_GUIDE.md` - Step-by-step instructions
- `DEPLOYMENT_GUIDE.md` - Detailed guide
- `QUICK_DEPLOY.md` - Quick reference
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist

---

**Ready to deploy? Start with `PUBLISH_GUIDE.md`! 🚀**

