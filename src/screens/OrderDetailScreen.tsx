import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Hammer,
  Package,
  Plus,
  Truck,
} from 'lucide-react';
import { FurnitureIllustration } from '../components/FurnitureIllustration';
import { ProductionTimeline } from '../components/ProductionTimeline';
import { PredictiveBackButton } from '../components/UxOverlays';
import {
  OrderStatusText,
  PaymentStatusText,
  ShippingStatusText,
} from '../components/StatusText';
import { prefetchRouteData } from '../utils/uxPrimitives';
import {
  calculateOrderBalance,
  canCreateRequisitionForOrder,
  formatPeso,
} from '../logic/workshopRules';
import type {
  MaterialRequisition,
  MilestonePhoto,
  Order,
  PaymentRecord,
} from '../types/saw2sale';

export type OrderDetailTab =
  | 'Overview'
  | 'Materials'
  | 'Production'
  | 'Payments'
  | 'Delivery';

interface OrderDetailScreenProps {
  order: Order;
  payments: PaymentRecord[];
  requisitions: MaterialRequisition[];
  photos: MilestonePhoto[];
  initialTab?: OrderDetailTab;
  onBack: () => void;
  onVerifyDeposit: (joNumber: string) => void;
  onNewRequisition: (joNumber: string) => void;
  onOpenRequisition: (reqId: string) => void;
  onOpenJobStatus: (joNumber: string) => void;
  onOpenOrderBalance: (joNumber: string) => void;
  onOpenDelivery: (joNumber: string) => void;
}

const TABS: OrderDetailTab[] = [
  'Overview',
  'Materials',
  'Production',
  'Payments',
  'Delivery',
];

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({
  order,
  payments,
  requisitions,
  photos,
  initialTab = 'Overview',
  onBack,
  onVerifyDeposit,
  onNewRequisition,
  onOpenRequisition,
  onOpenJobStatus,
  onOpenOrderBalance,
  onOpenDelivery,
}) => {
  const [activeTab, setActiveTab] = useState<OrderDetailTab>(initialTab);

  const balance = calculateOrderBalance(order, payments);
  const orderPayments = payments.filter((p) => p.joNumber === order.joNumber);
  const orderReqs = requisitions.filter((r) => r.joNumber === order.joNumber);
  const orderPhotos = photos.filter((ph) => ph.joNumber === order.joNumber);
  const reqPermission = canCreateRequisitionForOrder(order);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="self-start">
          <PredictiveBackButton label="Back to Orders" onBack={onBack} />
        </div>

        {/* 5-Tab Bar */}
        <div
          role="tablist"
          aria-label="Order detail sections"
          className="inline-flex flex-wrap items-center gap-1 p-1 continuous-control glass-frosted max-w-full"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onMouseEnter={() =>
                prefetchRouteData(`order:${order.joNumber}:${tab}`)
              }
              onFocus={() =>
                prefetchRouteData(`order:${order.joNumber}:${tab}`)
              }
              onClick={() => setActiveTab(tab)}
              className={`hit-slop h-9 px-3.5 sm:px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab
                  ? 'bg-[#1B1712] text-white'
                  : 'text-[#4A4237] hover:text-[#1B1712] hover:bg-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Header Summary Card */}
      <div className="w-full glass-clear continuous-card p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <FurnitureIllustration
            kind={order.specs.furnitureKind}
            stage={order.stage}
            size="md"
          />
          <div className="min-w-0 space-y-1 break-words">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-code text-xs text-[#5C5446]">
                {order.joNumber}
              </span>
              <OrderStatusText status={order.status} />
            </div>
            <h2 className="text-xl sm:text-2xl text-[#1B1712] break-words">
              {order.specs.piece}
            </h2>
            <div className="text-sm text-[#4A4237] break-words">
              {order.customerName} · {order.customerType} ·{' '}
              {order.serviceType === 'full-build' ? 'Full-Build' : 'Labor-Only'}
            </div>
          </div>
        </div>

        <div className="md:text-right shrink-0 space-y-1">
          <div className="text-xs text-[#5C5446]">Outstanding Balance</div>
          <div className="font-display text-2xl sm:text-3xl text-[#1B1712] tabular-nums">
            {formatPeso(balance.remainingBalance)}
          </div>
          <div className="text-xs text-[#5C5446] tabular-nums break-words">
            Quoted {formatPeso(order.quotation.totalQuotedPrice)} · Due{' '}
            {order.promisedDate}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 glass-clear continuous-card p-4 sm:p-6 space-y-5">
            <h3 className="text-xl font-display text-[#1B1712]">
              Specifications &amp; Client Details
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-[#5C5446]">Client</dt>
                <dd className="font-semibold text-[#1B1712] mt-0.5 break-words">
                  {order.customerName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#5C5446]">Customer Type</dt>
                <dd className="font-semibold text-[#1B1712] mt-0.5">
                  {order.customerType}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#5C5446]">Service Type</dt>
                <dd className="font-semibold text-[#1B1712] mt-0.5 break-words">
                  {order.serviceType === 'full-build'
                    ? 'Full-Build (Workshop Materials)'
                    : 'Labor-Only (Client Supplies Materials)'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#5C5446]">Promised Date</dt>
                <dd className="font-semibold text-[#1B1712] mt-0.5 tabular-nums">
                  {order.promisedDate}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#5C5446]">Dimensions</dt>
                <dd className="font-semibold text-[#1B1712] mt-0.5 break-words">
                  {order.specs.dimensions}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#5C5446]">Wood Species</dt>
                <dd className="font-semibold text-[#1B1712] mt-0.5 break-words">
                  {order.specs.woodSpecies}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#5C5446]">Finish Notes</dt>
                <dd className="font-semibold text-[#1B1712] mt-0.5 break-words">
                  {order.specs.finishNotes || 'Standard satin clear coat'}
                </dd>
              </div>
            </dl>

            {order.status === 'Declined' && order.declinedReason && (
              <div className="p-4 rounded-2xl bg-[#991B1B]/10 border border-[#991B1B]/25 text-xs text-[#991B1B] break-words">
                <strong>Declined:</strong> {order.declinedReason}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 glass-clear continuous-card p-4 sm:p-6 space-y-5">
            <h3 className="text-xl font-display text-[#1B1712]">
              Quote &amp; Deposit Status
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#4A4237]">Direct Materials</span>
                <span className="font-semibold tabular-nums">
                  {formatPeso(order.quotation.materialsCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4237]">
                  Direct Labor ({order.quotation.laborHours} hrs)
                </span>
                <span className="font-semibold tabular-nums">
                  {formatPeso(order.quotation.laborCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4A4237]">Shop Markup (25%)</span>
                <span className="font-semibold tabular-nums">
                  {formatPeso(order.quotation.markupAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#D9D2C3] flex justify-between font-semibold">
                <span>Total Quoted Price</span>
                <span className="tabular-nums text-[#8A3B12]">
                  {formatPeso(order.quotation.totalQuotedPrice)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9D2C3] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#4A4237]">
                  50% Deposit Status
                </span>
                {order.depositVerified ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1F6B43]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-[#9A5B13]">
                    <Clock className="w-3.5 h-3.5" />
                    Deposit Required
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Required Amount</span>
                <span className="tabular-nums">
                  {formatPeso(order.quotation.depositRequired)}
                </span>
              </div>
              {!order.depositVerified && order.status !== 'Declined' && (
                <button
                  type="button"
                  onClick={() => onVerifyDeposit(order.joNumber)}
                  className="w-full h-11 mt-2 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-xs font-semibold"
                >
                  Open Deposit Verification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Materials' && (
        <div className="w-full glass-clear continuous-card p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 break-words">
              <h3 className="text-xl font-display text-[#1B1712]">
                Materials &amp; Requisitions
              </h3>
              <p className="text-sm text-[#4A4237]">
                Lumber, hardware, and finish purchase requisitions linked to{' '}
                {order.joNumber}.
              </p>
            </div>
            {reqPermission.allowed ? (
              <button
                type="button"
                onClick={() => onNewRequisition(order.joNumber)}
                className="h-11 px-4 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Requisition
              </button>
            ) : (
              <span className="text-xs font-semibold text-[#9A5B13]">
                {reqPermission.reason}
              </span>
            )}
          </div>

          {!reqPermission.allowed && order.serviceType === 'labor-only' ? (
            <div className="p-5 rounded-2xl bg-[#F5F2EA] border border-[#D9D2C3] flex items-center gap-3">
              <Package className="w-5 h-5 text-[#8A3B12] shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[#1B1712]">
                  Client supplies materials
                </div>
                <div className="text-xs text-[#4A4237]">
                  This is a Labor-Only job order. Material requisitions are
                  disabled because the customer provides their own lumber.
                </div>
              </div>
            </div>
          ) : orderReqs.length === 0 ? (
            <p className="text-sm text-[#5C5446] py-4">
              No material requisitions logged for this order yet.
            </p>
          ) : (
            <div className="divide-y divide-[#D9D2C3]">
              {orderReqs.map((req) => {
                const reqTotal = req.lineItems.reduce(
                  (s, li) => s + li.quantity * li.unitCost,
                  0,
                );
                return (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => onOpenRequisition(req.id)}
                    className="w-full py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-left hover:bg-white/40 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 break-words">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-code text-xs text-[#5C5446]">
                          {req.reqNumber}
                        </span>
                        <span className="text-sm font-semibold text-[#1B1712] break-words">
                          {req.itemTitle}
                        </span>
                      </div>
                      <div className="text-xs text-[#5C5446] mt-0.5 break-words">
                        {req.supplier} · {req.lineItems.length} line items
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 w-full sm:w-auto">
                      <ShippingStatusText status={req.shippingStatus} />
                      <span className="text-sm font-semibold tabular-nums text-[#1B1712]">
                        {formatPeso(reqTotal)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Production' && (
        <div className="w-full glass-clear continuous-card p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 break-words">
              <h3 className="text-xl font-display text-[#1B1712]">
                Production Progress
              </h3>
              <p className="text-sm text-[#4A4237]">
                {order.stage
                  ? `Current Stage: ${order.stage}`
                  : 'Waiting for deposit verification before queuing.'}
              </p>
            </div>
            {order.depositVerified && (
              <button
                type="button"
                onClick={() => onOpenJobStatus(order.joNumber)}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0"
              >
                <Hammer className="w-4 h-4" />
                Open Job Status &amp; Update
              </button>
            )}
          </div>

          <ProductionTimeline currentStage={order.stage} />

          {orderPhotos.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#5C5446]">
                Milestone Photos ({orderPhotos.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderPhotos.map((ph) => (
                  <div
                    key={ph.id}
                    className="rounded-2xl bg-white/70 border border-[#D9D2C3] p-3 space-y-2"
                  >
                    <FurnitureIllustration
                      kind={ph.furnitureKind}
                      stage={ph.stage}
                      size="lg"
                      className="h-28"
                    />
                    <div className="text-xs font-semibold text-[#1B1712]">
                      {ph.stage} · {ph.capturedAt}
                    </div>
                    <div className="text-xs text-[#4A4237]">{ph.caption}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Payments' && (
        <div className="w-full glass-clear continuous-card p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 break-words">
              <h3 className="text-xl font-display text-[#1B1712]">
                Order Balance &amp; Ledger
              </h3>
              <p className="text-sm text-[#4A4237] tabular-nums break-words">
                Receivables {formatPeso(balance.totalBilled)} · Collected{' '}
                {formatPeso(balance.totalVerifiedPaid)} · Amount Due{' '}
                {formatPeso(balance.remainingBalance)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenOrderBalance(order.joNumber)}
              className="w-full sm:w-auto h-11 px-4 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              Manage Order Balance
            </button>
          </div>

          {orderPayments.length === 0 ? (
            <p className="text-sm text-[#5C5446] py-4">
              No payment records logged yet.
            </p>
          ) : (
            <div className="divide-y divide-[#D9D2C3]">
              {orderPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#1B1712]">
                      {pay.type}
                    </div>
                    <div className="text-xs text-[#5C5446] tabular-nums">
                      {pay.method} · Ref {pay.reference} · {pay.recordedAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <PaymentStatusText status={pay.status} />
                    <span className="text-sm font-semibold tabular-nums text-[#1B1712]">
                      {formatPeso(pay.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Delivery' && (
        <div className="w-full glass-clear continuous-card p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 break-words">
              <h3 className="text-xl font-display text-[#1B1712]">
                Delivery &amp; Handover
              </h3>
              <p className="text-sm text-[#4A4237] break-words">
                {order.status === 'Completed'
                  ? `Completed on ${order.completedAt}`
                  : order.status === 'Ready'
                    ? 'Piece is in Ready stage and cleared for handover workflow.'
                    : 'Delivery handover unlocks once production reaches the Ready stage.'}
              </p>
            </div>
            {(order.status === 'Ready' ||
              order.status === 'Delivered' ||
              order.status === 'Completed') && (
              <button
                type="button"
                onClick={() => onOpenDelivery(order.joNumber)}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0"
              >
                <Truck className="w-4 h-4" />
                Open Handover Flow
              </button>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#F5F2EA] border border-[#D9D2C3] text-sm">
            <div>
              <dt className="text-xs text-[#5C5446]">Settlement Mode</dt>
              <dd className="font-semibold text-[#1B1712] mt-0.5">
                {balance.remainingBalance === 0
                  ? 'Paid in Full'
                  : order.paymentChoiceAtReady ?? 'Amount Due'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5C5446]">Damage Check</dt>
              <dd className="font-semibold text-[#1B1712] mt-0.5">
                {order.damageCheck
                  ? order.damageCheck.hasDamage
                    ? `Damage billed (${formatPeso(order.repairCharges)})`
                    : 'Passed — No Damage'
                  : 'Pending handover'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5C5446]">Delivered Date</dt>
              <dd className="font-semibold text-[#1B1712] mt-0.5 tabular-nums">
                {order.deliveredAt ?? 'Not yet delivered'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};
