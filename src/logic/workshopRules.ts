import type {
  ActivityEntry,
  MaterialRequisition,
  Order,
  PaymentRecord,
  ProductionStage,
  QuotationBreakdown,
  ServiceType,
} from '../types/saw2sale';

export const PRODUCTION_STAGES: ProductionStage[] = [
  'Cutting',
  'Joinery',
  'Assembly',
  'Finishing',
  'Ready',
];

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPesoWhole(amount: number): string {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}

/**
 * Normalizes Philippine mobile numbers into standard `+63 9XX XXX XXXX` format.
 * Accepts inputs like `0917-889-2341`, `09178892341`, `9178892341`, `639178892341`, or `+63 917 889 2341`.
 */
export function formatPhilippinePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let subscriber = '';
  if (digits.startsWith('63') && digits.length >= 12) {
    subscriber = digits.slice(2, 12);
  } else if (digits.startsWith('09') && digits.length >= 11) {
    subscriber = digits.slice(1, 11);
  } else if (digits.startsWith('9') && digits.length >= 10) {
    subscriber = digits.slice(0, 10);
  } else if (digits.startsWith('639') && digits.length > 2) {
    subscriber = digits.slice(2, 12);
  } else if (digits.startsWith('0') && digits.length > 1) {
    subscriber = digits.slice(1, 11);
  } else {
    subscriber = digits.slice(0, 10);
  }

  if (subscriber.length === 0) return '+63 ';
  const p1 = subscriber.slice(0, 3);
  const p2 = subscriber.slice(3, 6);
  const p3 = subscriber.slice(6, 10);
  return ['+63', p1, p2, p3].filter(Boolean).join(' ');
}

export function isValidPhilippinePhone(phone: string): boolean {
  return /^\+63\s?9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/.test(phone.trim());
}

export function formatDimensionsWithUnit(
  dimensions: string,
  unit: 'in' | 'cm' | 'ft' = 'in',
): string {
  const cleaned = dimensions.replace(/"/g, '').trim();
  if (!cleaned) return '';
  if (/\b(in|inch|inches|cm|mm|m|ft)\b/i.test(cleaned)) {
    return cleaned;
  }
  return `${cleaned} ${unit}`;
}

/**
 * Formula B (Sequence): materials + labor + markup (25%)
 * For labor-only orders, direct materials cost is 0 because client supplies materials.
 */
export function calculateQuotation(params: {
  materialsCost: number;
  laborHours: number;
  laborRate: number;
  markupRate?: number;
  depositPercentage?: number;
  serviceType: ServiceType;
}): QuotationBreakdown {
  const markupRate = params.markupRate ?? 0.25;
  const depositPercentage = params.depositPercentage ?? 0.5;
  const cleanMaterials =
    params.serviceType === 'labor-only'
      ? 0
      : Math.max(0, Number(params.materialsCost) || 0);
  const cleanHours = Math.max(0, Number(params.laborHours) || 0);
  const cleanRate = Math.max(0, Number(params.laborRate) || 0);

  const laborCost = Math.round(cleanHours * cleanRate);
  const subtotal = cleanMaterials + laborCost;
  const markupAmount = Math.round(subtotal * markupRate);
  const totalQuotedPrice = subtotal + markupAmount;
  const depositRequired = Math.round(totalQuotedPrice * depositPercentage);

  return {
    materialsCost: cleanMaterials,
    laborHours: cleanHours,
    laborRate: cleanRate,
    laborCost,
    markupRate,
    markupAmount,
    totalQuotedPrice,
    depositRequired,
  };
}

export function calculateRequiredDeposit(
  totalQuotedPrice: number,
  depositPercentage = 0.5,
): number {
  return Math.round(Math.max(0, totalQuotedPrice) * depositPercentage);
}

export function calculateOrderBalance(
  order: Pick<Order, 'joNumber' | 'quotation' | 'repairCharges' | 'status'>,
  payments: PaymentRecord[],
): {
  totalBilled: number;
  totalVerifiedPaid: number;
  totalPendingPaid: number;
  remainingBalance: number;
} {
  if (order.status === 'Declined') {
    return {
      totalBilled: 0,
      totalVerifiedPaid: 0,
      totalPendingPaid: 0,
      remainingBalance: 0,
    };
  }

  const totalBilled =
    Math.max(0, order.quotation.totalQuotedPrice) +
    Math.max(0, order.repairCharges || 0);

  const orderPayments = payments.filter((p) => p.joNumber === order.joNumber);
  const totalVerifiedPaid = orderPayments
    .filter((p) => p.status === 'Verified')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPendingPaid = orderPayments
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingBalance = Math.max(0, totalBilled - totalVerifiedPaid);

  return {
    totalBilled,
    totalVerifiedPaid,
    totalPendingPaid,
    remainingBalance,
  };
}

export function calculatePortfolioTotals(
  orders: Order[],
  payments: PaymentRecord[],
): {
  totalReceivables: number;
  totalCollected: number;
  totalRemaining: number;
} {
  let totalReceivables = 0;
  let totalCollected = 0;
  let totalRemaining = 0;

  for (const order of orders) {
    if (order.status === 'Declined' || order.status === 'Draft') {
      continue;
    }
    const bal = calculateOrderBalance(order, payments);
    totalReceivables += bal.totalBilled;
    totalCollected += bal.totalVerifiedPaid;
    totalRemaining += bal.remainingBalance;
  }

  return {
    totalReceivables,
    totalCollected,
    totalRemaining,
  };
}

export function canCreateRequisitionForOrder(
  order: Pick<Order, 'serviceType' | 'status'>,
): { allowed: boolean; reason?: string } {
  if (order.serviceType === 'labor-only') {
    return {
      allowed: false,
      reason: 'Client supplies materials for labor-only orders.',
    };
  }
  if (order.status === 'Declined') {
    return {
      allowed: false,
      reason: 'Cannot request materials for a declined order.',
    };
  }
  if (order.status === 'Draft' || order.status === 'Quotation') {
    return {
      allowed: false,
      reason: 'Accept quotation before requesting materials.',
    };
  }
  return { allowed: true };
}

export function getNextProductionStage(
  currentStage: ProductionStage | null,
): ProductionStage | null {
  if (!currentStage) return 'Cutting';
  const idx = PRODUCTION_STAGES.indexOf(currentStage);
  if (idx === -1 || idx >= PRODUCTION_STAGES.length - 1) return null;
  return PRODUCTION_STAGES[idx + 1];
}

export function validateStageTransition(
  currentStage: ProductionStage | null,
  targetStage: ProductionStage,
): { valid: boolean; error?: string } {
  const currentIdx = currentStage
    ? PRODUCTION_STAGES.indexOf(currentStage)
    : -1;
  const targetIdx = PRODUCTION_STAGES.indexOf(targetStage);

  if (targetIdx === -1) {
    return { valid: false, error: 'Unknown production stage.' };
  }

  if (targetIdx === currentIdx) {
    return {
      valid: false,
      error: `Job is already at ${currentStage}. Select the next sequential stage.`,
    };
  }

  if (targetIdx < currentIdx) {
    return {
      valid: false,
      error: `Cannot move backwards from ${currentStage} to ${targetStage}.`,
    };
  }

  if (targetIdx > currentIdx + 1) {
    const expected = PRODUCTION_STAGES[currentIdx + 1];
    return {
      valid: false,
      error: `Cannot skip stages. Complete ${expected} before advancing to ${targetStage}.`,
    };
  }

  return { valid: true };
}

export function canFinalizeOrder(
  remainingBalance: number,
  statusOrStage: { status: Order['status']; stage: ProductionStage | null },
): boolean {
  if (remainingBalance > 0) return false;
  return (
    statusOrStage.stage === 'Ready' ||
    statusOrStage.status === 'Ready' ||
    statusOrStage.status === 'Delivered'
  );
}

export function generateNextJoNumber(existingOrders: Pick<Order, 'joNumber'>[]): string {
  const maxNum = existingOrders.reduce((max, o) => {
    const match = /JO-2026-(\d+)/.exec(o.joNumber);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `JO-2026-${String(maxNum + 1).padStart(4, '0')}`;
}

export function generateNextReqNumber(
  existingReqs: Pick<MaterialRequisition, 'reqNumber'>[],
): string {
  const maxNum = existingReqs.reduce((max, r) => {
    const match = /REQ-2026-(\d+)/.exec(r.reqNumber);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `REQ-2026-${String(maxNum + 1).padStart(3, '0')}`;
}

export function sortProductionQueue(orders: Order[]): Order[] {
  return [...orders]
    .filter(
      (o) =>
        o.depositVerified &&
        (o.status === 'In Production' || o.status === 'Ready') &&
        o.stage !== null,
    )
    .sort((a, b) => {
      const qa = a.queuePosition ?? Number.MAX_SAFE_INTEGER;
      const qb = b.queuePosition ?? Number.MAX_SAFE_INTEGER;
      if (qa !== qb) return qa - qb;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersToCsv(
  orders: Order[],
  payments: PaymentRecord[],
): string {
  const headers = [
    'JO Number',
    'Customer',
    'Customer Type',
    'Service Type',
    'Piece',
    'Dimensions',
    'Status',
    'Production Stage',
    'Promised Date',
    'Total Quoted',
    'Repair Charges',
    'Verified Paid',
    'Outstanding Balance',
  ];

  const rows = orders.map((order) => {
    const bal = calculateOrderBalance(order, payments);
    return [
      order.joNumber,
      order.customerName,
      order.customerType,
      order.serviceType === 'full-build' ? 'Full-Build' : 'Labor-Only',
      order.specs.piece,
      order.specs.dimensions,
      order.status,
      order.stage ?? '-',
      order.promisedDate,
      order.quotation.totalQuotedPrice.toFixed(2),
      order.repairCharges.toFixed(2),
      bal.totalVerifiedPaid.toFixed(2),
      bal.remainingBalance.toFixed(2),
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportPaymentsToCsv(payments: PaymentRecord[]): string {
  const headers = [
    'Payment ID',
    'JO Number',
    'Customer',
    'Type',
    'Method',
    'Amount',
    'Reference',
    'Status',
    'Recorded At',
  ];

  const rows = payments.map((p) =>
    [
      p.id,
      p.joNumber,
      p.customerName,
      p.type,
      p.method,
      p.amount.toFixed(2),
      p.reference,
      p.status,
      p.recordedAt,
    ]
      .map(escapeCsvCell)
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Idempotency key generator for mutation deduplication.
 */
export function createIdempotencyKey(
  action: string,
  entityId: string,
  nonce: string | number = Date.now(),
): string {
  const cleanAction = action.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cleanEntity = entityId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `idem_${cleanAction}_${cleanEntity}_${nonce}`;
}

export class IdempotencyGuard {
  private seen = new Set<string>();

  claim(key: string): boolean {
    if (this.seen.has(key)) {
      return false;
    }
    this.seen.add(key);
    return true;
  }

  release(key: string): void {
    this.seen.delete(key);
  }

  has(key: string): boolean {
    return this.seen.has(key);
  }
}

export interface OrderCostingRow {
  joNumber: string;
  piece: string;
  serviceType: ServiceType;
  bomMaterials: number;
  actualRequisitions: number;
  laborCost: number;
  markupAmount: number;
  repairCharges: number;
  totalBilled: number;
  remainingBalance: number;
}

export interface CostingMaterialsReport {
  activeOrderCount: number;
  totalQuoted: number;
  totalRepairCharges: number;
  totalBilled: number;
  estimatedBomMaterials: number;
  estimatedLaborCost: number;
  totalLaborHours: number;
  estimatedMarkup: number;
  actualRequisitionSpend: number;
  materialsVariance: number;
  categorySpend: {
    Lumber: number;
    Hardware: number;
    Finish: number;
  };
  shippingCounts: {
    Ordered: number;
    'In transit': number;
    Received: number;
  };
  orderRows: OrderCostingRow[];
}

export function calculateCostingAndMaterialsReport(
  orders: Order[],
  requisitions: MaterialRequisition[],
  payments: PaymentRecord[],
): CostingMaterialsReport {
  const activeOrders = orders.filter(
    (o) => o.status !== 'Declined' && o.status !== 'Draft',
  );

  const reqSpendByJo = new Map<string, number>();
  const categorySpend = { Lumber: 0, Hardware: 0, Finish: 0 };
  const shippingCounts = { Ordered: 0, 'In transit': 0, Received: 0 };
  let actualRequisitionSpend = 0;

  for (const req of requisitions) {
    shippingCounts[req.shippingStatus] += 1;
    let reqTotal = 0;
    for (const li of req.lineItems) {
      const lineTotal = li.quantity * li.unitCost;
      reqTotal += lineTotal;
      categorySpend[li.category] += lineTotal;
    }
    actualRequisitionSpend += reqTotal;
    reqSpendByJo.set(
      req.joNumber,
      (reqSpendByJo.get(req.joNumber) ?? 0) + reqTotal,
    );
  }

  let totalQuoted = 0;
  let totalRepairCharges = 0;
  let estimatedBomMaterials = 0;
  let estimatedLaborCost = 0;
  let totalLaborHours = 0;
  let estimatedMarkup = 0;

  const orderRows: OrderCostingRow[] = activeOrders.map((o) => {
    const bal = calculateOrderBalance(o, payments);
    const actualReq = reqSpendByJo.get(o.joNumber) ?? 0;

    totalQuoted += o.quotation.totalQuotedPrice;
    totalRepairCharges += o.repairCharges || 0;
    estimatedBomMaterials += o.quotation.materialsCost;
    estimatedLaborCost += o.quotation.laborCost;
    totalLaborHours += o.quotation.laborHours;
    estimatedMarkup += o.quotation.markupAmount;

    return {
      joNumber: o.joNumber,
      piece: o.specs.piece,
      serviceType: o.serviceType,
      bomMaterials: o.quotation.materialsCost,
      actualRequisitions: actualReq,
      laborCost: o.quotation.laborCost,
      markupAmount: o.quotation.markupAmount,
      repairCharges: o.repairCharges || 0,
      totalBilled: bal.totalBilled,
      remainingBalance: bal.remainingBalance,
    };
  });

  return {
    activeOrderCount: activeOrders.length,
    totalQuoted,
    totalRepairCharges,
    totalBilled: totalQuoted + totalRepairCharges,
    estimatedBomMaterials,
    estimatedLaborCost,
    totalLaborHours,
    estimatedMarkup,
    actualRequisitionSpend,
    materialsVariance: estimatedBomMaterials - actualRequisitionSpend,
    categorySpend,
    shippingCounts,
    orderRows,
  };
}

export function formatActivityTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function appendActivityEntry(
  list: ActivityEntry[],
  entry: Omit<ActivityEntry, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: string;
  },
  limit = 5,
): ActivityEntry[] {
  const next: ActivityEntry = {
    id:
      entry.id ??
      `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action: entry.action,
    detail: entry.detail,
    ...(entry.joNumber ? { joNumber: entry.joNumber } : {}),
    timestamp: entry.timestamp ?? formatActivityTimestamp(),
    category: entry.category,
  };
  return [next, ...list].slice(0, Math.max(1, limit));
}
