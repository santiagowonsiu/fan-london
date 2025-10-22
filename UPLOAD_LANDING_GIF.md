# Upload Landing GIF to Cloudinary

## Quick Upload (Web Interface - Recommended)

1. **Go to Media Library**:
   https://console.cloudinary.com/pm/c-e1f8c06312d10cea2fc84c86f6efc5/media-explorer

2. **Upload the GIF**:
   - Click **"Upload"** button (top right)
   - Select: `/Users/santiagowon/Desktop/fan-london/src/assets/images/IMG_1692 (2).gif`
   - Or drag and drop the file
   - Folder: `fan-london`
   - Public ID: `landing-background`

3. **Get the URL**:
   - After upload, click on the image
   - Copy the **"Secure URL"** (should look like):
     `https://res.cloudinary.com/dlm0zpsuf/image/upload/v1234567890/fan-london/landing-background.gif`

4. **Update .env.local**:
   Add this line:
   ```
   NEXT_PUBLIC_CLOUDINARY_LANDING_URL=https://res.cloudinary.com/dlm0zpsuf/image/upload/v1234567890/fan-london/landing-background.gif
   ```

5. **Add to Vercel**:
   - Go to: https://vercel.com/santiagowonsiu/fan-london/settings/environment-variables
   - Add: `NEXT_PUBLIC_CLOUDINARY_LANDING_URL` = (your URL from step 3)

6. **Restart local server**:
   ```bash
   # Kill current server
   pkill -f "next dev"
   
   # Restart
   npm run dev
   ```

7. **Redeploy Vercel**:
   - Go to Vercel dashboard
   - Click "Redeploy" (clear cache!)

## Result

Your landing page will show the compressed GIF with:
- ✅ Fast loading (84MB → Cloudinary optimizes further)
- ✅ Global CDN delivery
- ✅ Automatic format conversion (WebP for supported browsers)
- ✅ No GitHub/Vercel file size issues

The GIF will work both locally and on Vercel!

