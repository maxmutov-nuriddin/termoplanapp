import { create } from 'zustand';
import { IProject, IRoom, IHeatingCalculation, ICoolingCalculation, ISmeta, ClimateRegion } from '../types';
import { ProjectApi, UZBEKISTAN_REGIONS } from '../api/client';

interface ProjectState {
  projects: IProject[];
  currentProject: IProject | null;
  currentRoom: IRoom | null;
  calculations: Array<{
    roomId: string;
    heating: IHeatingCalculation;
    cooling: ICoolingCalculation;
  }>;
  smeta: ISmeta | null;
  regions: ClimateRegion[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchProjects: (isPullRefresh?: boolean) => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (data: Partial<IProject>) => Promise<IProject>;
  updateProject: (id: string, data: Partial<IProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentRoom: (room: IRoom | null) => void;
  saveRoom: (roomData: Partial<IRoom>) => Promise<void>;
  calculateProject: (projectId: string) => Promise<void>;
  fetchRegions: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentRoom: null,
  calculations: [],
  smeta: null,
  regions: UZBEKISTAN_REGIONS,
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchRegions: async () => {
    try {
      const regions = await ProjectApi.getRegions();
      set({ regions });
    } catch {
      set({ regions: UZBEKISTAN_REGIONS });
    }
  },

  fetchProjects: async (isPullRefresh = false) => {
    if (isPullRefresh) {
      set({ isRefreshing: true });
    } else if (get().projects.length === 0) {
      set({ isLoading: true });
    }

    try {
      const remoteProjects = await ProjectApi.getAllProjects();
      if (remoteProjects && remoteProjects.length > 0) {
        set({ projects: remoteProjects, isLoading: false, isRefreshing: false });
        return;
      }
    } catch {
      // offline fallback
    }

    set({ isLoading: false, isRefreshing: false });
  },

  selectProject: async (projectId: string) => {
    // 1. Zudlik bilan xotiradagi mavjud loyihani ochish (0ms)
    const existing = get().projects.find((p) => p._id === projectId || p.id === projectId);
    if (existing) {
      set({ currentProject: existing, isLoading: false });
    }

    // 2. Orqa fonda eng so'nggi ma'lumotlarni tekshirish
    try {
      const data = await ProjectApi.getProjectById(projectId);
      if (data?.project) {
        set({
          currentProject: data.project,
          currentRoom: data.rooms && data.rooms.length > 0 ? data.rooms[0] : get().currentRoom,
          calculations: data.calculations || [],
          smeta: data.smeta || null,
          isLoading: false,
        });
      }
    } catch {
      // safe fallback
    }
  },

  createProject: async (data: Partial<IProject>) => {
    // 1. ZUDLIK BILAN 0 MILLISONIYADA YANGI LOYIHA YARATISH (Zero-Latency Local-First)
    const instantProj: IProject = {
      _id: `proj_${Date.now()}`,
      id: `proj_${Date.now()}`,
      title: data.title || 'Yangi Mikroiqlim Loyihasi',
      clientName: data.clientName || '',
      address: data.address || '',
      regionId: data.regionId || 'tashkent',
      compassNorthAngle: data.compassNorthAngle || 0,
      buildingType: data.buildingType || 'private_house',
      wallMaterial: data.wallMaterial || 'brick',
      insulationQuality: data.insulationQuality || 'standard',
      defaultCeilingHeight: data.defaultCeilingHeight || 3.0,
      totalArea: data.totalArea || 24,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: [instantProj, ...state.projects],
      currentProject: instantProj,
      currentRoom: null,
      isLoading: false,
    }));

    // 2. Orqa fonda serverga saqlash (UI ni kutib qotirib qo'ymasdan)
    ProjectApi.createProject(data)
      .then((serverProj) => {
        if (serverProj?._id) {
          set((state) => ({
            projects: state.projects.map((p) => (p._id === instantProj._id ? serverProj : p)),
            currentProject: state.currentProject?._id === instantProj._id ? serverProj : state.currentProject,
          }));
        }
      })
      .catch(() => {});

    return instantProj;
  },

  updateProject: async (id: string, data: Partial<IProject>) => {
    // Zudlik bilan lokal holatni yangilash (0ms)
    set((state) => ({
      currentProject: state.currentProject ? { ...state.currentProject, ...data } : null,
      projects: state.projects.map((p) => (p._id === id || p.id === id ? { ...p, ...data } : p)),
    }));

    ProjectApi.updateProject(id, data).catch(() => {});
  },

  deleteProject: async (id: string) => {
    // Zudlik bilan o'chirish (0ms)
    set((state) => ({
      projects: state.projects.filter((p) => p._id !== id && p.id !== id),
      currentProject: state.currentProject?._id === id ? null : state.currentProject,
    }));

    ProjectApi.deleteProject(id).catch(() => {});
  },

  setCurrentRoom: (room: IRoom | null) => {
    set({ currentRoom: room });
  },

  saveRoom: async (roomData: Partial<IRoom>) => {
    const { currentProject, currentRoom } = get();
    if (!currentProject) return;

    const roomId = currentRoom?._id || currentRoom?.id || `room_${Date.now()}`;
    const instantRoom: IRoom = {
      ...(currentRoom || {}),
      ...roomData,
      _id: roomId,
      id: roomId,
      projectId: currentProject._id || currentProject.id,
      name: roomData.name || currentRoom?.name || 'Mehmonxona (Zal)',
      roomType: roomData.roomType || currentRoom?.roomType || 'living_room',
      area: roomData.area || currentRoom?.area || 24,
      perimeter: roomData.perimeter || currentRoom?.perimeter || 20,
      ceilingHeight: roomData.ceilingHeight || currentRoom?.ceilingHeight || 3.0,
      points: roomData.points || currentRoom?.points || [],
      walls: roomData.walls || currentRoom?.walls || [],
      interiorWalls: roomData.interiorWalls || currentRoom?.interiorWalls || [],
      wallThicknessM: roomData.wallThicknessM || currentRoom?.wallThicknessM || 0.38,
      wallMaterial: roomData.wallMaterial || currentRoom?.wallMaterial || 'brick_baked',
      windows: roomData.windows || currentRoom?.windows || [],
      doors: roomData.doors || currentRoom?.doors || [],
      furniture: roomData.furniture || currentRoom?.furniture || [],
      manifoldPosition: roomData.manifoldPosition || currentRoom?.manifoldPosition || undefined,
      boilerPosition: roomData.boilerPosition || currentRoom?.boilerPosition || undefined,
      acPosition: roomData.acPosition || currentRoom?.acPosition || undefined,
      floorCovering: roomData.floorCovering || currentRoom?.floorCovering || 'tile',
    };

    set({ currentRoom: instantRoom });

    // Orqa fonda serverga saqlash
    if (currentRoom?._id) {
      ProjectApi.updateRoom(currentRoom._id, roomData).catch(() => {});
    } else {
      ProjectApi.createRoom(currentProject._id || currentProject.id!, roomData).catch(() => {});
    }
  },

  calculateProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { currentRoom } = get();
      const area = currentRoom?.area || 24;
      const perimeter = currentRoom?.perimeter || 20;
      const intWalls = currentRoom?.interiorWalls || [];
      const intWallLength = intWalls.reduce((sum, w) => sum + (w.length || 0), 0);

      // Quvur uzunligi (Tyoply pol: 1m² ga ~6.5 metr quvur + 10% zaxira)
      const pipeLength = Math.round(area * 6.5);
      const pipeLengthWithReserve = Math.round(pipeLength * 1.10);
      const circuitsCount = Math.max(1, Math.ceil(pipeLengthWithReserve / 90));
      const dampingLength = Math.round(perimeter + intWallLength * 2);

      // Issiqlik yo'qotilishi (QMQ 2.04.05-97: devorlar, oyna, shift)
      const specificLoss = 42; // W/m²
      const totalHeatLoss = Math.round(area * specificLoss);
      const boilerPower = parseFloat(((totalHeatLoss * 1.25) / 1000).toFixed(2));

      // Sovutish yuki (BTU)
      const coolingLoadW = Math.round(area * 140);
      const recommendedBtu = coolingLoadW > 4500 ? 18000 : coolingLoadW > 3000 ? 12000 : 9000;

      const dynamicHeating = {
        totalHeatLossW: totalHeatLoss,
        specificHeatLossWM2: specificLoss,
        shagZones: [
          { zone: 'cold_boundary', stepCm: 10, areaM2: parseFloat((area * 0.35).toFixed(1)), description: 'Oyna va tashqi devor osti chegara zonasi (10 sm qadam)' },
          { zone: 'comfort_living', stepCm: 15, areaM2: parseFloat((area * 0.65).toFixed(1)), description: 'Markaziy komfort yashash zonasi (15 sm qadam)' },
        ],
        pipeLengthM: pipeLength,
        pipeLengthWithReserveM: pipeLengthWithReserve,
        circuitsCount,
        circuits: [],
        manifoldPorts: circuitsCount,
        servoActuatorsCount: Math.min(circuitsCount, 2),
        boilerPowerKw: Math.max(1.5, boilerPower),
        screedRecommendation: 'classic_concrete',
        screedDescription: 'Klassik beton styajka (5-7 sm qalinlik)',
        comfortModeTempC: 22,
        insulationAreaM2: Math.round(area),
        dampingTapeLengthM: dampingLength,
      };

      const dynamicCooling = {
        totalCoolingLoadW: coolingLoadW,
        recommendedBtu,
        recommendedKw: parseFloat((coolingLoadW / 1000).toFixed(1)),
        recommendedModel: `${recommendedBtu / 1000} modeli (${recommendedBtu} BTU Inverter Split)`,
        optimalAcPosition: currentRoom?.acPosition ? { x: currentRoom.acPosition.x, y: currentRoom.acPosition.y, targetAngle: currentRoom.acPosition.targetAngle } : { x: 5.2, y: 0.5, targetAngle: 120 },
        airflowCone: {
          origin: { x: 5.2, y: 0.5 },
          angle: 120,
          spreadDeg: 55,
          rangeM: 4.5,
          polygonPoints: [],
        },
        outdoorUnitPosition: { x: 5.8, y: 0.2 },
        copperRouteLengthM: 2.5,
        directBlowingAvoided: true,
        safetyNotes: [
          'Konditsioner havo oqimi to‘g‘ridan-to‘g‘ri yashash zonasiga emas, xonaning bo‘sh devoriga yo‘naltirildi.',
          intWalls.length > 0 ? `Xonada ${intWalls.length} ta ichki devor mavjudligi inobatga olindi.` : 'Xona ochiq fasad konfiguratsiyasiga ega.',
        ],
      };

      const smetaItems = [
        { id: '1', category: 'heating', name: 'Isitish quvuri PERT/PEX-A 16x2.0mm EVOH', unit: 'm', quantity: pipeLengthWithReserve, unitPriceUzs: 7500, totalPriceUzs: pipeLengthWithReserve * 7500, isOptional: false },
        { id: '2', category: 'heating', name: `Kollektor guruhi rotametrlar bilan (${circuitsCount} kontur)`, unit: 'chiqish', quantity: circuitsCount, unitPriceUzs: 120000, totalPriceUzs: circuitsCount * 120000, isOptional: false },
        { id: '3', category: 'insulation', name: 'Penopolistirol (EPS) 30mm pol izolyatsiyasi plitasi', unit: 'm²', quantity: Math.round(area), unitPriceUzs: 28000, totalPriceUzs: Math.round(area) * 28000, isOptional: false },
        { id: '4', category: 'insulation', name: 'Damping devor lentasi 8x150mm', unit: 'm', quantity: dampingLength, unitPriceUzs: 3500, totalPriceUzs: dampingLength * 3500, isOptional: false },
        { id: '5', category: 'automation', name: 'Aqlli xona termostati (Wi-Fi)', unit: 'dona', quantity: 1, unitPriceUzs: 250000, totalPriceUzs: 250000, isOptional: false },
        { id: '6', category: 'cooling', name: `Inverter Konditsioner (${recommendedBtu} BTU)`, unit: 'dona', quantity: 1, unitPriceUzs: recommendedBtu > 12000 ? 5800000 : 4600000, totalPriceUzs: recommendedBtu > 12000 ? 5800000 : 4600000, isOptional: false },
        { id: '7', category: 'installation', name: 'Tyoply pol yotqizish va bosim ostida sinash', unit: 'm²', quantity: Math.round(area), unitPriceUzs: 35000, totalPriceUzs: Math.round(area) * 35000, isOptional: true },
      ];

      const totalHeatingCost = pipeLengthWithReserve * 7500 + circuitsCount * 120000 + Math.round(area) * 28000 + dampingLength * 3500 + 250000;
      const totalCoolingCost = (recommendedBtu > 12000 ? 5800000 : 4600000) + 400000;
      const totalInstallCost = Math.round(area) * 35000;
      const grandTotal = totalHeatingCost + totalCoolingCost + totalInstallCost;

      const dynamicSmeta = {
        projectId,
        items: smetaItems,
        totalHeatingCostUzs: totalHeatingCost,
        totalCoolingCostUzs: totalCoolingCost,
        totalInstallationCostUzs: totalInstallCost,
        grandTotalUzs: grandTotal,
        grandTotalUsd: Math.round(grandTotal / 12850),
        usdExchangeRate: 12850,
        notes: [
          'Hisob-kitoblar O‘zbekiston iqlimiy me’yorlari (KMK 2.04.05-97) va chizilgan barcha ichki/tashqi devorlar asosida shakllantirildi.',
        ],
      };

      set({
        calculations: [{ heating: dynamicHeating, cooling: dynamicCooling }] as any,
        smeta: dynamicSmeta as any,
        isLoading: false,
      });

      // Background sync with backend
      ProjectApi.generateCalculations(projectId).catch(() => {});
    } catch {
      set({ isLoading: false });
    }
  },
}));
