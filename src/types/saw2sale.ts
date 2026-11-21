export type UserRole = 'manager' | 'workshop';

export type NavSection =
  | 'home'
  | 'orders'
  | 'production'
  | 'materials'
  | 'payments'
  | 'customers'
  | 'settings';

export type ScreenStateMode = 'live' | 'loading' | 'empty' | 'error';

export type CustomerType =
  | 'Residential'
  | 'Interior Designer'
  | 'Commercial'
  | 'Trade Contractor';

export type ServiceType = 'full-build' | 'labor-only';

export type ProductionStage =
  | 'Cutting'
  | 'Joinery'
  | 'Assembly'
  | 'Finishing'
  | 'Ready';

export type OrderLifecycleStatus =
  | 'Draft'
  | 'Quotation'
  | 'Deposit Required'
  | 'In Production'
  | 'Ready'
  | 'Delivered'
  | 'Completed'
  | 'Declined';

export type PaymentMethod = 'GCash' | 'Bank' | 'Cash';

export type PaymentType =
  | '50% Downpayment'
  | 'Progress Payment'
  | 'Final Balance'
  | 'COD Collection'
  | 'Repair Fee';

export type PaymentStatus = 'Verified' | 'Pending';

export type ShippingStatus = 'Ordered' | 'In transit' | 'Received';

export type FurnitureKind =
  | 'dining-table'
  | 'cabinets'
  | 'desk'
  | 'bed-frame'
  | 'console'
  | 'lounge-chair';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}

export interface OrderSpecs {
  piece: string;
  dimensions: string;
  woodSpecies: string;
  finishNotes: string;
  furnitureKind: FurnitureKind;
}

export interface QuotationBreakdown {
  materialsCost: number;
  laborHours: number;
  laborRate: number;
  laborCost: number;
  markupRate: number;
  markupAmount: number;
  totalQuotedPrice: number;
  depositRequired: number;
}

export interface MilestoneNote {
  id: string;
  stage: ProductionStage;
  author: string;
  note: string;
  timestamp: string;
  photoId?: string;
}

export interface MilestonePhoto {
  id: string;
  joNumber: string;
  stage: ProductionStage;
  caption: string;
  capturedAt: string;
  furnitureKind: FurnitureKind;
}

export interface DamageCheckRecord {
  checked: boolean;
  hasDamage: boolean;
  description?: string;
  repairCost?: number;
  checkedAt?: string;
}

export interface Order {
  id: string;
  joNumber: string;
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  customerPhone: string;
  serviceType: ServiceType;
  specs: OrderSpecs;
  promisedDate: string;
  createdAt: string;
  queuePosition: number | null;
  status: OrderLifecycleStatus;
  stage: ProductionStage | null;
  quotation: QuotationBreakdown;
  depositVerified: boolean;
  paymentChoiceAtReady: 'Pay now' | 'COD' | null;
  repairCharges: number;
  damageCheck: DamageCheckRecord | null;
  deliveredAt: string | null;
  completedAt: string | null;
  declinedReason?: string;
  notes: MilestoneNote[];
}

export interface PaymentRecord {
  id: string;
  joNumber: string;
  customerName: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  reference: string;
  status: PaymentStatus;
  recordedAt: string;
}

export interface RequisitionLineItem {
  id: string;
  description: string;
  category: 'Lumber' | 'Hardware' | 'Finish';
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface MaterialRequisition {
  id: string;
  reqNumber: string;
  joNumber: string;
  itemTitle: string;
  supplier: string;
  shippingStatus: ShippingStatus;
  createdAt: string;
  expectedDate: string;
  lineItems: RequisitionLineItem[];
}

export interface WorkshopSettings {
  workshopName: string;
  location: string;
  defaultHourlyRate: number;
  defaultMarkupRate: number;
  depositPercentage: number;
}

export type ActivityCategory =
  | 'order'
  | 'payment'
  | 'production'
  | 'material'
  | 'delivery';

export interface ActivityEntry {
  id: string;
  action: string;
  detail: string;
  joNumber?: string;
  timestamp: string;
  category: ActivityCategory;
}

