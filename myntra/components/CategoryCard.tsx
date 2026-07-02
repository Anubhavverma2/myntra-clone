import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ThemeColors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 45) / 2;

export type CategoryItem = {
  _id: string;
  name: string;
  image: string;
  subcategory?: string[];
};

type CategoryCardProps = {
  category: CategoryItem;
  colors: ThemeColors;
};

export default function CategoryCard({ category, colors }: CategoryCardProps) {
  const router = useRouter();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/category/${category._id}`)}
    >
      <Image source={{ uri: category.image }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.name}>{category.name}</Text>
        {category.subcategory && category.subcategory.length > 0 && (
          <Text style={styles.sub} numberOfLines={1}>
            {category.subcategory.slice(0, 3).join(" • ")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_WIDTH * 1.15,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 15,
      backgroundColor: colors.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
    image: { width: "100%", height: "100%", resizeMode: "cover" },
    overlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
      backgroundColor: "rgba(40,44,63,0.55)",
    },
    name: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
    sub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 3 },
  });
