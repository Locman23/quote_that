import { StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import CircleIconButton from '../../components/CircleIconButton';

const ACCENT = '#6DBF8A';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <CircleIconButton icon="⌂" filled accessibilityLabel="Back to home" onPress={() => navigation.navigate('Groups')} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>More settings are coming soon.</Text>

          <AppButton title="Open Profile" onPress={() => navigation.navigate('Profile')} />

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 4,
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
