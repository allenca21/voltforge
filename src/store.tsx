import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { DARK, LIGHT } from "./theme";

const RC_API_KEY_IOS     = "appl_JNYcDLUVBypiBsmrjBYUBvoaTiq";
const RC_API_KEY_ANDROID = "goog_iZlxGFaUadxpNRzznuXyRUJhfQT";
const ENTITLEMENT_ID = "pro";
export const PRO_SKU  = "com.allenca21.voltforge.pro";

interface StoreCtx {
  isPro: boolean;
  isDark: boolean;
  theme: typeof DARK;
  toggleTheme: () => void;
  buyPro: () => Promise<void>;
  restorePro: () => Promise<void>;
}

const Ctx = createContext<StoreCtx>({
  isPro: false,
  isDark: true,
  theme: DARK,
  toggleTheme: () => {},
  buyPro: async () => {},
  restorePro: async () => {},
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isPro,  setIsPro]  = useState(false);
  const [isDark, setIsDark] = useState(true);

  const theme = isDark ? DARK : LIGHT;

  useEffect(() => {
    const init = async () => {
      try {
        // Restore theme preference
        const savedTheme = await AsyncStorage.getItem("isDark");
        if (savedTheme === "0") setIsDark(false);

        if (Platform.OS === "web") {
          const saved = await AsyncStorage.getItem("isPro");
          if (saved === "1") setIsPro(true);
          return;
        }

        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        Purchases.configure({
          apiKey: Platform.OS === "android" ? RC_API_KEY_ANDROID : RC_API_KEY_IOS,
        });

        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
          setIsPro(true);
          await AsyncStorage.setItem("isPro", "1");
        }
      } catch (e) {
        const saved = await AsyncStorage.getItem("isPro");
        if (saved === "1") setIsPro(true);
        console.log("RC init error:", e);
      }
    };
    init();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem("isDark", next ? "1" : "0");
  };

  const buyPro = async () => {
    if (Platform.OS === "web") {
      setIsPro(true);
      await AsyncStorage.setItem("isPro", "1");
      return;
    }
    try {
      const offerings = await Purchases.getOfferings();
      const current   = offerings.current;
      if (!current) throw new Error("No offerings available");
      const pkg = current.availablePackages.find(
        p => p.product.identifier === PRO_SKU
      ) ?? current.availablePackages[0];
      if (!pkg) throw new Error("Pro package not found");
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        setIsPro(true);
        await AsyncStorage.setItem("isPro", "1");
      }
    } catch (e: any) {
      if (!e.userCancelled) throw e;
    }
  };

  const restorePro = async () => {
    if (Platform.OS === "web") {
      const saved = await AsyncStorage.getItem("isPro");
      if (saved === "1") setIsPro(true);
      return;
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        setIsPro(true);
        await AsyncStorage.setItem("isPro", "1");
      }
    } catch (e) {
      console.log("Restore error:", e);
      throw e;
    }
  };

  return (
    <Ctx.Provider value={{ isPro, isDark, theme, toggleTheme, buyPro, restorePro }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
