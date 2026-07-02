import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { CreditCard, Download, ChevronLeft } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { api, BASE_URL } from "@/utils/api";

export default function Transactions() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const styles = useMemo(() => createStyles(colors), [colors]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get(`/transactions/user/${user._id}?${params}`);
      setTransactions(res.data.transactions);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, page, statusFilter]);

  const downloadReceipt = (txnId: string, invoiceId: string) => {
    const url = `${BASE_URL}/transactions/receipt/${txnId}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not download receipt"));
  };

  const exportCsv = () => {
    if (!user) return;
    Linking.openURL(`${BASE_URL}/transactions/export/${user._id}/csv`);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>My Transactions</Text></View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Please login to view transactions</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/login")}>
            <Text style={styles.primaryBtnText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Transactions</Text>
        <TouchableOpacity onPress={exportCsv}><Download size={22} color={colors.primary} /></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {["", "success", "pending", "failed", "refunded"].map((s) => (
          <TouchableOpacity
            key={s || "all"}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => { setStatusFilter(s); setPage(1); }}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s || "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : transactions.length === 0 ? (
        <View style={styles.center}><Text style={styles.emptyText}>No transactions found</Text></View>
      ) : (
        <ScrollView style={styles.list}>
          {transactions.map((txn) => (
            <View key={txn._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <CreditCard size={20} color={colors.primary} />
                <Text style={styles.invoice}>{txn.invoiceId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: txn.status === "success" ? colors.successBg : colors.primaryLight }]}>
                  <Text style={[styles.statusText, { color: txn.status === "success" ? colors.success : colors.primary }]}>
                    {txn.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.amount}>₹{txn.amount}</Text>
              <Text style={styles.meta}>{txn.paymentMode} • {new Date(txn.createdAt).toLocaleString()}</Text>
              <TouchableOpacity style={styles.receiptBtn} onPress={() => downloadReceipt(txn._id, txn.invoiceId)}>
                <Download size={16} color={colors.primary} />
                <Text style={styles.receiptText}>Download Receipt</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.pagination}>
            <TouchableOpacity disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
              <Text style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>Page {page} of {totalPages}</Text>
            <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
              <Text style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 15,
      paddingTop: 50,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
    filters: { paddingHorizontal: 15, paddingVertical: 10, maxHeight: 50 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, color: colors.text, textTransform: "capitalize" },
    filterTextActive: { color: "#fff" },
    list: { flex: 1, padding: 15 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 4,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    invoice: { flex: 1, fontSize: 13, color: colors.textSecondary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: "bold" },
    amount: { fontSize: 22, fontWeight: "bold", color: colors.text, marginTop: 8 },
    meta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    receiptBtn: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 6 },
    receiptText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
    pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
    pageBtn: { color: colors.primary, fontWeight: "600" },
    pageBtnDisabled: { opacity: 0.4 },
    pageInfo: { color: colors.textSecondary },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    emptyText: { color: colors.textSecondary, fontSize: 16 },
    primaryBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 4, marginTop: 16 },
    primaryBtnText: { color: "#fff", fontWeight: "bold" },
  });
