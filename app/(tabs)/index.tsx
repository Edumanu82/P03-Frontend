import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
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
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </Svg>
);

const GitHubLogo = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      fill="#181717"
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
  const containerWidth = isLargeScreen ? Math.min(420, width * 0.9) : '100%';

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
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const authPending = sessionStorage.getItem('github_auth_pending');

      if (code && authPending) {
        sessionStorage.removeItem('github_auth_pending');
        window.history.replaceState({}, document.title, window.location.pathname);
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
          const encoded = btoa(`user:password`);
          const backendResponse = await fetch(
            'https://hood-deals-3827cb9a0599.herokuapp.com/api/auth/google',
            {
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
            }
          );

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
      return user;
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      throw error;
    }
  };

  async function loginWithGithub() {
    try {
      setLoading(true);

      const isWeb = Platform.OS === 'web';
      const githubClientId = isWeb ? GITHUB_CLIENT_ID_WEB : GITHUB_CLIENT_ID_MOBILE;
      const githubRedirectUri = isWeb
        ? window.location.origin
        : 'com.example.p03frontend://';

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(githubRedirectUri)}&scope=user:email`;

      if (isWeb) {
        sessionStorage.setItem('github_auth_pending', 'true');
        window.location.href = githubAuthUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          githubAuthUrl,
          githubRedirectUri
        );

        handleMobileGitHubCallback(result);
      }
    } catch (error) {
      showAlert("Error", "Failed to sign in with GitHub");
      setLoading(false);
    }
  }

  async function handleMobileGitHubCallback(result: any) {
    try {
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          await exchangeCodeForToken(code);
        } else {
          showAlert("Error", "No authorization code received");
        }
      }
    } catch (error) {
      showAlert("Error", "Failed to authenticate with GitHub");
    } finally {
      setLoading(false);
    }
  }

  async function exchangeCodeForToken(code: string) {
    try {
      setLoading(true);
      const encoded = btoa(`user:password`);

      const backendResponse = await fetch(
        'https://hood-deals-3827cb9a0599.herokuapp.com/api/auth/github',
        {
          method: 'POST',
          headers: {
            "Authorization": `Basic ${encoded}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            platform: Platform.OS === 'web' ? 'web' : 'mobile'
          }),
        }
      );

      const data = await backendResponse.json();

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

      const response = await fetch(
        'https://hood-deals-3827cb9a0599.herokuapp.com/api/auth/login',
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${encoded}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

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
                source={require('../../assets/images/HOODDEALSLOGO3.webp')}
                style={styles.logoImage}
              />
              <Text style={styles.brandTitle}>HoodDeals</Text>
              <Text style={styles.brandSubtitle}>Find great deals in your neighborhood</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Log in to your account</Text>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Logging in...' : 'Log in'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => promptAsync()}
                  disabled={!request || loading}
                  activeOpacity={0.8}
                >
                  <GoogleLogo />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={loginWithGithub}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <GitHubLogo />
                  <Text style={styles.socialButtonText}>GitHub</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Section */}
            <View style={styles.signupSection}>
              <Text style={styles.signupPrompt}>New to HoodDeals?</Text>
              <TouchableOpacity onPress={goToSignUp} activeOpacity={0.7}>
                <Text style={styles.signupLink}>Create an account</Text>
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
  logoImage: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: 24,
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
  loginButton: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#dfe6e9',
  },
  dividerText: {
    fontSize: 13,
    marginHorizontal: 12,
    color: '#636e72',
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#dfe6e9',
    gap: 8,
  },
  socialButtonText: {
    color: '#2d3436',
    fontWeight: '600',
    fontSize: 15,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  signupPrompt: {
    fontSize: 15,
    color: '#636e72',
  },
  signupLink: {
    fontSize: 15,
    color: '#003366',
    fontWeight: '700',
  },
});