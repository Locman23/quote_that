import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface GroupCardProps {
  name: string;
  joinCode: string;
  quoteCount?: number;
  onPress: () => void;
}

export default function GroupCard({ name, joinCode, quoteCount, onPress }: GroupCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value < 1 ? 0.94 : 1,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 20, stiffness: 320 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 320 });
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text style={styles.title} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {`Code: ${joinCode}`}
          {typeof quoteCount === 'number' ? `  ·  ${quoteCount} quotes` : ''}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
