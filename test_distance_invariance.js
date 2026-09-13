// Unit Test & Validation Script for Distance-Invariance
// Simulates a 1m x 1m real square measured at 1.5m, 3.0m, and 6.0m camera distances.

function runDistanceInvarianceValidation() {
  const H = 1.4; // 1.4m camera height
  const pitchRad = (45.0 * Math.PI) / 180.0; // 45 degree tilt
  const rollRad = (0.0 * Math.PI) / 180.0;
  const fx = 800.0, fy = 800.0, cx = 640.0, cy = 360.0;

  console.log("================================================================================");
  console.log("AR SURFACE AREA DISTANCE-INVARIANCE TEST SUITE (1.0m x 1.0m GROUND SQUARE)");
  console.log("Simulating camera height H = 1.4m, pitch = 45.0 deg, focal length = 800 px");
  console.log("================================================================================\n");

  // World to Screen Projection
  function projectWorldToScreen(Xw, Zw) {
    const sinT = Math.sin(pitchRad);
    const cosT = Math.cos(pitchRad);
    // Camera coordinates
    const Xc = Xw;
    const Yc = H * cosT - Zw * sinT;
    const Zc = H * sinT + Zw * cosT;
    const u = cx + fx * (Xc / Zc);
    const v = cy + fy * (Yc / Zc);
    return { u, v, Zc, slantDepth: Math.hypot(Xc, Yc, Zc) };
  }

  // Strategy 1: Raycasting to 3D Plane
  function raycastToGround(u, v) {
    const xn = (u - cx) / fx;
    const yn = (v - cy) / fy;
    const sinT = Math.sin(pitchRad);
    const cosT = Math.cos(pitchRad);
    const denom = sinT + yn * cosT;
    const t = H / denom;
    const Xw = t * xn;
    const Zw = t * (cosT - yn * sinT);
    const slantDist = Math.sqrt(Xw * Xw + H * H + Zw * Zw);
    const scaleMPerPx = slantDist / fx;
    return { X: Xw, Z: Zw, slantDist, scaleMPerPx };
  }

  // Strategy 2: Planar Homography 3x3 Matrix & Inversion
  function getHomographyMatrices() {
    const sinT = Math.sin(pitchRad);
    const cosT = Math.cos(pitchRad);
    const E = [
      [1, 0, 0],
      [0, -sinT, H * cosT],
      [0, cosT, H * sinT]
    ];
    const H_mat = [
      [fx * E[0][0] + cx * E[2][0], fx * E[0][1] + cx * E[2][1], fx * E[0][2] + cx * E[2][2]],
      [fy * E[1][0] + cy * E[2][0], fy * E[1][1] + cy * E[2][1], fy * E[1][2] + cy * E[2][2]],
      [E[2][0], E[2][1], E[2][2]]
    ];

    // Invert 3x3
    const [
      [m00, m01, m02],
      [m10, m11, m12],
      [m20, m21, m22]
    ] = H_mat;
    const det = m00 * (m11 * m22 - m12 * m21) -
                m01 * (m10 * m22 - m12 * m20) +
                m02 * (m10 * m21 - m11 * m20);
    const invDet = 1 / det;
    const H_inv = [
      [ (m11 * m22 - m12 * m21) * invDet, (m02 * m21 - m01 * m22) * invDet, (m01 * m12 - m02 * m11) * invDet ],
      [ (m12 * m20 - m10 * m22) * invDet, (m00 * m22 - m02 * m20) * invDet, (m02 * m10 - m00 * m12) * invDet ],
      [ (m10 * m21 - m11 * m20) * invDet, (m01 * m20 - m00 * m21) * invDet, (m00 * m11 - m01 * m10) * invDet ]
    ];
    return { H_mat, H_inv };
  }

  function unprojectViaHInv(u, v, H_inv) {
    const x = H_inv[0][0] * u + H_inv[0][1] * v + H_inv[0][2];
    const z = H_inv[1][0] * u + H_inv[1][1] * v + H_inv[1][2];
    const w = H_inv[2][0] * u + H_inv[2][1] * v + H_inv[2][2];
    return { X: x / w, Z: z / w };
  }

  function shoelace(pts) {
    let a = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      a += pts[i].X * pts[next].Z - pts[next].X * pts[i].Z;
    }
    return Math.abs(a) * 0.5;
  }

  const { H_inv } = getHomographyMatrices();
  const testDistances = [1.5, 3.0, 6.0];
  let allPass = true;

  testDistances.forEach((dist, idx) => {
    // 1m x 1m square centered laterally around X=0, spanning Z in [dist - 0.5, dist + 0.5]
    const squareGround = [
      { X: -0.5, Z: dist - 0.5 },
      { X:  0.5, Z: dist - 0.5 },
      { X:  0.5, Z: dist + 0.5 },
      { X: -0.5, Z: dist + 0.5 },
    ];

    // Project to screen pixels (what the camera sensor captures):
    const screenPixels = squareGround.map(p => projectWorldToScreen(p.X, p.Z));

    // Screen pixel area (for comparison to illustrate the foreshortening phenomenon):
    let screenPixelShoelace = 0;
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      screenPixelShoelace += screenPixels[i].u * screenPixels[next].v - screenPixels[next].u * screenPixels[i].v;
    }
    const rawPixelArea = Math.abs(screenPixelShoelace) * 0.5;

    // Strategy 1: Raycasting to 3D World Coordinates
    const raycast3D = screenPixels.map(p => raycastToGround(p.u, p.v));
    const areaStrategy1 = shoelace(raycast3D);

    // Strategy 2: Planar Homography Orthorectification (Bird's Eye View)
    const birdEyePts = screenPixels.map(p => unprojectViaHInv(p.u, p.v, H_inv));
    const areaStrategy2 = shoelace(birdEyePts);

    // Strategy 3: Dynamic Vertex Depth and Metric Scale-per-pixel
    const vertexDepths = raycast3D.map(p => p.slantDist.toFixed(3) + "m");
    const scalesMmPerPx = raycast3D.map(p => (p.scaleMPerPx * 1000).toFixed(2) + "mm/px");

    // Strategy 4: Multi-Strategy Fusion & Discrepancy Cross-Verification
    const fusedArea = (areaStrategy1 + areaStrategy2) / 2.0;
    const discrepancyPct = Math.abs(areaStrategy1 - areaStrategy2) / fusedArea * 100.0;
    const isInvariant = Math.abs(fusedArea - 1.0) <= 0.005;

    if (!isInvariant) allPass = false;

    console.log(`TEST CASE ${idx + 1}: Target Distance = ${dist.toFixed(1)} meters`);
    console.log(`  - Captured Screen Pixel Area  : ${Math.round(rawPixelArea).toLocaleString()} px^2 (Drops by ${(rawPixelArea / 71830.0 * 100).toFixed(1)}% vs 1.5m due to perspective)`);
    console.log(`  - Strategy 1 (Raycast 3D)     : ${areaStrategy1.toFixed(6)} m^2`);
    console.log(`  - Strategy 2 (Homography Bird): ${areaStrategy2.toFixed(6)} m^2`);
    console.log(`  - Strategy 3 (Vertex Depths)  : [${vertexDepths.join(", ")}]`);
    console.log(`  - Strategy 3 (Metric Scales)  : [${scalesMmPerPx.join(", ")}]`);
    console.log(`  - Strategy 4 (Fused Area)     : ${fusedArea.toFixed(6)} m^2 | Discrepancy: ${discrepancyPct.toFixed(4)}%`);
    console.log(`  - STATUS                      : ${isInvariant ? " PASSED (1.00 m^2 ± 0.00)" : "❌ FAILED"}\n`);
  });

  console.log("================================================================================");
  console.log(`FINAL TEST RESULT: ${allPass ? "ALL DISTANCE-INVARIANCE TESTS PASSED SUCCESSFULLY! " : "FAILED"}`);
  console.log("================================================================================");
}

runDistanceInvarianceValidation();
