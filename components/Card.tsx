import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,     // was 10
    marginVertical: 3, // was 4
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1, // was 2
    },
    shadowOpacity: 0.08, // was 0.1
    shadowRadius: 3, // was 3.84
    elevation: 3, // was 5
  },
});