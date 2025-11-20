import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ImageBackground // ⭐ ADDED
  ,




  KeyboardAvoidingView,
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

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'android') {
    setTimeout(() => {
      Alert.alert(title, message);
    }, 500);
  } else {
    Alert.alert(title, message);
  }
};

export default function PostItemScreen() {
  const { width } = useWindowDimensions();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const isLargeScreen = width > 768;
  const containerWidth = isLargeScreen ? Math.min(600, width * 0.9) : '100%';

  const handlePost = async () => {
    if (!title.trim()) {
      showAlert("Error", "Please enter an item title");
      return;
    }

    if (!price.trim()) {
      showAlert("Error", "Please enter a price");
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      showAlert("Error", "Please enter a valid price");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        showAlert("Error", "You must be logged in to post items");
        router.push('/');
        return;
      }

      const requestBody = {
        title: title.trim(),
        description: description.trim() || null,
        price: priceNumber,
        imageUrl: imageUrl.trim(),
        category: category.trim() || null,
        location: location.trim() || null,
        user_id: await AsyncStorage.getItem("userID"),
      };

      const encoded = btoa(`user:password`);
      const response = await fetch('https://hood-deals-3827cb9a0599.herokuapp.com/api/listings', {
        method: 'POST',
        headers: {
          "Authorization": `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert("Error", data.error || data.message || "Failed to create listing");
        return;
      }

      showAlert("Success", "Your item has been listed!");

      setTitle('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setCategory('');
      setLocation('');

      setTimeout(() => {
        router.push('/home');
      }, 1000);

    } catch (error) {
      console.error("Post item error:", error);
      showAlert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ FULL BACKGROUND WRAP (just like Login & Home)
  return (
    <ImageBackground
      source={require("../../assets/images/HOODDEALSLOGO4.webp")}
      style={{ flex: 1, width: "100%", height: "100%" }}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={[styles.formContainer, { width: containerWidth }]}>
              
              <Text style={styles.header}>List a New Item</Text>

              <Text style={styles.label}>Title *</Text>
              <TextInput
                placeholder="What are you selling?"
                placeholderTextColor="#888"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Price *</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#888"
                  style={[styles.input, styles.priceInput]}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Describe your item in detail..."
                placeholderTextColor="#888"
                multiline
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Image URL</Text>
              <TextInput
                placeholder="https://example.com/image.jpg"
                placeholderTextColor="#888"
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                placeholder="e.g., Electronics, Furniture, Clothing"
                placeholderTextColor="#888"
                style={styles.input}
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                placeholder="Where is this item located?"
                placeholderTextColor="#888"
                style={styles.input}
                value={location}
                onChangeText={setLocation}
              />

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handlePost}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Posting...' : 'Post Item'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ⭐ OVERLAY ADDED (same as Login)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",   // ⭐ TRANSPARENT DARK OVERLAY
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
  },
  header: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: 'white',
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dollarSign: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    marginBottom: 0,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2e7bff',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
