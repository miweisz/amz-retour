export interface AsinInfo {
  sku: string;
  nameFr: string;
  category: string;
  subCategory: string;
}

const CATALOG: Record<string, AsinInfo> = {
  B07P836XZR: { sku: "BIKE_XL", nameFr: "Support Vélo XL", category: "BIKE", subCategory: "CLASSIC" },
  B08TBWY3NR: { sku: "BIKE_2XL", nameFr: "Support Vélo 2XL", category: "BIKE", subCategory: "CLASSIC" },
  B0BG21TN74: { sku: "BIKE_U", nameFr: "Support Vélo Universel", category: "BIKE", subCategory: "UNIVERSEL" },
  B0B138CQHB: { sku: "BIKE_PRO_XL", nameFr: "Support Vélo Pro XL", category: "BIKE", subCategory: "PRO" },
  B0B136YJ78: { sku: "BIKE_PRO_2XL", nameFr: "Support Vélo Pro 2XL", category: "BIKE", subCategory: "PRO" },
  B0B157V4Y1: { sku: "BIKE_STEM_XL", nameFr: "Support Vélo Potence XL", category: "BIKE", subCategory: "STEM" },
  B0B1577Y2H: { sku: "BIKE_STEM_2XL", nameFr: "Support Vélo Potence 2XL", category: "BIKE", subCategory: "STEM" },
  B0CWRS2CRM: { sku: "LIGHT_PANO_RED", nameFr: "Lumière Pano Rouge", category: "BIKE", subCategory: "LIGHT" },
  B0CXTBBVXG: { sku: "LIGHT_PANO_WHITE", nameFr: "Lumière Pano Blanc", category: "BIKE", subCategory: "LIGHT" },
  B0CXTB4VQ1: { sku: "LIGHT_PANO_REDWHITE", nameFr: "Lumière Pano Rouge+Blanc", category: "BIKE", subCategory: "LIGHT" },
  B0FL2WKRWB: { sku: "LIGHT_MINI_RED", nameFr: "Lumière Mini Rouge", category: "BIKE", subCategory: "LIGHT" },
  B0FL2V4SMK: { sku: "LIGHT_MINI_WHITE", nameFr: "Lumière Mini Blanc", category: "BIKE", subCategory: "LIGHT" },
  B0FL2PXL8R: { sku: "LIGHT_MINI_REDWHITE", nameFr: "Lumière Mini Rouge+Blanc", category: "BIKE", subCategory: "LIGHT" },
  B076P9TM7H: { sku: "NHR_XL", nameFr: "Brassard Running XL", category: "RUN", subCategory: "NHR" },
  B08TX51WL7: { sku: "NHR_2XL", nameFr: "Brassard Running 2XL", category: "RUN", subCategory: "NHR" },
  B07KB21MTW: { sku: "BELT_XL", nameFr: "Ceinture Running XL", category: "RUN", subCategory: "BELT" },
  B08TX52FYK: { sku: "BELT_2XL", nameFr: "Ceinture Running 2XL", category: "RUN", subCategory: "BELT" },
  B07ZTQ2BMB: { sku: "BIBS", nameFr: "Dossards magnétiques", category: "RUN", subCategory: "BIBS" },
  B07RHQ42SX: { sku: "FLASK", nameFr: "Flasque souple", category: "RUN", subCategory: "FLASK" },
  B0GQVBWXBZ: { sku: "BIB_BELT", nameFr: "Ceinture porte-dossard", category: "RUN", subCategory: "BIBS" },
  B083JJRM4S: { sku: "MOTO_XL", nameFr: "Support Moto Guidon XL", category: "MOTO", subCategory: "GUIDON" },
  B08TX528QM: { sku: "MOTO_2XL", nameFr: "Support Moto Guidon 2XL", category: "MOTO", subCategory: "GUIDON" },
  B0B5VPGHSY: { sku: "MOTO_U", nameFr: "Support Moto Universel", category: "MOTO", subCategory: "GUIDON" },
  B0B157R1HX: { sku: "MOTO_PRO_XL", nameFr: "Support Moto Pro XL", category: "MOTO", subCategory: "GUIDON" },
  B0B1586DCS: { sku: "MOTO_PRO_2XL", nameFr: "Support Moto Pro 2XL", category: "MOTO", subCategory: "GUIDON" },
  B0B133PFNH: { sku: "MOTO_PRO_BOOST_XL", nameFr: "Support Moto Pro Boost XL", category: "MOTO", subCategory: "GUIDON" },
  B0B133TXZF: { sku: "MOTO_PRO_BOOST_2XL", nameFr: "Support Moto Pro Boost 2XL", category: "MOTO", subCategory: "GUIDON" },
  B08V5LLJK1: { sku: "MIRROR_PRO_XL", nameFr: "Support Moto Rétro XL", category: "MOTO", subCategory: "RETRO" },
  B09GKFB7VY: { sku: "MIRROR_PRO_2XL", nameFr: "Support Moto Rétro 2XL", category: "MOTO", subCategory: "RETRO" },
  B08V5J6HSY: { sku: "MOTO_STEM_XL", nameFr: "Support Moto Sportive XL", category: "MOTO", subCategory: "SPORTIVE" },
  B09GW4KHDR: { sku: "MOTO_STEM_2XL", nameFr: "Support Moto Sportive 2XL", category: "MOTO", subCategory: "SPORTIVE" },
  B08V17NSYK: { sku: "EXTRA_POCKET_2XL", nameFr: "Poche magnétique 2XL", category: "OTHER", subCategory: "OTHER" },
  B083JK91NX: { sku: "EXTRA_POCKET_XL", nameFr: "Poche magnétique XL", category: "OTHER", subCategory: "OTHER" },
  B0C74JJXFF: { sku: "BOOSTER", nameFr: "Booster magnétique", category: "MOTO", subCategory: "OTHER" },
  B0B4JMC3Y6: { sku: "EXTRA_STEEL", nameFr: "Plaque acier", category: "OTHER", subCategory: "OTHER" },
  B0CX1WNJBD: { sku: "EXTRA_ANTI_VIBRATION", nameFr: "Filtre anti-vibration", category: "MOTO", subCategory: "OTHER" },
  B0CTKK12BF: { sku: "CAR", nameFr: "Support Voiture", category: "CAR", subCategory: "CAR" },
  B0GMY7MD57: { sku: "PRO_TU", nameFr: "Support Pro Taille Unique", category: "OTHER", subCategory: "GUIDON" },
  B0GX242T5S: { sku: "BELT_NO_MAGNET", nameFr: "Ceinture Running sans aimant", category: "RUN", subCategory: "BELT" },
};

export function getAsinInfo(asin: string): AsinInfo | undefined {
  return CATALOG[asin];
}

export function getAsinName(asin: string, fallbackTitle: string): string {
  return CATALOG[asin]?.nameFr ?? fallbackTitle;
}

export function getAsinSku(asin: string): string {
  return CATALOG[asin]?.sku ?? "";
}
