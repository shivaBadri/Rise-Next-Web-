/**
 * Procedural master-layout generator used for the demo project when no GLB
 * has been uploaded. Produces geometry in metres on the XZ plane.
 *
 * Geometry JSON shape (stored in ThreeDObject.geomJson):
 *   { shape: "box", position: [x, y, z], size: [w, h, d], rotationY?: number, color?: string }
 *   { shape: "cylinder", position, radius, height, color }
 *
 * The same object keys (plot_001 …) are what the 3D artist must use as
 * mesh names in the production GLB so the mapping stays valid.
 */

export type Geom =
  | { shape: "box"; position: [number, number, number]; size: [number, number, number]; rotationY?: number; color?: string }
  | { shape: "cylinder"; position: [number, number, number]; radius: number; height: number; color?: string };

export interface DemoPlot {
  number: number;
  objectKey: string;
  area: number; // sq. yd
  dimensions: string;
  isCorner: boolean;
  geom: Geom;
}

export interface DemoLayout {
  plots: DemoPlot[];
  amenities: { objectKey: string; geom: Geom }[];
  roads: { objectKey: string; geom: Geom }[];
}

const YD2 = 0.836127; // 1 sq. yd in m²

export function generateDemoLayout(): DemoLayout {
  const plots: DemoPlot[] = [];
  const roads: DemoLayout["roads"] = [];
  const amenities: DemoLayout["amenities"] = [];

  // Four residential blocks: two rows of plots each, roads between.
  // Plot footprint: width along road (x) 9 m–12 m, depth (z) 14 m–21 m.
  // Layout (metres, XZ plane). North is -Z.
  //   z -130..-100 : amenity zone (clubhouse, pool, gym, park, play, sports)
  //   z  -92       : north ring road
  //   z  -84..-55  : block row A (2 rows of plots per block)
  //   z  -46       : cross road 1
  //   z  -38..-1   : block row B
  //   z    8       : cross road 2 (south)
  //   z   30..45   : temple, security cabin, entrance gate
  const blockConfigs = [
    { x0: -95, z0: -84, cols: 6, depth: 14, width: 9.6 },
    { x0: 15, z0: -84, cols: 6, depth: 14, width: 9.6 },
    { x0: -95, z0: -38, cols: 6, depth: 18, width: 11 },
    { x0: 15, z0: -38, cols: 6, depth: 18, width: 11 },
  ];

  let n = 1;
  for (const b of blockConfigs) {
    for (let row = 0; row < 2; row++) {
      for (let c = 0; c < b.cols; c++) {
        const w = b.width;
        const d = b.depth;
        const x = b.x0 + c * (w + 0.4) + w / 2;
        const z = b.z0 + row * (d + 0.4) + d / 2;
        const isCorner = c === 0 || c === b.cols - 1;
        const areaM2 = w * d * (isCorner ? 1.12 : 1);
        const areaYd = Math.round(areaM2 / YD2 / 5) * 5; // round to 5 yd
        const dims = `${Math.round(w / 0.3048)} x ${Math.round(d / 0.3048)} ft`;
        plots.push({
          number: n,
          objectKey: `plot_${String(n).padStart(3, "0")}`,
          area: areaYd,
          dimensions: dims,
          isCorner,
          geom: { shape: "box", position: [x, 0.4, z], size: [w - 0.6, 0.8, d - 0.6] },
        });
        n++;
      }
    }
  }

  // Roads
  const asphalt = "#3f3f46";
  roads.push({ objectKey: "road_main", geom: { shape: "box", position: [0, 0.05, -30], size: [14, 0.1, 150], color: asphalt } });
  roads.push({ objectKey: "road_ring_north", geom: { shape: "box", position: [0, 0.05, -92], size: [230, 0.1, 8], color: asphalt } });
  roads.push({ objectKey: "road_cross_01", geom: { shape: "box", position: [0, 0.05, -46], size: [230, 0.1, 8], color: asphalt } });
  roads.push({ objectKey: "road_cross_02", geom: { shape: "box", position: [0, 0.05, 8], size: [230, 0.1, 8], color: asphalt } });
  roads.push({ objectKey: "road_ring_west", geom: { shape: "box", position: [-111, 0.05, -42], size: [8, 0.1, 108], color: asphalt } });
  roads.push({ objectKey: "road_ring_east", geom: { shape: "box", position: [111, 0.05, -42], size: [8, 0.1, 108], color: asphalt } });

  // Amenity zone (north of ring road)
  amenities.push({ objectKey: "clubhouse", geom: { shape: "box", position: [-70, 5, -114], size: [34, 10, 22], color: "#c9a16b" } });
  amenities.push({ objectKey: "swimming_pool", geom: { shape: "box", position: [-38, 0.4, -110], size: [22, 0.8, 9], color: "#38bdf8" } });
  amenities.push({ objectKey: "gym", geom: { shape: "box", position: [-38, 3.5, -124], size: [14, 7, 10], color: "#d6b98c" } });
  amenities.push({ objectKey: "park_01", geom: { shape: "box", position: [50, 0.25, -115], size: [90, 0.5, 32], color: "#4ade80" } });
  amenities.push({ objectKey: "play_area", geom: { shape: "box", position: [25, 0.7, -122], size: [18, 1.2, 8], color: "#fb923c" } });
  amenities.push({ objectKey: "sports_01", geom: { shape: "box", position: [70, 0.6, -110], size: [30, 1, 14], color: "#f97316" } });

  // Entrance zone (south)
  amenities.push({ objectKey: "temple", geom: { shape: "cylinder", position: [-30, 4, 30], radius: 6, height: 8, color: "#fde68a" } });
  amenities.push({ objectKey: "security_cabin", geom: { shape: "box", position: [12, 2, 36], size: [6, 4, 5], color: "#e5e7eb" } });
  amenities.push({ objectKey: "entrance", geom: { shape: "box", position: [0, 7, 44], size: [26, 14, 2], color: "#a8a29e" } });

  return { plots, amenities, roads };
}
