# Firebase Migration Guide

## 🚀 Complete Migration from Supabase to Firebase

This guide will help you migrate your "On Mind" app from Supabase to Firebase.

## Prerequisites

✅ **Completed:**
- Data extracted from Supabase backup
- Firebase project created (`onmindsep20`)
- Firebase SDK installed
- Migration scripts created

## Step 1: Set Up Service Account Key

1. **Download your Firebase service account key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `onmindsep20`
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Place the service account key:**
   ```bash
   # Rename the downloaded file to:
   mv ~/Downloads/your-downloaded-file.json ./firebase-service-account.json
   ```

## Step 2: Run the Migration

```bash
# Make sure you have the service account key in place
node migrate-to-firestore.js
```

This will:
- Import all 120 entries to Firestore
- Import all 3 users to Firestore
- Create proper document references
- Generate a migration summary

## Step 3: Update Your App

### Replace Supabase with Firebase

1. **Update imports in your components:**
   ```typescript
   // OLD (Supabase)
   import { supabase } from '../lib/supabase';
   
   // NEW (Firebase)
   import { getEntries, createEntry, updateEntry, deleteEntry } from '../lib/firebase-client';
   ```

2. **Update authentication calls:**
   ```typescript
   // OLD
   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   
   // NEW
   const { data, error } = await signIn(email, password);
   ```

### Key Changes Needed

1. **Environment Variables:**
   - Remove Supabase environment variables
   - Firebase config is already in `src/lib/firebase.ts`

2. **Authentication:**
   - Update `AuthForm.tsx` to use Firebase auth functions
   - Update `AuthView.tsx` to use Firebase auth state

3. **Data Operations:**
   - Update all entry-related hooks (`useEntries.ts`, etc.)
   - Update components that fetch/display entries

## Step 4: Firestore Security Rules

Add these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Entries are private to each user
    match /entries/{entryId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == /databases/$(database)/documents/users/$(request.auth.uid);
    }
    
    // Migration data is read-only
    match /migration/{document} {
      allow read: if request.auth != null;
    }
  }
}
```

## Step 5: Enable Authentication

1. **Go to Firebase Console → Authentication**
2. **Enable Email/Password authentication**
3. **Enable Google authentication**
4. **Add your domain to authorized domains:**
   - `localhost:3002` (for development)
   - Your production domain

## Step 6: Test the Migration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test authentication:**
   - Try signing in with existing users
   - Try Google OAuth
   - Try creating new accounts

3. **Test data access:**
   - Verify all entries are visible
   - Test search functionality
   - Test category filtering
   - Test favorites and pinned items

## Migration Benefits

✅ **No more project pausing**  
✅ **Better pricing model**  
✅ **Google's reliable infrastructure**  
✅ **Better offline support**  
✅ **More authentication options**  
✅ **Integrated analytics**  

## Troubleshooting

### Common Issues:

1. **Authentication not working:**
   - Check Firebase Auth is enabled
   - Verify authorized domains
   - Check service account permissions

2. **Data not showing:**
   - Verify Firestore security rules
   - Check user document references
   - Verify migration completed successfully

3. **Google OAuth issues:**
   - Check OAuth consent screen
   - Verify redirect URIs
   - Check client ID configuration

## Support

If you encounter issues:
1. Check Firebase Console for errors
2. Check browser console for client errors
3. Verify all environment variables are correct
4. Ensure service account has proper permissions

## Next Steps

After successful migration:
1. Update your deployment configuration
2. Remove Supabase dependencies
3. Update documentation
4. Celebrate your freedom from Supabase! 🎉
