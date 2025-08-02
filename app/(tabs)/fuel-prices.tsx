import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MapPin, Navigation, Clock, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { dataService } from '@/services/dataService';
import { FuelStation } from '@/types';

export default function FuelPrices() {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');

  useEffect(() => {
    loadFuelStations();
  }, []);

  const loadFuelStations = async () => {
    try {
      const stationData = await dataService.getFuelStations();
      setStations(stationData);
    } catch (error) {
      console.error('Error loading fuel stations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedStations = [...stations].sort((a, b) => {
    if (sortBy === 'distance') {
      return a.distance - b.distance;
    } else {
      return a.prices.gasoline - b.prices.gasoline;
    }
  });

  const averagePrice = stations.length > 0
    ? stations.reduce((sum, station) => sum + station.prices.gasoline, 0) / stations.length
    : 0;

  const cheapestStation = stations.reduce((min, station) => 
    station.prices.gasoline < min.prices.gasoline ? station : min,
    stations[0] || { prices: { gasoline: 0 } }
  );

  const getPriceColor = (price: number) => {
    if (price < averagePrice - 0.05) return '#059669';
    if (price > averagePrice + 0.05) return '#DC2626';
    return '#F59E0B';
  };

  const getPriceIcon = (price: number) => {
    if (price < averagePrice - 0.05) return <TrendingDown size={16} color="#059669" />;
    if (price > averagePrice + 0.05) return <TrendingUp size={16} color="#DC2626" />;
    return null;
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading fuel prices...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Fuel Prices</Text>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
            onPress={() => setSortBy('distance')}
          >
            <Text style={[styles.sortText, sortBy === 'distance' && styles.sortTextActive]}>
              Distance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortText, sortBy === 'price' && styles.sortTextActive]}>
              Price
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Price Summary */}
      <Card>
        <Text style={styles.summaryTitle}>Price Overview</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>E{averagePrice.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Average Price</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>
              E{cheapestStation?.prices?.gasoline?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.summaryLabel}>Best Price</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              E{(stations.reduce((max, station) => 
                station.prices.gasoline > max ? station.prices.gasoline : max, 0
              )).toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Highest Price</Text>
          </View>
        </View>
      </Card>

      {/* Fuel Stations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Stations</Text>
        {sortedStations.map((station) => (
          <TouchableOpacity
            key={station.id}
            onPress={() => {
              Alert.alert(
                'Navigate to Station',
                `Open navigation to ${station.name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Navigate', onPress: () => {} },
                ]
              );
            }}
          >
            <Card style={styles.stationCard}>
              <View style={styles.stationHeader}>
                <View style={styles.stationInfo}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  <Text style={styles.stationBrand}>{station.brand}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <View style={styles.priceRow}>
                    {getPriceIcon(station.prices.gasoline)}
                    <Text style={[styles.mainPrice, { color: getPriceColor(station.prices.gasoline) }]}>
                      E{station.prices.gasoline.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.priceLabel}>Regular</Text>
                </View>
              </View>

              <View style={styles.stationDetails}>
                <View style={styles.locationContainer}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.stationAddress} numberOfLines={1}>
                    {station.address}
                  </Text>
                </View>
                <View style={styles.distanceContainer}>
                  <Navigation size={14} color="#6B7280" />
                  <Text style={styles.distanceText}>{station.distance.toFixed(1)} km away</Text>
                </View>
              </View>

              <View style={styles.allPrices}>
                <View style={styles.priceItem}>
                  <Text style={styles.fuelType}>Regular</Text>
                  <Text style={styles.price}>E{station.prices.gasoline.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.fuelType}>Premium</Text>
                  <Text style={styles.price}>E{station.prices.premium.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.fuelType}>Diesel</Text>
                  <Text style={styles.price}>E{station.prices.diesel.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.lastUpdated}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={styles.lastUpdatedText}>
                  Updated {formatLastUpdated(station.lastUpdated)}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price Alerts Info */}
      <Card style={styles.alertInfo}>
        <Text style={styles.alertTitle}>💡 Price Alerts</Text>
        <Text style={styles.alertText}>
          Green prices are below average, red prices are above average. We'll notify you when prices drop at your favorite stations.
        </Text>
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
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sortText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
  stationCard: {
    marginVertical: 4,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  stationBrand: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stationDetails: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 6,
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  allPrices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  priceItem: {
    alignItems: 'center',
    flex: 1,
  },
  fuelType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  alertInfo: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    marginTop: 16,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});