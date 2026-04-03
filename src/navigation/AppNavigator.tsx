import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import CreateQuoteScreen from '../screens/quotes/CreateQuoteScreen';
import EditQuoteScreen from '../screens/quotes/EditQuoteScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import type { QuoteRecord } from '../types';

export type AppStackParamList = {
  Groups: undefined;
  Profile: undefined;
  Settings: undefined;
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

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen
        name="Groups"
        component={GroupsScreen}
      />
      <AppStack.Screen name="Settings" component={SettingsScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <AppStack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <AppStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <AppStack.Screen name="CreateQuote" component={CreateQuoteScreen} />
      <AppStack.Screen name="EditQuote" component={EditQuoteScreen} />
    </AppStack.Navigator>
  );
}

export default AppNavigator;