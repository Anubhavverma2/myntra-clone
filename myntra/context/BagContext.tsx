import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import {
  addLocalBagItem,
  getLocalBagItems,
  LocalProductSnapshot,
} from "@/utils/storage";

type BagContextType = {
  bagCount: number;
  bagTotal: number;
  refreshBag: () => Promise<void>;
  addToBag: (product: string | LocalProductSnapshot, size?: string, quantity?: number) => Promise<boolean>;
  loading: boolean;
};

const BagContext = createContext<BagContextType | undefined>(undefined);

export function BagProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bagCount, setBagCount] = useState(0);
  const [bagTotal, setBagTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const isServerProductId = (productId: string) => /^[a-f\d]{24}$/i.test(productId);

  const refreshBag = useCallback(async () => {
    const localItems = await getLocalBagItems();
    const localCount = localItems.reduce((sum, item) => sum + item.quantity, 0);
    const localTotal = localItems.reduce(
      (sum, item) => sum + (Number(item.productId?.price) || 0) * item.quantity,
      0
    );

    if (!user?._id) {
      setBagCount(localCount);
      setBagTotal(localTotal);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/bag/${user._id}`);
      const active = res.data.active || [];
      setBagCount(active.reduce((sum: number, item: any) => sum + item.quantity, 0) + localCount);
      setBagTotal((res.data.total || 0) + localTotal);
    } catch (error) {
      console.log(error);
      setBagCount(localCount);
      setBagTotal(localTotal);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    refreshBag();
  }, [refreshBag]);

  useEffect(() => {
    if (!user?._id) {
      setBagCount(0);
      setBagTotal(0);
      setLoading(false);
    }
  }, [user?._id]);

  const addToBag = useCallback(
    async (product: string | LocalProductSnapshot, size?: string, quantity = 1) => {
      const productId = typeof product === "string" ? product : product._id;
      try {
        if (!user?._id || !isServerProductId(productId)) {
          if (typeof product === "string") return false;
          await addLocalBagItem(product, size || product.sizes?.[0] || "Free Size", quantity);
          await refreshBag();
          return true;
        }

        let resolvedSize = size;
        if (!resolvedSize) {
          const productRes = await api.get(`/product/${productId}`);
          resolvedSize = productRes.data.sizes?.[0] || "Free Size";
        }
        await api.post("/bag", {
          userId: user._id,
          productId,
          size: resolvedSize,
          quantity,
          section: "active",
        });
        await refreshBag();
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    [user?._id, refreshBag]
  );

  return (
    <BagContext.Provider value={{ bagCount, bagTotal, refreshBag, addToBag, loading }}>
      {children}
    </BagContext.Provider>
  );
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used within BagProvider");
  return ctx;
}
