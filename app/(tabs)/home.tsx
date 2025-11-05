import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View
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
  image_url?: string | null;
  status?: string;
  category?: string;
  location?: string;
};

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const navigation = useNavigation<HomeScreenNavigationProp>();
  const numColumns = 2;
  const isMultiColumn = numColumns > 1;

useEffect(() => {
  const fetchListings = async () => {
    try {
      setLoading(true);

      // ✅ Basic Auth credentials
      const username = "user";     // from SecurityConfig
      const password = "password"; // same as inMemoryUserDetailsManager
      const base64Credentials = btoa(`${username}:${password}`);

      // ✅ Fetch listings using Basic Auth
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setListings(data);
      console.log("Fetched listings:", data);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to load listings.");
    } finally {
      setLoading(false);
    }
  };

  fetchListings();
}, []);


  // ✅ Render Listings
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
              onPress={() =>
                navigation.navigate("listingDetails", { listing: item })
              }
            >
              <Image
                source={{
                  uri:
                    item.image_url ||
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
      </View>
    </SafeAreaView>
  );
}
