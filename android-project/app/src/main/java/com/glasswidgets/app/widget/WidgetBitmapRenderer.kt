package com.glasswidgets.app.widget

import android.content.Context
import android.graphics.*
import android.net.Uri
import android.util.Base64
import android.util.Log
import com.glasswidgets.app.data.WidgetModelConfig
import java.io.File
import java.io.InputStream

object WidgetBitmapRenderer {

    fun renderWidgetBitmap(
        context: Context,
        config: WidgetModelConfig,
        targetWidth: Int,
        targetHeight: Int
    ): Bitmap? {
        val srcBitmap = loadBitmap(context, config.currentPhotoUri)

        val output = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            isFilterBitmap = true
            isDither = true
        }

        // Calculate safe padding so border stroke and soft glow never clip at the bitmap edge
        val padding = if (config.borderEnabled && config.borderGlow) {
            maxOf(config.borderWidthPx * 3.5f + 12f, 20f)
        } else if (config.borderEnabled && config.borderWidthPx > 0) {
            maxOf(config.borderWidthPx * 1.5f + 4f, 10f)
        } else {
            8f
        }
        val rect = RectF(padding, padding, targetWidth - padding, targetHeight - padding)

        // 1. Create shape Path
        val path = createShapePath(config.frameShape, rect)

        // 2. Draw outer white neon glow if borderGlow is enabled
        if (config.borderEnabled && config.borderWidthPx > 0 && config.borderGlow) {
            val borderColor = try { Color.parseColor(config.borderColor) } catch (e: Exception) { Color.WHITE }
            val r = Color.red(borderColor)
            val g = Color.green(borderColor)
            val b = Color.blue(borderColor)

            // Outer soft bloom
            val glowPaintWide = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = config.borderWidthPx * 3.6f
                color = Color.argb(45, r, g, b)
                maskFilter = BlurMaskFilter(config.borderWidthPx * 2.4f, BlurMaskFilter.Blur.NORMAL)
            }
            canvas.drawPath(path, glowPaintWide)

            // Inner vibrant bloom
            val glowPaintTight = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = config.borderWidthPx * 1.8f
                color = Color.argb(90, r, g, b)
                maskFilter = BlurMaskFilter(config.borderWidthPx * 1.1f, BlurMaskFilter.Blur.NORMAL)
            }
            canvas.drawPath(path, glowPaintTight)
        }

        // 3. Draw photo or authentic Glass Widgets logo inside shape
        canvas.save()
        canvas.clipPath(path)

        if (srcBitmap != null) {
            // Apply Color Filter
            paint.colorFilter = createColorFilter(config.filterTone, config.filterIntensity)

            // Scale & center crop bitmap
            val matrix = Matrix()
            val scale = maxOf(targetWidth.toFloat() / srcBitmap.width, targetHeight.toFloat() / srcBitmap.height)
            val dx = (targetWidth - srcBitmap.width * scale) * 0.5f
            val dy = (targetHeight - srcBitmap.height * scale) * 0.5f
            matrix.setScale(scale, scale)
            matrix.postTranslate(dx, dy)

            canvas.drawBitmap(srcBitmap, matrix, paint)
            paint.colorFilter = null

            // Apply Atmospheric Texture overlay
            applyTextureOverlay(canvas, config.textureType, config.textureIntensity, targetWidth, targetHeight)
        } else {
            // Authentic 3D Glass Widgets Logo Placeholder
            drawAuthenticLogoPlaceholder(context, canvas, rect, config.name)
        }

        // Draw subtle glass specular sheen
        val sheenPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            shader = LinearGradient(
                rect.left, rect.top, rect.right, rect.bottom,
                Color.argb(35, 255, 255, 255),
                Color.argb(5, 255, 255, 255),
                Shader.TileMode.CLAMP
            )
        }
        canvas.drawPath(path, sheenPaint)

        canvas.restore()

        // 4. Draw sharp solid border stroke on top
        if (config.borderEnabled && config.borderWidthPx > 0) {
            val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                color = try { Color.parseColor(config.borderColor) } catch (e: Exception) { Color.WHITE }
                strokeWidth = config.borderWidthPx.toFloat()
            }
            canvas.drawPath(path, strokePaint)
        }

        return output
    }

    private fun drawAuthenticLogoPlaceholder(context: Context, canvas: Canvas, rect: RectF, widgetName: String) {
        // Deep Obsidian OLED background
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
        }
        canvas.drawRect(rect, bgPaint)

        // Try to load authentic 3D Glass Widgets logo asset
        val logoBitmap = loadBitmap(context, "logo.png")
            ?: loadBitmap(context, "www/logo.png")
            ?: loadBitmap(context, "www/icon.png")

        if (logoBitmap != null) {
            val iconMatrix = Matrix()
            val logoSize = rect.width() * 0.65f
            val scale = logoSize / logoBitmap.width
            val dx = rect.centerX() - (logoBitmap.width * scale * 0.5f)
            val dy = rect.centerY() - (logoBitmap.height * scale * 0.5f) - (if (widgetName.isNotBlank()) 16f else 0f)
            iconMatrix.setScale(scale, scale)
            iconMatrix.postTranslate(dx, dy)

            val p = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                isFilterBitmap = true
            }
            canvas.drawBitmap(logoBitmap, iconMatrix, p)

            if (widgetName.isNotBlank() && widgetName != "Glass Widget") {
                val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.WHITE
                    textSize = 26f
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                    textAlign = Paint.Align.CENTER
                }
                canvas.drawText(widgetName, rect.centerX(), dy + logoSize + 24f, titlePaint)
            }
        } else {
            // Fallback geometric glass cards icon
            val cardPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE
                strokeWidth = 4f
                color = Color.WHITE
            }
            val cx = rect.centerX()
            val cy = rect.centerY()
            val w = rect.width() * 0.25f
            val h = rect.height() * 0.35f
            canvas.drawRoundRect(RectF(cx - w, cy - h, cx + w * 0.3f, cy + h * 0.7f), 12f, 12f, cardPaint)
            canvas.drawRoundRect(RectF(cx - w * 0.3f, cy - h * 0.7f, cx + w, cy + h), 12f, 12f, cardPaint)
        }
    }

    private fun createShapePath(shape: String, r: RectF): Path {
        val p = Path()
        when (shape) {
            "circle" -> {
                p.addOval(r, Path.Direction.CW)
            }
            "squircle" -> {
                val radius = r.width() * 0.36f
                p.addRoundRect(r, radius, radius, Path.Direction.CW)
            }
            "rounded_square" -> {
                val radius = r.width() * 0.26f
                p.addRoundRect(r, radius, radius, Path.Direction.CW)
            }
            "square" -> {
                p.addRoundRect(r, 12f, 12f, Path.Direction.CW)
            }
            "rectangle" -> {
                p.addRoundRect(r, 24f, 24f, Path.Direction.CW)
            }
            "diamond" -> {
                p.moveTo(r.centerX(), r.top)
                p.lineTo(r.right, r.centerY())
                p.lineTo(r.centerX(), r.bottom)
                p.lineTo(r.left, r.centerY())
                p.close()
            }
            "hexagon" -> {
                val w = r.width()
                p.moveTo(r.left + w * 0.5f, r.top)
                p.lineTo(r.right, r.top + r.height() * 0.25f)
                p.lineTo(r.right, r.top + r.height() * 0.75f)
                p.lineTo(r.left + w * 0.5f, r.bottom)
                p.lineTo(r.left, r.top + r.height() * 0.75f)
                p.lineTo(r.left, r.top + r.height() * 0.25f)
                p.close()
            }
            "heart" -> {
                val cx = r.centerX()
                val cy = r.centerY()
                val s = r.width() / 100f
                p.moveTo(cx, cy - 22f * s)
                p.cubicTo(cx - 5f * s, cy - 38f * s, cx - 30f * s, cy - 40f * s, cx - 38f * s, cy - 22f * s)
                p.cubicTo(cx - 46f * s, cy - 4f * s, cx - 28f * s, cy + 16f * s, cx, cy + 40f * s)
                p.cubicTo(cx + 28f * s, cy + 16f * s, cx + 46f * s, cy - 4f * s, cx + 38f * s, cy - 22f * s)
                p.cubicTo(cx + 30f * s, cy - 40f * s, cx + 5f * s, cy - 38f * s, cx, cy - 22f * s)
                p.close()
            }
            "star" -> {
                val cx = r.centerX()
                val cy = r.centerY()
                val outerR = r.width() * 0.48f
                val innerR = outerR * 0.42f
                for (i in 0 until 10) {
                    val radius = if (i % 2 == 0) outerR else innerR
                    val angle = Math.toRadians((i * 36 - 90).toDouble())
                    val x = (cx + radius * Math.cos(angle)).toFloat()
                    val y = (cy + radius * Math.sin(angle)).toFloat()
                    if (i == 0) p.moveTo(x, y) else p.lineTo(x, y)
                }
                p.close()
            }
            "arch" -> {
                val topRadius = r.width() * 0.5f
                val bottomRadius = 24f
                val radii = floatArrayOf(
                    topRadius, topRadius,
                    topRadius, topRadius,
                    bottomRadius, bottomRadius,
                    bottomRadius, bottomRadius
                )
                p.addRoundRect(r, radii, Path.Direction.CW)
            }
            "oval" -> {
                p.addOval(r, Path.Direction.CW)
            }
            "shield" -> {
                p.moveTo(r.centerX(), r.top)
                p.lineTo(r.right, r.top + r.height() * 0.15f)
                p.lineTo(r.right, r.top + r.height() * 0.58f)
                p.quadTo(r.right, r.bottom, r.centerX(), r.bottom)
                p.quadTo(r.left, r.bottom, r.left, r.top + r.height() * 0.58f)
                p.lineTo(r.left, r.top + r.height() * 0.15f)
                p.close()
            }
            "organic_blob_1" -> {
                val w = r.width()
                val h = r.height()
                p.moveTo(r.left + w * 0.50f, r.top + h * 0.10f)
                p.cubicTo(r.left + w * 0.75f, r.top + h * 0.12f, r.left + w * 0.90f, r.top + h * 0.30f, r.left + w * 0.88f, r.top + h * 0.58f)
                p.cubicTo(r.left + w * 0.86f, r.top + h * 0.85f, r.left + w * 0.68f, r.top + h * 0.90f, r.left + w * 0.45f, r.top + h * 0.88f)
                p.cubicTo(r.left + w * 0.20f, r.top + h * 0.86f, r.left + w * 0.10f, r.top + h * 0.72f, r.left + w * 0.12f, r.top + h * 0.45f)
                p.cubicTo(r.left + w * 0.14f, r.top + h * 0.18f, r.left + w * 0.25f, r.top + h * 0.08f, r.left + w * 0.50f, r.top + h * 0.10f)
                p.close()
            }
            "organic_blob_2" -> {
                val w = r.width()
                val h = r.height()
                p.moveTo(r.left + w * 0.50f, r.top + h * 0.12f)
                p.cubicTo(r.left + w * 0.78f, r.top + h * 0.14f, r.left + w * 0.86f, r.top + h * 0.35f, r.left + w * 0.84f, r.top + h * 0.65f)
                p.cubicTo(r.left + w * 0.82f, r.top + h * 0.88f, r.left + w * 0.62f, r.top + h * 0.88f, r.left + w * 0.38f, r.top + h * 0.84f)
                p.cubicTo(r.left + w * 0.15f, r.top + h * 0.80f, r.left + w * 0.12f, r.top + h * 0.58f, r.left + w * 0.16f, r.top + h * 0.34f)
                p.cubicTo(r.left + w * 0.20f, r.top + h * 0.15f, r.left + w * 0.30f, r.top + h * 0.10f, r.left + w * 0.50f, r.top + h * 0.12f)
                p.close()
            }
            "organic_pebble" -> {
                val w = r.width()
                val h = r.height()
                p.moveTo(r.left + w * 0.48f, r.top + h * 0.10f)
                p.cubicTo(r.left + w * 0.72f, r.top + h * 0.10f, r.left + w * 0.88f, r.top + h * 0.28f, r.left + w * 0.88f, r.top + h * 0.52f)
                p.cubicTo(r.left + w * 0.88f, r.top + h * 0.78f, r.left + w * 0.70f, r.top + h * 0.88f, r.left + w * 0.48f, r.top + h * 0.88f)
                p.cubicTo(r.left + w * 0.24f, r.top + h * 0.88f, r.left + w * 0.12f, r.top + h * 0.74f, r.left + w * 0.12f, r.top + h * 0.50f)
                p.cubicTo(r.left + w * 0.12f, r.top + h * 0.24f, r.left + w * 0.24f, r.top + h * 0.10f, r.left + w * 0.48f, r.top + h * 0.10f)
                p.close()
            }
            else -> {
                val radius = r.width() * 0.28f
                p.addRoundRect(r, radius, radius, Path.Direction.CW)
            }
        }
        return p
    }

    private fun createColorFilter(tone: String, intensity: Int): ColorFilter? {
        val cm = ColorMatrix()
        val factor = intensity / 100f

        when (tone) {
            "mono", "grayscale" -> cm.setSaturation(1f - factor)
            "vivid" -> cm.setSaturation(1f + factor * 0.6f)
            "warm" -> cm.setScale(1f + 0.15f * factor, 1f + 0.05f * factor, 1f - 0.1f * factor, 1f)
            "cool" -> cm.setScale(1f - 0.08f * factor, 1f + 0.05f * factor, 1f + 0.2f * factor, 1f)
            else -> return null
        }
        return ColorMatrixColorFilter(cm)
    }

    private fun applyTextureOverlay(canvas: Canvas, texture: String, intensity: Int, w: Int, h: Int) {
        if (texture == "none" || intensity <= 0) return
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        if (texture == "film" || texture == "vignette") {
            val vignette = RadialGradient(
                w * 0.5f, h * 0.5f, w * 0.7f,
                Color.TRANSPARENT,
                Color.argb((intensity * 1.5f).toInt(), 5, 7, 12),
                Shader.TileMode.CLAMP
            )
            paint.shader = vignette
            canvas.drawRect(0f, 0f, w.toFloat(), h.toFloat(), paint)
        }
    }

    fun loadBitmap(context: Context, uriStr: String): Bitmap? {
        if (uriStr.isBlank()) return null
        return try {
            if (uriStr.startsWith("data:image/")) {
                val base64 = uriStr.substringAfter("base64,")
                val bytes = Base64.decode(base64, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            } else if (uriStr.startsWith("/photos/") || uriStr.startsWith("photos/")) {
                val sub = uriStr.removePrefix("/")
                try {
                    context.assets.open(sub).use { BitmapFactory.decodeStream(it) }
                } catch (e1: Exception) {
                    try {
                        context.assets.open("www/$sub").use { BitmapFactory.decodeStream(it) }
                    } catch (e2: Exception) {
                        null
                    }
                }
            } else if (uriStr.startsWith("/")) {
                val file = File(uriStr)
                if (file.exists() && file.length() > 0) {
                    BitmapFactory.decodeFile(file.absolutePath)
                } else {
                    val assetSub = uriStr.removePrefix("/")
                    try {
                        context.assets.open(assetSub).use { BitmapFactory.decodeStream(it) }
                    } catch (e: Exception) {
                        null
                    }
                }
            } else if (uriStr.startsWith("file:///android_asset/")) {
                val assetPath = uriStr.removePrefix("file:///android_asset/")
                context.assets.open(assetPath).use { BitmapFactory.decodeStream(it) }
            } else {
                val uri = Uri.parse(uriStr)
                if (uri.scheme == "file") {
                    BitmapFactory.decodeFile(uri.path)
                } else {
                    context.contentResolver.openInputStream(uri)?.use {
                        BitmapFactory.decodeStream(it)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("WidgetBitmapRenderer", "Failed to load bitmap from $uriStr: ${e.message}")
            null
        }
    }
}
