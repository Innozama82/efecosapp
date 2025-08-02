import { Trip, FuelLog, FuelStation, DrivingBehavior, Vehicle, User } from '@/types';
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
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

export class DataService {
  // --- User Management ---
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      // First check if user is a business user (driver)
      const businessUserRef = doc(db, 'businessUsers', userId);
      const businessUserSnap = await getDoc(businessUserRef);
      
      if (businessUserSnap.exists()) {
        const businessData = businessUserSnap.data();
        
        // Get business details
        let businessName = '';
        if (businessData.businessId) {
          const businessRef = doc(db, 'businesses', businessData.businessId);
          const businessSnap = await getDoc(businessRef);
          if (businessSnap.exists()) {
            businessName = businessSnap.data().name || '';
          }
        }
        
        return {
          id: userId,
          name: businessData.email?.split('@')[0] || 'Driver',
          email: businessData.email || '',
          type: 'driver',
          companyId: businessData.businessId,
          companyName: businessName,
          monthlyFuelLimit: businessData.monthlyFuelLimit || 0,
          createdAt: businessData.createdAt?.toDate() || new Date(),
        };
      }
      
      // Check regular users collection
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return {
          id: userId,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          email: userData.email || '',
          type: 'citizen',
          personalBudget: userData.personalBudget || 0,
          createdAt: userData.createdAt?.toDate() || new Date(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async createUserProfile(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const userProfile: User = {
        id: userId,
        name: userData.name || '',
        email: userData.email || '',
        type: userData.type || 'citizen',
        personalBudget: userData.personalBudget || 0,
        createdAt: new Date(),
      };

      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userProfile,
        createdAt: Timestamp.fromDate(userProfile.createdAt),
      });

      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // --- Vehicles ---
  async getVehicles(userId: string): Promise<Vehicle[]> {
    if (!userId) {
      console.warn('getVehicles called with undefined userId');
      return [];
    }
    
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(vehiclesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
        } as Vehicle;
      });
    } catch (error) {
      console.error('Error loading vehicles:', error);
      return [];
    }
  }

  async addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const docRef = await addDoc(vehiclesRef, vehicle);
      return { ...vehicle, id: docRef.id } as Vehicle;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  }

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vehicleRef, updates);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await deleteDoc(vehicleRef);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  async setActiveVehicle(userId: string, vehicleId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // First, deactivate all vehicles for this user
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(vehiclesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      
      // Then activate the selected vehicle
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      batch.update(vehicleRef, { isActive: true });
      
      await batch.commit();
    } catch (error) {
      console.error('Error setting active vehicle:', error);
      throw error;
    }
  }

  // --- Trips ---
  async getTrips(userId: string): Promise<Trip[]> {
    if (!userId) {
      console.warn('getTrips called with undefined userId');
      return [];
    }
    
    try {
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef, 
        where('userId', '==', userId),
        orderBy('startTime', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          startTime: data.startTime?.toDate() || new Date(data.startTime),
          endTime: data.endTime?.toDate() || (data.endTime ? new Date(data.endTime) : undefined),
        } as Trip;
      });
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    }
  }

  async addTrip(trip: Omit<Trip, 'id'>): Promise<Trip> {
    try {
      const tripsRef = collection(db, 'trips');
      const tripToSave = {
        ...trip,
        startTime: Timestamp.fromDate(trip.startTime),
        endTime: trip.endTime ? Timestamp.fromDate(trip.endTime) : null,
      };
      const docRef = await addDoc(tripsRef, tripToSave);
      return { ...trip, id: docRef.id } as Trip;
    } catch (error) {
      console.error('Error adding trip:', error);
      throw error;
    }
  }

  // --- Fuel Logs ---
  async getFuelLogs(userId: string): Promise<FuelLog[]> {
    if (!userId) {
      console.warn('getFuelLogs called with undefined userId');
      return [];
    }
    
    try {
      const logsRef = collection(db, 'fuelLogs');
      const q = query(
        logsRef, 
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(data.date),
        } as FuelLog;
      });
    } catch (error) {
      console.error('Error loading fuel logs:', error);
      return [];
    }
  }

  async addFuelLog(log: Omit<FuelLog, 'id'>): Promise<FuelLog> {
    try {
      const logsRef = collection(db, 'fuelLogs');
      const logToSave = {
        ...log,
        date: Timestamp.fromDate(log.date),
      };
      const docRef = await addDoc(logsRef, logToSave);
      return { ...log, id: docRef.id } as FuelLog;
    } catch (error) {
      console.error('Error adding fuel log:', error);
      throw error;
    }
  }

  // --- Fuel Stations ---
  async getFuelStations(): Promise<FuelStation[]> {
    try {
      const stationsRef = collection(db, 'fuelStations');
      const q = query(stationsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as FuelStation;
      });
    } catch (error) {
      console.error('Error loading fuel stations:', error);
      // Return mock data for demo
      return [
        {
          id: '1',
          name: 'Shell Station',
          brand: 'Shell',
          address: 'Main Street, Mbabane',
          location: { latitude: -26.3167, longitude: 31.1333 },
          distance: 0.5,
          prices: { gasoline: 6.80, diesel: 6.75, premium: 7.20 },
          lastUpdated: new Date(),
        },
        {
          id: '2',
          name: 'Total Fuel',
          brand: 'Total',
          address: 'Commercial Street, Mbabane',
          location: { latitude: -26.3200, longitude: 31.1400 },
          distance: 1.2,
          prices: { gasoline: 6.75, diesel: 6.70, premium: 7.15 },
          lastUpdated: new Date(),
        },
        {
          id: '3',
          name: 'Engen Station',
          brand: 'Engen',
          address: 'Industrial Road, Mbabane',
          location: { latitude: -26.3100, longitude: 31.1250 },
          distance: 0.8,
          prices: { gasoline: 6.90, diesel: 6.85, premium: 7.30 },
          lastUpdated: new Date(),
        },
      ];
    }
  }

  // --- Monthly Usage Calculation ---
  async calculateMonthlyUsage(userId: string, month?: number, year?: number): Promise<number> {
    if (!userId) {
      console.warn('calculateMonthlyUsage called with undefined userId');
      return 0;
    }

    try {
      const currentDate = new Date();
      const targetMonth = month ?? currentDate.getMonth();
      const targetYear = year ?? currentDate.getFullYear();

      // Get start and end of month
      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

      // Query trips for the month
      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(startOfMonth)),
        where('startTime', '<=', Timestamp.fromDate(endOfMonth))
      );
      
      const snapshot = await getDocs(q);
      
      // Calculate total cost from trips
      const totalCost = snapshot.docs.reduce((sum, doc) => {
        const trip = doc.data();
        return sum + (trip.cost || 0);
      }, 0);
      
      return totalCost;
    } catch (error) {
      console.error('Error calculating monthly usage:', error);
      return 0;
    }
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

    try {
      // Get user profile to determine budget type
      const userProfile = await this.getUserProfile(userId);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const isBusinessUser = userProfile.type === 'driver';
      const monthlyLimit = userProfile.monthlyFuelLimit || 0;
      const personalBudget = userProfile.personalBudget || 0;
      
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
    } catch (error) {
      console.error('Error getting monthly budget status:', error);
      throw error;
    }
  }

  // --- Budget Alerts ---
  async getBudgetAlerts(userId: string): Promise<string[]> {
    try {
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
    } catch (error) {
      console.error('Error getting budget alerts:', error);
      return [];
    }
  }

  // --- User Profile & Budget Updates ---
  async updateUserBudget(userId: string, budget: number): Promise<void> {
    if (!userId) {
      throw new Error('updateUserBudget called with undefined userId');
    }
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { personalBudget: budget });
    } catch (error) {
      console.error('Error updating user budget:', error);
      throw error;
    }
  }

  async updateUserMonthlyLimit(userId: string, limit: number): Promise<void> {
    if (!userId) {
      throw new Error('updateUserMonthlyLimit called with undefined userId');
    }
    
    try {
      const businessUserRef = doc(db, 'businessUsers', userId);
      await updateDoc(businessUserRef, { monthlyFuelLimit: limit });
    } catch (error) {
      console.error('Error updating monthly limit:', error);
      throw error;
    }
  }

  // --- Driving Behavior ---
  async getDrivingBehavior(userId: string): Promise<DrivingBehavior | null> {
    if (!userId) {
      console.warn('getDrivingBehavior called with undefined userId');
      return null;
    }
    
    try {
      const behaviorRef = doc(db, 'drivingBehavior', userId);
      const snap = await getDoc(behaviorRef);
      
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...data,
          date: data.date?.toDate() || new Date(),
        } as DrivingBehavior;
      }
      
      // Return default behavior if none exists
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
    } catch (error) {
      console.error('Error loading driving behavior:', error);
      return null;
    }
  }

  async updateDrivingBehavior(behavior: DrivingBehavior): Promise<void> {
    try {
      const behaviorRef = doc(db, 'drivingBehavior', behavior.userId);
      await setDoc(behaviorRef, {
        ...behavior,
        date: Timestamp.fromDate(behavior.date),
      });
    } catch (error) {
      console.error('Error updating driving behavior:', error);
      throw error;
    }
  }

  // --- Business Users (Drivers) ---
  async getBusinessUserDetails(userId: string): Promise<any> {
    try {
      const businessUserRef = doc(db, 'businessUsers', userId);
      const businessUserSnap = await getDoc(businessUserRef);
      
      if (!businessUserSnap.exists()) {
        return null;
      }
      
      const businessData = businessUserSnap.data();
      
      // Get business details if businessId exists
      let businessDetails = null;
      if (businessData.businessId) {
        const businessRef = doc(db, 'businesses', businessData.businessId);
        const businessSnap = await getDoc(businessRef);
        if (businessSnap.exists()) {
          businessDetails = businessSnap.data();
        }
      }
      
      return {
        ...businessData,
        business: businessDetails,
      };
    } catch (error) {
      console.error('Error getting business user details:', error);
      return null;
    }
  }

  // --- Drivers Collection ---
  async getDriverDetails(userId: string): Promise<any> {
    try {
      const driverRef = doc(db, 'drivers', userId);
      const driverSnap = await getDoc(driverRef);
      
      if (driverSnap.exists()) {
        return driverSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting driver details:', error);
      return null;
    }
  }

  // --- Analytics and Reports ---
  async getFuelEfficiencyTrends(userId: string, days: number = 30): Promise<any[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const tripsRef = collection(db, 'trips');
      const q = query(
        tripsRef,
        where('userId', '==', userId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('startTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('startTime', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.startTime?.toDate() || new Date(),
          efficiency: data.efficiency || 0,
          fuelUsed: data.fuelUsed || 0,
          distance: data.distance || 0,
          cost: data.cost || 0,
        };
      });
    } catch (error) {
      console.error('Error getting fuel efficiency trends:', error);
      return [];
    }
  }

  // --- Sync with Web App ---
  async syncUserData(userId: string): Promise<void> {
    try {
      // This method ensures data consistency between web and mobile
      // Force refresh of user profile and related data
      await this.getUserProfile(userId);
    } catch (error) {
      console.error('Error syncing user data:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();