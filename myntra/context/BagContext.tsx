import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

type BagContextType = {
  bagCount: number;
  bagTotal: number;
  refreshBag: () => Promise<void>;
  addToBag: (productId: string, size?: string, quantity?: number) => Promise<boolean>;
  loading: boolean;
};

const BagContext = createContext<BagContextType | undefined>(undefined);

export function BagProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bagCount, setBagCount] = useState(0);
  const [bagTotal, setBagTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshBag = useCallback(async () => {
    if (!user?._id) {
      setBagCount(0);
      setBagTotal(0);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/bag/${user._id}`);
      const active = res.data.active || [];
      setBagCount(active.reduce((sum: number, item: any) => sum + item.quantity, 0));
      setBagTotal(res.data.total || 0);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    refreshBag();
  }, [refreshBag]);

  const addToBag = useCallback(
    async (productId: string, size?: string, quantity = 1) => {
      if (!user?._id) return false;
      try {
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
