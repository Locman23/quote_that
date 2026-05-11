import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, radius } from '../theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => unknown;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const isDisabled = disabled || loading;
  const isLight = variant === 'secondary' || variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <Animated.View
        style={[
          styles.base,
          variantStyles[variant],
          isDisabled && styles.disabled,
          { transform: [{ scale }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isLight ? colors.text : '#FFFFFF'}
          />
        ) : (
          <Text style={[styles.label, variantTextStyles[variant]]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  label: {
    ...typography.subtitle,
    letterSpacing: 0.1,
  },
  disabled: {
    opacity: 0.45,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  secondary: {
    backgroundColor: colors.softAccent,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
});

const variantTextStyles = StyleSheet.create({
  primary: {
    color: colors.surface,
  },
  secondary: {
    color: colors.text,
  },
  ghost: {
    color: colors.text,
  },
  danger: {
    color: '#FFFFFF',
  },
});
