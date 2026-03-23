import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Groups'>;

export default function GroupsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Groups</Text>
      <Button title="Create Group" onPress={() => navigation.navigate('CreateGroup')} />
      <Button title="Join Group" onPress={() => navigation.navigate('JoinGroup')} />
      <Button
        title="Open Demo Group"
        onPress={() =>
          navigation.navigate('GroupDetail', {
            groupId: 'demo-group',
            groupName: 'Best Friends',
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
});