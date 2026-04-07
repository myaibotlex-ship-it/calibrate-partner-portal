import { createServerClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const partnerId = formData.get("partner_id") as string;
    const partnerSlug = formData.get("partner_slug") as string;
    const documentName = formData.get("document_name") as string;

    if (!file || !partnerId || !partnerSlug || !documentName) {
      return NextResponse.json(
        { error: "Missing required fields: file, partner_id, partner_slug, document_name" },
        { status: 400 }
      );
    }

    // Upload file to Storage
    const ext = file.name.split(".").pop() || "pdf";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `documents/${partnerSlug}/${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("partner-assets")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("partner-assets")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Determine file type
    const fileType = ext.toLowerCase() === "pdf" ? "pdf"
      : ["doc", "docx"].includes(ext.toLowerCase()) ? "doc"
      : ["png", "jpg", "jpeg"].includes(ext.toLowerCase()) ? "image"
      : "file";

    // Fetch current company_resources
    const { data: partner, error: fetchError } = await supabase
      .from("partners")
      .select("company_resources")
      .eq("id", partnerId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch partner: ${fetchError.message}` },
        { status: 500 }
      );
    }

    const resources = partner.company_resources || [];
    resources.push({
      name: documentName,
      url: publicUrl,
      type: fileType,
      downloadable: true,
    });

    // Update partner record
    const { error: updateError } = await supabase
      .from("partners")
      .update({ company_resources: resources })
      .eq("id", partnerId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update partner: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: publicUrl, resources });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
