import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { UserProvider, useUser } from '@/contexts/UserContext';
import LoginScreen from './Login';
import SignUpScreen from './SignUp';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

function AuthWrapper() {
  const { user, isInitializing } = useUser();
  const [showSignUp, setShowSignUp] = useState(false);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Initializing EFECOS...</Text>
      </View>
    );
  }

  if (!user) {
    return showSignUp ? (
      <SignUpScreen onSignIn={() => setShowSignUp(false)} />
    ) : (
      <LoginScreen onSignUp={() => setShowSignUp(true)} />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  
  return (
    <UserProvider>
      <AuthWrapper />
      <StatusBar style="auto" />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: '500',
  },
});