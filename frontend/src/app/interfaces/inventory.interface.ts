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
  expiry_date?: string;
  expected_lifetime_days?: number;
  reminder_enabled: boolean;
  reminder_days_before: number;
  barcode?: string;
  days_until_expiry?: number;
  needs_reminder?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  category?: number;
  category_name?: string;
  is_active: boolean;
  spent_this_period: number;
  remaining_budget: number;
  is_over_budget: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: number;
  item: number;
  item_name: string;
  reminder_type: 'expiry' | 'maintenance' | 'repurchase';
  message: string;
  reminder_date: string;
  is_sent: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface BarcodeProduct {
  found: boolean;
  name?: string;
  brand?: string;
  category?: string;
  ingredients?: string;
  image_url?: string;
  barcode?: string;
  message?: string;
}

export interface BudgetDashboard {
  budgets: Budget[];
  summary: {
    total_budget: number;
    total_spent: number;
    remaining_total: number;
    budgets_over_limit: number;
    over_budget_details: Budget[];
  };
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