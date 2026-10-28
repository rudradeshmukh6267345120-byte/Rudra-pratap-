# Glass Widgets — Android Native Studio Project Build Guide

This project is a native Android Studio project configured to build **glass-widgets.apk**.

## 1. Quick Build (One-Click)
Run the included build script in this directory:
- **On Windows**: Double click `build-apk.bat`
- **On macOS / Linux**: Run `bash build-apk.sh`

The compiled APK will immediately be generated at:
```
app/build/outputs/apk/debug/glass-widgets.apk
```

---

## 2. In Android Studio
1. Open Android Studio (Ladybug, Hedgehog, or newer).
2. Select **Open** and choose this project folder.
3. Click the green **Run (Shift+F10)** button to install onto your phone or emulator.
4. Or select **Build > Build APK(s)** from the top menu.

---

## 3. Install on Android Phone via ADB
```bash
adb install -r app/build/outputs/apk/debug/glass-widgets.apk
```

---

## 4. How to Add to Your Home Screen
1. On your phone, long press any empty area on your home screen launcher.
2. Tap **Widgets**.
3. Scroll to **Glass Widgets** and drag Small (2x2), Medium (4x2), or Large (4x4).
4. Tap the widget anytime on your home screen to instantly cycle to the next photo!
