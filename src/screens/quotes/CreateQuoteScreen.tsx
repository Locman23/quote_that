import { ActivityIndicator, Button, View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useGroupMembershipGuard } from '../../utils/useGroupMembershipGuard';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateQuote'>;

export default function CreateQuoteScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const groupAccess = useGroupMembershipGuard(groupId);

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
      <Text style={styles.title}>Create Quote</Text>
      <Text style={styles.subtitle}>Adding to {groupAccess.groupName}</Text>
      <Text>Quote form goes here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#555555', marginBottom: 8, textAlign: 'center' },
  stateText: { fontSize: 16, color: '#444444', textAlign: 'center' },
  errorText: { fontSize: 16, color: '#B00020', textAlign: 'center' },
});