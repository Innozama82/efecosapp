import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, Fuel, DollarSign, Clock } from 'lucide-react-native';
import { Card } from './Card';
import { FuelLog } from '@/types';

interface FuelLogCardProps {
  log: FuelLog;
  onPress?: () => void;
}

export function FuelLogCard({ log, onPress }: FuelLogCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return '#059669';
      case 'rejected': return '#DC2626';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusBackground = (status?: string) => {
    switch (status) {
      case 'approved': return '#D1FAE5';
      case 'rejected': return '#FEE2E2';
      case 'pending': return '#FEF3C7';
      default: return '#F3F4F6';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.stationInfo}>
            <Text style={styles.station}>{log.station}</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <Calendar size={12} color="#6B7280" />
                <Text style={styles.date}>{formatDate(log.date)}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.time}>{formatTime(log.date)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.costContainer}>
            <Text style={styles.totalCost}>E{log.totalCost.toFixed(2)}</Text>
            {log.approvalStatus && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusBackground(log.approvalStatus) }]}>
                <Text style={[styles.status, { color: getStatusColor(log.approvalStatus) }]}>
                  {log.approvalStatus.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.locationContainer}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.location} numberOfLines={1}>
            {log.location.address}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detail}>
            <View style={styles.detailIcon}>
              <Fuel size={14} color="#059669" />
            </View>
            <Text style={styles.detailText}>{log.liters.toFixed(1)}L</Text>
          </View>
          <View style={styles.detail}>
            <View style={styles.detailIcon}>
              <DollarSign size={14} color="#2563EB" />
            </View>
            <Text style={styles.detailText}>E{log.pricePerLiter.toFixed(2)}/L</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.odometerLabel}>ODO:</Text>
            <Text style={styles.detailText}>{log.odometer.toLocaleString()} km</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  station: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  costContainer: {
    alignItems: 'flex-end',
  },
  totalCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  status: {
    fontSize: 10,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  location: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  odometerLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 4,
  },
});