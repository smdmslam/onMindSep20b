# Google Auth Setup for On Mind

This guide will help you configure Google Authentication to work on both development (`localhost:5173`) and production (`onmind.cc`).

## Step 1: Firebase Console Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `onmindsep20`
3. **Navigate to Authentication**:
   - Click "Authentication" in the left sidebar
   - Go to "Settings" tab
   - Click "Authorized domains"
4. **Add authorized domains**:
   - Click "Add domain"
   - Add: `localhost`
   - Add: `onmind.cc`
   - Add: `onmindsep20.firebaseapp.com` (if not already there)

## Step 2: Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: `onmindsep20`
3. **Navigate to APIs & Services**:
   - Click "APIs & Services" in the left sidebar
   - Click "Credentials"
4. **Find your OAuth 2.0 Client ID**:
   - Look for "Web application" type
   - Click the edit icon (pencil)
5. **Configure Authorized JavaScript origins**:
   - Add: `http://localhost:5173`
   - Add: `https://onmind.cc`
   - Add: `https://onmindsep20.firebaseapp.com`
6. **Configure Authorized redirect URIs**:
   - Add: `http://localhost:5173/__/auth/handler`
   - Add: `https://onmind.cc/__/auth/handler`
   - Add: `https://onmindsep20.firebaseapp.com/__/auth/handler`
7. **Save the changes**

## Step 3: Environment Variables (Optional)

Create a `.env.local` file in your project root with:

```env
# Firebase Configuration for Development
VITE_FIREBASE_API_KEY=AIzaSyDheNF1cZyK7Cue-FEXxInumgfiMkzr3Uo
VITE_FIREBASE_AUTH_DOMAIN=onmindsep20.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=onmindsep20
VITE_FIREBASE_STORAGE_BUCKET=onmindsep20.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=690745713338
VITE_FIREBASE_APP_ID=1:690745713338:web:1723fad95ad9e3d5435883
VITE_FIREBASE_MEASUREMENT_ID=G-KGNS2ND4WD

# Development Settings
VITE_DEV_MODE=true
VITE_APP_NAME=On Mind
```

## Step 4: Test the Configuration

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test on localhost**:
   - Go to `http://localhost:5173`
   - Try Google authentication
   - Should work without errors

3. **Test on mobile**:
   - Make sure you're on the same network
   - Use your computer's IP: `http://192.168.0.124:5173`
   - Try Google authentication

## Troubleshooting

### Common Issues:

1. **"This app is not verified" warning**:
   - This is normal for development
   - Click "Advanced" → "Go to localhost (unsafe)"
   - In production, you'll need to verify your app

2. **"Error 400: redirect_uri_mismatch"**:
   - Check that all redirect URIs are exactly correct
   - Make sure there are no trailing slashes
   - Verify the protocol (http vs https)

3. **Mobile not working**:
   - Make sure you're using your computer's IP address
   - Check that your phone is on the same WiFi network
   - Try using the network URL from Vite: `http://192.168.0.124:5173`

### Verification Checklist:

- [ ] Firebase authorized domains include `localhost` and `onmind.cc`
- [ ] Google OAuth origins include `http://localhost:5173` and `https://onmind.cc`
- [ ] Google OAuth redirect URIs include the auth handlers
- [ ] Development server restarted after changes
- [ ] Tested on both localhost and mobile

## Production Deployment

When deploying to `onmind.cc`, make sure:
- Your domain is properly configured in both Firebase and Google Console
- SSL certificate is working (https://)
- All redirect URIs use `https://` protocol
