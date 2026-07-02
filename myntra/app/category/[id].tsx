import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { api } from "@/utils/api";
import { useAppTheme } from "@/context/ThemeContext";
import ProductCard from "@/components/ProductCard";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [catRes, prodRes] = await Promise.all([
          api.get(`/category/${id}`),
          api.get(`/product/category/${id}`),
        ]);
        setCategory(catRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.log(err);
        setError("Failed to load category products.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !category) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Category not found"}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={1}>{category.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.bannerWrap}>
          <Image source={{ uri: category.image }} style={styles.banner} />
          <View style={styles.bannerOverlay}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.productCount}>{products.length} Products</Text>
          </View>
        </View>

        <View style={styles.productsSection}>
          {products.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No products in this category yet.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} colors={colors} width="48%" />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 50,
      paddingHorizontal: 12,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 8 },
    topTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: colors.text },
    bannerWrap: { position: "relative", marginBottom: 16 },
    banner: { width: "100%", height: 200 },
    bannerOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      backgroundColor: "rgba(40,44,63,0.72)",
    },
    categoryName: { color: "#fff", fontSize: 28, fontWeight: "800" },
    productCount: { color: "rgba(255,255,255,0.9)", marginTop: 4, fontSize: 14 },
    productsSection: { padding: 15 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    emptyWrap: { paddingVertical: 40, alignItems: "center" },
    emptyText: { color: colors.textSecondary, fontSize: 15 },
    errorText: { color: colors.textSecondary, marginBottom: 12 },
    backLink: { color: colors.primary, fontWeight: "600" },
  });
