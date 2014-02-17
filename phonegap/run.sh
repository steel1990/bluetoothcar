p=$1

if [ -z $p ]; then
    echo build;
    phonegap build android;
fi

echo uninstall;
adb uninstall com.phonegap.carcontroller
echo install;
adb install platforms/android/bin/CarController-debug.apk
echo start;
adb shell am start -n com.phonegap.carcontroller/.CarController