# 🔗 Connect to GitHub - Step by Step

Your local repository is ready! Follow these steps to upload to GitHub.

---

## ✅ What's Already Done

- ✅ Git repository initialized
- ✅ All files added and committed
- ✅ Important files included:
  - Model files (`.pkl`)
  - Data files (`.csv`)
  - Frontend and backend code
  - Configuration files

---

## 🚀 Step 1: Create GitHub Repository

### Option A: Using GitHub Website (Recommended)

1. **Go to GitHub**
   - Visit [https://github.com](https://github.com)
   - Sign in (or create account if needed)

2. **Create New Repository**
   - Click the **"+"** icon (top right) → **"New repository"**
   - Or go to: [https://github.com/new](https://github.com/new)

3. **Repository Settings**
   ```
   Repository name: dengue_rf_model
   Description: AI-Powered Dengue Prediction System
   Visibility: Public (or Private - your choice)
   ⚠️ DO NOT initialize with README, .gitignore, or license
   (We already have these files)
   ```

4. **Click "Create repository"**

5. **Copy the repository URL**
   - You'll see a page with setup instructions
   - Copy the URL - it will look like:
     ```
     https://github.com/yourusername/dengue_rf_model.git
     ```
   - Or if using SSH:
     ```
     git@github.com:yourusername/dengue_rf_model.git
     ```

---

## 🔗 Step 2: Connect Local Repository to GitHub

**Open your terminal** and run these commands:

### Replace `santiagocrab` with your GitHub username

```bash
cd /Users/jamesremegio/Documents/dengue_rf_model

# Add GitHub as remote (use HTTPS)
git remote add origin https://github.com/santiagocrab/denguess.git
# Or use SSH if you have SSH keys set up:
# git remote add origin git@github.com:YOUR_USERNAME/dengue_rf_model.git

# Verify the remote was added
git remote -v
```

---

## 📤 Step 3: Push Files to GitHub

```bash
# Push to GitHub (first time)
git branch -M main
git push -u origin main
```

**If prompted for credentials:**
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)
  - See "GitHub Authentication" section below if needed

---

## ✅ Step 4: Verify Upload

1. **Refresh your GitHub repository page**
2. **You should see all your files:**
   - ✅ `backend/` folder
   - ✅ `frontend/` folder
   - ✅ `rf_dengue_model.pkl`
   - ✅ `barangay_encoder.pkl`
   - ✅ `climate.csv`
   - ✅ `dengue_cases.csv`
   - ✅ All documentation files
   - ✅ Configuration files

---

## 🔐 GitHub Authentication

If you get authentication errors, you need a **Personal Access Token**:

### Create Personal Access Token:

1. Go to GitHub → **Settings** → **Developer settings**
2. Click **"Personal access tokens"** → **"Tokens (classic)"**
3. Click **"Generate new token"** → **"Generate new token (classic)"**
4. **Settings:**
   - **Note**: "Denguess Repository"
   - **Expiration**: Choose your preference (90 days, 1 year, etc.)
   - **Scopes**: Check **`repo`** (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

### Alternative: Use SSH (More Secure)

If you prefer SSH:

1. **Check if you have SSH keys:**
   ```bash
   ls -al ~/.ssh
   ```

2. **If no keys, generate one:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept defaults
   ```

3. **Add SSH key to GitHub:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy the output
   ```
   - Go to GitHub → **Settings** → **SSH and GPG keys**
   - Click **"New SSH key"**
   - Paste the key and save

4. **Use SSH URL for remote:**
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/dengue_rf_model.git
   git push -u origin main
   ```

---

## 🎯 Quick Command Reference

```bash
# Navigate to project
cd /Users/jamesremegio/Documents/dengue_rf_model

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dengue_rf_model.git

# Push to GitHub
git branch -M main
git push -u origin main

# Check remote connection
git remote -v

# View commit history
git log --oneline
```

---

## 🔄 Future Updates

After the initial push, to update GitHub with new changes:

```bash
# Add changed files
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push
```

---

## ✅ Success Checklist

- [ ] GitHub repository created
- [ ] Local repo connected to GitHub
- [ ] Files pushed successfully
- [ ] All files visible on GitHub
- [ ] Can see commit history

---

## 🚀 Next Steps After GitHub Setup

Once your code is on GitHub, you can:

1. **Deploy to Render** (Backend)
   - Connect GitHub repo to Render
   - Auto-deploy on every push

2. **Deploy to Vercel** (Frontend)
   - Connect GitHub repo to Vercel
   - Auto-deploy on every push

3. **Collaborate**
   - Share repository with team
   - Use GitHub Issues for bug tracking
   - Use Pull Requests for code reviews

---

## 🆘 Troubleshooting

### "Repository not found"
- ✅ Check repository name is correct
- ✅ Verify you have access to the repository
- ✅ Make sure repository exists on GitHub

### "Authentication failed"
- ✅ Use Personal Access Token (not password)
- ✅ Or set up SSH keys
- ✅ Check token has `repo` scope

### "Remote origin already exists"
```bash
# Remove existing remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/dengue_rf_model.git
```

### "Large file warning"
- ✅ Your `.pkl` files might be large
- ✅ GitHub allows files up to 100MB
- ✅ If larger, consider Git LFS (Large File Storage)

---

## 📚 Additional Resources

- [GitHub Docs](https://docs.github.com)
- [Git Basics](https://git-scm.com/book)
- [GitHub Authentication](https://docs.github.com/en/authentication)

---

**Your code is ready to go live! 🎉**

After pushing to GitHub, follow `PUBLISH_GUIDE.md` to deploy your website!

