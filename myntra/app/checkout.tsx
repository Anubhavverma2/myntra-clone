import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { api } from "@/utils/api";
import { useRouter } from "expo-router";
import { CreditCard, MapPin, Truck } from "lucide-react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [bagTotal, setBagTotal] = useState(0);
  const [address, setAddress] = useState("123 Main Street, Mumbai, Maharashtra 400001");
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { requireAuth } = useRequireAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (!user) return;
    api.get(`/bag/${user._id}`).then((res) => setBagTotal(res.data.total || 0)).catch(console.log);
  }, [user]);

  const shipping = bagTotal > 0 ? 99 : 0;
  const tax = Math.round(bagTotal * 0.05);
  const grandTotal = bagTotal + shipping + tax;

  const handlePlaceOrder = () => {
    requireAuth("place an order", async () => {
      try {
        setLoading(true);
        const validation = await api.post(`/bag/validate-checkout/${user!._id}`);
        if (!validation.data.valid) {
          Alert.alert("Checkout Issue", validation.data.issues.map((i: any) => i.message).join("\n"));
          return;
        }
        await api.post(`/order/create/${user!._id}`, {
          shippingAddress: address,
          paymentMethod: "UPI",
        });
        Alert.alert("Success", "Order placed successfully!");
        router.push("/orders");
      } catch (error: any) {
        Alert.alert("Error", error.response?.data?.message || "Order failed");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Checkout</Text></View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter delivery address"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <Text style={styles.paymentNote}>UPI / Card / Net Banking (Demo Mode)</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Truck size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{bagTotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>₹{shipping}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>₹{tax}</Text>
            </View>
            <View style={[styles.summaryRow, styles.total]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{grandTotal}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>PLACE ORDER</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 15, paddingTop: 50, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 24, fontWeight: "bold", color: colors.text },
    content: { flex: 1, padding: 15 },
    section: { marginBottom: 16, backgroundColor: colors.card, borderRadius: 4, padding: 15, borderWidth: 1, borderColor: colors.border },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.text, marginLeft: 10 },
    input: { backgroundColor: colors.inputBg, padding: 14, borderRadius: 4, fontSize: 15, color: colors.text, minHeight: 80, textAlignVertical: "top" },
    paymentNote: { color: colors.textSecondary, fontSize: 14 },
    summary: { gap: 8 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between" },
    summaryLabel: { fontSize: 15, color: colors.textSecondary },
    summaryValue: { fontSize: 15, color: colors.text },
    total: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 10 },
    totalLabel: { fontSize: 17, fontWeight: "bold", color: colors.text },
    totalValue: { fontSize: 17, fontWeight: "bold", color: colors.primary },
    footer: { padding: 15, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    placeOrderButton: { backgroundColor: colors.primary, padding: 15, borderRadius: 4, alignItems: "center" },
    placeOrderButtonText: { color: "#fff", fontSize: 14, fontWeight: "bold", letterSpacing: 1 },
  });
