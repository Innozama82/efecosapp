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
  // Additional fields for business users
  businessId?: string;
  permissions?: string[];
  role?: string;
  isActive?: boolean;
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
  // Additional fields for business vehicles
  businessId?: string;
  assignedDriverId?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  // Additional fields for business trips
  businessId?: string;
  purpose?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt?: Date;
}

export interface OBDData {
  timestamp: Date;
  rpm: number;
  speed: number;
  fuelConsumption: number;
  engineLoad: number;
  coolantTemp: number;
  // Additional OBD parameters
  throttlePosition?: number;
  airIntakeTemp?: number;
  fuelPressure?: number;
  engineRunTime?: number;
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
  approvedBy?: string;
  approvedAt?: Date;
  // Additional fields for business fuel logs
  businessId?: string;
  purpose?: string;
  createdAt?: Date;
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
  // Additional station info
  amenities?: string[];
  operatingHours?: {
    open: string;
    close: string;
  };
  contactInfo?: {
    phone?: string;
    website?: string;
  };
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
  // Additional behavior metrics
  totalDistance?: number;
  totalDrivingTime?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  ecoScore?: number;
  safetyScore?: number;
}

// Business-specific types
export interface Business {
  id: string;
  name: string;
  address: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  settings: {
    fuelBudgetPerDriver: number;
    requireApproval: boolean;
    allowedFuelTypes: string[];
  };
  createdAt: Date;
  isActive: boolean;
}

export interface BusinessUser {
  id: string;
  businessId: string;
  email: string;
  role: 'owner' | 'admin' | 'driver';
  permissions: string[];
  monthlyFuelLimit?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Driver {
  id: string;
  businessId: string;
  userId: string;
  licenseNumber: string;
  licenseExpiry: Date;
  assignedVehicles: string[];
  monthlyFuelLimit: number;
  isActive: boolean;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VehicleForm {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  fuelType: Vehicle['fuelType'];
}

export interface TripForm {
  startLocation: string;
  endLocation: string;
  distance: number;
  fuelUsed: number;
  cost: number;
  purpose?: string;
}

export interface FuelLogForm {
  station: string;
  liters: number;
  pricePerLiter: number;
  odometer: number;
  receiptImage?: string;
  location: string;
}