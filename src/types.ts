// src/types.ts

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'buyer' | 'seller';
  neighborhood: string;
  photoURL?: string;
  isVerified: boolean;
  salesCount: number;
  createdAt: Date;
  publicationCount: number;
  publicationLimit: number;
  lastPublicationReset: Date;
  hasPhysicalShop?: boolean;
  managesDelivery?: boolean;
  bio?: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  neighborhood: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerPhoto?: string;
  sellerVerified: boolean;
  whatsappClickCount: number;
  status: 'active' | 'sold' | 'deleted';
  neighborhoods?: string[]; // multi-ville vendeur
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'phones', name: 'Téléphones', icon: '📱' },
  { id: 'electronics', name: 'Électronique', icon: '💻' },
  { id: 'fashion', name: 'Mode', icon: '👕' },
  { id: 'accessories', name: 'Accessoires', icon: '👜' },
  { id: 'friperie', name: 'Friperie', icon: '🧥' },
  { id: 'resale', name: 'Revente perso', icon: '🔄' },
  { id: 'home', name: 'Maison', icon: '🏠' },
  { id: 'beauty', name: 'Beauté', icon: '💄' },
  { id: 'sports', name: 'Sport', icon: '⚽' },
  { id: 'other', name: 'Autre', icon: '📦' },
];

export const NEIGHBORHOODS = [
  'Yopougon',
  'Cocody',
  'Plateau',
  'Adjamé',
  'Abobo',
  'Marcory',
  'Koumassi',
  'Port-Bouët',
  'Attécoubé',
  'Treichville',
  'Bingerville',
  'Songon',
  'Anyama',
  'Dabou',
  'Grand-Lahou',
  'Jacqueville',
  'Williamsville',
  'Vridi',
  'Zone 4',
  'Zone industrielle',
  'Riviera',
  'Angré',
  'Deux Plateaux',
  'Blockhaus',
  'Bonoumin',
  'Palmeraie',
  'Adiopodoumé',
  'Niangon',
  'Selmer',
  'Locodjoro',
  'Gbagba',
  'Toits Rouges',
  'Siporex',
  'Wassakara',
  'Sagbé',
  'Doukouré',
  'Anono',
  'Djibi',
  'Akouédo',
  'Banco',
];

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  paymentConfirmed: boolean;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  type: 'bug' | 'suggestion' | 'question' | 'complaint';
  message: string;
  email: string;
  createdAt: Date;
}

export const VERIFICATION_PRICE = 2000;
export const VERIFICATION_WHATSAPP = '22586867693';
export const SUPPORT_EMAIL = 'brumerieciv.email@gmail.com';
export const SUPPORT_WHATSAPP = '22586867693';
