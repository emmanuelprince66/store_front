export interface ProductVariation {
  id: string;
  color?: string;
  size?: string;
  images: string[];
  priceModifier?: number;
  inStock: boolean;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  category: string;
  inStock: boolean;
  quantity: number;
  gender: string;
  features: string[];
  specifications: {
    material: string;
    care: string;
    origin: string;
  };
  variations?: ProductVariation[];
  hasVariations?: boolean;
}

export const dummyProducts: Product[] = [
  {
    id: 1,
    name: "Kids Colorful Sneakers",
    price: 29.99,
    description:
      "Comfortable and durable sneakers with easy velcro closures for kids. Vibrant colors and playful design make these shoes a favorite among children.",
    image:
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    ],
    category: "Footwear",
    inStock: true,
    quantity: 20,
    gender: "Kids",
    hasVariations: true,
    variations: [
      {
        id: "red-small",
        color: "Red",
        size: "Small (EU 28-30)",
        images: [
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1514989940723-e8e51635b782?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 8,
      },
      {
        id: "blue-medium",
        color: "Blue",
        size: "Medium (EU 31-33)",
        images: [
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 6,
      },
      {
        id: "green-large",
        color: "Green",
        size: "Large (EU 34-36)",
        images: [
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 6,
      },
    ],
    features: [
      "Easy velcro closures",
      "Padded collar for comfort",
      "Non-marking rubber outsole",
      "Breathable lining",
      "Lightweight design",
    ],
    specifications: {
      material: "Synthetic and textile",
      care: "Wipe clean with damp cloth",
      origin: "Imported",
    },
  },
  {
    id: 2,
    name: "Men's Running Shoes",
    price: 49.99,
    description:
      "High-performance running shoes for men with cushioning and support. Perfect for daily runs and athletic activities.",
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    ],
    category: "Footwear",
    inStock: true,
    quantity: 15,
    gender: "Men",
    hasVariations: true,
    variations: [
      {
        id: "black-42",
        color: "Black",
        size: "EU 42",
        images: [
          "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 5,
      },
      {
        id: "white-43",
        color: "White",
        size: "EU 43",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 5,
      },
      {
        id: "gray-44",
        color: "Gray",
        size: "EU 44",
        images: [
          "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 5,
      },
    ],
    features: ["Cushioned sole", "Breathable mesh", "Lace-up closure"],
    specifications: {
      material: "Mesh and rubber",
      care: "Machine washable",
      origin: "USA",
    },
  },
  {
    id: 3,
    name: "Women's Yoga Pants",
    price: 39.99,
    description:
      "Comfortable yoga pants for women with stretch fabric. Perfect for yoga, gym, or casual wear.",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Apparel",
    inStock: true,
    quantity: 25,
    gender: "Women",
    hasVariations: true,
    variations: [
      {
        id: "black-s",
        color: "Black",
        size: "Small",
        images: [
          "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 8,
      },
      {
        id: "navy-m",
        color: "Navy Blue",
        size: "Medium",
        images: [
          "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 9,
      },
      {
        id: "gray-l",
        color: "Gray",
        size: "Large",
        images: [
          "https://images.unsplash.com/photo-1517438476312-10d79c077509?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 8,
      },
    ],
    features: ["High-waisted", "Moisture-wicking", "Four-way stretch"],
    specifications: {
      material: "Spandex blend",
      care: "Machine wash cold",
      origin: "Imported",
    },
  },
  {
    id: 4,
    name: "Kids Backpack",
    price: 19.99,
    description:
      "Durable backpack for kids with multiple compartments. Perfect for school or outdoor adventures.",
    image:
      "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Accessories",
    inStock: true,
    quantity: 30,
    gender: "Kids",
    features: ["Adjustable straps", "Water-resistant", "Side pockets"],
    specifications: {
      material: "Polyester",
      care: "Spot clean",
      origin: "China",
    },
  },
  {
    id: 5,
    name: "Men's Leather Wallet",
    price: 24.99,
    description:
      "Slim leather wallet for men with RFID protection. Elegant and practical design.",
    image:
      "https://images.unsplash.com/photo-1580910365203-91ea9115a58d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Accessories",
    inStock: true,
    quantity: 10,
    gender: "Men",
    hasVariations: true,
    variations: [
      {
        id: "brown-standard",
        color: "Brown",
        images: [
          "https://images.unsplash.com/photo-1580910365203-91ea9115a58d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 5,
      },
      {
        id: "black-standard",
        color: "Black",
        images: [
          "https://images.unsplash.com/photo-1627123424574-724758594e93?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        ],
        inStock: true,
        quantity: 5,
      },
    ],
    features: ["Multiple card slots", "Bill compartment", "Compact design"],
    specifications: {
      material: "Genuine leather",
      care: "Wipe with leather cleaner",
      origin: "Italy",
    },
  },
  {
    id: 6,
    name: "Women's Sunglasses",
    price: 14.99,
    description:
      "Stylish sunglasses for women with UV protection. Fashion meets functionality.",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Accessories",
    inStock: true,
    quantity: 40,
    gender: "Women",
    features: ["Polarized lenses", "Lightweight frame", "Scratch-resistant"],
    specifications: {
      material: "Plastic and metal",
      care: "Clean with microfiber cloth",
      origin: "Imported",
    },
  },
  {
    id: 7,
    name: "Kids Toy Car",
    price: 9.99,
    description:
      "Fun toy car for kids with remote control. Hours of entertainment guaranteed.",
    image:
      "https://images.unsplash.com/photo-1567808291548-fc3ee04db3d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Toys",
    inStock: true,
    quantity: 50,
    gender: "Kids",
    features: ["Battery operated", "Forward and reverse", "Durable plastic"],
    specifications: {
      material: "Plastic",
      care: "Wipe clean",
      origin: "China",
    },
  },
  {
    id: 8,
    name: "Men's Watch",
    price: 59.99,
    description:
      "Elegant wristwatch for men with stainless steel band. Timeless style and precision.",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Accessories",
    inStock: true,
    quantity: 12,
    gender: "Men",
    features: ["Water-resistant", "Quartz movement", "Date display"],
    specifications: {
      material: "Stainless steel",
      care: "Polish with soft cloth",
      origin: "Switzerland",
    },
  },
  {
    id: 9,
    name: "Women's Handbag",
    price: 34.99,
    description:
      "Fashionable handbag for women with adjustable strap. Spacious and stylish.",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Accessories",
    inStock: true,
    quantity: 18,
    gender: "Women",
    features: ["Zipper closure", "Interior pockets", "Faux leather"],
    specifications: {
      material: "PU leather",
      care: "Wipe clean",
      origin: "Imported",
    },
  },
  {
    id: 10,
    name: "Kids Puzzle Set",
    price: 14.99,
    description:
      "Educational puzzle set for kids to enhance problem-solving skills. Fun and educational!",
    image:
      "https://images.unsplash.com/photo-1588350834945-2613a64277b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Toys",
    inStock: true,
    quantity: 35,
    gender: "Kids",
    features: ["100 pieces", "Colorful design", "Safe materials"],
    specifications: {
      material: "Cardboard",
      care: "Store in dry place",
      origin: "USA",
    },
  },
  {
    id: 6934689287077,
    name: "Kids Puzzle Set",
    price: 14.99,
    description:
      "Educational puzzle set for kids to enhance problem-solving skills. Fun and educational!",
    image:
      "https://images.unsplash.com/photo-1588350834945-2613a64277b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    category: "Toys",
    inStock: true,
    quantity: 35,
    gender: "Kids",
    features: ["100 pieces", "Colorful design", "Safe materials"],
    specifications: {
      material: "Cardboard",
      care: "Store in dry place",
      origin: "USA",
    },
  },
];
