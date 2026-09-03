import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Sun, Wind, Compass, ArrowRight, Navigation, Check, CheckCircle2, ShieldCheck, RefreshCw, Zap } from 'lucide-react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/common/Header';
import { InteractiveMapPicker } from '../components/common/InteractiveMapPicker';
import { CustomButton } from '../components/common/CustomButton';
import { useProjectStore } from '../store/projectStore';
import { UZBEKISTAN_REGIONS } from '../api/client';
import { ClimateRegion } from '../types';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

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
      }

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
        {/* Avtomatik GPS Joylashuv Kartochkasi */}
        <View style={styles.autoLocationCard}>
          <View style={styles.alcLeft}>
            <View style={styles.pulseDotWrapper}>
              <View style={styles.pulseDotOuter} />
              <View style={styles.pulseDot} />
            </View>
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
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <RefreshCw color={COLORS.primary} size={16} />
            )}
          </TouchableOpacity>
        </View>

        {/* Jonli Leaflet HD Xarita */}
        <InteractiveMapPicker
          selectedRegion={effectiveRegion}
          compassAngle={compassAngle}
          onSelectCoordinates={handleCoordinatesSelectedOnMap}
        />

        {/* Avtomatik Iqlim va Havfsizlik Xulosasi */}
        <View style={styles.climateSummaryCard}>
          <View style={styles.cscHeader}>
            <LinearGradient
              colors={[COLORS.success, COLORS.primaryLight]}
              style={styles.cscHeaderIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ShieldCheck size={16} color={COLORS.surface} />
            </LinearGradient>
            <Text style={styles.cscTitle}>QMQ 2.04.05-97 Avtomatik Iqlim</Text>
          </View>

          <View style={styles.cscGrid}>
            <View style={styles.cscItem}>
              <Text style={styles.cscLabel}>Qishki Min Harorat:</Text>
              <Text style={[styles.cscVal, { color: COLORS.cool }]}>{selectedRegion.minWinterTemp}°C</Text>
            </View>
            <View style={styles.cscItem}>
              <Text style={styles.cscLabel}>Yozgi Max Harorat:</Text>
              <Text style={[styles.cscVal, { color: COLORS.heat }]}>+{selectedRegion.maxSummerTemp}°C</Text>
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

        {/* Tezkor Viloyatni O‘zgartirish */}
        <Text style={styles.sectionTitle}>Boshqa Hududni Tanlash:</Text>
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
      <View style={[styles.footer, { paddingBottom: insets.bottom || SPACING.lg }]}>
        <CustomButton
          title="⚡ Loyihalashga O‘tish"
          icon={<ArrowRight color={COLORS.surface} size={18} />}
          onPress={handleSaveAndContinue}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  autoLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  alcLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pulseDotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    height: 14,
  },
  pulseDotOuter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    opacity: 0.3,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  alcTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  alcSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  refreshGpsBtn: {
    backgroundColor: COLORS.primaryBg,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  climateSummaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cscHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cscHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cscTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  cscGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  cscItem: {
    width: '48%',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cscLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cscVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  regionsScroll: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  regionChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 100,
  },
  selectedRegionChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  regionChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  selectedRegionChipText: {
    color: COLORS.surface,
  },
  regionTemp: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  selectedRegionTemp: {
    color: COLORS.primaryBg,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
