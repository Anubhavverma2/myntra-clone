import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Heart, ShoppingBag } from "lucide-react-native";
import { ThemeColors } from "@/constants/theme";
import { useWishlist } from "@/context/WishlistContext";
import { useBag } from "@/context/BagContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export type ProductItem = {
  _id: string;
  name: string;
  brand: string;
  price: number;
  discount?: string;
  images: string[];
  sizes?: string[];
};

type ProductCardProps = {
  product: ProductItem;
  colors: ThemeColors;
  width?: `${number}%` | number;
  showAddToBag?: boolean;
};

export default function ProductCard({
  product,
  colors,
  width = "48%",
  showAddToBag = true,
}: ProductCardProps) {
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToBag } = useBag();
  const { requireAuth, isLoggedIn } = useRequireAuth();
  const [wishlistLoading, setWishlistLoading] = React.useState(false);
  const [bagLoading, setBagLoading] = React.useState(false);

  const inWishlist = isInWishlist(product._id);
  const isServerProduct = /^[a-f\d]{24}$/i.test(product._id);
  const styles = createStyles(colors, width);

  const handleWishlist = async (e?: any) => {
    e?.stopPropagation?.();
    const save = async () => {
      setWishlistLoading(true);
      await toggleWishlist(product);
      setWishlistLoading(false);
    };

    if (isServerProduct && !isLoggedIn) {
      requireAuth("save items to wishlist", save);
      return;
    }

    await save();
  };

  const handleAddToBag = async (e?: any) => {
    e?.stopPropagation?.();
    const add = async () => {
      setBagLoading(true);
      const ok = await addToBag(product, product.sizes?.[0]);
      setBagLoading(false);
      if (ok) Alert.alert("Added", `${product.name} added to your bag.`);
      else Alert.alert("Error", "Could not add to bag.");
    };

    if (isServerProduct && !isLoggedIn) {
      requireAuth("add items to bag", add);
      return;
    }

    await add();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/product/${product._id}`)}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.images?.[0] }} style={styles.image} />
        <TouchableOpacity style={styles.heartBtn} onPress={handleWishlist} disabled={wishlistLoading}>
          {wishlistLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Heart size={20} color={inWishlist ? colors.primary : colors.textMuted} fill={inWishlist ? colors.primary : "none"} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.discount ? <Text style={styles.discount}>{product.discount}</Text> : null}
        </View>

        {showAddToBag && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddToBag} disabled={bagLoading}>
            {bagLoading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <ShoppingBag size={14} color={colors.onPrimary} />
                <Text style={styles.addBtnText}>ADD TO BAG</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors, width: `${number}%` | number) =>
  StyleSheet.create({
    card: {
      width,
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    imageWrap: { position: "relative" },
    image: { width: "100%", height: 190, backgroundColor: colors.inputBg },
    heartBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.95)",
      alignItems: "center",
      justifyContent: "center",
    },
    info: { padding: 10 },
    brand: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
    name: { fontSize: 14, color: colors.text, marginBottom: 6, minHeight: 36 },
    priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    price: { fontSize: 15, fontWeight: "700", color: colors.text, marginRight: 6 },
    discount: { fontSize: 12, color: colors.primary, fontWeight: "600" },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingVertical: 8,
      borderRadius: 4,
      gap: 6,
    },
    addBtnText: { color: colors.onPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  });
