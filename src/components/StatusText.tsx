import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Hammer,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import type { OrderLifecycleStatus, PaymentStatus, ShippingStatus } from '../types/saw2sale';

export const OrderStatusText: React.FC<{ status: OrderLifecycleStatus }> = ({
  status,
}) => {
  switch (status) {
    case 'Deposit Required':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A5B13] whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Deposit Required
        </span>
      );
    case 'In Production':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B1712] whitespace-nowrap">
          <Hammer className="w-3.5 h-3.5 shrink-0 text-[#8A3B12]" />
          In Production
        </span>
      );
    case 'Ready':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6B43] whitespace-nowrap">
          <PackageCheck className="w-3.5 h-3.5 shrink-0" />
          Ready for Handover
        </span>
      );
    case 'Delivered':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6B43] whitespace-nowrap">
          <Truck className="w-3.5 h-3.5 shrink-0" />
          Delivered
        </span>
      );
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6B43] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Completed
        </span>
      );
    case 'Declined':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#991B1B] whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          Declined
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C5446] whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {status}
        </span>
      );
  }
};

export const ShippingStatusText: React.FC<{ status: ShippingStatus }> = ({
  status,
}) => {
  if (status === 'Received') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6B43] whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Received
      </span>
    );
  }
  if (status === 'In transit') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A3B12] whitespace-nowrap">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        In transit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C5446] whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      Ordered
    </span>
  );
};

export const PaymentStatusText: React.FC<{ status: PaymentStatus }> = ({
  status,
}) => {
  if (status === 'Verified') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F6B43] whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A5B13] whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      Pending
    </span>
  );
};
