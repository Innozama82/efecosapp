import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Car, Save, CreditCard as Edit } from 'lucide-react-native';
import { Vehicle } from '@/types';

interface VehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  vehicle?: Vehicle | null;
  isEditing?: boolean;
}

export default function VehicleModal({ 
  visible, 
  onClose, 
  onSave, 
  vehicle, 
  isEditing = false 
}: VehicleModalProps) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    fuelType: 'gasoline' as Vehicle['fuelType'],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle && isEditing) {
      setFormData({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
        licensePlate: vehicle.licensePlate,
        fuelType: vehicle.fuelType,
      });
    } else {
      setFormData({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        fuelType: 'gasoline',
      });
    }
    setErrors({});
  }, [vehicle, isEditing, visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else {
      const year = parseInt(formData.year);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        newErrors.year = 'Please enter a valid year';
      }
    }
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const vehicleData: Omit<Vehicle, 'id'> = {
        userId: '', // Will be set by the context
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        fuelType: formData.fuelType,
        isActive: false, // Will be set by the context
      };

      await onSave(vehicleData);
      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', 'Failed to save vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const fuelTypes = [
    { value: 'gasoline', label: 'Gasoline' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'electric', label: 'Electric' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Car size={24} color="#2563EB" />
            <Text style={styles.title}>
              {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            disabled={isLoading}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            {isEditing 
              ? 'Update your vehicle information below.'
              : 'Add a new vehicle to track fuel consumption and trips.'
            }
          </Text>

          {/* Make */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make *</Text>
            <TextInput
              style={[styles.input, errors.make && styles.inputError]}
              value={formData.make}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, make: text }));
                if (errors.make) {
                  setErrors(prev => ({ ...prev, make: '' }));
                }
              }}
              placeholder="e.g., Toyota, Honda, Ford"
              autoCapitalize="words"
              editable={!isLoading}
            />
            {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
          </View>

          {/* Model */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={[styles.input, errors.model && styles.inputError]}
              value={formData.model}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, model: text }));
                if (errors.model) {
                  setErrors(prev => ({ ...prev, model: '' }));
                }
              }}
              placeholder="e.g., Camry, Civic, F-150"
              autoCapitalize="words"
              editable={!isLoading}
            />
            {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
          </View>

          {/* Year */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              value={formData.year}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, year: text }));
                if (errors.year) {
                  setErrors(prev => ({ ...prev, year: '' }));
                }
              }}
              placeholder="e.g., 2020"
              keyboardType="numeric"
              maxLength={4}
              editable={!isLoading}
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>

          {/* License Plate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Plate *</Text>
            <TextInput
              style={[styles.input, errors.licensePlate && styles.inputError]}
              value={formData.licensePlate}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, licensePlate: text }));
                if (errors.licensePlate) {
                  setErrors(prev => ({ ...prev, licensePlate: '' }));
                }
              }}
              placeholder="e.g., ABC123"
              autoCapitalize="characters"
              editable={!isLoading}
            />
            {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
          </View>

          {/* Fuel Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fuel Type</Text>
            <View style={styles.fuelTypeContainer}>
              {fuelTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.fuelTypeButton,
                    formData.fuelType === type.value && styles.fuelTypeButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, fuelType: type.value as Vehicle['fuelType'] }))}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.fuelTypeText,
                    formData.fuelType === type.value && styles.fuelTypeTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Vehicle Preview</Text>
            <View style={styles.previewContent}>
              <Car size={32} color="#2563EB" />
              <View style={styles.previewText}>
                <Text style={styles.previewVehicle}>
                  {formData.year || 'YYYY'} {formData.make || 'Make'} {formData.model || 'Model'}
                </Text>
                <Text style={styles.previewPlate}>
                  {formData.licensePlate || 'License Plate'}
                </Text>
                <Text style={styles.previewFuel}>
                  {formData.fuelType.charAt(0).toUpperCase() + formData.fuelType.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.cancelButton, isLoading && styles.buttonDisabled]} 
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                {isEditing ? <Edit size={16} color="#FFFFFF" /> : <Save size={16} color="#FFFFFF" />}
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 4,
  },
  fuelTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fuelTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  fuelTypeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  fuelTypeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  fuelTypeTextActive: {
    color: '#FFFFFF',
  },
  preview: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    marginLeft: 12,
    flex: 1,
  },
  previewVehicle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewPlate: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 2,
  },
  previewFuel: {
    fontSize: 14,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});