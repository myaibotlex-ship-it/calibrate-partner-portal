import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface ContactRow {
  partner_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  is_primary?: string;
  notes?: string;
}

function parseCSV(csv: string): ContactRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => 
    h.trim().toLowerCase().replace(/[^a-z_]/g, '_')
  );
  
  const rows: ContactRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: ContactRow = {};
    
    headers.forEach((header, idx) => {
      // Map common CSV column names to our fields
      const value = values[idx] || '';
      
      if (['partner', 'partner_name', 'company', 'company_name'].includes(header)) {
        row.partner_name = value;
      } else if (['first_name', 'firstname', 'first'].includes(header)) {
        row.first_name = value;
      } else if (['last_name', 'lastname', 'last'].includes(header)) {
        row.last_name = value;
      } else if (['email', 'email_address'].includes(header)) {
        row.email = value;
      } else if (['phone', 'phone_number', 'mobile'].includes(header)) {
        row.phone = value;
      } else if (['position', 'title', 'job_title', 'role'].includes(header)) {
        row.position = value;
      } else if (['primary', 'is_primary'].includes(header)) {
        row.is_primary = value;
      } else if (['notes', 'comments'].includes(header)) {
        row.notes = value;
      }
    });
    
    if (row.partner_name && (row.first_name || row.last_name || row.email)) {
      rows.push(row);
    }
  }
  
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const csvText = await file.text();
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      return NextResponse.json({ 
        error: 'No valid rows found in CSV. Ensure headers include: partner_name, first_name, last_name, email' 
      }, { status: 400 });
    }
    
    // Get all partners for matching
    const { data: partners } = await supabase.from('partners').select('id, name');
    const partnerMap = new Map(
      partners?.map(p => [p.name.toLowerCase(), p.id]) || []
    );
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const row of rows) {
      const partnerId = partnerMap.get(row.partner_name?.toLowerCase() || '');
      
      if (!partnerId) {
        errors.push(`No partner found: ${row.partner_name}`);
        skipped++;
        continue;
      }
      
      // Check if contact with same email already exists
      if (row.email) {
        const { data: existing } = await supabase
          .from('partner_contacts')
          .select('id')
          .eq('partner_id', partnerId)
          .eq('email', row.email)
          .single();
        
        if (existing) {
          // Update existing contact
          const { error } = await supabase
            .from('partner_contacts')
            .update({
              first_name: row.first_name || null,
              last_name: row.last_name || null,
              phone: row.phone || null,
              position: row.position || null,
              notes: row.notes || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (error) {
            errors.push(`Failed to update ${row.email}: ${error.message}`);
            skipped++;
          } else {
            imported++;
          }
          continue;
        }
      }
      
      // Insert new contact
      const { error } = await supabase
        .from('partner_contacts')
        .insert({
          partner_id: partnerId,
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          email: row.email || null,
          phone: row.phone || null,
          position: row.position || null,
          is_primary: ['true', 'yes', '1'].includes(row.is_primary?.toLowerCase() || ''),
          notes: row.notes || null
        });
      
      if (error) {
        errors.push(`Failed to import ${row.first_name} ${row.last_name}: ${error.message}`);
        skipped++;
      } else {
        imported++;
      }
    }
    
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 10) // Limit error messages
    });
    
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Import failed' 
    }, { status: 500 });
  }
}
