# Vercel Deployment Guide for On Mind

## 🚀 Quick Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository: `smdmslam/onMindSep20b`

### 2. Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables
**No environment variables needed!** Your Firebase config is hardcoded in `firebase.ts`.

### 4. Deploy
Click "Deploy" and wait for the build to complete.

## 🔧 Project Configuration

### Firebase Configuration
- ✅ Firebase config is embedded in `src/lib/firebase.ts`
- ✅ No API keys exposed in environment variables
- ✅ Google OAuth configured for production domain

### Build Optimization
- ✅ Vercel config in `vercel.json`
- ✅ SPA routing configured
- ✅ Build process tested locally

### Security
- ✅ Firestore rules configured
- ✅ User authentication working
- ✅ All data properly secured

## 🌐 Production URLs

After deployment, update your Firebase OAuth settings:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `onmindsep20`
3. Go to Authentication → Sign-in method → Google
4. Add your Vercel domain to authorized domains:
   - `your-app-name.vercel.app`
   - `your-app-name-git-main-smdmslam.vercel.app`

## 📊 Performance Notes

- Bundle size: ~1.4MB (consider code splitting for optimization)
- Firebase client-side bundle included
- All dependencies optimized for production

## 🔄 Continuous Deployment

Once connected, every push to `main` branch will automatically deploy to Vercel.

