import { FlatList, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sampleItems = [
  { id: '1', title: 'Used Bike', price: '$80', image: 'https://obedbikes.com/cdn/shop/files/OB-GVR-Outdoor-AM-22.jpg?v=1753731485&width=1200' },
  { id: '2', title: 'PS5 Console', price: '$400', image: 'https://www.cnet.com/a/img/resize/f898602d0b7537b2f9e9ff41aa2551705416072c/hub/2020/10/26/b60bfe6f-3193-4381-b0d4-ac628cdcc565/img-1419.jpg?auto=webp&fit=crop&height=1200&width=1200' },
  { id: '3', title: 'IKEA Desk', price: '$60', image: 'https://sweetmodern.com/display/images/046307_IMG_8107.JPG' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.header}>HoodDeals</Text>
      <FlatList
        data={sampleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>{item.price}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f4f4f4',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    marginTop: 8,
    fontWeight: '600',
  },
  price: {
    color: '#008000',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

