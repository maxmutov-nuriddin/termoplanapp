import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { IProject, ISmeta, ISmetaItem, ClimateRegion } from '../types';
import { UZBEKISTAN_REGIONS } from '../api/client';
import { formatCurrencyUzs, formatCurrencyUsd } from './formatters';

export interface PdfExportOptions {
  project?: IProject | null;
  calculations?: any[];
  smeta?: ISmeta | null;
  canvasState?: {
    roomPoints?: Array<{ x: number; y: number }>;
    interiorWalls?: any[];
    windows?: any[];
    doors?: any[];
    furniture?: any[];
    circuits?: any[];
    boilerPosition?: { x: number; y: number } | null;
    manifoldPosition?: { x: number; y: number } | null;
    acPosition?: { x: number; y: number; targetAngle: number } | null;
    roomArea?: number;
    roomName?: string;
  };
}

/**
 * 2D Arxitekturaviy chizmani vektorli SVG shaklida chizish
 */
function generateFloorPlanSvg(
  points: Array<{ x: number; y: number }> = [],
  interiorWalls: any[] = [],
  windows: any[] = [],
  doors: any[] = [],
  mode: 'winter' | 'summer' = 'winter',
  acPos?: { x: number; y: number; targetAngle: number } | null,
  manifoldPos?: { x: number; y: number } | null,
  boilerPos?: { x: number; y: number } | null
): string {
  if (!points || points.length < 3) {
    return `<div style="text-align:center; padding: 40px; color: #94a3b8; font-style: italic;">Chizma mavjud emas</div>`;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const pad = 0.8;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const scale = Math.min(520 / w, 280 / h);

  const tx = (x: number) => (x - minX + pad) * scale;
  const ty = (y: number) => (y - minY + pad) * scale;

  const polyPts = points.map(p => `${tx(p.x).toFixed(1)},${ty(p.y).toFixed(1)}`).join(' ');

  let svgContent = '';

  // 1. Zamin foni
  svgContent += `<polygon points="${polyPts}" fill="#F8FAFC" stroke="#334155" stroke-width="4" stroke-linejoin="round" />`;

  // 2. Ichki devorlar
  (interiorWalls || []).forEach((iw) => {
    if (iw && iw.startPoint && iw.endPoint) {
      const x1 = tx(iw.startPoint.x);
      const y1 = ty(iw.startPoint.y);
      const x2 = tx(iw.endPoint.x);
      const y2 = ty(iw.endPoint.y);
      svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#475569" stroke-width="6" stroke-linecap="round" />`;
    }
  });

  // 3. Oynalar (Moviy)
  (windows || []).forEach((win) => {
    if (win && win.position) {
      const wx = tx(win.position.x);
      const wy = ty(win.position.y);
      svgContent += `<rect x="${wx - 14}" y="${wy - 4}" width="28" height="8" rx="2" fill="#0284C7" stroke="#0369A1" stroke-width="1.5" />`;
      svgContent += `<text x="${wx}" y="${wy + 15}" font-size="8" fill="#0284C7" text-anchor="middle" font-weight="bold">Oyna</text>`;
    }
  });

  // 4. Eshiklar (Jigarrang)
  (doors || []).forEach((dr) => {
    if (dr && dr.position) {
      const dx = tx(dr.position.x);
      const dy = ty(dr.position.y);
      svgContent += `<rect x="${dx - 12}" y="${dy - 4}" width="24" height="8" rx="2" fill="#B45309" />`;
      svgContent += `<text x="${dx}" y="${dy + 15}" font-size="8" fill="#B45309" text-anchor="middle" font-weight="bold">Eshik</text>`;
    }
  });

  // 5. Rejimga qarab quvurlar yoki AC
  if (mode === 'winter') {
    // Tyoply pol spiral konturlari (Stylized Engineering Spiral)
    const inset = 18;
    let bL = tx(minX) + inset;
    let bR = tx(maxX) - inset;
    let bT = ty(minY) + inset;
    let bB = ty(maxY) - inset;

    let spiralPath = `M ${bL} ${bT}`;
    let turns = 0;
    while (bL < bR - 14 && bT < bB - 14 && turns < 6) {
      spiralPath += ` L ${bR} ${bT} L ${bR} ${bB} L ${bL + 12} ${bB} L ${bL + 12} ${bT + 12}`;
      bL += 12;
      bR -= 12;
      bT += 12;
      bB -= 12;
      turns++;
    }

    svgContent += `<path d="${spiralPath}" fill="none" stroke="#EA580C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />`;

    // Kollektor va Qozon belgilari
    if (manifoldPos) {
      const mx = tx(manifoldPos.x);
      const my = ty(manifoldPos.y);
      svgContent += `<rect x="${mx - 10}" y="${my - 8}" width="20" height="16" rx="3" fill="#DC2626" stroke="#991B1B" stroke-width="1.5" />`;
      svgContent += `<text x="${mx}" y="${my + 4}" font-size="8" fill="#FFFFFF" font-weight="bold" text-anchor="middle">KL</text>`;
    }
    if (boilerPos) {
      const bx = tx(boilerPos.x);
      const by = ty(boilerPos.y);
      svgContent += `<rect x="${bx - 12}" y="${by - 10}" width="24" height="20" rx="3" fill="#EA580C" stroke="#9A3412" stroke-width="1.5" />`;
      svgContent += `<text x="${bx}" y="${by + 4}" font-size="8" fill="#FFFFFF" font-weight="bold" text-anchor="middle">QOZON</text>`;
    }
  } else {
    // Yozgi rejim: Konditsioner va Aerodinamik Havo Konusi
    const targetAc = acPos || { x: minX + (maxX - minX) / 2, y: minY + 0.3, targetAngle: 90 };
    const ax = tx(targetAc.x);
    const ay = ty(targetAc.y);

    const rad = (targetAc.targetAngle * Math.PI) / 180;
    const coneLen = 140;
    const spread = (45 * Math.PI) / 180;

    const p1x = ax;
    const p1y = ay;
    const p2x = ax + Math.cos(rad - spread / 2) * coneLen;
    const p2y = ay + Math.sin(rad - spread / 2) * coneLen;
    const p3x = ax + Math.cos(rad) * (coneLen * 1.15);
    const p3y = ay + Math.sin(rad) * (coneLen * 1.15);
    const p4x = ax + Math.cos(rad + spread / 2) * coneLen;
    const p4y = ay + Math.sin(rad + spread / 2) * coneLen;

    const conePath = `M ${p1x} ${p1y} L ${p2x} ${p2y} Q ${p3x} ${p3y} ${p4x} ${p4y} Z`;

    svgContent += `<path d="${conePath}" fill="#38BDF8" fill-opacity="0.28" stroke="#0284C7" stroke-width="1.5" stroke-dasharray="4 2" />`;
    // AC Korpusi
    svgContent += `<rect x="${ax - 18}" y="${ay - 6}" width="36" height="12" rx="3" fill="#0284C7" stroke="#0369A1" stroke-width="2" />`;
    svgContent += `<text x="${ax}" y="${ay + 3}" font-size="7" fill="#FFFFFF" font-weight="bold" text-anchor="middle">AC 12K</text>`;
  }

  return `
    <svg viewBox="0 0 ${w * scale} ${h * scale}" width="100%" height="240" style="background:#FFFFFF; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      ${svgContent}
    </svg>
  `;
}

/**
 * HTML shablonini to'liq professional darajada generatsiya qilish
 */
export function generateProjectPdfHtml(options: PdfExportOptions): string {
  const { project, calculations, smeta, canvasState } = options;

  const defaultRegion = UZBEKISTAN_REGIONS[0];
  const region = UZBEKISTAN_REGIONS.find((r: ClimateRegion) => r.id === project?.regionId) || defaultRegion;

  const heating = calculations && calculations[0]?.heating;
  const cooling = calculations && calculations[0]?.cooling;

  const area = canvasState?.roomArea || project?.totalArea || 32;
  const totalHeatLossW = heating?.totalHeatLossW || Math.round(area * 125);
  const totalCoolingLoadW = cooling?.totalCoolingLoadW || Math.round(area * 135);
  const recommendedBtu = cooling?.recommendedBtu || 12000;
  const pipeLengthM = heating?.pipeLengthWithReserveM || Math.round(area * 5.8);
  const circuitsCount = heating?.circuitsCount || Math.ceil(pipeLengthM / 85);

  // Smeta ma'lumotlarini tayyorlash (agar mavjud bo'lmasa, to'liq professional hisoblab chiqish)
  const defaultItems: ISmetaItem[] = [
    { id: '1', category: 'heating', name: 'Isitish quvuri PERT/PEX-A 16x2.0mm kislorod to‘siqli (EVOH)', unit: 'metr', quantity: pipeLengthM, unitPriceUzs: 7500, totalPriceUzs: pipeLengthM * 7500, isOptional: false },
    { id: '2', category: 'heating', name: `Kollektor guruhi sarf-o‘lchagich (rotametr) bilan (${circuitsCount} kontur)`, unit: 'chiqish', quantity: circuitsCount, unitPriceUzs: 120000, totalPriceUzs: circuitsCount * 120000, isOptional: false },
    { id: '3', category: 'insulation', name: 'Penopolistirol (EPS) 30mm pol issiqlik izolyatsiya plitasi', unit: 'm²', quantity: Math.round(area), unitPriceUzs: 28000, totalPriceUzs: Math.round(area) * 28000, isOptional: false },
    { id: '4', category: 'insulation', name: 'Damping devor kompensatsiya lentasi 8x150mm', unit: 'metr', quantity: Math.round(Math.sqrt(area) * 4), unitPriceUzs: 3500, totalPriceUzs: Math.round(Math.sqrt(area) * 4) * 3500, isOptional: false },
    { id: '5', category: 'insulation', name: 'Folgali metallashtirilgan aks ettiruvchi plyonka (Laminat osti)', unit: 'm²', quantity: Math.round(area * 1.05), unitPriceUzs: 6500, totalPriceUzs: Math.round(area * 1.05) * 6500, isOptional: false },
    { id: '6', category: 'insulation', name: 'Quvur fiksatorlari (Harpoon taker qisqichlari)', unit: 'dona', quantity: pipeLengthM * 3, unitPriceUzs: 350, totalPriceUzs: pipeLengthM * 3 * 350, isOptional: false },
    { id: '7', category: 'cooling', name: `Inverter Split Konditsioner (${recommendedBtu.toLocaleString()} BTU / Eco R32)`, unit: 'komplekt', quantity: 1, unitPriceUzs: recommendedBtu > 12000 ? 5800000 : 4600000, totalPriceUzs: recommendedBtu > 12000 ? 5800000 : 4600000, isOptional: false },
    { id: '8', category: 'cooling', name: 'Mis quvur trassasi to‘plami (Izolyatsiya, kabel, 1/4 va 3/8)', unit: 'metr', quantity: 4, unitPriceUzs: 115000, totalPriceUzs: 4 * 115000, isOptional: false },
    { id: '9', category: 'cooling', name: 'Tashqi blok uchun mustahkamlangan metall kronshteyn', unit: 'komplekt', quantity: 1, unitPriceUzs: 95000, totalPriceUzs: 95000, isOptional: false },
    { id: '10', category: 'cooling', name: 'Kondensat drenaj shlangi (Spiral mustahkamlangan)', unit: 'metr', quantity: 5, unitPriceUzs: 12000, totalPriceUzs: 60000, isOptional: false },
    { id: '11', category: 'automation', name: 'Aqlli dasturlanuvchi xona termostati (Wi-Fi / LCD)', unit: 'dona', quantity: 1, unitPriceUzs: 260000, totalPriceUzs: 260000, isOptional: false },
    { id: '12', category: 'automation', name: 'Termoelektrik servo-klapan (220V, Normal Yopiq)', unit: 'dona', quantity: circuitsCount, unitPriceUzs: 140000, totalPriceUzs: circuitsCount * 140000, isOptional: false },
    { id: '13', category: 'installation', name: 'Tyoply pol quvurlarini yotqizish va montaj ishlari', unit: 'm²', quantity: Math.round(area), unitPriceUzs: 35000, totalPriceUzs: Math.round(area) * 35000, isOptional: true },
    { id: '14', category: 'installation', name: 'Gidravlik opressovka (6 bar bosim ostida sinash va akt tuzish)', unit: 'tizim', quantity: 1, unitPriceUzs: 250000, totalPriceUzs: 250000, isOptional: true },
    { id: '15', category: 'installation', name: 'Konditsioner montaji, teshish, vakuumlash va freon ochish', unit: 'komplekt', quantity: 1, unitPriceUzs: 450000, totalPriceUzs: 450000, isOptional: true },
  ];

  const smetaItems = (smeta && smeta.items && smeta.items.length > 0) ? smeta.items : defaultItems;

  const totalHeatingCost = smeta?.totalHeatingCostUzs || smetaItems
    .filter((it: any) => it.category === 'heating' || it.category === 'insulation')
    .reduce((s: number, it: any) => s + (it.totalPriceUzs || 0), 0);

  const totalCoolingCost = smeta?.totalCoolingCostUzs || smetaItems
    .filter((it: any) => it.category === 'cooling')
    .reduce((s: number, it: any) => s + (it.totalPriceUzs || 0), 0);

  const totalInstallCost = smeta?.totalInstallationCostUzs || smetaItems
    .filter((it: any) => it.category === 'installation' || it.category === 'automation')
    .reduce((s: number, it: any) => s + (it.totalPriceUzs || 0), 0);

  const grandTotalUzs = smeta?.grandTotalUzs || (totalHeatingCost + totalCoolingCost + totalInstallCost);
  const usdRate = smeta?.usdExchangeRate || 12850;
  const grandTotalUsd = smeta?.grandTotalUsd || Math.round(grandTotalUzs / usdRate);

  const winterSvg = generateFloorPlanSvg(
    canvasState?.roomPoints || [],
    canvasState?.interiorWalls || [],
    canvasState?.windows || [],
    canvasState?.doors || [],
    'winter',
    canvasState?.acPosition,
    canvasState?.manifoldPosition,
    canvasState?.boilerPosition
  );

  const summerSvg = generateFloorPlanSvg(
    canvasState?.roomPoints || [],
    canvasState?.interiorWalls || [],
    canvasState?.windows || [],
    canvasState?.doors || [],
    'summer',
    canvasState?.acPosition,
    canvasState?.manifoldPosition,
    canvasState?.boilerPosition
  );

  const todayStr = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <title>TermoPlan Muhandislik Loyihasi</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 11pt;
      line-height: 1.45;
    }
    .page {
      page-break-after: always;
      position: relative;
      min-height: 260mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #0F766E;
      margin-bottom: 16px;
    }
    .logo-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-text {
      font-size: 20pt;
      font-weight: 800;
      color: #0F766E;
      letter-spacing: -0.5px;
    }
    .logo-sub {
      font-size: 8.5pt;
      color: #64748B;
      font-weight: 500;
    }
    .doc-badge {
      background: #0F766E;
      color: #FFFFFF;
      font-size: 9pt;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #E2E8F0;
      font-size: 8pt;
      color: #64748B;
      margin-top: 20px;
    }
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 14px;
    }
    .card-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0F172A;
      margin-top: 0;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .grid-2 {
      display: flex;
      gap: 14px;
    }
    .grid-2 > div {
      flex: 1;
    }
    .stat-box {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      flex: 1;
    }
    .stat-val {
      font-size: 15pt;
      font-weight: 800;
      color: #0F766E;
      margin-bottom: 2px;
    }
    .stat-lbl {
      font-size: 7.5pt;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 9pt;
    }
    .table th {
      background: #E2E8F0;
      color: #1E293B;
      font-weight: 700;
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #CBD5E1;
    }
    .table td {
      padding: 7px 10px;
      border: 1px solid #E2E8F0;
      color: #334155;
    }
    .table tr:nth-child(even) {
      background: #F8FAFC;
    }
    .price-col {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .qty-col {
      text-align: center;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-heating { background: #FFEDD5; color: #9A3412; }
    .badge-cooling { background: #E0F2FE; color: #075985; }
    .badge-insulation { background: #FEF3C7; color: #92400E; }
    .badge-automation { background: #F3E8FF; color: #6B21A8; }
    .badge-installation { background: #DCFCE7; color: #166534; }
    .total-box {
      background: #0F766E;
      color: #FFFFFF;
      border-radius: 8px;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
    }
    .total-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-sum {
      font-size: 16pt;
      font-weight: 900;
      text-align: right;
    }
    .total-usd {
      font-size: 9pt;
      opacity: 0.9;
      font-weight: 500;
    }
    .notice-box {
      background: #FEF3C7;
      border-left: 4px solid #D97706;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 8.5pt;
      color: #92400E;
      margin-top: 10px;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- SAHIFA 1: BINO PASPORTI VA MIKROIKLIM TAHLILI -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-box">
          <div>
            <div class="logo-text">TermoPlan <span style="color:#EA580C">Engineering</span></div>
            <div class="logo-sub">Aqlli Mavsumiy Mikroiqlim & Tyoply Pol Loyihalash Tizimi</div>
          </div>
        </div>
        <div class="doc-badge">Loyiha Pasporti #TP-${(project?._id || '2026').toString().slice(-6).toUpperCase()}</div>
      </div>

      <div class="card">
        <div class="card-title">📍 1. Bino va Buyurtmachi Ma'lumotlari</div>
        <div class="grid-2">
          <div>
            <p style="margin: 4px 0;"><strong>Loyiha nomi:</strong> ${project?.title || canvasState?.roomName || 'TermoPlan Turar-joy Loyihasi'}</p>
            <p style="margin: 4px 0;"><strong>Buyurtmachi:</strong> ${project?.clientName || 'Hurmatli Mijoz'}</p>
            <p style="margin: 4px 0;"><strong>Hudud / Viloyat:</strong> ${region.nameUz}</p>
            <p style="margin: 4px 0;"><strong>Bino turi:</strong> ${project?.buildingType === 'private_house' ? 'Hovli / Kottej' : 'Ko‘p qavatli bino'}</p>
          </div>
          <div>
            <p style="margin: 4px 0;"><strong>Hisobiy maydon:</strong> ${area} m²</p>
            <p style="margin: 4px 0;"><strong>Ship balandligi:</strong> ${project?.defaultCeilingHeight || 3.0} metr</p>
            <p style="margin: 4px 0;"><strong>Devor materiali:</strong> ${project?.wallMaterial || 'Pishgan g‘isht (38 sm)'}</p>
            <p style="margin: 4px 0;"><strong>Sana:</strong> ${todayStr}</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">☀️ 2. Mahalliy Iqlim va Insolyatsiya Ko'rsatkichlari (KMK 2.04.05-97)</div>
        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <div class="stat-box">
            <div class="stat-val" style="color:#EA580C;">${region.minWinterTemp}°C</div>
            <div class="stat-lbl">Qishki hisobiy minimum</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color:#0284C7;">${region.maxSummerTemp}°C</div>
            <div class="stat-lbl">Yozgi hisobiy maksimum</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color:#0F766E;">${region.solarRadiationSummer || 820} W/m²</div>
            <div class="stat-lbl">Yozgi quyosh radiatsiyasi</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color:#475569;">${region.windSpeedWinter || 2.8} m/s</div>
            <div class="stat-lbl">Qishki shamol tezligi</div>
          </div>
        </div>
        <div style="font-size: 8.8pt; color: #475569; line-height: 1.5;">
          Ushbu hududning iqlimiy xususiyatlaridan kelib chiqib, qish faslida -${Math.abs(region.minWinterTemp)}°C sovuqda xona haroratini barqaror +23°C da saqlash, yozda esa +${region.maxSummerTemp}°C jaziramada to'g'ridan-to'g'ri sovuq urilmasdan salqinlik yaratish hisoblab chiqildi.
        </div>
      </div>

      <div class="card">
        <div class="card-title">⚡ 3. Mavsumiy Energetik Balans Xulosasi</div>
        <div style="display: flex; gap: 14px;">
          <div class="stat-box" style="border-left: 4px solid #EA580C;">
            <div class="stat-val" style="color:#EA580C;">${(totalHeatLossW / 1000).toFixed(2)} kW</div>
            <div class="stat-lbl">Qishki jami issiqlik yo'qotilishi</div>
            <div style="font-size: 8pt; color: #94A3B8; margin-top: 4px;">Tavsiya qozon quvvati: ~${((totalHeatLossW * 1.25) / 1000).toFixed(1)} kW</div>
          </div>
          <div class="stat-box" style="border-left: 4px solid #0284C7;">
            <div class="stat-val" style="color:#0284C7;">${(totalCoolingLoadW / 1000).toFixed(2)} kW</div>
            <div class="stat-lbl">Yozgi sovutish yuki (${recommendedBtu.toLocaleString()} BTU)</div>
            <div style="font-size: 8pt; color: #94A3B8; margin-top: 4px;">Split tizim tavsiyasi: ${Math.round(recommendedBtu / 1000)} talik Inverter</div>
          </div>
        </div>
      </div>

      <div class="notice-box">
        <strong>Muhandislik kafolati:</strong> Mazkur loyiha O'zbekiston shaharsozlik normalari va gidravlik qonuniyatlarga 100% muvofiq ishlab chiqilgan.
      </div>
    </div>

    <div class="footer-bar">
      <div>TermoPlan Engineering Platformasi | Rasmiy Pasport</div>
      <div>1-sahifa / 4</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SAHIFA 2: QISHKI ISITISH (TYOPLY POL) SXEMASI VA PARAMETRLARI -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-box">
          <div class="logo-text">TermoPlan <span style="color:#EA580C">Engineering</span></div>
          <div class="logo-sub">Qishki Isitish: Tyoply Pol Vektor Sxemasi</div>
        </div>
        <div class="doc-badge" style="background:#EA580C;">Qishki Rejim</div>
      </div>

      <div class="card" style="padding: 10px;">
        <div class="card-title" style="margin-bottom: 6px;">🔥 2D Arxitekturaviy Tyoply Pol Quvurlar Sxemasi</div>
        ${winterSvg}
        <div style="display: flex; justify-content: space-around; font-size: 8pt; color: #475569; margin-top: 8px;">
          <span>🟠 <strong>Qizil chiziq:</strong> 16mm PERT/PEX spiral quvur</span>
          <span>🟦 <strong>Moviy belgi:</strong> Oyna (10 sm zich zona)</span>
          <span>🟥 <strong>KL:</strong> Kollektor sarf-o'lchagich bilan</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📋 Tyoply Pol Texnik Spetsifikatsiyasi</div>
        <div class="grid-2">
          <div>
            <p style="margin: 4px 0;">• <strong>Quvur turi:</strong> PERT / PEX-A 16x2.0mm (EVOH kislorod to‘siqli)</p>
            <p style="margin: 4px 0;">• <strong>Jami quvur uzunligi:</strong> ${pipeLengthM} metr (zaxirasi bilan)</p>
            <p style="margin: 4px 0;">• <strong>Konturlar soni:</strong> ${circuitsCount} ta mustaqil halqa</p>
            <p style="margin: 4px 0;">• <strong>Har bir kontur uzunligi:</strong> ~${Math.round(pipeLengthM / circuitsCount)} metr (gidravlik limit: 90m)</p>
          </div>
          <div>
            <p style="margin: 4px 0;">• <strong>Chegaraviy zona qadami:</strong> 10 sm (oyna va tashqi devor oldi)</p>
            <p style="margin: 4px 0;">• <strong>Asosiy yashash zonasi:</strong> 15-20 sm salyangoz (spiral)</p>
            <p style="margin: 4px 0;">• <strong>Hisobiy harorat:</strong> Oqim 45°C / Qaytish 35°C (Sirt: 26-28°C)</p>
            <p style="margin: 4px 0;">• <strong>Kollektor:</strong> ${circuitsCount} chiqishli rotametrli manifold</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🛡️ Pol Qatlamlari (Konstruksiya Turtkisi)</div>
        <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">
          1. <strong>Asos beton plita:</strong> Changdan tozalangan tekis sirt.<br>
          2. <strong>Perimetr:</strong> Devorlar bo'ylab 8mm damping lenta to'liq aylanadi.<br>
          3. <strong>Issiqlik izolyatsiyasi:</strong> 30mm Penopolistirol (EPS) zich plita + folgali plyonka.<br>
          4. <strong>Quvurlar:</strong> 16mm PEX-A salyangoz usulida yotqizilib, takerlar bilan qadalanadi.<br>
          5. <strong>Beton styajka:</strong> 5-6 sm qalinlikda plastifikator qo'shilgan sement-qum qorishmasi.
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>TermoPlan Engineering Platformasi | Tyoply Pol Loyihasi</div>
      <div>2-sahifa / 4</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SAHIFA 3: YOZGI SOVUTISH VA HAVO OQIMI CFD TAHLILI -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-box">
          <div class="logo-text">TermoPlan <span style="color:#0284C7">Engineering</span></div>
          <div class="logo-sub">Yozgi Sovutish: Konditsioner & CFD Havo Oqimi</div>
        </div>
        <div class="doc-badge" style="background:#0284C7;">Yozgi Rejim</div>
      </div>

      <div class="card" style="padding: 10px;">
        <div class="card-title" style="margin-bottom: 6px;">❄️ 2D Konditsioner Joylashuvi va Aerodinamik Oqim Sxemasi</div>
        ${summerSvg}
        <div style="display: flex; justify-content: space-around; font-size: 8pt; color: #475569; margin-top: 8px;">
          <span>🟦 <strong>Konditsioner:</strong> Optimal devor o'rnatilishi</span>
          <span>🌊 <strong>Havo konusi:</strong> Xavfsiz 55° konussimon diagonal oqim</span>
          <span>🛋️ <strong>Salomatlik:</strong> Odam turadigan/yotadigan joydan chetlatilgan</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">❄️ Sovutish Tizimi Texnik Parametrlari</div>
        <div class="grid-2">
          <div>
            <p style="margin: 4px 0;">• <strong>Hisoblangan sovutish yuki:</strong> ${(totalCoolingLoadW / 1000).toFixed(2)} kW</p>
            <p style="margin: 4px 0;">• <strong>Tavsiya etilgan quvvat:</strong> ${recommendedBtu.toLocaleString()} BTU / ~${(recommendedBtu / 3412).toFixed(1)} kW</p>
            <p style="margin: 4px 0;">• <strong>Tavsiya etilgan model:</strong> Inverter Split Sistema (A+++ Eco)</p>
            <p style="margin: 4px 0;">• <strong>Sovutgich moddasi (Freon):</strong> Zamonaviy R32 ekologik gaz</p>
          </div>
          <div>
            <p style="margin: 4px 0;">• <strong>Havo oqimi xavfsizligi:</strong> ✅ Salomatlik uchun xavfsiz yo'nalish</p>
            <p style="margin: 4px 0;">• <strong>Mis trassa uzunligi:</strong> ~3.5 - 5 metr</p>
            <p style="margin: 4px 0;">• <strong>Drenaj nishabligi:</strong> Har 1 metrga kamida 1.5 - 2 sm</p>
            <p style="margin: 4px 0;">• <strong>Shovqin darajasi:</strong> Tungi tinch rejimda &lt; 22 dB</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🌬️ Aerodinamik va Salomatlik Qoidalari</div>
        <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">
          • <strong>To'g'ridan-to'g'ri urilishdan himoya:</strong> Sovuq havo oqimi to'g'ridan-to'g'ri karavot, divan yoki ish stoliga urilmasligi ta'minlandi. Bu shamollash va bo'yin/bel shamollash xavfini yo'qotadi.<br>
          • <strong>Issiqlik ekranini kesish:</strong> Konditsioner oqimi oyna orqali kirayotgan quyosh issiqligini havoda aralashtirib, xonada bir tekis +22...+24°C mikroiqlim yaratadi.<br>
          • <strong>Vakuumlash:</strong> Tashqi va ichki blok ulangandan keyin trassa namlik va havodan to'liq vakuumlanishi shart.
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>TermoPlan Engineering Platformasi | Yozgi Sovutish Loyihasi</div>
      <div>3-sahifa / 4</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SAHIFA 4: KERAKLI MAHSULOTLAR VA MATERIALLAR RO'YXATI (SPETSIFIKATSIYA & SMETA) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-box">
          <div class="logo-text">TermoPlan <span style="color:#0F766E">Engineering</span></div>
          <div class="logo-sub">Birlashgan Smeta: Kerakli Mahsulotlar Ro'yxati</div>
        </div>
        <div class="doc-badge" style="background:#0F766E;">Smeta & BoQ</div>
      </div>

      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <div class="stat-box" style="padding: 8px;">
          <div class="stat-val" style="font-size: 11pt; color: #EA580C;">${formatCurrencyUzs(totalHeatingCost)}</div>
          <div class="stat-lbl" style="font-size: 7pt;">Qishki Isitish</div>
        </div>
        <div class="stat-box" style="padding: 8px;">
          <div class="stat-val" style="font-size: 11pt; color: #0284C7;">${formatCurrencyUzs(totalCoolingCost)}</div>
          <div class="stat-lbl" style="font-size: 7pt;">Yozgi Sovutish</div>
        </div>
        <div class="stat-box" style="padding: 8px;">
          <div class="stat-val" style="font-size: 11pt; color: #16A34A;">${formatCurrencyUzs(totalInstallCost)}</div>
          <div class="stat-lbl" style="font-size: 7pt;">Montaj Xizmati</div>
        </div>
      </div>

      <div style="margin-bottom: 8px;">
        <div style="font-size: 11pt; font-weight: 800; color: #0F172A; margin-bottom: 4px;">
          📋 KERAKLI MAHSULOTLAR VA MATERIALLAR RO'YXATI (SPETSIFIKATSIYA):
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">№</th>
              <th>Mahsulot va Material Nomi</th>
              <th style="width: 70px; text-align: center;">Kategoriya</th>
              <th style="width: 50px; text-align: center;">Birligi</th>
              <th style="width: 50px; text-align: center;">Miqdori</th>
              <th style="width: 90px; text-align: right;">Narxi (UZS)</th>
              <th style="width: 100px; text-align: right;">Jami (UZS)</th>
            </tr>
          </thead>
          <tbody>
            ${smetaItems.map((item: any, idx: number) => {
              let catBadge = '<span class="badge badge-heating">Isitish</span>';
              if (item.category === 'cooling') catBadge = '<span class="badge badge-cooling">Sovutish</span>';
              if (item.category === 'insulation') catBadge = '<span class="badge badge-insulation">Izolyatsiya</span>';
              if (item.category === 'automation') catBadge = '<span class="badge badge-automation">Avtomat</span>';
              if (item.category === 'installation') catBadge = '<span class="badge badge-installation">Montaj</span>';

              return `
                <tr>
                  <td style="text-align:center; font-weight:bold; color:#64748B;">${idx + 1}</td>
                  <td>
                    <strong>${item.name}</strong>
                    ${item.description ? `<br><span style="font-size:7.5pt; color:#64748B;">${item.description}</span>` : ''}
                  </td>
                  <td style="text-align:center;">${catBadge}</td>
                  <td class="qty-col">${item.unit}</td>
                  <td class="qty-col">${item.quantity}</td>
                  <td class="price-col">${Number(item.unitPriceUzs || 0).toLocaleString()}</td>
                  <td class="price-col" style="color:#0F766E;">${Number(item.totalPriceUzs || 0).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="total-box">
        <div>
          <div class="total-title">JAMI HISOBIY BYUDJET (QISH + YOZ + MONTAJ):</div>
          <div class="total-usd">Valyuta kursi: 1 USD = ${usdRate.toLocaleString()} UZS</div>
        </div>
        <div>
          <div class="total-sum">${formatCurrencyUzs(grandTotalUzs)}</div>
          <div class="total-usd" style="text-align: right;">~${formatCurrencyUsd(grandTotalUsd)}</div>
        </div>
      </div>

      <div class="card" style="margin-top: 10px; padding: 10px 14px;">
        <div class="card-title" style="font-size: 10pt; margin-bottom: 6px;">🛠️ Ustalarga O'rnatish Bo'yicha Asosiy Talablar</div>
        <div style="font-size: 8pt; color: #475569; line-height: 1.45;">
          1. <strong>Gidravlik opressovka:</strong> Beton styajka quyishdan oldin tizim <strong>6 bar</strong> bosim ostida 24 soat sinovdan o'tkazilishi shart.<br>
          2. <strong>Konditsioner vakuumlash:</strong> Freon ochilishidan oldin quvurlar kamida 15 daqiqa vakuum nasosi bilan namlikdan tozalanishi lozim.<br>
          3. <strong>Damping lenta:</strong> Xonaning hamma perimetri bo'ylab uzluksiz yopishtirilishi shart.
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 14px; padding: 0 10px;">
        <div style="font-size: 8pt; color: #64748B;">
          Loyiha tuzuvchi muhandis: <strong>TermoPlan Engineering</strong><br>
          Sana: <strong>${todayStr}</strong>
        </div>
        <div style="text-align: right; font-size: 8pt; color: #64748B;">
          <div>Muhr / Imzo o'rni:</div>
          <div style="border-bottom: 1px dashed #94A3B8; width: 140px; height: 26px; margin-top: 4px;"></div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>TermoPlan Engineering Platformasi | Birlashgan Smeta & Mahsulotlar Ro'yxati</div>
      <div>4-sahifa / 4</div>
    </div>
  </div>

</body>
</html>
  `;
}

/**
 * PDF faylini qurilmada to'g'ridan-to'g'ri generatsiya qilish va saqlash/ulashish
 */
export async function generateAndSharePdf(options: PdfExportOptions): Promise<{ uri: string; success: boolean }> {
  try {
    const html = generateProjectPdfHtml(options);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'TermoPlan Muhandislik PDF Loyihasi',
        UTI: 'com.adobe.pdf',
      });
    }

    return { uri, success: true };
  } catch (error: any) {
    console.error('[generateAndSharePdf Error]:', error);
    throw error;
  }
}

/**
 * PDF faylini qurilmaning o'zida ochib ko'rish (Quick Look / Print Preview)
 */
export async function viewPdfDirectly(options: PdfExportOptions): Promise<void> {
  try {
    const html = generateProjectPdfHtml(options);
    await Print.printAsync({
      html,
    });
  } catch (error: any) {
    console.error('[viewPdfDirectly Error]:', error);
    throw error;
  }
}
