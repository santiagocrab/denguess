# 📁 How Files Work in Render

## ✅ If You Connected via GitHub (Recommended)

**Your files are ALREADY in Render!** 

When you connect your GitHub repository to Render:
- ✅ Render automatically clones your entire repository
- ✅ All files from your GitHub repo are available
- ✅ Every time you push to GitHub, Render automatically redeploys

### How to Verify Files Are There:

1. Go to your Render dashboard
2. Click on your service (`denguess-backend`)
3. Go to the **"Logs"** tab
4. Look for build logs - you'll see it installing dependencies and accessing files

### How to Update Files:

1. **Make changes locally** (on your computer)
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update files"
   git push origin main
   ```
3. **Render automatically redeploys** (takes 2-3 minutes)

---

## 📤 If You Need to Manually Upload Files

If you didn't connect via GitHub, you can manually upload:

### Method 1: Using Render Dashboard (Limited)

1. Go to your Render service
2. Click **"Settings"** tab
3. Scroll to **"Manual Deploy"** section
4. Upload files (but this is limited - not recommended for full projects)

### Method 2: Connect GitHub (Better)

1. Go to your Render service
2. Click **"Settings"** tab
3. Scroll to **"Source"** section
4. Click **"Connect GitHub"**
5. Select your repository: `santiagocrab/denguess`
6. Render will automatically pull all files

---

## 🔍 Verify Your Files Are in Render

### Check Build Logs:

1. Go to Render dashboard → Your service
2. Click **"Logs"** tab
3. Look for these in the build logs:
   ```
   Installing dependencies...
   Building...
   Starting...
   ```

### Check if Model Files Are Accessible:

Your backend needs these files in the **root directory**:
- ✅ `rf_dengue_model.pkl`
- ✅ `barangay_encoder.pkl`
- ✅ `climate.csv`
- ✅ `dengue_cases.csv`

**If connected via GitHub:** These files are already there (they're in your repo)

**To verify:** Check your GitHub repo at:
`https://github.com/santiagocrab/denguess`

If the files are there, Render has them!

---

## 🚨 Common Issues

### Issue: "Model file not found"

**Solution:**
1. Make sure files are in your GitHub repository root
2. Check GitHub: `https://github.com/santiagocrab/denguess`
3. If files are missing, add them:
   ```bash
   git add rf_dengue_model.pkl barangay_encoder.pkl climate.csv dengue_cases.csv
   git commit -m "Add model and data files"
   git push origin main
   ```
4. Render will automatically redeploy

### Issue: "Files not updating"

**Solution:**
1. Make sure you pushed to GitHub
2. Check Render dashboard → "Events" tab
3. You should see "Deploy started" after pushing
4. Wait 2-3 minutes for deployment

---

## 📝 File Structure in Render

When Render deploys, it sees your repository structure:

```
denguess/ (repository root)
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── data/
├── frontend/
│   └── ...
├── rf_dengue_model.pkl  ← Must be in root
├── barangay_encoder.pkl  ← Must be in root
├── climate.csv           ← Must be in root
└── dengue_cases.csv      ← Must be in root
```

**Important:** Model files must be in the **root directory** (same level as `backend/` folder)

---

## ✅ Quick Checklist

- [ ] Files are in GitHub repository
- [ ] Render is connected to GitHub
- [ ] Build logs show successful deployment
- [ ] Backend URL works: `https://denguess-backend.onrender.com/docs`

---

## 🎯 Summary

**If you connected via GitHub:**
- ✅ Files are automatically synced
- ✅ Push to GitHub = Auto-deploy to Render
- ✅ No manual upload needed

**If you need to add files:**
1. Add files to your local project
2. Push to GitHub
3. Render automatically updates

---

**Your files are already in Render if you connected via GitHub!** 🎉


