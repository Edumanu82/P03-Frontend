import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sampleItems = [
  { id: '1', title: 'Used Bike', price: '$80', image: 'https://obedbikes.com/cdn/shop/files/OB-GVR-Outdoor-AM-22.jpg?v=1753731485&width=1200' },
  { id: '2', title: 'PS5 Console', price: '$400', image: 'https://www.cnet.com/a/img/resize/f898602d0b7537b2f9e9ff41aa2551705416072c/hub/2020/10/26/b60bfe6f-3193-4381-b0d4-ac628cdcc565/img-1419.jpg?auto=webp&fit=crop&height=1200&width=1200' },
  { id: '3', title: 'IKEA Desk', price: '$60', image: 'https://sweetmodern.com/display/images/046307_IMG_8107.JPG' },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  
  const numColumns = width > 1200 ? 3 : width > 768 ? 2 : 1;
  const isMultiColumn = numColumns > 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>HoodDeals</Text>
        <FlatList
          data={sampleItems}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns} 
          columnWrapperStyle={isMultiColumn ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { width: isMultiColumn ? `${100 / numColumns - 2}%` : '100%' }]}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.price}>{item.price}</Text>
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
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    maxWidth: 1400, 
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f4f4f4',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
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