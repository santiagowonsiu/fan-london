# Cloudinary Setup Instructions

## 1. Create Upload Preset

1. Go to: https://console.cloudinary.com/settings/upload
2. Scroll down to **"Upload presets"**
3. Click **"Add upload preset"**
4. Configure:
   - **Preset name**: `fan_products`
   - **Signing mode**: `Unsigned` (allows uploads from browser)
   - **Folder**: `fan-products`
   - **Transformations**:
     - Mode: `Fill`
     - Width: `800`
     - Height: `800`
     - Quality: `Auto:good`
     - Format: `Auto`
   - **Cropping**: Check "Enable cropping"
   - **Aspect ratio**: `1:1` (square)
5. Click **"Save"**

## 2. Environment Variables

Already configured in your `.env.local`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dlm0zpsuf
CLOUDINARY_API_KEY=669413771595648
CLOUDINARY_API_SECRET=COzxsGxoT9HG1wa76TsscSJw92E
```

## 3. Add to Vercel

Go to: https://vercel.com/santiagowonsiu/fan-london/settings/environment-variables

Add:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `dlm0zpsuf`

(API Key and Secret are only needed for server-side uploads, not for the widget)

## 4. How It Works

### Adding Product Images:
1. Click **"Add Item"** or **"Edit"** on a product
2. See the **"Product Image"** upload area
3. Click the **📷 Add Image** button
4. Upload widget opens with:
   - **Camera support** (on mobile/iPad)
   - **Crop to square** (1:1 aspect ratio)
   - **Auto-resize** to 800x800px
   - **Quality optimization** (keeps under 5MB)
5. Image saved to Cloudinary
6. URL stored in MongoDB

### Features:
- ✅ Square crop (perfect for product thumbnails)
- ✅ Max 5MB file size
- ✅ Formats: JPG, PNG, WebP
- ✅ Camera support for mobile
- ✅ Auto-optimization
- ✅ Fast CDN delivery
- ✅ 60x60px thumbnails in Product List
- ✅ Click to remove image

## 5. Free Tier Limits

Cloudinary free tier includes:
- 25 GB storage
- 25 GB bandwidth/month
- 25 credits/month for transformations

Should be plenty for a restaurant inventory!

