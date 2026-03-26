import { Alert, Button } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import CreateQuoteScreen from '../screens/quotes/CreateQuoteScreen';
import { useAuthStore } from '../store/authStore';

export type AppStackParamList = {
  Groups: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupDetail: {
    groupId: string;
    groupName: string;
    refreshNonce?: number;
    newQuote?: {
      id: string;
      quoted_person_name: string;
      content: string;
      context: string | null;
      created_at: string;
    };
  };
  CreateQuote: { groupId: string; groupName?: string };
};

const AppStack = createNativeStackNavigator<AppStackParamList>();

function LogoutButton() {
  const signOut = useAuthStore((state) => state.signOut);

  const handlePress = async () => {
    const error = await signOut();

    if (error) {
      Alert.alert('Logout Warning', error.message);
    }
  };

  return <Button title="Log Out" onPress={() => void handlePress()} />;
}

function AppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerRight: () => <LogoutButton />,
      }}
    >
      <AppStack.Screen name="Groups" component={GroupsScreen} />
      <AppStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <AppStack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <AppStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <AppStack.Screen name="CreateQuote" component={CreateQuoteScreen} />
    </AppStack.Navigator>
  );
}

export default AppNavigator;