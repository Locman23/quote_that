import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { NavigatorScreenParams } from '@react-navigation/native';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import CreateQuoteScreen from '../screens/quotes/CreateQuoteScreen';
import EditQuoteScreen from '../screens/quotes/EditQuoteScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import HomeScreen from '../screens/home/HomeScreen';
import SettingsTabScreen from '../screens/settings/SettingsTabScreen';
import type { QuoteRecord } from '../types';
import { colors, radius } from '../theme';

export type GroupsStackParamList = {
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

export type AppTabParamList = {
  HomeTab: undefined;
  GroupsTab: NavigatorScreenParams<GroupsStackParamList> | undefined;
  SettingsTab: undefined;
};

export type AppStackParamList = AppTabParamList & GroupsStackParamList;

const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();

function GroupsNavigator() {
  return (
    <GroupsStack.Navigator screenOptions={{ headerShown: false }}>
      <GroupsStack.Screen name="Groups" component={GroupsScreen} />
      <GroupsStack.Screen name="Settings" component={SettingsScreen} />
      <GroupsStack.Screen name="Profile" component={ProfileScreen} />
      <GroupsStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <GroupsStack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <GroupsStack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <GroupsStack.Screen name="CreateQuote" component={CreateQuoteScreen} />
      <GroupsStack.Screen name="EditQuote" component={EditQuoteScreen} />
    </GroupsStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppTabs.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';

          if (route.name === 'HomeTab') {
            iconName = 'home-outline';
          } else if (route.name === 'GroupsTab') {
            iconName = 'people-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      })}
    >
      <AppTabs.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <AppTabs.Screen name="GroupsTab" component={GroupsNavigator} options={{ title: 'Groups' }} />
      <AppTabs.Screen name="SettingsTab" component={SettingsTabScreen} options={{ title: 'Settings' }} />
    </AppTabs.Navigator>
  );
}

export default AppNavigator;