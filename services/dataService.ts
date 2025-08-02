import { Trip, FuelLog, FuelStation, DrivingBehavior, Vehicle } from '@/types';
import { db } from '@/services/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export class DataService {
  // --- Vehicles ---
  async getVehicles(userId: string): Promise<Vehicle[]> {
    if (!userId) {
      console.warn('getVehicles called with undefined userId');
      return [];
    }
    
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Vehicle[];
  }

  async addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const vehiclesRef = collection(db, 'vehicles');
    const docRef = await addDoc(vehiclesRef, vehicle);
    return { ...vehicle, id: docRef.id } as Vehicle;
  }

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, updates);
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await deleteDoc(vehicleRef);
  }

  async setActiveVehicle(userId: string, vehicleId: string): Promise<void> {
    // First, deactivate all vehicles for this user
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isActive: false })
    );
    await Promise.all(updatePromises);
    
    // Then activate the selected vehicle
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, { isActive: true });
  }

  // --- Trips ---
  async getTrips(userId: string): Promise<Trip[]> {
    if (!userId) {
      console.warn('getTrips called with undefined userId');
      return [];
    }
    
    const tripsRef = collection(db, 'trips');
    const q = query(tripsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        startTime: data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime),
        endTime: data.endTime?.toDate ? data.endTime.toDate() : data.endTime ? new Date(data.endTime) : undefined,
      } as Trip;
    });
  }

  async addTrip(trip: Omit<Trip, 'id'>): Promise<Trip> {
    const tripsRef = collection(db, 'trips');
    const tripToSave = {
      ...trip,
      startTime: trip.startTime,
      endTime: trip.endTime || null,
    };
    const docRef = await addDoc(tripsRef, tripToSave);
    return { ...trip, id: docRef.id } as Trip;
  }

  // --- Monthly Usage Calculation ---
  async calculateMonthlyUsage(userId: string, month?: number, year?: number): Promise<number> {
    if (!userId) {
      console.warn('calculateMonthlyUsage called with undefined userId');
      return 0;
    }

    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();

    const trips = await this.getTrips(userId);
    
    // Filter trips for the specified month and year
    const monthlyTrips = trips.filter(trip => {
      const tripDate = new Date(trip.startTime);
      return tripDate.getMonth() === targetMonth && 
             tripDate.getFullYear() === targetYear;
    });

    // Calculate total cost from trips
    const totalCost = monthlyTrips.reduce((sum, trip) => sum + (trip.cost || 0), 0);
    
    return totalCost;
  }

  async getMonthlyBudgetStatus(userId: string): Promise<{
    monthlyUsage: number;
    monthlyLimit: number;
    personalBudget: number;
    isBusinessUser: boolean;
    usagePercentage: number;
    remainingBudget: number;
    isOverBudget: boolean;
  }> {
    if (!userId) {
      throw new Error('getMonthlyBudgetStatus called with undefined userId');
    }

    // Get user profile to determine budget type
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();
    const isBusinessUser = userData.type === 'driver';
    const monthlyLimit = userData.monthlyFuelLimit || 0;
    const personalBudget = userData.personalBudget || 0;
    
    // Calculate current month's usage
    const monthlyUsage = await this.calculateMonthlyUsage(userId);
    
    const budgetLimit = isBusinessUser ? monthlyLimit : personalBudget;
    const usagePercentage = budgetLimit > 0 ? (monthlyUsage / budgetLimit) * 100 : 0;
    const remainingBudget = budgetLimit - monthlyUsage;
    const isOverBudget = monthlyUsage > budgetLimit;

    return {
      monthlyUsage,
      monthlyLimit,
      personalBudget,
      isBusinessUser,
      usagePercentage,
      remainingBudget,
      isOverBudget,
    };
  }

  // --- Budget Alerts ---
  async getBudgetAlerts(userId: string): Promise<string[]> {
    const budgetStatus = await this.getMonthlyBudgetStatus(userId);
    const alerts: string[] = [];

    if (budgetStatus.isOverBudget) {
      alerts.push(`Budget exceeded by E${Math.abs(budgetStatus.remainingBudget).toFixed(2)}`);
    } else if (budgetStatus.usagePercentage >= 90) {
      alerts.push(`Budget at ${budgetStatus.usagePercentage.toFixed(0)}% - nearly exceeded`);
    } else if (budgetStatus.usagePercentage >= 75) {
      alerts.push(`Budget at ${budgetStatus.usagePercentage.toFixed(0)}% - monitor spending`);
    }

    return alerts;
  }

  // --- Fuel Logs ---
  async getFuelLogs(userId: string): Promise<FuelLog[]> {
    if (!userId) {
      console.warn('getFuelLogs called with undefined userId');
      return [];
    }
    
    // const logsRef = collection(db, 'fuelLogs');
    // const q = query(logsRef, where('userId', '==', userId));
    // const snapshot = await getDocs(q);
    // return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as FuelLog[];
    return [];
  }

  async addFuelLog(log: Omit<FuelLog, 'id'>): Promise<FuelLog> {
    // const logsRef = collection(db, 'fuelLogs');
    // const docRef = await addDoc(logsRef, log);
    // const newLog = { ...log, id: docRef.id };
    // return newLog;
    return { ...log, id: Date.now().toString() } as FuelLog;
  }

  // --- Fuel Stations ---
  async getFuelStations(): Promise<FuelStation[]> {
    // const stationsRef = collection(db, 'fuelStations');
    // const snapshot = await getDocs(stationsRef);
    // return snapshot.docs.map(doc => doc.data() as FuelStation);
    return [];
  }

  // --- User Profile & Budget ---
  async updateUserBudget(userId: string, budget: number): Promise<void> {
    if (!userId) {
      throw new Error('updateUserBudget called with undefined userId');
    }
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { personalBudget: budget });
  }

  async updateUserMonthlyLimit(userId: string, limit: number): Promise<void> {
    if (!userId) {
      throw new Error('updateUserMonthlyLimit called with undefined userId');
    }
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { monthlyFuelLimit: limit });
  }

  // --- Driving Behavior ---
  async getDrivingBehavior(userId: string): Promise<DrivingBehavior> {
    if (!userId) {
      console.warn('getDrivingBehavior called with undefined userId');
      return {
        userId: '',
        date: new Date(),
        aggressiveAcceleration: 0,
        hardBraking: 0,
        excessiveIdling: 0,
        speedingEvents: 0,
        fuelEfficiencyScore: 100,
        overallScore: 100,
      };
    }
    
    // const behaviorRef = doc(db, 'drivingBehavior', userId);
    // const snap = await getDoc(behaviorRef);
    // if (snap.exists()) return snap.data() as DrivingBehavior;
    // return { userId, date: new Date(), aggressiveAcceleration: 0, hardBraking: 0, excessiveIdling: 0, speedingEvents: 0, fuelEfficiencyScore: 100, overallScore: 100 };
    return {
      userId,
      date: new Date(),
      aggressiveAcceleration: 0,
      hardBraking: 0,
      excessiveIdling: 0,
      speedingEvents: 0,
      fuelEfficiencyScore: 100,
      overallScore: 100,
    };
  }
}

export const dataService = new DataService();