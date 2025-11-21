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
import type { Message } from "@/types/chat";
import { listMessages, sendMessage } from "@/api/chat";

export default function ConversationScreen() {
  const params = useLocalSearchParams();
  const conversationId = Number(params.conversationId);

  // ✅ Get the current user from backend (/me)
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

  // 🔹 Fetch logged-in user ID
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://10.0.2.2:8080/me", {
          headers: {
            Authorization: "Basic " + btoa("user:password"),
          },
        });
        const me = await res.json();
        setMyUserId(me.id);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    })();
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, reset = false) => {
      try {
        const res = await listMessages(conversationId, pageToLoad, size);
        setHasMore(!res.last);
        setMessages((prev) => (reset ? res.content : [...prev, ...res.content]));
        setPage(res.number);

        // derive the other user's ID from first message
        if (!otherUserId && myUserId && res.content.length > 0) {
          const sample = res.content[0];
          const derived =
            sample.senderId === myUserId
              ? sample.receiverId
              : sample.senderId;
          setOtherUserId(derived);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load messages");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [conversationId, size, myUserId, otherUserId]
  );

  useEffect(() => {
    if (myUserId) {
      loadPage(0, true);
    }
  }, [myUserId]);

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
