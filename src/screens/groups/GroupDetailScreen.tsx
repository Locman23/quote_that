import { ActivityIndicator, View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useGroupMembershipGuard } from '../../utils/useGroupMembershipGuard';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const groupAccess = useGroupMembershipGuard(groupId, groupName);

  if (groupAccess.isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" />
        <Text style={styles.stateText}>Checking group access...</Text>
      </View>
    );
  }

  if (!groupAccess.hasAccess) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{groupAccess.errorMessage}</Text>
        <Button title="Back to Groups" onPress={() => navigation.navigate('Groups')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{groupAccess.groupName ?? groupName}</Text>
      <Text>Group ID: {groupId}</Text>
      <Text>Quotes will appear here</Text>
      <Button title="Add Quote" onPress={() => navigation.navigate('CreateQuote', { groupId })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  stateText: { fontSize: 16, color: '#444444', textAlign: 'center' },
  errorText: { fontSize: 16, color: '#B00020', textAlign: 'center' },
});