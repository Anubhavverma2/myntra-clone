import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { api } from "@/utils/api";
import { useAppTheme } from "@/context/ThemeContext";
import CategoryCard from "@/components/CategoryCard";

export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await api.get("/category");
        setCategories(res.data);
      } catch (err) {
        console.log(err);
        setError("Unable to load categories. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const filtered = categories.filter(
    (cat) =>
      cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.subcategory?.some((sub: string) => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace("/categories")}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No categories found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {filtered.map((category) => (
            <CategoryCard key={category._id} category={category} colors={colors} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 24, fontWeight: "bold", color: colors.text },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      margin: 15,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      gap: 10,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      paddingBottom: 24,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    errorText: { color: colors.textSecondary, textAlign: "center", marginBottom: 16 },
    emptyText: { color: colors.textSecondary, fontSize: 16 },
    retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 },
    retryText: { color: "#fff", fontWeight: "700" },
  });
