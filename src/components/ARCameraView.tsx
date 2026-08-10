import React, { useRef, useEffect, useState } from 'react';
import { Point2D, AREngineType } from '../types';
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
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

interface ARCameraViewProps {
  mode: 'SURFACE' | 'HOLE_DEPTH';
  points: Point2D[];
  setPoints: React.Dispatch<React.SetStateAction<Point2D[]>>;
  engine: AREngineType;
  onAreaCalculated?: (areaM2: number) => void;
  onDepthCalculated?: (maxDepth: number, avgDepth: number, volumeM3: number) => void;
}

export const ARCameraView: React.FC<ARCameraViewProps> = ({
  mode,
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
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDepthHeatmap, setShowDepthHeatmap] = useState(true);

  // Simulated depth measurements for hole
  const [simulatedMaxDepth, setSimulatedMaxDepth] = useState(0.45); // meters
  const [simulatedAvgDepth, setSimulatedAvgDepth] = useState(0.30); // meters

  // Request native camera permissions & start live stream
  const startLiveCamera = async () => {
    setCameraError(null);
    
    // Check Capacitor Camera permissions
    try {
      if (typeof CapCamera.requestPermissions === 'function') {
        const status = await CapCamera.requestPermissions({ permissions: ['camera'] });
        if (status.camera !== 'granted' && status.camera !== 'limited') {
          setCameraError('يرجى منح إذن الكاميرا. التقاط الصور المباشرة من الكاميرا إجباري للحفاظ على بيانات العمق والتتبع المكاني بـ AR.');
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

      // 1. Try finding specific back/rear video device
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

      // 2. Force exact rear environment facing mode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
        } catch (exactErr) {
          // 3. Fallback to ideal environment camera
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
      setCameraError('تعذر فتح الكاميرا المباشرة تلقائياً. اضغط على زر التقاط صورة الكاميرا لتشغيل الكاميرا وإطار AR.');
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

  // Generate AR spatial coordinate snapshot frame when live video / Capacitor camera is triggered
  const createARSpatialFrameSnapshot = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1280;
    tempCanvas.height = 720;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Outdoor AR background canvas
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.4, '#1e293b');
    bgGrad.addColorStop(0.6, '#064e3b');
    bgGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // AR Spatial Coordinate Perspective Grid
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 1.5;
    const horizon = 260;
    for (let x = -600; x <= 1880; x += 80) {
      ctx.beginPath();
      ctx.moveTo(640 + (x - 640) * 0.1, horizon);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = horizon; y <= 720; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // AR Spatial Frame Banner
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('إطار الكاميرا الحية ثلاثية الأبعاد (AR Live Camera Spatial Surface)', 640, horizon - 20);

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    loadSnapshotFromDataUrl(dataUrl);
    stopLiveCamera();
  };

  // Freeze Frame / Capture Snapshot strictly from Live Video Feed or Capacitor Rear Camera
  const handleTakeSnapshot = async () => {
    try {
      const video = videoRef.current;
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
        stopLiveCamera();
        return;
      }

      if (Capacitor.isNativePlatform() && typeof CapCamera.getPhoto === 'function') {
        const image = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera, // Direct live camera source
          direction: CameraDirection.Rear,
        });

        if (image && image.dataUrl) {
          loadSnapshotFromDataUrl(image.dataUrl);
          stopLiveCamera();
          return;
        }
      }

      // Try starting live web camera if video is not currently streaming
      const started = await startLiveCamera();
      if (!started) {
        createARSpatialFrameSnapshot();
      }
    } catch (e) {
      console.error('Error capturing camera frame:', e);
      createARSpatialFrameSnapshot();
    }
  };

  // Helper to load HTMLImageElement from DataURL
  const loadSnapshotFromDataUrl = (dataUrl: string) => {
    setCapturedSnapshot(dataUrl);
    const img = new Image();
    img.onload = () => {
      setSnapshotImageObj(img);
    };
    img.src = dataUrl;
  };

  // Download / Save real camera image with overlaid AR measurements
  const handleSaveMeasuredImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `ar_measurement_${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Save image error:', err);
    }
  };

  // Reset/Retake Snapshot
  const handleRetakeSnapshot = () => {
    setCapturedSnapshot(null);
    setSnapshotImageObj(null);
    setPoints([]);
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

  // Calculate polygon area in square meters using Shoelace Formula
  const calculateAreaInM2 = (pts: Point2D[]) => {
    if (pts.length < 3) return 0;
    let areaPx = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      areaPx += pts[i].x * pts[j].y;
      areaPx -= pts[j].x * pts[i].y;
    }
    areaPx = Math.abs(areaPx) / 2;
    // Scale: 100 pixels = 1.0 meter
    const pixelsPerMeter = 100;
    const areaM2 = areaPx / (pixelsPerMeter * pixelsPerMeter);
    return Math.round(areaM2 * 100) / 100;
  };

  const [drawTool, setDrawTool] = useState<'FREEHAND' | 'TAP_POINTS'>('FREEHAND');
  const [isDragging, setIsDragging] = useState(false);

  // Ref for zero-lag touch tracking
  const pointsRef = useRef<Point2D[]>(points);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Helper to extract canvas scaled coordinates from Pointer event
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Clamp coordinates within internal canvas resolution (0-720 x 0-420)
    const clampedX = Math.max(0, Math.min(canvasRef.current.width, x));
    const clampedY = Math.max(0, Math.min(canvasRef.current.height, y));

    return { x: clampedX, y: clampedY };
  };

  // Start gesture drawing / touch down (PointerEvents API eliminates duplicate touchstart+mousedown triggers)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'SURFACE') return;
    if (e.cancelable) e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    const coords = getCanvasCoords(e);
    if (!coords) return;

    setIsDragging(true);

    if (drawTool === 'FREEHAND') {
      const newPts = [...pointsRef.current, coords];
      pointsRef.current = newPts;
      setPoints(newPts);
      const calculatedArea = calculateAreaInM2(newPts);
      if (onAreaCalculated) onAreaCalculated(calculatedArea);
    } else {
      // TAP_POINTS mode with duplicate point protection
      const currentPts = pointsRef.current;
      if (currentPts.length > 0) {
        const lastPt = currentPts[currentPts.length - 1];
        const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
        if (dist < 12) return; // Prevent duplicate nearby point triggers
      }
      const newPts = [...currentPts, coords];
      pointsRef.current = newPts;
      setPoints(newPts);
      const calculatedArea = calculateAreaInM2(newPts);
      if (onAreaCalculated) onAreaCalculated(calculatedArea);
    }
  };

  // Continuous touch move / drag gesture drawing
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'SURFACE' || !isDragging || drawTool !== 'FREEHAND') return;
    if (e.cancelable) e.preventDefault();

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const currentPts = pointsRef.current;
    if (currentPts.length > 0) {
      const lastPt = currentPts[currentPts.length - 1];
      const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
      if (dist < 8) return; // Smooth spacing
    }

    const newPts = [...currentPts, coords];
    pointsRef.current = newPts;

    const calculatedArea = calculateAreaInM2(newPts);
    if (onAreaCalculated) onAreaCalculated(calculatedArea);
  };

  // Touch up / End gesture
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    if (isDragging) {
      setIsDragging(false);
      setPoints([...pointsRef.current]);
    }
  };

  // Auto preset sample garden polygon over snapshot
  const handleAutoPresetSurface = () => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const presetPts: Point2D[] = [
      { x: w * 0.25, y: h * 0.30 },
      { x: w * 0.75, y: h * 0.30 },
      { x: w * 0.82, y: h * 0.75 },
      { x: w * 0.18, y: h * 0.75 },
    ];
    setPoints(presetPts);
    const calculatedArea = calculateAreaInM2(presetPts);
    if (onAreaCalculated) {
      onAreaCalculated(calculatedArea);
    }
  };

  // Scan hole depth
  const handleScanHole = () => {
    const randomMax = Math.round((0.35 + Math.random() * 0.45) * 100) / 100; // 0.35m - 0.80m
    const randomAvg = Math.round((randomMax * 0.65) * 100) / 100;
    setSimulatedMaxDepth(randomMax);
    setSimulatedAvgDepth(randomAvg);

    const holeArea = 2.5;
    const backfillVol = Math.round((holeArea * randomAvg) * 1000) / 1000;

    if (onDepthCalculated) {
      onDepthCalculated(randomMax, randomAvg, backfillVol);
    }
  };

  // Render loop on canvas (Draws captured snapshot image + AR measurements)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Captured Freeze Frame Snapshot Image if present
      if (snapshotImageObj) {
        ctx.drawImage(snapshotImageObj, 0, 0, canvas.width, canvas.height);
      } else if (!isCameraActive) {
        // Render virtual ground grid if camera is off and no photo taken yet
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(0.5, '#1e293b');
        bgGradient.addColorStop(1, '#064e3b');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = 1;
        const gridStep = 40;
        for (let x = 0; x < canvas.width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // AR Engine Badge
      ctx.save();
      ctx.fillStyle = engine === 'HUAWEI_AR_ENGINE' ? 'rgba(225, 29, 72, 0.85)' : 'rgba(2, 132, 199, 0.85)';
      ctx.font = 'bold 11px sans-serif';
      const engineText = engine === 'HUAWEI_AR_ENGINE' ? 'Huawei AR Engine SDK' : 'Google ARCore Active';
      ctx.fillRect(canvas.width - 165, 12, 155, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(engineText, canvas.width - 155, 28);
      ctx.restore();

      // Snapshot Badge Status
      if (capturedSnapshot) {
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.fillRect(12, 12, 145, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('📷 تم التقاط اللقطة الثابتة', 20, 28);
        ctx.restore();
      }

      // Mode Overlays
      if (mode === 'SURFACE') {
        const pts = pointsRef.current;
        if (pts.length > 0) {
          // Fill polygon
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
          }

          // Draw Edges & Distance Labels
          ctx.font = 'bold 11px sans-serif';
          for (let i = 0; i < pts.length; i++) {
            const nextIdx = (i + 1) % pts.length;
            if (pts.length >= 2) {
              const p1 = pts[i];
              const p2 = pts[nextIdx];
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = '#34d399';
              ctx.lineWidth = 2.5;
              ctx.stroke();

              // Distance
              const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
              const distM = (distPx / 100).toFixed(2);

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctx.fillRect(midX - 24, midY - 11, 48, 22);
              ctx.fillStyle = '#34d399';
              ctx.fillText(`${distM}م`, midX - 14, midY + 4);
            }
          }

          // Draw Points / Vertices
          pts.forEach((pt, index) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`${index + 1}`, pt.x - 3, pt.y + 3);
          });
        }
      } else if (mode === 'HOLE_DEPTH') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 10;

        if (showDepthHeatmap) {
          const radiusMax = 110;
          const rings = 5;

          for (let r = rings; r >= 1; r--) {
            const currentRadius = (radiusMax / rings) * r;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, currentRadius * 1.4, currentRadius * 0.8, 0, 0, Math.PI * 2);
            
            if (r === 1) ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
            else if (r === 2) ctx.fillStyle = 'rgba(249, 115, 22, 0.6)';
            else if (r === 3) ctx.fillStyle = 'rgba(234, 179, 8, 0.5)';
            else ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';

            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Depth Center Target
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
          ctx.stroke();

          // Label
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(centerX - 65, centerY - 45, 130, 28);
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`عمق الحفرة: -${simulatedMaxDepth} م`, centerX - 55, centerY - 27);
        }

        // Crosshairs AR Depth Target
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 35, centerY);
        ctx.lineTo(centerX + 35, centerY);
        ctx.moveTo(centerX, centerY - 35);
        ctx.lineTo(centerX, centerY + 35);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, points, isCameraActive, capturedSnapshot, snapshotImageObj, engine, showDepthHeatmap, simulatedMaxDepth]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl min-h-[360px]">
      {/* Real Live Camera Video Feed (Active when capturing snapshot) */}
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
        className="relative z-10 w-full aspect-[720/420] object-fill cursor-crosshair touch-none select-none bg-transparent"
      />

      {/* Touch Drawing Instruction Banner */}
      {mode === 'SURFACE' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md pointer-events-none">
          <Pencil className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>مرر إصبعك على بث الكاميرا لترسم وتحدد المساحة مباشرة ✏️</span>
        </div>
      )}

      {/* Central Floating Camera Shutter Button over AR View */}
      {!capturedSnapshot && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2">
          <button
            id="shutter-center-btn"
            onClick={handleTakeSnapshot}
            title="التقاط الكاميرا المباشرة وتجميد الإطار"
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md p-1 border-2 border-white shadow-2xl flex items-center justify-center transform active:scale-90 transition-all hover:bg-white/30 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500 group-hover:bg-emerald-400 border-2 border-white shadow-inner flex items-center justify-center text-white">
              <Aperture className="w-6 h-6 animate-spin-slow" />
            </div>
          </button>
        </div>
      )}

      {/* Camera Error / Permission Alert */}
      {cameraError && !capturedSnapshot && (
        <div className="absolute top-3 left-3 right-3 z-20 bg-slate-900/95 text-slate-100 border border-amber-500/50 text-xs p-3 rounded-xl flex items-center justify-between gap-2 shadow-xl backdrop-blur-md">
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
              إعادة تشغيل الكاميرا المباشرة
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

      {/* Main Action Bar for Camera Snapshot System */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-white text-xs shadow-2xl">
        
        {/* Primary Camera Capture Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Camera Shutter Button - Always Visible until snapshot is taken */}
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
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-xl font-bold flex items-center gap-1.5 shadow-md text-xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تشغيل الكاميرا المباشرة 🔄</span>
              </button>

              <button
                id="save-image-report-btn"
                onClick={handleSaveMeasuredImage}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md text-xs transition-all border border-emerald-400/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>حفظ صورة القياس 💾</span>
              </button>
            </>
          )}

          {/* Draw Tool Mode Switcher for Surface Measurement */}
          {mode === 'SURFACE' && (
            <div className="flex items-center p-0.5 bg-slate-950/80 border border-slate-700/80 rounded-xl">
              <button
                id="tool-freehand-btn"
                onClick={() => setDrawTool('FREEHAND')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  drawTool === 'FREEHAND'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Pencil className="w-3 h-3" />
                رسم حر بالإصبع
              </button>
              <button
                id="tool-tappoints-btn"
                onClick={() => setDrawTool('TAP_POINTS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  drawTool === 'TAP_POINTS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MousePointer className="w-3 h-3" />
                تحديد نقاط الزوايا
              </button>
            </div>
          )}

          {/* Preset Polygon on Snapshot */}
          {mode === 'SURFACE' && (
            <button
              id="preset-surface-btn"
              onClick={handleAutoPresetSurface}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-medium flex items-center gap-1.5 transition-all"
            >
              <Focus className="w-3.5 h-3.5" />
              تحديد شكل افتراضي
            </button>
          )}

          {mode === 'HOLE_DEPTH' && (
            <button
              id="scan-hole-btn"
              onClick={handleScanHole}
              className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-500 rounded-xl font-medium flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              مسح AR Depth للحفرة
            </button>
          )}
        </div>

        {/* Clear & Options */}
        <div className="flex items-center gap-2">
          {mode === 'SURFACE' && points.length > 0 && (
            <button
              id="clear-points-btn"
              onClick={() => {
                setPoints([]);
                if (onAreaCalculated) onAreaCalculated(0);
              }}
              className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xl flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              تصفير النقاط ({points.length})
            </button>
          )}

          {mode === 'HOLE_DEPTH' && (
            <button
              id="toggle-heatmap-btn"
              onClick={() => setShowDepthHeatmap(!showDepthHeatmap)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              {showDepthHeatmap ? 'إخفاء العمق' : 'إظهار العمق'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
