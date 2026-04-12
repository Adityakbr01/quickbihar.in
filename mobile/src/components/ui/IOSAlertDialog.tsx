import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/theme/Provider/ThemeProvider';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface IOSAlertDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

const { width } = Dimensions.get('window');

const IOSAlertDialog: React.FC<IOSAlertDialogProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons,
}) => {
  const theme = useTheme();
  const isDark = theme.background === '#0f0f0f'; // Simple check for dark mode

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <BlurView
            intensity={100}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.alertContent,
              { backgroundColor: isDark ? 'rgba(30,30,30)' : 'rgba(255,255,255)' }
            ]}
          >
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              {message && (
                <Text style={[styles.message, { color: theme.text }]}>
                  {message}
                </Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                const isLast = index === buttons.length - 1;

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    style={[
                      styles.button,
                      !isLast && styles.borderBottom,
                      { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    ]}
                    onPress={() => {
                      if (button.onPress) button.onPress();
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: isDestructive
                            ? '#FF3B30'
                            : isDark
                              ? '#0A84FF'
                              : '#007AFF', // iOS System Blue
                          fontWeight: isCancel ? '600' : '400',
                        },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.75,
    borderRadius: 14,
    overflow: 'hidden',
  },
  alertContent: {
    paddingTop: 20,
  },
  textContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'column',
  },
  button: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  borderBottom: {
    // Optional: for grid layout if we had 2 buttons side-by-side
  },
  buttonText: {
    fontSize: 17,
  },
});

export default IOSAlertDialog;
