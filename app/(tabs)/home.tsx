import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/homeStyles";

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

  const categories = ["All", "Cars", "Electronics", "Clothing", "Furniture", "Food"];
  const priceRanges = [
    "All",
    "Under $100",
    "$100 - $500",
    "$500 - $1000",
    "Above $1000",
  ];

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
        <Text style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          {error}
        </Text>
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
    <ImageBackground
      source={require("../../assets/images/HOODDEALSLOGO4.webp")}
      style={{ flex: 1, width: "100%", height: "100%" }}
      resizeMode="stretch"
    >
      {/* Overlay to keep content readable */}
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent"
 }}>
        <View style={styles.container}>

          {/* Filter section inside header */}
          <FlatList
            data={filteredListings}
            keyExtractor={(item) => item.id.toString()}
            numColumns={numColumns}
            key={numColumns}
            columnWrapperStyle={isMultiColumn ? styles.row : undefined}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={{ paddingBottom: 10 }}>
                <Text style={styles.appTitle}>HoodDeals</Text>

                {/* FILTER BLOCK */}
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingTop: 5,
                    paddingBottom: 5,
                    backgroundColor: "white",
                    borderRadius: 12,
                    marginTop: 6,
                    marginBottom: 10,
                    opacity: 0.95,
                  }}
                >
                  {/* CATEGORY FILTER */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}
                  >
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setSelectedCategory(cat)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 20,
                          borderRadius: 50,
                          marginRight: 10,
                          backgroundColor:
                            selectedCategory === cat ? "#2e7bff" : "#f2f2f2",
                        }}
                      >
                        <Text
                          style={{
                            color: selectedCategory === cat ? "white" : "#333",
                            fontWeight: "600",
                            fontSize: 16,
                          }}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* PRICE FILTER */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 6 }}
                  >
                    {priceRanges.map((range) => (
                      <TouchableOpacity
                        key={range}
                        onPress={() => setSelectedPriceRange(range)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 20,
                          borderRadius: 50,
                          marginRight: 10,
                          backgroundColor:
                            selectedPriceRange === range ? "#2e7bff" : "#f2f2f2",
                        }}
                      >
                        <Text
                          style={{
                            color: selectedPriceRange === range ? "white" : "#333",
                            fontWeight: "600",
                            fontSize: 16,
                          }}
                        >
                          {range}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { width: isMultiColumn ? "48%" : "100%" }]}
                onPress={() => {
                  setSelectedListing(item);
                  setModalVisible(true);
                }}
              >
                <Image
                  source={{
                    uri:
                      item.imageUrl ||
                      item.image_url ||
                      "https://via.placeholder.com/300x200.png?text=No+Image",
                  }}
                  style={[styles.image, { resizeMode: "cover" }]}
                />

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.price}>${item.price}</Text>
                <Text style={styles.category}>{item.category}</Text>
              </TouchableOpacity>
            )}
          />

          {/* ⭐ Details Modal (unchanged) */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              <View
                style={{
                  width: "90%",
                  maxHeight: "85%",
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <ScrollView>
                  {selectedListing && (
                    <>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: "700",
                          marginBottom: 10,
                          textAlign: "center",
                        }}
                      >
                        {selectedListing.title}
                      </Text>

                      <Image
                        source={{
                          uri:
                            selectedListing.imageUrl ||
                            selectedListing.image_url ||
                            "https://via.placeholder.com/400x300.png?text=No+Image",
                        }}
                        style={{
                          width: "100%",
                          height: 220,
                          borderRadius: 10,
                          marginBottom: 15,
                          resizeMode: "contain",
                        }}
                      />

                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "600",
                          color: "#2E8B57",
                          marginBottom: 10,
                          textAlign: "center",
                        }}
                      >
                        ${selectedListing.price}
                      </Text>

                      <Text
                        style={{
                          fontSize: 16,
                          color: "#333",
                          marginBottom: 10,
                        }}
                      >
                        {selectedListing.description ||
                          "No description provided."}
                      </Text>

                      <Text style={{ fontSize: 15, color: "#666", marginBottom: 6 }}>
                        Category: {selectedListing.category || "N/A"}
                      </Text>

                      <Text style={{ fontSize: 15, color: "#666", marginBottom: 6 }}>
                        Location: {selectedListing.location || "N/A"}
                      </Text>

                      {selectedListing.userName && (
                        <View style={{ marginTop: 10 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              color: "#444",
                              fontWeight: "600",
                            }}
                          >
                            Seller: {selectedListing.userName}
                          </Text>
                          {selectedListing.userPicture && (
                            <Image
                              source={{ uri: selectedListing.userPicture }}
                              style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                marginTop: 8,
                                alignSelf: "center",
                              }}
                            />
                          )}
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    marginTop: 15,
                    backgroundColor: "#2e7bff",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
