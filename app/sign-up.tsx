import { useRouter } from 'expo-router';

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  type Errors = { username?: string; email?: string; password?: string; confirmPassword?: string };
  const [errors, setErrors] = useState<Errors>({});
  const [confirmPassword, setConfirmPassword] = useState('');

  const isLargeScreen = width > 768;
  const containerWidth = isLargeScreen ? Math.min(450, width * 0.9) : '100%';

  const isValidEmail = (email: string) =>  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const getPasswordStrength = (password: string) => {
    if(!password)return {pct:0, label:'Add Password'};
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if(/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    return { pct: (strength / 5) * 100, label: labels[strength - 1] || '' };
  }
  const passwordStrength = getPasswordStrength(password);
  const isFormValid = () => {
    const newErrors: Errors = {};
    if (!username) newErrors.username = 'Username is required';
    if (!isValidEmail(email)) newErrors.email = 'Invalid email address';
    if (passwordStrength.pct < 100) newErrors.password = 'Password is not strong enough';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = () => {
    if (!isFormValid()) {
      console.log('Form is invalid');
      return;
    }

    // TODO: Implement username, email, password validation/restration logic
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Confirm Password:', confirmPassword);
    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      alert('Passwords do not match');
      return;
    }else {
      console.log('Passwords match');
      // TODO: Implement password encryption
      // TODO: Implement app-based SignUp (API call to backend to create new user)
    }
  };

  const returnToLogin = () => {
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.formContainer, { width: containerWidth }]}>
            <Text style={styles.title}>Join the Hood</Text>
  
            <View style={styles.form}>

              {/* Username Section */}
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#888"
                keyboardType="default"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                }}
              />
              {!!errors.username && (<Text style={styles.error}>{errors.username}</Text>
              )}

              {/* Email Section */}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
              />
              {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}

              {/* Password Section */}
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
              />
              {!!password && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthBg}>
                    <View style={[styles.strengthFill, { width: `${passwordStrength.pct}%`, backgroundColor: passwordStrength.pct < 40 ? '#dc2626' : passwordStrength.pct < 80 ? '#f59e0b' : '#22c55e' }]} />
                  </View>
                  <Text style={styles.strengthLabel}>{passwordStrength.label}</Text>
                </View>
              )}
              {!!errors.password && (<Text style={styles.error}>{errors.password}</Text>
              )}

              {/* Confirm Password Section */}
              <TextInput
                style={styles.input}
                placeholder="Re-enter Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
              />
              {!!confirmPassword && password !== confirmPassword && (
                <Text style={styles.error}>Passwords do not match</Text>
              )}
              {!!errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
  
            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>
  
            {/* Register Placeholder */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={returnToLogin}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 450,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#111',
  },
  form: {
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  signUpButton: {
    backgroundColor: '#2e7bff',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#777',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#444',
    marginRight: 5,
  },
  loginText: {
    color: '#2e7bff',
    fontWeight: '600',
  },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8, marginBottom: 8 },
  strengthBg: { flex: 1, height: 8, borderRadius: 999, backgroundColor: '#e5e7eb' },
  strengthFill: { height: 8, borderRadius: 999, backgroundColor: '#22c55e' },
  strengthLabel: { fontSize: 12, color: '#4b5563', marginLeft: 8 },
  error: { color: '#dc2626', marginTop: -8, marginBottom: 8, fontSize: 13 },
});