import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { 
  User, 
  Car, 
  Building, 
  Settings, 
  Bell, 
  Shield, 
  CircleHelp as HelpCircle, 
  LogOut, 
  CreditCard as Edit, 
  Plus,
  Mail,
  Phone,
  Globe,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { BudgetModal } from '@/components/BudgetModal';
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
    isBusinessUser, 
    logout, 
    isLoggingOut, 
    isTrackingTrip,
    monthlyUsage,
    monthlyLimit,
    personalBudget,
    updateMonthlyUsage,
    updatePersonalBudget,
    updateMonthlyLimit
  } = useUser();
  
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [drivingBehavior, setDrivingBehavior] = useState<any>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Load driving behavior data
  useEffect(() => {
    if (user?.id) {
      loadDrivingBehavior();
    }
  }, [user?.id]);

  const loadDrivingBehavior = async () => {
    try {
      const behavior = await dataService.getDrivingBehavior(user!.id);
      setDrivingBehavior(behavior);
    } catch (error) {
      console.error('Error loading driving behavior:', error);
    }
  };

  const handleUserTypeSwitch = () => {
    Alert.alert(
      'Switch Account Type',
      'This feature allows you to switch between Driver and Citizen accounts. This will require approval from your administrator.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            Alert.alert(
              'Request Submitted',
              'Your request to switch account type has been submitted. You will be notified once approved.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
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
              'This would open a form to edit your name, email, and other personal details.',
              [{ text: 'OK' }]
            );
          }
        },
        { 
          text: 'Budget Settings', 
          onPress: () => {
            Alert.alert(
              'Edit Budget',
              'This would open a form to edit your monthly fuel budget.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleAddVehicle = () => {
    Alert.alert(
      'Add Vehicle',
      'Register a new vehicle to track fuel consumption and trips.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Vehicle', 
          onPress: () => {
            // Create a sample vehicle for demo purposes
            const sampleVehicle = {
              userId: user?.id || '',
              make: 'Toyota',
              model: 'Camry',
              year: 2020,
              licensePlate: 'ABC123',
              fuelType: 'gasoline' as const,
              isActive: vehicles.length === 0, // First vehicle becomes active
            };
            
            addVehicle(sampleVehicle).then(() => {
              Alert.alert(
                'Vehicle Added',
                'Your vehicle has been added successfully! You can now use it for trips.',
                [{ text: 'OK' }]
              );
            }).catch((error) => {
              Alert.alert(
                'Error',
                'Failed to add vehicle. Please try again.',
                [{ text: 'OK' }]
              );
            });
          }
        }
      ]
    );
  };

  const handleEditBudget = () => {
    setShowBudgetModal(true);
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

  const handleNotificationToggle = (value: boolean) => {
    setNotifications(value);
    Alert.alert(
      'Notifications',
      value ? 'Push notifications enabled' : 'Push notifications disabled',
      [{ text: 'OK' }]
    );
  };

  const handleLocationToggle = (value: boolean) => {
    setLocationSharing(value);
    Alert.alert(
      'Location Sharing',
      value ? 'Location sharing enabled' : 'Location sharing disabled',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'FAQ', 
          onPress: () => {
            Alert.alert(
              'FAQ',
              'This would open the FAQ section with common questions and answers.',
              [{ text: 'OK' }]
            );
          }
        },
        { 
          text: 'Contact Support', 
          onPress: () => {
            Alert.alert(
              'Contact Support',
              'This would open contact options including email and phone support.',
              [{ text: 'OK' }]
            );
          }
        },
        { 
          text: 'Report Issue', 
          onPress: () => {
            Alert.alert(
              'Report Issue',
              'This would open a form to report bugs or issues.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleAppSettings = () => {
    Alert.alert(
      'App Settings',
      'Configure app preferences and permissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Permissions', 
          onPress: () => {
            Alert.alert(
              'Permissions',
              'This would open device permissions settings.',
              [{ text: 'OK' }]
            );
          }
        },
        { 
          text: 'Data & Storage', 
          onPress: () => {
            Alert.alert(
              'Data & Storage',
              'This would open data usage and storage settings.',
              [{ text: 'OK' }]
            );
          }
        },
        { 
          text: 'Privacy', 
          onPress: () => {
            Alert.alert(
              'Privacy Settings',
              'This would open privacy and data sharing settings.',
              [{ text: 'OK' }]
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

  const handleVehiclePress = (vehicle: any) => {
    Alert.alert(
      'Vehicle Options',
      `What would you like to do with your ${vehicle.year} ${vehicle.make} ${vehicle.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set as Active', 
          onPress: () => {
            setActiveVehicle(vehicle);
            Alert.alert('Success', 'Vehicle set as active');
          }
        },
        { 
          text: 'Edit Details', 
          onPress: () => {
            Alert.alert(
              'Edit Vehicle',
              'This would open a form to edit vehicle details.',
              [{ text: 'OK' }]
            );
          }
        },
        { 
          text: 'View History', 
          onPress: () => {
            Alert.alert(
              'Vehicle History',
              'This would show fuel logs and trips for this vehicle.',
              [{ text: 'OK' }]
            );
          }
        }
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Edit size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <Card>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={40} color="#FFFFFF" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
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
              <Text style={styles.companyName}>{user?.companyName || 'Company Name'}</Text>
              <Text style={styles.companyRole}>Driver</Text>
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
          <TouchableOpacity style={styles.editBudgetButton} onPress={handleEditBudget}>
            <Text style={styles.editBudgetText}>Edit Limit</Text>
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
          <TouchableOpacity style={styles.editBudgetButton} onPress={handleEditBudget}>
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
              <Text style={styles.behaviorValue}>{drivingBehavior.fuelEfficiencyScore}%</Text>
            </View>
            <View style={styles.behaviorItem}>
              <Text style={styles.behaviorLabel}>Overall Score</Text>
              <Text style={styles.behaviorValue}>{drivingBehavior.overallScore}%</Text>
            </View>
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
            onValueChange={handleNotificationToggle}
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
            onValueChange={handleLocationToggle}
            trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
            thumbColor={locationSharing ? '#FFFFFF' : '#F3F4F6'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleUserTypeSwitch}>
          <View style={styles.settingInfo}>
            <Settings size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>Switch Account Type</Text>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </Card>

      {/* Help & Support */}
      <Card>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
          <View style={styles.settingInfo}>
            <HelpCircle size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>FAQ & Help</Text>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleAppSettings}>
          <View style={styles.settingInfo}>
            <Settings size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>App Settings</Text>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            Alert.alert(
              'Contact Support',
              'How would you like to contact support?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Email', 
                  onPress: () => {
                    Linking.openURL('mailto:support@fueltracker.com');
                  }
                },
                { 
                  text: 'Phone', 
                  onPress: () => {
                    Linking.openURL('tel:+1234567890');
                  }
                }
              ]
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Mail size={20} color="#6B7280" />
            <Text style={styles.settingLabel}>Contact Support</Text>
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
        <Text style={styles.footerText}>FuelTracker v1.0.0</Text>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Privacy Policy',
              'This would open the privacy policy document.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Modal */}
      <BudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onSave={handleSaveBudget}
        currentBudget={isBusinessUser ? monthlyLimit : personalBudget}
        isBusinessUser={isBusinessUser}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  companyDetails: {
    marginLeft: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  companyRole: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#1F2937',
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
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
});