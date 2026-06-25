export type UserRole = 'admin' | 'user'
export type EquipmentStatus = 'available' | 'borrowed' | 'overdue' | 'maintenance'
export type LoanStatus = 'active' | 'returned' | 'overdue'
export type ConditionOnReturn = 'excellent' | 'good' | 'fair' | 'damaged'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface ActiveLoanSummary {
  equipment_id: string
  due_date: string
  borrowed_at: string
  borrower_name: string | null
}

export interface Equipment {
  id: string
  name: string
  serial_no: string | null
  category_id: string | null
  category?: Category
  image_url: string | null
  description: string | null
  status: EquipmentStatus
  created_by: string | null
  created_at: string
  updated_at: string
  active_loan?: ActiveLoanSummary | null
}

export interface Loan {
  id: string
  equipment_id: string
  equipment?: Equipment
  borrower_id: string | null
  borrower?: Profile | null
  borrower_name: string | null
  borrower_contact: string | null
  borrowed_at: string
  due_date: string
  returned_at: string | null
  condition_on_return: ConditionOnReturn | null
  return_images: string[] | null
  note: string | null
  status: LoanStatus
  created_at: string
}

export interface DashboardStats {
  total: number
  available: number
  borrowed: number
  overdue: number
  maintenance: number
}
