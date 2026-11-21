import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Plus,
  Truck,
} from 'lucide-react';
import { FormError } from '../components/FormError';
import { PaymentStatusText } from '../components/StatusText';
import { PredictiveBackButton, SwipeableSheet } from '../components/UxOverlays';
import {
  calculateOrderBalance,
  calculatePortfolioTotals,
  canFinalizeOrder,
  formatPeso,
  formatPesoWhole,
} from '../logic/workshopRules';
import type {
  Order,
  PaymentMethod,
  PaymentRecord,
  PaymentType,
} from '../types/saw2sale';

interface PaymentsScreenProps {
  orders: Order[];
  payments: PaymentRecord[];
  selectedOrderJo: string | null;
  onSelectOrder: (joNumber: string | null) => void;
  onRecordPayment: (params: {
    joNumber: string;
    type: PaymentType;
    method: PaymentMethod;
    amount: number;
    reference: string;
  }) => void;
  onSetPaymentChoiceAtReady: (
    joNumber: string,
    choice: 'Pay now' | 'COD',
  ) => void;
  onFinalizeOrder: (joNumber: string) => void;
  onOpenDelivery: (joNumber: string) => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  orders,
  payments,
  selectedOrderJo,
  onSelectOrder,
  onRecordPayment,
  onSetPaymentChoiceAtReady,
  onFinalizeOrder,
  onOpenDelivery,
}) => {
  const [showRecordSheet, setShowRecordSheet] = useState(false);
  const [payType, setPayType] = useState<PaymentType>('Final Balance');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('GCash');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payRef, setPayRef] = useState('');
  const [payOtp, setPayOtp] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const selectedOrder = orders.find((o) => o.joNumber === selectedOrderJo);
  const totals = calculatePortfolioTotals(orders, payments);

  const openSheetFor = (order: Order, defaultAmt: number, defaultType: PaymentType) => {
    setPayType(defaultType);
    setPayMethod('GCash');
    setPayAmount(defaultAmt);
    setPayRef(`TXN-${Math.floor(100000 + Math.random() * 899999)}`);
    setPayOtp('');
    setPayError(null);
    setPaySuccess(null);
    setShowRecordSheet(true);
  };

  if (selectedOrder) {
    const bal = calculateOrderBalance(selectedOrder, payments);
    const orderPayments = payments.filter(
      (p) => p.joNumber === selectedOrder.joNumber,
    );
    const readyToFinalize = canFinalizeOrder(bal.remainingBalance, selectedOrder);

    const handleRecordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (payAmount <= 0) {
        setPayError('Payment amount must be greater than zero.');
        return;
      }
      if (!payRef.trim()) {
        setPayError('Enter a payment reference or receipt number.');
        return;
      }
      if (payOtp.trim() && !/^\d{6}$/.test(payOtp.trim())) {
        setPayError('One-time verification code must be 6 digits.');
        return;
      }
      setPayError(null);
      onRecordPayment({
        joNumber: selectedOrder.joNumber,
        type: payType,
        method: payMethod,
        amount: payAmount,
        reference: payRef.trim(),
      });
      setShowRecordSheet(false);
      setPaySuccess(`Recorded ${formatPeso(payAmount)} via ${payMethod}.`);
    };

    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <PredictiveBackButton
            label="Back to Payments"
            onBack={() => {
              setShowRecordSheet(false);
              setPaySuccess(null);
              onSelectOrder(null);
            }}
          />
          <span className="font-code text-xs text-[#5C5446]">
            {selectedOrder.joNumber}
          </span>
        </div>

        {paySuccess && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-[#1F6B43]/15 border border-[#1F6B43]/30 text-sm font-semibold text-[#1F6B43] flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{paySuccess}</span>
          </div>
        )}

        {/* Order Balance Summary Card */}
        <div className="w-full glass-dark continuous-card p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="min-w-0 space-y-1 break-words">
            <div className="text-xs text-white/70 break-words">
              Outstanding Balance · {selectedOrder.specs.piece} · {selectedOrder.customerName}
            </div>
            <div className="font-display text-3xl sm:text-4xl tabular-nums">
              {formatPeso(bal.remainingBalance)}
            </div>
            <div className="text-xs text-white/75 tabular-nums break-words">
              Receivables {formatPeso(bal.totalBilled)}
              {selectedOrder.repairCharges > 0
                ? ` (includes ${formatPeso(selectedOrder.repairCharges)} repair)`
                : ''}{' '}
              · Collected {formatPeso(bal.totalVerifiedPaid)}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto shrink-0">
            {bal.remainingBalance > 0 && (
              <button
                type="button"
                onClick={() =>
                  openSheetFor(
                    selectedOrder,
                    bal.remainingBalance,
                    selectedOrder.status === 'Ready'
                      ? 'Final Balance'
                      : 'Progress Payment',
                  )
                }
                className="btn-scale flex-1 sm:flex-none h-11 sm:h-12 px-5 rounded-xl bg-white text-[#1B1712] hover:bg-[#F5F2EA] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Record Payment
              </button>
            )}

            {readyToFinalize && (
              <button
                type="button"
                onClick={() => onFinalizeOrder(selectedOrder.joNumber)}
                title="Proceed to Delivery & Handover"
                className="btn-scale flex-1 sm:flex-none h-11 sm:h-12 px-5 rounded-xl bg-[#1F6B43] hover:bg-[#175233] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalize Order
              </button>
            )}
          </div>
        </div>

        {/* Ready-stage Pay Now or COD selector */}
        {selectedOrder.status === 'Ready' && bal.remainingBalance > 0 && (
          <div className="w-full glass-clear continuous-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 break-words">
              <h3 className="text-lg font-display text-[#1B1712]">
                Ready Stage Settlement Choice
              </h3>
              <p className="text-sm text-[#4A4237] break-words">
                Choose whether the client pays the remaining{' '}
                {formatPeso(bal.remainingBalance)} now or upon delivery (COD).
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  onSetPaymentChoiceAtReady(selectedOrder.joNumber, 'Pay now');
                  openSheetFor(
                    selectedOrder,
                    bal.remainingBalance,
                    'Final Balance',
                  );
                }}
                aria-pressed={selectedOrder.paymentChoiceAtReady === 'Pay now'}
                className={`h-11 px-4 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedOrder.paymentChoiceAtReady === 'Pay now'
                    ? 'bg-[#8A3B12] text-white border-[#8A3B12]'
                    : 'bg-white text-[#1B1712] border-[#D9D2C3]'
                }`}
              >
                Pay now
              </button>
              <button
                type="button"
                onClick={() =>
                  onSetPaymentChoiceAtReady(selectedOrder.joNumber, 'COD')
                }
                aria-pressed={selectedOrder.paymentChoiceAtReady === 'COD'}
                className={`h-11 px-4 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedOrder.paymentChoiceAtReady === 'COD'
                    ? 'bg-[#1B1712] text-white border-[#1B1712]'
                    : 'bg-white text-[#1B1712] border-[#D9D2C3]'
                }`}
              >
                COD
              </button>
              <button
                type="button"
                onClick={() => onOpenDelivery(selectedOrder.joNumber)}
                className="h-11 px-4 rounded-xl bg-[#8A3B12] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                Go to Delivery
              </button>
            </div>
          </div>
        )}

        {/* Interruptible Swipe-to-Dismiss Record Payment Sheet */}
        <SwipeableSheet
          open={showRecordSheet}
          title="Record Payment"
          subtitle={`${selectedOrder.joNumber} · ${selectedOrder.customerName}`}
          onClose={() => setShowRecordSheet(false)}
        >
          <form onSubmit={handleRecordSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="pay-type"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  Payment Type
                </label>
                <select
                  id="pay-type"
                  value={payType}
                  onChange={(e) => setPayType(e.target.value as PaymentType)}
                  className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm"
                >
                  <option value="50% Downpayment">50% Downpayment</option>
                  <option value="Progress Payment">Progress Payment</option>
                  <option value="Final Balance">Final Balance</option>
                  <option value="COD Collection">COD Collection</option>
                  <option value="Repair Fee">Repair Fee</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="pay-method"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  Method
                </label>
                <select
                  id="pay-method"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm"
                >
                  <option value="GCash">GCash</option>
                  <option value="Bank">Bank</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="pay-amount"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  Amount (₱)
                </label>
                <input
                  id="pay-amount"
                  type="number"
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="pay-ref"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  Reference Number
                </label>
                <input
                  id="pay-ref"
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="pay-otp"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  One-Time Verification Code (Optional SMS Autofill)
                </label>
                <input
                  id="pay-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={payOtp}
                  onChange={(e) =>
                    setPayOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="6-digit OTP"
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums tracking-widest"
                />
              </div>
            </div>

            <FormError message={payError} />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRecordSheet(false)}
                className="h-11 px-5 rounded-xl border border-[#D9D2C3] bg-white text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold"
              >
                Save Payment
              </button>
            </div>
          </form>
        </SwipeableSheet>

        {/* Ledger */}
        <div className="glass-clear continuous-card p-6 space-y-4">
          <h3 className="text-xl font-display text-[#1B1712]">
            Transaction History
          </h3>
          {orderPayments.length === 0 ? (
            <p className="text-sm text-[#5C5446]">No payments recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#D9D2C3]/70">
              {orderPayments.map((p) => (
                <div
                  key={p.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#1B1712]">
                      {p.type}
                    </div>
                    <div className="text-xs text-[#5C5446] tabular-nums">
                      {p.method} · {p.reference} · {p.recordedAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <PaymentStatusText status={p.status} />
                    <span className="text-sm font-semibold tabular-nums text-[#1B1712]">
                      {formatPeso(p.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Payments & Balance Overview List
  const activeOrders = orders.filter(
    (o) => o.status !== 'Declined' && o.status !== 'Draft',
  );

  return (
    <div className="space-y-6 w-full">
      {/* Dark Summary Card */}
      <div className="w-full glass-dark continuous-card p-5 sm:p-6 text-white flex items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0 space-y-1 break-words">
          <div className="text-xs text-white/70">Outstanding Balance</div>
          <div className="font-display text-3xl sm:text-4xl tabular-nums text-white">
            {formatPesoWhole(totals.totalRemaining)}
          </div>
          <div className="flex items-center gap-x-4 gap-y-1 text-xs text-white/75 pt-1 tabular-nums flex-wrap">
            <span>Receivables {formatPesoWhole(totals.totalReceivables)}</span>
            <span aria-hidden="true">·</span>
            <span>Collected {formatPesoWhole(totals.totalCollected)}</span>
          </div>
        </div>
        <CreditCard className="w-8 h-8 text-white/40 shrink-0 hidden sm:block" />
      </div>

      {/* Order Balances Table */}
      <div className="w-full glass-clear continuous-card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#D9D2C3]">
          <h2 className="text-xl text-[#1B1712]">Order Balances</h2>
        </div>
        <div className="divide-y divide-[#D9D2C3]/70">
          {activeOrders.map((order) => {
            const bal = calculateOrderBalance(order, payments);
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order.joNumber)}
                title={`Record payment or settle ${order.joNumber}`}
                className="group w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-left hover:bg-white/45 transition-colors"
              >
                <div className="w-full min-w-0 break-words">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-code text-xs text-[#5C5446]">
                      {order.joNumber}
                    </span>
                    <span className="text-sm font-semibold text-[#1B1712] break-words">
                      {order.customerName}
                    </span>
                  </div>
                  <div className="text-xs text-[#5C5446] mt-0.5 break-words">
                    {order.specs.piece} · {order.status}
                  </div>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 sm:text-right tabular-nums">
                  <span className="hidden sm:inline text-[11px] font-semibold text-[#8A3B12] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap">
                    Open ledger →
                  </span>
                  <div>
                    <div className="text-xs text-[#5C5446]">Collected</div>
                    <div className="text-sm font-semibold text-[#1B1712]">
                      {formatPeso(bal.totalVerifiedPaid)}
                    </div>
                  </div>
                  <div className="sm:w-28 text-right">
                    <div className="text-xs text-[#5C5446]">Amount Due</div>
                    <div
                      className={`text-sm font-semibold ${
                        bal.remainingBalance > 0
                          ? 'text-[#8A3B12]'
                          : 'text-[#1F6B43]'
                      }`}
                    >
                      {formatPeso(bal.remainingBalance)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
