import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { UserProvider, useUser } from '@/contexts/UserContext';
import LoginScreen from './Login';
import SignUpScreen from './SignUp';

function MainLayout() {
  const { user } = useUser();
  const [showSignUp, setShowSignUp] = useState(false);

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
      <MainLayout />
      <StatusBar style="auto" />
    </UserProvider>
  );
}