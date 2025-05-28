export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  items_count: number;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name: string;
  owner: number;
  owner_name: string;
  purchase_date?: string;
  purchase_price?: number;
  location: string;
  location_display?: string;
  consumed: boolean;
  consumed_at?: string;
  created_at: string;
  updated_at: string;
}

export enum ItemCondition {
  GUT = 'gut',
  OK = 'ok',
  SCHLECHT = 'schlecht'
}

export enum ItemLocation {
  WOHNZIMMER = 'wohnzimmer',
  SCHLAFZIMMER = 'schlafzimmer',
  KUECHE = 'kueche',
  BAD = 'bad',
  BUERO = 'buero',
  KELLER = 'keller',
  DACHBODEN = 'dachboden',
  GARAGE = 'garage',
  BALKON = 'balkon',
  SONSTIGES = 'sonstiges'
}

export interface MonthlyExpense {
  month: string;  // Format: "2024-01"
  month_name: string;  // Format: "Januar 2024"
  total_expenses: number;
  items_count: number;
}

export interface DashboardStats {
  total_items: number;
  consumed_items: number;
  total_value: number;
  total_purchase_price: number;
  current_month_expenses: number;
  today_expenses: number;
  monthly_expenses: MonthlyExpense[];
  items_without_purchase_date: number;
  categories_count: number;
  balance: number;
  items_by_category: { [key: string]: number };
  recent_items: Item[];
} 