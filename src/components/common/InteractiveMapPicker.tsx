import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  MapPin,
  Sun,
  Wind,
  Compass,
  Clock,
  Eye,
  Layers,
  Sparkles,
  Sunrise,
  Sunset,
} from 'lucide-react-native';
import { ClimateRegion } from '../../types';
import { UZBEKISTAN_REGIONS } from '../../api/client';
import { calculateExactSolarPhysics, SolarCalculationResult } from '../../utils/solarPhysics';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InteractiveMapPickerProps {
  selectedRegion: ClimateRegion;
  compassAngle: number;
  onSelectCoordinates: (lat: number, lng: number, region: ClimateRegion) => void;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  selectedRegion,
  compassAngle,
  onSelectCoordinates,
}) => {
  const mapWidth = SCREEN_WIDTH - 32;
  const mapHeight = 350;
  const webViewRef = useRef<WebView>(null);

  const now = new Date();
  const currentHourFloat = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const [timeHour, setTimeHour] = useState<number>(currentHourFloat);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street'>('satellite');

  const currentLat = selectedRegion.latitude || 41.2135;
  const currentLng = selectedRegion.longitude || 69.2144;

  // Jonli vaqtni har daqiqa yangilab turish
  useEffect(() => {
    if (!isLiveMode) return;
    const timer = setInterval(() => {
      const liveNow = new Date();
      setTimeHour(liveNow.getHours() + liveNow.getMinutes() / 60 + liveNow.getSeconds() / 3600);
    }, 15000);
    return () => clearInterval(timer);
  }, [isLiveMode]);

  // Yuqori aniqlikdagi NOAA / SPA Quyosh va Soya fizikasi
  const solarData: SolarCalculationResult = useMemo(() => {
    return calculateExactSolarPhysics(
      currentLat,
      currentLng,
      now,
      isLiveMode ? undefined : timeHour,
      6.0 // 2 qavatli bino balandligi = 6m
    );
  }, [currentLat, currentLng, timeHour, isLiveMode]);

  // Leaflet HTML kodi (Aniq burchaklar va Quyosh chiqish/botish nurlari)
  const leafletHTML = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: ${COLORS.dark};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-control-attribution { display: none !important; }
    
    .house-box {
      width: 34px;
      height: 34px;
      background: ${COLORS.primary};
      border: 2.5px solid ${COLORS.surface};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      color: ${COLORS.surface};
      font-size: 16px;
    }
    
    #solarCanvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 400;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <canvas id="solarCanvas"></canvas>

  <script>
    var currentLat = ${currentLat};
    var currentLng = ${currentLng};
    var sunAzimuth = ${solarData.sunAzimuthDeg};
    var sunElevation = ${solarData.sunElevationDeg};
    var shadowAzimuth = ${solarData.shadowAzimuthDeg};
    var shadowLen = ${solarData.shadowLengthM};
    var sunWatts = ${solarData.solarRadiationWatts};
    var isDay = ${solarData.isDaylight ? 'true' : 'false'};
    var riseAz = ${solarData.sunriseAzimuthDeg};
    var setAz = ${solarData.sunsetAzimuthDeg};
    var riseTime = "${solarData.sunriseTimeStr}";
    var setTime = "${solarData.sunsetTimeStr}";
    var currentLayerType = '${mapLayer}';

    // Leaflet Xarita (Zoom 17 - Aynan uyingiz ko'chasi va tomi ko'rinadi)
    var map = L.map('map', {
      center: [currentLat, currentLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    var satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    });
    var streetLayer = L.tileLayer('https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png', {
      maxZoom: 19
    });

    if (currentLayerType === 'satellite') {
      satLayer.addTo(map);
    } else {
      streetLayer.addTo(map);
    }

    var houseIcon = L.divIcon({
      className: 'custom-house-marker',
      html: '<div class="house-box">🏠</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    var marker = L.marker([currentLat, currentLng], {
      icon: houseIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      sendLocation(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendLocation(e.latlng.lat, e.latlng.lng);
    });

    function sendLocation(lat, lng) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location_changed',
          lat: lat,
          lng: lng
        }));
      }
    }

    // 100% Aniq Quyosh & Soya Canvas Rendereri
    var canvas = document.getElementById('solarCanvas');
    var ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawSolarOverlay();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawSolarOverlay() {
      if (!ctx || !map) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var point = map.latLngToContainerPoint(marker.getLatLng());
      var cx = point.x;
      var cy = point.y;

      // 1. Chiqish (Sunrise) Yo'nalishi Strelkasi
      var rRad = (riseAz * Math.PI) / 180;
      var rx = cx + Math.sin(rRad) * 85;
      var ry = cy - Math.cos(rRad) * 85;

      ctx.save();
      ctx.strokeStyle = '${COLORS.warning}';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '${COLORS.warningBg}';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.fillText('🌅 Chiqish ' + riseTime + ' (' + Math.round(riseAz) + '°)', rx + 6, ry);
      ctx.restore();

      // 2. Botish (Sunset) Yo'nalishi Strelkasi
      var sSetRad = (setAz * Math.PI) / 180;
      var setX = cx + Math.sin(sSetRad) * 85;
      var setY = cy - Math.cos(sSetRad) * 85;

      ctx.save();
      ctx.strokeStyle = '${COLORS.heat}';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(setX, setY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '${COLORS.heatLight}';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.fillText('🌆 Botish ' + setTime + ' (' + Math.round(setAz) + '°)', setX - 110, setY);
      ctx.restore();

      // 3. HOZIRGI KUNDUZGI QUYOSH VA REAL SOYA
      if (isDay && sunElevation > 0) {
        var sRad = (shadowAzimuth * Math.PI) / 180;
        var pixLen = Math.min(130, Math.max(16, shadowLen * 3.2));
        var ex = cx + Math.sin(sRad) * pixLen;
        var ey = cy - Math.cos(sRad) * pixLen;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.lineTo(ex + 12, ey);
        ctx.lineTo(ex - 12, ey);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '${COLORS.cool}';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '${COLORS.surface}';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Soya: ' + shadowLen + 'm (' + Math.round(shadowAzimuth) + '°)', ex, ey + 15);
        ctx.restore();

        var sunRad = (sunAzimuth * Math.PI) / 180;
        var sx = cx + Math.sin(sunRad) * 95;
        var sy = cy - Math.cos(sunRad) * 95;

        var grad = ctx.createLinearGradient(sx, sy, cx, cy);
        grad.addColorStop(0, 'rgba(217, 119, 6, 0.6)'); // Warning color base
        grad.addColorStop(1, 'rgba(217, 119, 6, 0.02)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(cx - 16, cy - 10);
        ctx.lineTo(cx + 16, cy + 10);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.fillStyle = '${COLORS.warning}';
        ctx.shadowColor = '${COLORS.warningBg}';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sx, sy, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '${COLORS.surface}';
        ctx.font = 'bold 10px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sunWatts + ' W/m²', sx, sy - 14);
        ctx.restore();
      }
    }

    map.on('move', drawSolarOverlay);
    map.on('zoom', drawSolarOverlay);
    map.on('viewreset', drawSolarOverlay);

    // React Native'dan yangilanishlarni qabul qilish
    window.updateSolarData = function(lat, lng, sAz, sEl, shAz, shLen, sW, day, rAz, setA, rT, setT, layer) {
      currentLat = lat;
      currentLng = lng;
      sunAzimuth = sAz;
      sunElevation = sEl;
      shadowAzimuth = shAz;
      shadowLen = shLen;
      sunWatts = sW;
      isDay = day;
      riseAz = rAz;
      setAz = setA;
      riseTime = rT;
      setTime = setT;
      
      marker.setLatLng([lat, lng]);
      map.panTo([lat, lng], { animate: true });
      drawSolarOverlay();
    };
  </script>
</body>
</html>
    `;
  }, [mapLayer, solarData]);

  // Leaflet ga real vaqt astronomik qiymatlarini uzatish
  useEffect(() => {
    if (webViewRef.current) {
      const script = `
        if (window.updateSolarData) {
          window.updateSolarData(
            ${currentLat},
            ${currentLng},
            ${solarData.sunAzimuthDeg},
            ${solarData.sunElevationDeg},
            ${solarData.shadowAzimuthDeg},
            ${solarData.shadowLengthM},
            ${solarData.solarRadiationWatts},
            ${solarData.isDaylight ? 'true' : 'false'},
            ${solarData.sunriseAzimuthDeg},
            ${solarData.sunsetAzimuthDeg},
            '${solarData.sunriseTimeStr}',
            '${solarData.sunsetTimeStr}',
            '${mapLayer}'
          );
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [currentLat, currentLng, solarData, mapLayer]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location_changed' && data.lat && data.lng) {
        let closest = UZBEKISTAN_REGIONS[0];
        let minD = Infinity;
        for (const r of UZBEKISTAN_REGIONS) {
          const d = Math.hypot(r.latitude - data.lat, r.longitude - data.lng);
          if (d < minD) {
            minD = d;
            closest = r;
          }
        }
        onSelectCoordinates(parseFloat(data.lat.toFixed(5)), parseFloat(data.lng.toFixed(5)), closest);
      }
    } catch {
      // safe fallback
    }
  };

  const handleSetTime = (h: number, live = false) => {
    setTimeHour(h);
    setIsLiveMode(live);
  };

  const formattedHours = Math.floor(timeHour);
  const formattedMins = Math.floor((timeHour - formattedHours) * 60);
  const timeString = `${String(formattedHours).padStart(2, '0')}:${String(formattedMins).padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      {/* Header & Jonli Holat Badgi */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleLeft}>
          <Sun size={18} color={COLORS.warning} />
          <Text style={styles.title}>NOAA Quyosh & Soya Tahlili</Text>
        </View>

        <TouchableOpacity
          style={[styles.livePill, isLiveMode && styles.livePillActive]}
          onPress={() => handleSetTime(currentHourFloat, true)}
        >
          <View style={[styles.liveDot, isLiveMode && styles.liveDotActive]} />
          <Text style={[styles.liveText, isLiveMode && styles.liveTextActive]}>
            {isLiveMode ? `🔴 Jonli: ${timeString}` : `⏰ ${timeString}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Astronomik Quyosh Tavsifi */}
      <View style={styles.solarDescBox}>
        <Text style={styles.solarDescText}>{solarData.sunPositionDescription}</Text>
      </View>

      {/* Leaflet HD Xaritasi (Zoom 17) */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHTML }}
          style={styles.webView}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleMessage}
        />

        {/* Xarita Qatlami Switcheri */}
        <View style={styles.layerFloatBox}>
          <TouchableOpacity
            style={[styles.layerChip, mapLayer === 'satellite' && styles.layerChipActive]}
            onPress={() => setMapLayer('satellite')}
          >
            <Text style={[styles.layerChipText, mapLayer === 'satellite' && styles.layerChipTextActive]}>
              🛰️ Sun'iy Yo'ldosh
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.layerChip, mapLayer === 'street' && styles.layerChipActive]}
            onPress={() => setMapLayer('street')}
          >
            <Text style={[styles.layerChipText, mapLayer === 'street' && styles.layerChipTextActive]}>
              🗺️ Ko‘cha Xaritasi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chiqish va Botish Ko'rsatkichi Badgi */}
        <View style={styles.solarTimingPill}>
          <Sunrise size={12} color={COLORS.warning} />
          <Text style={styles.timingPillText}>{solarData.sunriseTimeStr} ({Math.round(solarData.sunriseAzimuthDeg)}° Sh-Sh)</Text>
          <Text style={{ color: COLORS.textMuted }}>•</Text>
          <Sunset size={12} color={COLORS.heat} />
          <Text style={styles.timingPillText}>{solarData.sunsetTimeStr} ({Math.round(solarData.sunsetAzimuthDeg)}° Sh-G‘)</Text>
        </View>
      </View>

      {/* Tezkor Vaqt Rejimlari */}
      <View style={styles.timeRow}>
        {[
          { label: '🔴 Jonli Vaqt', h: currentHourFloat, isLive: true },
          { label: `☀️ Qiyom (${solarData.solarNoonTimeStr})`, h: 12.4, isLive: false },
          { label: `🌅 Chiqish (${solarData.sunriseTimeStr})`, h: 5.75, isLive: false },
          { label: `🌇 Botish (${solarData.sunsetTimeStr})`, h: 19.1, isLive: false },
        ].map((btn, idx) => {
          const isSelected = isLiveMode ? btn.isLive : Math.abs(timeHour - btn.h) < 0.5;
          return (
            <TouchableOpacity
              key={`tb_${idx}`}
              style={[styles.quickTimeBtn, isSelected && styles.quickTimeBtnActive]}
              onPress={() => handleSetTime(btn.h, btn.isLive)}
            >
              <Text style={[styles.quickTimeText, isSelected && styles.quickTimeTextActive]}>
                {btn.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Real Natijalar (HUD Paneli) */}
      <View style={styles.hudGrid}>
        <View style={styles.hudCard}>
          <Sun size={14} color={COLORS.warning} />
          <Text style={styles.hudLabel}>Quyosh Quvvati</Text>
          <Text style={styles.hudValue}>{solarData.solarRadiationWatts} W/m²</Text>
        </View>

        <View style={styles.hudCard}>
          <Compass size={14} color={COLORS.cool} />
          <Text style={styles.hudLabel}>Azimut / Balandlik</Text>
          <Text style={styles.hudValue}>{Math.round(solarData.sunAzimuthDeg)}° / {solarData.sunElevationDeg}°</Text>
        </View>

        <View style={styles.hudCard}>
          <Eye size={14} color={COLORS.primary} />
          <Text style={styles.hudLabel}>Bino Soyasi</Text>
          <Text style={styles.hudValue}>{solarData.shadowLengthM} metr</Text>
        </View>

        <View style={styles.hudCard}>
          <Wind size={14} color={COLORS.coolLight} />
          <Text style={styles.hudLabel}>Shamol Zarbasi</Text>
          <Text style={styles.hudValue}>{selectedRegion.windSpeedWinter || 3.2} m/s</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: 0,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    flexShrink: 1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 5,
    marginLeft: 6,
  },
  livePillActive: {
    backgroundColor: COLORS.dangerBg,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.textMuted,
  },
  liveDotActive: {
    backgroundColor: COLORS.danger,
  },
  liveText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  liveTextActive: {
    color: COLORS.danger,
  },
  solarDescBox: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
  },
  solarDescText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  mapContainer: {
    width: '100%',
    height: 320,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.dark,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  layerFloatBox: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
    ...SHADOWS.floating,
  },
  layerChip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  layerChipActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.button,
  },
  layerChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  layerChipTextActive: {
    color: COLORS.text,
  },
  solarTimingPill: {
    position: 'absolute',
    left: SPACING.sm,
    bottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)', // darkSurface with opacity
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    gap: 5,
  },
  timingPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.surface,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.md,
  },
  quickTimeBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTimeBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.button,
  },
  quickTimeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quickTimeTextActive: {
    color: COLORS.surface,
  },
  hudGrid: {
    flexDirection: 'row',
    gap: 4,
    marginTop: SPACING.md,
  },
  hudCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudLabel: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  hudValue: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 1,
    textAlign: 'center',
  },
});
