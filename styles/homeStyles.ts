import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    paddingTop: 20, 
  },

  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 10,
  },

listContent: {
  paddingTop: 60,    // adds space above the top listings
  paddingBottom: 80,
  paddingHorizontal: 10,
},

appTitle: {
  fontSize: 50,
  fontWeight: "bold",
  color: "white",
  textAlign: "center",
  marginBottom: 20,
},

  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.90)",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },

  image: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    resizeMode: "cover",
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },

  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E8B57", // green price
    marginTop: 2,
  },

  category: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginTop: 4,
  },
});
