import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ShoppingBag, Minus, Plus, Trash2, Bookmark } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useBag } from "@/context/BagContext";
import { api } from "@/utils/api";
import { getLocalBagItems, removeLocalBagItem, updateLocalBagQuantity } from "@/utils/storage";

const isLocalItem = (item: any) => item._id?.startsWith("local-bag-");

export default function Bag() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { refreshBag } = useBag();
  const [isLoading, setIsLoading] = useState(false);
  const [bagData, setBagData] = useState<any>({
    active: [],
    saved: [],
    total: 0,
    summary: { totalItems: 0, subtotal: 0, discount: 0, deliveryCharges: 0, grandTotal: 0 },
    priceChanges: [],
    discontinued: [],
    outOfStock: [],
  });

  const styles = useMemo(() => createStyles(colors), [colors]);

  const fetchBag = useCallback(async () => {
    try {
      setIsLoading(true);
      const localItems = await getLocalBagItems();
      const localTotal = localItems.reduce(
        (sum, item) => sum + (Number(item.productId?.price) || 0) * item.quantity,
        0
      );

      if (!user) {
        setBagData({
          active: localItems,
          saved: [],
          total: localTotal,
          summary: {
            totalItems: localItems.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: localTotal,
            discount: 0,
            deliveryCharges: localTotal > 0 ? 99 : 0,
            grandTotal: localTotal > 0 ? localTotal + 99 : 0,
          },
          priceChanges: [],
          discontinued: [],
          outOfStock: [],
        });
        await refreshBag();
        return;
      }

      const res = await api.get(`/bag/${user._id}`);
      const serverSummary = res.data.summary || {};
      setBagData({
        active: [...(res.data.active || []), ...localItems],
        saved: res.data.saved || [],
        total: (res.data.total || 0) + localTotal,
        summary: {
          totalItems: (serverSummary.totalItems || 0) + localItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: (serverSummary.subtotal || 0) + localTotal,
          discount: serverSummary.discount || 0,
          deliveryCharges: (serverSummary.subtotal || 0) + localTotal > 0 ? 99 : 0,
          grandTotal: (serverSummary.subtotal || 0) + localTotal > 0
            ? (serverSummary.subtotal || 0) + localTotal + 99 - (serverSummary.discount || 0)
            : 0,
        },
        priceChanges: res.data.priceChanges || [],
        discontinued: res.data.discontinued || [],
        outOfStock: res.data.outOfStock || [],
      });
      await refreshBag();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshBag]);

  useFocusEffect(
    useCallback(() => {
      fetchBag();
    }, [fetchBag])
  );

  const updateQuantity = async (item: any, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    try {
      if (isLocalItem(item)) {
        await updateLocalBagQuantity(item._id, newQty);
      } else {
        await api.patch(`/bag/${item._id}`, { quantity: newQty, version: item.version });
      }
      fetchBag();
    } catch (error: any) {
      Alert.alert("Cart Update", error.response?.data?.message || "Could not update quantity");
      fetchBag();
    }
  };

  const handleDelete = async (itemId: string) => {
    if (itemId.startsWith("local-bag-")) {
      await removeLocalBagItem(itemId);
    } else {
      await api.delete(`/bag/${itemId}`);
    }
    fetchBag();
  };

  const moveSection = async (item: any, section: "active" | "saved") => {
    if (isLocalItem(item)) return;
    try {
      await api.patch(`/bag/${item._id}/move`, { section });
      fetchBag();
      await refreshBag();
    } catch (error: any) {
      Alert.alert("Cart Update", error.response?.data?.message || "Could not move item");
      fetchBag();
    }
  };

  const itemIssue = (item: any) => {
    if (!item.productId) return "This product is no longer available.";
    if (!item.productId.isActive || item.productId.isDiscontinued) return "This product is no longer available.";
    if (item.productId.stock <= 0) return "Out of Stock";
    if (item.productId.stock < item.quantity) return `Only ${item.productId.stock} items available.`;
    const priceChange = bagData.priceChanges.find((change: any) => change.itemId === item._id);
    if (priceChange) return `Price changed: ₹${priceChange.oldPrice} → ₹${priceChange.newPrice}`;
    return "";
  };

  const hasBlockingIssue = bagData.active.some((item: any) => {
    if (isLocalItem(item)) return false;
    if (!item.productId) return true;
    return !item.productId.isActive || item.productId.isDiscontinued || item.productId.stock < item.quantity;
  });

  const handleCheckout = () => {
    if (hasBlockingIssue) {
      Alert.alert("Review Bag", "Please remove unavailable or out-of-stock items before checkout.");
      return;
    }
    if (bagData.priceChanges.length > 0) {
      Alert.alert("Price Updated", "Some item prices changed. Please review totals before placing your order.");
      fetchBag();
      return;
    }
    router.push("/checkout");
  };

  const renderItem = (item: any, saved = false) => {
    const issue = itemIssue(item);
    const stockReached = item.productId?.stock != null && item.quantity >= item.productId.stock;
    const cannotIncrease = !isLocalItem(item) && (!item.productId || !item.productId.isActive || item.productId.isDiscontinued || stockReached);

    return (
      <View key={item._id} style={styles.bagItem}>
        <Image source={{ uri: item.productId?.images?.[0] }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.brandName}>{item.productId?.brand || "Unavailable"}</Text>
          <Text style={styles.itemName}>{item.productId?.name || "Product removed"}</Text>
          <Text style={styles.itemSize}>Size: {item.size}</Text>
          <Text style={styles.itemPrice}>₹{item.productId?.price || item.priceAtAdd || 0}</Text>
          {issue ? <Text style={styles.issueText}>{issue}</Text> : null}

          {!saved && (
            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item, -1)}>
                <Minus size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, cannotIncrease && styles.disabledBtn]}
                onPress={() => updateQuantity(item, 1)}
                disabled={cannotIncrease}
              >
                <Plus size={16} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleDelete(item._id)}>
                <Trash2 size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {!saved && !isLocalItem(item) && (
            <TouchableOpacity style={styles.saveLaterBtn} onPress={() => moveSection(item, "saved")}>
              <Bookmark size={16} color={colors.primary} />
              <Text style={styles.saveLaterText}>SAVE FOR LATER</Text>
            </TouchableOpacity>
          )}

          {saved && (
            <View style={styles.savedActions}>
              <TouchableOpacity style={styles.restoreBtn} onPress={() => moveSection(item, "active")}>
                <Text style={styles.restoreText}>MOVE TO BAG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item._id)}>
                <Trash2 size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!user && bagData.active.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Shopping Bag</Text></View>
        <View style={styles.emptyState}>
          <ShoppingBag size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/login")}>
            <Text style={styles.primaryButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && bagData.active.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Bag ({bagData.summary.totalItems || bagData.active.length})</Text>
      </View>

      <ScrollView style={styles.content}>
        {bagData.priceChanges.length > 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>Prices changed for some items. Review your bag before checkout.</Text>
          </View>
        )}

        {bagData.active.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Your bag is empty</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
              <Text style={styles.primaryButtonText}>START SHOPPING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bagData.active.map((item: any) => renderItem(item))
        )}

        {bagData.saved.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedTitle}>Saved For Later ({bagData.saved.length})</Text>
            {bagData.saved.map((item: any) => renderItem(item, true))}
          </View>
        )}
      </ScrollView>

      {bagData.active.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Items</Text>
            <Text style={styles.totalAmount}>{bagData.summary.totalItems}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>₹{bagData.summary.subtotal}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery</Text>
            <Text style={styles.totalAmount}>₹{bagData.summary.deliveryCharges}</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.grandTotal}>₹{bagData.summary.grandTotal}</Text>
          </View>
          <TouchableOpacity
            style={[styles.primaryButton, hasBlockingIssue && styles.disabledCheckout]}
            onPress={handleCheckout}
          >
            <Text style={styles.primaryButtonText}>PLACE ORDER</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 15, paddingTop: 50, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 22, fontWeight: "bold", color: colors.text },
    content: { flex: 1, padding: 15 },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, marginTop: 60 },
    emptyTitle: { fontSize: 17, color: colors.text, marginTop: 16, marginBottom: 20 },
    warningBox: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 12 },
    warningText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
    bagItem: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    itemImage: { width: 100, height: 120, backgroundColor: colors.inputBg },
    itemInfo: { flex: 1, padding: 12 },
    brandName: { fontSize: 13, color: colors.textSecondary },
    itemName: { fontSize: 15, color: colors.text, marginVertical: 4 },
    itemSize: { fontSize: 13, color: colors.textSecondary },
    itemPrice: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 4, marginBottom: 6 },
    issueText: { color: colors.error, fontSize: 12, fontWeight: "600", marginBottom: 8 },
    quantityContainer: { flexDirection: "row", alignItems: "center" },
    qtyBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    disabledBtn: { opacity: 0.35 },
    quantity: { marginHorizontal: 14, fontSize: 15, color: colors.text, fontWeight: "600" },
    removeBtn: { marginLeft: "auto", padding: 6 },
    iconBtn: { padding: 6 },
    saveLaterBtn: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 },
    saveLaterText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
    savedSection: { marginTop: 12, paddingBottom: 20 },
    savedTitle: { fontSize: 16, color: colors.text, fontWeight: "700", marginBottom: 12 },
    savedActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    restoreBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8 },
    restoreText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
    footer: { padding: 15, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    totalContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
    totalLabel: { fontSize: 15, color: colors.textSecondary },
    totalAmount: { fontSize: 15, fontWeight: "700", color: colors.text },
    grandTotal: { fontSize: 20, fontWeight: "800", color: colors.text },
    primaryButton: { backgroundColor: colors.primary, padding: 15, borderRadius: 4, alignItems: "center" },
    disabledCheckout: { opacity: 0.55 },
    primaryButtonText: { color: colors.onPrimary, fontSize: 14, fontWeight: "700", letterSpacing: 0.8 },
  });
