import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Clock,
  CreditCard,
  Hammer,
  Package,
  Plus,
  Truck,
} from 'lucide-react';
import { RecentActivityFeed } from '../components/RecentActivityFeed';
import {
  calculateCostingAndMaterialsReport,
  calculateOrderBalance,
  calculatePortfolioTotals,
  formatPesoWhole,
  sortProductionQueue,
} from '../logic/workshopRules';
import type {
  ActivityEntry,
  MaterialRequisition,
  Order,
  PaymentRecord,
  UserRole,
} from '../types/saw2sale';

interface HomeScreenProps {
  role: UserRole;
  orders: Order[];
  payments: PaymentRecord[];
  requisitions: MaterialRequisition[];
  activities: ActivityEntry[];
  onNewOrder: () => void;
  onOpenOrder: (joNumber: string) => void;
  onOpenDownPayment: (joNumber: string) => void;
  onOpenJobStatus: (joNumber: string) => void;
  onOpenOrderBalance: (joNumber: string) => void;
  onOpenDelivery: (joNumber: string) => void;
  onNavigateTab: (
    tab: 'orders' | 'production' | 'payments' | 'materials',
  ) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  role,
  orders,
  payments,
  requisitions,
  activities,
  onNewOrder,
  onOpenOrder,
  onOpenDownPayment,
  onOpenJobStatus,
  onOpenOrderBalance,
  onOpenDelivery,
  onNavigateTab,
}) => {
  const queueJobs = sortProductionQueue(orders).filter(
    (o) => o.status === 'In Production',
  );
  const pendingDeposits = orders.filter(
    (o) => !o.depositVerified && o.status === 'Deposit Required',
  );
  const balancesDue = orders
    .filter((o) => o.status !== 'Declined' && o.status !== 'Draft')
    .map((o) => ({
      order: o,
      balance: calculateOrderBalance(o, payments).remainingBalance,
    }))
    .filter((item) => item.balance > 0);

  const readyDeliveries = orders.filter((o) => o.status === 'Ready');
  const totals = calculatePortfolioTotals(orders, payments);
  const report = calculateCostingAndMaterialsReport(
    orders,
    requisitions,
    payments,
  );

  // Straight-up next recommended step
  const nextDirective =
    pendingDeposits.length > 0
      ? {
          label: `Verify 50% deposit for ${pendingDeposits[0].joNumber}`,
          cta: 'Verify Deposit →',
          onRun: () => onOpenDownPayment(pendingDeposits[0].joNumber),
        }
      : readyDeliveries.length > 0
        ? {
            label: `Handover ready piece ${readyDeliveries[0].joNumber}`,
            cta: 'Start Handover →',
            onRun: () => onOpenDelivery(readyDeliveries[0].joNumber),
          }
        : queueJobs.length > 0
          ? {
              label: `Update Status: ${queueJobs[0].joNumber} (${queueJobs[0].stage})`,
              cta: 'Open Job →',
              onRun: () => onOpenJobStatus(queueJobs[0].joNumber),
            }
          : {
              label: 'Create a new custom furniture job order',
              cta: '+ New Order →',
              onRun: onNewOrder,
            };

  return (
    <div className="space-y-6 w-full">
      {/* Top Hero Operational Summary */}
      <div className="w-full glass-dark continuous-card p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
        <div className="min-w-0 space-y-1.5 break-words">
          <div className="text-xs font-semibold text-white/70">
            Outstanding Balance
          </div>
          <div className="font-display text-3xl sm:text-4xl tabular-nums text-white">
            {formatPesoWhole(totals.totalRemaining)}
          </div>
          <div className="flex items-center gap-x-4 gap-y-1 text-xs text-white/75 pt-0.5 tabular-nums flex-wrap">
            <span>Receivables {formatPesoWhole(totals.totalReceivables)}</span>
            <span aria-hidden="true">·</span>
            <span>Collected {formatPesoWhole(totals.totalCollected)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto shrink-0">
          {role === 'manager' && (
            <button
              type="button"
              onClick={onNewOrder}
              title="Open New Order Intake form"
              className="btn-scale flex-1 sm:flex-none h-11 sm:h-12 px-5 continuous-control bg-white text-[#1B1712] hover:bg-[#F5F2EA] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          )}
          <button
            type="button"
            onClick={nextDirective.onRun}
            title={nextDirective.label}
            className="btn-scale flex-1 sm:flex-none h-11 sm:h-12 px-5 continuous-control bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Hammer className="w-4 h-4" />
            {nextDirective.cta}
          </button>
        </div>
      </div>

      {/* Four Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* 1. Today's Queue */}
        <section
          aria-labelledby="home-queue-heading"
          className="glass-clear continuous-card p-6 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-[#8A3B12]" />
                <h2
                  id="home-queue-heading"
                  className="text-xl text-[#1B1712]"
                >
                  Today&apos;s Queue
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('production')}
                title="Go to full Production Queue"
                className="btn-scale text-xs font-semibold text-[#8A3B12] hover:underline inline-flex items-center gap-1"
              >
                Production <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {queueJobs.length === 0 ? (
              <p className="text-sm text-[#5C5446] py-6">
                No active jobs. Verify a deposit to queue.
              </p>
            ) : (
              <div className="divide-y divide-[#D9D2C3]/70">
                {queueJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onOpenJobStatus(job.joNumber)}
                    title={`Open ${job.joNumber} stage tracker`}
                    className="group w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-white/40 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-code text-xs text-[#5C5446] whitespace-nowrap shrink-0">
                          {job.joNumber}
                        </span>
                        <span className="text-sm font-semibold text-[#1B1712] truncate">
                          {job.specs.piece}
                        </span>
                      </div>
                      <div className="text-xs text-[#5C5446] mt-0.5 tabular-nums">
                        #{job.queuePosition} · Due {job.promisedDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-[#8A3B12] whitespace-nowrap">
                        {job.stage}
                      </span>
                      <span className="hidden sm:inline text-[11px] font-semibold text-[#4A4237] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap">
                        Update Status →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 2. Pending Deposits */}
        <section
          aria-labelledby="home-deposits-heading"
          className="glass-clear continuous-card p-6 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9A5B13]" />
                <h2
                  id="home-deposits-heading"
                  className="text-xl text-[#1B1712]"
                >
                  Pending Deposits
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                title="Go to Job Orders list"
                className="btn-scale text-xs font-semibold text-[#8A3B12] hover:underline inline-flex items-center gap-1"
              >
                Orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingDeposits.length === 0 ? (
              <p className="text-sm text-[#5C5446] py-6">
                All deposits verified.
              </p>
            ) : (
              <div className="divide-y divide-[#D9D2C3]/70">
                {pendingDeposits.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onOpenDownPayment(order.joNumber)}
                    title={`Open Down Payment verification for ${order.joNumber}`}
                    className="group w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-white/40 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-code text-xs text-[#5C5446] whitespace-nowrap shrink-0">
                          {order.joNumber}
                        </span>
                        <span className="text-sm font-semibold text-[#1B1712] truncate">
                          {order.customerName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold tabular-nums text-[#1B1712]">
                        {formatPesoWhole(order.quotation.depositRequired)}
                      </span>
                      <span className="hidden sm:inline text-[11px] font-semibold text-[#8A3B12] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap">
                        Verify →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. Balances Due */}
        <section
          aria-labelledby="home-balances-heading"
          className="glass-clear continuous-card p-6 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8A3B12]" />
                <h2
                  id="home-balances-heading"
                  className="text-xl text-[#1B1712]"
                >
                  Amount Due
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('payments')}
                title="Go to Payments & Balances ledger"
                className="btn-scale text-xs font-semibold text-[#8A3B12] hover:underline inline-flex items-center gap-1"
              >
                Ledger <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {balancesDue.length === 0 ? (
              <p className="text-sm text-[#5C5446] py-6">
                All active orders paid in full.
              </p>
            ) : (
              <div className="divide-y divide-[#D9D2C3]/70">
                {balancesDue.slice(0, 5).map(({ order, balance }) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => onOpenOrderBalance(order.joNumber)}
                    title={`Record payment for ${order.joNumber}`}
                    className="group w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-white/40 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-code text-xs text-[#5C5446] whitespace-nowrap shrink-0">
                          {order.joNumber}
                        </span>
                        <span className="text-sm font-semibold text-[#1B1712] truncate">
                          {order.customerName}
                        </span>
                      </div>
                      <div className="text-xs text-[#5C5446] mt-0.5 truncate">
                        {order.specs.piece}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold tabular-nums text-[#1B1712]">
                        {formatPesoWhole(balance)}
                      </span>
                      <span className="hidden sm:inline text-[11px] font-semibold text-[#8A3B12] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap">
                        Pay →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 4. Ready Deliveries */}
        <section
          aria-labelledby="home-deliveries-heading"
          className="glass-clear continuous-card p-6 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#1F6B43]" />
                <h2
                  id="home-deliveries-heading"
                  className="text-xl text-[#1B1712]"
                >
                  Deliveries Ready
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                title="Go to Job Orders list"
                className="btn-scale text-xs font-semibold text-[#8A3B12] hover:underline inline-flex items-center gap-1"
              >
                Orders <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {readyDeliveries.length === 0 ? (
              <p className="text-sm text-[#5C5446] py-6">
                No pieces waiting for handover.
              </p>
            ) : (
              <div className="divide-y divide-[#D9D2C3]/70">
                {readyDeliveries.map((order) => (
                  <div
                    key={order.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenOrder(order.joNumber)}
                      title={`Inspect ${order.joNumber} Order Detail`}
                      className="group min-w-0 w-full text-left hover:underline break-words"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-code text-xs text-[#5C5446] whitespace-nowrap shrink-0">
                          {order.joNumber}
                        </span>
                        <span className="text-sm font-semibold text-[#1B1712] break-words">
                          {order.specs.piece}
                        </span>
                      </div>
                      <div className="text-xs text-[#5C5446] mt-0.5 break-words">
                        {order.customerName} · {order.paymentChoiceAtReady ?? 'Settle at handover'}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenDelivery(order.joNumber)}
                      title={`Open Delivery & Handover for ${order.joNumber}`}
                      className="btn-scale self-start sm:self-auto h-9 px-3.5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      Handover →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity Feed (last 5 major actions) */}
      <RecentActivityFeed
        activities={activities}
        onOpenOrder={onOpenOrder}
      />

      {/* Summary of Reports: Costing & Materials */}
      <section
        aria-labelledby="costing-materials-report-heading"
        className="w-full glass-clear continuous-card overflow-hidden"
      >
        <div className="px-4 sm:px-6 py-4 border-b border-[#D9D2C3] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <BarChart3 className="w-4 h-4 text-[#8A3B12] shrink-0" />
            <h2
              id="costing-materials-report-heading"
              className="text-lg sm:text-xl text-[#1B1712] break-words"
            >
              Costing &amp; Materials Report Summary
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('materials')}
            title="Go to Materials & Requisitions to log or update POs"
            className="btn-scale text-xs font-semibold text-[#8A3B12] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
          >
            Manage POs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top 4 Costing Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9D2C3]/70 border-b border-[#D9D2C3]">
          <div className="p-5">
            <div className="text-xs font-semibold text-[#5C5446]">
              Total Receivables ({report.activeOrderCount} orders)
            </div>
            <div className="font-display text-2xl text-[#1B1712] tabular-nums mt-1">
              {formatPesoWhole(report.totalBilled)}
            </div>
            <div className="text-xs text-[#4A4237] tabular-nums mt-0.5">
              Quoted {formatPesoWhole(report.totalQuoted)}
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold text-[#5C5446]">
              Materials: Actual POs vs BOM
            </div>
            <div className="font-display text-2xl text-[#1B1712] tabular-nums mt-1">
              {formatPesoWhole(report.actualRequisitionSpend)}
            </div>
            <div
              className={`text-xs font-semibold tabular-nums mt-0.5 ${
                report.materialsVariance >= 0
                  ? 'text-[#1F6B43]'
                  : 'text-[#991B1B]'
              }`}
            >
              BOM {formatPesoWhole(report.estimatedBomMaterials)} ·{' '}
              {report.materialsVariance >= 0
                ? `${formatPesoWhole(report.materialsVariance)} under`
                : `${formatPesoWhole(Math.abs(report.materialsVariance))} over`}
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold text-[#5C5446]">
              Direct Labor Cost
            </div>
            <div className="font-display text-2xl text-[#1B1712] tabular-nums mt-1">
              {formatPesoWhole(report.estimatedLaborCost)}
            </div>
            <div className="text-xs text-[#4A4237] tabular-nums mt-0.5">
              {report.totalLaborHours} workshop hrs
            </div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold text-[#5C5446]">
              Shop Markup + Repairs
            </div>
            <div className="font-display text-2xl text-[#1B1712] tabular-nums mt-1">
              {formatPesoWhole(
                report.estimatedMarkup + report.totalRepairCharges,
              )}
            </div>
            <div className="text-xs text-[#4A4237] tabular-nums mt-0.5">
              Markup {formatPesoWhole(report.estimatedMarkup)} · Repairs{' '}
              {formatPesoWhole(report.totalRepairCharges)}
            </div>
          </div>
        </div>

        {/* Category Spend & PO Shipping Pipeline Strip */}
        <div className="px-6 py-3.5 border-b border-[#D9D2C3] flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-5 tabular-nums flex-wrap">
            <span className="font-semibold text-[#1B1712] inline-flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#8A3B12]" />
              Category Spend:
            </span>
            <span className="text-[#4A4237]">
              Lumber{' '}
              <strong className="text-[#1B1712]">
                {formatPesoWhole(report.categorySpend.Lumber)}
              </strong>
            </span>
            <span className="text-[#4A4237]">
              Hardware{' '}
              <strong className="text-[#1B1712]">
                {formatPesoWhole(report.categorySpend.Hardware)}
              </strong>
            </span>
            <span className="text-[#4A4237]">
              Finish{' '}
              <strong className="text-[#1B1712]">
                {formatPesoWhole(report.categorySpend.Finish)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4 tabular-nums text-[#4A4237]">
            <span>
              Ordered{' '}
              <strong className="text-[#9A5B13]">
                {report.shippingCounts.Ordered}
              </strong>
            </span>
            <span>
              In transit{' '}
              <strong className="text-[#8A3B12]">
                {report.shippingCounts['In transit']}
              </strong>
            </span>
            <span>
              Received{' '}
              <strong className="text-[#1F6B43]">
                {report.shippingCounts.Received}
              </strong>
            </span>
          </div>
        </div>

        {/* Per-Order Costing Breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D9D2C3] text-xs font-semibold text-[#5C5446]">
                <th className="py-3 px-6">Job Order</th>
                <th className="py-3 px-4">Piece</th>
                <th className="py-3 px-4 text-right">BOM Est.</th>
                <th className="py-3 px-4 text-right">Actual POs</th>
                <th className="py-3 px-4 text-right">Labor</th>
                <th className="py-3 px-4 text-right">Markup</th>
                <th className="py-3 px-6 text-right">Receivables</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D2C3]/70 text-sm">
              {report.orderRows.map((row) => (
                <tr
                  key={row.joNumber}
                  onClick={() => onOpenOrder(row.joNumber)}
                  title={`Open ${row.joNumber} Order Detail`}
                  className="group cursor-pointer hover:bg-white/45 transition-colors"
                >
                  <td className="py-3 px-6 font-code text-xs text-[#8A3B12] whitespace-nowrap">
                    {row.joNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#1B1712] truncate">
                        {row.piece}
                      </span>
                      <span className="text-[11px] font-semibold text-[#8A3B12] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Inspect →
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#4A4237]">
                    {row.serviceType === 'labor-only'
                      ? 'Client'
                      : formatPesoWhole(row.bomMaterials)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#1B1712] font-semibold">
                    {formatPesoWhole(row.actualRequisitions)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#4A4237]">
                    {formatPesoWhole(row.laborCost)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-[#4A4237]">
                    {formatPesoWhole(row.markupAmount)}
                  </td>
                  <td className="py-3 px-6 text-right tabular-nums font-semibold text-[#1B1712]">
                    {formatPesoWhole(row.totalBilled)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
