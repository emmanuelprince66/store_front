// ============================================
// FILE: types/product.ts
// ============================================

export interface StoreTheme {
  key: string;
  label: string;
  primary: string;
  on_primary: string;
  surface: string;
  accent: string;
}

export interface StoreInfo {
  name: string;
  description: string | null;
  logo: string;
  currency: string;
  state: string;
  city?: string | null;
  street?: string | null;
  tag_line: string | null;
  allow_online_payment: boolean;
  type: string;
  id: string;
  banner: string | null;
  pay_transaction_charges: boolean;
  shipbubble?: boolean;
  /** Whether the merchant lets buyers collect at the store instead. */
  allow_pickup?: boolean;
  /** Formatted collection address, shown on the pick-up option. */
  pickup_address?: string | null;
  /** Backend-evaluated: true only when the merchant enabled BNPL *and* their
   * wallet is KYC Tier-3 verified. Absent on older API builds, so treat
   * anything other than an explicit `true` as off. */
  enable_bnpl?: boolean;
  theme?: StoreTheme;
  whatsapp_number?: string | null;
  whatsapp_link?: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: string;
}

export type ProductMediaType = "IMAGE" | "VIDEO";

export interface ProductMedia {
  id: string;
  file: string;
  type: ProductMediaType;
}

export interface ProductVariation {
  id: string;
  name: string;
  sku: string;
  status: string;
  selling_price: number;
  cost_price: number;
  quantity: number;
  sold: number;
  discount: number;
  discount_threshold: number | null;
}

export interface ComboItem {
  id: string;
  name: string;
  image: string | null;
  original_price: number;
  cost_price: number;
  stock: number;
  price: number;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  image: string | undefined;
  description?: string | null;
  unit?: string | null;
  sku: string | null;
  status: string;
  selling_price: number | null;
  cost_price: number | null;
  // Combo products ("type": "COMBO") don't carry their own stock count —
  // `quantity` is absent on them; stock is only meaningful via `status`,
  // which the backend derives from `items[].stock`.
  quantity?: number;
  sold: number;
  discount: number | null;
  discount_threshold: number | null;
  category: string;
  type: string;
  media?: ProductMedia[];
  variations?: ProductVariation[];
  // Combo-only fields
  items?: ComboItem[];
  original_total?: number;
}
export interface Shipping {
  id: string;
  amount: string;
  description: string;
  location: string;
  visible: boolean;
}

export interface StoreResults {
  info: StoreInfo;
  categories: Category[];
  products: Product[];
  shipping: Shipping[];
}

export interface PaginationLinks {
  next: string | null;
  previous: string | null;
}

export interface StoreData {
  links: PaginationLinks;
  total: number;
  limit: number;
  pages: number;
  results: StoreResults;
}

export interface CartItem {
  product: Product;
  variation?: ProductVariation;
  quantity: number;
}
