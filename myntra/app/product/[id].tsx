import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Heart, ShoppingBag } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useWishlist } from "@/context/WishlistContext";
import { useBag } from "@/context/BagContext";
import { api } from "@/utils/api";
import { trackProductView } from "@/utils/recentlyViewed";
import ProductCard from "@/components/ProductCard";
import { DEMO_PRODUCTS, getWishlistDemoRecommendations } from "@/constants/demoProducts";

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToBag } = useBag();

  const [selectedSize, setSelectedSize] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showBagShortcut, setShowBagShortcut] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const inWishlist = id ? isInWishlist(id) : false;

  useEffect(() => {
    if (!id) return;
    setShowBagShortcut(false);
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/product/${id}`);
        setProduct(res.data);
        if (res.data.sizes?.length === 1) setSelectedSize(res.data.sizes[0]);
        await trackProductView(id, user?._id);
      } catch (error) {
        console.log(error);
        const demoProduct = DEMO_PRODUCTS.find((item) => item._id === id);
        if (demoProduct) {
          setProduct(demoProduct);
          if (demoProduct.sizes?.length === 1) setSelectedSize(demoProduct.sizes[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, user?._id]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const url = user?._id ? `/recommendations/${user._id}` : "/recommendations";
        const res = await api.get(url);
        const recProducts = (res.data.products || []).filter((p: any) => p._id !== id).slice(0, 4);
        setRecommendations(
          recProducts.length
            ? recProducts
            : getWishlistDemoRecommendations([{ productId: { _id: id, name: "", category: product?.category } }], 4)
        );
      } catch (error) {
        console.log(error);
        const currentProduct = product || DEMO_PRODUCTS.find((item) => item._id === id);
        setRecommendations(
          getWishlistDemoRecommendations(currentProduct ? [{ productId: currentProduct }] : [], 4)
        );
      }
    };
    fetchRecs();
  }, [id, user?._id]);

  const handleWishlist = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    toggleWishlist(product || id!);
  };

  const handleAddToBag = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!selectedSize) {
      Alert.alert("Select Size", "Please select a size before adding to bag.");
      return;
    }
    setLoading(true);
    addToBag(product || id!, selectedSize, 1).then((ok) => {
      setLoading(false);
      if (ok) {
        setShowBagShortcut(true);
        Alert.alert("Added to Bag", "Item added successfully.", [
          { text: "Continue Shopping", style: "cancel" },
          { text: "Go to Bag", onPress: () => router.push("/bag") },
        ]);
      } else {
        Alert.alert("Error", "Could not add to bag.");
      }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: colors.text }}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleWishlist}>
          <Heart size={24} color={inWishlist ? colors.primary : colors.text} fill={inWishlist ? colors.primary : "none"} />
        </TouchableOpacity>
      </View>

      {showBagShortcut && (
        <TouchableOpacity style={styles.bagShortcut} onPress={() => router.push("/bag")}>
          <ShoppingBag size={18} color={colors.onPrimary} />
          <Text style={styles.bagShortcutText}>GO TO YOUR BAG</Text>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={16}
          >
            {product.images.map((image: string, index: number) => (
              <Image key={index} source={{ uri: image }} style={[styles.productImage, { width }]} />
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {product.images.map((_: string, index: number) => (
              <View key={index} style={[styles.dot, currentImageIndex === index && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.discount ? <Text style={styles.discount}>{product.discount}</Text> : null}
          </View>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.sizeTitle}>SELECT SIZE</Text>
          <View style={styles.sizeGrid}>
            {product.sizes.map((size: string) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeBtn, selectedSize === size && styles.sizeBtnActive]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {recommendations.length > 0 && (
            <View style={styles.recSection}>
              <Text style={styles.recTitle}>YOU MAY ALSO LIKE</Text>
              <View style={styles.recGrid}>
                {recommendations.map((rec) => (
                  <ProductCard key={rec._id} product={rec} colors={colors} width="48%" showAddToBag={false} />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.wishlistBtn} onPress={handleWishlist}>
          <Heart size={22} color={inWishlist ? colors.primary : colors.text} fill={inWishlist ? colors.primary : "none"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToBag} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <ShoppingBag size={20} color={colors.onPrimary} />
              <Text style={styles.addBtnText}>ADD TO BAG</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 50,
      paddingHorizontal: 8,
      paddingBottom: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 8 },
    topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600", color: colors.text },
    bagShortcut: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bagShortcutText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800", letterSpacing: 0.7 },
    carouselContainer: { position: "relative" },
    productImage: { height: 420, backgroundColor: colors.inputBg },
    pagination: { position: "absolute", bottom: 14, flexDirection: "row", width: "100%", justifyContent: "center" },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)", marginHorizontal: 4 },
    dotActive: { backgroundColor: colors.onPrimary, width: 10, height: 10, borderRadius: 5 },
    content: { padding: 20 },
    brand: { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
    name: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 10 },
    priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
    price: { fontSize: 22, fontWeight: "800", color: colors.text, marginRight: 10 },
    discount: { fontSize: 15, color: colors.primary, fontWeight: "600" },
    description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
    sizeTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10, letterSpacing: 0.5 },
    sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
    sizeBtn: {
      minWidth: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    sizeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    sizeText: { fontSize: 15, color: colors.text },
    sizeTextActive: { color: colors.primary, fontWeight: "700" },
    recSection: { marginTop: 8 },
    recTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12, letterSpacing: 0.5 },
    recGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    footer: {
      flexDirection: "row",
      padding: 12,
      gap: 10,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    wishlistBtn: {
      width: 52,
      height: 52,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: 4,
      gap: 8,
      height: 52,
    },
    addBtnText: { color: colors.onPrimary, fontSize: 14, fontWeight: "700", letterSpacing: 0.8 },
  });
