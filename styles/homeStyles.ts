import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    paddingTop: 20, // adds breathing room at the top
  },

  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 10,
  },

listContent: {
  paddingTop: 60,    // adds space above the top listings
  paddingBottom: 80,
  paddingHorizontal: 10,
},

appTitle: {
  fontSize: 26,
  fontWeight: "700",
  color: "#2e7bff",
  textAlign: "center",
  marginBottom: 20,
},

  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E8B57", // green price
    marginTop: 2,
  },

  category: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
});
