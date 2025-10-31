import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const userItems = [
  { id: '1', title: 'PS5 Console', price: '$400' },
  { id: '2', title: 'IKEA Desk', price: '$60' },
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

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const [user, setUser] = useState<StoredUser>(null);
  const router = useRouter(); 

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
      console.log('User logged out');
      router.replace('/');

    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.contentContainer, { width: containerWidth }]}>
        {/* User Info */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
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
            renderItem={({ item }) => (
              <View style={styles.listingCard}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
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
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  email: {
    fontSize: 15,
    color: '#555',
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  listingCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    color: '#222',
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#008000',
  },
  editButton: {
    backgroundColor: '#2e7bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 25,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
