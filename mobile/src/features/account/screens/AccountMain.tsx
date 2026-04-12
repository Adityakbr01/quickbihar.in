import React from "react";
import { View, ScrollView, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createAccountStyles } from "../styles/accountStyles";
import AccountHeader from "../components/AccountHeader";
import AccountOption from "../components/AccountOption";
import { ACCOUNT_SECTIONS, LOGOUT_OPTION } from "../lib/accountData";

const AccountMain = () => {
  const theme = useTheme();
  const styles = createAccountStyles(theme);

  const handleOptionPress = (label: string) => {
    console.log(`Pressed: ${label}`);
    if (label === "Logout") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AccountHeader
            theme={theme}
            styles={styles}
            name="Aditya"
            email="aditya@quickbihar.in"
          />

          {ACCOUNT_SECTIONS.map((section, sectionIndex) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.options.map((option, optionIndex) => (
                <AccountOption
                  key={option.label}
                  theme={theme}
                  styles={styles}
                  icon={option.icon}
                  label={option.label}
                  onPress={option.onPressLabel ? () => handleOptionPress(option.onPressLabel!) : undefined}
                  subItems={option.subItems?.map(sub => ({
                    ...sub,
                    onPress: () => handleOptionPress(sub.onPressLabel)
                  }))}
                  isLast={optionIndex === section.options.length - 1}
                />
              ))}
            </View>
          ))}

          {/* Logout Section */}
          <View style={styles.logoutRow}>
            <AccountOption
              theme={theme}
              styles={styles}
              icon={LOGOUT_OPTION.icon}
              label={LOGOUT_OPTION.label}
              onPress={() => handleOptionPress(LOGOUT_OPTION.onPressLabel!)}
              showArrow={LOGOUT_OPTION.showArrow}
              danger={LOGOUT_OPTION.danger}
              isLast
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default AccountMain;
