# 🔄 Force Vercel to Rebuild with New Code

## ⚠️ Problem

Vercel is still using old code with 30s timeout. New code has 90s timeout but hasn't been deployed yet.

## ✅ Solution: Force Rebuild

### Method 1: Empty Commit (Easiest)

Run these commands in your terminal:

```bash
cd denguess-main
git commit --allow-empty -m "Force Vercel rebuild - update timeout to 90s"
git push origin main
```

This creates an empty commit that triggers Vercel to rebuild.

### Method 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) → Your project
2. Go to **"Deployments"** tab
3. Find the latest deployment
4. Click the **three dots (⋯)** menu
5. Click **"Redeploy"**
6. Wait 2-3 minutes

### Method 3: Update a File

1. Edit any file (like README.md)
2. Add a space or comment
3. Commit and push:
   ```bash
   git add .
   git commit -m "Trigger Vercel rebuild"
   git push origin main
   ```

## 🔍 Verify New Build

After rebuild, check browser console:
- Should see: `[API] Timeout: 90000 ms`
- Should NOT see: `timeout of 30000ms exceeded`
- Should see: `[API] Base URL: https://denguess-backend.onrender.com`

## ⚡ Quick Fix Command

Just run this:
```bash
git commit --allow-empty -m "Force rebuild" && git push
```
