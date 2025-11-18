import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

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

const GoogleLogo = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </Svg>
);

const GitHubLogo = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      fill="#000"
      d="M12 .5C5.648.5.5 5.648.5 12c0 5.088 3.293 9.407 7.865 10.942.574.106.783-.25.783-.554 0-.273-.01-1.186-.015-2.15-3.2.696-3.875-1.544-3.875-1.544-.523-1.33-1.277-1.684-1.277-1.684-1.044-.715.08-.701.08-.701 1.153.081 1.76 1.185 1.76 1.185 1.027 1.76 2.695 1.25 3.352.955.104-.743.403-1.25.733-1.537-2.555-.291-5.238-1.277-5.238-5.689 0-1.256.45-2.284 1.185-3.088-.118-.29-.515-1.455.113-3.035 0 0 .965-.309 3.16 1.18a10.957 10.957 0 012.875-.387c.976.005 1.957.131 2.874.387 2.192-1.489 3.155-1.18 3.155-1.18.63 1.58.233 2.745.115 3.035.738.804 1.184 1.832 1.184 3.088 0 4.423-2.689 5.395-5.252 5.679.414.357.783 1.065.783 2.146 0 1.55-.014 2.8-.014 3.18 0 .308.205.666.788.553C20.708 21.405 24 17.084 24 12c0-6.352-5.148-11.5-12-11.5z"
    />
  </Svg>
);


const GITHUB_CLIENT_ID_MOBILE = "Ov23li1MRx9sFT4AbPIn";
const GITHUB_CLIENT_ID_WEB = "Ov23likDiCRzd54jcpWR";

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
      setEmail('');
      setPassword('');
      handleSignInWithGoogle();
    } else if (response?.type === "error") {
      setEmail('');
      setPassword('');
      console.error("Google sign-in error:", response.error);
      showAlert("Error", "Failed to sign in with Google");
    } else if (response?.type === "cancel") {
      setEmail('');
      setPassword('');
      console.log("User cancelled Google sign-in");
    }
  }, [response]);

  useEffect(() => {
    // Check if we're on web and just returned from GitHub OAuth
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const authPending = sessionStorage.getItem('github_auth_pending');

      if (code && authPending) {
        console.log('Web callback detected, exchanging code...');
        sessionStorage.removeItem('github_auth_pending');

        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Exchange the code
        exchangeCodeForToken(code);
      }
    }
  }, []);

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
              // 👇 Save one unified object for the inbox page
            await AsyncStorage.setItem(
              "authUser",
              JSON.stringify({
                name: data.user.name,
                email: data.user.email,
                picture: data.user.picture,
                accessToken: data.token,   // <- backend JWT or Google token
              })
            );
            const saved = await AsyncStorage.getItem("authUser");
            console.log("Saved authUser:", saved);


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

  async function loginWithGithub() {
    try {
      setLoading(true);

      // Different configuration for web vs mobile
      const isWeb = Platform.OS === 'web';
      const githubClientId = isWeb ? GITHUB_CLIENT_ID_WEB : GITHUB_CLIENT_ID_MOBILE;
      const githubRedirectUri = isWeb
        ? window.location.origin
        : 'com.example.p03frontend://';

      console.log('=== GitHub OAuth Debug ===');
      console.log('Platform:', Platform.OS);
      console.log('Client ID:', githubClientId);
      console.log('Redirect URI:', githubRedirectUri);

      // GitHub OAuth configuration
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(githubRedirectUri)}&scope=user:email`;

      console.log('Auth URL:', githubAuthUrl);

      if (isWeb) {
        handleWebGitHubAuth(githubAuthUrl, githubRedirectUri);
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          githubAuthUrl,
          githubRedirectUri
        );

        handleMobileGitHubCallback(result);
      }
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      showAlert("Error", "Failed to sign in with GitHub");
      setLoading(false);
    }
  }

  function handleWebGitHubAuth(authUrl: string, redirectUri: string) {
    sessionStorage.setItem('github_auth_pending', 'true');
    window.location.href = authUrl;
  }

  async function handleMobileGitHubCallback(result: any) {
    try {
      console.log('GitHub OAuth Result:', result);
      console.log('Result Type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('Success! Callback URL:', result.url);
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        console.log('Authorization Code:', code);
        console.log('Error from GitHub:', error);
        console.log('Error Description:', errorDescription);

        if (error) {
          showAlert("GitHub Error", errorDescription || error);
          return;
        }

        if (code) {
          await exchangeCodeForToken(code);
        } else {
          console.error('No authorization code in URL');
          showAlert("Error", "No authorization code received");
        }
      } else if (result.type === 'cancel') {
        console.log("User cancelled GitHub sign-in");
      }
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      showAlert("Error", "Failed to sign in with GitHub");
    } finally {
      setLoading(false);
    }
  }

  async function exchangeCodeForToken(code: string) {
    try {
      console.log('=== Exchange Code for Token ===');
      console.log('Code:', code);
      console.log('Platform:', Platform.OS);
      console.log('Sending code to backend...');

      setLoading(true);
      const encoded = btoa(`user:password`);
      const backendResponse = await fetch('https://hood-deals-3827cb9a0599.herokuapp.com/api/auth/github', {
        method: 'POST',
        headers: {
          "Authorization": `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          platform: Platform.OS === 'web' ? 'web' : 'mobile'
        }),
      });

      console.log('Backend Response Status:', backendResponse.status);

      const data = await backendResponse.json();
      console.log('Backend Response Data:', data);

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("username", JSON.stringify(data.user));
        await AsyncStorage.setItem("userID", data.user.id.toString());

        setUserInfo(data.user);

        if (Platform.OS === 'web') {
          router.push("/home");
        } else {
          await WebBrowser.dismissBrowser();
          navigation.navigate("home");
        }

        setTimeout(() => {
          showAlert("Success", `Welcome ${data.user.name}!`);
        }, 1000);
      } else {
        console.error('No token in response:', data);
        showAlert("Error", data.error || "Failed to authenticate with GitHub");
      }
    } catch (error) {
      console.error("Token exchange error:", error);
      showAlert("Error", "Failed to authenticate with GitHub");
    } finally {
      setLoading(false);
    }
  }

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
        setEmail('');
        setPassword('');
        return;
      }

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("username", JSON.stringify(data.user));
        await AsyncStorage.setItem("userID", data.user.id.toString());
        setEmail('');
        setPassword('');

        router.push("/home");

        showAlert("Success", `Welcome back, ${data.user.name}!`);
      }
    } catch (error) {
      console.error("Login error:", error);
      setEmail('');
      setPassword('');
      showAlert("Error", "Network error or backend not reachable");
    } finally {
      setLoading(false);
    }
  };


  const goToSignUp = () => {
    setEmail('');
    setPassword('');
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
              style={styles.socialButton}
              onPress={() => promptAsync()}
              disabled={!request || loading}
              activeOpacity={0.8}
            >
              <View style={styles.socialButtonContent}>
                <View style={styles.socialIconContainer}>
                  <GoogleLogo />
                </View>
                <Text style={styles.socialButtonText}>
                  {'Sign in with Google'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { marginTop: 12 }]} // spacing
              onPress={loginWithGithub}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.socialButtonContent}>
                <View style={styles.socialIconContainer}>
                  <GitHubLogo />
                </View>
                <Text style={styles.socialButtonText}>
                  {'Sign in with GitHub'}
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
  socialButton: {
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
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  socialButtonText: {
    color: '#3c4043',
    fontWeight: '500',
    fontSize: 16,
  },
  
});