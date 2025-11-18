import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,

  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Item = {
  id: string;
  title: string;
  price: string;
  description?: string;
  imageUrl?: string;
};

type StoredUser = { name?: string; email?: string; picture?: string } | null;

const STORAGE_KEYS_TO_TRY = ['user', 'username', 'profile', 'authUser'];

async function loadUserFromStorage(): Promise<StoredUser> {
  for (const key of STORAGE_KEYS_TO_TRY) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.name || parsed.email || parsed.picture)) return parsed;
      if (parsed?.user && (parsed.user.name || parsed.user.email || parsed.user.picture)) return parsed.user;
    } catch {
      return { name: raw };
    }
  }
  return null;
}

function ItemDetailModal({
  item,
  visible,
  onClose,
  refreshListings,
}: {
  item: Item | null;
  visible: boolean;
  onClose: () => void;
  refreshListings: () => void;
}) {
  const { width } = useWindowDimensions();
  const isLarge = width > 768;

  const cardWidth = useMemo(() => {
    const max = 520;
    return isLarge ? Math.min(max, width * 0.6) : Math.min(520, width * 0.9);
  }, [isLarge, width]);

  if (!item) return null;

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const username = 'user';
              const password = 'password';
              const authHeader = 'Basic ' + btoa(`${username}:${password}`);

              const response = await fetch(
                `https://hood-deals-3827cb9a0599.herokuapp.com/api/listings/${item.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!response.ok) {
                Alert.alert('Error', `Failed to delete listing: ${response.status}`);
                return;
              }

              onClose();
              refreshListings();
            } catch (err) {
              Alert.alert('Error', 'An error occurred while deleting the listing.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { width: cardWidth }]} onPress={() => {}}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.modalImage} resizeMode="contain" />
          ) : (
            <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
              <Text style={{ color: '#666' }}>No image</Text>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text style={styles.modalTitle}>{item.title}</Text>
            <Text style={styles.modalPrice}>{item.price}</Text>
            {!!item.description && <Text style={styles.modalDescription}>{item.description}</Text>}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]} onPress={onClose}>
              <Text style={styles.actionSecondaryText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.actionSecondaryText}>Delete listing</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const [user, setUser] = useState<StoredUser>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const router = useRouter();

  const isLargeScreen = width > 768;
  const containerWidth = isLargeScreen ? Math.min(700, width * 0.9) : '100%';

  const refreshUser = useCallback(async () => {
    try {
      const u = await loadUserFromStorage();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchListings = async () => {
    try {
      if (!user?.name && !user?.email) return;

      const username = 'user';
      const password = 'password';
      const authHeader = 'Basic ' + btoa(`${username}:${password}`);

      const response = await fetch(
        'https://hood-deals-3827cb9a0599.herokuapp.com/api/listings',
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        }
      );

      const text = await response.text();
      if (!text) return;

      const data = JSON.parse(text);

      const filtered = data.filter(
        (item: any) =>
          item.userName?.toLowerCase() === user?.name?.toLowerCase()
      );

      const mapped = filtered.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        price: `$${item.price}`,
        description: item.description,
        imageUrl: item.image_url,
      }));

      setUserItems(mapped);
    } catch {}
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  useEffect(() => {
    fetchListings();
  }, [user]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setUser(null);
    router.replace('/');
  };

  const onPressItem = (item: Item) => setSelectedItem(item);
  const closeModal = () => setSelectedItem(null);

  return (
    <ImageBackground
      source={require('../../assets/images/HOODDEALSLOGO4.webp')}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.contentContainer, { width: containerWidth }]}>
          <View style={styles.profileCard}>
            <Image
              source={
                user?.picture
                  ? { uri: `${user.picture}?t=${Date.now()}` }
                  : require('../../assets/images/profilepic.png')
              }
              style={styles.avatar}
            />
            <View>
              <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.email}>{user?.email || 'No email available'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            {userItems.length > 0 ? (
              <FlatList
                data={userItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listingCard} onPress={() => onPressItem(item)}>
                    <View>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {!!item.description && (
                        <Text numberOfLines={1} style={styles.itemSubtitle}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={{ textAlign: 'center', color: '#ddd', marginTop: 10 }}>No listings yet.</Text>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <ItemDetailModal
          item={selectedItem}
          visible={!!selectedItem}
          onClose={closeModal}
          refreshListings={fetchListings}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', // ⭐ DARK OVERLAY
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 700,
    paddingHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',   // ⭐ Slight transparency
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 25,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: 'black' },
  email: { fontSize: 15, color: 'black' },
  section: { flex: 1 },
  sectionTitle: { fontSize: 24, fontWeight: '600', marginBottom: 12, color: '#fff' },
  listingCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  itemTitle: { fontSize: 20, color: '#000', fontWeight: '600' },
  itemSubtitle: { fontSize: 16, color: '#444', marginTop: 2, maxWidth: 220 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#008000' },
  editButton: {
    backgroundColor: '#2e7bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 25,
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalImagePlaceholder: {
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalPrice: { fontSize: 16, fontWeight: '700', color: '#0a930a' },
  modalDescription: { fontSize: 14, color: '#333', lineHeight: 20 },
  modalActions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#ff4d4d',
  },
  actionSecondary: { backgroundColor: '#efefef' },
  actionSecondaryText: { color: '#333', fontWeight: '700' },
});
