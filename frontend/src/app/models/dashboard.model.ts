export interface DashboardStats {
  total_items: number;
  total_value: number;
  categories_count: number;
  balance: number;
  items_by_condition: { [key: string]: { label: string; count: number } };
  items_by_category: { [key: string]: number };
  recent_items: any[];
} 

