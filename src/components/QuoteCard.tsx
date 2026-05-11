import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';

interface QuoteCardProps {
  quotedPersonName: string;
  content: string;
  context?: string;
  createdAt?: string;
  groupName?: string;
  onPress?: () => void;
  isEdited?: boolean;
}

function formatShortDate(date: Date, now: Date): string {
  const isSameYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(isSameYear ? {} : { year: 'numeric' }),
  });
}

function formatRelativeDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((todayStart - targetStart) / dayMs);

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays}d ago`;
  }

  if (diffDays >= 7 && diffDays < 28) {
    return `${Math.floor(diffDays / 7)}w ago`;
  }

  return formatShortDate(date, now);
}

export default function QuoteCard({
  quotedPersonName,
  content,
  context,
  createdAt,
  groupName,
  onPress,
  isEdited = false,
}: QuoteCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      disabled={!onPress}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text style={styles.content}>{'\u201C'}{content}{'\u201D'}</Text>

        <Text style={styles.person}>{'\u2014\u00A0'}{quotedPersonName}</Text>

        {(context || groupName || createdAt || isEdited) ? (
          <View style={styles.meta}>
            {context ? (
              <Text style={styles.context}>{context}</Text>
            ) : null}
            {(groupName || createdAt || isEdited) ? (
              <Text style={styles.metaLine}>
                {[groupName, createdAt ? formatRelativeDate(createdAt) : null, isEdited ? 'Edited' : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
          </View>
        ) : null}
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
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  content: {
    ...typography.body,
    color: colors.text,
    fontSize: 17,
    lineHeight: 26,
  },
  person: {
    ...typography.subtitle,
    color: colors.text,
  },
  meta: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  context: {
    ...typography.body,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  metaLine: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
