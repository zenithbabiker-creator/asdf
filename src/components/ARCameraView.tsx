import React, { useRef, useEffect, useState } from 'react';
import { Point2D, AREngineType } from '../types';
import { Camera, RefreshCw, Eye, Grid, Focus, Layers, Sparkles } from 'lucide-react';

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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gridScaleMeters, setGridScaleMeters] = useState(1.0); // 1.0 = 100px per meter
  const [showDepthHeatmap, setShowDepthHeatmap] = useState(true);

  // Default simulated hole depths
  const [simulatedMaxDepth, setSimulatedMaxDepth] = useState(0.45); // meters
  const [simulatedAvgDepth, setSimulatedAvgDepth] = useState(0.30); // meters

  // Start / Stop live device camera
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } catch (err: any) {
        console.error('Camera access error:', err);
        setCameraError('لم نتمكن من الوصول للكاميرا الحية. سيتم استخدام بيئة الواقع المعزز التفاعلية.');
        setIsCameraActive(false);
      }
    }
  };

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
    // Scale: 100 pixels = gridScaleMeters
    const pixelsPerMeter = 100;
    const areaM2 = areaPx / (pixelsPerMeter * pixelsPerMeter);
    return Math.round(areaM2 * 100) / 100;
  };

  // Handle Canvas Click to add AR Point
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'SURFACE') {
      const newPts = [...points, { x, y }];
      setPoints(newPts);
      const calculatedArea = calculateAreaInM2(newPts);
      if (onAreaCalculated) {
        onAreaCalculated(calculatedArea);
      }
    }
  };

  // Auto preset 4-corner garden surface polygon
  const handleAutoPresetSurface = () => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const presetPts: Point2D[] = [
      { x: w * 0.25, y: h * 0.35 },
      { x: w * 0.75, y: h * 0.35 },
      { x: w * 0.85, y: h * 0.75 },
      { x: w * 0.15, y: h * 0.75 },
    ];
    setPoints(presetPts);
    const calculatedArea = calculateAreaInM2(presetPts);
    if (onAreaCalculated) {
      onAreaCalculated(calculatedArea);
    }
  };

  // Auto scan depth hole
  const handleScanHole = () => {
    const randomMax = Math.round((0.35 + Math.random() * 0.45) * 100) / 100; // 0.35m - 0.80m
    const randomAvg = Math.round((randomMax * 0.65) * 100) / 100;
    setSimulatedMaxDepth(randomMax);
    setSimulatedAvgDepth(randomAvg);

    // Assume simulated hole surface area is ~ 4.5 m2
    const surfaceArea = 4.5;
    const backfillVol = Math.round((surfaceArea * randomAvg) * 1000) / 1000;

    if (onDepthCalculated) {
      onDepthCalculated(randomMax, randomAvg, backfillVol);
    }
  };

  // Canvas Drawing Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Simulated Garden AR Background if camera is not active
      if (!isCameraActive) {
        // Subtle grass/ground gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(0.4, '#1e293b');
        bgGradient.addColorStop(1, '#064e3b');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 3D Perspective AR Ground Grid
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
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

      // 2. Engine Badge Overlay on Top-Right
      ctx.save();
      ctx.fillStyle = engine === 'HUAWEI_AR_ENGINE' ? 'rgba(225, 29, 72, 0.85)' : 'rgba(2, 132, 199, 0.85)';
      ctx.font = 'bold 12px IBM Plex Sans Arabic, sans-serif';
      const engineText = engine === 'HUAWEI_AR_ENGINE' ? 'Huawei AR Engine SDK (Local ./huawei-ar-sdk/)' : 'Google ARCore Active';
      ctx.fillRect(canvas.width - 240, 12, 228, 26);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(engineText, canvas.width - 230, 29);
      ctx.restore();

      // 3. Mode Specific Overlay
      if (mode === 'SURFACE') {
        // Draw AR Surface Polygon
        if (points.length > 0) {
          // Fill polygon
          if (points.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
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

          // Draw Edges with Length Labels
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#10b981';
          for (let i = 0; i < points.length; i++) {
            const nextIdx = (i + 1) % points.length;
            if (points.length >= 2) {
              const p1 = points[i];
              const p2 = points[nextIdx];
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = '#34d399';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Calculate edge distance in meters
              const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
              const distM = (distPx / 100).toFixed(2);

              // Draw distance badge
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctx.fillRect(midX - 22, midY - 10, 44, 20);
              ctx.fillStyle = '#34d399';
              ctx.fillText(`${distM}م`, midX - 12, midY + 4);
            }
          }

          // Draw Points / Nodes
          points.forEach((pt, index) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Point index badge
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(`${index + 1}`, pt.x - 3, pt.y + 3);
          });
        }
      } else if (mode === 'HOLE_DEPTH') {
        // Draw AR Depth Heatmap Scanner
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 20;

        if (showDepthHeatmap) {
          // Heatmap Rings (Red = deepest center, Yellow = middle, Blue = surface level)
          const radiusMax = 120;
          const rings = 5;

          for (let r = rings; r >= 1; r--) {
            const currentRadius = (radiusMax / rings) * r;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, currentRadius * 1.4, currentRadius * 0.8, 0, 0, Math.PI * 2);
            
            // Heatmap color interpolation
            if (r === 1) ctx.fillStyle = 'rgba(239, 68, 68, 0.75)'; // Red deep
            else if (r === 2) ctx.fillStyle = 'rgba(249, 115, 22, 0.6)';
            else if (r === 3) ctx.fillStyle = 'rgba(234, 179, 8, 0.5)';
            else ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';

            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Depth Center Reticle & Label
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
          ctx.stroke();

          // Depth Label Badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(centerX - 60, centerY - 45, 120, 28);
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 12px IBM Plex Sans Arabic, sans-serif';
          ctx.fillText(`عمق الحفرة: -${simulatedMaxDepth} م`, centerX - 52, centerY - 27);
        }

        // Crosshairs AR Depth Target
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 30, centerY);
        ctx.lineTo(centerX + 30, centerY);
        ctx.moveTo(centerX, centerY - 30);
        ctx.lineTo(centerX, centerY + 30);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, points, isCameraActive, engine, showDepthHeatmap, simulatedMaxDepth]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      {/* Hidden Video element for real camera */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* Interactive AR Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={720}
        height={420}
        onClick={handleCanvasClick}
        className="w-full h-[320px] sm:h-[400px] object-cover cursor-crosshair touch-none"
      />

      {/* Camera Error Alert if denied */}
      {cameraError && (
        <div className="absolute top-4 left-4 right-4 bg-rose-950/90 text-rose-200 border border-rose-800 text-xs p-2.5 rounded-xl text-center shadow-lg">
          {cameraError}
        </div>
      )}

      {/* Floating Toolbar on Canvas */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-white text-xs">
        {/* Left Side: Camera Toggle & Mode Controls */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-camera-btn"
            onClick={toggleCamera}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              isCameraActive
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {isCameraActive ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا الحية'}
          </button>

          {mode === 'SURFACE' && (
            <button
              id="preset-surface-btn"
              onClick={handleAutoPresetSurface}
              className="px-3 py-1.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-600/40 font-medium flex items-center gap-1.5 transition-all"
            >
              <Focus className="w-3.5 h-3.5" />
              تحديد مساحة عينة
            </button>
          )}

          {mode === 'HOLE_DEPTH' && (
            <button
              id="scan-hole-btn"
              onClick={handleScanHole}
              className="px-3 py-1.5 bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-600/40 font-medium flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              مسح AR Depth للحفرة
            </button>
          )}
        </div>

        {/* Right Side: Clear / Toggle Overlay */}
        <div className="flex items-center gap-2">
          {mode === 'SURFACE' && points.length > 0 && (
            <button
              id="clear-points-btn"
              onClick={() => {
                setPoints([]);
                if (onAreaCalculated) onAreaCalculated(0);
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تصفير النقاط ({points.length})
            </button>
          )}

          {mode === 'HOLE_DEPTH' && (
            <button
              id="toggle-heatmap-btn"
              onClick={() => setShowDepthHeatmap(!showDepthHeatmap)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              {showDepthHeatmap ? 'إخفاء الخريطة الحرارية' : 'إظهار خريطة العمق'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
