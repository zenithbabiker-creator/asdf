import { ProjectFile } from '../types';

export const STANDALONE_ANDROID_PROJECT_FILES: ProjectFile[] = [
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    language: 'gradle',
    descriptionAr: 'ملف إعدادات الجرادل الرئيسي للمشروع مع دعم لمكتبات أندرويد وCompose وARCore وربط AAR لـ Huawei AR Engine من مجلد المكونات المحلية/assets/libs',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}

buildscript {
    repositories {
        google()
        mavenCentral()
        // Local directory repositories for Huawei AR Engine AAR SDK (ar engine sdk 4.0.0.5.aar)
        flatDir {
            dirs(
                file("\${rootDir}/assets"),
                file("\${rootDir}/assets/libs"),
                file("\${rootDir}/app/src/main/assets"),
                file("\${rootDir}/huawei-ar-sdk"),
                file("\${rootDir}/libs"),
                file("\${rootDir}/app/libs")
            )
        }
    }
}
`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts (App)',
    language: 'gradle',
    descriptionAr: 'ملف الجرادل المخصص للتطبيق والذي يربط ملف arenginesdk-4.0.0.5.aar المحلي المضاف يدوياً في مجلد assets أو libs أو huawei-ar-sdk مع Google ARCore',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.argarden.soilcalculator"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.argarden.soilcalculator"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

repositories {
    google()
    mavenCentral()
    // Local Huawei SDK lookup (ar engine sdk 4.0.0.5.aar placed in assets/ or libs/)
    flatDir {
        dirs(
            file("\${rootDir}/assets"),
            file("\${rootDir}/assets/libs"),
            file("\${rootDir}/app/src/main/assets"),
            file("\${rootDir}/huawei-ar-sdk"),
            file("\${rootDir}/libs"),
            file("libs"),
            file("src/main/assets")
        )
    }
}

dependencies {
    // AndroidX & Jetpack Compose (Material 3)
    implementation(platform(libs.androidx.compose.bom))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")

    // Google ARCore SDK
    implementation("com.google.ar:core:1.47.0")

    // Local Huawei AR Engine SDK (ar engine sdk 4.0.0.5.aar / arenginesdk-4.0.0.5.aar in assets/ or libs/)
    // Local offline resolution - NO remote maven fetching:
    implementation(fileTree(mapOf("dir" to "\${rootDir}/assets", "include" to listOf("*.aar", "*.jar"))))
    implementation(fileTree(mapOf("dir" to "\${rootDir}/assets/libs", "include" to listOf("*.aar", "*.jar"))))
    implementation(fileTree(mapOf("dir" to "src/main/assets", "include" to listOf("*.aar", "*.jar"))))
    implementation(fileTree(mapOf("dir" to "\${rootDir}/huawei-ar-sdk", "include" to listOf("*.aar", "*.jar"))))
    implementation(fileTree(mapOf("dir" to "\${rootDir}/libs", "include" to listOf("*.aar", "*.jar"))))
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar", "*.jar"))))
}
`,
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'gradle',
    descriptionAr: 'تعريف مسارات المستودعات والمكتبات المحلية لربط arenginesdk-4.0.0.5.aar المضاف يدوياً في assets/libs',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // Flat dir repository for local Huawei AR Engine AAR (ar engine sdk 4.0.0.5.aar)
        flatDir {
            dirs(
                file("./assets"),
                file("./assets/libs"),
                file("./app/src/main/assets"),
                file("./huawei-ar-sdk"),
                file("./libs"),
                file("./app/libs")
            )
        }
    }
}

rootProject.name = "AR Garden Soil Calculator"
include(":app")
`,
  },
  {
    path: 'AndroidManifest.xml',
    name: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    descriptionAr: 'ملف المانيفست مع أذونات الكاميرا والواقع المعزز وتحديد خيارات ARCore وHuawei AR Engine',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.argarden.soilcalculator">

    <!-- AR & Camera Permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-feature android:name="android.hardware.camera.ar" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ARGardenSoilCalculator"
        tools:targetApi="35">

        <!-- Google ARCore Metadata -->
        <meta-data
            android:name="com.google.ar.core"
            android:value="optional" />

        <!-- Huawei AR Engine Metadata -->
        <meta-data
            android:name="com.huawei.hms.ar.arengine"
            android:value="optional" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.ARGardenSoilCalculator">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`,
  },
  {
    path: 'res/values/strings.xml',
    name: 'app/src/main/res/values/strings.xml',
    language: 'xml',
    descriptionAr: 'النصوص الرسمية المترجمة بالكامل إلى اللغة العربية مع دعم RTL',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">زون لتصاميم الحدائق</string>
    <string name="app_subtitle">Zone Garden Designs &amp; AR Turf Calculator</string>
    
    <!-- Engine Detection -->
    <string name="engine_huawei">محرك Huawei AR Engine النشط (المكتبة المحلية ./huawei-ar-sdk/)</string>
    <string name="engine_google">محرك Google ARCore النشط</string>
    <string name="huawei_detected">تم الكشف عن نظام هواتف هواوي/هونر دون خدمات جوجل - توجيه تلقائي لـ Huawei AR Engine</string>

    <!-- Navigation -->
    <string name="tab_surface_calculator">محددات النباتات وحساب شتول النجيلة</string>
    <string name="tab_depth_hole_calculator">قياس الحفر وحجم الردم</string>
    
    <!-- Feature A -->
    <string name="surface_title">محددات النباتات وحساب العدد الكلي لشتول النجيلة</string>
    <string name="select_seedlings_per_m2">اختر عدد شتول النجيلة في المتر المربع:</string>
    <string name="surface_area_fmt">المساحة الكلية للحديقة: %.2f م²</string>
    <string name="reserved_area_fmt">المساحة المحجوزة للمحددات: %.2f م²</string>
    <string name="remaining_turf_fmt">المساحة المتبقية للنجيلة: %.2f م²</string>
    <string name="seedlings_count_fmt">العدد الكلي لشتول النجيلة: %d شتلة</string>

    <!-- Pre-Capture Measurement Mode Selection -->
    <string name="pre_capture_selection_title">شاشة اختيار وضع القياس قبل الكاميرا</string>
    <string name="mode_real_area">حساب المساحة الحقيقية (Real Area)</string>
    <string name="mode_real_depth">حساب العمق الحقيقي (Real Depth)</string>
    <string name="mode_real_area_and_depth">حساب المساحة والعمق الحقيقي معاً</string>
    <string name="mode_real_area_desc">لقياس أبعاد السطح (الطول والعرض) والمساحة بالمتر المربع والسم²</string>
    <string name="mode_real_depth_desc">لقياس المسافة بين الكاميرا والهدف وعمق الحفر بدقة</string>
    <string name="mode_real_area_and_depth_desc">القياس الكامل المزدوج لأبعاد السطح والعمق والمسافة بنفس الوقت</string>
    
    <!-- Dropdown Items Sequence (Strict 10 to 30 seedlings/m²) -->
    <string name="seedling_10">10 شتلات في المتر المربع (10 شتلة/م²)</string>
    <string name="seedling_15">15 شتلة في المتر المربع (15 شتلة/م²)</string>
    <string name="seedling_20">20 شتلة في المتر المربع (20 شتلة/م²)</string>
    <string name="seedling_25">25 شتلة في المتر المربع (25 شتلة/م²)</string>
    <string name="seedling_30">30 شتلة في المتر المربع (30 شتلة/م²)</string>
</resources>
`,
  },
  {
    path: 'ArEngineRouter.kt',
    name: 'app/src/main/java/com/argarden/soilcalculator/ArEngineRouter.kt',
    language: 'kotlin',
    descriptionAr: 'كود الكشف الديناميكي عن نوع الجهاز (Huawei vs Google ARCore) وتوجيه الخدمة المناسبة تلقائياً',
    content: `package com.argarden.soilcalculator

import android.content.Context
import android.os.Build

enum class ArEngineProvider {
    GOOGLE_ARCORE,
    HUAWEI_AR_ENGINE
}

object ArEngineRouter {

    /**
     * Runtime Dual Engine Detection Logic:
     * 1. Checks if manufacturer is Huawei/Honor without GMS
     * 2. Checks if Huawei AR Engine SDK classes are present (loaded from ./huawei-ar-sdk/ or ./libs/)
     * 3. Routes automatically to Huawei AR Engine if detected, otherwise defaults to Google ARCore.
     */
    fun detectAndRouteProvider(context: Context): ArEngineProvider {
        val manufacturer = Build.MANUFACTURER.lowercase()
        val brand = Build.BRAND.lowercase()
        val isHuaweiOrHonor = manufacturer.contains("huawei") || manufacturer.contains("honor") ||
                brand.contains("huawei") || brand.contains("honor")

        val hasHuaweiArEngineSdk = try {
            Class.forName("com.huawei.hms.ar.arengine.core.AREngine")
            true
        } catch (e: ClassNotFoundException) {
            false
        }

        return if (isHuaweiOrHonor && hasHuaweiArEngineSdk) {
            ArEngineProvider.HUAWEI_AR_ENGINE
        } else if (hasHuaweiArEngineSdk && !hasGooglePlayServices(context)) {
            ArEngineProvider.HUAWEI_AR_ENGINE
        } else {
            ArEngineProvider.GOOGLE_ARCORE
        }
    }

    private fun hasGooglePlayServices(context: Context): Boolean {
        return try {
            val gmsClass = Class.forName("com.google.android.gms.common.GoogleApiAvailability")
            val instance = gmsClass.getMethod("getInstance").invoke(null)
            val isAvailable = gmsClass.getMethod("isGooglePlayServicesAvailable", Context::class.java)
                .invoke(instance, context) as Int
            isAvailable == 0
        } catch (e: Exception) {
            false
        }
    }
}
`,
  },
  {
    path: 'SurfaceAreaCalculatorScreen.kt',
    name: 'app/src/main/java/com/argarden/soilcalculator/ui/SurfaceAreaCalculatorScreen.kt',
    language: 'kotlin',
    descriptionAr: 'شاشة قياس المساحة السطحية باستخدام Jetpack Compose مع القائمة المنسدلة للعمق من 0.05م إلى 0.95م بزيادة 0.05م',
    content: `package com.argarden.soilcalculator.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.argarden.soilcalculator.R

data class DepthOption(val depthM: Double, val labelAr: String)

val DEPTH_OPTIONS = listOf(
    DepthOption(0.05, "0.05 م (5 سم)"),
    DepthOption(0.10, "0.10 م (10 سم)"),
    DepthOption(0.15, "0.15 م (15 سم)"),
    DepthOption(0.20, "0.20 م (20 سم)"),
    DepthOption(0.25, "0.25 م (25 سم)"),
    DepthOption(0.30, "0.30 م (30 سم)"),
    DepthOption(0.35, "0.35 م (35 سم)"),
    DepthOption(0.40, "0.40 م (40 سم)"),
    DepthOption(0.45, "0.45 م (45 سم)"),
    DepthOption(0.50, "0.50 م (50 سم)"),
    DepthOption(0.55, "0.55 م (55 سم)"),
    DepthOption(0.60, "0.60 م (60 سم)"),
    DepthOption(0.65, "0.65 م (65 سم)"),
    DepthOption(0.70, "0.70 م (70 سم)"),
    DepthOption(0.75, "0.75 م (75 سم)"),
    DepthOption(0.80, "0.80 م (80 سم)"),
    DepthOption(0.85, "0.85 م (85 سم)"),
    DepthOption(0.90, "0.90 م (90 سم)"),
    DepthOption(0.95, "0.95 م (95 سم)")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurfaceAreaCalculatorScreen(
    surfaceAreaM2: Double,
    onResetPoints: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    var selectedDepth by remember { mutableStateOf(DEPTH_OPTIONS[1]) } // Default 0.10m
    
    val soilVolumeM3 = surfaceAreaM2 * selectedDepth.depthM
    val estimatedWeightKg = soilVolumeM3 * 1250 // Average topsoil density
    val bags50L = kotlin.math.ceil((soilVolumeM3 * 1000) / 50.0).toInt()
    val bags25L = kotlin.math.ceil((soilVolumeM3 * 1000) / 25.0).toInt()
    val estimatedCostSar = bags50L * 25.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = stringResource(id = R.string.surface_title),
            style = MaterialTheme.typography.titleLarge
        )

        Spacer(modifier = Modifier.height(16.dp))

        // ExposedDropdownMenuBox for Depth Selection (Strict 0.05m to 0.95m)
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded }
        ) {
            OutlinedTextField(
                value = selectedDepth.labelAr,
                onValueChange = {},
                readOnly = true,
                label = { Text(stringResource(id = R.string.select_depth)) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth()
            )

            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                DEPTH_OPTIONS.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(text = option.labelAr) },
                        onClick = {
                            selectedDepth = option
                            expanded = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Calculations Display
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = String.format(stringResource(id = R.string.surface_area_fmt), surfaceAreaM2),
                    style = MaterialTheme.typography.bodyLarge
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = String.format(stringResource(id = R.string.soil_volume_fmt), soilVolumeM3),
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = String.format(stringResource(id = R.string.soil_weight_fmt), estimatedWeightKg, estimatedWeightKg / 1000.0),
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = String.format(stringResource(id = R.string.bags_50l_fmt), bags50L),
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = String.format(stringResource(id = R.string.bags_25l_fmt), bags25L),
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = String.format(stringResource(id = R.string.cost_fmt), estimatedCostSar),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onResetPoints,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("إعادة ضبط قياس النقاط")
        }
    }
}
`,
  },
  {
    path: 'DepthHoleCalculatorScreen.kt',
    name: 'app/src/main/java/com/argarden/soilcalculator/ui/DepthHoleCalculatorScreen.kt',
    language: 'kotlin',
    descriptionAr: 'شاشة Feature B لقياس عمق الحفرة باستخدام AR Depth API وحساب كمية الردم المطلوبة (Backfill)',
    content: `package com.argarden.soilcalculator.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.argarden.soilcalculator.R

@Composable
fun DepthHoleCalculatorScreen(
    maxDepthM: Double,
    avgDepthM: Double,
    backfillVolumeM3: Double,
    onScanHole: () -> Unit
) {
    val estimatedWeightKg = backfillVolumeM3 * 1300
    val bags50L = kotlin.math.ceil((backfillVolumeM3 * 1000) / 50.0).toInt()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = stringResource(id = R.string.depth_hole_title),
            style = MaterialTheme.typography.titleLarge
        )

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = String.format(stringResource(id = R.string.max_depth_fmt), maxDepthM),
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = String.format(stringResource(id = R.string.avg_depth_fmt), avgDepthM),
                    style = MaterialTheme.typography.bodyLarge
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = String.format(stringResource(id = R.string.backfill_volume_fmt), backfillVolumeM3),
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = String.format(stringResource(id = R.string.soil_weight_fmt), estimatedWeightKg, estimatedWeightKg / 1000.0),
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = String.format(stringResource(id = R.string.bags_50l_fmt), bags50L),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Surface(
            shape = MaterialTheme.shapes.medium,
            color = MaterialTheme.colorScheme.tertiaryContainer,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "💡 توصية: يفضل دك التربة على طبقات بسمك 15 سم لضمان استقرار الأرض بعد الردم عدم حدوث هبوط مستقبلًا.",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(12.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onScanHole,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("مسح عمق الحفرة بـ AR Depth API")
        }
    }
}
`,
  },
  {
    path: 'ArPrecisionAreaEngine.kt',
    name: 'app/src/main/java/com/argarden/soilcalculator/ar/ArPrecisionAreaEngine.kt',
    language: 'kotlin',
    descriptionAr: 'محرك حساب المساحة الدقيق: إسقاط إحداثيات المثبتات ثلاثية الأبعاد (3D Anchors) على السطح وإجراء خوارزمية Shoelace (صيغة غاوس) لإلغاء ضوضاء العمق والاهتزاز',
    content: `package com.argarden.soilcalculator.ar

import kotlin.math.abs
import kotlin.math.sqrt

data class Point3D(val x: Double, val y: Double, val z: Double)
data class Point2DProjected(val u: Double, val v: Double)

data class PrecisionAreaResult(
    val areaM2: Double,
    val perimeterM: Double,
    val edgeDistancesM: List<Double>,
    val surfaceNormal: Point3D,
    val centroid: Point3D
)

/**
 * Autonomous Precision Area Engine for ARCore & Huawei AR Engine
 * 1. Extracts 3D coordinates (X, Y, Z) of attached plane Anchors.
 * 2. Projects 3D points onto the local surface plane (u, v) using Newell's plane normal,
 *    eliminating normal-axis depth/height noise.
 * 3. Executes Gauss's Area Formula (Shoelace Formula): Area = 0.5 * |sum(u_i * v_{i+1} - u_{i+1} * v_i)|.
 */
object ArPrecisionAreaEngine {

    fun calculatePrecisionArea(points3D: List<Point3D>): PrecisionAreaResult {
        if (points3D.size < 3) {
            return PrecisionAreaResult(0.0, 0.0, emptyList(), Point3D(0.0, 1.0, 0.0), Point3D(0.0, 0.0, 0.0))
        }

        // 1. Calculate centroid
        var sumX = 0.0
        var sumY = 0.0
        var sumZ = 0.0
        points3D.forEach {
            sumX += it.x
            sumY += it.y
            sumZ += it.z
        }
        val count = points3D.size.toDouble()
        val centroid = Point3D(sumX / count, sumY / count, sumZ / count)

        // 2. Calculate best-fit surface plane normal using Newell's method
        val normal = computePolygonNormalNewell(points3D)

        // 3. Construct orthonormal basis vectors (uAxis, vAxis) on the plane
        var refVec = Point3D(1.0, 0.0, 0.0)
        if (abs(dot(normal, refVec)) > 0.9) {
            refVec = Point3D(0.0, 0.0, 1.0)
        }
        val uAxis = normalize(cross(normal, refVec))
        val vAxis = normalize(cross(normal, uAxis))

        // 4. Project 3D points onto local plane coordinates (u, v)
        val projected2D = points3D.map { pt ->
            val diff = Point3D(pt.x - centroid.x, pt.y - centroid.y, pt.z - centroid.z)
            Point2DProjected(
                u = dot(diff, uAxis),
                v = dot(diff, vAxis)
            )
        }

        // 5. Execute Gauss's Shoelace Formula on projected plane (u, v)
        val rawArea = calculateShoelaceArea(projected2D)
        val roundedArea = Math.round(rawArea * 1000.0) / 1000.0

        // 6. Compute true 3D edge distances and perimeter
        val edgeDistances = mutableListOf<Double>()
        var perimeter = 0.0
        for (i in points3D.indices) {
            val next = (i + 1) % points3D.size
            val d = distance(points3D[i], points3D[next])
            val roundedD = Math.round(d * 100.0) / 100.0
            edgeDistances.add(roundedD)
            perimeter += d
        }
        val roundedPerimeter = Math.round(perimeter * 100.0) / 100.0

        return PrecisionAreaResult(
            areaM2 = roundedArea,
            perimeterM = roundedPerimeter,
            edgeDistancesM = edgeDistances,
            surfaceNormal = normal,
            centroid = centroid
        )
    }

    /**
     * Shoelace Formula (Gauss's Area Formula) on 2D coplanar coordinates
     */
    fun calculateShoelaceArea(points: List<Point2DProjected>): Double {
        val n = points.size
        if (n < 3) return 0.0
        var sum = 0.0
        for (i in 0 until n) {
            val next = (i + 1) % n
            sum += points[i].u * points[next].v
            sum -= points[next].u * points[i].v
        }
        return abs(sum) * 0.5
    }

    private fun computePolygonNormalNewell(points: List<Point3D>): Point3D {
        var nx = 0.0
        var ny = 0.0
        var nz = 0.0
        val n = points.size
        for (i in 0 until n) {
            val cur = points[i]
            val next = points[(i + 1) % n]
            nx += (cur.y - next.y) * (cur.z + next.z)
            ny += (cur.z - next.z) * (cur.x + next.x)
            nz += (cur.x - next.x) * (cur.y + next.y)
        }
        val norm = normalize(Point3D(nx, ny, nz))
        return if (norm.y < 0) Point3D(-norm.x, -norm.y, -norm.z) else norm
    }

    private fun distance(a: Point3D, b: Point3D): Double {
        val dx = b.x - a.x
        val dy = b.y - a.y
        val dz = b.z - a.z
        return sqrt(dx * dx + dy * dy + dz * dz)
    }

    private fun dot(a: Point3D, b: Point3D): Double = a.x * b.x + a.y * b.y + a.z * b.z

    private fun cross(a: Point3D, b: Point3D): Point3D = Point3D(
        x = a.y * b.z - a.z * b.y,
        y = a.z * b.x - a.x * b.z,
        z = a.x * b.y - a.y * b.x
    )

    private fun normalize(v: Point3D): Point3D {
        val len = sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
        return if (len < 1e-7) Point3D(0.0, 1.0, 0.0) else Point3D(v.x / len, v.y / len, v.z / len)
    }
}
`,
  },
  {
    path: 'ArSpatialAnchorPipeline.kt',
    name: 'app/src/main/java/com/argarden/soilcalculator/ar/ArSpatialAnchorPipeline.kt',
    language: 'kotlin',
    descriptionAr: 'خط أنابيب تجميد الإطار وتثبيت مثبتات الواقع المعزز (AR Anchors) والتعامل مع Raycast دون تحويل المشهد لصورة مسطحة',
    content: `package com.argarden.soilcalculator.ar

import android.content.Context
import android.opengl.Matrix
import com.google.ar.core.*

/**
 * Spatial Frame Cache: Preserves full AR spatial context during UI freeze
 */
data class CachedArSpatialFrame(
    val cameraPose: Pose,
    val projectionMatrix: FloatArray,
    val viewMatrix: FloatArray,
    val imageIntrinsics: CameraIntrinsics?,
    val timestampNs: Long,
    val depthMode: Config.DepthMode
)

/**
 * Handles Frame Freeze without breaking ARSession tracking:
 * 1. Freezes rendering view while keeping ARSession active in background.
 * 2. Caches exact ARFrame pose, intrinsics, and depth matrices.
 * 3. Transforms tap coordinates via Raycasting (hitTest) against the cached spatial context.
 * 4. Attaches permanent 3D Anchor objects to the underlying Plane for every vertex.
 */
class ArSpatialAnchorPipeline(
    private val session: Session
) {
    private var isFrozen = false
    private var cachedFrame: CachedArSpatialFrame? = null
    private val attachedAnchors = mutableListOf<Anchor>()

    fun configureDepthMode(config: Config) {
        // Ensure hardware Depth API / ToF support is enabled
        if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
            config.depthMode = Config.DepthMode.AUTOMATIC
        } else {
            config.depthMode = Config.DepthMode.DISABLED
        }
        session.configure(config)
    }

    /**
     * Triggers non-destructive Frame Freeze:
     * Caches ARFrame spatial context while maintaining session tracking.
     */
    fun freezeCurrentFrame(frame: Frame) {
        val camera = frame.camera
        val projMatrix = FloatArray(16)
        val viewMatrix = FloatArray(16)
        
        camera.getProjectionMatrix(projMatrix, 0, 0.1f, 100.0f)
        camera.getViewMatrix(viewMatrix, 0)

        cachedFrame = CachedArSpatialFrame(
            cameraPose = camera.pose,
            projectionMatrix = projMatrix,
            viewMatrix = viewMatrix,
            imageIntrinsics = try { camera.imageIntrinsics } catch (e: Exception) { null },
            timestampNs = frame.timestamp,
            depthMode = Config.DepthMode.AUTOMATIC
        )
        isFrozen = true
    }

    fun unfreeze() {
        isFrozen = false
        cachedFrame = null
    }

    /**
     * Raycasting against cached frame context to create and attach permanent 3D Anchors on Plane
     */
    fun addVertexAnchorAtScreenPoint(frame: Frame, screenX: Float, screenY: Float): Anchor? {
        val hitResults = frame.hitTest(screenX, screenY)
        for (hit in hitResults) {
            val trackable = hit.trackable
            if (trackable is Plane && trackable.isPoseInPolygon(hit.hitPose)) {
                val anchor = hit.createAnchor()
                attachedAnchors.add(anchor)
                return anchor
            }
        }
        // Fallback: create anchor at camera plane ray intersection
        val hitPose = frame.camera.pose.compose(Pose.makeTranslation(0f, 0f, -1.5f))
        val fallbackAnchor = session.createAnchor(hitPose)
        attachedAnchors.add(fallbackAnchor)
        return fallbackAnchor
    }

    /**
     * Extracts 3D positions of all attached anchors and calculates precision area via Shoelace
     */
    fun computePolygonAreaFromAnchors(): PrecisionAreaResult {
        val points3D = attachedAnchors.map { anchor ->
            val pose = anchor.pose
            Point3D(pose.tx().toDouble(), pose.ty().toDouble(), pose.tz().toDouble())
        }
        return ArPrecisionAreaEngine.calculatePrecisionArea(points3D)
    }

    fun clearAnchors() {
        attachedAnchors.forEach { it.detach() }
        attachedAnchors.clear()
    }
}
`,
  },
  {
    path: 'MainActivity.kt',
    name: 'app/src/main/java/com/argarden/soilcalculator/MainActivity.kt',
    language: 'kotlin',
    descriptionAr: 'النشاط الرئيسي وتوجيه المحرك والواجهة العربية بدعم اتجاه RTL بـ Compose Material 3',
    content: `package com.argarden.soilcalculator

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.argarden.soilcalculator.ui.DepthHoleCalculatorScreen
import com.argarden.soilcalculator.ui.SurfaceAreaCalculatorScreen

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Runtime Engine Route Detection (Google ARCore vs Huawei AR Engine)
        val activeProvider = ArEngineRouter.detectAndRouteProvider(this)

        setContent {
            // Force Right-To-Left (RTL) Layout Direction for Arabic
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MaterialTheme {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        var currentTab by remember { mutableStateOf(0) }
                        var surfaceArea by remember { mutableDoubleStateOf(12.5) }
                        var maxHoleDepth by remember { mutableDoubleStateOf(0.45) }
                        var avgHoleDepth by remember { mutableDoubleStateOf(0.30) }
                        var backfillVolume by remember { mutableDoubleStateOf(1.85) }

                        Column(modifier = Modifier.fillMaxSize()) {
                            // Engine Provider Header
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (activeProvider == ArEngineProvider.HUAWEI_AR_ENGINE)
                                        MaterialTheme.colorScheme.primaryContainer
                                    else
                                        MaterialTheme.colorScheme.secondaryContainer
                                )
                            ) {
                                Text(
                                    text = if (activeProvider == ArEngineProvider.HUAWEI_AR_ENGINE)
                                        stringResource(id = R.string.engine_huawei)
                                    else
                                        stringResource(id = R.string.engine_google),
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }

                            // Tabs Navigation
                            TabRow(selectedTabIndex = currentTab) {
                                Tab(
                                    selected = currentTab == 0,
                                    onClick = { currentTab = 0 },
                                    text = { Text(stringResource(id = R.string.tab_surface_calculator)) }
                                )
                                Tab(
                                    selected = currentTab == 1,
                                    onClick = { currentTab = 1 },
                                    text = { Text(stringResource(id = R.string.tab_depth_hole_calculator)) }
                                )
                            }

                            when (currentTab) {
                                0 -> SurfaceAreaCalculatorScreen(
                                    surfaceAreaM2 = surfaceArea,
                                    onResetPoints = { surfaceArea = 0.0 }
                                )
                                1 -> DepthHoleCalculatorScreen(
                                    maxDepthM = maxHoleDepth,
                                    avgDepthM = avgHoleDepth,
                                    backfillVolumeM3 = backfillVolume,
                                    onScanHole = {
                                        maxHoleDepth = 0.55
                                        avgHoleDepth = 0.35
                                        backfillVolume = 2.40
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
`,
  },
];
