import React, { useState } from 'react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { FurnitureIllustration } from '../components/FurnitureIllustration';
import { OrderStatusText } from '../components/StatusText';
import { calculateOrderBalance, formatPeso } from '../logic/workshopRules';
import type {
  Order,
  OrderLifecycleStatus,
  PaymentRecord,
} from '../types/saw2sale';

interface OrdersListScreenProps {
  orders: Order[];
  payments: PaymentRecord[];
  onSelectOrder: (joNumber: string) => void;
  onNewOrder: () => void;
}

const FILTER_OPTIONS: Array<'All' | OrderLifecycleStatus> = [
  'All',
  'Deposit Required',
  'In Production',
  'Ready',
  'Completed',
  'Declined',
];

export const OrdersListScreen: React.FC<OrdersListScreenProps> = ({
  orders,
  payments,
  onSelectOrder,
  onNewOrder,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'All' | OrderLifecycleStatus
  >('All');

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.joNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.specs.piece.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Search + Filter Bar + Primary Action */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 w-full">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 text-[#5C5446] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search JO number, customer, or piece…"
              aria-label="Search orders"
              className="w-full h-11 pl-10 pr-4 rounded-xl glass-frosted text-sm text-[#1B1712] placeholder:text-[#5C5446] focus:outline-none focus:border-[#8A3B12]"
            />
          </div>

          <div
            role="group"
            aria-label="Filter orders by status"
            className="flex items-center gap-2 flex-wrap"
          >
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStatusFilter(opt)}
                aria-pressed={statusFilter === opt}
                title={`Filter by ${opt}`}
                className={`btn-scale h-9 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                  statusFilter === opt
                    ? 'bg-[#8A3B12] text-white'
                    : 'glass-frosted text-[#4A4237] hover:text-[#1B1712]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onNewOrder}
          title="Start New Order Intake"
          className="btn-scale w-full sm:w-auto h-12 px-5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="w-full glass-clear rounded-3xl overflow-hidden lg:overflow-visible">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="font-display text-lg text-[#1B1712]">
              No matching job orders
            </div>
            <p className="text-sm text-[#5C5446]">
              Clear your search filter or create a new custom furniture order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto lg:overflow-visible">
            <table className="w-full min-w-[780px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D9D2C3] text-xs font-semibold text-[#5C5446]">
                  <th className="py-3.5 px-5">Job Order</th>
                  <th className="py-3.5 px-4">Client &amp; Service</th>
                  <th className="py-3.5 px-4">Target Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Quoted Total</th>
                  <th className="py-3.5 px-5 text-right">Amount Due</th>
                  <th className="py-3.5 pr-4 w-10">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D2C3]/70">
                {filtered.map((order) => {
                  const bal = calculateOrderBalance(order, payments);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order.joNumber)}
                      title={`Open ${order.joNumber} Order Detail`}
                      className="group cursor-pointer hover:bg-white/45 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="relative group/piece inline-block">
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order.joNumber)}
                            className="flex items-center gap-3 text-left"
                          >
                            <FurnitureIllustration
                              kind={order.specs.furnitureKind}
                              size="sm"
                            />
                            <div>
                              <div className="font-code text-xs text-[#5C5446]">
                                {order.joNumber}
                              </div>
                              <div className="text-sm font-semibold text-[#1B1712] group-hover/piece:text-[#8A3B12] transition-colors">
                                {order.specs.piece}
                              </div>
                              <div className="text-xs text-[#5C5446]">
                                {order.specs.woodSpecies}
                              </div>
                            </div>
                          </button>

                          {/* Hover / Focus Specs Popover with explicit measured dimensions */}
                          <div
                            role="tooltip"
                            className="pointer-events-none opacity-0 translate-y-1 group-hover/piece:opacity-100 group-hover/piece:translate-y-0 group-focus-within/piece:opacity-100 group-focus-within/piece:translate-y-0 transition-all duration-150 absolute left-12 top-full mt-1.5 z-30 w-64 glass-dark text-white rounded-2xl p-3 space-y-1 shadow-lg"
                          >
                            <div className="text-[11px] font-semibold text-white/70">
                              Measured Dimensions
                            </div>
                            <div className="text-sm font-semibold tabular-nums text-white">
                              {order.specs.dimensions}
                            </div>
                            <div className="text-[11px] text-white/75 pt-0.5">
                              Finish: {order.specs.finishNotes || 'Standard satin'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-semibold text-[#1B1712]">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-[#5C5446]">
                          {order.customerType} ·{' '}
                          {order.serviceType === 'full-build'
                            ? 'Full-Build'
                            : 'Labor-Only'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-[#4A4237] tabular-nums whitespace-nowrap">
                        {order.promisedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusText status={order.status} />
                        {order.stage && order.status === 'In Production' && (
                          <div className="text-xs text-[#5C5446] mt-0.5">
                            Stage: {order.stage}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-semibold text-[#1B1712] tabular-nums whitespace-nowrap">
                        {formatPeso(order.quotation.totalQuotedPrice)}
                      </td>
                      <td className="py-3.5 px-5 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            bal.remainingBalance > 0
                              ? 'text-[#8A3B12]'
                              : 'text-[#1F6B43]'
                          }
                        >
                          {formatPeso(bal.remainingBalance)}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(order.joNumber)}
                          aria-label={`Open ${order.joNumber} ${order.specs.piece}`}
                          className="w-9 h-9 rounded-lg hover:bg-white/70 inline-flex items-center justify-center text-[#4A4237]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
