import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Fuel, Car, TrendingUp, TrendingDown, Bluetooth, TriangleAlert as AlertTriangle, DollarSign, Clock, Gauge, User as UserIcon, MapPin, PlusCircle, History, Fuel as FuelIcon } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { useUser } from '@/contexts/UserContext';
import { obdService } from '@/services/obdService';
import { dataService } from '@/services/dataService';
import { Trip, DrivingBehavior } from '@/types';
import { router } from 'expo-router';

export default function Dashboard() {
  const { 
    user, 
    isBusinessUser, 
    monthlyUsage, 
    monthlyLimit, 
    personalBudget,
    activeVehicle,
    vehicles,
    isInitializing
  } = useUser();
  const [isOBDConnected, setIsOBDConnected] = useState(false);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [drivingBehavior, setDrivingBehavior] = useState<DrivingBehavior | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- MOCK/EXTRA STATE ---
  const [tripStatus, setTripStatus] = useState('Not Connected to Vehicle');
  const [vehicleName, setVehicleName] = useState('Toyota Corolla (ABC-123)');
  const [lastSync, setLastSync] = useState('Today, 08:45');
  const [fuelSaved, setFuelSaved] = useState(4.2); // liters
  const [fuelSavedValue, setFuelSavedValue] = useState(1200); // E
  const [improvement, setImprovement] = useState(7); // percent
  const [nearestStation, setNearestStation] = useState({ name: 'Total Fuel', price: 680 });
  const [alerts, setAlerts] = useState([
    // Example: 'Fuel Budget Exceeded', 'Engine Alert', 'Driving Too Fast'
  ]);
  const [fuelTip, setFuelTip] = useState(
    "Maintain steady speeds between 50-80 km/h on highways. This optimal range can improve your fuel efficiency by up to 15%."
  );
  // --- END MOCK ---

  const loadDashboardData = useCallback(async () => {
    try {
      // If no user, still show the dashboard but with limited functionality
      if (!user?.id) {
        console.log('No user ID available, showing dashboard with limited functionality');
        setRecentTrips([]);
        setDrivingBehavior(null);
        setLoadError(null);
        setIsLoading(false);
        return;
      }

      console.log('Loading dashboard data for user:', user.id);
      
      const [trips, behavior, budgetStatus] = await Promise.all([
        dataService.getTrips(user.id).catch(err => {
          console.error('Error loading trips:', err);
          return [];
        }),
        dataService.getDrivingBehavior(user.id).catch(err => {
          console.error('Error loading driving behavior:', err);
          return null;
        }),
        dataService.getMonthlyBudgetStatus(user.id).catch(err => {
          console.error('Error loading budget status:', err);
          return null;
        }),
      ]);

      setRecentTrips(trips.slice(0, 3));
      setDrivingBehavior(behavior);
      setLoadError(null);
      
      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoadError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Add a small delay to ensure user context is properly initialized
    const timer = setTimeout(() => {
      loadDashboardData();
    }, 100);

    // Add a timeout to prevent infinite loading
    const timeoutTimer = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, showing dashboard anyway');
        setIsLoading(false);
        setLoadError('Loading took too long. Please check your connection and try again.');
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timer);
      clearTimeout(timeoutTimer);
    };
  }, [loadDashboardData, isLoading]);

  // --- ENHANCED: Trip Status Logic (vehicle-aware) ---
  useEffect(() => {
    if (!activeVehicle) {
      setTripStatus('No Vehicle Selected');
    } else if (isOBDConnected) {
      setTripStatus(`Connected to ${activeVehicle.make} ${activeVehicle.model}`);
    } else {
      setTripStatus(`Ready to connect to ${activeVehicle.make} ${activeVehicle.model}`);
    }
  }, [isOBDConnected, activeVehicle]);
  // --- END ---

  const connectOBD = async () => {
    if (!activeVehicle) {
      Alert.alert(
        'No Vehicle Selected',
        'Please select a vehicle first to connect OBD-II device.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      Alert.alert(
        'Connect OBD-II Device',
        `Connect to your ${activeVehicle.make} ${activeVehicle.model}? Make sure your OBD-II adapter is plugged in and Bluetooth is enabled.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: async () => {
              const connected = await obdService.connect();
              setIsOBDConnected(connected);
              if (connected) {
                Alert.alert('Success', `OBD-II device connected to ${activeVehicle.make} ${activeVehicle.model}!`);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Connection Failed', 'Could not connect to OBD-II device.');
    }
  };

  const totalFuelUsed = recentTrips.reduce((sum, trip) => sum + trip.fuelUsed, 0);
  const totalDistance = recentTrips.reduce((sum, trip) => sum + trip.distance, 0);
  const avgEfficiency = totalDistance > 0 ? totalDistance / totalFuelUsed : 0;
  const totalCost = recentTrips.reduce((sum, trip) => sum + trip.cost, 0);

  const usagePercentage = isBusinessUser
    ? (monthlyUsage / monthlyLimit) * 100
    : (monthlyUsage / personalBudget) * 100;

  const getUsageColor = (percentage: number) => {
    if (percentage > 90) return '#DC2626';
    if (percentage > 75) return '#F59E0B';
    return '#059669';
  };

  if (isLoading || isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setIsLoading(true);
            setLoadError(null);
            loadDashboardData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If no user is authenticated, show a limited dashboard
  if (!user) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>💡 Daily Fuel-Saving Tip</Text>
            <Text style={styles.tipText}>
              Maintain steady speeds and avoid rapid acceleration.
            </Text>
            <Text style={styles.tipText}>
              Sign in to get personalized tips based on your driving data!
            </Text>
          </View>
          <View style={styles.avatarBadgeCol}>
            <View style={styles.avatarCircle}>
              <UserIcon color="#2563EB" size={28} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#DC2626' }]}> 
              <Text style={styles.statusBadgeText}>Offline</Text>
            </View>
          </View>
        </View>
        
        <Card style={StyleSheet.flatten([styles.cardShadow])}>
          <Text style={styles.sectionTitle}>Welcome to EFECOS</Text>
          <Text style={styles.tipText}>
            Track your fuel usage, monitor your driving behavior, and save money on fuel costs.
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/Login')}
          >
            <Text style={styles.connectButtonText}>Sign In</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. User Welcome + Status */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>💡 Daily Fuel-Saving Tip</Text>
          <Text style={styles.tipText}>
            Maintain steady speeds and avoid rapid acceleration.
          </Text>
          <Text style={styles.tipText}>
            Soon: Personalized tips based on your car's OBD data!
          </Text>
        </View>
        <View style={styles.avatarBadgeCol}>
          <View style={styles.avatarCircle}>
            <UserIcon color="#2563EB" size={28} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOBDConnected ? '#059669' : '#DC2626' }]}> 
            <Text style={styles.statusBadgeText}>{isOBDConnected ? 'Connected' : 'Offline'}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.tripStatus}>{tripStatus}</Text>

      {/* Vehicle & OBD Connection Status */}
      <Card style={StyleSheet.flatten([styles.cardShadow, styles.obdContainer])}> 
        <View style={styles.obdHeader}>
          <View style={styles.obdInfo}>
            <Bluetooth size={20} color={isOBDConnected ? '#059669' : '#6B7280'} />
            <Text style={styles.obdStatus}>OBD-II {isOBDConnected ? 'Connected' : 'Disconnected'}</Text>
          </View>
          {!isOBDConnected && activeVehicle && (
            <TouchableOpacity style={styles.connectButton} onPress={connectOBD}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {activeVehicle ? (
          <>
            <View style={styles.vehicleInfo}>
              <Car size={20} color="#2563EB" />
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>
                  {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                </Text>
                <Text style={styles.vehiclePlate}>{activeVehicle.licensePlate}</Text>
                <Text style={styles.vehicleFuelType}>{activeVehicle.fuelType.charAt(0).toUpperCase() + activeVehicle.fuelType.slice(1)}</Text>
              </View>
            </View>
            {vehicles.length > 1 && (
              <TouchableOpacity 
                style={styles.switchVehicleButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={styles.switchVehicleText}>Switch Vehicle ({vehicles.length} available)</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.lastSync}>Last Sync: {lastSync}</Text>
            {isOBDConnected && (
              <Text style={styles.obdMessage}>Real-time fuel monitoring active</Text>
            )}
          </>
        ) : (
          <View style={styles.noVehicleContainer}>
            <Car size={32} color="#9CA3AF" />
            <Text style={styles.noVehicleTitle}>No Vehicle Selected</Text>
            <Text style={styles.noVehicleText}>
              Add a vehicle in your profile to start tracking fuel usage
            </Text>
            <TouchableOpacity 
              style={styles.addVehicleButton}
              onPress={() => {
                // Navigate to profile to add vehicle
                router.push('/(tabs)/profile');
              }}
            >
              <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* 2. Fuel Usage Summary Card */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <View style={styles.summaryHeader}>
          <Text style={styles.sectionTitle}>
            {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model} Usage` : 'Fuel Usage Summary'}
          </Text>
          {activeVehicle && (
            <Text style={styles.vehiclePeriod}>This Week</Text>
          )}
        </View>
        <View style={styles.summaryRowModern}>
          <View style={styles.summaryStatCol}>
            <FuelIcon color="#059669" size={22} />
            <Text style={styles.summaryValue}>{totalFuelUsed.toFixed(1)} L</Text>
            <Text style={styles.summaryLabel}>Fuel Used</Text>
          </View>
          <View style={styles.summaryStatCol}>
            <MapPin color="#2563EB" size={22} />
            <Text style={styles.summaryValue}>{totalDistance.toFixed(0)} km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryStatCol}>
            <Gauge size={22} color={avgEfficiency > 15 ? '#059669' : avgEfficiency > 10 ? '#F59E0B' : '#DC2626'} />
            <Text style={[styles.summaryValue, { color: avgEfficiency > 15 ? '#059669' : avgEfficiency > 10 ? '#F59E0B' : '#DC2626' }]}>{avgEfficiency.toFixed(1)} km/L</Text>
            <Text style={styles.summaryLabel}>Efficiency</Text>
          </View>
        </View>
        {!activeVehicle && (
          <View style={styles.noVehicleSummary}>
            <Text style={styles.noVehicleSummaryText}>
              Select a vehicle to see detailed usage statistics
            </Text>
          </View>
        )}
      </Card>

      {/* REMOVE: Savings Insights Card */}

      {/* 4. Vehicle Connection Status */}
      {/* REMOVE QUICK ACTIONS BUTTONS SECTION ENTIRELY */}


      
      {alerts.length > 0 && alerts.map((alert, idx) => (
        <Card key={idx} style={StyleSheet.flatten([{ ...styles.alertCard, backgroundColor: '#FEE2E2' }, styles.cardShadow])}> 
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color="#DC2626" />
            <Text style={styles.alertTitle}>{alert}</Text>
          </View>
        </Card>
      ))}
      {drivingBehavior && drivingBehavior.overallScore < 80 && (
        <Card style={StyleSheet.flatten([{ ...styles.alertCard, backgroundColor: '#FEF3C7' }, styles.cardShadow])}> 
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.alertTitle}>Driving Behavior Alert</Text>
          </View>
          <Text style={styles.alertText}>
            Your driving efficiency score is {drivingBehavior.overallScore}/100. 
            Consider reducing idle time and aggressive acceleration to improve fuel economy.
          </Text>
        </Card>
      )}

      {/* 7. Location-aware Section */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <Text style={styles.sectionTitle}>Nearest Fuel Station</Text>
        <View style={styles.stationRow}>
          <MapPin color="#059669" size={20} />
          <Text style={styles.stationName}>{nearestStation.name}</Text>
          <Text style={styles.stationPrice}>{nearestStation.price} /L</Text>
        </View>
        <TouchableOpacity 
          style={styles.findFuelBtn}
          onPress={() => router.push('/(tabs)/fuel-log')}
        >
          <Text style={styles.findFuelText}>Find Fuel Stations Nearby</Text>
        </TouchableOpacity>
      </Card>

      {/* 8. Monthly Usage Progress */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageTitle}>{isBusinessUser ? 'Monthly Fuel Limit' : 'Monthly Budget'}</Text>
          <Text style={[styles.usagePercentage, { color: getUsageColor(usagePercentage) }]}>{usagePercentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(usagePercentage, 100)}%`,
                backgroundColor: getUsageColor(usagePercentage),
              },
            ]}
          />
        </View>
        <View style={styles.usageDetails}>
          <Text style={styles.usageText}>E{monthlyUsage.toFixed(2)} of E{isBusinessUser ? monthlyLimit : personalBudget}</Text>
          <Text style={styles.remainingText}>E{(isBusinessUser ? monthlyLimit - monthlyUsage : personalBudget - monthlyUsage).toFixed(2)} remaining</Text>
        </View>
      </Card>

      {/* REMOVE: Recent Trips Card */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6, // was 8
    paddingTop: 50, // was 20 - increased to bring content down
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    marginBottom: 16, // was 20
  },
  greeting: {
    fontSize: 22, // was 24
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userType: {
    fontSize: 13, // was 14
    color: '#6B7280',
    marginTop: 3, // was 4
  },
  tripStatus: {
    fontSize: 13, // was 14
    color: '#2563EB',
    marginTop: 2,
    marginBottom: 6, // was 8
    fontWeight: '600',
  },
  obdContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  obdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  obdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  obdStatus: {
    fontSize: 15, // was 16
    fontWeight: '600',
    marginLeft: 6, // was 8
    color: '#1F2937',
  },
  connectButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14, // was 16
    paddingVertical: 6, // was 8
    borderRadius: 6, // was 8
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 13, // was 14
    fontWeight: '600',
  },
  obdMessage: {
    fontSize: 11, // was 12
    color: '#059669',
    marginTop: 6, // was 8
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // was 12
  },
  usageTitle: {
    fontSize: 15, // was 16
    fontWeight: '600',
    color: '#1F2937',
  },
  usagePercentage: {
    fontSize: 16, // was 18
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6, // was 8
    backgroundColor: '#E5E7EB',
    borderRadius: 3, // was 4
    marginBottom: 10, // was 12
  },
  progressFill: {
    height: '100%',
    borderRadius: 3, // was 4
  },
  usageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageText: {
    fontSize: 13, // was 14
    color: '#1F2937',
    fontWeight: '500',
  },
  remainingText: {
    fontSize: 13, // was 14
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3, // was -4
  },
  alertCard: {
    borderLeftWidth: 3, // was 4
    borderLeftColor: '#F59E0B',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // was 8
  },
  alertTitle: {
    fontSize: 15, // was 16
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 6, // was 8
  },
  alertText: {
    fontSize: 13, // was 14
    color: '#92400E',
    lineHeight: 18, // was 20
  },
  sectionTitle: {
    fontSize: 13, // was 14
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6, // was 8
  },
  tipText: {
    fontSize: 13, // was 14
    color: '#4B5563',
    lineHeight: 18, // was 20
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14, // was 16
  },
  viewAllText: {
    fontSize: 13, // was 14
    color: '#2563EB',
    fontWeight: '500',
  },
  recentTrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // was 12
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tripInfo: {
    flex: 1,
  },
  tripDistance: {
    fontSize: 15, // was 16
    fontWeight: '600',
    color: '#1F2937',
  },
  tripDate: {
    fontSize: 11, // was 12
    color: '#6B7280',
    marginTop: 2,
  },
  tripStats: {
    alignItems: 'flex-end',
  },
  tripCost: {
    fontSize: 15, // was 16
    fontWeight: '600',
    color: '#2563EB',
  },
  tripEfficiency: {
    fontSize: 11, // was 12
    color: '#059669',
    marginTop: 2,
  },
  noDataText: {
    fontSize: 13, // was 14
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 18, // was 20
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6, // was 8
    marginBottom: 6, // was 8
  },
  summaryLabel: {
    fontSize: 10, // was 11
    color: '#6B7280',
    marginTop: 1,
  },
  summaryValue: {
    fontSize: 13, // was 14
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 1, // was 2
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14, // was 16
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6, // was 8
    marginBottom: 6, // was 8
  },
  savingsLabel: {
    fontSize: 12, // was 13
    color: '#6B7280',
    marginTop: 2,
  },
  savingsValue: {
    fontSize: 15, // was 16
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 3, // was 4
  },
  savingsScoreBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6, // was 8
    padding: 10, // was 12
    alignItems: 'center',
    marginLeft: 14, // was 16
  },
  savingsScoreLabel: {
    fontSize: 11, // was 12
    color: '#6B7280',
  },
  savingsScore: {
    fontSize: 20, // was 22
    fontWeight: 'bold',
    color: '#2563EB',
  },
  vehicleName: {
    fontSize: 14, // was 15
    color: '#1F2937',
    marginTop: 5, // was 6
    fontWeight: '600',
  },
  lastSync: {
    fontSize: 11, // was 12
    color: '#6B7280',
    marginBottom: 3, // was 4
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10, // was 12
  },
  quickActionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 6, // was 8
    paddingVertical: 8, // was 10
    paddingHorizontal: 10, // was 12
    marginHorizontal: 2,
    flex: 1,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12, // was 13
  },
  stationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5, // was 6
  },
  stationName: {
    fontSize: 15, // was 16
    color: '#1F2937',
    fontWeight: '600',
  },
  stationPrice: {
    fontSize: 15, // was 16
    color: '#059669',
    fontWeight: 'bold',
  },
  findFuelBtn: {
    backgroundColor: '#059669',
    borderRadius: 6, // was 8
    paddingVertical: 8, // was 10
    marginTop: 6, // was 8
    alignItems: 'center',
  },
  findFuelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13, // was 14
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // was 10
  },
  avatarBadgeCol: {
    alignItems: 'center',
    marginLeft: 8, // was 10
  },
  avatarCircle: {
    width: 40, // was 44
    height: 40, // was 44
    borderRadius: 20, // was 22
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3, // was 4
  },
  statusBadge: {
    borderRadius: 6, // was 8
    paddingHorizontal: 6, // was 8
    paddingVertical: 1, // was 2
    alignItems: 'center',
    marginTop: 2,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10, // was 11
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // was 2
    shadowOpacity: 0.06, // was 0.08
    shadowRadius: 4, // was 6
    elevation: 1, // was 2
    borderRadius: 10, // was 12
    marginBottom: 8, // was 10
    width: '100%',
    alignSelf: 'center',
  },
  summaryRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3, // was 4
    marginBottom: 3, // was 4
  },
  summaryStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  savingsCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 0,
  },
  savingsRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6, // was 8
    marginBottom: 6, // was 8
  },
  improvementBadge: {
    backgroundColor: '#059669',
    borderRadius: 6, // was 8
    paddingHorizontal: 6, // was 8
    paddingVertical: 1, // was 2
    alignSelf: 'flex-start',
    marginTop: 3, // was 4
  },
  improvementBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11, // was 12
  },
  quickActionsRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14, // was 16
  },
  quickActionBtnModern: {
    backgroundColor: '#2563EB',
    borderRadius: 10, // was 12
    paddingVertical: 14, // was 16
    paddingHorizontal: 6, // was 8
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3, // was 4
    flexDirection: 'column',
  },
  quickActionTextModern: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12, // was 13
    marginTop: 3, // was 4
  },
  recentTripModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // was 12
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tripIconCol: {
    marginRight: 8, // was 10
  },
  tripInfoModern: {
    flex: 1,
  },
  tripStatsModern: {
    alignItems: 'flex-end',
  },
  noTripsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, // was 24
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6, // was 8
  },
  vehicleDetails: {
    marginLeft: 10, // was 12
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 13, // was 14
    color: '#6B7280',
    marginTop: 2,
  },
  vehicleFuelType: {
    fontSize: 11, // was 12
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  noVehicleContainer: {
    alignItems: 'center',
    paddingVertical: 16, // was 20
  },
  noVehicleTitle: {
    fontSize: 15, // was 16
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 6, // was 8
  },
  noVehicleText: {
    fontSize: 13, // was 14
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 3, // was 4
    marginBottom: 14, // was 16
    lineHeight: 18, // was 20
  },
  addVehicleButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14, // was 16
    paddingVertical: 6, // was 8
    borderRadius: 5, // was 6
  },
  addVehicleButtonText: {
    color: '#FFFFFF',
    fontSize: 13, // was 14
    fontWeight: '500',
  },
  switchVehicleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10, // was 12
    paddingVertical: 4, // was 6
    borderRadius: 5, // was 6
    alignSelf: 'flex-start',
    marginTop: 6, // was 8
  },
  switchVehicleText: {
    color: '#2563EB',
    fontSize: 11, // was 12
    fontWeight: '500',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // was 8
  },
  vehiclePeriod: {
    fontSize: 11, // was 12
    color: '#6B7280',
    fontWeight: '500',
  },
  noVehicleSummary: {
    alignItems: 'center',
    paddingVertical: 10, // was 12
    marginTop: 6, // was 8
  },
  noVehicleSummaryText: {
    fontSize: 13, // was 14
    color: '#9CA3AF',
    textAlign: 'center',
  },
});