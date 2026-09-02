import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Sun, Wind, Compass, ArrowRight, Navigation, Check, CheckCircle2, ShieldCheck, RefreshCw, Zap } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Header } from '../components/common/Header';
import { InteractiveMapPicker } from '../components/common/InteractiveMapPicker';
import { CustomButton } from '../components/common/CustomButton';
import { useProjectStore } from '../store/projectStore';
import { UZBEKISTAN_REGIONS } from '../api/client';
import { ClimateRegion } from '../types';

export const LocationScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { projectId } = route.params || {};
  const { currentProject, updateProject } = useProjectStore();

  const [selectedRegionId, setSelectedRegionId] = useState(currentProject?.regionId || 'tashkent');
  const [compassAngle, setCompassAngle] = useState(currentProject?.compassNorthAngle || 0);
  const [wallMaterial, setWallMaterial] = useState(currentProject?.wallMaterial || 'brick');

  const [locating, setLocating] = useState(false);
  const [gpsData, setGpsData] = useState<{
    latitude?: number;
    longitude?: number;
    city?: string;
    district?: string;
    street?: string;
  } | null>(null);

  const selectedRegion = UZBEKISTAN_REGIONS.find((r) => r.id === selectedRegionId) || UZBEKISTAN_REGIONS[0];

  // Avtomatik GPS Joylashuvni aniqlash
  const handleDetectLocation = async (showAlert = false) => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return;
      }

      let location: Location.LocationObject | null = null;
      try {
        const posPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const timePromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
        location = await Promise.race([posPromise, timePromise]);
      } catch {
        location = null;
      }

      if (!location) {
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location || !location.coords) {
        const defReg = UZBEKISTAN_REGIONS[0];
        setSelectedRegionId(defReg.id);
        setGpsData({ latitude: defReg.latitude, longitude: defReg.longitude, city: defReg.nameUz });
        setLocating(false);
        return;
      }

      const { latitude, longitude } = location.coords;
      let detectedCity = '';
      let detectedDistrict = '';

      try {
        const geoPromise = Location.reverseGeocodeAsync({ latitude, longitude });
        const geoTime = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const geoRes = (await Promise.race([geoPromise, geoTime])) as Location.LocationGeocodedAddress[] | null;
        if (geoRes && geoRes[0]) {
          detectedCity = geoRes[0].city || geoRes[0].region || '';
          detectedDistrict = geoRes[0].district || geoRes[0].subregion || '';
        }
      } catch {
        // safe fallback
      }

      // Eng yaqin viloyatni topish
      let closestRegion = UZBEKISTAN_REGIONS[0];
      let minDistance = Infinity;
      for (const reg of UZBEKISTAN_REGIONS) {
        const dist = Math.hypot(reg.latitude - latitude, reg.longitude - longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestRegion = reg;
        }
      }

      setSelectedRegionId(closestRegion.id);
      setGpsData({
        latitude,
        longitude,
        city: detectedCity || closestRegion.nameUz,
        district: detectedDistrict,
      });
      setLocating(false);

      if (showAlert) {
        Alert.alert(
          '✅ Joylashuv yangilandi!',
          `Hudud: ${detectedCity || closestRegion.nameUz}\nKoordinatalar: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\nIqlim: ${closestRegion.minWinterTemp}°C / ${closestRegion.maxSummerTemp}°C`
        );
      }
    } catch {
      setLocating(false);
    }
  };

  // Ekranga kirganda avtomatik GPS ni ishga tushirish
  useEffect(() => {
    handleDetectLocation(false);
  }, []);

  const handleCoordinatesSelectedOnMap = (lat: number, lng: number, region: ClimateRegion) => {
    setSelectedRegionId(region.id);
    setGpsData({
      latitude: lat,
      longitude: lng,
      city: region.name,
      district: 'Xaritadan tanlandi',
    });
  };

  const handleSaveAndContinue = async () => {
    if (projectId || currentProject?._id) {
      const id = projectId || currentProject?._id;
      await updateProject(id, {
        regionId: selectedRegionId,
        compassNorthAngle: compassAngle,
        wallMaterial,
        address: gpsData ? `${gpsData.city || ''} ${gpsData.district || ''} ${gpsData.street || ''}`.trim() : undefined,
      });
    }
    navigation.navigate('ConstructorScreen', { projectId: projectId || currentProject?._id });
  };

  const effectiveRegion: ClimateRegion = useMemo(() => {
    if (gpsData?.latitude && gpsData?.longitude) {
      return {
        ...selectedRegion,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
      };
    }
    return selectedRegion;
  }, [selectedRegion, gpsData]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Geolokatsiya & Iqlim Analizi"
        subtitle="Avtomatik GPS, Jonli Quyosh va Iqlim Standartlari"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Avtomatik GPS Joylashuv Kartochkasi */}
        <View style={styles.autoLocationCard}>
          <View style={styles.alcLeft}>
            <View style={styles.pulseDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alcTitle}>
                {gpsData?.city || selectedRegion.nameUz}
              </Text>
              <Text style={styles.alcSub}>
                {gpsData?.latitude
                  ? `Koordinata: ${gpsData.latitude.toFixed(4)}°, ${gpsData.longitude?.toFixed(4)}° • Aniqlandi`
                  : `Koordinata: ${selectedRegion.latitude}°, ${selectedRegion.longitude}°`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshGpsBtn}
            onPress={() => handleDetectLocation(true)}
            disabled={locating}
            activeOpacity={0.7}
          >
            {locating ? (
              <ActivityIndicator color="#0284C7" size="small" />
            ) : (
              <RefreshCw color="#0284C7" size={16} />
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Jonli Leaflet HD Xarita & Real Quyosh/Soya Simulyatsiyasi */}
        <InteractiveMapPicker
          selectedRegion={effectiveRegion}
          compassAngle={compassAngle}
          onSelectCoordinates={handleCoordinatesSelectedOnMap}
        />

        {/* 3. Avtomatik Iqlim va Havfsizlik Xulosasi */}
        <View style={styles.climateSummaryCard}>
          <View style={styles.cscHeader}>
            <ShieldCheck size={18} color="#16A34A" />
            <Text style={styles.cscTitle}>KMK 2.04.05-97 Avtomatik Iqlim Ko‘rsatkichlari</Text>
          </View>

          <View style={styles.cscGrid}>
            <View style={styles.cscItem}>
              <Text style={styles.cscLabel}>Qishki Min Harorat:</Text>
              <Text style={[styles.cscVal, { color: '#0284C7' }]}>{selectedRegion.minWinterTemp}°C</Text>
            </View>
            <View style={styles.cscItem}>
              <Text style={styles.cscLabel}>Yozgi Max Harorat:</Text>
              <Text style={[styles.cscVal, { color: '#EF4444' }]}>+{selectedRegion.maxSummerTemp}°C</Text>
            </View>
            <View style={styles.cscItem}>
              <Text style={styles.cscLabel}>Mavsumiy Shamol:</Text>
              <Text style={styles.cscVal}>{selectedRegion.windSpeedWinter || 3.0} m/s</Text>
            </View>
            <View style={styles.cscItem}>
              <Text style={styles.cscLabel}>Quyosh Radiatsiyasi:</Text>
              <Text style={styles.cscVal}>{selectedRegion.solarRadiationSummer || 850} W/m²</Text>
            </View>
          </View>
        </View>

        {/* 4. Tezkor Viloyatni O‘zgartirish (Zarurat bo‘lsa) */}
        <Text style={styles.sectionTitle}>Boshqa Hududni Tanlash (Zarurat bo‘lsa):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionsScroll}>
          {UZBEKISTAN_REGIONS.map((r) => {
            const isSelected = selectedRegionId === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.regionChip, isSelected && styles.selectedRegionChip]}
                onPress={() => setSelectedRegionId(r.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.regionChipText, isSelected && styles.selectedRegionChipText]}>
                  {r.name}
                </Text>
                <Text style={[styles.regionTemp, isSelected && styles.selectedRegionTemp]}>
                  {r.minWinterTemp}°C / +{r.maxSummerTemp}°C
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>

      {/* Pastki Harakat Tugmasi */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <CustomButton
          title="⚡ 2D & 3D Loyihalashga O‘tish"
          icon={<ArrowRight color="#FFFFFF" size={18} />}
          onPress={handleSaveAndContinue}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  autoLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  alcLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  alcTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  alcSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  refreshGpsBtn: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  climateSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cscHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cscTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cscGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  cscItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cscLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  cscVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#334155',
    marginTop: 6,
    marginBottom: 8,
  },
  regionsScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  regionChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 90,
  },
  selectedRegionChip: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  regionChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedRegionChipText: {
    color: '#FFFFFF',
  },
  regionTemp: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600',
  },
  selectedRegionTemp: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});
