-- Rise Next platform: initial schema
-- Enums
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN','ORG_ADMIN','PROJECT_ADMIN','SALES_MANAGER','SALES_EXECUTIVE','CONTENT_MANAGER','VIEWER');
CREATE TYPE "ProjectType" AS ENUM ('PLOTTED','VILLA','APARTMENT','MIXED','COMMERCIAL','TOWNSHIP');
CREATE TYPE "ProjectStatus" AS ENUM ('UPCOMING','PRE_LAUNCH','LAUNCHED','UNDER_CONSTRUCTION','READY_TO_MOVE','COMPLETED','ARCHIVED');
CREATE TYPE "UnitType" AS ENUM ('PLOT','VILLA','APARTMENT','COMMERCIAL');
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE','RESERVED','SOLD','BLOCKED','HOLD');
CREATE TYPE "Facing" AS ENUM ('NORTH','SOUTH','EAST','WEST','NORTH_EAST','NORTH_WEST','SOUTH_EAST','SOUTH_WEST');
CREATE TYPE "MediaKind" AS ENUM ('IMAGE','VIDEO','DRONE_VIDEO','CONSTRUCTION','PANORAMA_360','WALKTHROUGH','RENDER','DOCUMENT');
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT','TESTING','PUBLISHED','ARCHIVED');
CREATE TYPE "ObjectKind" AS ENUM ('UNIT','BUILDING','AMENITY','ROAD','LANDSCAPE','ENTRANCE','OTHER');
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE_ENQUIRY','CALLBACK','SITE_VISIT','GET_PRICE','BROCHURE','WHATSAPP','WALK_IN','PHONE','META_ADS','GOOGLE_ADS','OTHER');
CREATE TYPE "LeadStatus" AS ENUM ('NEW','CONTACTED','INTERESTED','SITE_VISIT','NEGOTIATION','CONVERTED','LOST');
CREATE TYPE "VisitStatus" AS ENUM ('REQUESTED','CONFIRMED','RESCHEDULED','COMPLETED','CANCELLED','NO_SHOW');

-- Tables
CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "slug" TEXT NOT NULL UNIQUE, "logoUrl" TEXT, "website" TEXT, "phone" TEXT, "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'VIEWER', "phone" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "organizationId" TEXT REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Project" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL, "slug" TEXT NOT NULL UNIQUE, "tagline" TEXT, "description" TEXT,
  "type" "ProjectType" NOT NULL DEFAULT 'PLOTTED', "status" "ProjectStatus" NOT NULL DEFAULT 'LAUNCHED',
  "isPublished" BOOLEAN NOT NULL DEFAULT false, "domain" TEXT UNIQUE,
  "logoUrl" TEXT, "coverImageUrl" TEXT, "coverVideoUrl" TEXT, "brandColor" TEXT NOT NULL DEFAULT '#0f766e',
  "developerName" TEXT, "reraNumber" TEXT, "totalAreaText" TEXT, "totalUnits" INTEGER, "configuration" TEXT, "possessionText" TEXT,
  "startingPrice" DECIMAL(14,2), "priceUnitLabel" TEXT NOT NULL DEFAULT 'Sq. Yd', "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[], "brochureUrl" TEXT,
  "addressLine" TEXT, "city" TEXT, "state" TEXT, "pincode" TEXT, "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION, "mapEmbedUrl" TEXT,
  "salesPhone" TEXT, "whatsappNumber" TEXT, "salesEmail" TEXT,
  "seoTitle" TEXT, "seoDescription" TEXT, "ogImageUrl" TEXT,
  "ga4Id" TEXT, "gtmId" TEXT, "metaPixelId" TEXT, "gadsConversionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

CREATE TABLE "ProjectMember" (
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY ("userId","projectId")
);

CREATE TABLE "ProjectPhase" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL, "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "Building" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "phaseId" TEXT REFERENCES "ProjectPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "name" TEXT NOT NULL, "code" TEXT NOT NULL, "floors" INTEGER NOT NULL DEFAULT 1, "unitsPerFloor" INTEGER, "description" TEXT, "objectKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("projectId","code")
);

CREATE TABLE "FloorPlan" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL, "imageUrl" TEXT, "pdfUrl" TEXT, "area" DECIMAL(12,2), "areaUnit" TEXT NOT NULL DEFAULT 'Sq. Ft',
  "bedrooms" INTEGER, "bathrooms" INTEGER, "balconies" INTEGER, "parking" INTEGER, "specs" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Unit" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "phaseId" TEXT REFERENCES "ProjectPhase"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "buildingId" TEXT REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "type" "UnitType" NOT NULL DEFAULT 'PLOT', "number" TEXT NOT NULL, "floor" INTEGER,
  "area" DECIMAL(12,2) NOT NULL, "areaUnit" TEXT NOT NULL DEFAULT 'Sq. Yd', "dimensions" TEXT, "facing" "Facing",
  "bedrooms" INTEGER, "bathrooms" INTEGER, "balconies" INTEGER, "parking" INTEGER,
  "price" DECIMAL(14,2), "pricePerUnit" DECIMAL(12,2), "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
  "isCorner" BOOLEAN NOT NULL DEFAULT false, "description" TEXT, "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "floorPlanId" TEXT REFERENCES "FloorPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("projectId","number")
);
CREATE INDEX "Unit_projectId_status_idx" ON "Unit"("projectId","status");

CREATE TABLE "Amenity" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "name" TEXT NOT NULL, "icon" TEXT, "description" TEXT, "imageUrl" TEXT, "objectKey" TEXT, "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "ProjectUpdate" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" TEXT NOT NULL, "body" TEXT, "date" TIMESTAMP(3) NOT NULL, "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Media" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "unitId" TEXT REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "updateId" TEXT REFERENCES "ProjectUpdate"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE', "url" TEXT NOT NULL, "thumbnailUrl" TEXT, "title" TEXT, "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Media_projectId_kind_idx" ON "Media"("projectId","kind");

CREATE TABLE "Landmark" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "category" TEXT NOT NULL, "name" TEXT NOT NULL, "distanceKm" DOUBLE PRECISION, "minutes" INTEGER, "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "ThreeDAsset" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "version" INTEGER NOT NULL, "name" TEXT NOT NULL, "fileUrl" TEXT, "fileSizeKb" INTEGER,
  "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT', "cameraJson" JSONB, "notes" TEXT, "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("projectId","version")
);

CREATE TABLE "ThreeDObject" (
  "id" TEXT PRIMARY KEY, "assetId" TEXT NOT NULL REFERENCES "ThreeDAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "objectKey" TEXT NOT NULL, "kind" "ObjectKind" NOT NULL DEFAULT 'UNIT',
  "unitId" TEXT REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "amenityId" TEXT REFERENCES "Amenity"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "geomJson" JSONB, "labelPos" JSONB,
  UNIQUE ("assetId","objectKey")
);

CREATE TABLE "Lead" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "unitId" TEXT REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "email" TEXT, "message" TEXT,
  "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE_ENQUIRY', "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "utmSource" TEXT, "utmMedium" TEXT, "utmCampaign" TEXT, "utmContent" TEXT, "referrer" TEXT, "landingPage" TEXT,
  "assignedToId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE, "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Lead_projectId_status_idx" ON "Lead"("projectId","status");
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

CREATE TABLE "LeadNote" (
  "id" TEXT PRIMARY KEY, "leadId" TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "authorName" TEXT NOT NULL, "body" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SiteVisit" (
  "id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "leadId" TEXT REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "unitId" TEXT REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "email" TEXT, "preferredDate" TIMESTAMP(3) NOT NULL, "preferredTime" TEXT NOT NULL,
  "status" "VisitStatus" NOT NULL DEFAULT 'REQUESTED',
  "assignedToId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "SiteVisit_projectId_status_idx" ON "SiteVisit"("projectId","status");

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "userName" TEXT NOT NULL, "entity" TEXT NOT NULL, "entityId" TEXT NOT NULL, "entityLabel" TEXT, "action" TEXT NOT NULL,
  "before" JSONB, "after" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity","entityId");
CREATE INDEX "AuditLog_projectId_createdAt_idx" ON "AuditLog"("projectId","createdAt");
