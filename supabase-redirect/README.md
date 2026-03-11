# Supabase Email Verification Redirect

This folder contains the email verification redirect page for your Supabase authentication.

## Deployment Steps

### 1. **Deploy to Netlify**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag the `supabase-redirect` folder into the Netlify deploy area
   - Netlify will generate a domain (e.g., `https://remaining-auth.netlify.app`)

### 2. **Update AuthContext.tsx**
   - Open `context/AuthContext.tsx`
   - Replace `"https://remaining-auth.netlify.app"` with your actual Netlify domain
   - Save the file

### 3. **Configure Supabase Redirect URLs**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Navigate to **Authentication → URL Configuration**
   - Add your Netlify domain under "Redirect URLs":
     ```
     https://your-netlify-domain.netlify.app
     ```

### 4. **How It Works**
   - User signs up → Email sent with verification link
   - User clicks link → Redirected to your Netlify page
   - The page uses Supabase JS SDK to verify the email code
   - On success → User redirected to app via deep link (`exp://remaining-app`)

## What's Included

- **index.html** - A beautiful verification page that:
  - Matches your app's dark theme (`#0B0616`, `#9D5CFF`)
  - Shows real-time status updates
  - Handles success and error states
  - Uses Supabase's `verifyOtp` function
  - Automatically redirects to your app on success

## Notes

- The page uses the Netlify CDN to load Supabase JS (no build step needed)
- The deep link `exp://remaining-app` requires deep linking configuration in your Expo app
- Email verification links expire after 24 hours by default (configure in Supabase settings)

## Troubleshooting

If verification fails:
1. Check that the Netlify domain matches Supabase URL configuration
2. Verify the email link includes `type=email_confirmation`
3. Check browser console for detailed error messages
4. Ensure Supabase email templates are properly configured
