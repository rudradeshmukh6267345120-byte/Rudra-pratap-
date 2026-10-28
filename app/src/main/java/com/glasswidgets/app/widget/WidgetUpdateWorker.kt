package com.glasswidgets.app.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.glasswidgets.app.data.WidgetDataStore
import java.util.concurrent.TimeUnit

class WidgetUpdateWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val appWidgetId = inputData.getInt(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            WidgetDataStore.cycleNextPhoto(context, appWidgetId)
            val appWidgetManager = AppWidgetManager.getInstance(context)
            GlassPhotoWidgetProvider.updateWidget(context, appWidgetManager, appWidgetId)
        }
        return Result.success()
    }

    companion object {
        const val EXTRA_WIDGET_ID = "extra_widget_id"
        private const val WORK_TAG_PREFIX = "widget_update_work_"

        fun scheduleWork(context: Context, appWidgetId: Int) {
            val config = WidgetDataStore.getWidgetConfig(context, appWidgetId)
            val intervalMinutes = config.rotationIntervalMinutes.toLong().coerceAtLeast(15L)

            val workRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
                intervalMinutes, TimeUnit.MINUTES
            )
                .setInputData(workDataOf(EXTRA_WIDGET_ID to appWidgetId))
                .addTag("$WORK_TAG_PREFIX$appWidgetId")
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "$WORK_TAG_PREFIX$appWidgetId",
                ExistingPeriodicWorkPolicy.UPDATE,
                workRequest
            )
        }

        fun cancelWork(context: Context, appWidgetId: Int) {
            WorkManager.getInstance(context).cancelUniqueWork("$WORK_TAG_PREFIX$appWidgetId")
        }
    }
}
