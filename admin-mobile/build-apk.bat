@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\PRINTARA\AppData\Local\Android\Sdk
echo Setting up Java and Android SDK paths...
echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%

cd /d %~dp0
echo Cleaning node_modules caches...
node clean-cache.js

echo Building Android APK...
cd android
call gradlew clean assembleRelease

echo.
if %errorlevel% neq 0 (
    echo Build failed. Please ensure you have installed NDK 26.0.1 in Android Studio.
) else (
    echo Build succeeded! 
    echo Your APK is located at:
    echo %~dp0android\app\build\outputs\apk\release\app-release.apk
)
pause
