export interface IPoint {
  x: number;
  y: number;
}

export interface IWall {
  id: string;
  startPoint: IPoint;
  endPoint: IPoint;
  isExternal: boolean;
  orientation: string;
  length: number;
  thicknessM?: number;
  materialId?: string;
  materialName?: string;
}

export interface IWindow {
  id: string;
  wallId?: string;
  position: IPoint;
  width: number;
  height: number;
  rotation?: number;
  orientation: string;
  type: 'ordinary' | 'low_e' | 'tinted';
}

export interface IDoor {
  id: string;
  wallId?: string;
  position: IPoint;
  width: number;
  rotation?: number;
  openDirection: string;
}

export interface IFurniture {
  id: string;
  type: 'bed' | 'sofa' | 'desk' | 'dining_table' | 'wardrobe' | 'kitchen_set' | 'tv_unit';
  label?: string;
  position: IPoint;
  width: number;
  height: number;
  rotation: number;
  isHeatingProhibited: boolean;
  isCoolingSensitive: boolean;
}

export interface IWallMaterial {
  id: string;
  name: string;
  category: 'brick' | 'gas_block' | 'drywall' | 'cinder_block' | 'concrete';
  thicknessM: number;
  conductivity: number; // W/(m·K)
}

export interface IInteriorWall {
  id: string;
  startPoint: IPoint;
  endPoint: IPoint;
  length: number;
  thicknessM: number;
  materialId?: string;
  materialName?: string;
}

export interface IRoom {
  _id?: string;
  id?: string;
  projectId?: string;
  name: string;
  roomType: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'hall' | 'office' | 'dining';
  area: number;
  perimeter: number;
  ceilingHeight: number;
  points: IPoint[];
  walls: IWall[];
  interiorWalls?: IInteriorWall[];
  windows: IWindow[];
  doors: IDoor[];
  furniture: IFurniture[];
  manifoldPosition?: IPoint;
  boilerPosition?: IPoint;
  wallThicknessM?: number;
  wallMaterial?: string;
  acPosition?: {
    x: number;
    y: number;
    wallId?: string;
    targetAngle: number;
  };
  outdoorUnitPosition?: IPoint;
  floorCovering: 'tile' | 'laminate' | 'parquet' | 'carpet';
}

export interface IProject {
  _id?: string;
  id?: string;
  title: string;
  clientName?: string;
  clientPhone?: string;
  address?: string;
  regionId: string;
  compassNorthAngle: number;
  buildingType: 'apartment' | 'private_house' | 'office' | 'commercial';
  wallMaterial: 'brick' | 'aerated_concrete' | 'cinder_block' | 'panel' | 'monolith';
  insulationQuality: 'standard' | 'high' | 'poor';
  defaultCeilingHeight: number;
  totalArea?: number;
  status: 'draft' | 'calculated' | 'approved' | 'completed';
  rooms?: IRoom[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IHeatingCalculation {
  totalHeatLossW: number;
  specificHeatLossWM2: number;
  shagZones: Array<{
    zone: string;
    stepCm: number;
    areaM2: number;
    description: string;
  }>;
  pipeLengthM: number;
  pipeLengthWithReserveM: number;
  circuitsCount: number;
  circuits: Array<{
    circuitNumber: number;
    lengthM: number;
    color: string;
    points: IPoint[];
  }>;
  manifoldPorts: number;
  servoActuatorsCount: number;
  boilerPowerKw: number;
  screedRecommendation: 'classic_concrete' | 'dry_lightweight';
  screedDescription: string;
  comfortModeTempC: number;
  insulationAreaM2: number;
  dampingTapeLengthM: number;
  insolation?: any;
}

export interface ICoolingCalculation {
  totalCoolingLoadW: number;
  recommendedBtu: number;
  recommendedKw: number;
  recommendedModel: string;
  optimalAcPosition: {
    x: number;
    y: number;
    wallId?: string;
    targetAngle: number;
  };
  airflowCone: {
    origin: IPoint;
    angle: number;
    spreadDeg: number;
    rangeM: number;
    polygonPoints: IPoint[];
  };
  outdoorUnitPosition: IPoint;
  copperRouteLengthM: number;
  directBlowingAvoided: boolean;
  safetyNotes: string[];
  insolation?: any;
}

export interface ISmetaItem {
  id: string;
  category: 'heating' | 'cooling' | 'insulation' | 'automation' | 'installation';
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPriceUzs: number;
  totalPriceUzs: number;
  isOptional: boolean;
}

export interface ISmeta {
  _id?: string;
  projectId: string;
  items: ISmetaItem[];
  totalHeatingCostUzs: number;
  totalCoolingCostUzs: number;
  totalInstallationCostUzs: number;
  grandTotalUzs: number;
  grandTotalUsd: number;
  usdExchangeRate: number;
  notes: string[];
}

export interface ClimateRegion {
  id: string;
  name: string;
  nameUz: string;
  minWinterTemp: number;
  maxSummerTemp: number;
  avgWinterTemp: number;
  avgSummerTemp: number;
  solarRadiationSummer: number;
  solarRadiationWinter: number;
  windSpeedWinter: number;
  humiditySummer: number;
  latitude: number;
  longitude: number;
}

export type HeatingPatternType = 'spiral' | 'double_snake' | 'single_snake' | 'border_zone';
