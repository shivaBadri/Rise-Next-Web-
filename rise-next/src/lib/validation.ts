import { z } from "zod";

const phone = z.string().trim().regex(/^\+?[0-9\s-]{8,15}$/, "Enter a valid phone number");

export const leadSchema = z.object({
  projectId: z.string().min(1),
  unitId: z.string().optional().nullable(),
  name: z.string().trim().min(2).max(80),
  phone,
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
  source: z.enum(["WEBSITE_ENQUIRY", "CALLBACK", "GET_PRICE", "BROCHURE", "WHATSAPP", "OTHER"]).default("WEBSITE_ENQUIRY"),
  utm: z.object({
    source: z.string().optional(), medium: z.string().optional(),
    campaign: z.string().optional(), content: z.string().optional(),
  }).optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
  website: z.string().max(0).optional(), // honeypot
});

export const siteVisitSchema = z.object({
  projectId: z.string().min(1),
  unitId: z.string().optional().nullable(),
  name: z.string().trim().min(2).max(80),
  phone,
  email: z.string().trim().email().optional().or(z.literal("")),
  preferredDate: z.string().min(8),
  preferredTime: z.string().min(2).max(20),
  website: z.string().max(0).optional(),
});

export const unitSchema = z.object({
  type: z.enum(["PLOT", "VILLA", "APARTMENT", "COMMERCIAL"]),
  number: z.string().trim().min(1).max(20),
  buildingId: z.string().optional().nullable(),
  floor: z.coerce.number().int().optional().nullable(),
  area: z.coerce.number().positive(),
  areaUnit: z.string().default("Sq. Yd"),
  dimensions: z.string().optional().nullable(),
  facing: z.enum(["NORTH", "SOUTH", "EAST", "WEST", "NORTH_EAST", "NORTH_WEST", "SOUTH_EAST", "SOUTH_WEST"]).optional().nullable(),
  bedrooms: z.coerce.number().int().optional().nullable(),
  bathrooms: z.coerce.number().int().optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
  pricePerUnit: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "BLOCKED", "HOLD"]),
  isCorner: z.coerce.boolean().default(false),
  description: z.string().optional().nullable(),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.enum(["PLOTTED", "VILLA", "APARTMENT", "MIXED", "COMMERCIAL", "TOWNSHIP"]),
  status: z.enum(["UPCOMING", "PRE_LAUNCH", "LAUNCHED", "UNDER_CONSTRUCTION", "READY_TO_MOVE", "COMPLETED", "ARCHIVED"]),
  isPublished: z.coerce.boolean().default(false),
  brandColor: z.string().default("#0f766e"),
  developerName: z.string().optional().nullable(),
  reraNumber: z.string().optional().nullable(),
  totalAreaText: z.string().optional().nullable(),
  totalUnits: z.coerce.number().int().optional().nullable(),
  configuration: z.string().optional().nullable(),
  possessionText: z.string().optional().nullable(),
  startingPrice: z.coerce.number().optional().nullable(),
  priceUnitLabel: z.string().default("Sq. Yd"),
  highlights: z.string().optional(), // newline-separated in form
  brochureUrl: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  coverVideoUrl: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  salesPhone: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  salesEmail: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  ga4Id: z.string().optional().nullable(),
  gtmId: z.string().optional().nullable(),
  metaPixelId: z.string().optional().nullable(),
  gadsConversionId: z.string().optional().nullable(),
});
