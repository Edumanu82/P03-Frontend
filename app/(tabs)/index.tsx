import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'android') {
    setTimeout(() => {
      Alert.alert(title, message);
    }, 500);
  } else {
    Alert.alert(title, message);
  }
};

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isLargeScreen = width > 768;
  const containerWidth = isLargeScreen ? Math.min(450, width * 0.9) : '100%';

  const redirectUri = AuthSession.makeRedirectUri({
    native: 'com.example.p03frontend://',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "27161815233-7sd29e6sk9080nkrs1s1019vl67c12ra.apps.googleusercontent.com",
    webClientId: "27161815233-vijpk8qqje593atia2iaq33s9hfjgs8o.apps.googleusercontent.com",
    redirectUri: redirectUri,
  });

  useEffect(() => {
    setUsername('');
    setPassword('');
    console.log('OAuth Response:', response);

    if (response?.type === "success") {
      console.log('OAuth Success - Access Token:', response.authentication?.accessToken);
      handleSignInWithGoogle();
    } else if (response?.type === "error") {
      console.error("Google sign-in error:", response.error);
      showAlert("Error", "Failed to sign in with Google");
    } else if (response?.type === "cancel") {
      console.log("User cancelled Google sign-in");
    }
  }, [response]);

  async function handleSignInWithGoogle() {
    try {
      setLoading(true);
  
      if (response?.type === "success" && response.authentication?.accessToken) {
        const user = await getUserInfo(response.authentication.accessToken);
  
        if (user) {
          // Send user info to your Spring Boot backend
          const encoded = btoa(`user:password`);
          const backendResponse = await fetch('https://hood-deals-3827cb9a0599.herokuapp.com/api/auth/google', {
            method: 'POST',
            headers: {
              "Authorization": `Basic ${encoded}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.name,
              picture: user.picture,
            }),
          });
  
          const data = await backendResponse.json();
          
          if (data.token) {
            await AsyncStorage.setItem("token", data.token);
            await AsyncStorage.setItem("username", JSON.stringify(data.user));
            await AsyncStorage.setItem("userID", data.user.id.toString());
            
            setUserInfo(data.user);
            await WebBrowser.dismissBrowser();
            navigation.navigate("home");
  
            setTimeout(() => {
              showAlert("Success", `Welcome ${data.user.name}!`);
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      showAlert("Error", "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  }

  const getUserInfo = async (token: string) => {
    if (!token) return null;

    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const user = await response.json();
      console.log("User info:", user);
      return user;
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      throw error;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Error", "Please enter both email and password");
      return;
    }
  
    try {
      setLoading(true);
      const encoded = btoa(`user:password`);
      const response = await fetch('https://hood-deals-3827cb9a0599.herokuapp.com/api/auth/login', {
        method: "POST",
        headers: {  
         "Authorization": `Basic ${encoded}`,
         "Content-Type": "application/json", 
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        showAlert("Login Failed", data.error || "Invalid credentials");
        return;
      }
  
      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("username", JSON.stringify(data.user));
        await AsyncStorage.setItem("userID", data.user.id.toString());
  
        router.push("/home");
  
        showAlert("Success", `Welcome back, ${data.user.name}!`);
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert("Error", "Network error or backend not reachable");
    } finally {
      setLoading(false);
    }
  };
  

  const goToSignUp = () => {
    router.push('../sign-up');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.formContainer, { width: containerWidth }]}>
            <Text style={styles.title}>Welcome to HoodDeals</Text>

            {/* Email Login Section */}
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request || loading}
              activeOpacity={0.8}
            >
              <View style={styles.googleButtonContent}>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Register Placeholder */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={goToSignUp}>
                <Text style={styles.signupText}>Sign up</Text>
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
  loginButton: {
    backgroundColor: '#2e7bff',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButtonText: {
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
  signupText: {
    color: '#2e7bff',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#3c4043',
    fontWeight: '500',
    fontSize: 16,
  },
});