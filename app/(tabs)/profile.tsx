import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
  category?: string;
  location?: string;
};

type StoredUser = {  id?: string; name?: string; email?: string; picture?: string } | null;

const STORAGE_KEYS_TO_TRY = ['user', 'username', 'profile', 'authUser'];

async function loadUserFromStorage(): Promise<StoredUser> {
  for (const key of STORAGE_KEYS_TO_TRY) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.name || parsed.email || parsed.picture)) return parsed;
      if (parsed?.user && (parsed.id || parsed.user.name || parsed.user.email || parsed.user.picture)) return parsed.user;
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
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
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

              Alert.alert('Success', 'Listing deleted successfully');
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => { }}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.modalImage} resizeMode="cover" />
          ) : (
            <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}

          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{item.title}</Text>
            <Text style={styles.modalPrice}>{item.price}</Text>

            {item.category && (
              <View style={styles.modalCategoryBadge}>
                <Text style={styles.modalCategoryText}>{item.category}</Text>
              </View>
            )}

            {item.location && (
              <Text style={styles.modalLocation}>📍 {item.location}</Text>
            )}

            {item.description && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalDescription}>{item.description}</Text>
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDeleteButtonText}>Delete</Text>
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
      if (!user?.id) return;

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
        (item: any) => item.user_id?.toString() === user?.id?.toString()
      );      

      const mapped = filtered.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        price: `$${item.price}`,
        description: item.description,
        imageUrl: item.image_url,
        category: item.category,
        location: item.location,
      }));

      setUserItems(mapped);
    } catch { }
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
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setUser(null);
            router.replace('/');
          },
        },
      ]
    );
  };

  const onPressItem = (item: Item) => setSelectedItem(item);
  const closeModal = () => setSelectedItem(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { width: containerWidth }]}>

        {/* Header with Logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/HOODDEALSLOGO3.webp')}
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>  Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={
              user?.picture
                ? { uri: `${user.picture}?t=${Date.now()}` }
                : require('../../assets/images/profilepic.png')
            }
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email available'}</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userItems.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              ${userItems.reduce((sum, item) => {
                const price = parseFloat(item.price.replace('$', ''));
                return sum + (isNaN(price) ? 0 : price);
              }, 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
        </View>

        {/* Listings Section */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>My Listings</Text>

          {userItems.length > 0 ? (
            <FlatList
              data={userItems}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listingCard}
                  onPress={() => onPressItem(item)}
                  activeOpacity={0.7}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.listingImage}
                    />
                  ) : (
                    <View style={[styles.listingImage, styles.listingImagePlaceholder]}>
                      <Text style={styles.placeholderText}>No image</Text>
                    </View>
                  )}
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text style={styles.listingDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <Text style={styles.listingPrice}>{item.price}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No listings yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start selling items in your neighborhood
              </Text>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 700,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#f0f3f7',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: '#636e72',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#636e72',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e1e8ed',
    marginHorizontal: 20,
  },
  listingsSection: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  listingImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f3f7',
  },
  listingImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  listingDescription: {
    fontSize: 13,
    color: '#636e72',
    lineHeight: 18,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636e72',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#b2bec3',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f3f7',
  },
  modalImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#b2bec3',
    fontSize: 14,
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 12,
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f3f7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636e72',
  },
  modalLocation: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 16,
  },
  modalSection: {
    marginTop: 8,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: '#636e72',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  modalCloseButton: {
    flex: 1,
    backgroundColor: '#f0f3f7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
  },
  modalCloseButtonText: {
    color: '#636e72',
    fontWeight: '700',
    fontSize: 16,
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalDeleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 40,
  },
});