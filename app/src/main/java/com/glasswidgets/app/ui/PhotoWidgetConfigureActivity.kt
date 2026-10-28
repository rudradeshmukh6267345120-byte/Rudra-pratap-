package com.glasswidgets.app.ui

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.glasswidgets.app.R
import com.glasswidgets.app.data.AppSavedWidget
import com.glasswidgets.app.data.WidgetDataStore
import com.glasswidgets.app.data.WidgetModelConfig
import com.glasswidgets.app.widget.GlassPhotoWidgetProvider
import com.glasswidgets.app.widget.WidgetBitmapRenderer
import com.glasswidgets.app.widget.WidgetUpdateWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class PhotoWidgetConfigureActivity : AppCompatActivity() {

    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    private val galleryPickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null && appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            handleGalleryImageSelected(uri)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(RESULT_CANCELED)

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }

        setContentView(R.layout.activity_widget_configure)

        val containerSaved = findViewById<LinearLayout>(R.id.container_saved_widgets)
        val tvNoSaved = findViewById<TextView>(R.id.tv_no_saved_widgets)
        val btnPickGallery = findViewById<Button>(R.id.btn_pick_gallery)
        val btnCancelFrame = findViewById<View>(R.id.btn_cancel_frame)

        btnCancelFrame?.setOnClickListener {
            finish()
        }

        btnPickGallery.setOnClickListener {
            galleryPickerLauncher.launch("image/*")
        }

        // Populate saved widgets from in-app storage
        val savedWidgets = WidgetDataStore.getAppSavedWidgets(this)
        if (savedWidgets.isNotEmpty()) {
            tvNoSaved.visibility = View.GONE
            containerSaved.removeAllViews()

            val inflater = LayoutInflater.from(this)
            for (w in savedWidgets) {
                val itemView = inflater.inflate(R.layout.item_saved_widget_select, containerSaved, false)
                val thumbView = itemView.findViewById<ImageView>(R.id.item_widget_thumb)
                val titleView = itemView.findViewById<TextView>(R.id.item_widget_title)
                val subtitleView = itemView.findViewById<TextView>(R.id.item_widget_subtitle)
                val radioView = itemView.findViewById<ImageView>(R.id.item_radio_indicator)

                titleView.text = w.name
                val countText = if (w.photoCount == 1) "1 Photos • Original" else "${w.photoCount} Photos • Original"
                subtitleView.text = countText

                // Load thumbnail asynchronously
                if (w.activePhotoUri.isNotBlank()) {
                    CoroutineScope(Dispatchers.IO).launch {
                        val thumb = WidgetBitmapRenderer.loadBitmap(this@PhotoWidgetConfigureActivity, w.activePhotoUri)
                        withContext(Dispatchers.Main) {
                            if (thumb != null) {
                                thumbView.setImageBitmap(thumb)
                            }
                        }
                    }
                }

                itemView.setOnClickListener {
                    radioView.setImageResource(R.drawable.ic_radio_checked)
                    itemView.postDelayed({
                        applySavedWidgetToLauncher(w)
                    }, 120)
                }

                containerSaved.addView(itemView)
            }
        } else {
            tvNoSaved.visibility = View.VISIBLE
        }
    }

    private fun applySavedWidgetToLauncher(saved: AppSavedWidget) {
        val config = WidgetModelConfig(
            appWidgetId = appWidgetId,
            name = saved.name,
            photoUris = saved.photoUris,
            currentPhotoIndex = 0,
            frameShape = saved.shape,
            borderEnabled = saved.borderEnabled,
            borderColor = saved.borderColor,
            borderWidthPx = saved.borderWidthPx,
            borderGlow = saved.borderGlow,
            filterTone = saved.filterTone,
            filterIntensity = saved.filterIntensity,
            textureType = saved.textureType,
            textureIntensity = saved.textureIntensity,
            rotationIntervalMinutes = 1440,
            photoScale = saved.photoScale,
            photoOffsetX = saved.photoOffsetX,
            photoOffsetY = saved.photoOffsetY,
            photoRotation = saved.photoRotation,
            photoFlipX = saved.photoFlipX,
            photoFlipY = saved.photoFlipY,
            photoFitting = saved.photoFitting,
            layout = saved.layout
        )
        WidgetDataStore.saveWidgetConfig(this, config)

        val manager = AppWidgetManager.getInstance(this)
        GlassPhotoWidgetProvider.updateWidget(this, manager, appWidgetId)
        WidgetUpdateWorker.scheduleWork(this, appWidgetId)

        val resultValue = Intent().apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        setResult(Activity.RESULT_OK, resultValue)
        Toast.makeText(this, "Widget added to Home Screen!", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun handleGalleryImageSelected(uri: Uri) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val photosDir = File(filesDir, "widget_photos")
                if (!photosDir.exists()) photosDir.mkdirs()
                val targetFile = File(photosDir, "launcher_${appWidgetId}_${System.currentTimeMillis()}.png")

                contentResolver.openInputStream(uri)?.use { input ->
                    targetFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }

                val config = WidgetModelConfig(
                    appWidgetId = appWidgetId,
                    name = "Photo Widget #$appWidgetId",
                    photoUris = listOf(targetFile.absolutePath),
                    currentPhotoIndex = 0,
                    frameShape = "rounded_square",
                    borderEnabled = true,
                    borderColor = "#ffffff",
                    borderWidthPx = 4,
                    rotationIntervalMinutes = 1440
                )
                WidgetDataStore.saveWidgetConfig(this@PhotoWidgetConfigureActivity, config)

                val manager = AppWidgetManager.getInstance(this@PhotoWidgetConfigureActivity)
                GlassPhotoWidgetProvider.updateWidget(this@PhotoWidgetConfigureActivity, manager, appWidgetId)
                WidgetUpdateWorker.scheduleWork(this@PhotoWidgetConfigureActivity, appWidgetId)

                withContext(Dispatchers.Main) {
                    val resultValue = Intent().apply {
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                    }
                    setResult(Activity.RESULT_OK, resultValue)
                    Toast.makeText(this@PhotoWidgetConfigureActivity, "Widget placed on Home Screen!", Toast.LENGTH_SHORT).show()
                    finish()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@PhotoWidgetConfigureActivity, "Failed to load image: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun formatShapeName(shape: String): String {
        return when (shape) {
            "circle" -> "Circle"
            "rounded_square" -> "Rounded Square"
            "square" -> "Square"
            "diamond" -> "Diamond"
            "hexagon" -> "Hexagon"
            "heart" -> "Heart"
            "star" -> "Star"
            else -> "Smooth Frame"
        }
    }
}
