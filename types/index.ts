export interface User {
  id: string;
  name: string;
  email: string;
  type: 'citizen' | 'driver';
  companyId?: string;
  companyName?: string;
  monthlyFuelLimit?: number;
  personalBudget?: number;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  licensePlate: string;
  isActive: boolean;
}

export interface Trip {
  id: string;
  userId: string;
  vehicleId: string;
  startTime: Date;
  endTime?: Date;
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  distance: number; // in km
  fuelUsed: number; // in liters
  avgSpeed: number;
  maxSpeed: number;
  idleTime: number; // in minutes
  cost: number;
  efficiency: number; // km/l
  isManual: boolean;
  obdData?: OBDData[];
}

export interface OBDData {
  timestamp: Date;
  rpm: number;
  speed: number;
  fuelConsumption: number;
  engineLoad: number;
  coolantTemp: number;
}

export interface FuelLog {
  id: string;
  userId: string;
  vehicleId: string;
  date: Date;
  station: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  receiptImage?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface FuelStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  prices: {
    gasoline: number;
    diesel: number;
    premium: number;
  };
  lastUpdated: Date;
}

export interface DrivingBehavior {
  userId: string;
  date: Date;
  aggressiveAcceleration: number;
  hardBraking: number;
  excessiveIdling: number;
  speedingEvents: number;
  fuelEfficiencyScore: number;
  overallScore: number;
}