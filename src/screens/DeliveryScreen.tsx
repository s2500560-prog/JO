import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import { FormError } from '../components/FormError';
import { FurnitureIllustration } from '../components/FurnitureIllustration';
import { PredictiveBackButton } from '../components/UxOverlays';
import { calculateOrderBalance, formatPeso } from '../logic/workshopRules';
import type { Order, PaymentMethod, PaymentRecord } from '../types/saw2sale';

interface DeliveryScreenProps {
  order: Order;
  payments: PaymentRecord[];
  onBack: () => void;
  onMarkDelivered: (joNumber: string) => void;
  onDamageNo: (joNumber: string) => void;
  onDamageYesRepairAndBill: (params: {
    joNumber: string;
    description: string;
    repairCost: number;
  }) => void;
  onCollectCod: (params: {
    joNumber: string;
    method: PaymentMethod;
    amount: number;
    reference: string;
  }) => void;
  onCompleteOrder: (joNumber: string) => void;
  onBackToOrders: () => void;
}

export const DeliveryScreen: React.FC<DeliveryScreenProps> = ({
  order,
  payments,
  onBack,
  onMarkDelivered,
  onDamageNo,
  onDamageYesRepairAndBill,
  onCollectCod,
  onCompleteOrder,
  onBackToOrders,
}) => {
  const balance = calculateOrderBalance(order, payments);

  const initialStep = ():
    | 'handover'
    | 'damage'
    | 'cod'
    | 'complete' => {
    if (order.status === 'Completed') return 'complete';
    if (order.damageCheck?.checked) {
      return balance.remainingBalance > 0 ? 'cod' : 'complete';
    }
    if (order.deliveredAt) return 'damage';
    return 'handover';
  };

  const [step, setStep] = useState<'handover' | 'damage' | 'cod' | 'complete'>(
    initialStep,
  );
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [repairDesc, setRepairDesc] = useState(
    'Corner edge dent touch-up & tung oil re-buff',
  );
  const [repairCost, setRepairCost] = useState(1200);
  const [codMethod, setCodMethod] = useState<PaymentMethod>('Cash');
  const [codAmount, setCodAmount] = useState(balance.remainingBalance);
  const [codRef, setCodRef] = useState('COD-2026-081');
  const [error, setError] = useState<string | null>(null);

  const handleConfirmDelivered = () => {
    if (balance.remainingBalance > 0 && order.paymentChoiceAtReady !== 'COD') {
      setError(
        'Confirm Paid in Full or switch settlement to COD before marking delivered.',
      );
      return;
    }
    setError(null);
    onMarkDelivered(order.joNumber);
    setStep('damage');
  };

  const handleDamageNo = () => {
    onDamageNo(order.joNumber);
    if (balance.remainingBalance > 0) {
      setCodAmount(balance.remainingBalance);
      setStep('cod');
    } else {
      onCompleteOrder(order.joNumber);
      setStep('complete');
    }
  };

  const handleRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairDesc.trim() || repairCost <= 0) {
      setError('Enter a repair description and positive repair fee.');
      return;
    }
    setError(null);
    onDamageYesRepairAndBill({
      joNumber: order.joNumber,
      description: repairDesc.trim(),
      repairCost,
    });
    setCodAmount(balance.remainingBalance + repairCost);
    setStep('cod');
  };

  const handleCodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codAmount < balance.remainingBalance) {
      setError(
        `Collect full remaining balance of ${formatPeso(balance.remainingBalance)}.`,
      );
      return;
    }
    if (!codRef.trim()) {
      setError('Enter a receipt or transfer reference number.');
      return;
    }
    setError(null);
    onCollectCod({
      joNumber: order.joNumber,
      method: codMethod,
      amount: codAmount,
      reference: codRef.trim(),
    });
    onCompleteOrder(order.joNumber);
    setStep('complete');
  };

  return (
    <div className="space-y-6 w-full">
      <div className="no-print flex items-center justify-between">
        <PredictiveBackButton label="Back to Order" onBack={onBack} />
        <div className="font-code text-xs text-[#5C5446]">
          Delivery &amp; Handover · {order.joNumber}
        </div>
      </div>

      {/* Step 17: Delivery & Handover */}
      {step === 'handover' && (
        <div className="glass-clear continuous-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <FurnitureIllustration
              kind={order.specs.furnitureKind}
              stage={order.stage}
              size="md"
            />
            <div>
              <h2 className="text-2xl text-[#1B1712]">
                Delivery &amp; Handover Verification
              </h2>
              <div className="text-sm text-[#4A4237]">
                {order.specs.piece} · {order.customerName}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9D2C3] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#5C5446]">Settlement Status</div>
              <div className="text-sm font-semibold text-[#1B1712] mt-0.5">
                {balance.remainingBalance === 0
                  ? 'Paid in Full — Cleared for Handover'
                  : `COD Authorized · ${formatPeso(balance.remainingBalance)} due at delivery`}
              </div>
            </div>
            <span className="font-display text-xl text-[#8A3B12] tabular-nums">
              {formatPeso(balance.remainingBalance)}
            </span>
          </div>

          <FormError message={error} />

          <button
            type="button"
            onClick={handleConfirmDelivered}
            className="h-12 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Mark Delivered &amp; Run Damage Check
          </button>
        </div>
      )}

      {/* Step 18: Damage Check */}
      {step === 'damage' && (
        <div className="glass-clear continuous-card p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl text-[#1B1712]">
              Handover Damage Inspection
            </h2>
            <p className="text-sm text-[#4A4237]">
              Inspect finishes, joinery, and edges with {order.customerName}{' '}
              before closing handover.
            </p>
          </div>

          {!showRepairForm ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleDamageNo}
                className="p-5 rounded-2xl bg-[#1F6B43] hover:bg-[#175233] text-white text-left space-y-1 transition-colors"
              >
                <div className="flex items-center gap-2 text-base font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  No Damage — Continue
                </div>
                <div className="text-xs text-white/80">
                  Piece arrived in workshop-ready condition.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowRepairForm(true)}
                className="p-5 rounded-2xl bg-white border border-[#D9D2C3] hover:border-[#991B1B] text-[#1B1712] text-left space-y-1 transition-colors"
              >
                <div className="flex items-center gap-2 text-base font-semibold text-[#991B1B]">
                  <ShieldAlert className="w-5 h-5" />
                  Yes — Repair and Bill
                </div>
                <div className="text-xs text-[#5C5446]">
                  Log damage notes and add a repair charge to amount due.
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRepairSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="repair-desc"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  Damage &amp; Repair Scope
                </label>
                <input
                  id="repair-desc"
                  type="text"
                  value={repairDesc}
                  onChange={(e) => setRepairDesc(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="repair-cost"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  Additional Repair Fee (₱)
                </label>
                <input
                  id="repair-cost"
                  type="number"
                  min={1}
                  value={repairCost}
                  onChange={(e) => setRepairCost(Number(e.target.value) || 0)}
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums"
                />
              </div>

              <FormError message={error} />

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-[#991B1B] text-white text-sm font-semibold"
                >
                  Bill Repair &amp; Proceed to Collection
                </button>
                <button
                  type="button"
                  onClick={() => setShowRepairForm(false)}
                  className="h-11 px-4 rounded-xl border border-[#D9D2C3] bg-white text-sm font-semibold"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Step 19: COD Collection */}
      {step === 'cod' && (
        <form
          onSubmit={handleCodSubmit}
          className="glass-clear continuous-card p-6 space-y-5"
          noValidate
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9D2C3] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl text-[#1B1712]">
                COD Balance Collection
              </h2>
              <p className="text-sm text-[#4A4237]">
                Record final payment upon handover to complete {order.joNumber}.
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-xs text-[#5C5446]">Amount Due</div>
              <div className="font-display text-2xl text-[#8A3B12] tabular-nums">
                {formatPeso(balance.remainingBalance)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="cod-method"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Method
              </label>
              <select
                id="cod-method"
                value={codMethod}
                onChange={(e) => setCodMethod(e.target.value as PaymentMethod)}
                className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Bank">Bank</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="cod-amount"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Amount Collected (₱)
              </label>
              <input
                id="cod-amount"
                type="number"
                min={1}
                value={codAmount}
                onChange={(e) => setCodAmount(Number(e.target.value) || 0)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm tabular-nums"
              />
            </div>
            <div>
              <label
                htmlFor="cod-ref"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Reference / OR Number
              </label>
              <input
                id="cod-ref"
                type="text"
                value={codRef}
                onChange={(e) => setCodRef(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm"
              />
            </div>
          </div>

          <FormError message={error} />

          <button
            type="submit"
            className="h-12 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold"
          >
            Record COD Payment &amp; Complete Order
          </button>
        </form>
      )}

      {/* Step 20: Order Complete & Printable Summary */}
      {step === 'complete' && (
        <div className="print-only-panel glass-clear continuous-card p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-[#D9D2C3] pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1F6B43]/15 text-[#1F6B43] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-code text-xs text-[#1F6B43]">
                  {order.joNumber} · Order Complete
                </div>
                <h2 className="text-2xl text-[#1B1712]">
                  Handover &amp; Settlement Receipt
                </h2>
              </div>
            </div>
            <div className="text-right text-xs text-[#5C5446] tabular-nums">
              <div>Saw2Sale Woodworks</div>
              <div>Completed {order.completedAt ?? '2026-11-18'}</div>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-[#5C5446]">Client</dt>
              <dd className="font-semibold text-[#1B1712]">
                {order.customerName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5C5446]">Piece</dt>
              <dd className="font-semibold text-[#1B1712]">
                {order.specs.piece}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5C5446]">Total Settled</dt>
              <dd className="font-semibold text-[#1F6B43] tabular-nums">
                {formatPeso(balance.totalBilled)}
              </dd>
            </div>
          </dl>

          <div className="no-print flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-12 px-5 rounded-xl bg-[#1B1712] hover:bg-[#332C24] text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Summary
            </button>
            <button
              type="button"
              onClick={onBackToOrders}
              className="h-12 px-5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold"
            >
              Back to Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
