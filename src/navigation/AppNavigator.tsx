import { Alert, Button } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import CreateQuoteScreen from '../screens/quotes/CreateQuoteScreen';
import EditQuoteScreen from '../screens/quotes/EditQuoteScreen';
import { useAuthStore } from '../store/authStore';
import type { QuoteRecord } from '../types';

export type AppStackParamList = {
  Groups: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupDetail: {
    groupId: string;
    groupName: string;
    refreshNonce?: number;
    newQuote?: QuoteRecord;
  };
  CreateQuote: { groupId: string; groupName?: string };
  EditQuote: { groupId: string; groupName?: string; quote: QuoteRecord };
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
      <AppStack.Screen name="EditQuote" component={EditQuoteScreen} options={{ title: 'Edit Quote' }} />
    </AppStack.Navigator>
  );
}

export default AppNavigator;