import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const sampleMsgs = [
    { id: '1', from: 'Alice', message: 'Is the bike still available?' },
    { id: '2', from: 'Bob', message: 'Can you lower the price on the PS5?' },
    { id: '3', from: 'Charlie', message: 'I am interested in the IKEA desk.' },
    { id: '4', from: 'Abel', message: 'Yo I heard 67 was back and I wanted this to put on my boy Krishneet' },
    { id: '5', from: 'Eduardo', message: 'Do you have any little boys I can buy, for the party?' },
    { id: '6', from: 'Reggie', message: 'I am interested in the IKEA desk.' },
];

export default function ConversationScreen() {
    const params = useLocalSearchParams();
    const conversationId = params.conversationId;
    const message = sampleMsgs.find(msg => msg.id === conversationId);
    const sender = message ? message.from : 'Unknown';
    return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <Text style={styles.header}>{sender}</Text>
        </View>
        <View style={styles.container}>
            <Text style={styles.message}>Message: {message ? message.message : 'No message found.'}</Text>
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
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  message:{
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  }
});