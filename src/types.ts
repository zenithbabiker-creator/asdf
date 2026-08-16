export type AREngineType = 'GOOGLE_ARCORE' | 'HUAWEI_AR_ENGINE';

export type PreCaptureMeasurementMode = 'REAL_AREA' | 'REAL_DEPTH' | 'REAL_AREA_AND_DEPTH';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface SpatialAnchor3D {
  id: string;
  worldPosition: Point3D;
  planeNormal?: Point3D;
  screenPoint: Point2D;
  timestamp: number;
  attachedTrackableId?: string;
}

export interface ARFrameSpatialContext {
  cameraPose: {
    position: Point3D;
    orientation: [number, number, number, number];
  };
  intrinsics: {
    focalLengthPx: number;
    principalPoint: Point2D;
    fovDegrees: number;
  };
  cameraHeightM: number;
  cameraPitchRad: number;
  depthMapAvailable: boolean;
  depthMode: 'AUTOMATIC' | 'DISABLED';
  timestamp: number;
}

export type PlantSelectorType = 'large' | 'medium' | 'small';

export interface PlantSelectorItem {
  id: string;
  type: PlantSelectorType;
  nameAr: string; // "محدد كبير (عرض 30 سم)" | "محدد متوسط (عرض 20 سم)" | "محدد صغير (عرض 10 سم)"
  varietyName: string; // custom plant variety or name input by user
  widthM: number; // 0.30 m for large, 0.20 m for medium, 0.10 m for small
  lengthM: number; // length specified by user in meters
  x?: number; // position on screen if placed
  y?: number;
}

export interface TurfSeedlingOption {
  value: number; // 10, 15, 20, 25, 30 (plants / seedlings per square meter)
  labelAr: string; // "10 شتول في المتر المربع (10 شتلة/م²)", etc.
}

export interface ReferenceCalibrationObject {
  id: string;
  nameAr: string;
  category: 'paper' | 'card' | 'tile' | 'ruler' | 'custom';
  realWidthM: number;
  realHeightM: number;
  realAreaM2: number;
  descriptionAr: string;
}

export interface CalibrationSettings {
  scaleFactor: number; // multiplier applied to real-world calculations (default 1.0)
  cameraHeightM: number; // e.g. 1.40m
  manualPitchDeg?: number; // manual override or sensor detected
  useLiveSensorOrientation: boolean;
  activeReferenceObject?: ReferenceCalibrationObject;
  orthogonalSnapEnabled: boolean; // 90 degree corner auto-ortho snapping
  focalLengthFactor: number; // focal length adjustment factor
}

export interface LiveSensorOrientation {
  pitchDeg: number; // beta (-180 to 180) -> ground angle
  rollDeg: number;  // gamma (-90 to 90) -> lateral tilt
  yawDeg: number;   // alpha (0 to 360) -> compass direction
  isAvailable: boolean;
  isOptimalGroundAngle: boolean; // true if 30 deg <= pitch <= 70 deg
}

export interface PrecisionPolygonResult {
  areaM2: number;
  perimeterM: number;
  edgeLengthsM: number[];
  cornerAnglesDeg: number[];
  centroid3D: Point3D;
  surfaceNormal: Point3D;
  scaleFactorApplied: number;
  anchors: SpatialAnchor3D[];
}

export interface CalculationResult {
  totalGardenAreaM2: number;
  reservedSelectorsAreaM2: number;
  remainingTurfAreaM2: number;
  seedlingsPerM2: number; // 10, 15, 20, 25, or 30
  totalSeedlingsCount: number; // remainingTurfAreaM2 * seedlingsPerM2
  timestamp: string;
}

export interface HoleDepthPoint {
  x: number;
  y: number;
  depthM: number;
}

export interface HoleCalculationResult {
  surfaceAreaM2: number;
  averageDepthM: number;
  maxDepthM: number;
  backfillVolumeM3: number;
  timestamp: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  language: 'kotlin' | 'gradle' | 'xml' | 'properties' | 'shell' | 'plaintext';
  content: string;
  descriptionAr: string;
}

export interface AISoilAdviceRequest {
  areaM2: number;
  seedlingsPerM2: number;
  plantCategory?: string;
  customNotes?: string;
}

export interface AISoilAdviceResponse {
  summaryAr: string;
  soilPreparationStepsAr: string[];
  recommendedAdditivesAr: string[];
  fertilizerTipsAr: string;
  estimatedTurfM2: number;
  estimatedTotalSeedlings: number;
}
