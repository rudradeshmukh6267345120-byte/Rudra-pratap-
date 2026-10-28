package com.glasswidgets.app.data

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class WidgetModelConfig(
    val appWidgetId: Int,
    val name: String = "Glass Widget",
    val photoUris: List<String> = emptyList(),
    var currentPhotoIndex: Int = 0,
    val frameShape: String = "rounded_square",
    val borderEnabled: Boolean = true,
    val borderColor: String = "#ffffff",
    val borderWidthPx: Int = 4,
    val borderGlow: Boolean = true,
    val filterTone: String = "original",
    val filterIntensity: Int = 100,
    val textureType: String = "none",
    val textureIntensity: Int = 40,
    val rotationIntervalMinutes: Int = 1440,
    val rotationOrder: String = "sequential",
    val photoScale: Float = 1.0f,
    val photoOffsetX: Float = 0.0f,
    val photoOffsetY: Float = 0.0f,
    val photoRotation: Float = 0.0f,
    val photoFlipX: Boolean = false,
    val photoFlipY: Boolean = false,
    val photoFitting: String = "fill",
    val layout: String = "single"
) {
    val currentPhotoUri: String
        get() = if (photoUris.isNotEmpty()) photoUris[currentPhotoIndex % photoUris.size] else ""
}

data class AppSavedWidget(
    val id: String,
    val name: String,
    val shape: String,
    val photoCount: Int,
    val activePhotoUri: String,
    val photoUris: List<String>,
    val borderColor: String,
    val borderWidthPx: Int,
    val borderEnabled: Boolean,
    val borderGlow: Boolean = true,
    val filterTone: String,
    val filterIntensity: Int,
    val textureType: String,
    val textureIntensity: Int,
    val photoScale: Float = 1.0f,
    val photoOffsetX: Float = 0.0f,
    val photoOffsetY: Float = 0.0f,
    val photoRotation: Float = 0.0f,
    val photoFlipX: Boolean = false,
    val photoFlipY: Boolean = false,
    val photoFitting: String = "fill",
    val layout: String = "single"
)

object WidgetDataStore {
    private const val PREF_PREFIX = "glass_widget_"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences("glass_widgets_data", Context.MODE_PRIVATE)
    }

    fun saveAppWidgetsJson(context: Context, jsonStr: String) {
        val prefs = getPrefs(context)
        prefs.edit().putString("app_widgets_catalog", jsonStr).apply()

        try {
            val jsonArray = JSONArray(jsonStr)
            val photosDir = File(context.filesDir, "widget_photos")
            if (!photosDir.exists()) photosDir.mkdirs()

            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val widgetId = obj.optString("id", "widget_$i")
                val photosArr = obj.optJSONArray("photos") ?: continue
                val localPhotoPaths = mutableListOf<String>()

                for (p in 0 until photosArr.length()) {
                    val pObj = photosArr.getJSONObject(p)
                    val pId = pObj.optString("id", "photo_$p")
                    val url = pObj.optString("url", "")

                    if (url.startsWith("data:image/")) {
                        try {
                            val base64Data = url.substringAfter("base64,")
                            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                            val photoFile = File(photosDir, "${widgetId}_${pId}.png")
                            photoFile.writeBytes(bytes)
                            localPhotoPaths.add(photoFile.absolutePath)
                        } catch (e: Exception) {
                            Log.e("WidgetDataStore", "Failed to decode base64 photo: ${e.message}")
                        }
                    } else if (url.isNotBlank()) {
                        localPhotoPaths.add(url)
                    }
                }

                if (localPhotoPaths.isNotEmpty()) {
                    prefs.edit()
                        .putString("saved_local_paths_${widgetId}", localPhotoPaths.joinToString("|"))
                        .apply()
                }
            }
        } catch (e: Exception) {
            Log.e("WidgetDataStore", "Error parsing app widgets JSON: ${e.message}")
        }
    }

    fun getAppSavedWidgets(context: Context): List<AppSavedWidget> {
        val prefs = getPrefs(context)
        val jsonStr = prefs.getString("app_widgets_catalog", "") ?: ""
        if (jsonStr.isBlank()) return emptyList()

        val list = mutableListOf<AppSavedWidget>()
        try {
            val jsonArray = JSONArray(jsonStr)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val id = obj.optString("id", "w_$i")
                val name = obj.optString("name", "Widget ${i + 1}")
                val shape = obj.optString("frameShape", "rounded_square")
                val layout = obj.optString("layout", "single")

                val borderObj = obj.optJSONObject("border")
                val borderEnabled = borderObj?.optBoolean("enabled", true) ?: true
                val borderColor = borderObj?.optString("color", "#ffffff") ?: "#ffffff"
                val borderWidthPx = borderObj?.optInt("width", 4) ?: 4
                val borderGlow = borderObj?.optBoolean("glow", true) ?: true

                val filterObj = obj.optJSONObject("filter")
                val filterTone = filterObj?.optString("tone", "original") ?: "original"
                val filterIntensity = filterObj?.optInt("intensity", 100) ?: 100

                val textureObj = obj.optJSONObject("texture")
                val textureType = textureObj?.optString("type", "none") ?: "none"
                val textureIntensity = textureObj?.optInt("intensity", 40) ?: 40

                val cachedPathsRaw = prefs.getString("saved_local_paths_${id}", "") ?: ""
                val photoPaths = if (cachedPathsRaw.isNotBlank()) {
                    cachedPathsRaw.split("|")
                } else {
                    val rawList = mutableListOf<String>()
                    val photosArr = obj.optJSONArray("photos")
                    if (photosArr != null) {
                        for (p in 0 until photosArr.length()) {
                            val pObj = photosArr.getJSONObject(p)
                            val u = pObj.optString("url", "")
                            if (u.isNotBlank()) rawList.add(u)
                        }
                    }
                    rawList
                }

                val photosArr = obj.optJSONArray("photos")
                val activeIdx = obj.optInt("activePhotoIndex", 0)
                val activePhotoObj = if (photosArr != null && activeIdx < photosArr.length()) {
                    photosArr.getJSONObject(activeIdx)
                } else if (photosArr != null && photosArr.length() > 0) {
                    photosArr.getJSONObject(0)
                } else null

                val transformObj = activePhotoObj?.optJSONObject("transform")
                val photoScale = transformObj?.optDouble("scale", 1.0)?.toFloat() ?: 1.0f
                val photoOffsetX = transformObj?.optDouble("offsetX", 0.0)?.toFloat() ?: 0.0f
                val photoOffsetY = transformObj?.optDouble("offsetY", 0.0)?.toFloat() ?: 0.0f
                val photoRotation = transformObj?.optDouble("rotation", 0.0)?.toFloat() ?: 0.0f
                val photoFlipX = transformObj?.optBoolean("flipX", false) ?: false
                val photoFlipY = transformObj?.optBoolean("flipY", false) ?: false
                val photoFitting = transformObj?.optString("fitting", "fill") ?: "fill"

                val activePhoto = photoPaths.firstOrNull() ?: ""
                list.add(
                    AppSavedWidget(
                        id = id,
                        name = name,
                        shape = shape,
                        photoCount = photoPaths.size,
                        activePhotoUri = activePhoto,
                        photoUris = photoPaths,
                        borderColor = borderColor,
                        borderWidthPx = borderWidthPx,
                        borderEnabled = borderEnabled,
                        borderGlow = borderGlow,
                        filterTone = filterTone,
                        filterIntensity = filterIntensity,
                        textureType = textureType,
                        textureIntensity = textureIntensity,
                        photoScale = photoScale,
                        photoOffsetX = photoOffsetX,
                        photoOffsetY = photoOffsetY,
                        photoRotation = photoRotation,
                        photoFlipX = photoFlipX,
                        photoFlipY = photoFlipY,
                        photoFitting = photoFitting,
                        layout = layout
                    )
                )
            }
        } catch (e: Exception) {
            Log.e("WidgetDataStore", "Error loading saved widgets: ${e.message}")
        }
        return list
    }

    fun getWidgetConfig(context: Context, appWidgetId: Int): WidgetModelConfig {
        val prefs = getPrefs(context)
        val photosRaw = prefs.getString("${PREF_PREFIX}${appWidgetId}_photos", "") ?: ""
        val photos = if (photosRaw.isNotBlank()) photosRaw.split("|") else emptyList()

        return WidgetModelConfig(
            appWidgetId = appWidgetId,
            name = prefs.getString("${PREF_PREFIX}${appWidgetId}_name", "Glass Widget") ?: "Glass Widget",
            photoUris = photos,
            currentPhotoIndex = prefs.getInt("${PREF_PREFIX}${appWidgetId}_index", 0),
            frameShape = prefs.getString("${PREF_PREFIX}${appWidgetId}_shape", "rounded_square") ?: "rounded_square",
            borderEnabled = prefs.getBoolean("${PREF_PREFIX}${appWidgetId}_border_enabled", true),
            borderColor = prefs.getString("${PREF_PREFIX}${appWidgetId}_border_color", "#ffffff") ?: "#ffffff",
            borderWidthPx = prefs.getInt("${PREF_PREFIX}${appWidgetId}_border_width", 4),
            borderGlow = prefs.getBoolean("${PREF_PREFIX}${appWidgetId}_border_glow", true),
            filterTone = prefs.getString("${PREF_PREFIX}${appWidgetId}_filter", "original") ?: "original",
            filterIntensity = prefs.getInt("${PREF_PREFIX}${appWidgetId}_filter_intensity", 100),
            textureType = prefs.getString("${PREF_PREFIX}${appWidgetId}_texture", "none") ?: "none",
            textureIntensity = prefs.getInt("${PREF_PREFIX}${appWidgetId}_texture_intensity", 40),
            rotationIntervalMinutes = prefs.getInt("${PREF_PREFIX}${appWidgetId}_interval", 1440),
            rotationOrder = prefs.getString("${PREF_PREFIX}${appWidgetId}_order", "sequential") ?: "sequential",
            photoScale = prefs.getFloat("${PREF_PREFIX}${appWidgetId}_scale", 1.0f),
            photoOffsetX = prefs.getFloat("${PREF_PREFIX}${appWidgetId}_offset_x", 0.0f),
            photoOffsetY = prefs.getFloat("${PREF_PREFIX}${appWidgetId}_offset_y", 0.0f),
            photoRotation = prefs.getFloat("${PREF_PREFIX}${appWidgetId}_rotation", 0.0f),
            photoFlipX = prefs.getBoolean("${PREF_PREFIX}${appWidgetId}_flip_x", false),
            photoFlipY = prefs.getBoolean("${PREF_PREFIX}${appWidgetId}_flip_y", false),
            photoFitting = prefs.getString("${PREF_PREFIX}${appWidgetId}_fitting", "fill") ?: "fill",
            layout = prefs.getString("${PREF_PREFIX}${appWidgetId}_layout", "single") ?: "single"
        )
    }

    fun saveWidgetConfig(context: Context, config: WidgetModelConfig) {
        val prefs = getPrefs(context).edit()
        val id = config.appWidgetId
        prefs.putString("${PREF_PREFIX}${id}_name", config.name)
        prefs.putString("${PREF_PREFIX}${id}_photos", config.photoUris.joinToString("|"))
        prefs.putInt("${PREF_PREFIX}${id}_index", config.currentPhotoIndex)
        prefs.putString("${PREF_PREFIX}${id}_shape", config.frameShape)
        prefs.putBoolean("${PREF_PREFIX}${id}_border_enabled", config.borderEnabled)
        prefs.putString("${PREF_PREFIX}${id}_border_color", config.borderColor)
        prefs.putInt("${PREF_PREFIX}${id}_border_width", config.borderWidthPx)
        prefs.putBoolean("${PREF_PREFIX}${id}_border_glow", config.borderGlow)
        prefs.putString("${PREF_PREFIX}${id}_filter", config.filterTone)
        prefs.putInt("${PREF_PREFIX}${id}_filter_intensity", config.filterIntensity)
        prefs.putString("${PREF_PREFIX}${id}_texture", config.textureType)
        prefs.putInt("${PREF_PREFIX}${id}_texture_intensity", config.textureIntensity)
        prefs.putInt("${PREF_PREFIX}${id}_interval", config.rotationIntervalMinutes)
        prefs.putString("${PREF_PREFIX}${id}_order", config.rotationOrder)
        prefs.putFloat("${PREF_PREFIX}${id}_scale", config.photoScale)
        prefs.putFloat("${PREF_PREFIX}${id}_offset_x", config.photoOffsetX)
        prefs.putFloat("${PREF_PREFIX}${id}_offset_y", config.photoOffsetY)
        prefs.putFloat("${PREF_PREFIX}${id}_rotation", config.photoRotation)
        prefs.putBoolean("${PREF_PREFIX}${id}_flip_x", config.photoFlipX)
        prefs.putBoolean("${PREF_PREFIX}${id}_flip_y", config.photoFlipY)
        prefs.putString("${PREF_PREFIX}${id}_fitting", config.photoFitting)
        prefs.putString("${PREF_PREFIX}${id}_layout", config.layout)
        prefs.apply()
    }

    fun cycleNextPhoto(context: Context, appWidgetId: Int) {
        val config = getWidgetConfig(context, appWidgetId)
        if (config.photoUris.size <= 1) return

        val nextIndex = if (config.rotationOrder == "random") {
            (config.photoUris.indices.filter { it != config.currentPhotoIndex }).randomOrNull() ?: 0
        } else {
            (config.currentPhotoIndex + 1) % config.photoUris.size
        }

        getPrefs(context).edit()
            .putInt("${PREF_PREFIX}${appWidgetId}_index", nextIndex)
            .apply()
    }

    fun deleteWidgetConfig(context: Context, appWidgetId: Int) {
        val prefs = getPrefs(context).edit()
        val keys = getPrefs(context).all.keys.filter { it.startsWith("${PREF_PREFIX}${appWidgetId}_") }
        for (k in keys) prefs.remove(k)
        prefs.apply()
    }
}
