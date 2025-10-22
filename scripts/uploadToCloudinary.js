import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dlm0zpsuf',
  api_key: process.env.CLOUDINARY_API_KEY || '669413771595648',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'COzxsGxoT9HG1wa76TsscSJw92E',
});

async function uploadAssets() {
  try {
    console.log('🚀 Uploading assets to Cloudinary...\n');

    // Upload the landing GIF
    const gifPath = join(__dirname, '..', 'src/assets/images/IMG_1692 (2).gif');
    
    console.log('📤 Uploading compressed landing GIF (84MB)...');
    const result = await cloudinary.uploader.upload(gifPath, {
      folder: 'fan-london',
      resource_type: 'image',
      public_id: 'landing-background',
      overwrite: true,
    });

    console.log('\n✅ Upload successful!');
    console.log('📦 Cloudinary URL:', result.secure_url);
    console.log('🔗 Use this URL in your landing page\n');
    
    // Show optimized URL examples
    console.log('💡 Optimized versions:');
    console.log('   Medium quality:', result.secure_url.replace('/upload/', '/upload/q_auto:low,f_auto/'));
    console.log('   Small size:', result.secure_url.replace('/upload/', '/upload/w_1920,q_auto:low,f_auto/'));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

uploadAssets();

