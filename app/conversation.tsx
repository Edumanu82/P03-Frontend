import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Message } from "@/types/chat";
import { listMessages, sendMessage } from "@/api/chat";

type Params = {
  conversationId?: string;
  otherUserId?: string;
};

const STORAGE_KEYS_TO_TRY = ["user", "authUser", "profile", "googleAuth"];

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

const BASIC_AUTH = "Basic " + btoa("user:password");
const BASE_URL = "https://hood-deals-3827cb9a0599.herokuapp.com";

export default function ConversationScreen() {
  const params = useLocalSearchParams<Params>();
  const conversationId = Number(params.conversationId);
  const initialOtherUserId = params.otherUserId
    ? Number(params.otherUserId)
    : null;

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [otherUserId, setOtherUserId] = useState<number | null>(
    initialOtherUserId
  );

  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<Message>>(null);

  // Keep otherUserId in sync with params if they change
  useEffect(() => {
    if (initialOtherUserId && !otherUserId) {
      setOtherUserId(initialOtherUserId);
    }
  }, [initialOtherUserId, otherUserId]);

  //  Fetch logged-in user via /api/user/by-email
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadUserFromStorage();
        if (!stored?.email) {
          console.log("No stored email, cannot resolve user");
          return;
        }

        const url = `${BASE_URL}/api/user/by-email?email=${encodeURIComponent(
          stored.email
        )}`;
        console.log("GET current user:", url);

        const res = await fetch(url, {
          headers: {
            Authorization: BASIC_AUTH,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const body = await res.text();
          console.log("Error fetching current user:", res.status, body);
          return;
        }

        const me = await res.json();
        console.log("Current user:", me);
        setMyUserId(me.id);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    })();
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, reset = false) => {
      try {
        setError(null);
        const r = await listMessages(conversationId, pageToLoad, size);
        setHasMore(!r.last);
        setMessages((prev) => (reset ? r.content : [...prev, ...r.content]));
        setPage(r.number);

        // If we didn't get otherUserId from params, try to derive from messages
        if (!otherUserId && myUserId && r.content.length > 0) {
          const sample = r.content[0];
          const derived =
            sample.senderId === myUserId
              ? sample.receiverId
              : sample.senderId;
          setOtherUserId(derived);
        }
      } catch (e: any) {
        console.log("listMessages error body:", e);
        setError(e.message ?? "Failed to load messages");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [conversationId, size, myUserId, otherUserId]
  );

  // Initial load once we know who we are
  useEffect(() => {
    if (myUserId && conversationId) {
      setLoading(true);
      loadPage(0, true);
    }
  }, [myUserId, conversationId, loadPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPage(0, true);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (loading || !hasMore) return;
    loadPage(page + 1);
  }, [hasMore, loading, loadPage, page]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content) return;
    if (!myUserId) {
      Alert.alert("Error", "Could not determine your user id.");
      return;
    }

   
    let receiverId = otherUserId;

    if (!receiverId && messages.length > 0) {
      const sample = messages[0];
      receiverId =
        sample.senderId === myUserId ? sample.receiverId : sample.senderId;
      setOtherUserId(receiverId);
    }

    if (!receiverId) {
      Alert.alert("Error", "Could not determine who you are messaging.");
      return;
    }

    setDraft("");
    try {
      const msg = await sendMessage(conversationId, myUserId, receiverId, content);
      setMessages((prev) => [...prev, msg]);

      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    } catch (e: any) {
      console.error("Failed to send message:", e);
      setError(e.message ?? "Failed to send message");
    }
  }, [conversationId, draft, myUserId, otherUserId, messages]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const mine = myUserId != null && item.senderId === myUserId;
      return (
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
          <Text style={styles.content}>{item.content}</Text>
          <Text style={styles.meta}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      );
    },
    [myUserId]
  );

  if (loading && !messages.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 12, paddingBottom: 72 },
  bubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 6,
  },
  mine: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  theirs: { alignSelf: "flex-start", backgroundColor: "#eee" },
  content: { fontSize: 16 },
  meta: { fontSize: 11, opacity: 0.6, marginTop: 4 },
  inputRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginRight: 8,
  },
  sendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderRadius: 8,
  },
  sendText: { color: "#fff", fontWeight: "600" },
  error: { color: "red", textAlign: "center", marginVertical: 8 },
});
