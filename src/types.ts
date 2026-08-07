export type AREngineType = 'GOOGLE_ARCORE' | 'HUAWEI_AR_ENGINE';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface SoilType {
  id: string;
  nameAr: string;
  nameEn: string;
  densityKgPerM3: number; // e.g. Topsoil ~1300 kg/m3
  descriptionAr: string;
  recommendedForAr: string;
}

export interface CalculationResult {
  areaM2: number;
  depthM: number;
  volumeM3: number;
  soilWeightKg: number;
  soilWeightTons: number;
  bagsCount50L: number;
  bagsCount25L: number;
  estimatedCostSar: number;
  timestamp: string;
}

export interface HoleDepthPoint {
  x: number;
  y: number;
  depthM: number; // negative value representing hole depth below surface level
}

export interface HoleCalculationResult {
  surfaceAreaM2: number;
  averageDepthM: number;
  maxDepthM: number;
  backfillVolumeM3: number;
  soilWeightKg: number;
  bagsCount50L: number;
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
  depthM: number;
  soilType: string;
  plantCategory?: string;
  customNotes?: string;
}

export interface AISoilAdviceResponse {
  summaryAr: string;
  soilPreparationStepsAr: string[];
  recommendedAdditivesAr: string[];
  fertilizerTipsAr: string;
  estimatedBagCount50L: number;
}
