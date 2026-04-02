"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Partner, PartnerContact, PARTNER_STATUSES, PARTNERSHIP_TYPES, INDUSTRIES } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogOut,
  RefreshCw,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Star,
  StarOff,
  Users,
  Upload,
  Save,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Mail,
  Phone,
} from "lucide-react";
import Image from "next/image";

type EditingPartner = Partial<Partner> & { isNew?: boolean };
type EditingContact = Partial<PartnerContact> & { isNew?: boolean };

export default function AdminDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingPartner, setEditingPartner] = useState<EditingPartner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Partner | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Record<string, PartnerContact[]>>({});
  const [editingContact, setEditingContact] = useState<EditingContact | null>(null);
  const [deleteContactConfirm, setDeleteContactConfirm] = useState<PartnerContact | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number; skipped: number; errors: string[]} | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth !== "authenticated") {
      router.push("/admin/login");
      return;
    }
    setIsAuthenticated(true);
    fetchPartners();
  }, [router]);

  async function fetchPartners() {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching partners:", error);
    } else {
      setPartners(data || []);
    }
    setLoading(false);
  }

  async function fetchContacts(partnerId: string) {
    const { data, error } = await supabase
      .from("partner_contacts")
      .select("*")
      .eq("partner_id", partnerId)
      .order("is_primary", { ascending: false })
      .order("last_name");

    if (error) {
      console.error("Error fetching contacts:", error);
      return;
    }
    
    setContacts(prev => ({ ...prev, [partnerId]: data || [] }));
  }

  async function toggleExpanded(partnerId: string) {
    if (expandedPartner === partnerId) {
      setExpandedPartner(null);
    } else {
      setExpandedPartner(partnerId);
      if (!contacts[partnerId]) {
        await fetchContacts(partnerId);
      }
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    router.push("/admin/login");
  }

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSavePartner() {
    if (!editingPartner?.name) return;
    
    setSaving(true);
    try {
      const slug = editingPartner.slug || slugify(editingPartner.name);
      
      // Handle logo upload if there's a new file
      let logoUrl = editingPartner.logo_url;
      if (logoFile) {
        const extension = logoFile.name.split('.').pop() || 'png';
        const storagePath = `partner-logos/${slug}.${extension}`;
        
        const { error: uploadError } = await supabase.storage
          .from('partner-assets')
          .upload(storagePath, logoFile, {
            contentType: logoFile.type,
            upsert: true
          });
        
        if (uploadError) {
          console.error('Logo upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('partner-assets')
            .getPublicUrl(storagePath);
          logoUrl = urlData.publicUrl;
        }
      }
      
      const partnerData = {
        name: editingPartner.name,
        slug,
        industries: editingPartner.industries || [],
        industry_subcategory: editingPartner.industry_subcategory || [],
        partnership_types: editingPartner.partnership_types || [],
        status: editingPartner.status || 'Researching',
        about: editingPartner.about || null,
        logo_url: logoUrl,
        notes: editingPartner.notes || null,
        website: editingPartner.website || null,
        referral_to_percent: editingPartner.referral_to_percent || null,
        referral_from_percent: editingPartner.referral_from_percent || null,
        engagement_types: editingPartner.engagement_types || [],
        calibrate_services_needed: editingPartner.calibrate_services_needed || [],
        is_featured: editingPartner.is_featured || false,
        is_active: editingPartner.is_active !== false,
      };

      if (editingPartner.isNew) {
        const { error } = await supabase
          .from("partners")
          .insert([{ ...partnerData, airtable_id: `manual-${Date.now()}` }]);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("partners")
          .update(partnerData)
          .eq("id", editingPartner.id);
        
        if (error) throw error;
      }

      setEditingPartner(null);
      setLogoFile(null);
      await fetchPartners();
    } catch (error) {
      console.error("Error saving partner:", error);
      alert("Failed to save partner. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePartner() {
    if (!deleteConfirm) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", deleteConfirm.id);
      
      if (error) throw error;
      
      setDeleteConfirm(null);
      await fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
      alert("Failed to delete partner.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured(partner: Partner) {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ is_featured: !partner.is_featured })
        .eq("id", partner.id);
      
      if (error) throw error;
      await fetchPartners();
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  }

  async function handleSaveContact() {
    if (!editingContact?.partner_id) return;
    
    setSaving(true);
    try {
      const contactData = {
        partner_id: editingContact.partner_id,
        first_name: editingContact.first_name || null,
        last_name: editingContact.last_name || null,
        email: editingContact.email || null,
        phone: editingContact.phone || null,
        position: editingContact.position || null,
        is_primary: editingContact.is_primary || false,
        notes: editingContact.notes || null,
      };

      if (editingContact.isNew) {
        const { error } = await supabase
          .from("partner_contacts")
          .insert([contactData]);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("partner_contacts")
          .update(contactData)
          .eq("id", editingContact.id);
        
        if (error) throw error;
      }

      setEditingContact(null);
      await fetchContacts(editingContact.partner_id);
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Failed to save contact.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContact() {
    if (!deleteContactConfirm) return;
    
    setSaving(true);
    try {
      const partnerId = deleteContactConfirm.partner_id;
      const { error } = await supabase
        .from("partner_contacts")
        .delete()
        .eq("id", deleteContactConfirm.id);
      
      if (error) throw error;
      
      setDeleteContactConfirm(null);
      await fetchContacts(partnerId);
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePrimaryContact(contact: PartnerContact) {
    try {
      // First, unset all other primary contacts for this partner
      if (!contact.is_primary) {
        await supabase
          .from("partner_contacts")
          .update({ is_primary: false })
          .eq("partner_id", contact.partner_id);
      }
      
      // Then set/unset this one
      const { error } = await supabase
        .from("partner_contacts")
        .update({ is_primary: !contact.is_primary })
        .eq("id", contact.id);
      
      if (error) throw error;
      await fetchContacts(contact.partner_id);
    } catch (error) {
      console.error("Error toggling primary contact:", error);
    }
  }

  async function handleCsvImport() {
    if (!csvFile) return;
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      setImportResult(result);
      
      // Refresh contacts for expanded partner
      if (expandedPartner) {
        await fetchContacts(expandedPartner);
      }
    } catch (error) {
      console.error('CSV import error:', error);
      setImportResult({ 
        imported: 0, 
        skipped: 0, 
        errors: [error instanceof Error ? error.message : 'Import failed'] 
      });
    } finally {
      setImporting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4B84]"></div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    "Active Partnership": "bg-green-100 text-green-800",
    "In Discussion": "bg-blue-100 text-blue-800",
    "Researching": "bg-yellow-100 text-yellow-800",
    "Outreach Pending": "bg-orange-100 text-orange-800",
    "Declined": "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-[#1A4B84] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image 
            src="/calibrate-logo.png" 
            alt="Calibrate HCM" 
            width={120} 
            height={35}
            className="h-8 w-auto brightness-0 invert"
          />
          <span className="text-white/70">|</span>
          <span className="font-medium">Partner Portal Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setEditingPartner({ isNew: true, is_active: true, industries: [], partnership_types: [] })}
            className="text-white hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCsvImportOpen(true)}
            className="text-white hover:bg-white/10"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchPartners}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-600">Manage your partner directory ({partners.length} partners)</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {PARTNER_STATUSES.map((status) => (
            <div key={status} className="bg-white rounded-lg p-4 border shadow-sm">
              <div className="text-2xl font-bold text-gray-900">
                {partners.filter(p => p.status === status).length}
              </div>
              <div className="text-sm text-gray-600">{status}</div>
            </div>
          ))}
        </div>

        {/* Partner Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Partner</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Industry</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Contacts</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Loading partners...
                    </td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No partners found
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <>
                      <tr key={partner.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {partner.logo_url ? (
                              <img 
                                src={partner.logo_url} 
                                alt={partner.name}
                                className="w-10 h-10 rounded object-contain bg-gray-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">
                                {partner.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{partner.name}</div>
                              {partner.is_featured && (
                                <span className="text-xs text-[#3BB4C1]">⭐ Featured</span>
                              )}
                              {partner.website && (
                                <a 
                                  href={partner.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-500 hover:text-[#1A4B84] block truncate max-w-[200px]"
                                >
                                  {partner.website}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[partner.status || ""] || "bg-gray-100 text-gray-800"}>
                            {partner.status || "Unknown"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {partner.partnership_types?.map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {partner.industries?.slice(0, 2).join(", ") || "-"}
                            {(partner.industries?.length || 0) > 2 && ` +${partner.industries!.length - 2}`}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(partner.id)}
                            className="text-gray-600 hover:text-[#1A4B84]"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            {contacts[partner.id]?.length || 0}
                            {expandedPartner === partner.id ? (
                              <ChevronUp className="w-4 h-4 ml-1" />
                            ) : (
                              <ChevronDown className="w-4 h-4 ml-1" />
                            )}
                          </Button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFeatured(partner)}
                              className="text-gray-600 hover:text-yellow-500"
                              title={partner.is_featured ? "Remove from featured" : "Mark as featured"}
                            >
                              {partner.is_featured ? (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPartner(partner)}
                              className="text-gray-600 hover:text-[#1A4B84]"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(partner)}
                              className="text-gray-600 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <a 
                              href={`/partners/${partner.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1A4B84] hover:underline inline-flex items-center gap-1 text-sm px-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Contacts Row */}
                      {expandedPartner === partner.id && (
                        <tr key={`${partner.id}-contacts`} className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="bg-white rounded-lg border p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Contacts for {partner.name}
                                </h3>
                                <Button
                                  size="sm"
                                  onClick={() => setEditingContact({ 
                                    isNew: true, 
                                    partner_id: partner.id,
                                    is_primary: (contacts[partner.id]?.length || 0) === 0
                                  })}
                                  className="bg-[#1A4B84] hover:bg-[#1A4B84]/90"
                                >
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Add Contact
                                </Button>
                              </div>
                              {contacts[partner.id]?.length === 0 ? (
                                <p className="text-gray-500 text-sm">No contacts yet. Add one to get started.</p>
                              ) : (
                                <div className="grid gap-3">
                                  {contacts[partner.id]?.map((contact) => (
                                    <div 
                                      key={contact.id} 
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        contact.is_primary ? 'bg-[#3BB4C1]/5 border-[#3BB4C1]/30' : 'bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#1A4B84] flex items-center justify-center text-white font-medium">
                                          {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900 flex items-center gap-2">
                                            {contact.first_name} {contact.last_name}
                                            {contact.is_primary && (
                                              <Badge className="bg-[#3BB4C1] text-white text-xs">Primary</Badge>
                                            )}
                                          </div>
                                          {contact.position && (
                                            <div className="text-sm text-gray-600">{contact.position}</div>
                                          )}
                                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                            {contact.email && (
                                              <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-[#1A4B84]">
                                                <Mail className="w-3 h-3" /> {contact.email}
                                              </a>
                                            )}
                                            {contact.phone && (
                                              <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-[#1A4B84]">
                                                <Phone className="w-3 h-3" /> {contact.phone}
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => togglePrimaryContact(contact)}
                                          className="text-gray-600 hover:text-[#3BB4C1]"
                                          title={contact.is_primary ? "Remove primary" : "Set as primary"}
                                        >
                                          {contact.is_primary ? (
                                            <Star className="w-4 h-4 fill-[#3BB4C1] text-[#3BB4C1]" />
                                          ) : (
                                            <StarOff className="w-4 h-4" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setEditingContact(contact)}
                                          className="text-gray-600 hover:text-[#1A4B84]"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setDeleteContactConfirm(contact)}
                                          className="text-gray-600 hover:text-red-500"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit/Add Partner Dialog */}
      <Dialog open={!!editingPartner} onOpenChange={() => { setEditingPartner(null); setLogoFile(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPartner?.isNew ? "Add New Partner" : `Edit ${editingPartner?.name}`}
            </DialogTitle>
            <DialogDescription>
              {editingPartner?.isNew 
                ? "Add a new partner to your directory" 
                : "Update partner information"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Logo */}
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-sm font-medium text-right pt-2">Logo</label>
              <div className="col-span-3">
                <div className="flex items-center gap-4">
                  {(logoFile || editingPartner?.logo_url) ? (
                    <img 
                      src={logoFile ? URL.createObjectURL(logoFile) : editingPartner?.logo_url || ''}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain bg-gray-100 rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="max-w-[250px]"
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Name *</label>
              <Input
                className="col-span-3"
                value={editingPartner?.name || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Partner name"
              />
            </div>

            {/* Website */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Website</label>
              <Input
                className="col-span-3"
                value={editingPartner?.website || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { ...prev, website: e.target.value } : null)}
                placeholder="https://example.com"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Status</label>
              <Select
                value={editingPartner?.status || 'Researching'}
                onValueChange={(value) => setEditingPartner(prev => prev ? { ...prev, status: value } : null)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Partnership Types */}
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-sm font-medium text-right pt-2">Partnership Types</label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {PARTNERSHIP_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={editingPartner?.partnership_types?.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingPartner(prev => {
                        if (!prev) return null;
                        const types = prev.partnership_types || [];
                        return {
                          ...prev,
                          partnership_types: types.includes(type)
                            ? types.filter(t => t !== type)
                            : [...types, type]
                        };
                      });
                    }}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-sm font-medium text-right pt-2">Industries</label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {INDUSTRIES.map((industry) => (
                  <Badge
                    key={industry}
                    variant={editingPartner?.industries?.includes(industry) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingPartner(prev => {
                        if (!prev) return null;
                        const industries = prev.industries || [];
                        return {
                          ...prev,
                          industries: industries.includes(industry)
                            ? industries.filter(i => i !== industry)
                            : [...industries, industry]
                        };
                      });
                    }}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-sm font-medium text-right pt-2">About</label>
              <Textarea
                className="col-span-3"
                rows={3}
                value={editingPartner?.about || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { ...prev, about: e.target.value } : null)}
                placeholder="Brief description of the partner..."
              />
            </div>

            {/* Notes */}
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-sm font-medium text-right pt-2">Internal Notes</label>
              <Textarea
                className="col-span-3"
                rows={2}
                value={editingPartner?.notes || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="Internal notes (not visible to public)..."
              />
            </div>

            {/* Referral Percentages */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Referral TO %</label>
              <Input
                type="number"
                className="col-span-1"
                value={editingPartner?.referral_to_percent || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { 
                  ...prev, 
                  referral_to_percent: e.target.value ? Number(e.target.value) : null 
                } : null)}
                placeholder="0"
              />
              <label className="text-sm font-medium text-right">Referral FROM %</label>
              <Input
                type="number"
                className="col-span-1"
                value={editingPartner?.referral_from_percent || ''}
                onChange={(e) => setEditingPartner(prev => prev ? { 
                  ...prev, 
                  referral_from_percent: e.target.value ? Number(e.target.value) : null 
                } : null)}
                placeholder="0"
              />
            </div>

            {/* Featured & Active */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Options</label>
              <div className="col-span-3 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPartner?.is_featured || false}
                    onChange={(e) => setEditingPartner(prev => prev ? { ...prev, is_featured: e.target.checked } : null)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Featured Partner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPartner?.is_active !== false}
                    onChange={(e) => setEditingPartner(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Active (visible on site)</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingPartner(null); setLogoFile(null); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePartner} 
              disabled={saving || !editingPartner?.name}
              className="bg-[#1A4B84] hover:bg-[#1A4B84]/90"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Partner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Partner Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? 
              This will also delete all associated contacts. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePartner}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact?.isNew ? "Add New Contact" : "Edit Contact"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">First Name</label>
                <Input
                  value={editingContact?.first_name || ''}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Last Name</label>
                <Input
                  value={editingContact?.last_name || ''}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                value={editingContact?.email || ''}
                onChange={(e) => setEditingContact(prev => prev ? { ...prev, email: e.target.value } : null)}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input
                value={editingContact?.phone || ''}
                onChange={(e) => setEditingContact(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="(555) 555-5555"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Position/Title</label>
              <Input
                value={editingContact?.position || ''}
                onChange={(e) => setEditingContact(prev => prev ? { ...prev, position: e.target.value } : null)}
                placeholder="Account Manager"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                rows={2}
                value={editingContact?.notes || ''}
                onChange={(e) => setEditingContact(prev => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="Notes about this contact..."
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingContact?.is_primary || false}
                onChange={(e) => setEditingContact(prev => prev ? { ...prev, is_primary: e.target.checked } : null)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Primary Contact</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContact(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveContact} 
              disabled={saving}
              className="bg-[#1A4B84] hover:bg-[#1A4B84]/90"
            >
              {saving ? "Saving..." : "Save Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation */}
      <Dialog open={!!deleteContactConfirm} onOpenChange={() => setDeleteContactConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteContactConfirm?.first_name} {deleteContactConfirm?.last_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteContactConfirm(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteContact}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={csvImportOpen} onOpenChange={(open) => { 
        setCsvImportOpen(open); 
        if (!open) { setCsvFile(null); setImportResult(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with contacts. Required columns: partner_name (must match existing partner).
              Optional: first_name, last_name, email, phone, position, notes.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="max-w-[300px] mx-auto"
              />
              {csvFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {csvFile.name} ({Math.round(csvFile.size / 1024)}KB)
                </p>
              )}
            </div>

            {importResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                importResult.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className="font-medium">
                  {importResult.imported > 0 ? '✓ Import Complete' : '✗ Import Failed'}
                </p>
                <p className="text-sm mt-1">
                  {importResult.imported} imported, {importResult.skipped} skipped
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">CSV Template:</p>
              <code className="text-xs text-gray-600 block">
                partner_name,first_name,last_name,email,phone,position<br/>
                Multiplier,John,Smith,john@multiplier.com,555-1234,Account Manager
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCsvImportOpen(false); setCsvFile(null); setImportResult(null); }}>
              Close
            </Button>
            <Button 
              onClick={handleCsvImport} 
              disabled={importing || !csvFile}
              className="bg-[#1A4B84] hover:bg-[#1A4B84]/90"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Contacts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
