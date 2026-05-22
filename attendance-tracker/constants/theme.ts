import { Platform } from 'react-native';

const tintColorLight = '#111827';
const tintColorDark = '#FFFFFF';

export const Colors = {
  light: {
    text: '#111111',
    background: '#F8F8F7',
    card: '#FFFFFF',
    secondaryText: '#6B7280',
    border: '#E5E7EB',
    primary: '#111827',

    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },

  dark: {
    text: '#ECEDEE',
    background: '#151718',
    card: '#1E1E1E',
    secondaryText: '#9CA3AF',
    border: '#2A2A2A',
    primary: '#FFFFFF',

    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },

  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },

  web: {
    sans:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",

    serif:
      "Georgia, 'Times New Roman', serif",

    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",

    mono:
      "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});