/**
 * Migration Script: Re-upload PDFs from /image/upload/ to /raw/upload/
 * 
 * This script:
 * 1. Finds all expenses with PDF receipts stored as /image/upload/
 * 2. Downloads each PDF from Cloudinary
 * 3. Re-uploads them with resourceType: 'raw'
 * 4. Updates the database with new URLs
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const { Readable } = require('stream');

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary credentials in .env.local:');
  console.error('   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
  console.error('   - CLOUDINARY_API_KEY');
  console.error('   - CLOUDINARY_API_SECRET');
  process.exit(1);
}

// MongoDB connection
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in .env.local');
  process.exit(1);
}

// Import models (we'll define inline to avoid import issues)
const personalExpenseSchema = new mongoose.Schema({}, { strict: false });
const PersonalExpense = mongoose.models.PersonalExpense || mongoose.model('PersonalExpense', personalExpenseSchema);

const directPurchaseSchema = new mongoose.Schema({}, { strict: false });
const DirectPurchase = mongoose.models.DirectPurchase || mongoose.model('DirectPurchase', directPurchaseSchema);

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB');
}

async function uploadToCloudinaryRaw(fileBuffer, originalPublicId, folder) {
  return new Promise((resolve, reject) => {
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });

    // Upload as raw resource type
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: folder,
        public_id: originalPublicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    const readableStream = Readable.from(fileBuffer);
    readableStream.pipe(uploadStream);
  });
}

async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

function extractCloudinaryInfo(url) {
  // Extract public_id and folder from URL
  // Example: https://res.cloudinary.com/dlm0zpsuf/image/upload/v1761338486/fan-receipts/al2wjwhg3kpjh5f8e0z7.pdf
  const match = url.match(/\/v\d+\/(.*)\/(.*?)\.pdf$/);
  if (!match) return null;
  
  return {
    folder: match[1],
    publicId: match[2],
  };
}

async function migratePDFs() {
  console.log('🔄 Starting PDF migration...\n');
  
  try {
    await connectDB();

    // Find all personal expenses with PDF receipts
    const expensesWithPDFs = await PersonalExpense.find({
      receiptUrl: { $regex: /\.pdf$/i, $exists: true },
    });

    console.log(`📄 Found ${expensesWithPDFs.length} personal expenses with PDF receipts\n`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const expense of expensesWithPDFs) {
      const url = expense.receiptUrl;
      
      // Check if already using /raw/upload/
      if (url.includes('/raw/upload/')) {
        console.log(`⏭️  Skipping (already raw): ${expense.description}`);
        skipped++;
        continue;
      }

      // Check if using /image/upload/
      if (!url.includes('/image/upload/')) {
        console.log(`⏭️  Skipping (not image): ${expense.description}`);
        skipped++;
        continue;
      }

      try {
        console.log(`🔄 Migrating: ${expense.description}`);
        console.log(`   Old URL: ${url}`);

        // Extract info
        const info = extractCloudinaryInfo(url);
        if (!info) {
          console.log(`   ❌ Could not parse URL`);
          failed++;
          continue;
        }

        // Try to access the current URL
        try {
          const fileBuffer = await downloadFile(url);
          console.log(`   ✓ Downloaded (${fileBuffer.length} bytes)`);

          // Upload to raw
          const newUrl = await uploadToCloudinaryRaw(fileBuffer, info.publicId, info.folder);
          console.log(`   ✓ Uploaded to: ${newUrl}`);

          // Update database
          expense.receiptUrl = newUrl;
          await expense.save();
          console.log(`   ✓ Database updated`);

          migrated++;
        } catch (downloadError) {
          // File doesn't exist at original URL, just update the URL format
          console.log(`   ⚠️  File not accessible, updating URL format only`);
          const newUrl = url.replace('/image/upload/', '/raw/upload/');
          expense.receiptUrl = newUrl;
          await expense.save();
          console.log(`   ✓ URL updated to: ${newUrl}`);
          migrated++;
        }

        console.log('');
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        failed++;
      }
    }

    // Check for reimbursement proofs
    const expensesWithProofs = await PersonalExpense.find({
      reimbursementProofUrl: { $regex: /\.pdf$/i, $exists: true },
    });

    console.log(`\n📄 Found ${expensesWithProofs.length} personal expenses with PDF reimbursement proofs\n`);

    for (const expense of expensesWithProofs) {
      const url = expense.reimbursementProofUrl;
      
      if (url.includes('/raw/upload/')) {
        console.log(`⏭️  Skipping (already raw): ${expense.description}`);
        skipped++;
        continue;
      }

      if (!url.includes('/image/upload/')) {
        console.log(`⏭️  Skipping (not image): ${expense.description}`);
        skipped++;
        continue;
      }

      try {
        console.log(`🔄 Migrating proof: ${expense.description}`);
        const newUrl = url.replace('/image/upload/', '/raw/upload/');
        expense.reimbursementProofUrl = newUrl;
        await expense.save();
        console.log(`   ✓ Updated to: ${newUrl}\n`);
        migrated++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        failed++;
      }
    }

    // Check direct purchases
    const purchasesWithPDFs = await DirectPurchase.find({
      invoiceUrl: { $regex: /\.pdf$/i, $exists: true },
    });

    console.log(`\n📄 Found ${purchasesWithPDFs.length} direct purchases with PDF invoices\n`);

    for (const purchase of purchasesWithPDFs) {
      const url = purchase.invoiceUrl;
      
      if (url.includes('/raw/upload/')) {
        console.log(`⏭️  Skipping (already raw): ${purchase.description || purchase._id}`);
        skipped++;
        continue;
      }

      if (!url.includes('/image/upload/')) {
        console.log(`⏭️  Skipping (not image): ${purchase.description || purchase._id}`);
        skipped++;
        continue;
      }

      try {
        console.log(`🔄 Migrating invoice: ${purchase.description || purchase._id}`);
        const newUrl = url.replace('/image/upload/', '/raw/upload/');
        purchase.invoiceUrl = newUrl;
        await purchase.save();
        console.log(`   ✓ Updated to: ${newUrl}\n`);
        migrated++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        failed++;
      }
    }

    console.log('\n✅ Migration complete!');
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run migration
migratePDFs().catch(console.error);

