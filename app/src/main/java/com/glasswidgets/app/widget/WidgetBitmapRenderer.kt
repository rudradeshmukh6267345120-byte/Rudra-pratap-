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

        // Safe padding so border stroke and soft glow never clip at the bitmap edge
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
            paint.colorFilter = createColorFilter(config.filterTone, config.filterIntensity)

            val matrix = Matrix()
            val scaleX = targetWidth.toFloat() / srcBitmap.width
            val scaleY = targetHeight.toFloat() / srcBitmap.height
            val baseScale = if (config.photoFitting == "fit") {
                minOf(scaleX, scaleY)
            } else {
                maxOf(scaleX, scaleY)
            }

            val finalScale = baseScale * maxOf(0.2f, config.photoScale)
            val flipScaleX = if (config.photoFlipX) -1f else 1f
            val flipScaleY = if (config.photoFlipY) -1f else 1f

            val px = srcBitmap.width * 0.5f
            val py = srcBitmap.height * 0.5f
            val cx = targetWidth * 0.5f
            val cy = targetHeight * 0.5f

            matrix.postTranslate(-px, -py)
            matrix.postScale(finalScale * flipScaleX, finalScale * flipScaleY)
            matrix.postRotate(config.photoRotation)
            matrix.postTranslate(
                cx + (config.photoOffsetX * targetWidth * 0.01f),
                cy + (config.photoOffsetY * targetHeight * 0.01f)
            )

            canvas.drawBitmap(srcBitmap, matrix, paint)
            paint.colorFilter = null

            applyTextureOverlay(canvas, config.textureType, config.textureIntensity, targetWidth, targetHeight)
        } else {
            drawAuthenticLogoPlaceholder(context, canvas, rect, config.name)
        }

        // 3D Glass Specular Sheen Reflection
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
        val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
        }
        canvas.drawRect(rect, bgPaint)

        val logoBitmap = loadBitmap(context, "logo.png")
            ?: loadBitmap(context, "www/logo.png")
            ?: loadBitmap(context, "www/icon.png")

        if (logoBitmap != null) {
            val iconMatrix = Matrix()
            val logoSize = rect.width() * 0.65f
            val scale = logoSize / logoBitmap.width
            val dx = rect.centerX() - (logoBitmap.width * scale * 0.5f)
            val dy = rect.centerY() - (logoBitmap.height * scale * 0.5f) - (if (widgetName.isNotBlank() && widgetName != "Glass Widget") 16f else 0f)
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
        val w = r.width()
        val h = r.height()
        val cx = r.centerX()
        val cy = r.centerY()

        when (shape) {
            "circle" -> {
                p.addOval(r, Path.Direction.CW)
            }
            "squircle" -> {
                val radius = w * 0.36f
                p.addRoundRect(r, radius, radius, Path.Direction.CW)
            }
            "rounded_square" -> {
                val radius = w * 0.26f
                p.addRoundRect(r, radius, radius, Path.Direction.CW)
            }
            "square" -> {
                p.addRoundRect(r, 12f, 12f, Path.Direction.CW)
            }
            "rectangle" -> {
                p.addRoundRect(r, 22f, 22f, Path.Direction.CW)
            }
            "diamond" -> {
                p.moveTo(cx, r.top + h * 0.04f)
                p.lineTo(r.right - w * 0.04f, cy)
                p.lineTo(cx, r.bottom - h * 0.04f)
                p.lineTo(r.left + w * 0.04f, cy)
                p.close()
            }
            "hexagon" -> {
                p.moveTo(cx, r.top + h * 0.04f)
                p.lineTo(r.right - w * 0.06f, r.top + h * 0.26f)
                p.lineTo(r.right - w * 0.06f, r.top + h * 0.74f)
                p.lineTo(cx, r.bottom - h * 0.04f)
                p.lineTo(r.left + w * 0.06f, r.top + h * 0.74f)
                p.lineTo(r.left + w * 0.06f, r.top + h * 0.26f)
                p.close()
            }
            "heart" -> {
                // Symmetrical, smooth, proportioned heart shape
                p.moveTo(cx, r.top + h * 0.26f)
                p.cubicTo(cx - w * 0.10f, r.top + h * 0.08f, r.left + w * 0.24f, r.top + h * 0.08f, r.left + w * 0.05f, r.top + h * 0.32f)
                p.cubicTo(r.left + w * 0.05f, r.top + h * 0.52f, cx - w * 0.24f, r.top + h * 0.70f, cx, r.top + h * 0.92f)
                p.cubicTo(cx + w * 0.24f, r.top + h * 0.70f, r.right - w * 0.05f, r.top + h * 0.52f, r.right - w * 0.05f, r.top + h * 0.32f)
                p.cubicTo(r.right - w * 0.24f, r.top + h * 0.08f, cx + w * 0.10f, r.top + h * 0.08f, cx, r.top + h * 0.26f)
                p.close()
            }
            "star" -> {
                val outerR = w * 0.48f
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
                val topRadius = w * 0.5f
                val bottomRadius = 20f
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
                p.moveTo(cx, r.top + h * 0.04f)
                p.lineTo(r.right - w * 0.06f, r.top + h * 0.14f)
                p.lineTo(r.right - w * 0.06f, r.top + h * 0.56f)
                p.cubicTo(r.right - w * 0.06f, r.top + h * 0.78f, cx + w * 0.22f, r.bottom - h * 0.04f, cx, r.bottom - h * 0.04f)
                p.cubicTo(cx - w * 0.22f, r.bottom - h * 0.04f, r.left + w * 0.06f, r.top + h * 0.78f, r.left + w * 0.06f, r.top + h * 0.56f)
                p.lineTo(r.left + w * 0.06f, r.top + h * 0.14f)
                p.close()
            }
            else -> {
                val radius = w * 0.28f
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
