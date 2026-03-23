import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{groupName}</Text>
      <Text>Group ID: {groupId}</Text>
      <Text>Quotes will appear here</Text>
      <Button title="Add Quote" onPress={() => navigation.navigate('CreateQuote', { groupId })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
});