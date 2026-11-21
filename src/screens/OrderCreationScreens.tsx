import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { FormError } from '../components/FormError';
import { FurnitureIllustration } from '../components/FurnitureIllustration';
import { PredictiveBackButton } from '../components/UxOverlays';
import {
  calculateQuotation,
  formatDimensionsWithUnit,
  formatPeso,
  formatPhilippinePhone,
  isValidPhilippinePhone,
} from '../logic/workshopRules';
import type {
  Customer,
  CustomerType,
  FurnitureKind,
  Order,
  PaymentMethod,
  ServiceType,
} from '../types/saw2sale';

export interface IntakeDraft {
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  customerPhone: string;
  serviceType: ServiceType;
  piece: string;
  dimensions: string;
  woodSpecies: string;
  finishNotes: string;
  furnitureKind: FurnitureKind;
  promisedDate: string;
}

interface OrderIntakeScreenProps {
  customers: Customer[];
  initialDraft: IntakeDraft;
  onCancel: () => void;
  onNextEstimate: (draft: IntakeDraft) => void;
}

const CUSTOMER_TYPES: CustomerType[] = [
  'Residential',
  'Interior Designer',
  'Commercial',
  'Trade Contractor',
];

const FURNITURE_KINDS: Array<{ id: FurnitureKind; label: string }> = [
  { id: 'dining-table', label: 'Dining Table' },
  { id: 'cabinets', label: 'Cabinetry / Credenza' },
  { id: 'desk', label: 'Desk' },
  { id: 'bed-frame', label: 'Bed Frame' },
  { id: 'console', label: 'Console Table' },
  { id: 'lounge-chair', label: 'Lounge Chair' },
];

export const OrderIntakeScreen: React.FC<OrderIntakeScreenProps> = ({
  customers,
  initialDraft,
  onCancel,
  onNextEstimate,
}) => {
  const [draft, setDraft] = useState<IntakeDraft>(initialDraft);
  const [dimensionUnit, setDimensionUnit] = useState<'in' | 'cm' | 'ft'>('in');
  const [error, setError] = useState<string | null>(null);

  const handleCustomerPick = (custId: string) => {
    if (custId === 'new') {
      setDraft((prev) => ({
        ...prev,
        customerId: 'new',
        customerName: '',
        customerPhone: '+63 ',
      }));
      return;
    }
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setDraft((prev) => ({
        ...prev,
        customerId: found.id,
        customerName: found.name,
        customerType: found.type,
        customerPhone: formatPhilippinePhone(found.phone),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    const formattedPhone = formatPhilippinePhone(draft.customerPhone);
    if (!isValidPhilippinePhone(formattedPhone)) {
      setError(
        'Enter a valid Philippines contact number (+63 9XX XXX XXXX).',
      );
      return;
    }
    if (!draft.piece.trim() || !draft.dimensions.trim()) {
      setError('Piece title and measured dimensions are required.');
      return;
    }
    if (!draft.promisedDate) {
      setError('Select a promised delivery date.');
      return;
    }
    setError(null);
    onNextEstimate({
      ...draft,
      customerPhone: formattedPhone,
      dimensions: formatDimensionsWithUnit(draft.dimensions, dimensionUnit),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl" noValidate>
      <div className="flex items-center justify-between">
        <PredictiveBackButton label="Back to Orders" onBack={onCancel} />
        <div className="text-xs font-semibold text-[#5C5446]">
          Step 1 of 3 · Order Intake
        </div>
      </div>

      <div className="glass-clear continuous-card p-4 sm:p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl text-[#1B1712]">Client &amp; Service Setup</h2>
          <p className="text-sm text-[#4A4237]">
            Capture client classification and whether Saw2Sale supplies materials
            or performs labor only.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="intake-existing-customer"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Select Client
            </label>
            <select
              id="intake-existing-customer"
              value={draft.customerId}
              onChange={(e) => handleCustomerPick(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
            >
              <option value="new">+ New Client</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="intake-customer-type"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Customer Type
            </label>
            <select
              id="intake-customer-type"
              value={draft.customerType}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  customerType: e.target.value as CustomerType,
                })
              }
              className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
            >
              {CUSTOMER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="intake-customer-name"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Client Name
            </label>
            <input
              id="intake-customer-name"
              type="text"
              value={draft.customerName}
              onChange={(e) =>
                setDraft({ ...draft, customerName: e.target.value })
              }
              placeholder="e.g., Earl Aguirre"
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
            />
          </div>

          <div>
            <label
              htmlFor="intake-customer-phone"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Contact Number (+63)
            </label>
            <input
              id="intake-customer-phone"
              type="tel"
              inputMode="tel"
              value={draft.customerPhone}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  customerPhone: e.target.value
                    ? formatPhilippinePhone(e.target.value)
                    : '+63 ',
                })
              }
              placeholder="+63 917 889 2341"
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums"
            />
          </div>
        </div>

        {/* Service Type */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#4A4237]">
            Service Type
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDraft({ ...draft, serviceType: 'full-build' })}
              aria-pressed={draft.serviceType === 'full-build'}
              className={`p-4 rounded-xl border text-left transition-colors ${
                draft.serviceType === 'full-build'
                  ? 'bg-[#1B1712] text-white border-[#1B1712]'
                  : 'bg-white text-[#1B1712] border-[#D9D2C3]'
              }`}
            >
              <div className="text-sm font-semibold">Full-Build</div>
              <div
                className={`text-xs mt-1 ${
                  draft.serviceType === 'full-build'
                    ? 'text-white/75'
                    : 'text-[#5C5446]'
                }`}
              >
                Workshop sources lumber, hardware &amp; finishes via requisitions
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDraft({ ...draft, serviceType: 'labor-only' })}
              aria-pressed={draft.serviceType === 'labor-only'}
              className={`p-4 rounded-xl border text-left transition-colors ${
                draft.serviceType === 'labor-only'
                  ? 'bg-[#1B1712] text-white border-[#1B1712]'
                  : 'bg-white text-[#1B1712] border-[#D9D2C3]'
              }`}
            >
              <div className="text-sm font-semibold">Labor-Only</div>
              <div
                className={`text-xs mt-1 ${
                  draft.serviceType === 'labor-only'
                    ? 'text-white/75'
                    : 'text-[#5C5446]'
                }`}
              >
                Client supplies materials; quotation bills workshop labor + markup
              </div>
            </button>
          </div>
        </div>

        {/* Specs */}
        <div className="pt-2 border-t border-[#D9D2C3] space-y-4">
          <h3 className="text-lg font-display text-[#1B1712]">
            Piece Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="intake-piece"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Piece Name
              </label>
              <input
                id="intake-piece"
                type="text"
                value={draft.piece}
                onChange={(e) => setDraft({ ...draft, piece: e.target.value })}
                placeholder="e.g., 8-Seater Narra Dining Table"
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
              />
            </div>

            <div>
              <label
                htmlFor="intake-kind"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Furniture Profile
              </label>
              <select
                id="intake-kind"
                value={draft.furnitureKind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    furnitureKind: e.target.value as FurnitureKind,
                  })
                }
                className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
              >
                {FURNITURE_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="intake-dimensions"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Measured Dimensions (L × W × H)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="intake-dimensions"
                  type="text"
                  value={draft.dimensions}
                  onChange={(e) =>
                    setDraft({ ...draft, dimensions: e.target.value })
                  }
                  placeholder="84 × 40 × 30"
                  className="flex-1 h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums"
                />
                <select
                  aria-label="Dimension length unit"
                  value={dimensionUnit}
                  onChange={(e) =>
                    setDimensionUnit(e.target.value as 'in' | 'cm' | 'ft')
                  }
                  className="w-24 h-11 px-2.5 rounded-lg bg-white border border-[#D9D2C3] text-sm font-semibold text-[#1B1712]"
                >
                  <option value="in">inches (in)</option>
                  <option value="cm">cm</option>
                  <option value="ft">ft</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="intake-wood"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Wood Species / Material
              </label>
              <input
                id="intake-wood"
                type="text"
                value={draft.woodSpecies}
                onChange={(e) =>
                  setDraft({ ...draft, woodSpecies: e.target.value })
                }
                placeholder="Solid Narra"
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
              />
            </div>

            <div>
              <label
                htmlFor="intake-promised"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Promised Delivery Date
              </label>
              <input
                id="intake-promised"
                type="date"
                value={draft.promisedDate}
                onChange={(e) =>
                  setDraft({ ...draft, promisedDate: e.target.value })
                }
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="intake-finish"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Finish Notes
              </label>
              <input
                id="intake-finish"
                type="text"
                value={draft.finishNotes}
                onChange={(e) =>
                  setDraft({ ...draft, finishNotes: e.target.value })
                }
                placeholder="Hand-rubbed matte tung oil"
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
              />
            </div>
          </div>
        </div>

        <FormError message={error} />

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 px-5 rounded-xl border border-[#D9D2C3] bg-white/75 hover:bg-white text-sm font-semibold text-[#1B1712]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-12 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            Next: Estimate
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

interface EstimateScreenProps {
  draft: IntakeDraft;
  defaultHourlyRate: number;
  defaultMarkupRate: number;
  onBack: () => void;
  onAccept: (materialsCost: number, laborHours: number) => void;
  onDecline: (
    materialsCost: number,
    laborHours: number,
    reason: string,
  ) => void;
}

export const EstimateScreen: React.FC<EstimateScreenProps> = ({
  draft,
  defaultHourlyRate,
  defaultMarkupRate,
  onBack,
  onAccept,
  onDecline,
}) => {
  const [materialsCost, setMaterialsCost] = useState(
    draft.serviceType === 'labor-only' ? 0 : 10800,
  );
  const [laborHours, setLaborHours] = useState(40);
  const [showDeclineBox, setShowDeclineBox] = useState(false);
  const [declineReason, setDeclineReason] = useState(
    'Client requested budget revision.',
  );
  const [declinedOrderJo, setDeclinedOrderJo] = useState<string | null>(null);

  const quote = calculateQuotation({
    materialsCost,
    laborHours,
    laborRate: defaultHourlyRate,
    markupRate: defaultMarkupRate,
    depositPercentage: 0.5,
    serviceType: draft.serviceType,
  });

  if (declinedOrderJo) {
    return (
      <div className="glass-clear rounded-3xl p-8 max-w-2xl space-y-5">
        <div className="w-12 h-12 rounded-xl bg-[#991B1B]/10 text-[#991B1B] flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <div className="font-code text-xs text-[#5C5446]">
            {declinedOrderJo}
          </div>
          <h2 className="text-2xl text-[#1B1712]">
            Order closed as Declined
          </h2>
          <p className="text-sm text-[#4A4237]">
            {draft.piece} for {draft.customerName} was archived as Declined
            without entering the production queue. Reason: {declineReason}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="h-12 px-6 rounded-xl bg-[#1B1712] text-white text-sm font-semibold"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <PredictiveBackButton label="Edit Intake" onBack={onBack} />
        <div className="text-xs font-semibold text-[#5C5446]">
          Step 2 of 3 · Estimate &amp; Quotation
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cost Inputs */}
        <div className="lg:col-span-6 glass-clear continuous-card p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-4">
            <FurnitureIllustration kind={draft.furnitureKind} size="md" />
            <div>
              <h2 className="text-xl text-[#1B1712]">{draft.piece}</h2>
              <div className="text-sm text-[#4A4237]">{draft.customerName}</div>
              <div className="text-xs text-[#5C5446] mt-0.5">
                {draft.woodSpecies} · {draft.dimensions}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-[#D9D2C3]">
            <div>
              <label
                htmlFor="est-materials"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Direct Materials (BOM) ₱
              </label>
              <input
                id="est-materials"
                type="number"
                min={0}
                disabled={draft.serviceType === 'labor-only'}
                value={draft.serviceType === 'labor-only' ? 0 : materialsCost}
                onChange={(e) => setMaterialsCost(Number(e.target.value) || 0)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums disabled:bg-[#F5F2EA] disabled:text-[#5C5446]"
              />
              {draft.serviceType === 'labor-only' && (
                <p className="text-xs text-[#5C5446] mt-1">
                  Labor-Only service: client supplies lumber &amp; materials.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="est-hours"
                className="block text-xs font-semibold text-[#4A4237] mb-1.5"
              >
                Estimated Direct Labor (Hours at {formatPeso(defaultHourlyRate)}
                /hr)
              </label>
              <input
                id="est-hours"
                type="number"
                min={1}
                value={laborHours}
                onChange={(e) => setLaborHours(Number(e.target.value) || 0)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums"
              />
            </div>
          </div>

          {showDeclineBox && (
            <div className="pt-4 border-t border-[#D9D2C3] space-y-3">
              <label
                htmlFor="decline-reason"
                className="block text-xs font-semibold text-[#991B1B]"
              >
                Decline Reason
              </label>
              <input
                id="decline-reason"
                type="text"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDecline(materialsCost, laborHours, declineReason);
                    setDeclinedOrderJo('Archived');
                  }}
                  className="h-10 px-4 rounded-xl bg-[#991B1B] text-white text-xs font-semibold"
                >
                  Confirm Decline
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeclineBox(false)}
                  className="h-10 px-4 rounded-xl border border-[#D9D2C3] bg-white text-xs font-semibold text-[#1B1712]"
                >
                  Keep Editing
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quotation Breakdown Summary */}
        <div className="lg:col-span-6 glass-clear continuous-card p-4 sm:p-6 space-y-5">
          <h3 className="text-xl font-display text-[#1B1712]">
            Quotation Breakdown
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#4A4237]">Direct Materials (BOM)</span>
              <span className="font-semibold text-[#1B1712] tabular-nums">
                {formatPeso(quote.materialsCost)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4A4237]">
                Direct Labor ({quote.laborHours} hrs ×{' '}
                {formatPeso(quote.laborRate)})
              </span>
              <span className="font-semibold text-[#1B1712] tabular-nums">
                {formatPeso(quote.laborCost)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4A4237]">
                Shop Markup ({Math.round(quote.markupRate * 100)}%)
              </span>
              <span className="font-semibold text-[#1B1712] tabular-nums">
                {formatPeso(quote.markupAmount)}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D9D2C3] space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-[#1B1712]">
                Total Quoted Price
              </span>
              <span className="font-display text-2xl text-[#8A3B12] tabular-nums">
                {formatPeso(quote.totalQuotedPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#4A4237]">
              <span>50% Deposit Required</span>
              <span className="font-semibold text-[#1B1712] tabular-nums">
                {formatPeso(quote.depositRequired)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => onAccept(materialsCost, laborHours)}
              className="w-full h-[52px] rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              Accept Quote &amp; Collect Deposit
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeclineBox(true)}
              className="w-full h-11 rounded-xl border border-[#D9D2C3] bg-white/75 hover:bg-white text-xs font-semibold text-[#991B1B]"
            >
              Decline Quotation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DownPaymentScreenProps {
  order: Order;
  onBack: () => void;
  onSavePending: (params: {
    joNumber: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
  }) => void;
  onVerifyDeposit: (params: {
    joNumber: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
  }) => void;
  onOpenOrderDetail: (joNumber: string) => void;
}

export const DownPaymentScreen: React.FC<DownPaymentScreenProps> = ({
  order,
  onBack,
  onSavePending,
  onVerifyDeposit,
  onOpenOrderDetail,
}) => {
  const [amount, setAmount] = useState(order.quotation.depositRequired);
  const [method, setMethod] = useState<PaymentMethod>('GCash');
  const [reference, setReference] = useState('GC-908411');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [depositState, setDepositState] = useState<
    'editing' | 'pending' | 'verified'
  >(order.depositVerified ? 'verified' : order.status === 'Deposit Required' ? 'pending' : 'editing');

  const handlePending = () => {
    if (amount <= 0) {
      setError('Enter a deposit amount greater than zero.');
      return;
    }
    setError(null);
    onSavePending({
      joNumber: order.joNumber,
      amount,
      method,
      reference: reference.trim() || 'PENDING-REF',
    });
    setDepositState('pending');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < order.quotation.depositRequired) {
      setError(
        `Minimum 50% deposit is ${formatPeso(order.quotation.depositRequired)}.`,
      );
      return;
    }
    if (!reference.trim()) {
      setError('Payment reference number is required to verify deposit.');
      return;
    }
    if (otpCode.trim() && !/^\d{6}$/.test(otpCode.trim())) {
      setError('One-time verification code must be 6 digits.');
      return;
    }
    setError(null);
    onVerifyDeposit({
      joNumber: order.joNumber,
      amount,
      method,
      reference: reference.trim(),
    });
    setDepositState('verified');
  };

  if (depositState === 'verified') {
    return (
      <div className="glass-clear continuous-card p-8 max-w-2xl space-y-6">
        <div className="w-12 h-12 rounded-xl bg-[#1F6B43]/15 text-[#1F6B43] flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <div className="font-code text-sm font-semibold text-[#1F6B43]">
            {order.joNumber}
          </div>
          <h2 className="text-2xl text-[#1B1712]">
            50% Deposit Verified — Queued for Production
          </h2>
          <p className="text-sm text-[#4A4237]">
            {formatPeso(amount)} via {method} (Ref: {reference}) confirmed for{' '}
            {order.specs.piece}. The job order is now active in the workshop
            production queue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenOrderDetail(order.joNumber)}
            className="h-12 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            Open Order Detail
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-12 px-5 rounded-xl border border-[#D9D2C3] bg-white/75 text-sm font-semibold text-[#1B1712]"
          >
            All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <PredictiveBackButton label="Back" onBack={onBack} />
        <div className="text-xs font-semibold text-[#5C5446]">
          Step 3 of 3 · Down Payment (50% Rule)
        </div>
      </div>

      {depositState === 'pending' && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-[#9A5B13]/15 border border-[#9A5B13]/30 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#9A5B13] shrink-0" />
            <div>
              <div className="text-sm font-semibold text-[#1B1712]">
                Deposit required
              </div>
              <div className="text-xs text-[#4A4237]">
                Order {order.joNumber} is on hold until the 50% down payment of{' '}
                {formatPeso(order.quotation.depositRequired)} is verified.
              </div>
            </div>
          </div>
          <span className="font-code text-xs font-semibold text-[#9A5B13] shrink-0">
            Pending Verification
          </span>
        </div>
      )}

      <form
        onSubmit={handleVerify}
        className="glass-clear continuous-card p-6 space-y-6"
        noValidate
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#D9D2C3] pb-4">
          <div className="min-w-0 break-words">
            <div className="font-code text-xs text-[#5C5446]">
              {order.joNumber}
            </div>
            <h2 className="text-xl sm:text-2xl text-[#1B1712] break-words">{order.specs.piece}</h2>
            <div className="text-sm text-[#4A4237] break-words">
              {order.customerName} · Quoted{' '}
              {formatPeso(order.quotation.totalQuotedPrice)}
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <div className="text-xs text-[#5C5446]">50% Deposit Required</div>
            <div className="font-display text-2xl text-[#8A3B12] tabular-nums">
              {formatPeso(order.quotation.depositRequired)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="dp-amount"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Deposit Amount (₱)
            </label>
            <input
              id="dp-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="dp-method"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Payment Method
            </label>
            <select
              id="dp-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
            >
              <option value="GCash">GCash</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dp-ref"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              Reference / Official Receipt Number
            </label>
            <input
              id="dp-ref"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., GC-908411 or BDO-441022"
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
            />
          </div>

          <div>
            <label
              htmlFor="dp-otp"
              className="block text-xs font-semibold text-[#4A4237] mb-1.5"
            >
              One-Time Transfer Code (Optional SMS Autofill)
            </label>
            <input
              id="dp-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="6-digit OTP"
              className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712] tabular-nums tracking-widest"
            />
          </div>
        </div>

        <FormError message={error} />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handlePending}
            className="h-12 px-5 rounded-xl border border-[#D9D2C3] bg-white/80 hover:bg-white text-sm font-semibold text-[#1B1712]"
          >
            Save as Pending
          </button>
          <button
            type="submit"
            className="h-12 px-6 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            Verify Deposit &amp; Queue Job
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
