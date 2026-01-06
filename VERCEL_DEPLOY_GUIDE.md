# 🚀 Complete Step-by-Step Guide: Deploy Frontend to Vercel

Follow these steps exactly to deploy your frontend to Vercel.

---

## 📋 Prerequisites

Before starting, make sure:
- ✅ Your backend is deployed on Render (or at least deploying)
- ✅ Your backend URL: `https://denguess-backend.onrender.com`
- ✅ Your code is pushed to GitHub: `santiagocrab/denguess`

---

## 🎯 Step 1: Create Vercel Account

1. **Go to Vercel**
   - Visit: [https://vercel.com](https://vercel.com)
   - Click **"Sign Up"** (top right)

2. **Sign Up with GitHub** (Recommended)
   - Click **"Continue with GitHub"**
   - Authorize Vercel to access your GitHub account
   - This allows automatic deployments

3. **Complete Setup**
   - Follow any on-screen prompts
   - You'll be taken to the Vercel dashboard

---

## 🎯 Step 2: Create New Project

1. **In Vercel Dashboard**
   - Click **"Add New..."** button (top right)
   - Select **"Project"** from the dropdown

2. **Import Repository**
   - You'll see a list of your GitHub repositories
   - Find: **`denguess`** (or `santiagocrab/denguess`)
   - Click **"Import"** next to it

---

## 🎯 Step 3: Configure Project Settings

After clicking Import, you'll see the **"Configure Project"** page. Here's what to fill:

### **Project Name**
- **What to put:** `denguess` (or leave default)
- **Where:** Top of the page
- **Note:** This will be part of your URL

### **Framework Preset**
- **What to put:** `Vite` (should auto-detect)
- **Where:** Under "Framework Preset" dropdown
- **Note:** If it doesn't auto-detect, select "Vite" manually

### **Root Directory**
- **What to put:** `frontend`
- **Where:** Click "Edit" next to Root Directory
- **Important:** This tells Vercel where your frontend code is
- **How to set:**
  1. Click the folder icon or "Edit" button
  2. Type: `frontend`
  3. Or click to browse and select the `frontend` folder

### **Build and Output Settings**
These should auto-detect, but verify:

**Build Command:**
- **What to put:** `npm run build`
- **Where:** Under "Build and Output Settings"
- **Note:** Should auto-fill

**Output Directory:**
- **What to put:** `dist`
- **Where:** Under "Build and Output Settings"
- **Note:** Should auto-fill

**Install Command:**
- **What to put:** `npm install`
- **Where:** Under "Build and Output Settings"
- **Note:** Should auto-fill

---

## 🎯 Step 4: Add Environment Variables (Important!)

This connects your frontend to your backend.

1. **Find Environment Variables Section**
   - Scroll down on the Configure Project page
   - Look for **"Environment Variables"** section

2. **Add New Variable**
   - Click **"Add"** or **"Add Environment Variable"**

3. **Fill in the Variable:**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://denguess-backend.onrender.com`
   - **Environment:** Check all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

4. **Save Variable**
   - Click **"Add"** or **"Save"**

---

## 🎯 Step 5: Deploy!

1. **Review Settings**
   - Make sure everything looks correct:
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Environment Variable: `VITE_API_URL` = `https://denguess-backend.onrender.com`

2. **Click Deploy**
   - Scroll to bottom of page
   - Click the big **"Deploy"** button

3. **Wait for Build**
   - Vercel will start building your project
   - You'll see build logs in real-time
   - This takes 2-3 minutes

---

## 🎯 Step 6: Wait for Deployment

1. **Watch the Build Logs**
   - You'll see progress like:
     ```
     Installing dependencies...
     Building...
     Uploading...
     ```

2. **Build Complete**
   - When done, you'll see: **"Congratulations! Your project has been deployed"**

3. **Get Your URL**
   - Vercel will show you your live URL
   - It will look like: `https://denguess.vercel.app`
   - **Copy this URL!** 🎉

---

## ✅ Step 7: Test Your Website

1. **Visit Your URL**
   - Go to: `https://denguess.vercel.app` (or your custom URL)
   - Your website should load!

2. **Test Features**
   - ✅ Homepage loads
   - ✅ Can navigate to different pages
   - ✅ Try making a prediction
   - ✅ Check if it connects to backend

3. **Check Browser Console** (Optional)
   - Press `F12` to open developer tools
   - Go to "Console" tab
   - Should see no errors
   - API calls should succeed

---

## 🎯 Complete Settings Summary

Here's everything in one place:

```
Project Name: denguess
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install

Environment Variables:
  VITE_API_URL = https://denguess-backend.onrender.com
  (Check: Production, Preview, Development)
```

---

## 🆘 Troubleshooting

### Issue: Build Fails

**Check:**
- ✅ Root Directory is set to `frontend`
- ✅ Build Command is `npm run build`
- ✅ All files are in GitHub

**Solution:**
- Check build logs for specific errors
- Make sure `frontend/package.json` exists
- Verify all dependencies are listed

### Issue: Website Can't Connect to Backend

**Check:**
- ✅ Environment variable `VITE_API_URL` is set
- ✅ Backend URL is correct: `https://denguess-backend.onrender.com`
- ✅ Backend is deployed and working

**Solution:**
- Test backend: Visit `https://denguess-backend.onrender.com/docs`
- If backend works, check environment variable in Vercel
- Redeploy frontend after fixing

### Issue: 404 Errors on Routes

**Check:**
- ✅ `vercel.json` file exists (it does in your repo)
- ✅ Output Directory is `dist`

**Solution:**
- Vercel should auto-handle routing with `vercel.json`
- If not, check Vercel project settings

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Frontend URL:** `https://denguess.vercel.app`
- ✅ **Backend URL:** `https://denguess-backend.onrender.com`
- ✅ **Full website live!**

---

## 📝 Next Steps

1. **Share Your URL**
   - Share your Vercel URL with others
   - Your website is now public!

2. **Custom Domain** (Optional)
   - Go to Vercel project → Settings → Domains
   - Add your custom domain

3. **Monitor**
   - Check Vercel dashboard for analytics
   - Monitor deployments

---

## 🔄 Future Updates

To update your website:
1. Make changes locally
2. Push to GitHub: `git push origin main`
3. Vercel automatically redeploys! (takes 2-3 minutes)

---

**Your website is now live! 🚀**


