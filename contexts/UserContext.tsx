import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Vehicle } from '@/types';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { obdService } from '@/services/obdService';
import { dataService } from '@/services/dataService';

/**
 * UserContext provides authentication and user state management
 * 
 * Features:
 * - Firebase authentication integration
 * - User profile management
 * - Vehicle management
 * - Trip tracking state
 * - Comprehensive logout functionality with cleanup
 * 
 * Logout Process:
 * 1. Calls all registered logout callbacks to clean up component state
 * 2. Disconnects from OBD service to stop data collection
 * 3. Signs out from Firebase authentication
 * 4. Clears all local state (user, vehicles, tracking, etc.)
 * 5. Handles errors gracefully with fallback cleanup
 */

interface UserContextType {
  user: User | null;
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  setUser: (user: User | null) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setActiveVehicle: (vehicle: Vehicle | null) => void;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  loadVehicles: () => Promise<void>;
  isBusinessUser: boolean;
  monthlyUsage: number;
  monthlyLimit: number;
  personalBudget: number;
  updateMonthlyUsage: (amount: number) => void;
  updatePersonalBudget: (budget: number) => Promise<void>;
  updateMonthlyLimit: (limit: number) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  onLogout: (callback: () => void) => void;
  isTrackingTrip: boolean;
  setIsTrackingTrip: (tracking: boolean) => void;
  isInitializing: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutCallbacks, setLogoutCallbacks] = useState<(() => void)[]>([]);
  const [isTrackingTrip, setIsTrackingTrip] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const isBusinessUser = user?.type === 'driver';
  const monthlyLimit = user?.monthlyFuelLimit || 0;
  const personalBudget = user?.personalBudget || 0;

  // Calculate monthly usage from trips
  const calculateMonthlyUsage = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const budgetStatus = await dataService.getMonthlyBudgetStatus(user.id);
      setMonthlyUsage(budgetStatus.monthlyUsage);
    } catch (error) {
      console.error('Error calculating monthly usage:', error);
    }
  }, [user?.id]);

  const updateMonthlyUsage = useCallback((amount: number) => {
    setMonthlyUsage(prev => prev + amount);
  }, []);

  // Recalculate monthly usage when trips change
  useEffect(() => {
    calculateMonthlyUsage();
  }, [calculateMonthlyUsage]);

  const updatePersonalBudget = useCallback(async (budget: number) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      await dataService.updateUserBudget(user.id, budget);
      setUser(prev => prev ? { ...prev, personalBudget: budget } : null);
    } catch (error) {
      console.error('Error updating personal budget:', error);
      throw error;
    }
  }, [user?.id]);

  const updateMonthlyLimit = useCallback(async (limit: number) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      await dataService.updateUserMonthlyLimit(user.id, limit);
      setUser(prev => prev ? { ...prev, monthlyFuelLimit: limit } : null);
    } catch (error) {
      console.error('Error updating monthly limit:', error);
      throw error;
    }
  }, [user?.id]);

  const onLogout = useCallback((callback: () => void) => {
    setLogoutCallbacks(prev => [...prev, callback]);
  }, []);

  const loadVehicles = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const userVehicles = await dataService.getVehicles(user.id);
      setVehicles(userVehicles);
      
      // Set active vehicle if none is selected
      const activeVeh = userVehicles.find(v => v.isActive);
      if (activeVeh && !activeVehicle) {
        setActiveVehicle(activeVeh);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }, [user?.id, activeVehicle]);

  const addVehicle = useCallback(async (vehicle: Omit<Vehicle, 'id'>) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const newVehicle = await dataService.addVehicle({
        ...vehicle,
        userId: user.id,
        isActive: vehicles.length === 0, // First vehicle becomes active
      });
      
      setVehicles(prev => [...prev, newVehicle]);
      
      // Set as active if it's the first vehicle
      if (vehicles.length === 0) {
        setActiveVehicle(newVehicle);
      }
      
      return newVehicle;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  }, [user?.id, vehicles.length]);

  const updateVehicle = useCallback(async (vehicleId: string, updates: Partial<Vehicle>) => {
    try {
      await dataService.updateVehicle(vehicleId, updates);
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, ...updates } : v));
      
      // Update active vehicle if needed
      if (updates.isActive && activeVehicle?.id !== vehicleId) {
        const updatedVehicle = vehicles.find(v => v.id === vehicleId);
        if (updatedVehicle) {
          setActiveVehicle(updatedVehicle);
        }
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }, [activeVehicle]);

  const deleteVehicle = useCallback(async (vehicleId: string) => {
    try {
      await dataService.deleteVehicle(vehicleId);
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      
      // If deleted vehicle was active, set another vehicle as active
      if (activeVehicle?.id === vehicleId) {
        const remainingVehicles = vehicles.filter(v => v.id !== vehicleId);
        setActiveVehicle(remainingVehicles.length > 0 ? remainingVehicles[0] : null);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }, [activeVehicle, vehicles]);

  // Listen for Firebase Auth state changes and sync user profile from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          let profile: User;
          if (userSnap.exists()) {
            profile = userSnap.data() as User;
          } else {
            // Create user profile if not exists
            profile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              type: 'citizen',
              personalBudget: 0,
              createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            };
            await setDoc(userRef, profile);
          }
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load vehicles when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadVehicles();
    }
  }, [user?.id, loadVehicles]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      // Call all logout callbacks first to clean up any active processes
      logoutCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in logout callback:', error);
        }
      });
      
      // Disconnect from OBD service to stop any active data collection
      obdService.disconnect();
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear all user-related state
      setUser(null);
      setVehicles([]);
      setActiveVehicle(null);
      setMonthlyUsage(0);
      setLogoutCallbacks([]);
      setIsTrackingTrip(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear local state and disconnect services
      obdService.disconnect();
      setUser(null);
      setVehicles([]);
      setActiveVehicle(null);
      setMonthlyUsage(0);
      setLogoutCallbacks([]);
      setIsTrackingTrip(false);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logoutCallbacks]);

  return (
    <UserContext.Provider
      value={{
        user,
        vehicles,
        activeVehicle,
        setUser,
        setVehicles,
        setActiveVehicle,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        loadVehicles,
        isBusinessUser,
        monthlyUsage,
        monthlyLimit,
        personalBudget,
        updateMonthlyUsage,
        updatePersonalBudget,
        updateMonthlyLimit,
        logout,
        isLoggingOut,
        onLogout,
        isTrackingTrip,
        setIsTrackingTrip,
        isInitializing,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}