# Vercel Build Configuration Fix

## Issue
Vercel was trying to run `npm install` in the root directory, but the frontend code is in the `frontend/` subdirectory.

## Solution
Updated `vercel.json` to explicitly specify:
- `installCommand`: Run npm install in the frontend directory
- `buildCommand`: Run npm build in the frontend directory
- `outputDirectory`: Point to frontend/dist

## Alternative Solution (If build still fails)
If the build still fails, you can set the **Root Directory** in Vercel project settings:

1. Go to Vercel Dashboard → Your Project → Settings
2. Under "Build & Development Settings"
3. Set **Root Directory** to: `frontend`
4. Update `vercel.json` to remove the `cd frontend` commands:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [...]
}
```

## Current Configuration
The `vercel.json` now has:
- `installCommand`: `cd frontend && npm install`
- `buildCommand`: `cd frontend && npm run build`
- `outputDirectory`: `frontend/dist`

This should work, but if Vercel still tries to install in root, use the Root Directory method above.
