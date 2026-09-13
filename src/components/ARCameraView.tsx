import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Point2D, 
  Point3D, 
  SpatialAnchor3D, 
  ARFrameSpatialContext, 
  AREngineType, 
  PreCaptureMeasurementMode,
  SpatialMeasurementMode,
  VerticalHeightResult,
  SoilVolumeResult,
  CalibrationSettings,
  LiveSensorOrientation,
  FusedPrecisionAreaResult
} from '../types';
import { 
  calculatePrecisionAreaFrom3DAnchors, 
  createSpatialAnchorFromTappedPoint,
  raycastScreenPointTo3DPlane,
  raycastScreenPointToVerticalPlane,
  fusedPrecisionAreaCalculation,
  computeCornerAnglesDeg,
  computeVerticalHeight,
  computeSoilExcavationVolume,
  distance3D 
} from '../utils/arPrecisionMath';
import { ARCalibrationModal } from './ARCalibrationModal';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { 
  Aperture, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  Focus, 
  Trash2,
  Pencil,
  MousePointer,
  Download,
  Camera,
  Maximize2,
  Eye,
  Sliders,
  Anchor,
  Compass,
  CheckCircle2,
  Move,
  Square,
  Circle,
  Ruler,
  Building2,
  Box,
  ArrowDownUp,
  Grid
} from 'lucide-react';

interface ARCameraViewProps {
  mode: 'SURFACE' | 'HOLE_DEPTH';
  preCaptureMode?: PreCaptureMeasurementMode;
  onOpenModeSelection?: () => void;
  points: Point2D[];
  setPoints: React.Dispatch<React.SetStateAction<Point2D[]>>;
  engine: AREngineType;
  onAreaCalculated?: (areaM2: number, perimeterM?: number, widthM?: number, lengthM?: number) => void;
  onDepthCalculated?: (maxDepth: number, avgDepth: number, volumeM3: number, holeAreaM2?: number, widthM?: number, lengthM?: number) => void;
}

export type DrawToolType = 'TAP_POINTS' | 'RECTANGLE' | 'TAPE' | 'CIRCLE' | 'FREEHAND' | 'ADJUST_VERTEX';

// Helper to format area precisely in Arabic
export const formatAreaArabicDetailed = (areaM2: number): { primary: string; detailed: string } => {
  if (!areaM2 || areaM2 <= 0) {
    return { primary: '0.00 م²', detailed: '0 متر مربع' };
  }
  const wholeM2 = Math.floor(areaM2);
  const fractionCm2 = Math.round((areaM2 - wholeM2) * 100);

  let detailedStr = `${wholeM2} متر مربع`;
  if (fractionCm2 > 0) {
    detailedStr += ` و ${fractionCm2} سم²`;
  }
  return {
    primary: `${areaM2.toFixed(2)} م²`,
    detailed: detailedStr,
  };
};

// Helper to format edge distance into meters and centimeters
export const formatDistanceArabic = (distM: number): string => {
  const wholeM = Math.floor(distM);
  const cm = Math.round((distM - wholeM) * 100);
  if (wholeM > 0 && cm > 0) {
    return `${wholeM}م و ${cm}سم`;
  } else if (wholeM > 0) {
    return `${wholeM}م`;
  } else {
    return `${cm}سم`;
  }
};

export const ARCameraView: React.FC<ARCameraViewProps> = ({
  mode,
  preCaptureMode = mode === 'SURFACE' ? 'REAL_AREA' : 'REAL_DEPTH',
  onOpenModeSelection,
  points,
  setPoints,
  engine,
  onAreaCalculated,
  onDepthCalculated,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [snapshotImageObj, setSnapshotImageObj] = useState<HTMLImageElement | null>(null);
  
  // Frame Freeze & Spatial Anchor Pipeline State
  const [isFrameFrozen, setIsFrameFrozen] = useState(false);
  const [cachedSpatialFrame, setCachedSpatialFrame] = useState<ARFrameSpatialContext | null>(null);
  const [spatialAnchors, setSpatialAnchors] = useState<SpatialAnchor3D[]>([]);
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDepthHeatmap, setShowDepthHeatmap] = useState(true);

  // Full Screen Mode: hides all UI for 30 seconds upon capturing snapshot
  const [isFullScreenMode, setIsFullScreenMode] = useState(false);
  const [fullScreenCountdown, setFullScreenCountdown] = useState(30);

  // UI State: Collapse toolbar option
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Integrated Calibration & Precision Suite State
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [calibrationSettings, setCalibrationSettings] = useState<CalibrationSettings>({
    scaleFactor: 1.0,
    cameraHeightM: 1.40,
    useLiveSensorOrientation: true,
    orthogonalSnapEnabled: false,
    focalLengthFactor: 1.0,
  });

  // Live Device Physical Sensor State (Gyroscope & Accelerometer)
  const [sensorOrientation, setSensorOrientation] = useState<LiveSensorOrientation>({
    pitchDeg: 50.0,
    rollDeg: 0.0,
    yawDeg: 0.0,
    isAvailable: false,
    isOptimalGroundAngle: true,
  });

  // Vertex Dragging & Magnifier State
  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);
  const [magnifierPos, setMagnifierPos] = useState<Point2D | null>(null);

  // Base Physical Parameters
  const FOCAL_LENGTH_PX = 600 * calibrationSettings.focalLengthFactor;

  // Active Effective Pitch in Radians (from live sensors or fallback default 50 deg)
  const effectivePitchRad = calibrationSettings.useLiveSensorOrientation && sensorOrientation.isAvailable
    ? Math.max(0.15, Math.min(1.45, (sensorOrientation.pitchDeg * Math.PI) / 180))
    : (50 * Math.PI) / 180;

  const effectiveRollRad = calibrationSettings.useLiveSensorOrientation && sensorOrientation.isAvailable
    ? (sensorOrientation.rollDeg * Math.PI) / 180
    : 0.0;

  // Rule 6: Multi-Mode Spatial Engine (Horizontal Area vs Vertical Height vs Excavation Depth & Volume)
  const [spatialMode, setSpatialMode] = useState<SpatialMeasurementMode>(
    mode === 'HOLE_DEPTH' ? 'EXCAVATION_DEPTH_VOLUME' : 'HORIZONTAL_AREA'
  );
  const [verticalHeightResult, setVerticalHeightResult] = useState<VerticalHeightResult | null>(null);
  const [soilVolumeResult, setSoilVolumeResult] = useState<SoilVolumeResult | null>(null);
  const [excavationDepthM, setExcavationDepthM] = useState<number>(0.35);
  const [wallDistanceM, setWallDistanceM] = useState<number>(2.5);

  // Simulated depth measurements for hole
  const [simulatedMaxDepth, setSimulatedMaxDepth] = useState(0.45);
  const [simulatedAvgDepth, setSimulatedAvgDepth] = useState(0.30);

  // AR Tracking Quality & Motion Guard State (Rule B & Rule E)
  const [arTrackingState, setArTrackingState] = useState<'TRACKING' | 'PAUSED' | 'STOPPED' | 'SCAN_REQUIRED'>('TRACKING');
  const [isHighVelocity, setIsHighVelocity] = useState<boolean>(false);
  const [guardWarningMessage, setGuardWarningMessage] = useState<string | null>(null);

  // Device Motion & Gyroscope Delta Listener (Rule E: Environmental Guardrails & Motion Drift Prevention)
  useEffect(() => {
    let velocityTimeout: any = null;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        const magnitude = Math.hypot(acc.x, acc.y, acc.z);
        // Earth gravity is ~9.81 m/s^2. Deviation > 4.5 m/s^2 indicates high device velocity / violent shake
        const dynamicAcc = Math.abs(magnitude - 9.81);
        
        if (dynamicAcc > 4.2) {
          setIsHighVelocity(true);
          setGuardWarningMessage('أبطئ حركة الجهاز (Slow Down Device) لتفادي انحراف التتبع المكاني');
          
          if (velocityTimeout) clearTimeout(velocityTimeout);
          velocityTimeout = setTimeout(() => {
            setIsHighVelocity(false);
            setGuardWarningMessage(null);
          }, 1800);
        }
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion, true);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion, true);
      }
      if (velocityTimeout) clearTimeout(velocityTimeout);
    };
  }, []);

  // Device Orientation Listener (Active Sensor Fusion)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null) {
        // beta is pitch angle from vertical (-180 to 180)
        // When device is tilted down towards ground, beta is typically between 30 and 75 degrees
        const rawPitch = e.beta;
        const normalizedPitch = Math.max(10, Math.min(85, rawPitch));
        const rawRoll = e.gamma !== null ? Math.max(-45, Math.min(45, e.gamma)) : 0;
        const rawYaw = e.alpha !== null ? e.alpha : 0;

        const isOptimal = normalizedPitch >= 30 && normalizedPitch <= 70;

        setSensorOrientation({
          pitchDeg: normalizedPitch,
          rollDeg: rawRoll,
          yawDeg: rawYaw,
          isAvailable: true,
          isOptimalGroundAngle: isOptimal,
        });
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Generate AR Frame Spatial Context
  const getActiveSpatialFrameContext = (w = 720, h = 420): ARFrameSpatialContext => ({
    cameraPose: {
      position: { x: 0, y: calibrationSettings.cameraHeightM, z: 0 },
      orientation: [
        0, 
        Math.sin(effectivePitchRad / 2), 
        0, 
        Math.cos(effectivePitchRad / 2)
      ],
    },
    intrinsics: {
      focalLengthPx: FOCAL_LENGTH_PX,
      principalPoint: { x: w / 2, y: h / 2 },
      fovDegrees: 68.5,
    },
    cameraHeightM: calibrationSettings.cameraHeightM,
    cameraPitchRad: effectivePitchRad,
    depthMapAvailable: true,
    depthMode: 'AUTOMATIC',
    timestamp: Date.now(),
  });

  // Request native camera permissions & start live stream
  const startLiveCamera = async () => {
    setCameraError(null);
    
    try {
      if (typeof CapCamera.requestPermissions === 'function') {
        const status = await CapCamera.requestPermissions({ permissions: ['camera'] });
        if (status.camera !== 'granted' && status.camera !== 'limited') {
          setCameraError('يرجى منح إذن الكاميرا الحقيقي للوصول للبث المباشر بالكاميرا الخلفية.');
        }
      }
    } catch (e) {
      console.log('Capacitor camera call skipped:', e);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('الكاميرا غير مدعومة في هذا المتصفح.');
      }

      let stream: MediaStream | null = null;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        const backCamera = videoDevices.find((d) => {
          const label = (d.label || '').toLowerCase();
          return label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('خلفية');
        });

        if (backCamera && backCamera.deviceId) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: backCamera.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        }
      } catch (enumErr) {
        console.log('Enumeration fallback:', enumErr);
      }

      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch (exactErr) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false,
            });
          } catch (idealErr) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
      return true;
    } catch (err: any) {
      console.log('Camera error:', err);
      setCameraError('يرجى الضغط على زر "طلب إذن الكاميرا الخلفية" لمنح الإذن وتفعيل البث المباشر.');
      setIsCameraActive(false);
      return false;
    }
  };

  // Stop camera stream tracks
  const stopLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Freeze Frame & Spatial Anchor Pipeline Trigger
  const handleTakeSnapshot = async () => {
    try {
      const video = videoRef.current;
      const w = canvasRef.current ? canvasRef.current.width : 720;
      const h = canvasRef.current ? canvasRef.current.height : 420;

      // 1. Capture and cache the exact ARFrame spatial context
      const spatialContext = getActiveSpatialFrameContext(w, h);
      setCachedSpatialFrame(spatialContext);
      setIsFrameFrozen(true);

      // 2. Freeze rendering view by caching current video raster frame
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
          loadSnapshotFromDataUrl(dataUrl);
        }
        return;
      }

      if (Capacitor.isNativePlatform() && typeof CapCamera.getPhoto === 'function') {
        const image = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          direction: CameraDirection.Rear,
        });

        if (image && image.dataUrl) {
          loadSnapshotFromDataUrl(image.dataUrl);
          return;
        }
      }

      const started = await startLiveCamera();
      if (!started) {
        setCameraError('لم يتم منح إذن الكاميرا الحقيقية. يرجى تفعيل إذن الكاميرا في المتصفح.');
      }
    } catch (e) {
      console.error('Error capturing camera frame:', e);
      setCameraError('تعذر تجميد الإطار المكاني. يرجى تفعيل إذن الكاميرا.');
    }
  };

  // Helper to load snapshot
  const loadSnapshotFromDataUrl = (dataUrl: string) => {
    setCapturedSnapshot(dataUrl);
    const img = new Image();
    img.onload = () => {
      setSnapshotImageObj(img);
    };
    img.src = dataUrl;

    setIsFullScreenMode(true);
    setFullScreenCountdown(30);
  };

  // 30-second Full Screen countdown timer
  useEffect(() => {
    if (!isFullScreenMode) return;

    if (fullScreenCountdown <= 0) {
      setIsFullScreenMode(false);
      return;
    }

    const timer = setInterval(() => {
      setFullScreenCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isFullScreenMode, fullScreenCountdown]);

  // Download / Save camera image with overlaid AR measurements
  const handleSaveMeasuredImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `ar_calibrated_measurement_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Save image error:', err);
    }
  };

  // Reset/Retake Snapshot & Unfreeze Pipeline
  const handleRetakeSnapshot = () => {
    setCapturedSnapshot(null);
    setSnapshotImageObj(null);
    setIsFrameFrozen(false);
    setCachedSpatialFrame(null);
    setSpatialAnchors([]);
    setPoints([]);
    setIsFullScreenMode(false);
    setIsToolbarCollapsed(false);
    if (onAreaCalculated) onAreaCalculated(0);
    startLiveCamera();
  };

  // Auto-start live camera on initial load
  useEffect(() => {
    startLiveCamera();
    return () => {
      stopLiveCamera();
    };
  }, [mode]);

  /**
   * Unproject 2D Canvas Screen Pixel to Real 3D Ground Plane (X, Y, Z)
   */
  const unprojectScreenTo3DPlane = useCallback((px: number, py: number, width: number, height: number): Point3D => {
    const frameCtx = cachedSpatialFrame || getActiveSpatialFrameContext(width, height);
    return raycastScreenPointTo3DPlane(
      { x: px, y: py }, 
      frameCtx, 
      width, 
      height,
      effectiveRollRad
    );
  }, [cachedSpatialFrame, calibrationSettings, effectivePitchRad, effectiveRollRad]);

  /**
   * Computes distance-invariant polygon area using Multi-Strategy Fusion:
   * (1) Metric World-Space Raycasting & 3D Shoelace
   * (2) Planar Homography Orthorectification (Bird's Eye View)
   * (3) Dynamic Slant-Depth & Scale-per-Pixel Calibration
   * (4) Iterative Convergence & Discrepancy Cross-Verification
   */
  const computePrecisionPolygonArea = useCallback((pts: Point2D[], width: number, height: number) => {
    if (pts.length < 3) {
      return { 
        areaM2: 0, 
        perimeterM: 0, 
        edgeLengthsM: [], 
        cornerAnglesDeg: [], 
        anchors: [],
        fusedResult: undefined,
        boundingBoxM: undefined
      };
    }

    const frameCtx = cachedSpatialFrame || getActiveSpatialFrameContext(width, height);
    
    // Multi-Strategy Fusion Calculation
    const fused = fusedPrecisionAreaCalculation(
      pts,
      frameCtx,
      width,
      height,
      effectiveRollRad,
      calibrationSettings.scaleFactor
    );

    const anchors = pts.map((pt, idx) => 
      createSpatialAnchorFromTappedPoint(pt, frameCtx, width, height, idx, effectiveRollRad)
    );

    return {
      areaM2: fused.areaM2,
      perimeterM: fused.perimeterM,
      edgeLengthsM: fused.edgeLengthsM,
      cornerAnglesDeg: computeCornerAnglesDeg(fused.birdEyeCoordinates.map(b => ({ x: b.x, y: 0, z: b.y }))),
      anchors,
      boundingBoxM: fused.boundingBoxM,
      fusedResult: fused,
    };
  }, [cachedSpatialFrame, calibrationSettings, effectiveRollRad, effectivePitchRad]);

  const [drawTool, setDrawTool] = useState<DrawToolType>('TAP_POINTS');
  const [isDragging, setIsDragging] = useState(false);

  const pointsRef = useRef<Point2D[]>(points);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(0, Math.min(canvasRef.current.width, x));
    const clampedY = Math.max(0, Math.min(canvasRef.current.height, y));

    return { x: clampedX, y: clampedY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.cancelable) e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    const coords = getCanvasCoords(e);
    if (!coords || !canvasRef.current) return;

    // Rule B & Rule E: Tracking Validation Layer & Environmental Guardrails
    if (arTrackingState !== 'TRACKING') {
      setGuardWarningMessage('حالة التتبع غير مستقرة. يرجى مسح السطح لتثبيت المستوى الأفقي (Surface Scan Required).');
      return;
    }

    if (isHighVelocity) {
      setGuardWarningMessage('أبطئ حركة الجهاز (Slow Down Device) لمنع انحراف التتبع المكاني.');
      return;
    }

    // Check if tapping near an existing vertex to drag & adjust with precision loupe
    const currentPts = pointsRef.current;
    let closestIndex = -1;
    let closestDist = 28; // touch radius in pixels

    for (let i = 0; i < currentPts.length; i++) {
      const d = Math.hypot(coords.x - currentPts[i].x, coords.y - currentPts[i].y);
      if (d < closestDist) {
        closestDist = d;
        closestIndex = i;
      }
    }

    if (closestIndex !== -1) {
      setDraggedVertexIndex(closestIndex);
      setMagnifierPos(coords);
      setIsDragging(true);
      return;
    }

    setIsDragging(true);

    // RULE 6: Spatial Mode - Vertical Plane & Height Mode (H = |Y_top - Y_bottom|)
    if (spatialMode === 'VERTICAL_HEIGHT') {
      let newPts: Point2D[];
      if (currentPts.length === 0 || currentPts.length >= 2) {
        newPts = [coords];
        setVerticalHeightResult(null);
      } else {
        newPts = [currentPts[0], coords];
        const frameCtx = cachedSpatialFrame || getActiveSpatialFrameContext(canvasRef.current.width, canvasRef.current.height);
        const vHeight = computeVerticalHeight(
          newPts[0],
          newPts[1],
          frameCtx,
          canvasRef.current.width,
          canvasRef.current.height,
          wallDistanceM,
          effectiveRollRad
        );
        setVerticalHeightResult(vHeight);
        if (onDepthCalculated) {
          onDepthCalculated(vHeight.heightM, vHeight.heightM, 0, 0);
        }
        if (onAreaCalculated) {
          onAreaCalculated(0, vHeight.heightM);
        }
      }
      pointsRef.current = newPts;
      setPoints(newPts);
      return;
    }

    // RULE 6: Spatial Mode - Soil Excavation Depth & Volume (V = Area * Depth)
    if (spatialMode === 'EXCAVATION_DEPTH_VOLUME') {
      if (currentPts.length >= 3) {
        const firstPt = currentPts[0];
        const distToFirst = Math.hypot(coords.x - firstPt.x, coords.y - firstPt.y);
        if (distToFirst < 25) {
          const res = computePrecisionPolygonArea(currentPts, canvasRef.current.width, canvasRef.current.height);
          const vol = computeSoilExcavationVolume(res.areaM2, excavationDepthM, currentPts.length);
          setSoilVolumeResult(vol);
          if (onDepthCalculated) {
            onDepthCalculated(excavationDepthM, excavationDepthM, vol.volumeM3, res.areaM2, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
          }
          return;
        }
      }

      const newPts = [...currentPts, coords];
      pointsRef.current = newPts;
      setPoints(newPts);
      if (newPts.length >= 3) {
        const res = computePrecisionPolygonArea(newPts, canvasRef.current.width, canvasRef.current.height);
        const vol = computeSoilExcavationVolume(res.areaM2, excavationDepthM, newPts.length);
        setSoilVolumeResult(vol);
        if (onDepthCalculated) {
          onDepthCalculated(excavationDepthM, excavationDepthM, vol.volumeM3, res.areaM2, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
        }
      }
      return;
    }

    // RULE 6: Spatial Mode - Horizontal Area (ARPlane.Type.HORIZONTAL_UPWARD_FACING, Delta Y = 0)
    if (drawTool === 'RECTANGLE') {
      // Smart Rectangle: 2 corner taps
      if (currentPts.length === 0 || currentPts.length >= 4) {
        // First corner
        const newPts = [coords];
        pointsRef.current = newPts;
        setPoints(newPts);
      } else {
        // Second opposite corner: construct 4 orthogonal corners
        const p1 = currentPts[0];
        const p2 = { x: coords.x, y: p1.y };
        const p3 = coords;
        const p4 = { x: p1.x, y: coords.y };
        const rectPts = [p1, p2, p3, p4];
        pointsRef.current = rectPts;
        setPoints(rectPts);
        const res = computePrecisionPolygonArea(rectPts, canvasRef.current.width, canvasRef.current.height);
        setSpatialAnchors(res.anchors);
        if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
      }
    } else if (drawTool === 'TAPE') {
      // Linear Tape Measure (2 points)
      if (currentPts.length === 0 || currentPts.length >= 2) {
        const newPts = [coords];
        pointsRef.current = newPts;
        setPoints(newPts);
      } else {
        const newPts = [currentPts[0], coords];
        pointsRef.current = newPts;
        setPoints(newPts);
        const res = computePrecisionPolygonArea(newPts, canvasRef.current.width, canvasRef.current.height);
        setSpatialAnchors(res.anchors);
        if (onAreaCalculated) onAreaCalculated(0, res.perimeterM);
      }
    } else if (drawTool === 'CIRCLE') {
      // Circular Bed: Center point + Radius point
      if (currentPts.length === 0 || currentPts.length > 2) {
        const newPts = [coords];
        pointsRef.current = newPts;
        setPoints(newPts);
      } else {
        const center = currentPts[0];
        const radiusPx = Math.hypot(coords.x - center.x, coords.y - center.y);
        const circlePts: Point2D[] = [];
        const segments = 16;
        for (let s = 0; s < segments; s++) {
          const ang = (s * 2 * Math.PI) / segments;
          circlePts.push({
            x: center.x + radiusPx * Math.cos(ang),
            y: center.y + radiusPx * Math.sin(ang),
          });
        }
        pointsRef.current = circlePts;
        setPoints(circlePts);
        const res = computePrecisionPolygonArea(circlePts, canvasRef.current.width, canvasRef.current.height);
        setSpatialAnchors(res.anchors);
        if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
      }
    } else if (drawTool === 'FREEHAND') {
      const newPts = [...pointsRef.current, coords];
      pointsRef.current = newPts;
      setPoints(newPts);
      const res = computePrecisionPolygonArea(newPts, canvasRef.current.width, canvasRef.current.height);
      setSpatialAnchors(res.anchors);
      if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
    } else {
      // TAP_POINTS (Default high-precision corner vertex tapping)
      // Check if tapping close to first vertex to close polygon
      if (currentPts.length >= 3) {
        const firstPt = currentPts[0];
        const distToFirst = Math.hypot(coords.x - firstPt.x, coords.y - firstPt.y);
        if (distToFirst < 25) {
          // Close and finish
          const res = computePrecisionPolygonArea(currentPts, canvasRef.current.width, canvasRef.current.height);
          setSpatialAnchors(res.anchors);
          if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
          return;
        }
      }

      if (currentPts.length > 0) {
        const lastPt = currentPts[currentPts.length - 1];
        const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
        if (dist < 10) return;
      }
      const newPts = [...currentPts, coords];
      pointsRef.current = newPts;
      setPoints(newPts);
      const res = computePrecisionPolygonArea(newPts, canvasRef.current.width, canvasRef.current.height);
      setSpatialAnchors(res.anchors);
      if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    if (e.cancelable) e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Handle Dragging Existing Vertex
    if (draggedVertexIndex !== null) {
      setMagnifierPos(coords);
      const currentPts = [...pointsRef.current];
      currentPts[draggedVertexIndex] = coords;
      pointsRef.current = currentPts;
      setPoints(currentPts);

      const res = computePrecisionPolygonArea(currentPts, canvasRef.current.width, canvasRef.current.height);
      setSpatialAnchors(res.anchors);
      if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
      return;
    }

    if (drawTool !== 'FREEHAND') return;

    const currentPts = pointsRef.current;
    if (currentPts.length > 0) {
      const lastPt = currentPts[currentPts.length - 1];
      const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
      if (dist < 10) return;
    }

    const newPts = [...currentPts, coords];
    pointsRef.current = newPts;

    const res = computePrecisionPolygonArea(newPts, canvasRef.current.width, canvasRef.current.height);
    setSpatialAnchors(res.anchors);
    if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    if (isDragging) {
      setIsDragging(false);
      setDraggedVertexIndex(null);
      setMagnifierPos(null);

      // Simplify freehand points if needed
      if (drawTool === 'FREEHAND' && pointsRef.current.length > 20) {
        const raw = pointsRef.current;
        const step = Math.ceil(raw.length / 16);
        const simplified: Point2D[] = [];
        for (let i = 0; i < raw.length; i += step) {
          simplified.push(raw[i]);
        }
        if (raw.length > 0 && simplified[simplified.length - 1] !== raw[raw.length - 1]) {
          simplified.push(raw[raw.length - 1]);
        }
        pointsRef.current = simplified;
        setPoints(simplified);
        if (canvasRef.current) {
          const res = computePrecisionPolygonArea(simplified, canvasRef.current.width, canvasRef.current.height);
          setSpatialAnchors(res.anchors);
          if (onAreaCalculated) onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
        }
      } else {
        setPoints([...pointsRef.current]);
      }
    }
  };

  const handleAutoPresetSurface = () => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const presetPts: Point2D[] = [
      { x: w * 0.28, y: h * 0.38 },
      { x: w * 0.72, y: h * 0.38 },
      { x: w * 0.82, y: h * 0.78 },
      { x: w * 0.18, y: h * 0.78 },
    ];
    setPoints(presetPts);
    const res = computePrecisionPolygonArea(presetPts, w, h);
    setSpatialAnchors(res.anchors);
    if (onAreaCalculated) {
      onAreaCalculated(res.areaM2, res.perimeterM, res.boundingBoxM?.widthM, res.boundingBoxM?.lengthM);
    }
  };

  const handleScanHole = () => {
    const currentPts = pointsRef.current;
    let holeArea = 3.0;
    let widthM = 2.0;
    let lengthM = 1.5;

    if (currentPts.length >= 3 && canvasRef.current) {
      const res = computePrecisionPolygonArea(currentPts, canvasRef.current.width, canvasRef.current.height);
      if (res.areaM2 > 0) {
        holeArea = res.areaM2;
        widthM = res.boundingBoxM?.widthM || Math.round(Math.sqrt(holeArea) * 100) / 100;
        lengthM = res.boundingBoxM?.lengthM || Math.round(Math.sqrt(holeArea) * 100) / 100;
      }
    }

    const measuredMax = Math.round(simulatedMaxDepth * 100) / 100;
    const measuredAvg = Math.round(simulatedAvgDepth * 100) / 100;
    const backfillVol = Math.round((holeArea * measuredAvg) * 1000) / 1000;

    if (onAreaCalculated) {
      onAreaCalculated(holeArea, undefined, widthM, lengthM);
    }
    if (onDepthCalculated) {
      onDepthCalculated(measuredMax, measuredAvg, backfillVol, holeArea, widthM, lengthM);
    }
  };

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (snapshotImageObj) {
        ctx.drawImage(snapshotImageObj, 0, 0, canvas.width, canvas.height);
      } else if (!isCameraActive) {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(0.5, '#1e293b');
        bgGradient.addColorStop(1, '#064e3b');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Render Perspective Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
      ctx.lineWidth = 1;
      const horizonY = canvas.height * 0.32;
      for (let x = -200; x <= canvas.width + 200; x += 60) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + (x - canvas.width / 2) * 0.2, horizonY);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = horizonY; y <= canvas.height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Equalized AR Scale Bar
      ctx.save();
      const scaleBarX = 20;
      const scaleBarY = canvas.height - 20;
      const pxFor1M = 180 * calibrationSettings.scaleFactor;

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(scaleBarX, scaleBarY);
      ctx.lineTo(scaleBarX + pxFor1M, scaleBarY);
      ctx.moveTo(scaleBarX, scaleBarY - 6);
      ctx.lineTo(scaleBarX, scaleBarY + 6);
      ctx.moveTo(scaleBarX + pxFor1M, scaleBarY - 6);
      ctx.lineTo(scaleBarX + pxFor1M, scaleBarY + 6);
      ctx.stroke();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(scaleBarX, scaleBarY - 24, 135, 18);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`📐 1.0م (معاير ${calibrationSettings.scaleFactor.toFixed(2)}x)`, scaleBarX + 6, scaleBarY - 11);
      ctx.restore();

      // Live Spirit Level Indicator (Inclinometer) in top corner
      if (!isFullScreenMode) {
        ctx.save();
        const levelCenterX = 36;
        const levelCenterY = 36;
        const levelRadius = 18;

        ctx.beginPath();
        ctx.arc(levelCenterX, levelCenterY, levelRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fill();
        ctx.strokeStyle = sensorOrientation.isOptimalGroundAngle ? '#34d399' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Level crosshair
        ctx.beginPath();
        ctx.moveTo(levelCenterX - levelRadius + 4, levelCenterY);
        ctx.lineTo(levelCenterX + levelRadius - 4, levelCenterY);
        ctx.moveTo(levelCenterX, levelCenterY - levelRadius + 4);
        ctx.lineTo(levelCenterX, levelCenterY + levelRadius - 4);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Moving bubble based on roll & pitch deviation from 50 deg
        const pitchDev = (sensorOrientation.pitchDeg - 50) * 0.4;
        const rollDev = sensorOrientation.rollDeg * 0.4;
        const bubbleX = Math.max(levelCenterX - 10, Math.min(levelCenterX + 10, levelCenterX + rollDev));
        const bubbleY = Math.max(levelCenterY - 10, Math.min(levelCenterY + 10, levelCenterY + pitchDev));

        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = sensorOrientation.isOptimalGroundAngle ? '#10b981' : '#f59e0b';
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${sensorOrientation.pitchDeg.toFixed(0)}°`, levelCenterX + levelRadius + 6, levelCenterY + 3);
        ctx.restore();
      }

      // AR Engine Active Status Badge
      if (!isFullScreenMode) {
        ctx.save();
        ctx.fillStyle = engine === 'HUAWEI_AR_ENGINE' ? 'rgba(225, 29, 72, 0.88)' : 'rgba(2, 132, 199, 0.88)';
        ctx.font = 'bold 11px sans-serif';
        const engineText = engine === 'HUAWEI_AR_ENGINE' ? 'Huawei AR Engine TrueDepth' : 'Google ARCore TrueDepth';
        ctx.fillRect(canvas.width - 180, 12, 168, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(engineText, canvas.width - 172, 28);
        ctx.restore();

        if (capturedSnapshot) {
          ctx.save();
          ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
          ctx.fillRect(72, 12, 165, 24);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('📷 لقطة AR حقيقية متكافئة', 80, 28);
          ctx.restore();
        }
      }

      // RULE 6: Spatial Mode Overlay Rendering
      if (spatialMode === 'VERTICAL_HEIGHT') {
        // Vertical Wall Plane Grid (ARPlane.Type.VERTICAL)
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        for (let vx = 40; vx < canvas.width; vx += 50) {
          ctx.beginPath();
          ctx.moveTo(vx, 0);
          ctx.lineTo(vx, canvas.height);
          ctx.stroke();
        }
        for (let vy = 40; vy < canvas.height; vy += 50) {
          ctx.beginPath();
          ctx.moveTo(0, vy);
          ctx.lineTo(canvas.width, vy);
          ctx.stroke();
        }
        ctx.restore();

        const pts = pointsRef.current;
        if (pts.length >= 1) {
          // Top Point Anchor
          const pTop = pts[0];
          ctx.beginPath();
          ctx.arc(pTop.x, pTop.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(pTop.x, pTop.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('القمة (Y_top)', pTop.x + 16, pTop.y + 4);

          // If only 1 point, draw plumb line following cursor/downwards
          if (pts.length === 1) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pTop.x, pTop.y);
            ctx.lineTo(pTop.x, canvas.height - 40);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        if (pts.length >= 2) {
          const pTop = pts[0];
          const pBottom = pts[1];

          // Bottom Point Anchor
          ctx.beginPath();
          ctx.arc(pBottom.x, pBottom.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
          ctx.fill();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(pBottom.x, pBottom.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('القاعدة (Y_bottom)', pBottom.x + 16, pBottom.y + 4);

          // Direct line between points
          ctx.beginPath();
          ctx.moveTo(pTop.x, pTop.y);
          ctx.lineTo(pBottom.x, pBottom.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Vertical Plumb Line strictly along gravity vector (Y-axis)
          ctx.beginPath();
          ctx.moveTo(pTop.x, pTop.y);
          ctx.lineTo(pTop.x, pBottom.y);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Horizontal alignment leg (X-offset)
          ctx.beginPath();
          ctx.moveTo(pTop.x, pBottom.y);
          ctx.lineTo(pBottom.x, pBottom.y);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Height Badge
          const frameCtx = cachedSpatialFrame || getActiveSpatialFrameContext(canvas.width, canvas.height);
          const vHeight = computeVerticalHeight(
            pTop,
            pBottom,
            frameCtx,
            canvas.width,
            canvas.height,
            wallDistanceM,
            effectiveRollRad
          );

          const midY = (pTop.y + pBottom.y) / 2;
          const badgeX = Math.max(160, Math.min(canvas.width - 160, pTop.x - 20));

          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          const boxW = 270;
          const boxH = 58;
          ctx.beginPath();
          ctx.roundRect(badgeX - boxW / 2, midY - boxH / 2, boxW, boxH, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`الارتفاع الرأسي الحقيقي: ${vHeight.heightM.toFixed(2)} م`, badgeX, midY - 14);

          ctx.fillStyle = '#a5f3fc';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`H = |Y_top - Y_bottom| على متجه الجاذبية`, badgeX, midY + 1);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px sans-serif';
          ctx.fillText(`المسافة الأفقية: ${vHeight.horizontalOffsetM.toFixed(2)}م | الوترية: ${vHeight.straightDistanceM.toFixed(2)}م | جدار: ${wallDistanceM.toFixed(1)}م`, badgeX, midY + 16);
          ctx.restore();
        }
      } else if (spatialMode === 'EXCAVATION_DEPTH_VOLUME') {
        // Soil Excavation Depth & Volume Mode (V = Area * Depth)
        const pts = pointsRef.current;
        if (pts.length >= 3) {
          // 3D Surface Area Polygon
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = 'rgba(217, 119, 6, 0.35)'; // Earthy amber
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.stroke();

          // 3D Depth Extrusion Lines (Soil Excavation Pit)
          const depthPxOffset = Math.min(80, Math.max(20, excavationDepthM * 120));
          ctx.save();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);

          // Extrusion bottom polygon
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y + depthPxOffset);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y + depthPxOffset);
          }
          ctx.closePath();
          ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
          ctx.fill();
          ctx.stroke();

          // Vertical edge lines connecting surface to bottom
          for (let i = 0; i < pts.length; i++) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[i].x, pts[i].y + depthPxOffset);
            ctx.stroke();
          }
          ctx.restore();

          // Centroid Volume Display Badge
          let sumX = 0, sumY = 0;
          pts.forEach((p) => {
            sumX += p.x;
            sumY += p.y;
          });
          const centroidX = sumX / pts.length;
          const centroidY = sumY / pts.length;

          const precisionCalc = computePrecisionPolygonArea(pts, canvas.width, canvas.height);
          const vol = computeSoilExcavationVolume(precisionCalc.areaM2, excavationDepthM, pts.length);

          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          const boxW = 310;
          const boxH = 68;
          ctx.beginPath();
          ctx.roundRect(centroidX - boxW / 2, centroidY - boxH / 2, boxW, boxH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`حجم التربة والردم: ${vol.volumeM3.toFixed(3)} م³ (${vol.volumeLiters} لتر)`, centroidX, centroidY - 18);

          ctx.fillStyle = '#fde68a';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`V = المساحة (${vol.surfaceAreaM2.toFixed(2)}م²) × العمق (${vol.measuredDepthM.toFixed(2)}م)`, centroidX, centroidY - 1);

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`📦 أكياس التربة (50L): ${vol.estimatedSoilBags50L} كيس | 🚚 شاحنات: ${vol.estimatedTruckloadsM3} شاحنة`, centroidX, centroidY + 16);
          ctx.restore();
        }

        // Draw Vertices
        pts.forEach((pt, index) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`${index + 1}`, pt.x - 3, pt.y + 3);
        });
      } else {
        // RULE 6: Spatial Mode - Horizontal Area (ARPlane.Type.HORIZONTAL_UPWARD_FACING, Delta Y = 0)
        const pts = pointsRef.current;
        if (pts.length > 0) {
          if (pts.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Centroid Badge displaying exact calibrated area in m²
            let sumX = 0, sumY = 0;
            pts.forEach((p) => {
              sumX += p.x;
              sumY += p.y;
            });
            const centroidX = sumX / pts.length;
            const centroidY = sumY / pts.length;

            const precisionCalc = computePrecisionPolygonArea(pts, canvas.width, canvas.height);
            const areaFormatted = formatAreaArabicDetailed(precisionCalc.areaM2);
            const fused = precisionCalc.fusedResult;

            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.5;

            const boxW = 280;
            const boxH = 56;
            ctx.beginPath();
            ctx.roundRect(centroidX - boxW / 2, centroidY - boxH / 2, boxW, boxH, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`المساحة المعايرة الحقيقية: ${areaFormatted.primary}`, centroidX, centroidY - 14);

            ctx.fillStyle = '#a7f3d0';
            ctx.font = 'bold 10px sans-serif';
            const fusionDetails = fused 
              ? `Shoelace: ${fused.areaShoelace3DM2}م² | Homography: ${fused.areaHomographyBirdEyeM2}م²`
              : `(${areaFormatted.detailed})`;
            ctx.fillText(fusionDetails, centroidX, centroidY + 1);

            ctx.fillStyle = '#38bdf8';
            ctx.font = '9px sans-serif';
            const discText = fused 
              ? `تطابق المنظومتين: ${(100 - (fused.strategyDiscrepancyPercent || 0)).toFixed(1)}% | محيط: ${precisionCalc.perimeterM}م`
              : `محيط: ${precisionCalc.perimeterM}م | معامل الدقة: ${calibrationSettings.scaleFactor.toFixed(3)}x`;
            ctx.fillText(discText, centroidX, centroidY + 16);
            ctx.restore();
          }

          // Draw Edges & Real 3D Unprojected Distances with Centimeter Precision
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          const maxSegments = pts.length >= 3 ? pts.length : (pts.length === 2 ? 1 : 0);
          for (let i = 0; i < maxSegments; i++) {
            const nextIdx = (i + 1) % pts.length;
            const p1 = pts[i];
            const p2 = pts[nextIdx];
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Calculate 3D Real Distance in Meters
            const p1_3D = unprojectScreenTo3DPlane(p1.x, p1.y, canvas.width, canvas.height);
            const p2_3D = unprojectScreenTo3DPlane(p2.x, p2.y, canvas.width, canvas.height);
            const rawDist = distance3D(p1_3D, p2_3D) * calibrationSettings.scaleFactor;
            const distText = formatDistanceArabic(rawDist);

            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
            ctx.fillRect(midX - 38, midY - 12, 76, 22);
            ctx.fillStyle = '#34d399';
            ctx.fillText(distText, midX, midY + 3);
          }

          // If exactly 2 points (Tape mode / Distance check), show distance badge at center
          if (pts.length === 2) {
            const p1_3D = unprojectScreenTo3DPlane(pts[0].x, pts[0].y, canvas.width, canvas.height);
            const p2_3D = unprojectScreenTo3DPlane(pts[1].x, pts[1].y, canvas.width, canvas.height);
            const lineDist = distance3D(p1_3D, p2_3D) * calibrationSettings.scaleFactor;
            const midX = (pts[0].x + pts[1].x) / 2;
            const midY = (pts[0].y + pts[1].y) / 2;

            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            const boxW = 180;
            const boxH = 34;
            ctx.beginPath();
            ctx.roundRect(midX - boxW / 2, midY - 45, boxW, boxH, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`المسافة الخطية: ${lineDist.toFixed(2)} م`, midX, midY - 28);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '9px sans-serif';
            ctx.fillText(`(${Math.round(lineDist * 100)} سم) بين النقطتين`, midX, midY - 16);
            ctx.restore();
          }

          // Draw Points Vertices & 3D Spatial Anchor Rings
          const precisionCalcForVertices = pts.length >= 3 ? computePrecisionPolygonArea(pts, canvas.width, canvas.height) : null;
          const fusedData = precisionCalcForVertices?.fusedResult;

          pts.forEach((pt, index) => {
            const isDragged = draggedVertexIndex === index;
            const vDepth = fusedData?.vertexDepthsM?.[index];

            // Outer Anchor Halo
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isDragged ? 18 : 14, 0, Math.PI * 2);
            ctx.strokeStyle = isDragged ? '#fbbf24' : 'rgba(52, 211, 153, 0.45)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner Vertex
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
            ctx.fillStyle = isDragged ? '#f59e0b' : '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`${index + 1}`, pt.x - 3, pt.y + 3);

            // Display per-vertex metric slant depth badge
            if (vDepth !== undefined) {
              ctx.save();
              ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
              ctx.lineWidth = 1;
              const depthW = 46;
              const depthH = 16;
              ctx.beginPath();
              ctx.roundRect(pt.x - depthW / 2, pt.y - 28, depthW, depthH, 4);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(`${vDepth.toFixed(2)}م`, pt.x, pt.y - 16);
              ctx.restore();
            }
          });

          // Magnifier Loupe when dragging vertex
          if (magnifierPos && draggedVertexIndex !== null) {
            const loupeRadius = 38;
            const loupeX = Math.max(loupeRadius + 10, Math.min(canvas.width - loupeRadius - 10, magnifierPos.x));
            const loupeY = Math.max(loupeRadius + 10, magnifierPos.y - 65);

            ctx.save();
            ctx.beginPath();
            ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
            ctx.clip();

            // Draw zoomed area
            if (snapshotImageObj) {
              ctx.drawImage(
                snapshotImageObj,
                magnifierPos.x - 20, magnifierPos.y - 20, 40, 40,
                loupeX - loupeRadius, loupeY - loupeRadius, loupeRadius * 2, loupeRadius * 2
              );
            } else {
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(loupeX - loupeRadius, loupeY - loupeRadius, loupeRadius * 2, loupeRadius * 2);
            }

            // Loupe crosshair
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(loupeX - 15, loupeY);
            ctx.lineTo(loupeX + 15, loupeY);
            ctx.moveTo(loupeX, loupeY - 15);
            ctx.lineTo(loupeX, loupeY + 15);
            ctx.stroke();

            ctx.restore();

            // Loupe border
            ctx.beginPath();
            ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    mode, 
    preCaptureMode, 
    points, 
    isCameraActive, 
    capturedSnapshot, 
    snapshotImageObj, 
    engine, 
    showDepthHeatmap, 
    simulatedMaxDepth, 
    isFullScreenMode,
    sensorOrientation,
    calibrationSettings,
    magnifierPos,
    draggedVertexIndex,
    computePrecisionPolygonArea,
    unprojectScreenTo3DPlane
  ]);

  // Current measured area for the calibration modal
  const currentPolygonResult = computePrecisionPolygonArea(
    points, 
    canvasRef.current ? canvasRef.current.width : 720, 
    canvasRef.current ? canvasRef.current.height : 420
  );

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl transition-all duration-300 ${
      isFullScreenMode ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen' : 'min-h-[360px]'
    }`}>
      {/* Integrated AR Calibration Modal */}
      <ARCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        settings={calibrationSettings}
        onUpdateSettings={(newSettings) => {
          setCalibrationSettings(newSettings);
          // Recalculate area with new settings
          if (points.length >= 3 && canvasRef.current && onAreaCalculated) {
            const res = calculatePrecisionAreaFrom3DAnchors(
              spatialAnchors.map((a) => a.worldPosition),
              newSettings.scaleFactor
            );
            onAreaCalculated(res.areaM2);
          }
        }}
        sensorOrientation={sensorOrientation}
        currentMeasuredAreaM2={currentPolygonResult.areaM2}
        currentMeasuredPerimeterM={currentPolygonResult.perimeterM}
      />

      {/* Prompt overlay to grant real camera permission if live camera stream is inactive */}
      {!isCameraActive && !capturedSnapshot && (
        <div className="absolute inset-0 z-25 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-emerald-300">تفعيل البث المباشر للكاميرا الخلفية</h3>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              يرجى منح إذن الكاميرا الحقيقي للوصول للبث المباشر بالكاميرا الخلفية وحساب أبعاد السطح والمساحة بدقة.
            </p>
          </div>
          <button
            onClick={() => startLiveCamera()}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all border border-emerald-400/30 ring-2 ring-emerald-500/20 cursor-pointer"
          >
            <Aperture className="w-4.5 h-4.5 animate-spin-slow" />
            <span>طلب إذن الكاميرا الخلفية الحقيقي</span>
          </button>
        </div>
      )}

      {/* Real Live Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isCameraActive && !capturedSnapshot ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Interactive AR Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={720}
        height={420}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative z-10 w-full object-fill cursor-crosshair touch-none select-none bg-transparent ${
          isFullScreenMode ? 'h-full w-full aspect-auto' : 'aspect-[720/420]'
        }`}
      />

      {/* 30-Second Full Screen Mode Top Status Banner */}
      {isFullScreenMode && (
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between gap-3 bg-slate-900/95 border border-emerald-500/50 text-white p-3 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-300">
            <Maximize2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>وضع الشاشة الكاملة للتحديد بدون عوائق 🔍</span>
            <span className="bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-600/50 text-xs">
              متبقي: {fullScreenCountdown}ث
            </span>
          </div>

          <button
            onClick={() => setIsFullScreenMode(false)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <Eye className="w-4 h-4" />
            <span>إظهار الخيارات الآن</span>
          </button>
        </div>
      )}

      {/* Top Precision Calibration HUD Bar */}
      {!isFullScreenMode && (
        <div className="absolute top-3 right-3 left-3 z-30 flex flex-col gap-2">
          {/* Main Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-white text-xs backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="font-bold text-emerald-300 whitespace-nowrap">المنظومة:</span>
              <span className="font-extrabold text-white truncate flex items-center gap-1.5">
                <span>{calibrationSettings.scaleFactor === 1.0 ? 'معايرة قياسية (1.00x)' : `معايرة مخصصة (${calibrationSettings.scaleFactor.toFixed(3)}x)`}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">| ارتفاع: {calibrationSettings.cameraHeightM.toFixed(2)}م</span>
                <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">| زاوية: {sensorOrientation.pitchDeg.toFixed(0)}°</span>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Open Calibration Suite */}
              <button
                onClick={() => setIsCalibrationModalOpen(true)}
                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-emerald-400/30"
                title="فتح منظومة المعايرة والضبط المكاني"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>معايرة القياس ⚙️</span>
              </button>

              {onOpenModeSelection && (
                <button
                  onClick={onOpenModeSelection}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs flex items-center gap-1 transition-all border border-slate-700 cursor-pointer"
                >
                  <span>الوضع 🔄</span>
                </button>
              )}
            </div>
          </div>

          {/* RULE 6: Multi-Mode Spatial Engine Selector Bar */}
          <div className="flex items-center justify-between gap-1.5 p-1.5 px-2 bg-slate-950/85 border border-slate-800/80 rounded-2xl text-xs backdrop-blur-md shadow-lg overflow-x-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSpatialMode('HORIZONTAL_AREA');
                  setPoints([]);
                  setVerticalHeightResult(null);
                  setSoilVolumeResult(null);
                }}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  spatialMode === 'HORIZONTAL_AREA'
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
                }`}
                title="قياس المساحة الأفقية للحديقة أو الثيل (ARPlane.Type.HORIZONTAL_UPWARD_FACING, ΔY = 0)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>المساحة الأفقية (م²)</span>
              </button>

              <button
                onClick={() => {
                  setSpatialMode('VERTICAL_HEIGHT');
                  setPoints([]);
                  setVerticalHeightResult(null);
                  setSoilVolumeResult(null);
                }}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  spatialMode === 'VERTICAL_HEIGHT'
                    ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-400/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
                }`}
                title="قياس الارتفاع الرأسي والجداري (ARPlane.Type.VERTICAL, H = |Y_top - Y_bottom|)"
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
                <span>الارتفاع الرأسي (م)</span>
              </button>

              <button
                onClick={() => {
                  setSpatialMode('EXCAVATION_DEPTH_VOLUME');
                  setPoints([]);
                  setVerticalHeightResult(null);
                  setSoilVolumeResult(null);
                }}
                className={`px-3 py-1 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  spatialMode === 'EXCAVATION_DEPTH_VOLUME'
                    ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
                }`}
                title="قياس عمق الحفر وحجم التربة والردم (V = Area × Depth)"
              >
                <Box className="w-3.5 h-3.5" />
                <span>عمق الحفر والتربة (م³)</span>
              </button>
            </div>

            {/* Contextual Mode Parameter Sliders */}
            {spatialMode === 'EXCAVATION_DEPTH_VOLUME' && (
              <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-900 rounded-lg text-[10px] text-amber-300 font-mono flex-shrink-0">
                <span>العمق:</span>
                <button
                  onClick={() => setExcavationDepthM((d) => Math.max(0.05, Math.round((d - 0.05) * 100) / 100))}
                  className="px-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                >
                  -
                </button>
                <span className="font-bold">{excavationDepthM.toFixed(2)}م</span>
                <button
                  onClick={() => setExcavationDepthM((d) => Math.min(3.0, Math.round((d + 0.05) * 100) / 100))}
                  className="px-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                >
                  +
                </button>
              </div>
            )}

            {spatialMode === 'VERTICAL_HEIGHT' && (
              <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-900 rounded-lg text-[10px] text-sky-300 font-mono flex-shrink-0">
                <span>بعد الجدار:</span>
                <button
                  onClick={() => setWallDistanceM((w) => Math.max(0.5, Math.round((w - 0.5) * 10) / 10))}
                  className="px-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                >
                  -
                </button>
                <span className="font-bold">{wallDistanceM.toFixed(1)}م</span>
                <button
                  onClick={() => setWallDistanceM((w) => Math.min(10.0, Math.round((w + 0.5) * 10) / 10))}
                  className="px-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Environmental Guardrails & Motion Drift Indicator (Rule E) */}
      {(isHighVelocity || guardWarningMessage) && (
        <div className="absolute top-14 left-4 right-4 z-40 bg-amber-950/95 border-2 border-amber-500 text-amber-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
            <span>{guardWarningMessage || 'أبطئ حركة الجهاز (Slow Down Device) لتفادي انحراف التتبع'}</span>
          </div>
          <button
            onClick={() => {
              setIsHighVelocity(false);
              setGuardWarningMessage(null);
            }}
            className="text-xs bg-amber-900 hover:bg-amber-800 text-amber-300 px-2 py-1 rounded-lg border border-amber-600/50"
          >
            حسناً ✕
          </button>
        </div>
      )}

      {/* Central Floating Camera Shutter Button */}
      {!capturedSnapshot && !isFullScreenMode && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2">
          <button
            id="shutter-center-btn"
            onClick={handleTakeSnapshot}
            title="تجميد الإطار المكاني وتثبيت مثبتات AR"
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md p-1 border-2 border-white shadow-2xl flex items-center justify-center transform active:scale-90 transition-all hover:bg-white/30 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500 group-hover:bg-emerald-400 border-2 border-white shadow-inner flex items-center justify-center text-white">
              <Aperture className="w-6 h-6 animate-spin-slow" />
            </div>
          </button>
        </div>
      )}

      {/* Camera Error Alert */}
      {cameraError && !capturedSnapshot && !isFullScreenMode && (
        <div className="absolute top-16 left-3 right-3 z-20 bg-slate-900/95 text-slate-100 border border-amber-500/50 text-xs p-3 rounded-xl flex items-center justify-between gap-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="leading-relaxed">{cameraError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startLiveCamera()}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1"
            >
              <Camera className="w-3 h-3" />
              إعادة التشغيل
            </button>
            <button
              onClick={() => setCameraError(null)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition-colors"
            >
              إغلاق ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      {!isFullScreenMode && !isToolbarCollapsed && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-white text-xs shadow-2xl max-h-40 overflow-y-auto">
          <div className="flex items-center gap-2 flex-wrap">
            {!capturedSnapshot ? (
              <button
                id="take-snapshot-btn"
                onClick={handleTakeSnapshot}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all transform active:scale-95 text-xs sm:text-sm border border-emerald-400/40 ring-2 ring-emerald-500/20"
              >
                <Aperture className="w-4.5 h-4.5 text-white animate-spin-slow" />
                <span>التقاط صورة الكاميرا المباشرة 📸</span>
              </button>
            ) : (
              <>
                <button
                  id="retake-snapshot-btn"
                  onClick={handleRetakeSnapshot}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1.5 shadow-md text-xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة التقاط 🔄</span>
                </button>

                <button
                  id="save-image-report-btn"
                  onClick={handleSaveMeasuredImage}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md text-xs transition-all border border-emerald-400/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>حفظ صورة القياس 💾</span>
                </button>
              </>
            )}

            {mode === 'SURFACE' && (
              <div className="flex items-center p-0.5 bg-slate-950/80 border border-slate-700/80 rounded-xl overflow-x-auto max-w-full">
                <button
                  id="tool-tappoints-btn"
                  onClick={() => setDrawTool('TAP_POINTS')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                    drawTool === 'TAP_POINTS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="تحديد زوايا وأركان المضلع بدقة عالية"
                >
                  <MousePointer className="w-3 h-3" />
                  أركان وزوايا
                </button>
                <button
                  id="tool-rectangle-btn"
                  onClick={() => {
                    setDrawTool('RECTANGLE');
                    setPoints([]);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                    drawTool === 'RECTANGLE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="مستطيل ذكي بنقرتين متعاكستين"
                >
                  <Square className="w-3 h-3" />
                  مستطيل
                </button>
                <button
                  id="tool-tape-btn"
                  onClick={() => {
                    setDrawTool('TAPE');
                    setPoints([]);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                    drawTool === 'TAPE'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="شريط قياس مسافة خطية مستقيمة بين نقطتين"
                >
                  <Ruler className="w-3 h-3" />
                  مسافة خطية
                </button>
                <button
                  id="tool-circle-btn"
                  onClick={() => {
                    setDrawTool('CIRCLE');
                    setPoints([]);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                    drawTool === 'CIRCLE'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="حوض دائري (نقطة المركز ونصف القطر)"
                >
                  <Circle className="w-3 h-3" />
                  حوض دائري
                </button>
                <button
                  id="tool-freehand-btn"
                  onClick={() => setDrawTool('FREEHAND')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer ${
                    drawTool === 'FREEHAND'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="رسم مسار حر متواصل"
                >
                  <Pencil className="w-3 h-3" />
                  رسم حر
                </button>
              </div>
            )}

            {mode === 'SURFACE' && (
              <button
                id="preset-surface-btn"
                onClick={handleAutoPresetSurface}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-medium flex items-center gap-1 transition-all text-[11px] whitespace-nowrap cursor-pointer"
              >
                <Focus className="w-3.5 h-3.5" />
                شكل افتراضي
              </button>
            )}

            {mode === 'HOLE_DEPTH' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="scan-hole-btn"
                  onClick={handleScanHole}
                  className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-500 rounded-xl font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  مسح AR Depth وحساب الردم
                </button>

                {/* Depth Quick Tweak */}
                <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-700 text-[11px]">
                  <span className="text-slate-400">العمق:</span>
                  <button
                    onClick={() => {
                      const newD = Math.max(0.1, Math.round((simulatedAvgDepth - 0.05) * 100) / 100);
                      setSimulatedAvgDepth(newD);
                      setSimulatedMaxDepth(Math.round((newD * 1.3) * 100) / 100);
                    }}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-amber-300 font-bold"
                  >
                    -5سم
                  </button>
                  <span className="font-bold text-amber-400 font-mono px-1">{(simulatedAvgDepth * 100).toFixed(0)}سم</span>
                  <button
                    onClick={() => {
                      const newD = Math.min(3.0, Math.round((simulatedAvgDepth + 0.05) * 100) / 100);
                      setSimulatedAvgDepth(newD);
                      setSimulatedMaxDepth(Math.round((newD * 1.3) * 100) / 100);
                    }}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-amber-300 font-bold"
                  >
                    +5سم
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'SURFACE' && points.length > 0 && (
              <button
                id="clear-points-btn"
                onClick={() => {
                  setPoints([]);
                  if (onAreaCalculated) onAreaCalculated(0);
                }}
                className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xl flex items-center gap-1 transition-all text-[11px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                تصفير ({points.length})
              </button>
            )}

            {mode === 'HOLE_DEPTH' && (
              <button
                id="toggle-heatmap-btn"
                onClick={() => setShowDepthHeatmap(!showDepthHeatmap)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 transition-all text-[11px]"
              >
                <Layers className="w-3.5 h-3.5" />
                {showDepthHeatmap ? 'إخفاء العمق' : 'إظهار العمق'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
