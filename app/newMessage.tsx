import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type userInfo = {
  id: number;
  name: string;
};

export default function NewMessage() {
  
  const [loading, setLoading] = useState(false);

  const params = useLocalSearchParams();
  const userID = params.userId;
  const userName = params.userName as string;
  const userPFP = params.pfp as string;
  console.log("UserPFP:", userPFP);


  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={styles.formCard}>
                {userPFP && (
                    <Image
                        source={{ uri: userPFP }}
                        style={styles.sellerImage}
                    />
                )}
                <h1>New Message For {userName} ID: {userID}</h1>
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="How is it going?"
                        placeholderTextColor="#999"
                        multiline
                        style={[styles.input, styles.textArea]}
                        // value={description}
                        // onChangeText={setDescription}
                    />
                </View>
                {/* Post Button */}
                <TouchableOpacity
                    style={[styles.postButton, loading && styles.buttonDisabled]}
                    // onPress={handlePost}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.postButtonText}>
                        {loading ? 'Sedning...' : 'Send Messaege'}
                    </Text>
                </TouchableOpacity>
                
                {/* Cancel Button */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.navigate('../(tabs)/home')}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
      </KeyboardAvoidingView>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
   formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    margin: 16,
    marginTop: 50,
  },
    sellerImage: {
    width: 100,
    height: 100,
    borderRadius: 55,
    marginRight: 12,
    backgroundColor: "#f0f3f7",
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2d3436',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#003366',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#f0f3f7',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e8ed',
  },
  cancelButtonText: {
    color: '#636e72',
    fontSize: 16,
    fontWeight: '600',
  },
});