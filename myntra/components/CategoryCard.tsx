import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ThemeColors } from "@/constants/theme";
import { isRealCategoryId } from "@/constants/categories";

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
      onPress={() => {
        if (isRealCategoryId(category._id)) router.push(`/category/${category._id}`);
      }}
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
      width: "48%",
      height: 168,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 14,
      backgroundColor: colors.card,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    image: { width: "100%", height: "100%", resizeMode: "cover" },
    overlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      minHeight: 52,
      padding: 10,
      justifyContent: "flex-end",
      backgroundColor: "rgba(40,44,63,0.62)",
    },
    name: { color: colors.onPrimary, fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
    sub: { color: colors.onPrimary, opacity: 0.85, fontSize: 10, marginTop: 3 },
  });
