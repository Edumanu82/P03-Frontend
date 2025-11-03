import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Item = {
  id: string;
  title: string;
  price: string;
  description?: string;
  imageUrl?: string;
};

const userItems: Item[] = [
  {
    id: '1',
    title: 'PS5 Console',
    price: '$400',
    description: 'Gently used PS5 with one DualSense controller and HDMI cable.',
    imageUrl: undefined,
  },
  {
    id: '2',
    title: 'IKEA Desk',
    price: '$60',
    description: 'Simple, sturdy desk (100x60cm). Small scratch on the surface.',
    imageUrl: undefined,
  },
];

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
}: {
  item: Item | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const isLarge = width > 768;

  const cardWidth = useMemo(() => {
    const max = 520; // desktop/tablet max width
    return isLarge ? Math.min(max, width * 0.6) : Math.min(520, width * 0.9);
  }, [isLarge, width]);

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose} 
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Stop backdrop presses from closing when tapping inside the card */}
        <Pressable style={[styles.modalCard, { width: cardWidth }]} onPress={() => {}}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.modalImage} />
          ) : (
            <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
              <Text style={{ color: '#666' }}>No image</Text>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text style={styles.modalTitle}>{item.title}</Text>
            <Text style={styles.modalPrice}>{item.price}</Text>
            {!!item.description && (
              <Text style={styles.modalDescription}>{item.description}</Text>
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]} onPress={onClose}>
              <Text style={styles.actionSecondaryText}>Close</Text>
                </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteBtn]} onPress={onClose}>
              <Text style={styles.actionSecondaryText}>Delete</Text>
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
  const router = useRouter();

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const isLargeScreen = width > 768;
  const containerWidth = isLargeScreen ? Math.min(700, width * 0.9) : '100%';

  const refreshUser = useCallback(async () => {
    try {
      const u = await loadUserFromStorage();
      setUser(u);
    } catch (e) {
      console.error('Error loading user info:', e);
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const onPressItem = (item: Item) => setSelectedItem(item);
  const closeModal = () => setSelectedItem(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.contentContainer, { width: containerWidth }]}>
        {/* User Info */}
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

        {/* My Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings</Text>
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
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
            

      {/* Item Detail Modal */}
      <ItemDetailModal item={selectedItem} visible={!!selectedItem} onClose={closeModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center' },
  contentContainer: { flex: 1, width: '100%', maxWidth: 700, paddingHorizontal: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  email: { fontSize: 15, color: '#555' },
  section: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  listingCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemTitle: { fontSize: 16, color: '#222', fontWeight: '600' },
  itemSubtitle: { fontSize: 13, color: '#666', marginTop: 2, maxWidth: 220 },
  itemPrice: { fontWeight: 'bold', color: '#008000' },
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

  /* Modal styles */
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalImage: {
    width: '100%',
    height: 160,
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

  actionPrimary: { backgroundColor: '#2e7bff' },
  actionPrimaryText: { color: '#fff', fontWeight: '700' },
  actionSecondary: { backgroundColor: '#efefef' },
  actionSecondaryText: { color: '#333', fontWeight: '700' },
});
