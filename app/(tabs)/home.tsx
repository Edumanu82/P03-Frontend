import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  FlatList,
  Image,
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

  const navigation = useNavigation<HomeScreenNavigationProp>();
  const numColumns = 2;
  const isMultiColumn = numColumns > 1;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={isMultiColumn ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
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
                    "https://via.placeholder.com/300x200.png?text=No+Image",
                }}
                style={styles.image}
              />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>${item.price}</Text>
              <Text style={styles.category}>{item.category}</Text>
            </TouchableOpacity>
          )}
        />

        {/* ✅ Listing Details Modal */}
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
                          "https://via.placeholder.com/400x300.png?text=No+Image",
                      }}
                      style={{
                        width: "100%",
                        height: 220,
                        borderRadius: 10,
                        marginBottom: 15,
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
                      {selectedListing.description || "No description provided."}
                    </Text>

                    <Text
                      style={{
                        fontSize: 15,
                        color: "#666",
                        marginBottom: 6,
                      }}
                    >
                      Category: {selectedListing.category || "N/A"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 15,
                        color: "#666",
                        marginBottom: 6,
                      }}
                    >
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
  );
}
