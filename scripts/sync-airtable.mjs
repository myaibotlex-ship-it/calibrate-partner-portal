import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const { Client } = pg;

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiHD021KaFW5m6Y';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!AIRTABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DATABASE_URL) {
  console.error('Missing required environment variables. Check .env.local file.');
  console.error('Required: AIRTABLE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function fetchAirtable() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Partnerships?pageSize=100`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status}`);
  }
  
  return response.json();
}

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadLogo(partnerId, imageUrl, filename) {
  try {
    const imageBuffer = await downloadImage(imageUrl);
    const extension = filename.split('.').pop() || 'png';
    const storagePath = `partner-logos/${partnerId}.${extension}`;
    
    const { data, error } = await supabase.storage
      .from('partner-assets')
      .upload(storagePath, imageBuffer, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: true
      });
    
    if (error) {
      console.error(`Failed to upload logo for ${partnerId}:`, error.message);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('partner-assets')
      .getPublicUrl(storagePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Failed to download/upload logo for ${partnerId}:`, error.message);
    return null;
  }
}

async function syncPartners() {
  console.log('Fetching partners from Airtable...');
  const data = await fetchAirtable();
  console.log(`Found ${data.records.length} records`);
  
  await client.connect();
  console.log('Connected to database');
  
  // Create storage bucket if it doesn't exist
  const { error: bucketError } = await supabase.storage.createBucket('partner-assets', {
    public: true,
    fileSizeLimit: 5242880 // 5MB
  });
  
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.error('Bucket creation error:', bucketError);
  }
  
  let synced = 0;
  let skipped = 0;
  
  for (const record of data.records) {
    const fields = record.fields;
    const name = fields['Partner Name'];
    
    if (!name) {
      skipped++;
      continue;
    }
    
    // Skip partners without meaningful data
    if (!fields['Industry'] && !fields['Partnership Type'] && !fields['Company About']) {
      console.log(`Skipping ${name} - no meaningful data`);
      skipped++;
      continue;
    }
    
    const slug = slugify(name);
    const industries = fields['Industry'] || [];
    const industrySubcategory = fields['Industry Sub catagory'] || [];
    const partnershipTypes = fields['Partnership Type'] || [];
    const status = fields['Status'] || 'Researching';
    const about = fields['Company About'] || null;
    const notes = fields['Notes'] || null;
    const referralToPercent = fields['Referral TO %'] || null;
    const referralFromPercent = fields['Referral FROM %'] || null;
    const engagementTypes = fields['Engagement Type'] || [];
    const calibrateServices = fields['Calibrate Services Needed'] || [];
    
    // Handle logo
    let logoUrl = null;
    if (fields['Company Logo'] && fields['Company Logo'].length > 0) {
      const logo = fields['Company Logo'][0];
      console.log(`Uploading logo for ${name}...`);
      logoUrl = await uploadLogo(slug, logo.url, logo.filename);
    }
    
    // Feature Multiplier
    const isFeatured = name === 'Multiplier';
    
    // Upsert partner
    const query = `
      INSERT INTO partners (
        airtable_id, name, slug, industries, industry_subcategory,
        partnership_types, status, about, logo_url, notes,
        referral_to_percent, referral_from_percent, engagement_types,
        calibrate_services_needed, is_featured, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (airtable_id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        industries = EXCLUDED.industries,
        industry_subcategory = EXCLUDED.industry_subcategory,
        partnership_types = EXCLUDED.partnership_types,
        status = EXCLUDED.status,
        about = EXCLUDED.about,
        logo_url = COALESCE(EXCLUDED.logo_url, partners.logo_url),
        notes = EXCLUDED.notes,
        referral_to_percent = EXCLUDED.referral_to_percent,
        referral_from_percent = EXCLUDED.referral_from_percent,
        engagement_types = EXCLUDED.engagement_types,
        calibrate_services_needed = EXCLUDED.calibrate_services_needed,
        is_featured = EXCLUDED.is_featured,
        updated_at = NOW()
    `;
    
    try {
      await client.query(query, [
        record.id,
        name,
        slug,
        industries,
        industrySubcategory,
        partnershipTypes,
        status,
        about,
        logoUrl,
        notes,
        referralToPercent,
        referralFromPercent,
        engagementTypes,
        calibrateServices,
        isFeatured,
        true
      ]);
      synced++;
      console.log(`✓ Synced: ${name}`);
    } catch (error) {
      console.error(`✗ Failed to sync ${name}:`, error.message);
    }
  }
  
  await client.end();
  console.log(`\nSync complete: ${synced} synced, ${skipped} skipped`);
}

syncPartners().catch(console.error);
