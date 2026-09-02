import { IPoint, IWall, IWindow, IInteriorWall, HeatingPatternType } from '../types';
import { calculatePolygonArea } from './geometry';

export interface HeatingPatternOption {
  id: HeatingPatternType;
  name: string;
  subtitle: string;
  iconName: string;
  badgeEmoji: string;
  isRecommended: boolean;
  score: number;
  recommendationReason: string;
  characteristics: {
    uniformity: string;
    hydraulicLoss: string;
    pipeStepCm: number;
    bestFor: string;
  };
  advantages: string[];
}

export interface RoomAnalysisResult {
  recommendedPattern: HeatingPatternType;
  options: HeatingPatternOption[];
  summary: {
    roomTypeLabel: string;
    areaM2: number;
    aspectRatio: number;
    hasLargeWindows: boolean;
    exteriorWallCount: number;
    isNorthFacing: boolean;
  };
}

/**
 * Xona arxitekturasi va issiqlik parametrlarini to'liq analiz qilib,
 * eng optimal Tyopliy Pol yotqizish sxemasini aniqlash.
 */
export function analyzeRoomHeatingPattern(
  roomPoints: IPoint[],
  walls: IWall[] = [],
  windows: IWindow[] = [],
  interiorWalls: IInteriorWall[] = [],
  roomType: string = 'living_room',
  compassNorthAngle: number = 0
): RoomAnalysisResult {
  const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  const areaM2 = valid.length >= 3 ? calculatePolygonArea(valid) : 20;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  valid.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);
  const aspectRatio = parseFloat((maxDim / minDim).toFixed(2));

  // Tashqi devorlar va katta derazalar hisobi
  const exteriorWallCount = walls.filter((w) => w.isExternal).length || 2;
  const totalWindowWidth = (windows || []).reduce((sum, w) => sum + (w.width || 1.4), 0);
  const hasLargeWindows = totalWindowWidth >= 2.5 || (windows && windows.length >= 2);
  const isNorthFacing = compassNorthAngle >= 315 || compassNorthAngle <= 45;
  const isNarrowRoom = aspectRatio >= 2.2 || roomType === 'corridor' || roomType === 'hall';

  // Ballar hisoblash (0-100)
  let spiralScore = 80;
  let doubleSnakeScore = 70;
  let singleSnakeScore = 55;
  let borderZoneScore = 65;

  if (roomType === 'living_room' || roomType === 'bedroom' || roomType === 'children_room') {
    spiralScore += 18;
  }
  if (isNarrowRoom) {
    singleSnakeScore += 35;
    doubleSnakeScore += 15;
    spiralScore -= 20;
  }
  if (hasLargeWindows || (exteriorWallCount >= 2 && isNorthFacing)) {
    borderZoneScore += 30;
    spiralScore += 5;
  }
  if (aspectRatio >= 1.5 && aspectRatio < 2.2) {
    doubleSnakeScore += 15;
  }

  // G'olib sxemani aniqlash
  const scores: Record<HeatingPatternType, number> = {
    spiral: spiralScore,
    border_zone: borderZoneScore,
    double_snake: doubleSnakeScore,
    single_snake: singleSnakeScore,
  };

  const patternKeys: HeatingPatternType[] = ['spiral', 'border_zone', 'double_snake', 'single_snake'];
  let recommendedPattern: HeatingPatternType = 'spiral';
  let maxScore = -1;

  for (const key of patternKeys) {
    if (scores[key] > maxScore) {
      maxScore = scores[key];
      recommendedPattern = key;
    }
  }

  const options: HeatingPatternOption[] = [
    {
      id: 'spiral',
      name: 'Chig‘anoq (Ulitka / Spiral)',
      subtitle: 'Standart zamonaviy yechim',
      iconName: 'rotate-cw',
      badgeEmoji: '🌀',
      isRecommended: recommendedPattern === 'spiral',
      score: spiralScore,
      recommendationReason:
        'Issiq va sovuq suv quvurlari yonma-yon aylanadi. Butun xona polida bir xil qulay harorat ta’minlaydi va 90° silliq burilishlar tufayli nasosga qarshilik minimal bo‘ladi.',
      characteristics: {
        uniformity: 'A’lo (±1°C)',
        hydraulicLoss: 'Past (Optimal)',
        pipeStepCm: 15,
        bestFor: 'Mehmonxona, Yotoqxona, Katta xonalar',
      },
      advantages: [
        'Pol bo‘ylab haroratning bir tekis taqsimlanishi',
        'Gidravlik qarshilik 30% past (nasos yengil ishlaydi)',
        'Quvurning egilish burchaklari silliq (90°)',
      ],
    },
    {
      id: 'border_zone',
      name: 'Chekka Zona Bilan (Kombinatsiyalangan)',
      subtitle: 'Katta derazalar va sovuq devorlar uchun',
      iconName: 'layout-grid',
      badgeEmoji: '🧊',
      isRecommended: recommendedPattern === 'border_zone',
      score: borderZoneScore,
      recommendationReason:
        'Tashqi sovuq devor va vitraj oynalar oldida quvurlar zichroq (10-12 sm) yotqizilib, xona ichkarisida 20 sm ga kengaytiriladi. Derazadan keladigan sovuq havo oqimini to‘sib beradi.',
      characteristics: {
        uniformity: 'Zonaviy (Deraza oldi issiqroq)',
        hydraulicLoss: 'O‘rtacha',
        pipeStepCm: 12,
        bestFor: 'Vitraj oyna, 2 ta tashqi devorli xonalar',
      },
      advantages: [
        'Deraza va tashqi devor yaqinida sovuq oqimni to‘liq yo‘qotadi',
        'Maksimal issiqlik quvvati beradi',
        'Energiya tejamkorligi yuqori',
      ],
    },
    {
      id: 'double_snake',
      name: 'Qo‘shaloq Ilonizi (Dvoynaya Zmeyka)',
      subtitle: 'To‘g‘ri to‘rtburchak xonalar uchun',
      iconName: 'activity',
      badgeEmoji: '〰️',
      isRecommended: recommendedPattern === 'double_snake',
      score: doubleSnakeScore,
      recommendationReason:
        'Ikki parallel quvur (uzatish va qaytish) yonma-yon o‘tadi. Oddiy iloniziga nisbatan ancha bir xil isitadi va to‘rtburchak shaklli xonalar uchun qulay.',
      characteristics: {
        uniformity: 'Yaxshi (±2°C)',
        hydraulicLoss: 'O‘rtacha',
        pipeStepCm: 15,
        bestFor: 'To‘g‘ri burchakli va o‘rtacha xonalar',
      },
      advantages: [
        'Parallel qarama-qarshi oqim haroratni muvozanatlashtiradi',
        'Montaj qilish va o‘lchash oson',
        'To‘rtburchak xonalar geometriyasiga juda mos',
      ],
    },
    {
      id: 'single_snake',
      name: 'Oddiy Ilonizi (Zmeyka)',
      subtitle: 'Yo‘lak va uzunchoq tor joylar uchun',
      iconName: 'git-commit',
      badgeEmoji: '🐍',
      isRecommended: recommendedPattern === 'single_snake',
      score: singleSnakeScore,
      recommendationReason:
        'Quvur bir chekkadan ikkinchi chekkaga ketma-ket o‘tadi. Boshlanishi eng issiq, oxiri sovuqroq bo‘ladi. Yo‘laklar va tor uzun xonalar uchun eng tez va samarali yechim.',
      characteristics: {
        uniformity: 'Gradatsiyali (Kirish issiq, chiqish iliq)',
        hydraulicLoss: 'Yuqoriroq (180° burilishlar)',
        pipeStepCm: 15,
        bestFor: 'Dalan (Kolidor), Oshxona, Tor xonalar',
      },
      advantages: [
        'Tor va uzun joylarda yotqizish eng oson',
        'Kirish qismini (tashqi eshik oldi) maksimal isitish imkoni',
        'Kam quvur sarfi va tez montaj',
      ],
    },
  ];

  // Saralash: tavsiya etilgan eng birinchi turadi
  options.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));

  const roomTypeNames: Record<string, string> = {
    living_room: 'Mehmonxona (Zal)',
    bedroom: 'Yotoqxona',
    kitchen: 'Oshxona',
    bathroom: 'Hammom / Sanuzel',
    corridor: 'Dalan (Kolidor)',
    children_room: 'Bolalar xonasi',
    hall: 'Xoll / Zal',
  };

  return {
    recommendedPattern,
    options,
    summary: {
      roomTypeLabel: roomTypeNames[roomType] || 'Xona',
      areaM2: parseFloat(areaM2.toFixed(1)),
      aspectRatio,
      hasLargeWindows,
      exteriorWallCount,
      isNorthFacing,
    },
  };
}
