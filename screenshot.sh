#!/bin/sh
ADB=/c/adt-bundle-windows-x86_64/sdk/platform-tools/adb
# calculate resolution
DISPLAY_RAW=$(${ADB} shell dumpsys window)
HRES=$(echo "${DISPLAY_RAW}" | grep SurfaceWidth  | head -1 | perl -pe 's/^.*\bSurfaceWidth\:\s*(\d+)px\b.*$/$1/')
VRES=$(echo "${DISPLAY_RAW}" | grep SurfaceHeight | head -1 | perl -pe 's/^.*\bSurfaceHeight\:\s*(\d+)px\b.*$/$1/')
RES=${HRES}x${VRES}

echo $RES