import { View, Text, StyleSheet } from 'react-native';

export default function CreateGroupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Group</Text>
      <Text>Form goes here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
});