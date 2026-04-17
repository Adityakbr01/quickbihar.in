import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/src/theme/Provider/ThemeProvider';
import Check from '@/assets/lottie/Check.json';
import successConfetti from '@/assets/lottie/successConfetti.json';


const { width } = Dimensions.get('window');

const IOSToast = ({ props, icon, color, isSuccess }: any) => {
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';


  const lottieRef = React.useRef<LottieView>(null);
  const [lottieSource, setLottieSource] = useState<any>(successConfetti);

  // ✅ FIX: Always trigger animation on new toast
  useEffect(() => {
    if (isSuccess) {
      // Pick random animation
      setLottieSource(Math.random() > 0.5 ? successConfetti : Check);

      // Play it right after setting
      setTimeout(() => {
        if (lottieRef.current) {
          lottieRef.current.reset();
          lottieRef.current.play();
        }
      }, 50);
    }
  }, [props?.props?.id, isSuccess]); // 👈 IMPORTANT (forces re-run)



  return (
    <BlurView
      intensity={90}
      tint={isDark ? 'dark' : 'light'}
      style={styles.blurContainer}
    >
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: isDark
              ? 'rgba(30,30,30,0.7)'
              : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        {/* ✅ SUCCESS LOTTIE */}
        {isSuccess ? (
          <View style={styles.lottieWrapper}>
            <LottieView
              ref={lottieRef}
              source={lottieSource}
              loop={false}
              style={styles.lottie}
            />
          </View>
        ) : (
          icon && (
            <Ionicons
              name={icon}
              size={22}
              color={color}
              style={{ marginRight: 8 }}
            />
          )
        )}

        {/* TEXT */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>
            {props.text1}
          </Text>

          {props.text2 && (
            <Text
              style={[styles.subtitle, { color: theme.secondaryText }]}
            >
              {props.text2}
            </Text>
          )}
        </View>
      </View>
    </BlurView>
  );
};

export const toastConfig: ToastConfig = {
  success: (props) => (
    <IOSToast props={props} color="#34C759" isSuccess />
  ),

  error: (props) => (
    <IOSToast
      props={props}
      icon="close-circle"
      color="#FF3B30"
    />
  ),

  info: (props) => (
    <IOSToast
      props={props}
      icon="information-circle"
      color="#007AFF"
    />
  ),
};

const styles = StyleSheet.create({
  blurContainer: {
    width: width * 0.9,
    borderRadius: 10,
    overflow: 'hidden', // ✅ FIX (important)
    alignSelf: 'center',
    marginTop: 10,
    zIndex: 9999,
    elevation: 9999,
  },

  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10, // Must match blurContainer to respect visible overflow
  },

  lottieWrapper: {
    width: 48,
    height: 48,
    marginRight: 6,
  },

  lottie: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});