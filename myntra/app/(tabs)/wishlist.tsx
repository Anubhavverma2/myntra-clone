import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Heart, Trash2, ShoppingBag, CheckSquare, Square, ChevronLeft } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useWishlist } from "@/context/WishlistContext";
import { useBag } from "@/context/BagContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api } from "@/utils/api";
import { addLocalBagItem, getLocalWishlist, removeLocalWishlistItem } from "@/utils/storage";
import ProductCard from "@/components/ProductCard";
import { getPopularDemoProducts, getWishlistDemoRecommendations, mergeUniqueProducts } from "@/constants/demoProducts";

export default function Wishlist() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { refreshWishlist } = useWishlist();
  const { refreshBag } = useBag();
  const { requireAuth } = useRequireAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const fetchWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      const localItems = await getLocalWishlist();
      if (!user) {
        setWishlist(localItems);
        setRecommendations(
          localItems.length > 0
            ? getWishlistDemoRecommendations(localItems, 10)
            : getPopularDemoProducts(10)
        );
        await refreshWishlist();
        return;
      }

      const res = await api.get(`/wishlist/${user._id}`);
      const mergedWishlist = [...res.data, ...localItems];
      setWishlist(mergedWishlist);
      try {
        const recs = await api.get(`/recommendations/${user._id}?limit=10`);
        const demoRecs = getWishlistDemoRecommendations(mergedWishlist, 10);
        setRecommendations(
          mergeUniqueProducts(recs.data.products || [], demoRecs, 10)
        );
      } catch (error) {
        setRecommendations(getWishlistDemoRecommendations(mergedWishlist, 10));
      }
      await refreshWishlist();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshWishlist]);

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [fetchWishlist])
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === wishlist.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(wishlist.map((w) => w._id)));
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      if (itemId.startsWith("local-wishlist-")) {
        await removeLocalWishlistItem(itemId);
      } else {
        await api.delete(`/wishlist/${itemId}`);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      fetchWishlist();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert("Remove Items", `Remove ${selectedIds.size} item(s) from wishlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await Promise.all(
            [...selectedIds].map((id) =>
              id.startsWith("local-wishlist-")
                ? removeLocalWishlistItem(id)
                : api.delete(`/wishlist/${id}`)
            )
          );
          setSelectedIds(new Set());
          setSelectionMode(false);
          fetchWishlist();
        },
      },
    ]);
  };

  const handleMoveToBag = async (item: any) => {
    const defaultSize = item.productId?.sizes?.[0] || "Free Size";
    if (item._id?.startsWith("local-wishlist-")) {
      await addLocalBagItem(item.productId, defaultSize, 1);
      await removeLocalWishlistItem(item._id);
      await refreshWishlist();
      await refreshBag();
      await fetchWishlist();
      Alert.alert("Added to Bag", "Product added to your bag.", [
        { text: "Keep Shopping", style: "cancel" },
        { text: "Go to Bag", onPress: () => router.push("/bag") },
      ]);
      return;
    }

    requireAuth("move items to bag", () => {
      (async () => {
        try {
          await api.post("/wishlist/move-to-bag", {
            userId: user!._id,
            wishlistItemId: item._id,
            size: defaultSize,
            quantity: 1,
          });
          await refreshWishlist();
          await refreshBag();
          await fetchWishlist();
          Alert.alert("Added to Bag", "Product added to your bag.", [
            { text: "Keep Shopping", style: "cancel" },
            { text: "Go to Bag", onPress: () => router.push("/bag") },
          ]);
        } catch (error: any) {
          Alert.alert("Error", error.response?.data?.message || "Could not move to bag");
        }
      })();
    });
  };

  if (!user && wishlist.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.emptyState}>
            <Heart size={64} color={colors.primary} />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/login")}>
              <Text style={styles.primaryButtonText}>LOGIN</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recommendationSection}>
            <Text style={styles.recommendationTitle}>POPULAR PRODUCTS</Text>
            <View style={styles.recommendationGrid}>
              {getPopularDemoProducts(10).map((product) => (
                <ProductCard key={product._id} product={product} colors={colors} width="48%" />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist ({wishlist.length})</Text>
        {wishlist.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSelectionMode(!selectionMode);
              setSelectedIds(new Set());
            }}
          >
            <Text style={styles.linkText}>{selectionMode ? "Done" : "Select"}</Text>
          </TouchableOpacity>
        )}
        {wishlist.length === 0 && <View style={styles.headerSpacer} />}
      </View>

      {selectionMode && wishlist.length > 0 && (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.selectionAction} onPress={selectAll}>
            <Text style={styles.linkText}>
              {selectedIds.size === wishlist.length ? "Deselect All" : "Select All"}
            </Text>
          </TouchableOpacity>
          {selectedIds.size > 0 && (
            <TouchableOpacity style={styles.selectionAction} onPress={handleDeleteSelected}>
              <Trash2 size={18} color={colors.primary} />
              <Text style={[styles.linkText, { marginLeft: 6 }]}>Remove ({selectedIds.size})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView style={styles.content}>
        {wishlist.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>Browse products and tap the heart to save them here.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
              <Text style={styles.primaryButtonText}>START SHOPPING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          wishlist.map((item) => {
            const selected = selectedIds.has(item._id);
            return (
              <View key={item._id} style={[styles.wishlistItem, selected && styles.selectedItem]}>
                {selectionMode && (
                  <TouchableOpacity style={styles.checkBox} onPress={() => toggleSelect(item._id)}>
                    {selected ? (
                      <CheckSquare size={22} color={colors.primary} />
                    ) : (
                      <Square size={22} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.itemTouchable}
                  onPress={() =>
                    selectionMode
                      ? toggleSelect(item._id)
                      : router.push(`/product/${item.productId._id}`)
                  }
                >
                  <Image source={{ uri: item.productId.images[0] }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.brandName}>{item.productId.brand}</Text>
                    <Text style={styles.itemName}>{item.productId.name}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>₹{item.productId.price}</Text>
                      <Text style={styles.discount}>{item.productId.discount}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {!selectionMode && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleMoveToBag(item)}>
                      <ShoppingBag size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item._id)}>
                      <Trash2 size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}

        {recommendations.length > 0 && (
          <View style={styles.recommendationSection}>
            <Text style={styles.recommendationTitle}>
              {wishlist.length > 0 ? "MORE LIKE YOUR WISHLIST" : "POPULAR PRODUCTS"}
            </Text>
            <View style={styles.recommendationGrid}>
              {recommendations.map((product) => (
                <ProductCard key={product._id} product={product} colors={colors} width="48%" />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 24, fontWeight: "bold", color: colors.text },
    headerSpacer: { width: 36 },
    linkText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
    selectionBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectionAction: { flexDirection: "row", alignItems: "center" },
    content: { flex: 1, padding: 15 },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, marginTop: 60 },
    emptyTitle: { fontSize: 18, color: colors.text, marginTop: 16, fontWeight: "600" },
    emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 8 },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 4,
      marginTop: 20,
    },
    primaryButtonText: { color: colors.onPrimary, fontSize: 14, fontWeight: "bold", letterSpacing: 1 },
    wishlistItem: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 4,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    selectedItem: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    checkBox: { justifyContent: "center", paddingLeft: 12 },
    itemTouchable: { flex: 1, flexDirection: "row" },
    itemImage: { width: 90, height: 110 },
    itemInfo: { flex: 1, padding: 12 },
    brandName: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    itemName: { fontSize: 15, color: colors.text, marginBottom: 8 },
    priceContainer: { flexDirection: "row", alignItems: "center" },
    price: { fontSize: 15, fontWeight: "bold", color: colors.text, marginRight: 8 },
    discount: { fontSize: 13, color: colors.primary },
    actions: { justifyContent: "center", paddingRight: 10, gap: 8 },
    iconBtn: { padding: 8 },
    recommendationSection: { marginTop: 18, paddingBottom: 20 },
    recommendationTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    recommendationGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
  });
