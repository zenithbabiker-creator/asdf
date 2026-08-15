import { Point2D, Point3D, SpatialAnchor3D, ARFrameSpatialContext } from '../types';

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
 * This effectively filters out normal-axis (depth/height) measurement jitter and noise.
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
  // Ensure normal points upwards (+Y)
  if (normal.y < 0) {
    return { x: -normal.x, y: -normal.y, z: -normal.z };
  }
  return normal;
}

/**
 * Projects 3D Anchor coordinates onto the local surface plane (u, v)
 * to remove z-axis / normal-axis coordinate noise prior to Shoelace calculation.
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
 * Precision Area Engine that calculates area, perimeter, and edge distances
 * directly from attached 3D Anchors on the surface plane.
 */
export function calculatePrecisionAreaFrom3DAnchors(anchors: Point3D[]): {
  areaM2: number;
  perimeterM: number;
  edgeLengthsM: number[];
  centroid3D: Point3D;
  surfaceNormal: Point3D;
} {
  if (anchors.length < 3) {
    return {
      areaM2: 0,
      perimeterM: 0,
      edgeLengthsM: [],
      centroid3D: { x: 0, y: 0, z: 0 },
      surfaceNormal: { x: 0, y: 1, z: 0 },
    };
  }

  // 1. Project 3D points onto local surface plane
  const { projected2D, centroid, normal } = projectPointsToLocalSurfacePlane(anchors);

  // 2. Compute exact Shoelace area on projected 2D plane
  const rawArea = calculateShoelaceArea(projected2D);
  const areaM2 = Math.round(rawArea * 1000) / 1000;

  // 3. Compute 3D edge lengths and perimeter
  const edgeLengthsM: number[] = [];
  let perimeterM = 0;
  for (let i = 0; i < anchors.length; i++) {
    const next = (i + 1) % anchors.length;
    const len = distance3D(anchors[i], anchors[next]);
    edgeLengthsM.push(Math.round(len * 100) / 100);
    perimeterM += len;
  }
  perimeterM = Math.round(perimeterM * 100) / 100;

  return {
    areaM2,
    perimeterM,
    edgeLengthsM,
    centroid3D: centroid,
    surfaceNormal: normal,
  };
}

/**
 * Raycasts 2D Screen Pixel (x, y) into 3D World Space against the cached ARFrame spatial matrix.
 * Keeps AR context intact even when the UI rendering surface is frozen.
 */
export function raycastScreenPointTo3DPlane(
  screenPoint: Point2D,
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number
): Point3D {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;

  const dy = (screenPoint.y - cy) / frameContext.intrinsics.focalLengthPx;
  const angleOffset = Math.atan(dy);
  const rayAngle = frameContext.cameraPitchRad + angleOffset;

  // Prevent division by zero / ray pointing at or above horizon
  const sinAngle = Math.max(0.08, Math.sin(rayAngle));
  const zDistanceM = frameContext.cameraHeightM / sinAngle;

  const dx = (screenPoint.x - cx) / frameContext.intrinsics.focalLengthPx;
  const xDistanceM = dx * zDistanceM;
  const yGroundM = -frameContext.cameraHeightM; // relative to camera optical center

  return {
    x: Math.round(xDistanceM * 1000) / 1000,
    y: Math.round(yGroundM * 1000) / 1000,
    z: Math.round(zDistanceM * 1000) / 1000,
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
  index: number
): SpatialAnchor3D {
  const worldPos = raycastScreenPointTo3DPlane(screenPoint, frameContext, viewportWidth, viewportHeight);

  return {
    id: `anchor_v${index}_${Date.now()}`,
    worldPosition: worldPos,
    planeNormal: { x: 0, y: 1, z: 0 },
    screenPoint: { ...screenPoint },
    timestamp: Date.now(),
    attachedTrackableId: 'plane_ground_horizontal_0',
  };
}
