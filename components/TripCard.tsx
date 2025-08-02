import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Fuel, TrendingUp } from 'lucide-react-native';
import { Card } from './Card';
import { Trip } from '@/types';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const duration = trip.endTime
    ? Math.round((trip.endTime.getTime() - trip.startTime.getTime()) / (1000 * 60))
    : 0;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Card>
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{formatDate(trip.startTime)}</Text>
            {trip.isManual && <Text style={styles.manualBadge}>Manual</Text>}
          </View>
          <Text style={styles.cost}>E{trip.cost.toFixed(2)}</Text>
        </View>

        <View style={styles.routeContainer}>
          <MapPin size={16} color="#6B7280" />
          <View style={styles.route}>
            <Text style={styles.location} numberOfLines={1}>
              {trip.startLocation.address}
            </Text>
            <View style={styles.routeLine} />
            <Text style={styles.location} numberOfLines={1}>
              {trip.endLocation?.address || 'In Progress'}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.statText}>{trip.distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.stat}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.statText}>{duration}m</Text>
          </View>
          <View style={styles.stat}>
            <Fuel size={14} color="#6B7280" />
            <Text style={styles.statText}>{trip.fuelUsed.toFixed(1)}L</Text>
          </View>
          <View style={styles.stat}>
            <TrendingUp size={14} color="#059669" />
            <Text style={[styles.statText, { color: '#059669' }]}>
              {trip.efficiency.toFixed(1)} km/L
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  manualBadge: {
    fontSize: 10,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontWeight: '500',
  },
  cost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  route: {
    flex: 1,
    marginLeft: 8,
  },
  location: {
    fontSize: 14,
    color: '#4B5563',
    marginVertical: 2,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 8,
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
});