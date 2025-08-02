import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useOfflineStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored !== null) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: T) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const clearData = async () => {
    try {
      await AsyncStorage.removeItem(key);
      setData(defaultValue);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  return {
    data,
    setData: saveData,
    clearData,
    isLoading,
  };
}