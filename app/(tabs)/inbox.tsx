// app/(tabs)/inbox.tsx
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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------- Types ----------
type Conversation = {
  id: number;
  user1Id: number;
  user2Id: number;
  listingId: number | null;
  lastMessageAt: string | null;
  createdAt: string | null;
};

type StoredUser =
  | {
      name?: string;
      email?: string;
      picture?: string;
      accessToken?: string; // might be present from old flow, but unused here
    }
  | null;

// ---------- Small helpers ----------
const STORAGE_KEYS_TO_TRY = ["user", "authUser", "profile", "googleAuth", "username"];

async function loadUserFromStorage(): Promise<StoredUser> {
  for (const key of STORAGE_KEYS_TO_TRY) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.name || parsed.email || parsed.picture || parsed.accessToken)) return parsed;
      if (parsed?.user && (parsed.user.name || parsed.user.email || parsed.user.picture)) return parsed.user;
    } catch {
      // sometimes a plain string (rare)
      if (raw.includes("@")) return { email: raw };
      return { name: raw };
    }
  }
  return null;
}

// robust base64 for React Native / Web
function base64(str: string): string {
  // @ts-ignore
  if (typeof btoa === "function") return btoa(str);
  try {
    // @ts-ignore Buffer might exist (Expo/RN polyfill)
    if (typeof Buffer !== "undefined") return Buffer.from(str, "utf8").toString("base64");
  } catch {}
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let i = 0;
  // UTF-8 encode
  str = unescape(encodeURIComponent(str));
  while (i < str.length) {
    const c1 = str.charCodeAt(i++);
    const c2 = str.charCodeAt(i++);
    const c3 = str.charCodeAt(i++);
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >> 4);
    let e3 = ((c2 & 15) << 2) | (c3 >> 6);
    let e4 = c3 & 63;
    if (isNaN(c2)) {
      e3 = 64;
      e4 = 64;
    } else if (isNaN(c3)) {
      e4 = 64;
    }
    output += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
  }
  return output;
}

function basicHeader(user = "user", pass = "password") {
  return `Basic ${base64(`${user}:${pass}`)}`;
}

// ---------- Component ----------
export default function InboxPage() {
  const { width } = useWindowDimensions();
  const [user, setUser] = useState<StoredUser>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const u = await loadUserFromStorage();
      setUser(u);
    } catch (e) {
      console.error("Error loading user info:", e);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchConversations = async () => {
        try {
          setLoading(true);
          setError(null);

          // ✅ Only need an email now (no JWT)
          const email = user?.email;
          if (!email) {
            throw new Error("No user email found. Please sign in again.");
          }

          const AUTH = basicHeader();

          // 1) Resolve the backend user by email
          const meUrl = `https://hood-deals-3827cb9a0599.herokuapp.com/api/user/by-email?email=${encodeURIComponent(
            email
          )}`;
          const meRes = await fetch(meUrl, {
            headers: {
              Authorization: AUTH,
              "Content-Type": "application/json",
            },
          });

          if (!meRes.ok) {
            const body = await meRes.text();
            console.log("Error /api/user/by-email:", meRes.status, body);
            throw new Error(
              meRes.status === 404
                ? "Account not found. Try signing in again."
                : `Failed to resolve user: ${meRes.status}`
            );
          }

          const me = await meRes.json();
          const userId: number = me.id;

          // 2) Fetch conversations for that user (try /api/conversations then fallback to /conversations)
          const base = "https://hood-deals-3827cb9a0599.herokuapp.com";
          const apiFirst = `${base}/api/conversations?userId=${userId}&page=0&size=20`;
          let convoRes = await fetch(apiFirst, {
            headers: {
              Authorization: AUTH,
              "Content-Type": "application/json",
            },
          });

          if (convoRes.status === 404) {
            const fallback = `${base}/conversations?userId=${userId}&page=0&size=20`;
            convoRes = await fetch(fallback, {
              headers: {
                Authorization: AUTH,
                "Content-Type": "application/json",
              },
            });
          }

          if (!convoRes.ok) {
            const body = await convoRes.text();
            console.log("Error conversations:", convoRes.status, body);
            throw new Error(`Failed to fetch conversations: ${convoRes.status}`);
          }

          const data = await convoRes.json();
          setConversations(Array.isArray(data) ? data : data.content ?? []);
        } catch (err: any) {
          console.error("Error fetching conversations:", err);
          setError(err?.message ?? "Failed to load conversations.");
        } finally {
          setLoading(false);
        }
      };

      fetchConversations();
    }, [user])
  );

  const openConversation = (item: Conversation) => {
    router.push({
      pathname: "../conversation",
      params: { conversationId: item.id },
    });
  };

  const isLarge = width > 768;
  const containerWidth = isLarge ? Math.min(700, width * 0.9) : "100%";
  const cardWidth = useMemo(() => {
    const max = 500;
    return isLarge ? Math.min(max, width * 0.6) : Math.min(520, width * 0.9);
  }, [isLarge, width]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={{ color: "red", textAlign: "center", paddingHorizontal: 16 }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
                <Text style={styles.name}>Conversation #{item.id}</Text>
                <Text numberOfLines={1} style={styles.itemSubtitle}>
                  Last message:{" "}
                  {item.lastMessageAt
                    ? new Date(item.lastMessageAt).toLocaleString()
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
        {Platform.OS === "web" ? <View style={{ height: 16 }} /> : null}
      </View>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
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
