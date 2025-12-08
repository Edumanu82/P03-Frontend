import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createConversation } from "@/api/chat";

type RootStackParamList = {
  home: undefined;
  listingDetails: { listing: Listing };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "home"
>;

type Listing = {
  id: number;
  user_id: number;
  userName: string;
  userPicture?: string | null;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  image_url?: string | null;
  status?: string;
  category?: string;
  location?: string;
};

const STORAGE_KEYS_TO_TRY = ["user", "authUser", "profile", "googleAuth"];
const BASE_URL = "https://hood-deals-3827cb9a0599.herokuapp.com";
const BASIC_AUTH = "Basic " + btoa("user:password");

async function loadUserFromStorage() {
  for (const key of STORAGE_KEYS_TO_TRY) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.name || parsed.email || parsed.picture || parsed.accessToken))
        return parsed;
      if (parsed?.user && (parsed.user.name || parsed.user.email || parsed.user.picture))
        return parsed.user;
    } catch {
      return { name: raw };
    }
  }
  return null;
}

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");

  const navigation = useNavigation<HomeScreenNavigationProp>();
  const numColumns = 2;
  const isMultiColumn = numColumns > 1;

  const categories = ["All", "Cars", "Electronics", "Clothing", "Furniture", "Food", "Other"];
  const priceRanges = [
    "All",
    "Under $100",
    "$100 - $500",
    "$500 - $1000",
    "Above $1000",
  ];

  //  Message button: create conversation and open chat
  async function onPressMessage(listing: Listing) {
    try {
      console.log("Message button pressed for listing:", listing.id);

      // 1️⃣ Figure out who *you* are (myUserId) via email from storage
      const stored = await loadUserFromStorage();
      if (!stored?.email) {
        console.log("No stored email, cannot start conversation");
        return;
      }

      const meUrl = `${BASE_URL}/api/user/by-email?email=${encodeURIComponent(
        stored.email
      )}`;
      console.log("GET current user:", meUrl);

      const meRes = await fetch(meUrl, {
        headers: {
          Authorization: BASIC_AUTH,
          "Content-Type": "application/json",
        },
      });

      if (!meRes.ok) {
        const body = await meRes.text();
        console.log("Error fetching current user in HomeScreen:", meRes.status, body);
        return;
      }

      const me = await meRes.json();
      const myUserId = me.id as number;
      console.log("Resolved myUserId:", myUserId);

      //  Seller is the owner of the listing
      const otherUserId = listing.user_id;

      // Create or reuse conversation
      const convo = await createConversation(myUserId, otherUserId, listing.id);
      console.log("Conversation created/loaded from HomeScreen:", convo);

      //  Close modal and open conversation screen
      setModalVisible(false);

      router.push({
        pathname: "../conversation",
        params: {
          conversationId: String(convo.id),
          otherUserId: String(otherUserId), // 👈 crucial so ConversationScreen knows the receiver
        },
      });
    } catch (err) {
      console.error("Failed to start conversation from HomeScreen:", err);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      const fetchListings = async () => {
        try {
          setLoading(true);

          const username = "user";
          const password = "password";
          const base64Credentials = btoa(`${username}:${password}`);

          const response = await fetch(
            "https://hood-deals-3827cb9a0599.herokuapp.com/api/listings",
            {
              method: "GET",
              headers: {
                Authorization: `Basic ${base64Credentials}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

          const data = await response.json();
          setListings(data);
        } catch (err) {
          console.error("Error fetching listings:", err);
          setError("Failed to load listings.");
        } finally {
          setLoading(false);
        }
      };

      fetchListings();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading great deals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const applyPriceFilter = (item: Listing) => {
    const p = item.price;

    switch (selectedPriceRange) {
      case "Under $100":
        return p < 100;
      case "$100 - $500":
        return p >= 100 && p <= 500;
      case "$500 - $1000":
        return p >= 500 && p <= 1000;
      case "Above $1000":
        return p > 1000;
      default:
        return true;
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (item.category &&
        item.category.toLowerCase() === selectedCategory.toLowerCase());

    const matchesPrice = applyPriceFilter(item);

    return matchesCategory && matchesPrice;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/HOODDEALSLOGO3.webp')}
              style={styles.logoImage}
            />
            <Text style={styles.appTitle}>  HoodDeals</Text>
          </View>
        </View>

        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={isMultiColumn ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.filterSection}>
              {/* Category Filter */}
              <Text style={styles.filterLabel}>Categories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.filterChip,
                      selectedCategory === cat && styles.filterChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === cat && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Price Filter */}
              <Text style={[styles.filterLabel, { marginTop: 12 }]}>Price Range</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                {priceRanges.map((range) => (
                  <TouchableOpacity
                    key={range}
                    onPress={() => setSelectedPriceRange(range)}
                    style={[
                      styles.filterChip,
                      selectedPriceRange === range && styles.filterChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedPriceRange === range && styles.filterChipTextActive,
                      ]}
                    >
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Results count */}
              <Text style={styles.resultsText}>
                {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { width: isMultiColumn ? "48%" : "100%" }]}
              onPress={() => {
                setSelectedListing(item);
                setModalVisible(true);
              }}
              activeOpacity={0.9}
            >
              <Image
                source={{
                  uri:
                    item.imageUrl ||
                    item.image_url ||
                    "https://via.placeholder.com/300x200.png?text=No+Image",
                }}
                style={styles.cardImage}
              />

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.cardPrice}>${item.price}</Text>
                {item.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                )}
                {item.location && (
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    📍 {item.location}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Details Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedListing && (
                  <>
                    {/* Image */}
                    <Image
                      source={{
                        uri:
                          selectedListing.imageUrl ||
                          selectedListing.image_url ||
                          "https://via.placeholder.com/400x300.png?text=No+Image",
                      }}
                      style={styles.modalImage}
                    />

                    {/* Content */}
                    <View style={styles.modalBody}>
                      <Text style={styles.modalTitle}>
                        {selectedListing.title}
                      </Text>

                      <Text style={styles.modalPrice}>
                        ${selectedListing.price}
                      </Text>

                      {selectedListing.category && (
                        <View style={styles.modalCategoryBadge}>
                          <Text style={styles.modalCategoryText}>
                            {selectedListing.category}
                          </Text>
                        </View>
                      )}

                      {selectedListing.location && (
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Location:</Text>
                          <Text style={styles.modalInfoText}>
                            {selectedListing.location}
                          </Text>
                        </View>
                      )}

                      {/* Description */}
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Description</Text>
                        <Text style={styles.modalDescription}>
                          {selectedListing.description ||
                            "No description provided."}
                        </Text>
                      </View>

                      {/* Seller Info */}
                      {selectedListing.userName && (
                        <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Seller</Text>
                          <View style={styles.sellerInfo}>
                            {selectedListing.userPicture && (
                              <Image
                                source={{ uri: selectedListing.userPicture }}
                                style={styles.sellerImage}
                              />
                            )}
                            <Text style={styles.sellerName}>
                              {selectedListing.userName}
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.modalMessageButton} 
                            activeOpacity={0.8}
                            onPress={() => onPressMessage(selectedListing)}
                          >
                              <Text style={styles.modalCloseButtonText}>Message</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... your styles exactly as before ...
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#636e72",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#d63031",
    textAlign: "center",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
  },
  filterSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f3f7",
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  filterChipActive: {
    backgroundColor: "#003366",
    borderColor: "#003366",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636e72",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  resultsText: {
    fontSize: 13,
    color: "#636e72",
    marginTop: 8,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f0f3f7",
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003366",
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f3f7",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#636e72",
  },
  cardLocation: {
    fontSize: 12,
    color: "#636e72",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f0f3f7",
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#003366",
    marginBottom: 12,
  },
  modalCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f3f7",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalCategoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#636e72",
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalInfoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#636e72",
    marginRight: 8,
  },
  modalInfoText: {
    fontSize: 15,
    color: "#2d3436",
    flex: 1,
  },
  modalSection: {
    marginTop: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: "#636e72",
    lineHeight: 22,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#f0f3f7",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  modalCloseButton: {
    backgroundColor: "#003366",
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#003366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalMessageButton: {
    backgroundColor: "#00c23dff",
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#003366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
