export interface ViewerUnit {
  id: string;
  type: "PLOT" | "VILLA" | "APARTMENT" | "COMMERCIAL";
  number: string;
  floor: number | null;
  area: number;
  areaUnit: string;
  dimensions: string | null;
  facing: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  pricePerUnit: number | null;
  status: "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED" | "HOLD";
  isCorner: boolean;
  description: string | null;
  features: string[];
  buildingId: string | null;
  floorPlanId: string | null;
}

export interface ViewerObject {
  objectKey: string;
  kind: "UNIT" | "BUILDING" | "AMENITY" | "ROAD" | "LANDSCAPE" | "ENTRANCE" | "OTHER";
  unitId: string | null;
  amenityId: string | null;
  geomJson: import("@/lib/demo-layout").Geom | null;
}

export interface CameraView {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface ViewerAsset {
  id: string;
  version: number;
  name: string;
  fileUrl: string | null;
  cameraJson: { position?: number[]; target?: number[]; views?: CameraView[] } | null;
  objects: ViewerObject[];
}

export interface ViewerAmenity {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  objectKey: string | null;
}

export interface ViewerProject {
  id: string;
  slug: string;
  name: string;
  whatsappNumber: string | null;
  salesPhone: string | null;
  brandColor: string;
  priceUnitLabel: string;
}
