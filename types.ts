
export interface BagItem {
  id: string;
  name: string;
  department: string;
  unitPrice: number;
  quantity: number;
  timestamp: number;
}

export interface DepartmentData {
  [key: string]: string[];
}

export type ViewState = 'departments' | 'bag';
