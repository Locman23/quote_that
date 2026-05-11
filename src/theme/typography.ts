import { TextStyle } from 'react-native';

export const typography = {
  largeTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  } as TextStyle,
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
  } as TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
  } as TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  } as TextStyle,
} as const;

export type Typography = typeof typography;
