# Step-by-Step Guide: Setting Up Google Authentication with Supabase

This guide will walk you through the complete process of setting up Google authentication for your application using Supabase, ensuring it works both in development and production environments.

## Prerequisites

- A Supabase account and project
- A Google Cloud Platform account
- Your application code with Supabase integration
- A deployment platform (like Netlify, Vercel, etc.)

## Step 1: Set Up Your Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Select "Web application" as the application type
6. Give your OAuth client a name (e.g., "My App Authentication")
7. Under "Authorized JavaScript origins", add:
   - Your local development URL (e.g., `http://localhost:5173`)
   - Your production URL (e.g., `https://your-app.netlify.app`)
8. Under "Authorized redirect URIs", add:
   - `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
   - Note: Replace `[YOUR_SUPABASE_PROJECT_REF]` with your actual Supabase project reference
9. Click "Create" to generate your client ID and client secret
10. Save your Client ID and Client Secret for the next step

## Step 2: Configure Supabase Authentication

1. Go to your Supabase dashboard and select your project
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list and click on it to configure
4. Enable the Google provider by toggling the switch
5. Enter the Client ID and Client Secret from Google Cloud Console
6. Save the changes

## Step 3: Configure URL Settings in Supabase

This is a critical step that's often overlooked:

1. In your Supabase dashboard, go to "Authentication" > "URL Configuration"
2. Set the "Site URL" to your local development URL (e.g., `http://localhost:5173`)
   - This is used as the default redirect when no specific redirect is provided
3. Under "Redirect URLs", add:
   - Your local development URL (e.g., `http://localhost:5173`)
   - Your production URL (e.g., `https://your-app.netlify.app`)
   - The Supabase callback URL: `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
4. Save the changes

## Step 4: Implement Google Sign-In in Your Application

Add the following code to your application:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://[YOUR_SUPABASE_PROJECT_REF].supabase.co',
  'your-supabase-anon-key'
);

async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // Automatically uses current URL
    }
  });
  
  if (error) console.error('Error logging in with Google:', error);
  return { data, error };
}
```

## Step 5: Test Authentication Flow

### Local Development Testing

1. Start your development server (e.g., `npm run dev`)
2. Try signing in with Google
3. You should be redirected to Google's authentication page
4. After authenticating, you should be redirected back to your application

### Production Testing

1. Deploy your application to your hosting platform
2. Visit your production URL
3. Try signing in with Google
4. Verify that the authentication flow works correctly

## Troubleshooting

If you encounter issues with Google authentication, check these common problems:

### "This site can't be reached" or Redirect Errors

- Ensure your Site URL in Supabase URL Configuration matches your actual development URL
- Verify that all redirect URLs are correctly added to both Google Cloud Console and Supabase
- Check that your production URL is included in both Google Cloud Console and Supabase

### "Error: redirect_uri_mismatch" from Google

- The redirect URI must exactly match one of the authorized redirect URIs in your Google Cloud Console
- Check for any typos or missing characters in your URLs
- Ensure `window.location.origin` resolves to a URL that's authorized in Google Cloud Console

### Authentication Works Locally But Not in Production

- Verify that your production URL is added to both:
  - Google Cloud Console's authorized JavaScript origins and redirect URIs
  - Supabase's redirect URLs list
- Check your browser console for any CORS or other errors

## Important Notes

- Always use `window.location.origin` for the redirectTo option to ensure it works across environments
- The Site URL in Supabase is used as a fallback when no specific redirect URL is provided
- Changes to Google Cloud Console settings may take a few minutes to propagate
- For security reasons, Google only allows redirects to pre-registered URLs

By following these steps carefully, you should have a working Google authentication system for both development and production environments.