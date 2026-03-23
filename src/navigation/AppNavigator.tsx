import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import CreateQuoteScreen from '../screens/quotes/CreateQuoteScreen';


export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Groups: undefined;
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupDetail: { groupId: string; groupName: string };
  CreateQuote: { groupId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="CreateQuote" component={CreateQuoteScreen} />
    </Stack.Navigator>
  );
}