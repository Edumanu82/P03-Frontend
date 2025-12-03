// app/(tabs)/conversation.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Message } from "@/types/chat";
import { listMessages, sendMessage } from "@/api/chat";

const BASE_URL = "https://hood-deals-3827cb9a0599.herokuapp.com";
const BASIC_AUTH = "Basic " + btoa("user:password");

// just like Inbox: try multiple keys for the stored user
const STORAGE_KEYS_TO_TRY = ["user", "authUser", "profile", "googleAuth"];

async function loadStoredUserEmail(): Promise<string | null> {
  for (const key of STORAGE_KEYS_TO_TRY) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.email) return parsed.email;
      if (parsed?.user?.email) return parsed.user.email;
    } catch {
      // if it's just a string, ignore
    }
  }
  return null;
}

function ConversationScreen() {
  const params = useLocalSearchParams();
  const conversationId = Number(params.conversationId);

  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [otherUserId, setOtherUserId] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<Message>>(null);

  // 🔹 Get my numeric userId from backend using stored email
  useEffect(() => {
    (async () => {
      try {
        const email = await loadStoredUserEmail();
        if (!email) {
          setError("No stored user email – please sign in again.");
          setLoading(false);
          return;
        }

        const url = `${BASE_URL}/api/user/by-email?email=${encodeURIComponent(
          email
        )}`;
        console.log("GET current user:", url);

        const res = await fetch(url, {
          headers: {
            Authorization: BASIC_AUTH,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.log("/by-email error:", res.status, txt);
          throw new Error(`Failed to fetch user: ${res.status}`);
        }

        const me = await res.json();
        console.log("Current user:", me);
        setMyUserId(me.id);
      } catch (err: any) {
        console.error("Failed to fetch current user:", err);
        setError(`Failed to fetch current user: ${err.message ?? err}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, reset = false) => {
      try {
        setError(null);
        const res = await listMessages(conversationId, pageToLoad, size);
        setHasMore(!res.last);
        setMessages((prev) =>
          reset ? res.content : [...prev, ...res.content]
        );
        setPage(res.number);

        // figure out the other user from first message, once
        if (!otherUserId && myUserId && res.content.length > 0) {
          const sample = res.content[0];
          const derived =
            sample.senderId === myUserId
              ? sample.receiverId
              : sample.senderId;
          setOtherUserId(derived);
        }
      } catch (e: any) {
        console.error("Failed to load messages:", e);
        setError(e.message ?? "Failed to load messages");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [conversationId, size, myUserId, otherUserId]
  );

  // load messages once we know who I am
  useEffect(() => {
    if (myUserId) {
      setLoading(true);
      loadPage(0, true);
    }
  }, [myUserId, loadPage]);

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
    if (!content || !myUserId || !otherUserId) return;
    setDraft("");
    try {
      const msg = await sendMessage(
        conversationId,
        myUserId,
        otherUserId,
        content
      );
      setMessages((prev) => [...prev, msg]);
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    } catch (e: any) {
      console.error("Failed to send message:", e);
      setError(e.message ?? "Failed to send message");
    }
  }, [conversationId, draft, myUserId, otherUserId]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const mine = item.senderId === myUserId;
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

export default ConversationScreen; // 👈 THIS fixes the “missing default export” warning

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
