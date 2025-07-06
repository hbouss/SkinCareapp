// src/hooks/useIAP.ts
import * as InAppPurchases from "expo-in-app-purchases";
import { useEffect, useState } from "react";

export function useIAP(productIds: string[]) {
  const [products, setProducts] = useState<InAppPurchases.IAPItemDetails[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        // 1) Se connecter (pas de responseCode ici)
        await InAppPurchases.connectAsync();

        // 2) Récupérer les produits (là on a responseCode)
        const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
        console.log("IAP getProductsAsync →", responseCode, results);
        if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
          throw new Error(`getProductsAsync failed: code ${responseCode}`);
        }
        if (isMounted) {
          setProducts(results || []);
        }
      } catch (e: any) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }

    init();

    // 3) Listener d’achats
    InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.ERROR) {
        setError(`Purchase error: ${errorCode}`);
        return;
      }
      if (results) {
        for (const purchase of results) {
          if (!purchase.acknowledged) {
            try {
              await InAppPurchases.finishTransactionAsync(purchase, true);
            } catch {}
          }
        }
      }
    });

    // 4) Cleanup
    return () => {
      isMounted = false;
      InAppPurchases.disconnectAsync();
    };
  }, [productIds.join(",")]);

  // 5) Lancer un achat (pas de responseCode retourné ici)
  const buy = async (productId: string) => {
    setError(null);
    await InAppPurchases.purchaseItemAsync(productId);
    // le listener finira la transaction et gérera les erreurs
  };

// <-- NOUVEAU : restaurer les achats
  const restorePurchases = async () => {
    setError(null);
    // reconnect
    await InAppPurchases.connectAsync();
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
      throw new Error(`restore failed: code ${responseCode}`);
    }
    // on « acknowledge » et on renvoie les infos
    const receipts: InAppPurchases.InAppPurchase[] = [];
    for (const p of results || []) {
      if (!p.acknowledged) {
        await InAppPurchases.finishTransactionAsync(p, true);
      }
      receipts.push(p);
    }
    await InAppPurchases.disconnectAsync();
    return receipts;
  };

  return { products, loadingProducts, error, buy, restorePurchases };
}