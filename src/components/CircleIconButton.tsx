import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  filled?: boolean;
};

const ACCENT = '#6DBF8A';

export default function CircleIconButton({ icon, onPress, accessibilityLabel, filled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        filled ? styles.filled : styles.outlined,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.icon, filled ? styles.filledIcon : styles.outlinedIcon]}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filled: {
    backgroundColor: ACCENT,
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  filledIcon: {
    color: '#FFFFFF',
  },
  outlinedIcon: {
    color: ACCENT,
  },
});
