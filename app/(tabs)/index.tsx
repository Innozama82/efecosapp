import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { 
  Fuel, 
  Car, 
  TrendingUp, 
  TrendingDown, 
  Bluetooth, 
  TriangleAlert as AlertTriangle, 
  DollarSign, 
  Clock, 
  Gauge, 
  User as UserIcon, 
  MapPin, 
  Fuel as FuelIcon,
  RefreshCw
} from 'lucide-react-native';
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
    isInitializing,
    refreshUserData,
    syncWithWebApp
  } = useUser();
  
  const [isOBDConnected, setIsOBDConnected] = useState(false);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [drivingBehavior, setDrivingBehavior] = useState<DrivingBehavior | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Dashboard state
  const [tripStatus, setTripStatus] = useState('Not Connected to Vehicle');
  const [fuelTip] = useState(
    "Maintain steady speeds between 50-80 km/h on highways. This optimal range can improve your fuel efficiency by up to 15%."
  );
  const [nearestStation] = useState({ name: 'Total Fuel', price: 6.80 });
  const [alerts, setAlerts] = useState<string[]>([]);

  const loadDashboardData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      if (!user?.id) {
        console.log('No user ID available, showing dashboard with limited functionality');
        setRecentTrips([]);
        setDrivingBehavior(null);
        setAlerts([]);
        setLoadError(null);
        return;
      }

      console.log('Loading dashboard data for user:', user.id, user.type);
      
      // Load data in parallel
      const [trips, behavior, budgetAlerts] = await Promise.all([
        dataService.getTrips(user.id).catch(err => {
          console.error('Error loading trips:', err);
          return [];
        }),
        dataService.getDrivingBehavior(user.id).catch(err => {
          console.error('Error loading driving behavior:', err);
          return null;
        }),
        dataService.getBudgetAlerts(user.id).catch(err => {
          console.error('Error loading budget alerts:', err);
          return [];
        }),
      ]);

      setRecentTrips(trips.slice(0, 3));
      setDrivingBehavior(behavior);
      setAlerts(budgetAlerts);
      setLoadError(null);
      setLastSyncTime(new Date());
      
      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoadError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, user?.type]);

  // Sync with web app
  const handleSyncWithWebApp = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await syncWithWebApp();
      await loadDashboardData(false);
      Alert.alert('Sync Complete', 'Your data has been synchronized with the web application.');
    } catch (error) {
      console.error('Error syncing with web app:', error);
      Alert.alert('Sync Failed', 'Failed to sync with web application. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [syncWithWebApp, loadDashboardData]);

  // Trip status logic
  useEffect(() => {
    if (!activeVehicle) {
      setTripStatus('No Vehicle Selected');
    } else if (isOBDConnected) {
      setTripStatus(`Connected to ${activeVehicle.make} ${activeVehicle.model}`);
    } else {
      setTripStatus(`Ready to connect to ${activeVehicle.make} ${activeVehicle.model}`);
    }
  }, [isOBDConnected, activeVehicle]);

  // Load dashboard data on mount and when user changes
  useEffect(() => {
    if (!isInitializing) {
      const timer = setTimeout(() => {
        loadDashboardData();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loadDashboardData, isInitializing]);

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

  // Calculate statistics
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

  const onRefresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

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
        <AlertTriangle size={48} color="#DC2626" />
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
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
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
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with User Info and Sync */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            Welcome back, {user.name}
          </Text>
          <Text style={styles.userType}>
            {isBusinessUser ? `Driver • ${user.companyName || 'Company'}` : 'Citizen Account'}
          </Text>
          {lastSyncTime && (
            <Text style={styles.lastSync}>
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
        <View style={styles.avatarBadgeCol}>
          <TouchableOpacity onPress={handleSyncWithWebApp} style={styles.syncButton}>
            <RefreshCw size={16} color="#2563EB" />
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <UserIcon color="#2563EB" size={28} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOBDConnected ? '#059669' : '#DC2626' }]}> 
            <Text style={styles.statusBadgeText}>{isOBDConnected ? 'Connected' : 'Offline'}</Text>
          </View>
        </View>
      </View>

      {/* Daily Tip */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <Text style={styles.sectionTitle}>💡 Daily Fuel-Saving Tip</Text>
        <Text style={styles.tipText}>{fuelTip}</Text>
      </Card>

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
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Fuel Usage Summary */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <View style={styles.summaryHeader}>
          <Text style={styles.sectionTitle}>
            {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model} Usage` : 'Fuel Usage Summary'}
          </Text>
          {activeVehicle && (
            <Text style={styles.vehiclePeriod}>This Month</Text>
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
            <Text style={[styles.summaryValue, { color: avgEfficiency > 15 ? '#059669' : avgEfficiency > 10 ? '#F59E0B' : '#DC2626' }]}>
              {avgEfficiency > 0 ? avgEfficiency.toFixed(1) : '--'} km/L
            </Text>
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

      {/* Budget/Limit Status */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageTitle}>
            {isBusinessUser ? 'Monthly Fuel Limit' : 'Monthly Budget'}
          </Text>
          <Text style={[styles.usagePercentage, { color: getUsageColor(usagePercentage) }]}>
            {usagePercentage.toFixed(0)}%
          </Text>
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
          <Text style={styles.usageText}>
            E{monthlyUsage.toFixed(2)} of E{isBusinessUser ? monthlyLimit : personalBudget}
          </Text>
          <Text style={styles.remainingText}>
            E{(isBusinessUser ? monthlyLimit - monthlyUsage : personalBudget - monthlyUsage).toFixed(2)} remaining
          </Text>
        </View>
        {isBusinessUser && (
          <Text style={styles.businessNote}>
            Budget managed by your company administrator
          </Text>
        )}
      </Card>

      {/* Alerts */}
      {alerts.map((alert, idx) => (
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

      {/* Nearest Fuel Station */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <Text style={styles.sectionTitle}>Nearest Fuel Station</Text>
        <View style={styles.stationRow}>
          <MapPin color="#059669" size={20} />
          <Text style={styles.stationName}>{nearestStation.name}</Text>
          <Text style={styles.stationPrice}>E{nearestStation.price.toFixed(2)}/L</Text>
        </View>
        <TouchableOpacity 
          style={styles.findFuelBtn}
          onPress={() => router.push('/(tabs)/fuel-log')}
        >
          <Text style={styles.findFuelText}>Find Fuel Stations Nearby</Text>
        </TouchableOpacity>
      </Card>

      {/* Quick Actions */}
      <Card style={StyleSheet.flatten([styles.cardShadow])}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/trips')}
          >
            <MapPin size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Start Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/fuel-log')}
          >
            <Fuel size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Log Fuel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/fuel-prices')}
          >
            <DollarSign size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Fuel Prices</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={handleSyncWithWebApp}
          >
            <RefreshCw size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Sync Data</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
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
    marginTop: 16,
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
    marginVertical: 20,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  lastSync: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  avatarBadgeCol: {
    alignItems: 'center',
    marginLeft: 16,
  },
  syncButton: {
    padding: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderRadius: 12,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1F2937',
  },
  connectButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  vehicleDetails: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  vehicleFuelType: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  switchVehicleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  switchVehicleText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  obdMessage: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
  },
  noVehicleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noVehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  noVehicleText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  addVehicleButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addVehicleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehiclePeriod: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  summaryStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noVehicleSummary: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  noVehicleSummaryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  usagePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  remainingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  businessNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  stationName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  stationPrice: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
  findFuelBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  findFuelText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  quickActionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    flex: 1,
    margin: 4,
    minWidth: '45%',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
});