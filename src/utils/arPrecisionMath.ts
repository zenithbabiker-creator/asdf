import { 
  Point2D, 
  Point3D, 
  SpatialAnchor3D, 
  ARFrameSpatialContext, 
  ReferenceCalibrationObject, 
  CalibrationSettings,
  PrecisionPolygonResult
} from '../types';

/**
 * Standard Physical Reference Calibration Objects Library
 */
export const STANDARD_CALIBRATION_OBJECTS: ReferenceCalibrationObject[] = [
  {
    id: 'calib_a4',
    nameAr: 'ورقة A4 قياسية (21.0 × 29.7 سم)',
    category: 'paper',
    realWidthM: 0.210,
    realHeightM: 0.297,
    realAreaM2: 0.06237,
    descriptionAr: 'المعيار العالمي الأكثر انتشاراً للمعايرة الميدانية الفورية والدقيقة.',
  },
  {
    id: 'calib_tile_30',
    nameAr: 'بلاطة سيراميك أرضية (30 × 30 سم)',
    category: 'tile',
    realWidthM: 0.300,
    realHeightM: 0.300,
    realAreaM2: 0.090,
    descriptionAr: 'مناسبة للمعايرة المباشرة على الأسطح المبلطة والخرسانية المقسمة.',
  },
  {
    id: 'calib_tile_60',
    nameAr: 'بلاطة سيراميك أرضية كبيرة (60 × 60 سم)',
    category: 'tile',
    realWidthM: 0.600,
    realHeightM: 0.600,
    realAreaM2: 0.360,
    descriptionAr: 'معايرة عالية الدقة للمساحات الكبيرة والحدائق.',
  },
  {
    id: 'calib_card',
    nameAr: 'بطاقة هوية / بنكية (8.56 × 5.40 سم)',
    category: 'card',
    realWidthM: 0.0856,
    realHeightM: 0.05398,
    realAreaM2: 0.00462,
    descriptionAr: 'معيار حجم بطاقات الدفع والائتمان القياسية ISO/IEC 7810.',
  },
  {
    id: 'calib_ruler_1m',
    nameAr: 'شريط قياس متري (طول 1.0 متر)',
    category: 'ruler',
    realWidthM: 1.000,
    realHeightM: 0.050,
    realAreaM2: 0.050,
    descriptionAr: 'معايرة خطية مستقيمة باستخدام متر قياس حقيقي.',
  },
];

/**
 * Normalizes a 3D vector.
 */
export function normalize3D(v: Point3D): Point3D {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len < 1e-7) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Cross product of two 3D vectors.
 */
export function cross3D(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Dot product of two 3D vectors.
 */
export function dot3D(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Euclidean distance between two 3D points.
 */
export function distance3D(a: Point3D, b: Point3D): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

/**
 * Computes polygon normal using Newell's method for arbitrary 3D coplanar/near-coplanar polygons.
 * This filters out normal-axis (depth/height) measurement jitter and camera pitch inaccuracies.
 */
export function computePolygonNormalNewell(points: Point3D[]): Point3D {
  if (points.length < 3) return { x: 0, y: 1, z: 0 };

  let nx = 0;
  let ny = 0;
  let nz = 0;

  const n = points.length;
  for (let i = 0; i < n; i++) {
    const current = points[i];
    const next = points[(i + 1) % n];

    nx += (current.y - next.y) * (current.z + next.z);
    ny += (current.z - next.z) * (current.x + next.x);
    nz += (current.x - next.x) * (current.y + next.y);
  }

  const normal = normalize3D({ x: nx, y: ny, z: nz });
  // Ensure normal points upwards (+Y ground normal)
  if (normal.y < 0) {
    return { x: -normal.x, y: -normal.y, z: -normal.z };
  }
  return normal;
}

/**
 * Projects 3D Anchor coordinates onto the local surface plane (u, v)
 * to remove normal-axis coordinate noise prior to Shoelace calculation.
 */
export function projectPointsToLocalSurfacePlane(
  points3D: Point3D[],
  customNormal?: Point3D
): { projected2D: { u: number; v: number }[]; centroid: Point3D; normal: Point3D } {
  if (points3D.length === 0) {
    return { projected2D: [], centroid: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } };
  }

  // 1. Calculate centroid
  let sumX = 0, sumY = 0, sumZ = 0;
  points3D.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
    sumZ += p.z;
  });
  const count = points3D.length;
  const centroid: Point3D = {
    x: sumX / count,
    y: sumY / count,
    z: sumZ / count,
  };

  // 2. Determine best-fit surface plane normal
  const normal = customNormal ? normalize3D(customNormal) : computePolygonNormalNewell(points3D);

  // 3. Construct orthonormal basis (u, v) on the surface plane
  let referenceVec: Point3D = { x: 1, y: 0, z: 0 };
  if (Math.abs(dot3D(normal, referenceVec)) > 0.9) {
    referenceVec = { x: 0, y: 0, z: 1 };
  }

  const uAxis = normalize3D(cross3D(normal, referenceVec));
  const vAxis = normalize3D(cross3D(normal, uAxis));

  // 4. Project points relative to centroid along basis vectors (u, v)
  const projected2D = points3D.map((p) => {
    const diff = {
      x: p.x - centroid.x,
      y: p.y - centroid.y,
      z: p.z - centroid.z,
    };
    return {
      u: dot3D(diff, uAxis),
      v: dot3D(diff, vAxis),
    };
  });

  return { projected2D, centroid, normal };
}

/**
 * Executes the Gauss Shoelace Formula on 2D Projected coordinates:
 * Area = 0.5 * |sum(u_i * v_{i+1} - u_{i+1} * v_i)|
 */
export function calculateShoelaceArea(projectedPoints: { u: number; v: number }[]): number {
  const n = projectedPoints.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    area += projectedPoints[i].u * projectedPoints[next].v;
    area -= projectedPoints[next].u * projectedPoints[i].v;
  }

  return Math.abs(area) * 0.5;
}

/**
 * Computes the interior corner angles (in degrees) for each vertex in 3D polygon.
 */
export function computeCornerAnglesDeg(points3D: Point3D[]): number[] {
  const n = points3D.length;
  if (n < 3) return [];

  const angles: number[] = [];
  for (let i = 0; i < n; i++) {
    const prev = points3D[(i - 1 + n) % n];
    const curr = points3D[i];
    const next = points3D[(i + 1) % n];

    const v1 = normalize3D({ x: prev.x - curr.x, y: prev.y - curr.y, z: prev.z - curr.z });
    const v2 = normalize3D({ x: next.x - curr.x, y: next.y - curr.y, z: next.z - curr.z });

    const dot = Math.max(-1, Math.min(1, dot3D(v1, v2)));
    const angleRad = Math.acos(dot);
    angles.push(Math.round((angleRad * 180) / Math.PI));
  }
  return angles;
}

/**
 * Precision Area Engine that calculates area, perimeter, and edge distances
 * directly from attached 3D Anchors with optional scale correction multiplier.
 */
export function calculatePrecisionAreaFrom3DAnchors(
  anchors: Point3D[],
  scaleFactor = 1.0
): {
  areaM2: number;
  perimeterM: number;
  edgeLengthsM: number[];
  cornerAnglesDeg: number[];
  centroid3D: Point3D;
  surfaceNormal: Point3D;
} {
  if (anchors.length < 3) {
    return {
      areaM2: 0,
      perimeterM: 0,
      edgeLengthsM: [],
      cornerAnglesDeg: [],
      centroid3D: { x: 0, y: 0, z: 0 },
      surfaceNormal: { x: 0, y: 1, z: 0 },
    };
  }

  // 1. Project 3D points onto local surface plane
  const { projected2D, centroid, normal } = projectPointsToLocalSurfacePlane(anchors);

  // 2. Compute exact Shoelace area on projected 2D plane & apply squared scale factor
  const rawArea = calculateShoelaceArea(projected2D);
  const correctedArea = rawArea * (scaleFactor * scaleFactor);
  const areaM2 = Math.round(correctedArea * 1000) / 1000;

  // 3. Compute 3D edge lengths and perimeter with scale factor
  const edgeLengthsM: number[] = [];
  let perimeterM = 0;
  for (let i = 0; i < anchors.length; i++) {
    const next = (i + 1) % anchors.length;
    const len = distance3D(anchors[i], anchors[next]) * scaleFactor;
    edgeLengthsM.push(Math.round(len * 100) / 100);
    perimeterM += len;
  }
  perimeterM = Math.round(perimeterM * 100) / 100;

  // 4. Compute corner angles
  const cornerAnglesDeg = computeCornerAnglesDeg(anchors);

  return {
    areaM2,
    perimeterM,
    edgeLengthsM,
    cornerAnglesDeg,
    centroid3D: centroid,
    surfaceNormal: normal,
  };
}

/**
 * Raycasts 2D Screen Pixel (x, y) into 3D World Space against the ARFrame spatial matrix.
 * Accurately models device tilt pitch & roll angles, physical camera height, and perspective unprojection.
 */
export function raycastScreenPointTo3DPlane(
  screenPoint: Point2D,
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  rollRad = 0.0
): Point3D {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;

  // 1. Apply roll compensation if lateral tilt is present
  let px = screenPoint.x - cx;
  let py = screenPoint.y - cy;

  if (Math.abs(rollRad) > 0.01) {
    const cosR = Math.cos(-rollRad);
    const sinR = Math.sin(-rollRad);
    const rx = px * cosR - py * sinR;
    const ry = px * sinR + py * cosR;
    px = rx;
    py = ry;
  }

  // 2. Optical ray direction
  const focalLength = frameContext.intrinsics.focalLengthPx;
  const dy = py / focalLength;
  const angleOffset = Math.atan(dy);
  const rayAngle = frameContext.cameraPitchRad + angleOffset;

  // Prevent division by zero or rays at/above horizon (clamp to minimum 5 degrees)
  const clampedAngle = Math.max(0.087, Math.min(Math.PI / 2 - 0.02, rayAngle));
  const sinAngle = Math.sin(clampedAngle);
  const cosAngle = Math.cos(clampedAngle);

  // Depth along ground plane
  const zGroundDistanceM = (frameContext.cameraHeightM / sinAngle) * cosAngle;

  const dx = px / focalLength;
  const xDistanceM = dx * (frameContext.cameraHeightM / sinAngle);
  const yGroundM = -frameContext.cameraHeightM;

  return {
    x: Math.round(xDistanceM * 1000) / 1000,
    y: Math.round(yGroundM * 1000) / 1000,
    z: Math.round(zGroundDistanceM * 1000) / 1000,
  };
}

/**
 * Creates and attaches a permanent 3D Anchor object for a tapped vertex
 * against the cached spatial context.
 */
export function createSpatialAnchorFromTappedPoint(
  screenPoint: Point2D,
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  index: number,
  rollRad = 0.0
): SpatialAnchor3D {
  const worldPos = raycastScreenPointTo3DPlane(
    screenPoint, 
    frameContext, 
    viewportWidth, 
    viewportHeight, 
    rollRad
  );

  return {
    id: `anchor_v${index}_${Date.now()}`,
    worldPosition: worldPos,
    planeNormal: { x: 0, y: 1, z: 0 },
    screenPoint: { ...screenPoint },
    timestamp: Date.now(),
    attachedTrackableId: 'plane_ground_horizontal_0',
  };
}

/**
 * Calculates a Scale Correction Factor from a measured reference polygon against known real dimensions.
 * Example: User draws boundary around A4 paper -> Measured area 0.075m² vs Real 0.06237m² -> Factor = sqrt(0.06237/0.075) = 0.912
 */
export function computeCalibrationScaleFactor(
  measuredAreaM2: number,
  knownRealAreaM2: number
): number {
  if (measuredAreaM2 <= 1e-6 || knownRealAreaM2 <= 1e-6) return 1.0;
  const factor = Math.sqrt(knownRealAreaM2 / measuredAreaM2);
  // Clamp to reasonable calibration limits (0.3x to 3.0x)
  return Math.max(0.3, Math.min(3.0, Math.round(factor * 1000) / 1000));
}

/**
 * Calculates Scale Correction Factor from a single measured linear edge (e.g. 1m ruler).
 */
export function computeLinearCalibrationScaleFactor(
  measuredLengthM: number,
  knownRealLengthM: number
): number {
  if (measuredLengthM <= 1e-6 || knownRealLengthM <= 1e-6) return 1.0;
  const factor = knownRealLengthM / measuredLengthM;
  return Math.max(0.3, Math.min(3.0, Math.round(factor * 1000) / 1000));
}
