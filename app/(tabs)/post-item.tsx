import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from 'expo-router';
import React, { useState } from 'react';
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

  const categoryOptions = ['Cars', 'Electronics', 'Clothing', 'Furniture', 'Food', 'Other'];

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

            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require('../../assets/images/HOODDEALSLOGO3.webp')}
                style={styles.logoImage}
              />
              <Text style={styles.headerTitle}>List a New Item</Text>
              <Text style={styles.headerSubtitle}>Share what you're selling with your neighborhood</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>

              {/* Title Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
                <TextInput
                  placeholder="What are you selling?"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Price Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Price <Text style={styles.required}>*</Text></Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    style={styles.priceInput}
                    keyboardType="decimal-pad"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {categoryOptions.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Description Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  placeholder="Describe your item in detail..."
                  placeholderTextColor="#999"
                  multiline
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                />
                <Text style={styles.helperText}>
                  Include details like condition, size, features, etc.
                </Text>
              </View>

              {/* Image URL Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Image URL</Text>
                <TextInput
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.helperText}>
                  Add a link to a photo of your item
                </Text>
              </View>

              {/* Location Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  placeholder="Where is this item located?"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                />
                <Text style={styles.helperText}>
                  Help buyers know where to pick up
                </Text>
              </View>

              {/* Post Button */}
              <TouchableOpacity
                style={[styles.postButton, loading && styles.buttonDisabled]}
                onPress={handlePost}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.postButtonText}>
                  {loading ? 'Posting...' : 'Post Item'}
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.navigate('/(tabs)/home')}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
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
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 6,
    marginLeft: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingLeft: 14,
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    padding: 14,
    paddingLeft: 0,
    fontSize: 16,
    color: '#2d3436',
  },
  categoryScroll: {
    marginTop: 4,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f3f7',
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
  },
  categoryChipActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636e72',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#003366',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#f0f3f7',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
  },
  cancelButtonText: {
    color: '#636e72',
    fontSize: 16,
    fontWeight: '600',
  },
});