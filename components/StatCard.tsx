import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, color = '#2563EB', icon }: StatCardProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 2, // was 4
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // was 8
  },
  iconContainer: {
    marginRight: 6, // was 8
  },
  title: {
    fontSize: 12, // was 14
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 18, // was 24
    fontWeight: 'bold',
    marginBottom: 2, // was 4
  },
  subtitle: {
    fontSize: 10, // was 12
    color: '#9CA3AF',
  },
});