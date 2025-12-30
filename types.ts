
export interface BagItem {
  id: string;
  name: string;
  department: string;
  unitPrice: number; // for items per unit or per kg
  quantity: number; // units or packages
  pricingType: 'unit' | 'weight';
  weightGrams?: number; // used when pricingType === 'weight'
  timestamp: number;
}

export interface DepartmentData {
  [key: string]: string[];
}

export interface Purchase {
  id: string;
  createdAt: number;
  items: BagItem[];
  total: number;
}

export type ViewState = 'departments' | 'bag' | 'history';
