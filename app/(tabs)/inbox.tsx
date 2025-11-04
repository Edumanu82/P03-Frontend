import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sampleMsgs = [
    { id: '1', from: 'Alice', message: 'Is the bike still available?' },
    { id: '2', from: 'Bob', message: 'Can you lower the price on the PS5?' },
    { id: '3', from: 'Charlie', message: 'I am interested in the IKEA desk.' },
    { id: '4', from: 'Abel', message: 'Yo I heard 67 was back and I wanted this to put on my boy Krishneet' },
    { id: '5', from: 'Eduardo', message: 'Do you have any little boys I can buy, for the party?' },
    { id: '6', from: 'Reggie', message: 'I am interested in the IKEA desk.' },
];

function onPressItem(item: { id: string; from: string; message: string }) {
    console.log('Pressed item:', item);
    router.push({
        pathname: '../conversation',
        params: { conversationId: item.id },
    }); //TODO: change to navigate to chat screen when ready
}

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

export default function InboxPage() {
    
    const { width } = useWindowDimensions();
    const [user, setUser] = useState<StoredUser>(null);

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

    const isLarge = width > 768;
    const isLargeScreen = width > 768;
    const containerWidth = isLargeScreen ? Math.min(700, width * 0.9) : '100%';
    
    const cardWidth = useMemo(() => {
        const max = 500; 
        return isLarge ? Math.min(max, width * 0.6) : Math.min(520, width * 0.9);
    }, [isLarge, width]);

    return (
    <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, {width: containerWidth}]}>
            <Text style={styles.header}>Inbox</Text>
            <FlatList
                data={sampleMsgs}
                keyExtractor={(item) => item.id}
                // style={{ width: width * 0.9, marginTop: 20 }}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.profileCard} onPress={() => onPressItem(item)}>
                        <Image
                            source={
                                user?.picture
                                    ? { uri: `${user.picture}?t=${Date.now()}` }
                                    : require('../../assets/images/profilepic.png')
                            }
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={styles.name}>{item.from}</Text>
                                <Text numberOfLines={1} style={styles.itemSubtitle}>
                                    {item.message}
                                </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    maxWidth: 1400, 
    width: '100%',
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
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
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  itemSubtitle: { fontSize: 14, color: '#666', marginTop: 2, maxWidth: 220 },
});