import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Plus, Camera, MapPin, Calendar, Fuel, Navigation } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { FuelLogCard } from '@/components/FuelLogCard';
import { useUser } from '@/contexts/UserContext';
import { dataService } from '@/services/dataService';
import { FuelLog } from '@/types';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

export default function FuelLogScreen() {
  const { user, activeVehicle, isBusinessUser } = useUser();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    station: '',
    liters: '',
    pricePerLiter: '',
    odometer: '',
    receiptImage: '', // add receipt image field
  });
  const [location, setLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'Current Location, Mbabane, Hhohho',
  });
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState({
    latitude: -26.3167,
    longitude: 31.1333,
  });
  const [fuelStations, setFuelStations] = useState([
    {
      id: 1,
      name: 'Shell Station',
      latitude: -26.3167,
      longitude: 31.1333,
      price: 680,
      distance: '0.5 km',
    },
    {
      id: 2,
      name: 'Total Fuel',
      latitude: -26.3200,
      longitude: 31.1400,
      price: 675,
      distance: '1.2 km',
    },
    {
      id: 3,
      name: 'Engen Station',
      latitude: -26.3100,
      longitude: 31.1250,
      price: 690,
      distance: '0.8 km',
    },
  ]);

  const loadFuelLogs = useCallback(async () => {
    if (!user?.id) return;

    try {
      const logs = await dataService.getFuelLogs(user.id);
      setFuelLogs(logs.sort((a, b) => b.date.getTime() - a.date.getTime()));
    } catch (error) {
      console.error('Error loading fuel logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFuelLogs();
  }, [loadFuelLogs]);

  const resetForm = () => {
    setFormData({
      station: '',
      liters: '',
      pricePerLiter: '',
      odometer: '',
      receiptImage: '',
    });
    setLocation({
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'Current Location, Mbabane, Hhohho',
    });
  };

  // Placeholder for image picker
  const handlePickImage = async () => {
    // TODO: Implement image picker logic
    Alert.alert('Coming Soon', 'Receipt photo upload will be available soon.');
  };

  // Get user location
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby fuel stations.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setUserLocation(newLocation);
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });
      
      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        setLocation({
          ...newLocation,
          address: `${address.street || 'Current Location'}, ${address.city || 'Unknown'}, ${address.region || ''}`,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location.');
    }
  };

  // Placeholder for location picker
  const handlePickLocation = async () => {
    await getUserLocation();
  };

  const handleSubmit = async () => {
    if (!activeVehicle || !user) {
      Alert.alert('Error', 'Please select a vehicle first.');
      return;
    }

    const { station, liters, pricePerLiter, odometer, receiptImage } = formData;

    if (!station || !liters || !pricePerLiter || !odometer) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const litersNum = parseFloat(liters);
    const priceNum = parseFloat(pricePerLiter);
    const odometerNum = parseInt(odometer);
    const totalCost = litersNum * priceNum;

    const newLog: Omit<FuelLog, 'id'> = {
      userId: user.id,
      vehicleId: activeVehicle.id,
      date: new Date(),
      station,
      liters: litersNum,
      pricePerLiter: priceNum,
      totalCost,
      odometer: odometerNum,
      receiptImage: receiptImage || undefined,
      location,
      requiresApproval: isBusinessUser,
      approvalStatus: isBusinessUser ? 'pending' : undefined,
    };

    try {
      const savedLog = await dataService.addFuelLog(newLog);
      setFuelLogs([savedLog, ...fuelLogs]);
      // Note: Monthly usage is now calculated automatically from trips
      // No need to manually update it here
      resetForm();
      setIsModalVisible(false);
      Alert.alert(
        'Success',
        isBusinessUser
          ? 'Fuel log submitted for approval.'
          : 'Fuel log added successfully!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save fuel log.');
    }
  };

  const totalSpent = fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
  const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0);
  const avgPrice = totalLiters > 0 ? totalSpent / totalLiters : 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading fuel logs...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Fuel Log</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.mapButton, showMap && styles.mapButtonActive]}
              onPress={() => {
                setShowMap(!showMap);
                if (!showMap) {
                  getUserLocation();
                }
              }}
            >
              <Navigation size={20} color={showMap ? "#FFFFFF" : "#2563EB"} />
              <Text style={[styles.mapButtonText, showMap && styles.mapButtonTextActive]}>
                {showMap ? 'Hide Map' : 'Show Map'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map View with OpenStreetMap */}
        {showMap && (
          <Card style={styles.mapCard}>
            <Text style={styles.mapTitle}>Nearby Fuel Stations</Text>
            <MapView
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              mapType="standard"
            >
              {fuelStations.map((station) => (
                <Marker
                  key={station.id}
                  coordinate={{
                    latitude: station.latitude,
                    longitude: station.longitude,
                  }}
                  title={station.name}
                  description={`E${station.price}/L • ${station.distance}`}
                  pinColor="#059669"
                />
              ))}
            </MapView>
            <View style={styles.stationList}>
              {fuelStations.map((station) => (
                <TouchableOpacity
                  key={station.id}
                  style={styles.stationItem}
                  onPress={() => {
                    Alert.alert(
                      station.name,
                      `Price: E${station.price}/L\nDistance: ${station.distance}\n\nWould you like to navigate to this station?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Navigate', onPress: () => {
                          Alert.alert('Navigation', 'Opening navigation app...');
                        }},
                      ]
                    );
                  }}
                >
                  <View style={styles.stationInfo}>
                    <Text style={styles.stationName}>{station.name}</Text>
                    <Text style={styles.stationDistance}>{station.distance}</Text>
                  </View>
                  <Text style={styles.stationPrice}>E{station.price}/L</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>E{totalSpent.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{totalLiters.toFixed(1)}L</Text>
            <Text style={styles.statLabel}>Total Fuel</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>E{avgPrice.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg Price/L</Text>
          </Card>
        </View>

        {/* Fuel Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          {fuelLogs.length > 0 ? (
            fuelLogs.map((log) => (
              <FuelLogCard
                key={log.id}
                log={log}
                onPress={() => {
                  Alert.alert('Log Details', 'This would show detailed log information.');
                }}
              />
            ))
          ) : (
            <Card>
              <View style={styles.noLogs}>
                <Fuel size={48} color="#9CA3AF" />
                <Text style={styles.noLogsTitle}>No fuel logs yet</Text>
                <Text style={styles.noLogsText}>
                  Add your first fuel purchase to start tracking expenses
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Add Log Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setIsModalVisible(false);
              resetForm();
            }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Fuel Log</Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Station Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.station}
                onChangeText={(text) => setFormData({ ...formData, station: text })}
                placeholder="e.g., Shell Station"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Liters *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.liters}
                  onChangeText={(text) => setFormData({ ...formData, liters: text })}
                  placeholder="0.0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Price per Liter *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pricePerLiter}
                  onChangeText={(text) => setFormData({ ...formData, pricePerLiter: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Odometer Reading *</Text>
              <TextInput
                style={styles.input}
                value={formData.odometer}
                onChangeText={(text) => setFormData({ ...formData, odometer: text })}
                placeholder="12345"
                keyboardType="numeric"
              />
            </View>

            {formData.liters && formData.pricePerLiter && (
              <Card style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Cost</Text>
                <Text style={styles.totalValue}>
                  E{(parseFloat(formData.liters || '0') * parseFloat(formData.pricePerLiter || '0')).toFixed(2)}
                </Text>
              </Card>
            )}

            <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
              <Camera size={20} color="#6B7280" />
              <Text style={styles.photoButtonText}>Add Receipt Photo</Text>
            </TouchableOpacity>

            <View style={styles.locationContainer}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.locationText} onPress={handlePickLocation}>{location.address}</Text>
            </View>

            {isBusinessUser && (
              <Card style={styles.businessNote}>
                <Text style={styles.businessNoteText}>
                  This log will be submitted for approval to your company administrator.
                </Text>
              </Card>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  mapButtonActive: {
    backgroundColor: '#2563EB',
  },
  mapButtonText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  mapButtonTextActive: {
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  noLogs: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noLogsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  noLogsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  totalCard: {
    backgroundColor: '#F0F9FF',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    marginBottom: 20,
  },
  photoButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  businessNote: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  businessNoteText: {
    fontSize: 14,
    color: '#92400E',
  },
  mapCard: {
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  map: {
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  stationList: {
    gap: 8,
  },
  stationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  stationDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stationPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
});