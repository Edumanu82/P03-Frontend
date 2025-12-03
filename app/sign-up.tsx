import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
  const containerWidth = isLargeScreen ? Math.min(420, width * 0.9) : '100%';

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const getPasswordStrength = (password: string) => {
    if (!password) return { pct: 0, label: 'Add Password' };
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    const labels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    return { pct: (strength / 5) * 100, label: labels[strength - 1] || '' };
  };

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

  const handleSignUp = async () => {
    if (!isFormValid()) return;

    try {
      const encoded = btoa(`user:password`);
      const response = await fetch('https://hood-deals-3827cb9a0599.herokuapp.com/api/auth/signup', {
        method: 'POST',
        headers: {
          "Authorization": `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name: username })
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Signup Failed', data.error || 'Unknown error');
        return;
      }
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      Alert.alert('Signup Successful', 'Welcome to HoodDeals!');
      router.back();

    } catch (err) {
      console.error(err);
      Alert.alert('Signup Error', 'Network error or backend not reachable');
    }
  };

  const returnToLogin = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formContainer, { width: containerWidth }]}>

            {/* Logo/Brand Section */}
            <View style={styles.brandSection}>
              <Image
                source={require('../assets/images/HOODDEALSLOGO3.webp')}
                style={styles.logoImage}
              />
              <Text style={styles.brandTitle}>Join HoodDeals</Text>
              <Text style={styles.brandSubtitle}>Start finding great deals in your neighborhood</Text>
            </View>

            {/* Sign Up Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Create your account</Text>

              <View style={styles.form}>
                {/* Username Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={[styles.input, errors.username && styles.inputError]}
                    placeholder="Choose a username"
                    placeholderTextColor="#999"
                    keyboardType="default"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={(t) => {
                      setUsername(t);
                      if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
                    }}
                  />
                  {!!errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                  />
                  {!!errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Create a strong password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                  />
                  {!!password && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBg}>
                        <View
                          style={[
                            styles.strengthFill,
                            {
                              width: `${passwordStrength.pct}%`,
                              backgroundColor: passwordStrength.pct < 40
                                ? '#dc2626'
                                : passwordStrength.pct < 80
                                  ? '#f59e0b'
                                  : '#22c55e'
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.strengthLabel}>{passwordStrength.label}</Text>
                    </View>
                  )}
                  {!!errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                  <Text style={styles.helperText}>
                    Must include uppercase, lowercase, number, and special character
                  </Text>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      (errors.confirmPassword || (confirmPassword && password !== confirmPassword)) && styles.inputError
                    ]}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    autoCapitalize="none"
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                  />
                  {!!confirmPassword && password !== confirmPassword && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
                  {!!errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                </TouchableOpacity>
              </View>

              {/* Terms */}
              <Text style={styles.termsText}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>

            {/* Login Section */}
            <View style={styles.loginSection}>
              <Text style={styles.loginPrompt}>Already have an account?</Text>
              <TouchableOpacity onPress={returnToLogin} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Log in</Text>
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
    backgroundColor: '#f7f8fa',
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#636e72',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2d3436',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 6,
    marginLeft: 4,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: 8,
    borderRadius: 4,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#636e72',
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#003366',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  loginPrompt: {
    fontSize: 15,
    color: '#636e72',
  },
  loginLink: {
    fontSize: 15,
    color: '#003366',
    fontWeight: '700',
  },
});