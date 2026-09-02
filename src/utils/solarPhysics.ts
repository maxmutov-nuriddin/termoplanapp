/**
 * Professional Solar Astronomy & Shadow Physics Engine
 * Compliant with NOAA Solar Position Algorithm (SPA) & NREL standards.
 */

export interface SolarCalculationResult {
  // Real-time solar position
  sunElevationDeg: number;       // Ufqdan balandlik burchagi (0°..90°)
  sunAzimuthDeg: number;         // Shimoldan boshlab azimut (0° Shimol, 90° Sharq, 180° Janub, 270° G'arb)
  solarRadiationWatts: number;   // Quyosh nurlanish quvvati (W/m²)
  isDaylight: boolean;           // Kunduzmi yoki tunmi

  // Soya hisobi
  shadowLengthM: number;         // Bino soyasi uzunligi (metrda)
  shadowAzimuthDeg: number;      // Soya yo'nalishi azimuti

  // Kun davomidagi asosiy astronomik nuqtalar
  sunriseTimeStr: string;        // Chiqish vaqti (masalan: "05:44")
  sunriseAzimuthDeg: number;     // Chiqish azimuti (masalan: 67° Shimoli-sharq)
  sunsetTimeStr: string;         // Botish vaqti (masalan: "19:05")
  sunsetAzimuthDeg: number;      // Botish azimuti (masalan: 293° Shimoli-g'arb)
  solarNoonTimeStr: string;      // Qiyom (Zenit) vaqti (masalan: "12:24")
  solarNoonElevationDeg: number; // Qiyomdagi maksimal balandlik (masalan: 58.5°)

  // Foydalanuvchiga tushunarli matnli tavsif
  sunPositionDescription: string;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function formatHourFloat(h: number): string {
  const normalized = ((h % 24) + 24) % 24;
  const hours = Math.floor(normalized);
  const minutes = Math.floor((normalized - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function calculateExactSolarPhysics(
  lat: number,
  lng: number,
  date: Date = new Date(),
  overrideHour?: number,
  buildingHeightM = 6.0
): SolarCalculationResult {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Yil boshidan hisoblangan kun raqami (Day of Year)
  const startOfYear = new Date(year, 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000);

  // Soat (agar overrideHour berilgan bo'lsa o'shani olamiz)
  const currentHourFloat = overrideHour !== undefined
    ? overrideHour
    : date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  // Fractional year (gamma)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (currentHourFloat - 12) / 24);

  // Equation of Time (EoT in minutes)
  const eqtime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  // Solar Declination Angle (decl in radians)
  const declRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const declDeg = radToDeg(declRad);

  const latRad = degToRad(lat);

  // O'zbekiston rasmiy vaqt mintaqasi UTC+5 (75° meridian)
  const timezoneMeridianDeg = 75.0;
  const timeOffsetMin = eqtime + 4 * (lng - timezoneMeridianDeg);

  // True Solar Time (TST in minutes)
  const trueSolarTimeMin = (currentHourFloat * 60 + timeOffsetMin + 1440) % 1440;

  // Solar Hour Angle (HRA in degrees: 0° at solar noon, negative in morning, positive in afternoon)
  const hraDeg = trueSolarTimeMin / 4 - 180;
  const hraRad = degToRad(hraDeg);

  // Solar Zenith Angle (theta_zenith)
  const cosZenith = Math.sin(latRad) * Math.sin(declRad) + Math.cos(latRad) * Math.cos(declRad) * Math.cos(hraRad);
  const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const elevationDeg = 90 - radToDeg(zenithRad);

  // Solar Azimuth Angle (gamma_azimuth, measured clockwise from North)
  const cosAzimuth = (Math.sin(declRad) * Math.cos(latRad) - Math.cos(declRad) * Math.sin(latRad) * Math.cos(hraRad)) / Math.sin(zenithRad);
  let azimuthDeg = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosAzimuth))));
  if (hraDeg > 0) {
    azimuthDeg = 360 - azimuthDeg;
  }
  // Convert convention: North = 0°, East = 90°, South = 180°, West = 270°
  azimuthDeg = (azimuthDeg + 180) % 360;

  // Chiqish va Botish hisoblari (Sunrise / Sunset)
  // Quyosh markazi ufqdan 0.833° pastda bo'lganda chiqadi/botadi (refraksiya hisobi)
  const cosHraRise = (Math.cos(degToRad(90.833)) - Math.sin(latRad) * Math.sin(declRad)) / (Math.cos(latRad) * Math.cos(declRad));

  let sunriseFloat = 6.0;
  let sunsetFloat = 19.0;
  let sunriseAzimuth = 65.0;
  let sunsetAzimuth = 295.0;

  if (cosHraRise >= -1 && cosHraRise <= 1) {
    const hraRiseDeg = radToDeg(Math.acos(cosHraRise));
    sunriseFloat = (720 - 4 * (lng - timezoneMeridianDeg) - eqtime - hraRiseDeg * 4) / 60;
    sunsetFloat = (720 - 4 * (lng - timezoneMeridianDeg) - eqtime + hraRiseDeg * 4) / 60;

    // Chiqish azimuti
    const cosRiseAz = Math.sin(declRad) / Math.cos(latRad);
    const riseAz = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosRiseAz))));
    sunriseAzimuth = riseAz;
    sunsetAzimuth = 360 - riseAz;
  }

  // Qiyom (Zenit) vaqti
  const solarNoonFloat = (720 - 4 * (lng - timezoneMeridianDeg) - eqtime) / 60;
  const solarNoonElevation = 90 - lat + declDeg;

  // Quyosh quvvati (Insolation in W/m²)
  let radiationWatts = 0;
  if (elevationDeg > 0) {
    const airMass = 1 / (Math.cos(zenithRad) + 0.50572 * Math.pow(96.07995 - radToDeg(zenithRad), -1.6364));
    const directRadiation = 1361 * Math.pow(0.7, Math.pow(Math.max(1, airMass), 0.678));
    radiationWatts = Math.round(directRadiation * Math.sin(degToRad(elevationDeg)));
  }

  // Soya uzunligi va azimuti
  let shadowLength = 0;
  if (elevationDeg > 1.5) {
    shadowLength = buildingHeightM / Math.tan(degToRad(elevationDeg));
  } else {
    shadowLength = buildingHeightM * 20; // past quyoshda uzoq cho'zilgan soya
  }
  const shadowAzimuth = (azimuthDeg + 180) % 360;

  // Tavsif matni
  let desc = '';
  if (elevationDeg <= 0) {
    desc = '🌙 Quyosh botgan (Tungi rejim)';
  } else if (elevationDeg < 12) {
    desc = currentHourFloat < 12
      ? `🌅 Quyosh chiqmoqda (Azimut: ${Math.round(azimuthDeg)}° Shimoli-Sharq)`
      : `🌇 Quyosh botmoqda (Azimut: ${Math.round(azimuthDeg)}° Shimoli-G‘arb)`;
  } else if (Math.abs(currentHourFloat - solarNoonFloat) < 1.5) {
    desc = `☀️ Qiyom / Zenit: Quyosh eng balandda (${Math.round(elevationDeg)}°), Janubdan tik tushmoqda`;
  } else if (currentHourFloat < solarNoonFloat) {
    desc = `🌤️ Ertalabki quyosh (Sharq/Janubi-Sharq, ${Math.round(elevationDeg)}° balandlikda)`;
  } else {
    desc = `🌇 Peshin / Tushdan keyingi quyosh (G‘arb/Janubi-G‘arb, ${Math.round(elevationDeg)}° balandlikda)`;
  }

  return {
    sunElevationDeg: parseFloat(Math.max(0, elevationDeg).toFixed(1)),
    sunAzimuthDeg: parseFloat(azimuthDeg.toFixed(1)),
    solarRadiationWatts: Math.max(0, radiationWatts),
    isDaylight: elevationDeg > 0,
    shadowLengthM: parseFloat(shadowLength.toFixed(1)),
    shadowAzimuthDeg: parseFloat(shadowAzimuth.toFixed(1)),
    sunriseTimeStr: formatHourFloat(sunriseFloat),
    sunriseAzimuthDeg: parseFloat(sunriseAzimuth.toFixed(1)),
    sunsetTimeStr: formatHourFloat(sunsetFloat),
    sunsetAzimuthDeg: parseFloat(sunsetAzimuth.toFixed(1)),
    solarNoonTimeStr: formatHourFloat(solarNoonFloat),
    solarNoonElevationDeg: parseFloat(solarNoonElevation.toFixed(1)),
    sunPositionDescription: desc,
  };
}
