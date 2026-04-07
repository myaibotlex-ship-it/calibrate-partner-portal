import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  ArrowLeft,
  ExternalLink,
  Star,
  Briefcase,
  Users,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  User,
  Download,
  Eye,
} from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = createServerClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("name, about")
    .eq("slug", params.slug)
    .single();

  if (!partner) {
    return { title: "Partner Not Found" };
  }

  return {
    title: `${partner.name} | Calibrate HCM Partner`,
    description: partner.about || `Learn about our partnership with ${partner.name}`,
  };
}

export default async function PartnerPage({ params }: Props) {
  const supabase = createServerClient();
  const { data: partner, error } = await supabase
    .from("partners")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !partner) {
    notFound();
  }

  // Fetch contacts for this partner
  const { data: contacts } = await supabase
    .from("partner_contacts")
    .select("*")
    .eq("partner_id", partner.id)
    .order("is_primary", { ascending: false });

  const partnershipColors: Record<string, string> = {
    "Refer TO": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    "Refer FROM": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  };

  const statusColors: Record<string, string> = {
    "Active Partnership": "bg-green-100 text-green-800",
    "In Discussion": "bg-yellow-100 text-yellow-800",
    "Researching": "bg-gray-100 text-gray-800",
    "Outreach Pending": "bg-orange-100 text-orange-800",
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Partners
          </Link>
        </div>
      </div>

      {/* Partner Header */}
      <section className="py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {partner.logo_url ? (
                <Image
                  src={partner.logo_url}
                  alt={`${partner.name} logo`}
                  width={128}
                  height={128}
                  className="object-contain"
                />
              ) : (
                <Building2 className="w-16 h-16 text-gray-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold">{partner.name}</h1>
                {partner.is_featured && (
                  <Badge className="bg-amber-500 text-white">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Featured Partner
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {partner.partnership_types.map((type: string) => (
                  <Badge
                    key={type}
                    className={partnershipColors[type] || ""}
                  >
                    {type}
                  </Badge>
                ))}
                <Badge className={statusColors[partner.status] || "bg-gray-100"}>
                  {partner.status}
                </Badge>
              </div>

              {partner.industries.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {partner.industries.map((ind: string) => (
                    <Badge key={ind} variant="outline">
                      {ind}
                    </Badge>
                  ))}
                </div>
              )}

              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Partner Details */}
      <section className="py-12">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {partner.about && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">About</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {partner.about}
                    </p>
                  </CardContent>
                </Card>
              )}

              {partner.calibrate_services_needed.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Calibrate Services
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Services Calibrate HCM provides in this partnership:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {partner.calibrate_services_needed.map((service: string) => (
                        <Badge key={service} variant="secondary" className="text-sm py-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {partner.engagement_types.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Engagement Model
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {partner.engagement_types.map((type: string) => (
                        <Badge key={type} variant="outline" className="text-sm py-1">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Contacts */}
              {contacts && contacts.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Key Contacts
                    </h2>
                    <div className="space-y-4">
                      {contacts.map((contact: { id: string; first_name: string; last_name: string; position?: string; email?: string; phone?: string; is_primary?: boolean }) => (
                        <div key={contact.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {contact.first_name?.[0]}{contact.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </p>
                              {contact.is_primary && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            {contact.position && (
                              <p className="text-sm text-muted-foreground">{contact.position}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm">
                              {contact.email && (
                                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-primary hover:underline">
                                  <Mail className="w-3 h-3" />
                                  {contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                  <Phone className="w-3 h-3" />
                                  {contact.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents & Resources */}
              {partner.company_resources && partner.company_resources.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documents & Resources
                    </h2>
                    <div className="space-y-2">
                      {partner.company_resources.map((resource: { name?: string; url: string; type?: string; downloadable?: boolean }, idx: number) => {
                        const isPdf = resource.type === "pdf" || resource.url?.endsWith(".pdf");
                        const isDoc = resource.type === "doc" || resource.type === "docx" || resource.url?.match(/\.docx?$/);
                        const fileType = resource.type?.toUpperCase() || (isPdf ? "PDF" : isDoc ? "DOC" : "LINK");
                        const badgeColor = isPdf ? "bg-red-100 text-red-700" : isDoc ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700";

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 font-medium text-sm">{resource.name || resource.url}</span>
                            <Badge variant="secondary" className={`text-xs ${badgeColor}`}>
                              {fileType}
                            </Badge>
                            {isPdf || isDoc ? (
                              <div className="flex items-center gap-1">
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4 text-muted-foreground" />
                                </a>
                                <a
                                  href={resource.url}
                                  download
                                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4 text-muted-foreground" />
                                </a>
                              </div>
                            ) : (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                title="Open link"
                              >
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Partnership Details</h3>
                  <dl className="space-y-3 text-sm">
                    {partner.industry_subcategory.length > 0 && (
                      <div>
                        <dt className="text-muted-foreground">Specialization</dt>
                        <dd className="font-medium">
                          {partner.industry_subcategory.join(", ")}
                        </dd>
                      </div>
                    )}
{/* Commission info moved to admin only */}
                  </dl>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Interested in partnering?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join our growing network of partners and expand your business reach.
                  </p>
                  <Link href="/become-partner">
                    <Button className="w-full">Become a Partner</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
