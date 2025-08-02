import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '@/contexts/UserContext';

export default function LoginScreen({ onSignUp }: { onSignUp?: () => void }) {
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user profile from Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Check if user type is valid (citizen or driver)
        if (userData.type !== 'citizen' && userData.type !== 'driver') {
          setError('Invalid user type. Only citizens and drivers are allowed to access this application.');
          setLoading(false);
          return;
        }
        
        setUser({
          id: user.uid,
          name: userData.name || user.displayName || '',
          email: user.email || '',
          type: userData.type,
          personalBudget: userData.personalBudget || 0,
          monthlyFuelLimit: userData.monthlyFuelLimit,
          companyId: userData.companyId,
          companyName: userData.companyName,
          createdAt: new Date(userData.createdAt?.toDate() || user.metadata.creationTime || Date.now()),
        });
      } else {
        setError('User profile not found. Please contact support.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.card}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#888"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkContainer} onPress={onSignUp}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22223b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a4e69',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#22223b',
  },
  error: {
    color: '#dc2626',
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#22223b',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#888',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkContainer: {
    marginTop: 18,
  },
  linkText: {
    color: '#4a4e69',
    fontSize: 15,
    textAlign: 'center',
  },
  linkHighlight: {
    color: '#22223b',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});