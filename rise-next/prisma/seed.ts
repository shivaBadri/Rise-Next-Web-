/**
 * Seed: one organization, one demo project ("Arising Future City"),
 * 48 plots laid out on a procedural master plan, amenities, landmarks,
 * a published 3D asset (v1) with object→unit mapping, sample leads.
 *
 * Run: npm run db:seed
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { generateDemoLayout } from "../src/lib/demo-layout";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@risenext.in";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  const org = await prisma.organization.upsert({
    where: { slug: "arising-developers" },
    update: {},
    create: {
      name: "Arising Developers Pvt. Ltd.",
      slug: "arising-developers",
      phone: "+91 98765 43210",
      email: "sales@arisingdevelopers.in",
      website: "https://arisingdevelopers.in",
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: "Rise Next Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  const salesHash = await bcrypt.hash("Sales@12345", 10);
  const sales = await prisma.user.upsert({
    where: { email: "sales@arisingdevelopers.in" },
    update: {},
    create: {
      email: "sales@arisingdevelopers.in",
      name: "Priya Sharma",
      passwordHash: salesHash,
      role: "SALES_MANAGER",
      phone: "+91 98765 00001",
      organizationId: org.id,
    },
  });

  // Fresh project each seed
  await prisma.project.deleteMany({ where: { slug: "arising-future-city" } });

  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: "Arising Future City",
      slug: "arising-future-city",
      tagline: "HMDA-approved plots on the Bengaluru Highway growth corridor",
      description:
        "Arising Future City is a 52-acre gated plotted community designed for families who want space, greenery and long-term appreciation. Wide 40 ft black-top roads, underground electricity, a 25,000 sq. ft. clubhouse and 8 acres of open parks make it one of the most complete plotted developments on the Shadnagar stretch.",
      type: "PLOTTED",
      status: "UNDER_CONSTRUCTION",
      isPublished: true,
      brandColor: "#0f766e",
      developerName: "Arising Developers Pvt. Ltd.",
      reraNumber: "P02400001234",
      totalAreaText: "52 Acres",
      totalUnits: 48,
      configuration: "150 – 300 Sq. Yd Plots",
      possessionText: "Immediate registration · Layout ready by Mar 2027",
      startingPrice: 3250000,
      priceUnitLabel: "Sq. Yd",
      highlights: [
        "HMDA approved layout",
        "40 ft & 60 ft black-top roads",
        "25,000 sq. ft. clubhouse",
        "Underground electrical cabling",
        "8 acres of parks and landscaping",
        "Compound wall with 24×7 security",
        "10 minutes from Shadnagar railway station",
        "Bank loans available",
      ],
      brochureUrl: "https://example.com/arising-future-city-brochure.pdf",
      addressLine: "Survey No. 112, Bengaluru Highway, Shadnagar",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "509216",
      latitude: 17.0836,
      longitude: 78.2069,
      salesPhone: "+919876543210",
      whatsappNumber: "919876543210",
      salesEmail: "sales@arisingdevelopers.in",
      seoTitle: "Arising Future City – HMDA Plots in Shadnagar, Hyderabad",
      seoDescription:
        "Explore Arising Future City in interactive 3D. HMDA-approved 150–300 sq. yd plots starting ₹32.5 Lakhs on the Bengaluru Highway, Shadnagar. Check live availability and book a site visit.",
      coverImageUrl:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80",
      members: { create: [{ userId: sales.id }] },
      amenities: {
        create: [
          { name: "Clubhouse", icon: "🏛️", description: "25,000 sq. ft. with banquet hall, indoor games and café", objectKey: "clubhouse", order: 1 },
          { name: "Swimming Pool", icon: "🏊", description: "Semi-olympic pool with kids' pool", objectKey: "swimming_pool", order: 2 },
          { name: "Gym", icon: "🏋️", description: "Fully equipped fitness centre", objectKey: "gym", order: 3 },
          { name: "Children's Play Area", icon: "🛝", description: "Rubber-floored play zone", objectKey: "play_area", order: 4 },
          { name: "Central Park", icon: "🌳", description: "3-acre landscaped park with jogging track", objectKey: "park_01", order: 5 },
          { name: "Sports Arena", icon: "🎾", description: "Tennis, badminton and cricket practice nets", objectKey: "sports_01", order: 6 },
          { name: "Temple", icon: "🛕", description: "Community temple at the entrance plaza", objectKey: "temple", order: 7 },
          { name: "24×7 Security", icon: "🛡️", description: "Gated entry with CCTV and security cabin", objectKey: "security_cabin", order: 8 },
        ],
      },
      landmarks: {
        create: [
          { category: "Railway", name: "Shadnagar Railway Station", distanceKm: 4.2, minutes: 10, order: 1 },
          { category: "Airport", name: "Rajiv Gandhi International Airport", distanceKm: 32, minutes: 35, order: 2 },
          { category: "School", name: "Delhi Public School, Shamshabad", distanceKm: 18, minutes: 22, order: 3 },
          { category: "Hospital", name: "Apollo Hospital, Shadnagar", distanceKm: 5.5, minutes: 12, order: 4 },
          { category: "Road", name: "NH-44 Bengaluru Highway", distanceKm: 0.5, minutes: 2, order: 5 },
          { category: "IT Hub", name: "Fab City / Hardware Park", distanceKm: 20, minutes: 25, order: 6 },
          { category: "Shopping", name: "GSM Mall, Attapur", distanceKm: 40, minutes: 50, order: 7 },
        ],
      },
      media: {
        create: [
          { kind: "RENDER", url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80", title: "Master layout render", order: 1 },
          { kind: "IMAGE", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80", title: "Clubhouse elevation", order: 2 },
          { kind: "IMAGE", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80", title: "Entrance plaza", order: 3 },
          { kind: "CONSTRUCTION", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1600&q=80", title: "Road work – Sept 2026", order: 4 },
          { kind: "IMAGE", url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=80", title: "Central park", order: 5 },
          { kind: "IMAGE", url: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1600&q=80", title: "Sample villa on plot", order: 6 },
        ],
      },
      updates: {
        create: [
          { title: "Road development completed", body: "All 40 ft and 60 ft internal roads have been black-topped. Street lighting installation is under way.", date: new Date("2026-09-15") },
          { title: "Clubhouse construction started", body: "Foundation work for the 25,000 sq. ft. clubhouse has begun. Expected structure completion: March 2027.", date: new Date("2026-08-20") },
          { title: "Compound wall finished", body: "The 8 ft compound wall around the full 52-acre layout is complete.", date: new Date("2026-07-05") },
        ],
      },
    },
  });

  // --- Units + 3D mapping from procedural layout ---
  const layout = generateDemoLayout();
  const facings = ["EAST", "WEST", "NORTH", "SOUTH", "NORTH_EAST", "SOUTH_WEST"] as const;
  const statuses: Array<"AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED" | "HOLD"> = [
    "AVAILABLE", "AVAILABLE", "AVAILABLE", "SOLD", "AVAILABLE", "RESERVED",
    "AVAILABLE", "SOLD", "AVAILABLE", "AVAILABLE", "HOLD", "SOLD",
    "AVAILABLE", "AVAILABLE", "BLOCKED", "AVAILABLE", "SOLD", "AVAILABLE",
  ];

  const asset = await prisma.threeDAsset.create({
    data: {
      projectId: project.id,
      version: 1,
      name: "Master layout v1 (procedural demo)",
      fileUrl: null,
      status: "PUBLISHED",
      publishedAt: new Date(),
      notes: "Procedurally generated demo geometry. Replace fileUrl with the GLB produced by the 3D artist; object names must follow the naming standard.",
      cameraJson: {
        position: [0, 150, 130],
        target: [0, 0, -40],
        views: [
          { name: "Overview", position: [0, 150, 130], target: [0, 0, -40] },
          { name: "Entrance", position: [0, 35, 120], target: [0, 0, 20] },
          { name: "Clubhouse", position: [-90, 40, -60], target: [-55, 0, -114] },
          { name: "Park", position: [90, 40, -60], target: [50, 0, -115] },
          { name: "Top view", position: [0, 280, -39], target: [0, 0, -40] },
        ],
      },
    },
  });

  let i = 0;
  for (const p of layout.plots) {
    const pricePerYd = p.area >= 250 ? 22000 : p.area >= 200 ? 21500 : 21000;
    const cornerPremium = p.isCorner ? 1.05 : 1;
    const price = Math.round(p.area * pricePerYd * cornerPremium);
    const unit = await prisma.unit.create({
      data: {
        projectId: project.id,
        type: "PLOT",
        number: String(p.number),
        area: p.area,
        areaUnit: "Sq. Yd",
        dimensions: p.dimensions,
        facing: facings[i % facings.length],
        price,
        pricePerUnit: Math.round(pricePerYd * cornerPremium),
        status: statuses[i % statuses.length],
        isCorner: p.isCorner,
        description: p.isCorner
          ? "Premium corner plot with two-side road access."
          : "Regular plot with 40 ft road frontage.",
        features: p.isCorner ? ["Corner plot", "Two-side road"] : ["40 ft road"],
      },
    });
    await prisma.threeDObject.create({
      data: {
        assetId: asset.id,
        objectKey: p.objectKey,
        kind: "UNIT",
        unitId: unit.id,
        geomJson: p.geom,
      },
    });
    i++;
  }

  // Amenity + other objects
  const amenities = await prisma.amenity.findMany({ where: { projectId: project.id } });
  for (const a of layout.amenities) {
    const am = amenities.find((x) => x.objectKey === a.objectKey);
    await prisma.threeDObject.create({
      data: {
        assetId: asset.id,
        objectKey: a.objectKey,
        kind: "AMENITY",
        amenityId: am?.id,
        geomJson: a.geom,
      },
    });
  }
  for (const r of layout.roads) {
    await prisma.threeDObject.create({
      data: { assetId: asset.id, objectKey: r.objectKey, kind: "ROAD", geomJson: r.geom },
    });
  }

  // Sample leads
  const units = await prisma.unit.findMany({ where: { projectId: project.id }, take: 5 });
  await prisma.lead.createMany({
    data: [
      { projectId: project.id, unitId: units[0].id, name: "Ravi Kumar", phone: "9812345678", email: "ravi@example.com", source: "WEBSITE_ENQUIRY", status: "NEW", utmSource: "google", utmCampaign: "plots-shadnagar", message: "Interested in east-facing plots." },
      { projectId: project.id, unitId: units[3].id, name: "Sneha Reddy", phone: "9898989898", source: "SITE_VISIT", status: "SITE_VISIT", utmSource: "facebook", utmCampaign: "sept-launch", assignedToId: sales.id },
      { projectId: project.id, name: "Mohammed Irfan", phone: "9700011122", source: "WHATSAPP", status: "CONTACTED", assignedToId: sales.id },
      { projectId: project.id, unitId: units[1].id, name: "Anitha B", phone: "9666677788", email: "anitha@example.com", source: "GET_PRICE", status: "INTERESTED" },
    ],
  });
  const lead = await prisma.lead.findFirst({ where: { name: "Sneha Reddy" } });
  await prisma.siteVisit.create({
    data: {
      projectId: project.id,
      leadId: lead?.id,
      unitId: units[3].id,
      name: "Sneha Reddy",
      phone: "9898989898",
      preferredDate: new Date(Date.now() + 3 * 86400000),
      preferredTime: "11:00 AM",
      status: "CONFIRMED",
      assignedToId: sales.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      projectId: project.id,
      userId: admin.id,
      userName: admin.name,
      entity: "ThreeDAsset",
      entityId: asset.id,
      entityLabel: asset.name,
      action: "PUBLISH",
      after: { status: "PUBLISHED", version: 1 },
    },
  });

  console.log(`Seeded project "${project.name}" with ${layout.plots.length} plots.`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Sales login: sales@arisingdevelopers.in / Sales@12345`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
