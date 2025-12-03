import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Conversation = {
  id: number;
  user1Id: number;
  user2Id: number;
  listingId: number | null;
  lastMessageAt: string | null;
  createdAt: string | null;
};

type BackendUser = {
  id: number;
  email: string;
  name?: string | null;
  picture?: string | null;
};

const USER_STORAGE_KEY = "username";

export default function InboxPage() {
  const { width } = useWindowDimensions();

  const [user, setUser] = useState<BackendUser | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLarge = width > 768;
  const containerWidth = isLarge ? Math.min(700, width * 0.9) : "100%";
  const cardWidth = useMemo(() => {
    const max = 500;
    return isLarge ? Math.min(max, width * 0.6) : Math.min(520, width * 0.9);
  }, [isLarge, width]);

  // 🔹 Load backend user & id from AsyncStorage once
  useEffect(() => {
    (async () => {
      try {
        const rawUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const rawUserId = await AsyncStorage.getItem("userID");

        if (!rawUser || !rawUserId) {
          setError("No logged-in user. Please sign in again.");
          setLoading(false);
          return;
        }

        const parsedUser: BackendUser = JSON.parse(rawUser);
        const parsedId = Number(rawUserId);

        if (!parsedUser || !parsedUser.email || isNaN(parsedId)) {
          setError("Stored user is invalid. Please sign in again.");
          setLoading(false);
          return;
        }

        setUser(parsedUser);
        setUserId(parsedId);
      } catch (e) {
        console.error("Error loading user from storage:", e);
        setError("Failed to load user from storage.");
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 Fetch conversations when tab focused & we know the userId
  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        return;
      }

      let isActive = true;

      const fetchConversations = async () => {
        try {
          setLoading(true);
          setError(null);

          const encoded = btoa("user:password");

          const res = await fetch(
            `https://hood-deals-3827cb9a0599.herokuapp.com/conversations?userId=${userId}&page=0&size=20`,
            {
              headers: {
                Authorization: `Basic ${encoded}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!res.ok) {
            const body = await res.text();
            console.log("Error /conversations:", res.status, body);
            throw new Error(
              `Failed to fetch conversations: ${res.status}`
            );
          }

          const data = await res.json();
          if (!isActive) return;

          const items: Conversation[] = Array.isArray(data)
            ? data
            : data.content ?? [];

          setConversations(items);
        } catch (err: any) {
          if (!isActive) return;
          console.error("Error fetching conversations:", err);
          setError(err.message ?? "Failed to load conversations.");
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchConversations();

      return () => {
        isActive = false;
      };
    }, [userId])
  );

  const openConversation = (item: Conversation) => {
    router.push({
      pathname: "/conversation",
      params: { conversationId: item.id },
    });
  };

  // 🔹 Loading state
  if (loading && !error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </SafeAreaView>
    );
  }

  // 🔹 Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🔹 Normal render
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { width: containerWidth }]}>
        <Text style={styles.header}>Inbox</Text>

        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.profileCard, { width: cardWidth }]}
              onPress={() => openConversation(item)}
            >
              <Image
                source={
                  user?.picture
                    ? { uri: `${user.picture}?t=${Date.now()}` }
                    : require("../../assets/images/profilepic.png")
                }
                style={styles.avatar}
              />
              <View>
                <Text style={styles.name}>
                  Conversation #{item.id}
                </Text>
                <Text
                  numberOfLines={1}
                  style={styles.itemSubtitle}
                >
                  Last message:{" "}
                  {item.lastMessageAt
                    ? new Date(
                        item.lastMessageAt
                      ).toLocaleString()
                    : "No messages yet"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text>No conversations found.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: {
    flex: 1,
    maxWidth: 1400,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  name: { fontSize: 20, fontWeight: "bold", color: "#111" },
  itemSubtitle: { fontSize: 14, color: "#666", marginTop: 2, maxWidth: 220 },
});
