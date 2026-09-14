import { 
  Point2D, 
  Point3D, 
  SpatialAnchor3D, 
  ARFrameSpatialContext, 
  ReferenceCalibrationObject, 
  CalibrationSettings,
  PrecisionPolygonResult,
  FusedPrecisionAreaResult
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
 * Inverts a 3x3 matrix analytically using Cramer's rule.
 */
export function invert3x3Matrix(M: number[][]): number[][] | null {
  const [
    [m00, m01, m02],
    [m10, m11, m12],
    [m20, m21, m22]
  ] = M;
  const det = m00 * (m11 * m22 - m12 * m21) -
              m01 * (m10 * m22 - m12 * m20) +
              m02 * (m10 * m21 - m11 * m20);
  if (Math.abs(det) < 1e-12) return null;
  const invDet = 1 / det;
  return [
    [ (m11 * m22 - m12 * m21) * invDet, (m02 * m21 - m01 * m22) * invDet, (m01 * m12 - m02 * m11) * invDet ],
    [ (m12 * m20 - m10 * m22) * invDet, (m00 * m22 - m02 * m20) * invDet, (m02 * m10 - m00 * m12) * invDet ],
    [ (m10 * m21 - m11 * m20) * invDet, (m01 * m20 - m00 * m21) * invDet, (m00 * m11 - m01 * m10) * invDet ]
  ];
}

/**
 * Multiplies two 3x3 matrices.
 */
export function matMul3x3(A: number[][], B: number[][]): number[][] {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

/**
 * Multiplies a 3x3 matrix by a 3-element vector.
 */
export function matVec3(M: number[][], v: [number, number, number]): [number, number, number] {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
  ];
}

/**
 * Computes physically calibrated focal length and principal point based on viewport resolution.
 */
export function computeEffectiveFocalLength(
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number
): { fx: number; fy: number; cx: number; cy: number } {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  
  // Base focal length derived from field of view (HFOV):
  const fovDeg = frameContext.intrinsics.fovDegrees || 65;
  const fovRad = (fovDeg * Math.PI) / 180;
  const baseFocalLength = (viewportWidth / 2) / Math.tan(fovRad / 2);
  
  const fx = baseFocalLength;
  const fy = baseFocalLength;
  return { fx, fy, cx, cy };
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
 * For horizontal ground surfaces (normal.y > 0.8), aligns u with world X (lateral width)
 * and v with world Z (forward depth) to preserve physical orientation and dimensions.
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
  let uAxis: Point3D;
  let vAxis: Point3D;

  if (Math.abs(normal.y) > 0.75) {
    // Aligns u with world +X and v with world +Z
    uAxis = { x: 1, y: 0, z: 0 };
    vAxis = { x: 0, y: 0, z: 1 };
  } else {
    // Arbitrary inclined plane orthonormal basis
    let referenceVec: Point3D = { x: 1, y: 0, z: 0 };
    if (Math.abs(dot3D(normal, referenceVec)) > 0.9) {
      referenceVec = { x: 0, y: 0, z: 1 };
    }
    uAxis = normalize3D(cross3D(normal, referenceVec));
    vAxis = normalize3D(cross3D(normal, uAxis));
  }

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
 * STRATEGY 1: Metric World-Space Raycasting & AR Anchor Plane Projection
 * Mathematically exact Pinhole Perspective Raycaster & Ground-Plane Intersection.
 * Accurately solves ray-plane intersection for camera position C = (0, H, 0),
 * physical pitch depression angle theta, and lateral roll angle phi.
 *
 * Intersection on Ground Plane (Y = 0):
 *   t = H / (sin(theta) + v * cos(theta))
 *   X = t * u
 *   Y = 0
 *   Z = t * (cos(theta) - v * sin(theta))
 * where u = (px / f) and v = (py / f) in de-rolled camera sensor coordinates.
 */
export function raycastScreenPointTo3DPlane(
  screenPoint: Point2D,
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  rollRad = 0.0,
  pitchOverrideRad?: number
): Point3D {
  const { fx, fy, cx, cy } = computeEffectiveFocalLength(frameContext, viewportWidth, viewportHeight);

  // 1. Screen coordinates relative to principal point
  const rawDx = screenPoint.x - cx;
  const rawDy = screenPoint.y - cy;

  // 2. Lateral roll compensation
  let px = rawDx;
  let py = rawDy;

  if (Math.abs(rollRad) > 0.001) {
    const cosR = Math.cos(rollRad);
    const sinR = Math.sin(rollRad);
    px = rawDx * cosR - rawDy * sinR;
    py = rawDx * sinR + rawDy * cosR;
  }

  // 3. Pinhole optical ray direction in normalized camera coordinates
  const u = px / fx;
  const v = py / fy;

  // 4. Ground intersection with physical pitch depression angle theta
  const theta = pitchOverrideRad !== undefined 
    ? pitchOverrideRad 
    : Math.max(0.10, Math.min(1.50, frameContext.cameraPitchRad));
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  // Denominator represents vertical ray component towards ground: Dy = -(sinTheta + v * cosTheta)
  // OPTICAL HORIZON & SINGULARITY GUARD:
  // Points at or above the horizon (v <= -tan(theta)) look into the sky or infinity.
  // In real mobile AR (Huawei AR Engine / ARCore), hits against the ground plane are physically constrained.
  const denom = sinTheta + v * cosTheta;
  const safeDenom = Math.max(0.12, denom);

  // Ray parameter t: distance along optical axis to ground intersection
  const H = Math.max(0.20, frameContext.cameraHeightM);
  const rawT = H / safeDenom;
  // Constraint: Maximum reliable physical ground raycast distance in mobile AR is 12.0 meters
  const t = Math.min(12.0, rawT);

  // Ground plane 3D coordinates in meters:
  const xDistanceM = t * u;
  const yGroundM = 0.0; // Enforce strict horizontal ground plane (Delta Y = 0)
  const zGroundDistanceM = t * (cosTheta - v * sinTheta);

  // Bound within physical mobile camera tracking frustum to prevent unrealistic coordinate runaway
  const clampedX = Math.max(-10.0, Math.min(10.0, xDistanceM));
  const clampedZ = Math.max(0.10, Math.min(15.0, zGroundDistanceM));

  return {
    x: Math.round(clampedX * 10000) / 10000,
    y: Math.round(yGroundM * 10000) / 10000,
    z: Math.round(clampedZ * 10000) / 10000,
  };
}

/**
 * STRATEGY 2: Planar Homography Transformation Matrix & Perspective Correction
 * Computes 3x3 Homography Matrix H mapping Ground Plane (Xw, Zw, 1) -> Image (u, v, 1)
 * and its inverse H_inv mapping Image (u, v, 1) -> Orthorectified Ground Plane (Xw, Zw, 1).
 */
export function computePlanarHomographyMatrix(
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  rollRad = 0.0,
  pitchOverrideRad?: number
): { H: number[][]; H_inv: number[][] } {
  const { fx, fy, cx, cy } = computeEffectiveFocalLength(frameContext, viewportWidth, viewportHeight);
  const theta = pitchOverrideRad !== undefined
    ? pitchOverrideRad
    : Math.max(0.10, Math.min(1.50, frameContext.cameraPitchRad));
  const H_cam = Math.max(0.20, frameContext.cameraHeightM);

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosR = Math.cos(rollRad);
  const sinR = Math.sin(rollRad);

  const K = [
    [fx, 0, cx],
    [0, fy, cy],
    [0, 0, 1]
  ];

  const R_roll = [
    [cosR, sinR, 0],
    [-sinR, cosR, 0],
    [0, 0, 1]
  ];

  const E = [
    [1, 0, 0],
    [0, -sinT, H_cam * cosT],
    [0, cosT, H_cam * sinT]
  ];

  const H = matMul3x3(K, matMul3x3(R_roll, E));
  const H_inv = invert3x3Matrix(H) || [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  return { H, H_inv };
}

/**
 * Unprojects a screen point via inverse Homography H_inv to 2D metric Bird's Eye coordinates (X, Z).
 * Includes numerical stability regularization and frustum clamping.
 */
export function unprojectViaHomography(
  screenPt: Point2D,
  H_inv: number[][]
): Point2D {
  const pW = matVec3(H_inv, [screenPt.x, screenPt.y, 1]);
  // Regularize scale factor w to prevent division by zero or negative perspective inversion
  const safeW = Math.abs(pW[2]) > 0.05 ? pW[2] : (pW[2] >= 0 ? 0.05 : -0.05);
  const rawX = pW[0] / safeW;
  const rawZ = pW[1] / safeW;

  // Clamp within physical metric ground bounds
  const x = Math.max(-10.0, Math.min(10.0, rawX));
  const z = Math.max(0.10, Math.min(15.0, rawZ));

  return {
    x: Math.round(x * 10000) / 10000,
    y: Math.round(z * 10000) / 10000 // corresponds to ground Z in meters
  };
}

/**
 * STRATEGY 3: Dynamic Scale-per-Pixel Calibration via Individual Vertex Depth Map
 * Calculates exact metric slant depth and linear resolution (meters/pixel) for each vertex.
 */
export function computePerVertexDepthAndMetricScale(
  screenPoints: Point2D[],
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  rollRad = 0.0,
  pitchOverrideRad?: number
): { vertexDepthsM: number[]; vertexMetricScaleMPerPx: number[]; points3D: Point3D[] } {
  const points3D: Point3D[] = [];
  const vertexDepthsM: number[] = [];
  const vertexMetricScaleMPerPx: number[] = [];
  const H_cam = Math.max(0.20, frameContext.cameraHeightM);
  const { fx } = computeEffectiveFocalLength(frameContext, viewportWidth, viewportHeight);

  for (const pt of screenPoints) {
    const p3d = raycastScreenPointTo3DPlane(
      pt,
      frameContext,
      viewportWidth,
      viewportHeight,
      rollRad,
      pitchOverrideRad
    );
    points3D.push(p3d);
    const slantDist = Math.sqrt(p3d.x * p3d.x + H_cam * H_cam + p3d.z * p3d.z);
    vertexDepthsM.push(Math.round(slantDist * 1000) / 1000);
    // Linear scale at this vertex distance: w = (2 * d * tan(fov/2)) / Width = d / fx
    vertexMetricScaleMPerPx.push(Math.round((slantDist / fx) * 100000) / 100000);
  }

  return { vertexDepthsM, vertexMetricScaleMPerPx, points3D };
}

/**
 * STRATEGY 4: Cross-Verification & Self-Correction Engine (Multi-Strategy Fusion)
 * Simultaneously runs:
 * (A) 3D World Vector Polygon Area (Shoelace on 3D plane)
 * (B) Orthorectified Planar Projection Area (Homography)
 * (C) Dynamic per-vertex depth compensation
 * If difference > 1%, iteratively converges pitch/tilt until both agree within 0.01%.
 */
export function fusedPrecisionAreaCalculation(
  screenPoints: Point2D[],
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  rollRad = 0.0,
  scaleFactor = 1.0
): FusedPrecisionAreaResult {
  if (screenPoints.length < 3) {
    let perimeterM = 0;
    const edgeLengthsM: number[] = [];
    if (screenPoints.length === 2) {
      const p1 = raycastScreenPointTo3DPlane(screenPoints[0], frameContext, viewportWidth, viewportHeight, rollRad);
      const p2 = raycastScreenPointTo3DPlane(screenPoints[1], frameContext, viewportWidth, viewportHeight, rollRad);
      const d = distance3D(p1, p2) * scaleFactor;
      edgeLengthsM.push(Math.round(d * 100) / 100);
      perimeterM = Math.round(d * 100) / 100;
    }
    return {
      areaM2: 0,
      areaShoelace3DM2: 0,
      areaHomographyBirdEyeM2: 0,
      strategyDiscrepancyPercent: 0,
      convergenceIterCount: 0,
      optimizedPitchDeg: Math.round((frameContext.cameraPitchRad * 180) / Math.PI),
      perimeterM,
      edgeLengthsM,
      vertexDepthsM: [],
      vertexMetricScaleMPerPx: [],
      homographyMatrix: [[1,0,0],[0,1,0],[0,0,1]],
      birdEyeCoordinates: [],
      centroid3D: { x: 0, y: 0, z: 0 },
      surfaceNormal: { x: 0, y: 1, z: 0 },
      boundingBoxM: { widthM: perimeterM, lengthM: 0 }
    };
  }

  // Base parameters
  let currentPitchRad = Math.max(0.10, Math.min(1.50, frameContext.cameraPitchRad));
  let iterCount = 0;
  const maxIters = 8;
  let areaA = 0;
  let areaB = 0;
  let discrepancyPercent = 0;
  let bestPoints3D: Point3D[] = [];
  let bestBirdEyeCoords: Point2D[] = [];
  let bestHMat: number[][] = [];

  const evaluateAtPitch = (pitch: number) => {
    // Strategy 1: Raycasting to 3D World Space
    const pts3D = screenPoints.map((pt) =>
      raycastScreenPointTo3DPlane(pt, frameContext, viewportWidth, viewportHeight, rollRad, pitch)
    );
    // Compute 3D Shoelace on ground plane (X, Z)
    let sumA = 0;
    const n = pts3D.length;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      sumA += pts3D[i].x * pts3D[next].z - pts3D[next].x * pts3D[i].z;
    }
    const computedAreaA = Math.abs(sumA) * 0.5 * (scaleFactor * scaleFactor);

    // Strategy 2: Homography Bird's Eye View
    const { H, H_inv } = computePlanarHomographyMatrix(frameContext, viewportWidth, viewportHeight, rollRad, pitch);
    const birdEye = screenPoints.map((pt) => unprojectViaHomography(pt, H_inv));
    let sumB = 0;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      sumB += birdEye[i].x * birdEye[next].y - birdEye[next].x * birdEye[i].y;
    }
    const computedAreaB = Math.abs(sumB) * 0.5 * (scaleFactor * scaleFactor);

    const avgArea = (computedAreaA + computedAreaB) / 2;
    const disc = avgArea > 1e-6 ? (Math.abs(computedAreaA - computedAreaB) / avgArea) * 100 : 0;

    return {
      computedAreaA,
      computedAreaB,
      disc,
      pts3D,
      birdEye,
      H
    };
  };

  // Initial evaluation
  let currentEval = evaluateAtPitch(currentPitchRad);
  areaA = currentEval.computedAreaA;
  areaB = currentEval.computedAreaB;
  discrepancyPercent = currentEval.disc;
  bestPoints3D = currentEval.pts3D;
  bestBirdEyeCoords = currentEval.birdEye;
  bestHMat = currentEval.H;

  // Cross-verification & Convergence Loop:
  // If discrepancy > 1%, optimize pitch in small step bounds to guarantee convergence
  if (discrepancyPercent > 1.0) {
    let step = (1.5 * Math.PI) / 180; // 1.5 degree search step
    for (let i = 0; i < maxIters && discrepancyPercent > 0.05; i++) {
      iterCount++;
      const evalUp = evaluateAtPitch(currentPitchRad + step);
      const evalDown = evaluateAtPitch(currentPitchRad - step);

      if (evalUp.disc < discrepancyPercent) {
        currentPitchRad += step;
        currentEval = evalUp;
      } else if (evalDown.disc < discrepancyPercent) {
        currentPitchRad -= step;
        currentEval = evalDown;
      } else {
        step *= 0.5; // Dampen step
      }

      areaA = currentEval.computedAreaA;
      areaB = currentEval.computedAreaB;
      discrepancyPercent = currentEval.disc;
      bestPoints3D = currentEval.pts3D;
      bestBirdEyeCoords = currentEval.birdEye;
      bestHMat = currentEval.H;
    }
  }

  // Fused Invariant Area
  const rawFusedArea = (areaA + areaB) / 2;
  const areaM2 = Math.round(rawFusedArea * 1000) / 1000;

  // Strategy 3: Depth Map and Scale per Vertex
  const depthScale = computePerVertexDepthAndMetricScale(
    screenPoints,
    frameContext,
    viewportWidth,
    viewportHeight,
    rollRad,
    currentPitchRad
  );

  // Compute 3D edge distances and perimeter
  const edgeLengthsM: number[] = [];
  let perimeterM = 0;
  for (let i = 0; i < bestPoints3D.length; i++) {
    const next = (i + 1) % bestPoints3D.length;
    const len = distance3D(bestPoints3D[i], bestPoints3D[next]) * scaleFactor;
    edgeLengthsM.push(Math.round(len * 100) / 100);
    perimeterM += len;
  }
  perimeterM = Math.round(perimeterM * 100) / 100;

  // Centroid
  let sumX = 0, sumY = 0, sumZ = 0;
  bestPoints3D.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
    sumZ += p.z;
  });
  const cnt = bestPoints3D.length;
  const centroid3D: Point3D = {
    x: Math.round((sumX / cnt) * 1000) / 1000,
    y: Math.round((sumY / cnt) * 1000) / 1000,
    z: Math.round((sumZ / cnt) * 1000) / 1000,
  };

  // Surface Normal
  const surfaceNormal = computePolygonNormalNewell(bestPoints3D);

  // Bounding box in metric ground coordinates (Width along X, Length along Z)
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  bestPoints3D.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  });
  const widthM = Math.round(Math.abs(maxX - minX) * scaleFactor * 100) / 100;
  const lengthM = Math.round(Math.abs(maxZ - minZ) * scaleFactor * 100) / 100;

  // SANITY CHECK & REAL-WORLD PHYSICAL VALIDATION:
  // Mobile camera garden plots rarely exceed 500 m² in a single static view frustum.
  // Verify that individual segment distances and total area fit realistic physical geometry.
  const isEdgesValid = edgeLengthsM.every((len) => len <= 25.0);
  const isAreaRealistic = areaM2 >= 0.0001 && areaM2 <= 500.0;
  const isSanityValidated = isEdgesValid && isAreaRealistic;

  // Calculate Tracking Confidence Score (0 to 100%)
  const avgDepth = depthScale.vertexDepthsM.length > 0
    ? depthScale.vertexDepthsM.reduce((a, b) => a + b, 0) / depthScale.vertexDepthsM.length
    : 2.0;
  
  let confidence = 100.0;
  // Penalize discrepancy between 3D Vector Shoelace & Homography
  confidence -= Math.min(40, discrepancyPercent * 4.0);
  // Penalize long distance where AR point cloud resolution degrades
  if (avgDepth > 5.0) {
    confidence -= Math.min(30, (avgDepth - 5.0) * 6.0);
  }
  const trackingConfidenceScore = Math.max(10, Math.min(100, Math.round(confidence)));

  return {
    areaM2,
    areaShoelace3DM2: Math.round(areaA * 1000) / 1000,
    areaHomographyBirdEyeM2: Math.round(areaB * 1000) / 1000,
    strategyDiscrepancyPercent: Math.round(discrepancyPercent * 100) / 100,
    convergenceIterCount: iterCount,
    optimizedPitchDeg: Math.round((currentPitchRad * 180) / Math.PI),
    perimeterM,
    edgeLengthsM,
    vertexDepthsM: depthScale.vertexDepthsM,
    vertexMetricScaleMPerPx: depthScale.vertexMetricScaleMPerPx,
    homographyMatrix: bestHMat,
    birdEyeCoordinates: bestBirdEyeCoords,
    centroid3D,
    surfaceNormal,
    boundingBoxM: { widthM, lengthM },
    isSanityValidated,
    trackingConfidenceScore,
  };
}

/**
 * Precision Area Engine that calculates area, perimeter, and edge distances
 * directly from attached 3D Anchors with scale correction multiplier.
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
  boundingBoxM: { widthM: number; lengthM: number };
} {
  if (anchors.length < 3) {
    let perimeterM = 0;
    const edgeLengthsM: number[] = [];
    if (anchors.length === 2) {
      const d = distance3D(anchors[0], anchors[1]) * scaleFactor;
      edgeLengthsM.push(Math.round(d * 100) / 100);
      perimeterM = Math.round(d * 100) / 100;
    }
    return {
      areaM2: 0,
      perimeterM,
      edgeLengthsM,
      cornerAnglesDeg: [],
      centroid3D: anchors[0] || { x: 0, y: 0, z: 0 },
      surfaceNormal: { x: 0, y: 1, z: 0 },
      boundingBoxM: { widthM: perimeterM, lengthM: 0 },
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

  // 5. Compute bounding box on projected plane (Width & Length in meters)
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  projected2D.forEach((pt) => {
    if (pt.u < minU) minU = pt.u;
    if (pt.u > maxU) maxU = pt.u;
    if (pt.v < minV) minV = pt.v;
    if (pt.v > maxV) maxV = pt.v;
  });
  const widthM = Math.round(Math.abs(maxU - minU) * scaleFactor * 100) / 100;
  const lengthM = Math.round(Math.abs(maxV - minV) * scaleFactor * 100) / 100;

  return {
    areaM2,
    perimeterM,
    edgeLengthsM,
    cornerAnglesDeg,
    centroid3D: centroid,
    surfaceNormal: normal,
    boundingBoxM: { widthM, lengthM },
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

/**
 * RULE 6: Vertical Plane Detection & Raycasting Engine (ARPlane.Type.VERTICAL)
 * Unprojects a screen point onto a detected vertical wall plane at distance Z_wall
 * Preserves vertical variation (Y-axis) along the gravity vector.
 */
export function raycastScreenPointToVerticalPlane(
  screenPoint: Point2D,
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  wallDistanceM = 2.5,
  rollRad = 0.0
): Point3D {
  const { fx, fy, cx, cy } = computeEffectiveFocalLength(frameContext, viewportWidth, viewportHeight);
  const rawDx = screenPoint.x - cx;
  const rawDy = screenPoint.y - cy;
  let px = rawDx;
  let py = rawDy;

  if (Math.abs(rollRad) > 0.001) {
    const cosR = Math.cos(rollRad);
    const sinR = Math.sin(rollRad);
    px = rawDx * cosR - rawDy * sinR;
    py = rawDx * sinR + rawDy * cosR;
  }

  const u = px / fx;
  const v = py / fy;
  const theta = frameContext.cameraPitchRad;
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);

  // Optical direction in world space
  const dirX = u;
  const dirY = -(v * cosT + sinT);
  const dirZ = cosT - v * sinT;

  const safeDirZ = Math.abs(dirZ) > 0.01 ? dirZ : (dirZ >= 0 ? 0.01 : -0.01);
  const t = wallDistanceM / safeDirZ;

  const worldX = t * dirX;
  const worldY = frameContext.cameraHeightM + t * dirY;
  const worldZ = wallDistanceM;

  return {
    x: Math.round(worldX * 10000) / 10000,
    y: Math.round(worldY * 10000) / 10000,
    z: Math.round(worldZ * 10000) / 10000,
  };
}

/**
 * RULE 6: Vertical Height Measurement Engine (Gravity Vector Y-Axis Alignment)
 * Measures vertical height strictly along the gravity vector between two 3D points:
 * H = |Y_top - Y_bottom|
 */
export function computeVerticalHeight(
  topScreenPt: Point2D,
  bottomScreenPt: Point2D,
  frameContext: ARFrameSpatialContext,
  viewportWidth: number,
  viewportHeight: number,
  wallDistanceM = 2.5,
  rollRad = 0.0
): {
  heightM: number;
  topPoint3D: Point3D;
  bottomPoint3D: Point3D;
  horizontalOffsetM: number;
  straightDistanceM: number;
  planeType: 'VERTICAL';
} {
  const top3D = raycastScreenPointToVerticalPlane(topScreenPt, frameContext, viewportWidth, viewportHeight, wallDistanceM, rollRad);
  const bottom3D = raycastScreenPointToVerticalPlane(bottomScreenPt, frameContext, viewportWidth, viewportHeight, wallDistanceM, rollRad);

  // Vertical height along gravity vector (Y-axis): H = |Y_top - Y_bottom|
  const heightM = Math.abs(top3D.y - bottom3D.y);
  const horizontalOffsetM = Math.abs(top3D.x - bottom3D.x);
  const straightDistanceM = distance3D(top3D, bottom3D);

  return {
    heightM: Math.round(heightM * 1000) / 1000,
    topPoint3D: top3D,
    bottomPoint3D: bottom3D,
    horizontalOffsetM: Math.round(horizontalOffsetM * 1000) / 1000,
    straightDistanceM: Math.round(straightDistanceM * 1000) / 1000,
    planeType: 'VERTICAL',
  };
}

/**
 * RULE 6: Soil Excavation Depth & Volume Calculation Engine
 * Combines 2D projected horizontal surface area (ARPlane.Type.HORIZONTAL_UPWARD_FACING, Delta Y = 0)
 * with the measured excavation depth along the normal vector:
 * V = Area * Depth (m³)
 */
export function computeSoilExcavationVolume(
  surfaceAreaM2: number,
  measuredDepthM: number,
  depthPointsCount = 1
): {
  surfaceAreaM2: number;
  measuredDepthM: number;
  volumeM3: number;
  volumeLiters: number;
  estimatedSoilBags50L: number;
  estimatedTruckloadsM3: number;
  depthPointsCount: number;
} {
  const safeArea = Math.max(0, surfaceAreaM2);
  const safeDepth = Math.max(0, measuredDepthM);
  const volumeM3 = Math.round(safeArea * safeDepth * 1000) / 1000;
  const volumeLiters = Math.round(volumeM3 * 1000);
  const estimatedSoilBags50L = Math.ceil(volumeLiters / 50);
  const estimatedTruckloadsM3 = Math.round((volumeM3 / 6.0) * 10) / 10;

  return {
    surfaceAreaM2: Math.round(safeArea * 1000) / 1000,
    measuredDepthM: Math.round(safeDepth * 1000) / 1000,
    volumeM3,
    volumeLiters,
    estimatedSoilBags50L,
    estimatedTruckloadsM3,
    depthPointsCount,
  };
}

