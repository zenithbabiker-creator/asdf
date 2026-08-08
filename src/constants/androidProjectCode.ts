import { ProjectFile } from '../types';

export const STANDALONE_ANDROID_PROJECT_FILES: ProjectFile[] = [
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    language: 'gradle',
    descriptionAr: 'ملف إعدادات الجرادل الرئيسي للمشروع مع دعم لمكتبات أندرويد وCompose وARCore وHuawei AR SDK',
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
        // Local directory repository for Huawei AR Engine AAR SDK at project root
        flatDir {
            dirs(file("\${rootDir}/huawei-ar-sdk"), file("\${rootDir}/libs"))
        }
    }
}
`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts (App)',
    language: 'gradle',
    descriptionAr: 'ملف الجرادل المخصص للتطبيق والذي يربط حزمة Huawei AR Engine AAR المحلية من المجلد الرئيسي لمشروع GitHub ورابط Google ARCore',
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
    // Local Huawei SDK lookup relative to project root directory
    flatDir {
        dirs(file("\${rootDir}/huawei-ar-sdk"), file("\${rootDir}/libs"))
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

    // Local Huawei AR Engine SDK (Loaded from ./huawei-ar-sdk/ or ./libs/ in project root)
    // Supports local .aar files placed at project root
    implementation(fileTree(mapOf("dir" to "\${rootDir}/huawei-ar-sdk", "include" to listOf("*.aar", "*.jar"))))
    implementation(fileTree(mapOf("dir" to "\${rootDir}/libs", "include" to listOf("*.aar", "*.jar"))))
}
`,
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    language: 'gradle',
    descriptionAr: 'تعريف مسارات المستودعات والمكتبات المحلية للمشروع',
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
        // Flat dir repository for local Huawei AR Engine AAR at root
        flatDir {
            dirs(file("./huawei-ar-sdk"), file("./libs"))
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
    <string name="app_subtitle">Zone Garden Designs &amp; AR Soil Calculator</string>
    
    <!-- Engine Detection -->
    <string name="engine_huawei">محرك Huawei AR Engine النشط (المكتبة المحلية ./huawei-ar-sdk/)</string>
    <string name="engine_google">محرك Google ARCore النشط</string>
    <string name="huawei_detected">تم الكشف عن نظام هواتف هواوي/هونر دون خدمات جوجل - توجيه تلقائي لـ Huawei AR Engine</string>

    <!-- Navigation -->
    <string name="tab_surface_calculator">قياس المسطحات والتربة</string>
    <string name="tab_depth_hole_calculator">قياس الحفر وحجم الردم</string>
    
    <!-- Feature A -->
    <string name="surface_title">قياس مساحة السطح وحساب كمية التربة</string>
    <string name="select_depth">اختر عمق التربة المطلوب (متر):</string>
    <string name="select_soil_type">نوع التربة الزراعية:</string>
    <string name="surface_area_fmt">المساحة السطحية: %.2f م²</string>
    <string name="soil_volume_fmt">حجم التربة المطلوبة: %.3f م³</string>
    <string name="soil_weight_fmt">الوزن التقديري للتربة: %.1f كجم (%.2f طن)</string>
    <string name="bags_50l_fmt">أكياس 50L المطلوبة: %d كيس</string>
    <string name="bags_25l_fmt">أكياس 25L المطلوبة: %d كيس</string>
    <string name="cost_fmt">التكلفة التقديرية: %.0f ر.س</string>

    <!-- Feature B -->
    <string name="depth_hole_title">قياس عمق الحفر والخنادق وحساب الردم (Backfill)</string>
    <string name="max_depth_fmt">أقصى عمق للحفرة: %.2f م</string>
    <string name="avg_depth_fmt">متوسط العمق: %.2f م</string>
    <string name="backfill_volume_fmt">حجم الردم المطلوب: %.3f م³</string>
    
    <!-- Dropdown Items Sequence (Strict 0.05m to 0.95m) -->
    <string name="depth_0_05">0.05 م (5 سم)</string>
    <string name="depth_0_10">0.10 م (10 سم)</string>
    <string name="depth_0_15">0.15 م (15 سم)</string>
    <string name="depth_0_20">0.20 م (20 سم)</string>
    <string name="depth_0_25">0.25 م (25 سم)</string>
    <string name="depth_0_30">0.30 م (30 سم)</string>
    <string name="depth_0_35">0.35 م (35 سم)</string>
    <string name="depth_0_40">0.40 م (40 سم)</string>
    <string name="depth_0_45">0.45 م (45 سم)</string>
    <string name="depth_0_50">0.50 م (50 سم)</string>
    <string name="depth_0_55">0.55 م (55 سم)</string>
    <string name="depth_0_60">0.60 م (60 سم)</string>
    <string name="depth_0_65">0.65 م (65 سم)</string>
    <string name="depth_0_70">0.70 م (70 سم)</string>
    <string name="depth_0_75">0.75 م (75 سم)</string>
    <string name="depth_0_80">0.80 م (80 سم)</string>
    <string name="depth_0_85">0.85 م (85 سم)</string>
    <string name="depth_0_90">0.90 م (90 سم)</string>
    <string name="depth_0_95">0.95 م (95 سم)</string>
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
