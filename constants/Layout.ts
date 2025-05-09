import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const WINDOW = {
  width,
  height,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

export const FONTS = {
  heading: {
    fontFamily: 'Rajdhani-Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  subheading: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    fontFamily: 'Rajdhani-Medium',
    fontSize: 16,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
};