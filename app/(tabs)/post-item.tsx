import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../supabaseClient";

const showAlert = (title: string, message: string) => {
  Alert.alert(title, message);
};

export default function PostItemScreen() {
  const { width } = useWindowDimensions();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const [localImage, setLocalImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const categoryOptions = ["Cars", "Electronics", "Clothing", "Furniture", "Food", "Other"]; // What we have so far.

  const handlePickImage = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          setLocalImage(URL.createObjectURL(file));
          await uploadImageWeb(file);
        }
      };
      input.click();
    } else {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setLocalImage(uri);
        await uploadImageNative(uri);
      }
    }
  };

  const uploadImageWeb = async (file: File) => {
    try {
      setLoading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      setImageUrl(publicData.publicUrl);
      showAlert("Success", "Image uploaded!");
    } catch (err: any) {
      showAlert("Upload Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadImageNative = async (uri: string) => {
    try {
      setLoading(true);
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, Buffer.from(base64, "base64"), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      setImageUrl(publicData.publicUrl);
      showAlert("Success", "Image uploaded!");
    } catch (err: any) {
      showAlert("Upload Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!title.trim()) return showAlert("Error", "Please enter a title.");
    if (!price.trim()) return showAlert("Error", "Please enter a price.");
    if (!imageUrl) return showAlert("Error", "Please upload an image first.");

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) return showAlert("Error", "Invalid price.");

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert("Error", "You must be logged in.");
        router.push("/");
        return;
      }

      const requestBody = {
        title: title.trim(),
        description: description.trim() || null,
        price: priceNumber,
        imageUrl,
        category: category.trim() || null,
        location: location.trim() || null,
        user_id: await AsyncStorage.getItem("userID"),
      };

      const encoded = btoa(`user:password`);
      const response = await fetch(
        "https://hood-deals-3827cb9a0599.herokuapp.com/api/listings",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${encoded}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      if (!response.ok) return showAlert("Error", data.error || "Listing failed.");

      showAlert("Success", "Your listing is live!");

      setTitle("");
      setPrice("");
      setDescription("");
      setCategory("");
      setLocation("");
      setLocalImage(null);
      setImageUrl("");

      router.push("/home");
    } catch (err: any) {
      showAlert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.formContainer}>
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

              {/* PICK IMAGE */}
              <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                <Text style={styles.imageButtonText}>Add an Image</Text>
              </TouchableOpacity>
              {/* PREVIEW */}
              {(localImage || imageUrl) && (
                <Image
                  source={{ uri: localImage || imageUrl }}
                  style={{ width: "100%", height: 200, borderRadius: 12, marginBottom: 16 }}
                  resizeMode="cover"
                />
              )}

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
  safeArea: { flex: 1, backgroundColor: "#f7f8fa" },
  scroll: { padding: 20 },
  formContainer: { width: "100%", maxWidth: 600, alignSelf: "center" },
  header: { alignItems: 'center', marginBottom: 32, },
  imageButton: { backgroundColor: "#003366", padding: 14, borderRadius: 10, marginBottom: 16 },
  imageButtonText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: "#dfe6e9",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#2d3436",
  },
  categoryScroll: {
    marginTop: 4,
  },
  priceInput: {
    flex: 1,
    padding: 14,
    paddingLeft: 0,
    fontSize: 16,
    color: '#2d3436',
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
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  required: {
    color: '#dc2626',
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
  postButton: { backgroundColor: "#003366", padding: 16, borderRadius: 12, marginTop: 12 },
  categoryChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, backgroundColor: "#f0f3f7" },
  categoryChipActive: { backgroundColor: "#003366" },
  categoryChipText: { fontWeight: "600", color: "#636e72" },
  categoryChipTextActive: { color: "#fff" },
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
