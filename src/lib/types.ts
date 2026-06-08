export interface ReturnLine {
  marketplace: string; // FR, DE, ES, IT, GB, ...
  country: string; // Allemagne, Espagne, ...
  year: number;
  month: number; // 1-12
  monthName: string; // Janvier ...
  date: string; // DD/MM/YYYY
  iso: string; // YYYY-MM-DD
  vendorCode: string;
  warehouse: string;
  asin: string;
  ean: string;
  productLine: string;
  title: string;
  qty: number;
  unitCost: number;
  lineCost: number;
  currency: string;
  reason: string; // CUSTOMER_DAMAGED ...
  reasonLabel: string; // Endommagé client ...
  returnId: string;
}

export interface ReturnStore {
  updatedAt: string;
  periodStart: string; // YYYY-MM
  lines: ReturnLine[];
}

export const REASON_LABELS: Record<string, string> = {
  CUSTOMER_DAMAGED: "Endommagé client",
  OVERSTOCK: "Surstock",
  DEFECTIVE: "Défectueux",
  CARRIER_DAMAGED: "Endommagé transporteur",
  WAREHOUSE_DAMAGED: "Endommagé entrepôt Amazon",
  NEGOTIATED_RETURN: "Retour négocié",
};

export const COUNTRY_LABELS: Record<string, string> = {
  FR: "France",
  DE: "Allemagne",
  ES: "Espagne",
  IT: "Italie",
  GB: "Royaume-Uni",
  BE: "Belgique",
  NL: "Pays-Bas",
  PL: "Pologne",
  SE: "Suède",
};
