export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  inStock: boolean;
  quantity: number; // stock quantity
  gender: string;
  features: string[];
  specifications: {
    material: string;
    care: string;
    origin: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}
