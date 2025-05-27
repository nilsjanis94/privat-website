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
  current_value?: number;
  condition: string;
  location: string;
  serial_number: string;
  warranty_until?: string;
  image?: string;
  consumed: boolean;
  consumed_at?: string;
  created_at: string;
  updated_at: string;
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
  total_purchase_price: number;  // Gesamte Ausgaben (alle Zeit)
  current_month_expenses: number;  // Ausgaben diesen Monat
  monthly_expenses: MonthlyExpense[];  // Ausgaben der letzten 6 Monate
  items_without_purchase_date: number;  // Hinzufügen
  categories_count: number;
  balance: number;
  items_by_condition: { [key: string]: { label: string; count: number } };
  items_by_category: { [key: string]: number };
  recent_items: Item[];
} 