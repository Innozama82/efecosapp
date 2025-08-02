import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Plus, Play, Square, MapPin, Car, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { TripCard } from '@/components/TripCard';
import { useUser } from '@/contexts/UserContext';
import { dataService } from '@/services/dataService';
import { obdService } from '@/services/obdService';
import { Trip, OBDData } from '@/types';
import ManualTripModal from '@/components/ManualTripModal';
import { router } from 'expo-router';

export default function Trips() {
  const { 
    user, 
    activeVehicle, 
    onLogout, 
    isTrackingTrip, 
    setIsTrackingTrip,
    monthlyUsage,
    monthlyLimit,
    personalBudget,
    isBusinessUser
  } = useUser();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Partial<Trip> | null>(null);
  const [obdData, setOBDData] = useState<OBDData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [budgetStatus, setBudgetStatus] = useState({
    monthlyUsage: 0,
    usagePercentage: 0,
    remainingBudget: 0,
    isOverBudget: false,
    alerts: [] as string[]
  });

  const loadTrips = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userTrips = await dataService.getTrips(user.id);
      setTrips(userTrips.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
      
      // Load budget status
      const status = await dataService.getMonthlyBudgetStatus(user.id);
      const alerts = await dataService.getBudgetAlerts(user.id);
      setBudgetStatus({
        monthlyUsage: status.monthlyUsage,
        usagePercentage: status.usagePercentage,
        remainingBudget: status.remainingBudget,
        isOverBudget: status.isOverBudget,
        alerts
      });
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  // Register logout callback to clean up tracking state
  useEffect(() => {
    const cleanup = () => {
      setIsTrackingTrip(false);
      setCurrentTrip(null);
      setOBDData(null);
    };
    
    onLogout(cleanup);
  }, [onLogout, setIsTrackingTrip]);

  useEffect(() => {
    if (isTrackingTrip && obdService.isDeviceConnected()) {
      const interval = setInterval(() => {
        const data = obdService.getCurrentData();
        setOBDData(data);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isTrackingTrip]);

  const checkBudgetBeforeTrip = (estimatedCost: number) => {
    const budgetLimit = isBusinessUser ? monthlyLimit : personalBudget;
    const newTotalCost = budgetStatus.monthlyUsage + estimatedCost;
    
    if (newTotalCost > budgetLimit) {
      const overAmount = newTotalCost - budgetLimit;
      Alert.alert(
        'Budget Warning',
        `This trip will exceed your ${isBusinessUser ? 'monthly limit' : 'budget'} by E${overAmount.toFixed(2)}. Do you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'destructive' }
        ]
      );
      return false;
    } else if (newTotalCost > budgetLimit * 0.9) {
      Alert.alert(
        'Budget Alert',
        `This trip will bring you to ${((newTotalCost / budgetLimit) * 100).toFixed(0)}% of your ${isBusinessUser ? 'monthly limit' : 'budget'}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue' }
        ]
      );
      return true;
    }
    return true;
  };

  const startTrip = useCallback(() => {
    if (!activeVehicle) {
      Alert.alert(
        'No Vehicle Selected',
        'You need to add a vehicle to start tracking trips. Would you like to add a vehicle now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Vehicle', 
            onPress: () => {
              // Navigate to profile to add vehicle
              router.push('/(tabs)/profile');
            }
          }
        ]
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    // Check budget before starting trip
    const estimatedCost = 15; // Rough estimate for a typical trip
    if (!checkBudgetBeforeTrip(estimatedCost)) {
      return;
    }

    const trip: Partial<Trip> = {
      userId: user.id,
      vehicleId: activeVehicle.id,
      startTime: new Date(),
      startLocation: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'Current Location, Mbabane, Hhohho',
      },
      distance: 0,
      fuelUsed: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      idleTime: 0,
      cost: 0,
      efficiency: 0,
      isManual: false,
    };

    setCurrentTrip(trip);
    setIsTrackingTrip(true);
  }, [activeVehicle, user?.id, setIsTrackingTrip, budgetStatus, isBusinessUser, monthlyLimit, personalBudget]);

  const endTrip = useCallback(async () => {
    if (!currentTrip) return;

    const endedTrip: Omit<Trip, 'id'> = {
      ...currentTrip,
      endTime: new Date(),
      endLocation: {
        latitude: 37.7849,
        longitude: -122.4094,
        address: 'End Location, Manzini, Manzini',
      },
      distance: Math.random() * 25 + 5, // Mock distance
      fuelUsed: Math.random() * 3 + 1, // Mock fuel usage
      avgSpeed: Math.random() * 30 + 40,
      maxSpeed: Math.random() * 20 + 70,
      idleTime: Math.random() * 10,
      cost: Math.random() * 15 + 5,
      efficiency: 0,
    } as Omit<Trip, 'id'>;

    // Calculate efficiency
    endedTrip.efficiency = endedTrip.distance / endedTrip.fuelUsed;

    try {
      const savedTrip = await dataService.addTrip(endedTrip);
      setTrips([savedTrip, ...trips]);
      setCurrentTrip(null);
      setIsTrackingTrip(false);
      setOBDData(null);
      
      // Reload budget status after adding trip
      await loadTrips();
      
      Alert.alert('Trip Completed', 'Your trip has been saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save trip.');
    }
  }, [currentTrip, trips, setIsTrackingTrip, loadTrips]);

  const addManualTrip = useCallback(() => {
    // Check budget before allowing manual trip entry
    const estimatedCost = 20; // Higher estimate for manual entry
    if (!checkBudgetBeforeTrip(estimatedCost)) {
      return;
    }
    setManualModalVisible(true);
  }, [budgetStatus, isBusinessUser, monthlyLimit, personalBudget]);

  const handleManualTripSave = useCallback(async (manualTripData: any) => {
    if (!user?.id || !activeVehicle) return;
    
    const trip = {
      ...manualTripData,
      userId: user.id,
      vehicleId: activeVehicle.id,
      avgSpeed: 0,
      maxSpeed: 0,
      idleTime: 0,
      efficiency: manualTripData.distance / manualTripData.fuelUsed,
      cost: manualTripData.cost,
      isManual: true,
      startTime: new Date(),
    };
    
    try {
      const savedTrip = await dataService.addTrip(trip);
      setTrips([savedTrip, ...trips]);
      
      // Reload budget status after adding trip
      await loadTrips();
      
      Alert.alert('Trip Saved', 'Manual trip entry saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save manual trip.');
    }
    setManualModalVisible(false);
  }, [user?.id, activeVehicle, trips, loadTrips]);

  const getBudgetColor = (percentage: number) => {
    if (percentage > 90) return '#DC2626';
    if (percentage > 75) return '#F59E0B';
    return '#059669';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading trips...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Trip Tracker</Text>
          <TouchableOpacity style={styles.manualButton} onPress={addManualTrip}>
            <Plus size={20} color="#2563EB" />
            <Text style={styles.manualButtonText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Status Card */}
        <Card style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <DollarSign size={20} color="#2563EB" />
            <Text style={styles.budgetTitle}>
              {isBusinessUser ? 'Monthly Fuel Limit' : 'Monthly Budget'}
            </Text>
          </View>
          
          <View style={styles.budgetProgress}>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetAmount}>
                E{budgetStatus.monthlyUsage.toFixed(2)} / E{isBusinessUser ? monthlyLimit : personalBudget}
              </Text>
              <Text style={[styles.budgetPercentage, { color: getBudgetColor(budgetStatus.usagePercentage) }]}>
                {budgetStatus.usagePercentage.toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(budgetStatus.usagePercentage, 100)}%`,
                    backgroundColor: getBudgetColor(budgetStatus.usagePercentage),
                  },
                ]}
              />
            </View>
            
            <Text style={styles.remainingText}>
              E{Math.max(0, budgetStatus.remainingBudget).toFixed(2)} remaining
            </Text>
          </View>
        </Card>

        {/* Budget Alerts */}
        {budgetStatus.alerts.length > 0 && (
          <Card style={StyleSheet.flatten([styles.alertCard, { backgroundColor: budgetStatus.isOverBudget ? '#FEE2E2' : '#FEF3C7' }])}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={20} color={budgetStatus.isOverBudget ? '#DC2626' : '#F59E0B'} />
              <Text style={styles.alertTitle}>
                {budgetStatus.isOverBudget ? 'Budget Exceeded' : 'Budget Alert'}
              </Text>
            </View>
            {budgetStatus.alerts.map((alert, index) => (
              <Text key={index} style={styles.alertText}>{alert}</Text>
            ))}
          </Card>
        )}

        {/* Vehicle Info */}
        {activeVehicle && (
          <Card style={styles.vehicleCard}>
            <View style={styles.vehicleInfo}>
              <Car size={20} color="#2563EB" />
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>
                  {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                </Text>
                <Text style={styles.vehiclePlate}>{activeVehicle.licensePlate}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Trip Control */}
        <Card>
          <View style={styles.controlHeader}>
            <Text style={styles.controlTitle}>
              {isTrackingTrip ? 'Trip in Progress' : 'Start New Trip'}
            </Text>
            {isTrackingTrip && currentTrip && (
              <Text style={styles.tripDuration}>
                Started at {new Intl.DateTimeFormat('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(currentTrip.startTime)}
              </Text>
            )}
          </View>

          {isTrackingTrip ? (
            <View>
              {obdData && (
                <View style={styles.liveData}>
                  <Text style={styles.liveDataTitle}>Live Data</Text>
                  <View style={styles.liveDataGrid}>
                    <View style={styles.liveDataItem}>
                      <Text style={styles.liveDataValue}>{obdData.speed}</Text>
                      <Text style={styles.liveDataLabel}>km/h</Text>
                    </View>
                    <View style={styles.liveDataItem}>
                      <Text style={styles.liveDataValue}>{obdData.rpm}</Text>
                      <Text style={styles.liveDataLabel}>RPM</Text>
                    </View>
                    <View style={styles.liveDataItem}>
                      <Text style={styles.liveDataValue}>{obdData.fuelConsumption.toFixed(1)}</Text>
                      <Text style={styles.liveDataLabel}>L/h</Text>
                    </View>
                    <View style={styles.liveDataItem}>
                      <Text style={styles.liveDataValue}>{obdData.engineLoad}</Text>
                      <Text style={styles.liveDataLabel}>% Load</Text>
                    </View>
                  </View>
                </View>
              )}
              <TouchableOpacity style={styles.endButton} onPress={endTrip}>
                <Square size={20} color="#FFFFFF" />
                <Text style={styles.endButtonText}>End Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.startButton} onPress={startTrip}>
              <Play size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Trip</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Recent Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          {trips.length > 0 ? (
            trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => {
                  // In a real app, this would navigate to trip details
                  Alert.alert('Trip Details', 'This would show detailed trip information.');
                }}
              />
            ))
          ) : (
            <Card>
              <View style={styles.noTrips}>
                {activeVehicle ? (
                  <>
                    <MapPin size={48} color="#9CA3AF" />
                    <Text style={styles.noTripsTitle}>No trips yet</Text>
                    <Text style={styles.noTripsText}>
                      Start your first trip to begin tracking your fuel usage
                    </Text>
                  </>
                ) : (
                  <>
                    <Car size={48} color="#9CA3AF" />
                    <Text style={styles.noTripsTitle}>No vehicle selected</Text>
                    <Text style={styles.noTripsText}>
                      Add a vehicle in your profile to start tracking trips
                    </Text>
                    <TouchableOpacity 
                      style={styles.addVehicleButton}
                      onPress={() => router.push('/(tabs)/profile')}
                    >
                      <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Card>
          )}
        </View>
        <Text style={{textAlign: 'center', color: '#888', marginVertical: 8}}>
          OBD data is simulated for demo purposes.
        </Text>
      </ScrollView>
      <ManualTripModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onSave={handleManualTripSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  manualButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  controlHeader: {
    marginBottom: 16,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  tripDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  liveData: {
    marginBottom: 20,
  },
  liveDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  liveDataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveDataItem: {
    alignItems: 'center',
    flex: 1,
  },
  liveDataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  liveDataLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  endButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  noTrips: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTripsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  noTripsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  vehicleCard: {
    marginBottom: 16,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addVehicleButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  addVehicleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  budgetCard: {
    marginBottom: 16,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  budgetProgress: {
    marginTop: 12,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  budgetPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  alertCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
});