import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { OrderStatusText } from '../components/StatusText';
import { formatPeso } from '../logic/workshopRules';
import type { Customer, Order } from '../types/saw2sale';

interface CustomersScreenProps {
  customers: Customer[];
  orders: Order[];
  onOpenOrder: (joNumber: string) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  orders,
  onOpenOrder,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustId);

  if (selectedCustomer) {
    const custOrders = orders.filter(
      (o) =>
        o.customerId === selectedCustomer.id ||
        o.customerName === selectedCustomer.name,
    );

    return (
      <div className="space-y-6 w-full">
        <button
          type="button"
          onClick={() => setSelectedCustId(null)}
          className="h-10 px-4 rounded-xl glass-frosted text-xs font-semibold text-[#1B1712] inline-flex items-center gap-2 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>

        <div className="w-full glass-clear rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#D9D2C3] pb-4">
            <div className="min-w-0 break-words">
              <div className="text-xs font-semibold text-[#8A3B12]">
                {selectedCustomer.type}
              </div>
              <h2 className="text-xl sm:text-2xl text-[#1B1712] mt-0.5 break-words">
                {selectedCustomer.name}
              </h2>
              <div className="text-sm text-[#4A4237] mt-1 break-words">
                {selectedCustomer.phone} · {selectedCustomer.email}
              </div>
              <div className="text-xs text-[#5C5446] mt-0.5 break-words">
                {selectedCustomer.address}
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-xs text-[#5C5446]">Total Orders</div>
              <div className="font-display text-2xl text-[#1B1712] tabular-nums">
                {custOrders.length}
              </div>
            </div>
          </div>

          {selectedCustomer.notes && (
            <p className="text-sm text-[#4A4237] break-words">{selectedCustomer.notes}</p>
          )}
        </div>

        <div className="w-full glass-clear rounded-3xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#D9D2C3]">
            <h3 className="text-lg font-display text-[#1B1712]">
              Order History
            </h3>
          </div>
          {custOrders.length === 0 ? (
            <div className="p-6 text-sm text-[#5C5446]">
              No job orders recorded for this client yet.
            </div>
          ) : (
            <div className="divide-y divide-[#D9D2C3]/70">
              {custOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onOpenOrder(order.joNumber)}
                  className="w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-white/45 transition-colors"
                >
                  <div className="min-w-0 break-words">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-code text-xs text-[#5C5446]">
                        {order.joNumber}
                      </span>
                      <span className="text-sm font-semibold text-[#1B1712] break-words">
                        {order.specs.piece}
                      </span>
                    </div>
                    <div className="text-xs text-[#5C5446] mt-0.5 tabular-nums">
                      Promised {order.promisedDate}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 w-full sm:w-auto">
                    <OrderStatusText status={order.status} />
                    <span className="text-sm font-semibold tabular-nums text-[#1B1712]">
                      {formatPeso(order.quotation.totalQuotedPrice)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 w-full">
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-[#5C5446] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search client name or type…"
          aria-label="Search customers"
          className="w-full h-11 pl-10 pr-4 rounded-xl glass-frosted text-sm text-[#1B1712] placeholder:text-[#5C5446]"
        />
      </div>

      <div className="w-full glass-clear rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D9D2C3] text-xs font-semibold text-[#5C5446]">
              <th className="py-3.5 px-6">Client</th>
              <th className="py-3.5 px-4">Customer Type</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4 text-right">Orders</th>
              <th className="py-3.5 px-6 text-right">Total Quoted</th>
              <th className="py-3.5 pr-4 w-10">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D2C3]/70 text-sm">
            {filtered.map((cust) => {
              const custOrders = orders.filter(
                (o) => o.customerId === cust.id || o.customerName === cust.name,
              );
              const totalQuoted = custOrders
                .filter((o) => o.status !== 'Declined')
                .reduce((s, o) => s + o.quotation.totalQuotedPrice, 0);

              return (
                <tr
                  key={cust.id}
                  className="hover:bg-white/45 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <button
                      type="button"
                      onClick={() => setSelectedCustId(cust.id)}
                      className="text-left font-semibold text-[#1B1712] hover:text-[#8A3B12]"
                    >
                      {cust.name}
                    </button>
                    <div className="text-xs text-[#5C5446]">{cust.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#4A4237]">{cust.type}</td>
                  <td className="py-3.5 px-4 text-[#4A4237] tabular-nums whitespace-nowrap">
                    {cust.phone}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold tabular-nums">
                    {custOrders.length}
                  </td>
                  <td className="py-3.5 px-6 text-right font-semibold tabular-nums">
                    {formatPeso(totalQuoted)}
                  </td>
                  <td className="py-3.5 pr-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCustId(cust.id)}
                      aria-label={`View ${cust.name}`}
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
      </div>
    </div>
  );
};
