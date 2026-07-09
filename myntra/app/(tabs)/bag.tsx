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
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useBag } from "@/context/BagContext";
import { api } from "@/utils/api";
import { getLocalBagItems, removeLocalBagItem, updateLocalBagQuantity } from "@/utils/storage";

export default function Bag() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { refreshBag } = useBag();
  const [isLoading, setIsLoading] = useState(false);
  const [bagData, setBagData] = useState<any>({ active: [], total: 0 });

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
        setBagData({ active: localItems, total: localTotal });
        await refreshBag();
        return;
      }

      const res = await api.get(`/bag/${user._id}`);
      setBagData({
        active: [...(res.data.active || []), ...localItems],
        total: (res.data.total || 0) + localTotal,
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
      if (item._id?.startsWith("local-bag-")) {
        await updateLocalBagQuantity(item._id, newQty);
      } else {
        await api.patch(`/bag/${item._id}`, { quantity: newQty, version: item.version });
      }
      fetchBag();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Could not update quantity");
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
        <Text style={styles.headerTitle}>Shopping Bag ({bagData.active.length})</Text>
      </View>

      <ScrollView style={styles.content}>
        {bagData.active.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Your bag is empty</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
              <Text style={styles.primaryButtonText}>START SHOPPING</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bagData.active.map((item: any) => (
            <View key={item._id} style={styles.bagItem}>
              <Image source={{ uri: item.productId?.images?.[0] }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.brandName}>{item.productId?.brand}</Text>
                <Text style={styles.itemName}>{item.productId?.name}</Text>
                <Text style={styles.itemSize}>Size: {item.size}</Text>
                <Text style={styles.itemPrice}>₹{item.productId?.price}</Text>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item, -1)}>
                    <Minus size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item, 1)}>
                    <Plus size={16} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleDelete(item._id)}>
                    <Trash2 size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {bagData.active.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalAmount}>₹{bagData.total}</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/checkout")}>
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
    bagItem: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    itemImage: { width: 100, height: 120 },
    itemInfo: { flex: 1, padding: 12 },
    brandName: { fontSize: 13, color: colors.textSecondary },
    itemName: { fontSize: 15, color: colors.text, marginVertical: 4 },
    itemSize: { fontSize: 13, color: colors.textSecondary },
    itemPrice: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 4, marginBottom: 10 },
    quantityContainer: { flexDirection: "row", alignItems: "center" },
    qtyBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    quantity: { marginHorizontal: 14, fontSize: 15, color: colors.text, fontWeight: "600" },
    removeBtn: { marginLeft: "auto", padding: 6 },
    footer: { padding: 15, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    totalContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    totalLabel: { fontSize: 16, color: colors.textSecondary },
    totalAmount: { fontSize: 20, fontWeight: "800", color: colors.text },
    primaryButton: { backgroundColor: colors.primary, padding: 15, borderRadius: 4, alignItems: "center" },
    primaryButtonText: { color: colors.onPrimary, fontSize: 14, fontWeight: "700", letterSpacing: 0.8 },
  });
