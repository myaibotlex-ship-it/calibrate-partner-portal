import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiHD021KaFW5m6Y';
const DATABASE_URL = process.env.DATABASE_URL;

if (!AIRTABLE_API_KEY || !DATABASE_URL) {
  console.error('Missing required environment variables. Check .env.local file.');
  console.error('Required: AIRTABLE_API_KEY, DATABASE_URL');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fetchAirtableContacts() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Referral%20Contacts?pageSize=100`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${text}`);
  }
  
  return response.json();
}

async function fetchAirtablePartners() {
  // Fetch all partnerships to build record ID -> name mapping
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Partnerships?pageSize=100`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    }
  });
  
  if (!response.ok) {
    return new Map();
  }
  
  const data = await response.json();
  const map = new Map();
  
  for (const record of data.records || []) {
    if (record.fields['Partner Name']) {
      map.set(record.id, record.fields['Partner Name']);
    }
  }
  
  return map;
}

async function getPartnerIdByName(partnerName) {
  const result = await client.query(
    `SELECT id FROM partners WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [partnerName.trim()]
  );
  return result.rows[0]?.id || null;
}

async function syncContacts() {
  console.log('Fetching partners from Airtable (for ID lookup)...');
  const airtablePartnerMap = await fetchAirtablePartners();
  console.log(`Loaded ${airtablePartnerMap.size} partner mappings`);
  
  console.log('Fetching contacts from Airtable...');
  
  let data;
  try {
    data = await fetchAirtableContacts();
  } catch (error) {
    // Table might not exist or have different name
    console.log('Note: Referral Contacts table not found or empty.');
    console.log('Trying alternative table names...');
    
    // Try different table names
    const tableNames = ['Contacts', 'Partner Contacts', 'CRM Contacts'];
    for (const tableName of tableNames) {
      try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?pageSize=100`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
        });
        if (response.ok) {
          data = await response.json();
          console.log(`Found table: ${tableName}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }
    
    if (!data) {
      console.log('No contacts table found in Airtable. Skipping sync.');
      return;
    }
  }
  
  console.log(`Found ${data.records?.length || 0} contact records`);
  
  if (!data.records || data.records.length === 0) {
    console.log('No contacts to sync.');
    return;
  }
  
  await client.connect();
  console.log('Connected to database');
  
  let synced = 0;
  let skipped = 0;
  let noPartner = 0;
  
  for (const record of data.records) {
    const fields = record.fields;
    
    // Try to find the partner by company name
    // Handle Referral Contacts table structure or generic CRM structure
    let companyRef = fields['Referral Company'] || fields['Company'] || fields['Partner'] || fields['Company Name'] || fields['Partner Name'];
    
    if (!companyRef) {
      console.log(`Skipping contact - no company name found`);
      skipped++;
      continue;
    }
    
    // Handle linked records (array of record IDs) from Airtable
    const companyRecordId = Array.isArray(companyRef) ? companyRef[0] : companyRef;
    
    // If it looks like a record ID (starts with 'rec'), resolve it via the partner map
    let companyNameClean = companyRecordId;
    if (typeof companyRecordId === 'string' && companyRecordId.startsWith('rec')) {
      companyNameClean = airtablePartnerMap.get(companyRecordId) || companyRecordId;
    }
    
    const partnerId = await getPartnerIdByName(companyNameClean);
    if (!partnerId) {
      console.log(`No partner found for company: ${companyNameClean}`);
      noPartner++;
      continue;
    }
    
    // Extract contact fields - try common field names
    const firstName = fields['First Name'] || fields['FirstName'] || '';
    const lastName = fields['Last Name'] || fields['LastName'] || fields['Name'] || '';
    const email = fields['Email from Leads/Prospects'] || fields['Email'] || fields['Email Address'] || '';
    const phone = fields['Phone'] || fields['Phone Number'] || fields['Mobile'] || '';
    const position = fields['Position'] || fields['Title'] || fields['Job Title'] || fields['Role'] || '';
    const department = fields['Department'] || '';
    const notes = department ? `Department: ${department}` : (fields['Notes'] || fields['Comments'] || '');
    const isPrimary = fields['Primary'] || fields['Is Primary'] || false;
    
    // Skip if no meaningful contact data
    if (!firstName && !lastName && !email) {
      console.log(`Skipping contact for ${companyName} - no name or email`);
      skipped++;
      continue;
    }
    
    // Upsert contact by email (if exists) or insert new
    const query = email 
      ? `
        INSERT INTO partner_contacts (
          partner_id, first_name, last_name, email, phone, position, is_primary, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          position = EXCLUDED.position,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `
      : `
        INSERT INTO partner_contacts (
          partner_id, first_name, last_name, email, phone, position, is_primary, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
    
    try {
      // First check if this contact already exists by email
      if (email) {
        const existing = await client.query(
          `SELECT id FROM partner_contacts WHERE email = $1 AND partner_id = $2`,
          [email, partnerId]
        );
        
        if (existing.rows.length > 0) {
          // Update existing
          await client.query(
            `UPDATE partner_contacts SET 
              first_name = $1, last_name = $2, phone = $3, position = $4, notes = $5, updated_at = NOW()
             WHERE email = $6 AND partner_id = $7`,
            [firstName, lastName, phone, position, notes, email, partnerId]
          );
        } else {
          // Insert new
          await client.query(
            `INSERT INTO partner_contacts (partner_id, first_name, last_name, email, phone, position, is_primary, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [partnerId, firstName, lastName, email, phone, position, isPrimary, notes]
          );
        }
      } else {
        // No email, just insert (can't dedupe)
        await client.query(
          `INSERT INTO partner_contacts (partner_id, first_name, last_name, email, phone, position, is_primary, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [partnerId, firstName, lastName, email, phone, position, isPrimary, notes]
        );
      }
      
      synced++;
      console.log(`✓ Synced contact: ${firstName} ${lastName} (${companyNameClean})`);
    } catch (error) {
      console.error(`✗ Failed to sync contact for ${companyNameClean}:`, error.message);
    }
  }
  
  await client.end();
  console.log(`\nSync complete:`);
  console.log(`  ✓ ${synced} contacts synced`);
  console.log(`  ⊘ ${skipped} skipped (missing data)`);
  console.log(`  ✗ ${noPartner} skipped (no matching partner)`);
}

syncContacts().catch(console.error);
