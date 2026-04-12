import { TextInput } from "@/src/theme/components/TextInput";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput as RNTextInput,
} from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/auth.style";
import { lightTheme } from "@/src/theme/colors";
import { useAuthenticate } from "../hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, AuthFormData } from "../validation/auth.schema";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: authenticate, isPending: loading } = useAuthenticate();

  const passwordRef = useRef<RNTextInput>(null);

  const onSubmit = (data: AuthFormData) => {
    setApiError(null);
    authenticate(data, {
      onError: (error: any) => {
        setApiError(error.message || "Authentication failed. Please try again.");
      },
    });
  };

  const ANIMATION_START = 100;
  const getDelay = (index: number) => ANIMATION_START + index * 100;

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={lightTheme.spgradient}
        locations={[0, 0.28, 0.62, 0.9, 9.2]}
        start={{ x: -0.4, y: 0 }}
        end={{ x: -0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Interactive SVG Section */}
          <Animated.View
            style={styles.iconContainer}
            entering={FadeInDown.delay(getDelay(0)).duration(600)}
          >
            <LottieView
              source={require("../../../../assets/lottie/Gift box.json")}
              autoPlay
              loop
              style={{ width: 340, height: 240 }}
            />
          </Animated.View>

          {/* Header Text */}
          <Animated.View
            style={styles.header}
            entering={FadeInDown.delay(getDelay(1)).duration(600)}
          >
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your account or enter your email and we'll create one
              for you.
            </Text>
          </Animated.View>

          {/* Error Banner */}
          {apiError && (
            <Animated.View
              entering={FadeInDown}
              layout={LinearTransition}
              style={styles.errorBanner}
            >
              <Ionicons name="warning-outline" size={20} color="#fca5a5" />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </Animated.View>
          )}

          {/* Unified Form */}
          <Animated.View
            style={[styles.form, loading && { opacity: 0.7 }]}
            entering={FadeInDown.delay(getDelay(2)).duration(600)}
          >
            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email Address"
                  variant="glass"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!loading}
                  error={errors.email?.message}
                  icon={
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="rgba(255,255,255,0.7)"
                    />
                  }
                />
              )}
            />

            {/* Password Input */}
            <View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={passwordRef}
                    label="Password"
                    variant="glass"
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!loading}
                    error={errors.password?.message}
                    icon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="rgba(255,255,255,0.7)"
                      />
                    }
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ padding: 4 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="rgba(255,255,255,0.6)"
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />
              <TouchableOpacity
                style={{ alignSelf: "flex-end", marginTop: 8 }}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Continue Button */}
          <Animated.View entering={FadeInDown.delay(getDelay(3)).duration(600)}>
            <TouchableOpacity
              style={[styles.continueBtn, loading && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.continueBtnText}>
                  Continue{" "}
                  <Ionicons
                    name="arrow-forward-outline"
                    size={20}
                    color="#0f172a"
                  />
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Terms Footer */}
          <Animated.View
            entering={FadeInDown.delay(getDelay(4)).duration(600)}
            style={{ marginTop: 30, alignItems: "center" }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              By continuing, you agree to our{" "}
              <Text
                style={{
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.8)",
                  textDecorationLine: "underline",
                }}
              >
                Terms of Service
              </Text>
              {"\n"}and{" "}
              <Text
                style={{
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.8)",
                  textDecorationLine: "underline",
                }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
