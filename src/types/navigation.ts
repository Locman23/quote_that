import type { AuthStackParamList } from '../navigation/AuthNavigator';
import type { AppStackParamList } from '../navigation/AppNavigator';

export type RootStackParamList = AuthStackParamList & AppStackParamList;