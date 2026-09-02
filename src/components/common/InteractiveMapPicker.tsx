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
      background: #0B1120;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-control-attribution { display: none !important; }
    
    .house-box {
      width: 34px;
      height: 34px;
      background: #0284C7;
      border: 2.5px solid #FFFFFF;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.6);
      color: #FFFFFF;
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
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#FEF3C7';
      ctx.font = 'bold 9.5px -apple-system, sans-serif';
      ctx.fillText('🌅 Chiqish ' + riseTime + ' (' + Math.round(riseAz) + '°)', rx + 6, ry);
      ctx.restore();

      // 2. Botish (Sunset) Yo'nalishi Strelkasi
      var sSetRad = (setAz * Math.PI) / 180;
      var setX = cx + Math.sin(sSetRad) * 85;
      var setY = cy - Math.cos(sSetRad) * 85;

      ctx.save();
      ctx.strokeStyle = '#EA580C';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(setX, setY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#FED7AA';
      ctx.font = 'bold 9.5px -apple-system, sans-serif';
      ctx.fillText('🌆 Botish ' + setTime + ' (' + Math.round(setAz) + '°)', setX - 110, setY);
      ctx.restore();

      // 3. HOZIRGI KUNDUZGI QUYOSH VA REAL SOYA
      if (isDay && sunElevation > 0) {
        // Aniq Soya hisobi: Shimol=0°, Sharq=90°, Janub=180°, G'arb=270°
        var sRad = (shadowAzimuth * Math.PI) / 180;
        var pixLen = Math.min(130, Math.max(16, shadowLen * 3.2));
        var ex = cx + Math.sin(sRad) * pixLen;
        var ey = cy - Math.cos(sRad) * pixLen;

        // Bino soyasi poligoni
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.lineTo(ex + 12, ey);
        ctx.lineTo(ex - 12, ey);
        ctx.closePath();
        ctx.fill();

        // Soya o'qi
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Soya: ' + shadowLen + 'm (' + Math.round(shadowAzimuth) + '°)', ex, ey + 15);
        ctx.restore();

        // Aniq Quyosh Shari va Nur Konusi
        var sunRad = (sunAzimuth * Math.PI) / 180;
        var sx = cx + Math.sin(sunRad) * 95;
        var sy = cy - Math.cos(sunRad) * 95;

        // Nur konusi
        var grad = ctx.createLinearGradient(sx, sy, cx, cy);
        grad.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0.02)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(cx - 16, cy - 10);
        ctx.lineTo(cx + 16, cy + 10);
        ctx.closePath();
        ctx.fill();

        // Quyosh shari
        ctx.save();
        ctx.fillStyle = '#F59E0B';
        ctx.shadowColor = '#FDE047';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(sx, sy, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
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
          <Sun size={18} color="#F59E0B" />
          <Text style={styles.title}>NOAA Aniq Quyosh & Soya Tahlili</Text>
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
      <View style={[styles.mapContainer, { width: mapWidth, height: mapHeight }]}>
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
          <Sunrise size={12} color="#F59E0B" />
          <Text style={styles.timingPillText}>{solarData.sunriseTimeStr} ({Math.round(solarData.sunriseAzimuthDeg)}° Sh-Sh)</Text>
          <Text style={{ color: '#64748B' }}>•</Text>
          <Sunset size={12} color="#EA580C" />
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
          <Sun size={14} color="#F59E0B" />
          <Text style={styles.hudLabel}>Quyosh Quvvati</Text>
          <Text style={styles.hudValue}>{solarData.solarRadiationWatts} W/m²</Text>
        </View>

        <View style={styles.hudCard}>
          <Compass size={14} color="#0284C7" />
          <Text style={styles.hudLabel}>Azimut / Balandlik</Text>
          <Text style={styles.hudValue}>{Math.round(solarData.sunAzimuthDeg)}° / {solarData.sunElevationDeg}°</Text>
        </View>

        <View style={styles.hudCard}>
          <Eye size={14} color="#8B5CF6" />
          <Text style={styles.hudLabel}>Bino Soyasi</Text>
          <Text style={styles.hudValue}>{solarData.shadowLengthM} metr</Text>
        </View>

        <View style={styles.hudCard}>
          <Wind size={14} color="#06B6D4" />
          <Text style={styles.hudLabel}>Shamol Zarbasi</Text>
          <Text style={styles.hudValue}>{selectedRegion.windSpeedWinter || 3.2} m/s</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  livePillActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  liveDotActive: {
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  liveTextActive: {
    color: '#DC2626',
  },
  solarDescBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  solarDescText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  mapContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
    backgroundColor: '#0B1120',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  layerFloatBox: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 8,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  layerChip: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  layerChipActive: {
    backgroundColor: '#0284C7',
  },
  layerChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  layerChipTextActive: {
    color: '#FFFFFF',
  },
  solarTimingPill: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timingPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  quickTimeBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTimeBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  quickTimeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  quickTimeTextActive: {
    color: '#FFFFFF',
  },
  hudGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  hudCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hudLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  hudValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
});
