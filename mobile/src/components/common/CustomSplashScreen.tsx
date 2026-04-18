// import React, { useEffect, useRef } from "react";
// import { StyleSheet, Image } from "react-native";
// import * as SplashScreen from "expo-splash-screen";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   runOnJS,
// } from "react-native-reanimated";

// // --- EASE OF ADJUSTMENT ---
// const LOGO_WIDTH = 320;
// const LOGO_HEIGHT = 160;
// const BACKGROUND_COLOR = "#80C314"; // Branded green from app.json
// const FADE_DURATION = 500;
// const MIN_VISIBLE_DURATION = 900;
// // --------------------------

// interface CustomSplashScreenProps {
//   readyToDismiss: boolean;
//   onAnimationFinish: () => void;
// }

// export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({
//   readyToDismiss,
//   onAnimationFinish,
// }) => {
//   const opacity = useSharedValue(1);
//   const mountedAt = useRef(Date.now());
//   const hasStartedExit = useRef(false);
//   const hasHiddenNativeSplash = useRef(false);

//   useEffect(() => {
//     if (!readyToDismiss || hasStartedExit.current) {
//       return;
//     }

//     hasStartedExit.current = true;
//     const elapsed = Date.now() - mountedAt.current;
//     const delay = Math.max(0, MIN_VISIBLE_DURATION - elapsed);

//     const timeout = setTimeout(() => {
//       opacity.value = withTiming(0, { duration: FADE_DURATION }, (finished) => {
//         if (finished) {
//           runOnJS(onAnimationFinish)();
//         }
//       });
//     }, delay);

//     return () => clearTimeout(timeout);
//   }, [onAnimationFinish, opacity, readyToDismiss]);

//   const animatedStyle = useAnimatedStyle(() => ({
//     opacity: opacity.value,
//   }));

//   return (
//     <Animated.View style={[styles.container, animatedStyle]}>
//       <Image
//         source={require("@/assets/images/QuickBihar_Wordmark.png")}
//         style={{
//           width: LOGO_WIDTH,
//           height: LOGO_HEIGHT,
//         }}
//         resizeMode="contain"
//         onLoadEnd={() => {
//           if (!hasHiddenNativeSplash.current) {
//             hasHiddenNativeSplash.current = true;
//             SplashScreen.hideAsync().catch(() => { });
//           }
//         }}
//       />
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: BACKGROUND_COLOR,
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 9999,
//   },
// });
