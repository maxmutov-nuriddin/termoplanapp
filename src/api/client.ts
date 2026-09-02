import axios from 'axios';
import { IProject, IRoom, ClimateRegion } from '../types';
import Constants from 'expo-constants';
import { ROOM_PRESETS } from '../utils/geometry';

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5001/api`;
  }
  return 'http://192.168.0.59:5001/api';
};

export const API_BASE_URL = getBackendUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1200,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const UZBEKISTAN_REGIONS: ClimateRegion[] = [
  { id: 'tashkent', name: 'Tashkent', nameUz: 'Toshkent shahri va viloyati', minWinterTemp: -15, maxSummerTemp: 42, avgWinterTemp: 1.5, avgSummerTemp: 32.5, solarRadiationSummer: 820, solarRadiationWinter: 350, windSpeedWinter: 2.8, humiditySummer: 35, latitude: 41.2995, longitude: 69.2401 },
  { id: 'samarkand', name: 'Samarkand', nameUz: 'Samarqand viloyati', minWinterTemp: -14, maxSummerTemp: 41, avgWinterTemp: 2.0, avgSummerTemp: 31.0, solarRadiationSummer: 840, solarRadiationWinter: 370, windSpeedWinter: 2.5, humiditySummer: 32, latitude: 39.6270, longitude: 66.9749 },
  { id: 'bukhara', name: 'Bukhara', nameUz: 'Buxoro viloyati', minWinterTemp: -16, maxSummerTemp: 45, avgWinterTemp: 1.0, avgSummerTemp: 34.5, solarRadiationSummer: 870, solarRadiationWinter: 380, windSpeedWinter: 3.2, humiditySummer: 25, latitude: 39.7681, longitude: 64.4556 },
  { id: 'fergana', name: 'Fergana', nameUz: "Farg'ona viloyati", minWinterTemp: -12, maxSummerTemp: 40, avgWinterTemp: 2.5, avgSummerTemp: 31.5, solarRadiationSummer: 810, solarRadiationWinter: 340, windSpeedWinter: 2.0, humiditySummer: 38, latitude: 40.3842, longitude: 71.7843 },
  { id: 'andijan', name: 'Andijan', nameUz: 'Andijon viloyati', minWinterTemp: -13, maxSummerTemp: 39, avgWinterTemp: 2.0, avgSummerTemp: 30.5, solarRadiationSummer: 800, solarRadiationWinter: 330, windSpeedWinter: 2.2, humiditySummer: 40, latitude: 40.7821, longitude: 72.3442 },
  { id: 'namangan', name: 'Namangan', nameUz: 'Namangan viloyati', minWinterTemp: -13, maxSummerTemp: 40, avgWinterTemp: 2.0, avgSummerTemp: 31.0, solarRadiationSummer: 815, solarRadiationWinter: 345, windSpeedWinter: 2.3, humiditySummer: 36, latitude: 40.9983, longitude: 71.6726 },
  { id: 'qashqadaryo', name: 'Qashqadaryo', nameUz: 'Qashqadaryo (Qarshi) viloyati', minWinterTemp: -14, maxSummerTemp: 44, avgWinterTemp: 3.0, avgSummerTemp: 34.0, solarRadiationSummer: 880, solarRadiationWinter: 390, windSpeedWinter: 3.0, humiditySummer: 28, latitude: 38.8606, longitude: 65.7891 },
  { id: 'surxondaryo', name: 'Surxondaryo', nameUz: 'Surxondaryo (Termiz) viloyati', minWinterTemp: -10, maxSummerTemp: 46, avgWinterTemp: 4.5, avgSummerTemp: 36.0, solarRadiationSummer: 900, solarRadiationWinter: 410, windSpeedWinter: 2.7, humiditySummer: 24, latitude: 37.2242, longitude: 67.2783 },
  { id: 'xorazm', name: 'Xorazm', nameUz: 'Xorazm (Urganch/Xiva) viloyati', minWinterTemp: -18, maxSummerTemp: 43, avgWinterTemp: -1.0, avgSummerTemp: 33.0, solarRadiationSummer: 850, solarRadiationWinter: 360, windSpeedWinter: 3.5, humiditySummer: 30, latitude: 41.5566, longitude: 60.6310 },
  { id: 'qoraqalpogiston', name: 'Qoraqalpogiston', nameUz: "Qoraqalpog'iston (Nukus)", minWinterTemp: -22, maxSummerTemp: 44, avgWinterTemp: -3.0, avgSummerTemp: 33.5, solarRadiationSummer: 860, solarRadiationWinter: 350, windSpeedWinter: 4.0, humiditySummer: 27, latitude: 42.4602, longitude: 59.6166 },
  { id: 'navoiy', name: 'Navoiy', nameUz: 'Navoiy viloyati', minWinterTemp: -16, maxSummerTemp: 44, avgWinterTemp: 1.5, avgSummerTemp: 33.5, solarRadiationSummer: 875, solarRadiationWinter: 385, windSpeedWinter: 3.4, humiditySummer: 26, latitude: 40.0844, longitude: 65.3792 },
  { id: 'jizzax', name: 'Jizzax', nameUz: 'Jizzax viloyati', minWinterTemp: -15, maxSummerTemp: 42, avgWinterTemp: 1.8, avgSummerTemp: 32.0, solarRadiationSummer: 835, solarRadiationWinter: 365, windSpeedWinter: 3.1, humiditySummer: 31, latitude: 40.1158, longitude: 67.8422 },
  { id: 'sirdaryo', name: 'Sirdaryo', nameUz: 'Sirdaryo (Guliston) viloyati', minWinterTemp: -15, maxSummerTemp: 42, avgWinterTemp: 1.6, avgSummerTemp: 32.5, solarRadiationSummer: 830, solarRadiationWinter: 360, windSpeedWinter: 3.3, humiditySummer: 34, latitude: 40.4897, longitude: 68.7844 },
];

export const ProjectApi = {
  getRegions: async (): Promise<ClimateRegion[]> => {
    try {
      const res = await api.get('/projects/regions/climate');
      return res.data.regions || UZBEKISTAN_REGIONS;
    } catch {
      return UZBEKISTAN_REGIONS;
    }
  },

  getAllProjects: async (): Promise<IProject[]> => {
    try {
      const res = await api.get('/projects');
      return res.data?.projects || [];
    } catch {
      return [];
    }
  },

  getProjectById: async (id: string): Promise<{ project: IProject; rooms: IRoom[]; calculations: any[]; smeta: any }> => {
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data?.project) return res.data;
    } catch {
      // offline
    }
    const defaultProj: IProject = {
      _id: id,
      title: 'TermoPlan Loyihasi',
      regionId: 'tashkent',
      compassNorthAngle: 0,
      buildingType: 'private_house',
      wallMaterial: 'brick',
      insulationQuality: 'standard',
      defaultCeilingHeight: 3.0,
      totalArea: 24,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    return {
      project: defaultProj,
      rooms: [],
      calculations: [],
      smeta: null,
    };
  },

  createProject: async (projectData: Partial<IProject>): Promise<IProject> => {
    try {
      const res = await api.post('/projects', projectData);
      if (res.data?.project) return res.data.project;
    } catch {
      // offline
    }
    return {
      _id: `proj_${Date.now()}`,
      title: projectData.title || 'Yangi Mikroiqlim Loyihasi',
      clientName: projectData.clientName,
      address: projectData.address,
      regionId: projectData.regionId || 'tashkent',
      compassNorthAngle: projectData.compassNorthAngle || 0,
      buildingType: projectData.buildingType || 'private_house',
      wallMaterial: projectData.wallMaterial || 'brick',
      insulationQuality: projectData.insulationQuality || 'standard',
      defaultCeilingHeight: projectData.defaultCeilingHeight || 3.0,
      totalArea: 24,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  },

  updateProject: async (id: string, projectData: Partial<IProject>): Promise<IProject> => {
    try {
      const res = await api.put(`/projects/${id}`, projectData);
      if (res.data?.project) return res.data.project;
    } catch {
      // offline
    }
    return {
      _id: id,
      title: projectData.title || 'Mikroiqlim Loyihasi',
      ...projectData,
    } as IProject;
  },

  deleteProject: async (id: string): Promise<void> => {
    try {
      await api.delete(`/projects/${id}`);
    } catch {
      // offline
    }
  },

  createRoom: async (projectId: string, roomData: Partial<IRoom>): Promise<IRoom> => {
    try {
      const res = await api.post(`/projects/${projectId}/rooms`, roomData);
      if (res.data?.room) return res.data.room;
    } catch {
      // offline
    }
    return {
      _id: `room_${Date.now()}`,
      projectId,
      name: roomData.name || 'Xona',
      roomType: roomData.roomType || 'living_room',
      floorCovering: roomData.floorCovering || 'laminate',
      area: roomData.area || 24,
      perimeter: roomData.perimeter || 20,
      ceilingHeight: roomData.ceilingHeight || 3.0,
      points: roomData.points || ROOM_PRESETS.RECTANGLE(6.0, 4.0),
      walls: roomData.walls || [],
      windows: roomData.windows || [],
      doors: roomData.doors || [],
      furniture: roomData.furniture || [],
      manifoldPosition: roomData.manifoldPosition || { x: 0.8, y: 0.8 },
      acPosition: roomData.acPosition || { x: 1.2, y: 0.5, targetAngle: 75 },
    };
  },

  updateRoom: async (roomId: string, roomData: Partial<IRoom>): Promise<IRoom> => {
    try {
      const res = await api.put(`/projects/rooms/${roomId}`, roomData);
      if (res.data?.room) return res.data.room;
    } catch {
      // offline
    }
    return {
      _id: roomId,
      ...roomData,
    } as IRoom;
  },

  generateCalculations: async (projectId: string) => {
    try {
      const res = await api.post(`/calculations/project/${projectId}/generate`);
      if (res.data?.data) return res.data.data;
    } catch {
      // offline
    }
    return {
      project: { _id: projectId, status: 'calculated' },
      roomsCalculations: [],
      smeta: null,
    };
  },

  getSmeta: async (projectId: string): Promise<any> => {
    try {
      const res = await api.get(`/smeta/project/${projectId}`);
      if (res.data?.smeta) return res.data.smeta;
    } catch {
      // offline
    }
    return null;
  },

  getPdfDownloadUrl: (projectId: string): string => {
    return `${API_BASE_URL}/pdf/project/${projectId}/export`;
  },
};
