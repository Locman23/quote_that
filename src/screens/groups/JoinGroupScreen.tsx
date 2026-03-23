import { View, Text, StyleSheet } from 'react-native';

export default function JoinGroupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Group</Text>
      <Text>Invite code form goes here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
});