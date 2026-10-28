package com.glasswidgets.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import com.glasswidgets.app.R
import com.glasswidgets.app.data.WidgetDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

open class GlassPhotoWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_NEXT_PHOTO = "com.glasswidgets.app.ACTION_NEXT_PHOTO"
        const val EXTRA_WIDGET_ID = "extra_widget_id"

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            CoroutineScope(Dispatchers.IO).launch {
                val config = WidgetDataStore.getWidgetConfig(context, appWidgetId)
                val bitmap = WidgetBitmapRenderer.renderWidgetBitmap(context, config, 600, 600)

                val views = RemoteViews(context.packageName, R.layout.widget_glass_photo)

                if (bitmap != null) {
                    views.setImageViewBitmap(R.id.widget_image, bitmap)
                } else {
                    views.setImageViewResource(R.id.widget_image, R.drawable.ic_photo_placeholder)
                }

                // Setup click action: tapping widget cycles to next photo or opens photo selector if empty
                val pendingIntent = if (config.photoUris.isEmpty()) {
                    val configIntent = Intent(context, com.glasswidgets.app.ui.PhotoWidgetConfigureActivity::class.java).apply {
                        putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    PendingIntent.getActivity(
                        context,
                        appWidgetId,
                        configIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                } else {
                    val nextPhotoIntent = Intent(context, GlassPhotoWidgetProvider::class.java).apply {
                        action = ACTION_NEXT_PHOTO
                        putExtra(EXTRA_WIDGET_ID, appWidgetId)
                    }
                    PendingIntent.getBroadcast(
                        context,
                        appWidgetId,
                        nextPhotoIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                }
                views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

                appWidgetManager.updateAppWidget(appWidgetId, views)
            }
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
            WidgetUpdateWorker.scheduleWork(context, appWidgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle?
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
        updateWidget(context, appWidgetManager, appWidgetId)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            WidgetDataStore.deleteWidgetConfig(context, appWidgetId)
            WidgetUpdateWorker.cancelWork(context, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_NEXT_PHOTO) {
            val appWidgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                CoroutineScope(Dispatchers.IO).launch {
                    WidgetDataStore.cycleNextPhoto(context, appWidgetId)
                    val appWidgetManager = AppWidgetManager.getInstance(context)
                    updateWidget(context, appWidgetManager, appWidgetId)
                }
            }
        }
    }
}

class GlassPhotoWidgetProviderSmall : GlassPhotoWidgetProvider()
class GlassPhotoWidgetProviderLarge : GlassPhotoWidgetProvider()
