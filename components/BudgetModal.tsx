import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Save, DollarSign } from 'lucide-react-native';

interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: number) => Promise<void>;
  currentBudget: number;
  isBusinessUser: boolean;
}

export function BudgetModal({ 
  visible, 
  onClose, 
  onSave, 
  currentBudget, 
  isBusinessUser 
}: BudgetModalProps) {
  const [budget, setBudget] = useState(currentBudget.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBudget(currentBudget.toString());
    setError('');
  }, [currentBudget, visible]);

  const handleSave = async () => {
    const budgetValue = parseFloat(budget);
    
    if (isNaN(budgetValue) || budgetValue < 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (budgetValue === 0) {
      setError('Budget cannot be zero');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(budgetValue);
      onClose();
    } catch (error) {
      setError('Failed to update budget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setBudget(currentBudget.toString());
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isBusinessUser ? 'Edit Monthly Fuel Limit' : 'Edit Monthly Budget'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              disabled={isLoading}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              {isBusinessUser 
                ? 'Set your monthly fuel spending limit for company vehicles.'
                : 'Set your monthly fuel budget to track your spending.'
              }
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <DollarSign size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="0.00"
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>

            <View style={styles.currentBudget}>
              <Text style={styles.currentBudgetLabel}>Current:</Text>
              <Text style={styles.currentBudgetValue}>E{currentBudget.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.cancelButton, isLoading && styles.disabledButton]} 
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={16} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  currentBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  currentBudgetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentBudgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 