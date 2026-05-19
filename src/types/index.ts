// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

// ─── Staff ───────────────────────────────────────────────────────────────────
export interface StaffResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Vendor ──────────────────────────────────────────────────────────────────
export interface VendorDto {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

// ─── Parts ───────────────────────────────────────────────────────────────────
export interface PartDto {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  vendorId?: string;
  vendorName: string;
  createdAt: string;
  imageUrl?: string;
}

// ─── Purchase Invoices ────────────────────────────────────────────────────────
export interface PurchaseInvoiceItem {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseInvoiceResponse {
  id: string;
  vendorId: string;
  vendorName: string;
  adminId: string;
  adminName: string;
  totalAmount: number;
  notes: string;
  invoiceDate: string;
  items: PurchaseInvoiceItem[];
}

// ─── Sales Invoices ───────────────────────────────────────────────────────────
export interface SalesInvoiceItem {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalesInvoiceResponse {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  staffId: string;
  staffName: string;
  originalAmount: number;
  discountApplied: number;
  pointsRedeemed: number;
  pointsDiscountApplied: number;
  totalAmount: number;
  loyaltyDiscountUsed: boolean;
  isPaid: boolean;
  paymentDueDate?: string;
  invoiceDate: string;
  emailSent: boolean;
  items: SalesInvoiceItem[];
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface CustomerResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
}

export interface VehicleResponse {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  createdAt: string;
  imageUrl?: string;
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export interface AppointmentResponse {
  id: string;
  customerId: string;
  vehicleId: string;
  appointmentDate: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  licensePlate?: string;
}

export interface PartRequest {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  partName: string;
  description: string;
  status: string;
  createdAt: string;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  reviewType: "Purchase" | "Service";
  referenceId?: number;
  subject: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// ─── Customer Detail (Staff view) ─────────────────────────────────────────────
export interface CustomerDetailDto {
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  loyaltyPoints: number;
  totalSpent: number;
  memberSince: string;
  vehicles: VehicleResponse[];
  appointments: AppointmentResponse[];
  partRequests: PartRequest[];
  reviews: Review[];
}

// ─── Financial Reports ────────────────────────────────────────────────────────
export interface DailyBreakdown {
  date: string;
  salesRevenue: number;
  purchaseCost: number;
}

export interface FinancialReportDto {
  period: string;
  from: string;
  to: string;
  totalSalesRevenue: number;
  totalPurchaseCost: number;
  netProfit: number;
  totalSalesInvoices: number;
  totalPurchaseInvoices: number;
  paidSalesInvoices: number;
  unpaidSalesInvoices: number;
  totalDiscountsGiven: number;
  dailyBreakdown: DailyBreakdown[];
}

// ─── Customer Reports ─────────────────────────────────────────────────────────
export interface TopSpender {
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  totalSpent: number;
  loyaltyPoints: number;
}

export interface RegularCustomer {
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
}

export interface PendingCredit {
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  invoiceId: number;
  amountDue: number;
  paymentDueDate?: string;
  daysOverdue: number;
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────
export interface LoyaltyCheckResponse {
  originalAmount: number;
  isEligible: boolean;
  discountApplied: number;
  finalAmount: number;
  message: string;
}

export interface PointsRedemptionPreview {
  customerPoints: number;
  pointsToRedeem: number;
  pointsValueInRupees: number;
  invoiceTotalAfterRedemption: number;
  message: string;
}

// ─── Customer History ─────────────────────────────────────────────────────────
export interface PurchaseHistoryItem {
  invoiceId: string;
  invoiceDate: string;
  originalAmount: number;
  discountApplied: number;
  totalAmount: number;
  isPaid: boolean;
  paymentDueDate?: string;
  emailSent: boolean;
  parts: {
    partId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface ServiceHistoryItem {
  appointmentId: string;
  appointmentDate: string;
  status: string;
  notes: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licensePlate: string;
}

export interface CustomerHistoryDto {
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalSpent: number;
  loyaltyPoints: number;
  purchaseHistory: PurchaseHistoryItem[];
  serviceHistory: ServiceHistoryItem[];
}
