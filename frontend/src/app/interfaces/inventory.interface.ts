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
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_items: number;
  total_value: number;
  categories_count: number;
  items_by_condition: { [key: string]: { label: string; count: number } };
  items_by_category: { [key: string]: number };
  recent_items: Item[];
} 