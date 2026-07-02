import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, ChevronRight, Clock } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api } from "@/utils/api";
import { getRecentlyViewed } from "@/utils/recentlyViewed";
import ProductCard from "@/components/ProductCard";

const deals = [
  { id: 1, title: "Under ₹599", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop" },
  { id: 2, title: "40-70% Off", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop" },
];

const fallbackCategories = [
  { _id: "cat1", name: "Men", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop" },
  { _id: "cat2", name: "Women", image: "https://images.unsplash.com/photo-1618244972963-dbad0c4abf18?w=500&auto=format&fit=crop" },
  { _id: "cat3", name: "Kids", image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&auto=format&fit=crop" },
];

const fallbackProducts = [
  { _id: "prod1", name: "Premium Cotton T-Shirt", brand: "Roadster", price: 799, discount: "60% OFF", images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop"] },
  { _id: "prod2", name: "Denim Jacket", brand: "Levis", price: 2499, discount: "40% OFF", images: ["https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=500&auto=format&fit=crop"] },
  { _id: "prod3", name: "Summer Dress", brand: "ONLY", price: 1299, discount: "50% OFF", images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop"] },
  { _id: "prod4", name: "Classic Sneakers", brand: "Nike", price: 3499, discount: "30% OFF", images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop"] },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { requireAuth } = useRequireAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [cat, prod, recent, recs] = await Promise.all([
          api.get("/category"),
          api.get("/product"),
          getRecentlyViewed(user?._id),
          api.get(user?._id ? `/recommendations/${user._id}` : "/recommendations"),
        ]);
        setCategories(cat.data);
        setProducts(prod.data);
        const recentRaw = recent;
        const mergedRecent = recentRaw.map((item: any) => {
          if (item.productId?.images) return item;
          const pid = item.productId?._id || item.productId;
          const found = prod.data.find((p: any) => p._id === pid);
          return found ? { productId: found, viewedAt: item.viewedAt } : item;
        });
        setRecentlyViewed(mergedRecent);
        setRecommendations(recs.data.products || []);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?._id]);

  const categoriesToShow = categories.length > 0 ? categories : fallbackCategories;
  const productsToShow = products.length > 0 ? products : fallbackProducts;

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const getRecentProduct = (item: any) => item.productId || item;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MYNTRA</Text>
          <Text style={styles.greeting}>
            {user ? `Hi, ${user.name}!` : "Login for exclusive deals & your bag"}
          </Text>
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={() => router.push("/categories")}>
          <Search size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Image
        source={{ uri: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop" }}
        style={styles.banner}
      />

      {recentlyViewed.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>RECENTLY VIEWED</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentlyViewed.slice(0, 10).map((item: any, idx: number) => {
              const p = getRecentProduct(item);
              const pid = p._id || item.productId;
              return (
                <TouchableOpacity key={pid || idx} style={styles.recentCard} onPress={() => handleProductPress(pid)}>
                  <Image source={{ uri: p.images?.[0] }} style={styles.recentImage} />
                  <Text style={styles.recentBrand} numberOfLines={1}>{p.brand || "Product"}</Text>
                  <Text style={styles.recentPrice}>₹{p.price || "—"}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
          <TouchableOpacity style={styles.viewAll} onPress={() => router.push("/categories")}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            categoriesToShow.map((category: any) => (
              <TouchableOpacity key={category._id} style={styles.categoryCard} onPress={() => router.push(`/category/${category._id}`)}>
                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>DEALS OF THE DAY</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {deals.map((deal) => (
            <TouchableOpacity key={deal.id} style={styles.dealCard}>
              <Image source={{ uri: deal.image }} style={styles.dealImage} />
              <View style={styles.dealOverlay}><Text style={styles.dealTitle}>{deal.title}</Text></View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOU MAY ALSO LIKE</Text>
          <View style={styles.productsGrid}>
            {recommendations.slice(0, 4).map((product: any) => (
              <ProductCard key={product._id} product={product} colors={colors} width="48%" />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRENDING NOW</Text>
        <View style={styles.productsGrid}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            productsToShow.map((product: any) => (
              <ProductCard key={product._id} product={product} colors={colors} width="48%" />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logo: { fontSize: 24, fontWeight: "bold", color: colors.text, letterSpacing: 2 },
    greeting: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    searchButton: { padding: 8 },
    banner: { width: "100%", height: 200, resizeMode: "cover" },
    section: { padding: 15 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.text, letterSpacing: 0.5 },
    viewAll: { flexDirection: "row", alignItems: "center" },
    viewAllText: { color: colors.primary, marginRight: 4, fontWeight: "600" },
    categoriesScroll: { marginHorizontal: -15 },
    categoryCard: { width: 90, marginHorizontal: 8, alignItems: "center" },
    categoryImage: { width: 80, height: 80, borderRadius: 40 },
    categoryName: { textAlign: "center", marginTop: 8, fontSize: 13, color: colors.text },
    recentCard: { width: 110, marginRight: 12 },
    recentImage: { width: 110, height: 140, borderRadius: 4, backgroundColor: colors.inputBg },
    recentBrand: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
    recentPrice: { fontSize: 13, fontWeight: "bold", color: colors.text },
    dealCard: { width: 260, height: 140, marginRight: 12, borderRadius: 4, overflow: "hidden" },
    dealImage: { width: "100%", height: "100%" },
    dealOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.overlay, padding: 12 },
    dealTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    productsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
    productCard: {
      width: "48%",
      marginHorizontal: "1%",
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    productImage: { width: "100%", height: 180 },
    productInfo: { padding: 10 },
    brandName: { fontSize: 13, color: colors.textSecondary },
    productName: { fontSize: 14, color: colors.text, marginVertical: 4 },
    priceRow: { flexDirection: "row", alignItems: "center" },
    productPrice: { fontSize: 14, fontWeight: "bold", color: colors.text, marginRight: 6 },
    discount: { fontSize: 12, color: colors.primary },
    loader: { marginTop: 30, width: "100%" },
  });
