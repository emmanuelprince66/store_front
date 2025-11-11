// ============================================
// FILE: types/product.ts
// ============================================

export interface StoreInfo {
  name: string;
  description: string | null;
  logo: string;
  currency: string;
  state: string;
  tag_line: string | null;
  type: string;
  id: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
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

export interface Product {
  id: string;
  name: string;
  image: string | undefined;
  sku: string | null;
  status: string;
  selling_price: number | null;
  cost_price: number | null;
  quantity: number;
  sold: number;
  discount: number | null;
  discount_threshold: number | null;
  category: string;
  type: string;
  variations?: ProductVariation[];
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
