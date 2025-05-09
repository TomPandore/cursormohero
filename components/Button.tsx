import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  TouchableOpacityProps 
} from 'react-native';
import { COLORS } from '@/constants/Colors';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/Layout';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const getButtonStyle = () => {
    let baseStyle = [styles.button];
    
    // Variant styles
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButton);
    }
    
    // Size styles
    if (size === 'small') {
      baseStyle.push(styles.smallButton);
    } else if (size === 'large') {
      baseStyle.push(styles.largeButton);
    }
    
    // Width style
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    // Disabled style
    if (disabled || isLoading) {
      baseStyle.push(styles.disabledButton);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    let baseStyle = [styles.buttonText];
    
    if (variant === 'outline') {
      baseStyle.push(styles.outlineText);
    }
    
    if (size === 'small') {
      baseStyle.push(styles.smallText);
    } else if (size === 'large') {
      baseStyle.push(styles.largeText);
    }
    
    if (disabled || isLoading) {
      baseStyle.push(styles.disabledText);
    }
    
    return baseStyle;
  };
  
  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.text} size="small" />
      ) : (
        <View style={styles.contentContainer}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  smallButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  largeButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...FONTS.button,
    color: COLORS.text,
    textAlign: 'center',
  },
  outlineText: {
    color: COLORS.primary,
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.8,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});