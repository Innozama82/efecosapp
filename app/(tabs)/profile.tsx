import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { User, Car, Building, Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, CreditCard as Edit, Plus, ChevronRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw, Database } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { BudgetModal } from '@/components/BudgetModal';
import VehicleModal from '@/components/VehicleModal';
import { useUser } from '@/contexts/UserContext';
import { router } from 'expo-router';
import { dataService } from '@/services/dataService';

export default function Profile() {
  const { 
    user, 
    vehicles, 
    activeVehicle, 
    setActiveVehicle, 
    addVehicle,
    updateVehicle,
    deleteVehicle,
    isBusinessUser, 
    logout, 
    isLoggingOut, 
    isTrackingTrip,
    monthlyUsage,
    monthlyLimit,
    personalBudget,
    updatePersonalBudget,
    updateMonthlyLimit,
    refreshUserData,
    syncWithWebApp
  } = useUser();
  
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drivingBehavior, setDrivingBehavior] = useState<any>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [businessDetails, setBusinessDetails] = useState<any>(null);

  // Load additional profile data
  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    try {
      const [behavior, businessData] = await Promise.all([
        dataService.getDrivingBehavior(user!.id),
        isBusinessUser ? dataService.getBusinessUserDetails(user!.id) : Promise.resolve(null),
      ]);
      
      setDrivingBehavior(behavior);
      setBusinessDetails(businessData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserData();
      await loadProfileData();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncWithWebApp = async () => {
    try {
      setIsLoading(true);
      await syncWithWebApp();
      await loadProfileData();
      Alert.alert('Sync Complete', 'Your profile has been synchronized with the web application.');
    } catch (error) {
      console.error('Error syncing with web app:', error);
      Alert.alert('Sync Failed', 'Failed to sync with web application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'What would you like to edit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Personal Info', 
          onPress: () => {
            Alert.alert(
              'Edit Personal Information',
              'This feature will be available in a future update. You can edit your profile from the web application.',
              [{ text: 'OK' }]
            );
          }
        },
        { 
          text: 'Budget Settings', 
          onPress: () => setShowBudgetModal(true)
        }
      ]
    );
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setShowVehicleModal(true);
  };

  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async (vehicleData: any) => {
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
        Alert.alert('Success', 'Vehicle updated successfully!');
      } else {
        await addVehicle(vehicleData);
        Alert.alert('Success', 'Vehicle added successfully!');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', 'Failed to save vehicle. Please try again.');
      throw error;
    }
  };

  const handleSaveBudget = async (budget: number) => {
    try {
      if (isBusinessUser) {
        await updateMonthlyLimit(budget);
      } else {
        await updatePersonalBudget(budget);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  };

  const handleVehiclePress = (vehicle: any) => {
    Alert.alert(
      'Vehicle Options',
      `What would you like to do with your ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set as Active', 
          onPress: async () => {
            try {
              await dataService.setActiveVehicle(user!.id, vehicle.id);
              setActiveVehicle(vehicle);
              Alert.alert('Success', 'Vehicle set as active');
            } catch (error) {
              Alert.alert('Error', 'Failed to set vehicle as active');
            }
          }
        },
        { 
          text: 'Edit Details', 
          onPress: () => handleEditVehicle(vehicle)
        },
        { 
          text: 'Delete Vehicle', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Vehicle',
              `Are you sure you want to delete ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteVehicle(vehicle.id);
                      Alert.alert('Success', 'Vehicle deleted successfully');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete vehicle');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    const message = isTrackingTrip 
      ? 'You are currently tracking a trip. Signing out will stop the trip tracking. Are you sure you want to sign out?'
      : 'Are you sure you want to sign out? You will need to sign in again to access your account.';
    
    Alert.alert(
      'Sign Out',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              setIsLoading(true);
              await logout();
            } catch (error) {
              Alert.alert(
                'Sign Out Error',
                'There was an issue signing out. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const getBudgetProgress = () => {
    if (isBusinessUser) {
      return monthlyLimit > 0 ? (monthlyUsage / monthlyLimit) * 100 : 0;
    } else {
      return personalBudget > 0 ? (monthlyUsage / personalBudget) * 100 : 0;
    }
  };

  const getBudgetStatus = () => {
    const progress = getBudgetProgress();
    if (progress >= 90) return 'danger';
    if (progress >= 75) return 'warning';
    return 'good';
  };

  const getBudgetStatusColor = () => {
    const status = getBudgetStatus();
    switch (status) {
      case 'danger': return '#DC2626';
      case 'warning': return '#F59E0B';
      default: return '#059669';
    }
  };

  const getBudgetStatusIcon = () => {
    const status = getBudgetStatus();
    switch (status) {
      case 'danger': return <XCircle size={16} color="#DC2626" />;
      case 'warning': return <AlertCircle size={16} color="#F59E0B" />;
      default: return <CheckCircle size={16} color="#059669" />;
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.syncButton} 
            onPress={handleSyncWithWebApp}
            disabled={isLoading}
          >
            <Database size={16} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Edit size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info */}
      <Card>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={40} color="#FFFFFF" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.userTypeContainer}>
              {isBusinessUser ? (
                <>
                  <Building size={14} color="#2563EB" />
                  <Text style={styles.userType}>Driver</Text>
                </>
              ) : (
                <>
                  <User size={14} color="#059669" />
                  <Text style={styles.userType}>Citizen</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Business Info (if business user) */}
      {isBusinessUser && (
        <Card>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.companyInfo}>
            <Building size={20} color="#6B7280" />
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>
                {user.companyName || businessDetails?.business?.name || 'Company Name'}
              </Text>
              <Text style={styles.companyRole}>Driver</Text>
              {businessDetails?.permissions && (
                <Text style={styles.permissions}>
                  Permissions: {businessDetails.permissions.join(', ')}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.budgetInfo}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Monthly Fuel Limit</Text>
              {getBudgetStatusIcon()}
            </View>
            <View style={styles.budgetProgress}>
              <View style={styles.budgetValues}>
                <Text style={styles.budgetValue}>E{monthlyUsage.toFixed(2)}</Text>
                <Text style={styles.budgetTotal}>/ E{monthlyLimit.toFixed(2)}</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(getBudgetProgress(), 100)}%`,
                      backgroundColor: getBudgetStatusColor()
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editBudgetButton} onPress={() => setShowBudgetModal(true)}>
            <Text style={styles.editBudgetText}>Request Limit Change</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Personal Budget (if citizen) */}
      {!isBusinessUser && (
        <Card>
          <Text style={styles.sectionTitle}>Budget Settings</Text>
          <View style={styles.budgetInfo}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Monthly Fuel Budget</Text>
              {getBudgetStatusIcon()}
            </View>
            <View style={styles.budgetProgress}>
              <View style={styles.budgetValues}>
                <Text style={styles.budgetValue}>E{monthlyUsage.toFixed(2)}</Text>
                <Text style={styles.budgetTotal}>/ E{personalBudget.toFixed(2)}</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(getBudgetProgress(), 100)}%`,
                      backgroundColor: getBudgetStatusColor()
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editBudgetButton} onPress={() => setShowBudgetModal(true)}>
            <Text style={styles.editBudgetText}>Edit Budget</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Driving Behavior */}
      {drivingBehavior && (
        <Card>
          <Text style={styles.sectionTitle}>Driving Behavior</Text>
          <View style={styles.behaviorGrid}>
            <View style={styles.behaviorItem}>
              <Text style={styles.behaviorLabel}>Efficiency Score</Text>
              <Text style={[styles.behaviorValue, { color: drivingBehavior.fuelEfficiencyScore >= 80 ? '#059669' : '#F59E0B' }]}>
                {drivingBehavior.fuelEfficiencyScore}%
              </Text>
            </View>
            <View style={styles.behaviorItem}>
              <Text style={styles.behaviorLabel}>Overall Score</Text>
              <Text style={[styles.behaviorValue, { color: drivingBehavior.overallScore >= 80 ? '#059669' : '#F59E0B' }]}>
                {drivingBehavior.overallScore}%
              </Text>
            </View>
          </View>
          <View style={styles.behaviorDetails}>
            <Text style={styles.behaviorDetailText}>
              Aggressive Acceleration: {drivingBehavior.aggressiveAcceleration} events
            </Text>
            <Text style={styles.behaviorDetailText}>
              Hard Braking: {drivingBehavior.hardBraking} events
            </Text>
            <Text style={styles.behaviorDetailText}>
              Excessive Idling: {drivingBehavior.excessiveIdling} minutes
            </Text>
          </View>
        </Card>
      )}

      {/* Vehicles */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          <TouchableOpacity style={styles.addVehicleButton} onPress={handleAddVehicle}>
            <Plus size={16} color="#2563EB" />
            <Text style={styles.addVehicleText}>Add</Text>
          </TouchableOpacity>
        </View>
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleItem,
                activeVehicle?.id === vehicle.id && styles.activeVehicle,
              ]}
              onPress={() => handleVehiclePress(vehicle)}
            >
              <Car size={20} color={activeVehicle?.id === vehicle.id ? '#2563EB' : '#6B7280'} />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                <Text style={styles.vehicleFuelType}>
                  {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
                </Text>
              </View>
              {activeVehicle?.id === vehicle.id && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              )}
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Car size={32} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No vehicles added yet</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddVehicle}>
              <Text style={styles.emptyStateButtonText}>Add Your First Vehicle</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Settings */}
      <Card>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Bell size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={(value) => {
              setNotifications(value);
              Alert.alert(
                'Notifications',
                value ? 'Push notifications enabled' : 'Push notifications disabled',
                [{ text: 'OK' }]
              );
            }}
            trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
            thumbColor={notifications ? '#FFFFFF' : '#F3F4F6'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Shield size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>Location Sharing</Text>
          </View>
          <Switch
            value={locationSharing}
            onValueChange={(value) => {
              setLocationSharing(value);
              Alert.alert(
                'Location Sharing',
                value ? 'Location sharing enabled' : 'Location sharing disabled',
                [{ text: 'OK' }]
              );
            }}
            trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
            thumbColor={locationSharing ? '#FFFFFF' : '#F3F4F6'}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={handleSyncWithWebApp}
          disabled={isLoading}
        >
          <View style={styles.settingInfo}>
            <RefreshCw size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>Sync with Web App</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <ChevronRight size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>
      </Card>

      {/* Help & Support */}
      <Card>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => {
            Alert.alert(
              'FAQ & Help',
              'This would open the help section with frequently asked questions.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={styles.settingInfo}>
            <HelpCircle size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>FAQ & Help</Text>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => {
            Alert.alert(
              'App Settings',
              'This would open device-specific app settings.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Settings size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>App Settings</Text>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </Card>

      {/* Logout */}
      <TouchableOpacity 
        style={[styles.logoutButton, (isLoggingOut || isLoading) && styles.logoutButtonDisabled]} 
        onPress={handleLogout}
        disabled={isLoggingOut || isLoading}
      >
        {(isLoggingOut || isLoading) ? (
          <ActivityIndicator size="small" color="#9CA3AF" />
        ) : (
          <LogOut size={20} color="#DC2626" />
        )}
        <Text style={[styles.logoutText, (isLoggingOut || isLoading) && styles.logoutTextDisabled]}>
          {(isLoggingOut || isLoading) ? 'Signing Out...' : 'Sign Out'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>EFECOS Mobile v1.0.0</Text>
        <Text style={styles.footerText}>
          Account Type: {isBusinessUser ? 'Driver' : 'Citizen'}
        </Text>
      </View>

      {/* Modals */}
      <BudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSave={handleSaveBudget}
        currentBudget={isBusinessUser ? monthlyLimit : personalBudget}
        isBusinessUser={isBusinessUser}
      />

      <VehicleModal
        visible={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false);
          setEditingVehicle(null);
        }}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
        isEditing={!!editingVehicle}
      />
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
    marginTop: 16,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    padding: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  editButton: {
    padding: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  userType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyDetails: {
    marginLeft: 12,
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  companyRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  permissions: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  budgetInfo: {
    marginTop: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  budgetProgress: {
    marginTop: 8,
  },
  budgetValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
  budgetTotal: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  editBudgetButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  editBudgetText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  behaviorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  behaviorItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  behaviorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  behaviorValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  behaviorDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  behaviorDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addVehicleText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 4,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeVehicle: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
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
  activeIndicator: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  activeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  logoutText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutTextDisabled: {
    color: '#9CA3AF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
});