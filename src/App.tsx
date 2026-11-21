import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { StateShell } from './components/StateShell';
import {
  CommandMenu,
  UndoToastBar,
  type CommandItem,
  type UndoToastState,
} from './components/UxOverlays';
import {
  SEED_ACTIVITIES,
  SEED_CUSTOMERS,
  SEED_ORDERS,
  SEED_PAYMENTS,
  SEED_PHOTOS,
  SEED_REQUISITIONS,
  SEED_SETTINGS,
} from './data/seedData';
import {
  IdempotencyGuard,
  appendActivityEntry,
  calculateQuotation,
  createIdempotencyKey,
  formatPhilippinePhone,
  generateNextJoNumber,
  generateNextReqNumber,
} from './logic/workshopRules';
import { AuthScreen } from './screens/AuthScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { DeliveryScreen } from './screens/DeliveryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MaterialsScreen } from './screens/MaterialsScreen';
import {
  DownPaymentScreen,
  EstimateScreen,
  OrderIntakeScreen,
  type IntakeDraft,
} from './screens/OrderCreationScreens';
import {
  OrderDetailScreen,
  type OrderDetailTab,
} from './screens/OrderDetailScreen';
import { OrdersListScreen } from './screens/OrdersListScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import { ProductionScreen } from './screens/ProductionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import type {
  ActivityCategory,
  ActivityEntry,
  Customer,
  MaterialRequisition,
  MilestoneNote,
  MilestonePhoto,
  NavSection,
  Order,
  PaymentMethod,
  PaymentRecord,
  PaymentType,
  ProductionStage,
  RequisitionLineItem,
  ScreenStateMode,
  ShippingStatus,
  WorkshopSettings,
} from './types/saw2sale';
import {
  prefetchRouteData,
  runWithViewTransition,
  useWorkshopSWR,
} from './utils/uxPrimitives';

type SubScreen =
  | { type: 'none' }
  | { type: 'intake'; draft: IntakeDraft }
  | { type: 'estimate'; draft: IntakeDraft }
  | { type: 'downpayment'; joNumber: string }
  | { type: 'order-detail'; joNumber: string; tab: OrderDetailTab }
  | { type: 'delivery'; joNumber: string };

const EMPTY_INTAKE_DRAFT = (customers: Customer[]): IntakeDraft => ({
  customerId: customers[0]?.id ?? 'new',
  customerName: customers[0]?.name ?? '',
  customerType: customers[0]?.type ?? 'Residential',
  customerPhone: formatPhilippinePhone(customers[0]?.phone ?? '+63 917 889 2341'),
  serviceType: 'full-build',
  piece: '',
  dimensions: '',
  woodSpecies: 'Solid Narra',
  finishNotes: 'Hand-rubbed matte tung oil',
  furnitureKind: 'dining-table',
  promisedDate: '2026-12-10',
});

export function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [stateMode, setStateMode] = useState<ScreenStateMode>('live');
  const [subScreen, setSubScreen] = useState<SubScreen>({ type: 'none' });
  const [theme, setTheme] = useWorkshopSWR<'light' | 'dark'>('theme', 'light');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Preview override via ?autostart=1 for automated inspection
  const [previewBypass, setPreviewBypass] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  });

  // Hardcoded local login state (Manager access by default)
  const [isLoggedIn, setIsLoggedIn] = useWorkshopSWR<boolean>(
    'isLoggedIn',
    false,
  );
  const [loggedInUser, setLoggedInUser] = useWorkshopSWR<string>(
    'loggedInUser',
    'manager',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Section-specific selection pointers
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [creatingReqForJo, setCreatingReqForJo] = useState<string | null>(null);
  const [selectedProdJo, setSelectedProdJo] = useState<string | null>(null);
  const [selectedPayJo, setSelectedPayJo] = useState<string | null>(null);

  // Domain Data State with Stale-While-Revalidate persistence
  const [settings, setSettings] = useWorkshopSWR<WorkshopSettings>(
    'settings',
    SEED_SETTINGS,
  );
  const [customers, setCustomers] = useWorkshopSWR<Customer[]>(
    'customers_v2',
    SEED_CUSTOMERS,
  );
  const [orders, setOrders] = useWorkshopSWR<Order[]>('orders_v2', SEED_ORDERS);
  const [payments, setPayments] = useWorkshopSWR<PaymentRecord[]>(
    'payments_v2',
    SEED_PAYMENTS,
  );
  const [requisitions, setRequisitions] = useWorkshopSWR<MaterialRequisition[]>(
    'requisitions',
    SEED_REQUISITIONS,
  );
  const [photos, setPhotos] = useWorkshopSWR<MilestonePhoto[]>(
    'photos',
    SEED_PHOTOS,
  );
  const [activities, setActivities] = useWorkshopSWR<ActivityEntry[]>(
    'activities_v2',
    SEED_ACTIVITIES,
  );

  const recordActivity = useCallback(
    (
      action: string,
      detail: string,
      category: ActivityCategory,
      joNumber?: string,
    ) => {
      setActivities((prev) =>
        appendActivityEntry(prev, { action, detail, category, joNumber }),
      );
    },
    [setActivities],
  );

  const handleLogin = (username: string) => {
    setLoggedInUser(username.trim() || 'manager');
    setIsLoggedIn(true);
    setPreviewBypass(false);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setPreviewBypass(false);
  };

  // Command menu, undo toast & idempotency guard
  const [commandOpen, setCommandOpen] = useState(false);
  const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const idempotencyRef = useRef(new IdempotencyGuard());

  const showUndoToast = useCallback((message: string, onUndo: () => void) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    const id = `toast-${Date.now()}`;
    setUndoToast({ id, message, onUndo });
    toastTimerRef.current = window.setTimeout(() => {
      setUndoToast((cur) => (cur?.id === id ? null : cur));
    }, 6500);
  }, []);

  // Reset stateMode back to live when changing main section
  useEffect(() => {
    setStateMode('live');
  }, [activeNav, subScreen.type]);

  const navigateSection = useCallback((section: NavSection) => {
    prefetchRouteData(`nav:${section}`);
    runWithViewTransition(() => {
      setActiveNav(section);
      setSubScreen({ type: 'none' });
      setSelectedReqId(null);
      setCreatingReqForJo(null);
      setSelectedProdJo(null);
      setSelectedPayJo(null);
    });
  }, []);

  const openNewOrderIntake = useCallback(() => {
    runWithViewTransition(() => {
      setActiveNav('orders');
      setSubScreen({ type: 'intake', draft: EMPTY_INTAKE_DRAFT(customers) });
    });
  }, [customers]);

  const openOrderDetail = useCallback(
    (joNumber: string, tab: OrderDetailTab = 'Overview') => {
      prefetchRouteData(`order:${joNumber}:${tab}`);
      runWithViewTransition(() => {
        setActiveNav('orders');
        setSubScreen({ type: 'order-detail', joNumber, tab });
      });
    },
    [],
  );

  // Global keyboard shortcuts: Cmd/Ctrl+K for command menu, 1-7 for sections, Esc for predictive back
  useEffect(() => {
    const NAV_ORDER: NavSection[] = [
      'home',
      'orders',
      'production',
      'materials',
      'payments',
      'customers',
      'settings',
    ];
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
        return;
      }

      const tag = (e.target as HTMLElement | null)?.tagName;
      const isEditing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement | null)?.isContentEditable;

      if (isEditing || commandOpen) return;

      if (e.key >= '1' && e.key <= '7' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = NAV_ORDER[Number(e.key) - 1];
        if (target) {
          e.preventDefault();
          navigateSection(target);
        }
        return;
      }

      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) {
        if (subScreen.type !== 'none') {
          e.preventDefault();
          runWithViewTransition(() => setSubScreen({ type: 'none' }));
        } else if (creatingReqForJo !== null) {
          e.preventDefault();
          setCreatingReqForJo(null);
        } else if (selectedReqId) {
          e.preventDefault();
          setSelectedReqId(null);
        } else if (selectedProdJo) {
          e.preventDefault();
          setSelectedProdJo(null);
        } else if (selectedPayJo) {
          e.preventDefault();
          setSelectedPayJo(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    commandOpen,
    creatingReqForJo,
    navigateSection,
    selectedPayJo,
    selectedProdJo,
    selectedReqId,
    subScreen.type,
  ]);

  const createOrderFromEstimate = (
    draft: IntakeDraft,
    materialsCost: number,
    laborHours: number,
    status: 'Deposit Required' | 'Declined',
    declinedReason?: string,
  ): Order => {
    const joNumber = generateNextJoNumber(orders);
    const formattedPhone = formatPhilippinePhone(
      draft.customerPhone.trim() || '+63 917 000 0000',
    );
    let customerId = draft.customerId;
    if (customerId === 'new') {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: draft.customerName.trim(),
        type: draft.customerType,
        phone: formattedPhone,
        email: `${draft.customerName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '.')}@client.ph`,
        address: 'Bacolod City',
      };
      setCustomers((prev) => [newCust, ...prev]);
      customerId = newCust.id;
    }

    const quotation = calculateQuotation({
      materialsCost,
      laborHours,
      laborRate: settings.defaultHourlyRate,
      markupRate: settings.defaultMarkupRate,
      depositPercentage: settings.depositPercentage,
      serviceType: draft.serviceType,
    });

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      joNumber,
      customerId,
      customerName: draft.customerName.trim(),
      customerType: draft.customerType,
      customerPhone: formattedPhone,
      serviceType: draft.serviceType,
      specs: {
        piece: draft.piece.trim(),
        dimensions: draft.dimensions.trim(),
        woodSpecies: draft.woodSpecies.trim() || 'Solid Hardwood',
        finishNotes: draft.finishNotes.trim(),
        furnitureKind: draft.furnitureKind,
      },
      promisedDate: draft.promisedDate,
      createdAt: '2026-11-18',
      queuePosition: null,
      status,
      stage: null,
      quotation,
      depositVerified: false,
      paymentChoiceAtReady: null,
      repairCharges: 0,
      damageCheck: null,
      deliveredAt: null,
      completedAt: null,
      declinedReason,
      notes: [],
    };

    setOrders((prev) => [newOrder, ...prev]);
    recordActivity(
      status === 'Declined' ? 'Order declined' : 'New order created',
      `${joNumber} · ${draft.customerName.trim()} (${draft.piece.trim()})`,
      'order',
      joNumber,
    );
    return newOrder;
  };

  const handleSaveDepositPending = (params: {
    joNumber: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
  }) => {
    const key = createIdempotencyKey(
      'deposit-pending',
      params.joNumber,
      `${params.amount}-${params.reference}`,
    );
    if (!idempotencyRef.current.claim(key)) return;
    const ord = orders.find((o) => o.joNumber === params.joNumber);
    if (!ord) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.joNumber === params.joNumber
          ? { ...o, status: 'Deposit Required', depositVerified: false }
          : o,
      ),
    );
    const pendingPay: PaymentRecord = {
      id: `pay-${Date.now()}`,
      joNumber: params.joNumber,
      customerName: ord.customerName,
      type: '50% Downpayment',
      method: params.method,
      amount: params.amount,
      reference: params.reference,
      status: 'Pending',
      recordedAt: '2026-11-18',
    };
    setPayments((prev) => [
      ...prev.filter(
        (p) => !(p.joNumber === params.joNumber && p.status === 'Pending'),
      ),
      pendingPay,
    ]);
    recordActivity(
      'Deposit saved pending',
      `${params.joNumber} · ₱${params.amount.toLocaleString('en-PH')} (${params.method})`,
      'payment',
      params.joNumber,
    );
  };

  const handleVerifyDeposit = (params: {
    joNumber: string;
    amount: number;
    method: PaymentMethod;
    reference: string;
  }) => {
    const key = createIdempotencyKey(
      'verify-deposit',
      params.joNumber,
      `${params.amount}-${params.reference}`,
    );
    if (!idempotencyRef.current.claim(key)) return;

    const ord = orders.find((o) => o.joNumber === params.joNumber);
    if (!ord) return;
    const prevOrders = orders;
    const prevPayments = payments;
    const maxQueue = orders.reduce(
      (m, o) => (o.queuePosition && o.queuePosition > m ? o.queuePosition : m),
      0,
    );
    const nextStage = ord.stage ?? 'Cutting';
    const nextQueuePos = ord.queuePosition ?? maxQueue + 1;

    setOrders((prev) =>
      prev.map((o) =>
        o.joNumber === params.joNumber
          ? {
              ...o,
              depositVerified: true,
              status: 'In Production',
              stage: nextStage,
              queuePosition: nextQueuePos,
            }
          : o,
      ),
    );

    const verifiedPay: PaymentRecord = {
      id: `pay-${Date.now()}`,
      joNumber: params.joNumber,
      customerName: ord.customerName,
      type: '50% Downpayment',
      method: params.method,
      amount: params.amount,
      reference: params.reference,
      status: 'Verified',
      recordedAt: '2026-11-18',
    };

    setPayments((prev) => {
      const filtered = prev.filter(
        (p) => !(p.joNumber === params.joNumber && p.status === 'Pending'),
      );
      return [...filtered, verifiedPay];
    });

    recordActivity(
      'Deposit verified',
      `${params.joNumber} · ₱${params.amount.toLocaleString('en-PH')} cleared for ${ord.customerName}`,
      'payment',
      params.joNumber,
    );

    showUndoToast(`Verified deposit for ${params.joNumber} & queued job`, () => {
      idempotencyRef.current.release(key);
      setOrders(prevOrders);
      setPayments(prevPayments);
    });
  };

  const handleCreateRequisition = (params: {
    joNumber: string;
    supplier: string;
    expectedDate: string;
    lineItems: Omit<RequisitionLineItem, 'id'>[];
  }) => {
    const key = createIdempotencyKey(
      'create-req',
      params.joNumber,
      `${params.supplier}-${params.lineItems.length}`,
    );
    if (!idempotencyRef.current.claim(key)) return;

    const prevReqs = requisitions;
    const reqNumber = generateNextReqNumber(requisitions);
    const newReq: MaterialRequisition = {
      id: `req-${Date.now()}`,
      reqNumber,
      joNumber: params.joNumber,
      itemTitle:
        params.lineItems[0]?.description || `Materials for ${params.joNumber}`,
      supplier: params.supplier,
      shippingStatus: 'Ordered',
      createdAt: '2026-11-18',
      expectedDate: params.expectedDate,
      lineItems: params.lineItems.map((li, i) => ({
        ...li,
        id: `li-${Date.now()}-${i}`,
      })),
    };
    setRequisitions((prev) => [newReq, ...prev]);
    setCreatingReqForJo(null);
    setSelectedReqId(newReq.id);
    recordActivity(
      'Requisition created',
      `${reqNumber} for ${params.joNumber} · ${params.supplier}`,
      'material',
      params.joNumber,
    );

    showUndoToast(`Created requisition ${reqNumber}`, () => {
      idempotencyRef.current.release(key);
      setRequisitions(prevReqs);
      setSelectedReqId(null);
    });
  };

  const handleUpdateShippingStatus = (
    reqId: string,
    status: ShippingStatus,
  ) => {
    const prevReqs = requisitions;
    const target = requisitions.find((r) => r.id === reqId);
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, shippingStatus: status } : r)),
    );
    if (target) {
      recordActivity(
        'Shipping status updated',
        `${target.reqNumber} (${target.joNumber}) marked ${status}`,
        'material',
        target.joNumber,
      );
      showUndoToast(`${target.reqNumber} marked ${status}`, () => {
        setRequisitions(prevReqs);
      });
    }
  };

  const handleAdvanceStage = (params: {
    joNumber: string;
    targetStage: ProductionStage;
    note: string;
    includePhoto: boolean;
    photoCaption: string;
  }) => {
    const key = createIdempotencyKey(
      'advance-stage',
      params.joNumber,
      params.targetStage,
    );
    if (!idempotencyRef.current.claim(key)) return;

    const ord = orders.find((o) => o.joNumber === params.joNumber);
    if (!ord) return;
    const prevOrders = orders;
    const prevPhotos = photos;

    let photoId: string | undefined;
    if (params.includePhoto) {
      photoId = `ph-${Date.now()}`;
      const newPhoto: MilestonePhoto = {
        id: photoId,
        joNumber: params.joNumber,
        stage: params.targetStage,
        caption: params.photoCaption,
        capturedAt: '2026-11-18',
        furnitureKind: ord.specs.furnitureKind,
      };
      setPhotos((prev) => [newPhoto, ...prev]);
    }

    const nextStatus =
      params.targetStage === 'Ready' ? 'Ready' : 'In Production';
    const nextNotes: MilestoneNote[] = [
      ...ord.notes,
      {
        id: `note-${Date.now()}`,
        stage: params.targetStage,
        author: loggedInUser || 'Workshop Team',
        note: params.note,
        timestamp: '2026-11-18 16:00',
        ...(photoId ? { photoId } : {}),
      },
    ];

    setOrders((prev) =>
      prev.map((o) =>
        o.joNumber === params.joNumber
          ? {
              ...o,
              stage: params.targetStage,
              status: nextStatus,
              notes: nextNotes,
            }
          : o,
      ),
    );
    recordActivity(
      'Stage advanced',
      `${params.joNumber} moved to ${params.targetStage} · ${ord.specs.piece}`,
      'production',
      params.joNumber,
    );

    showUndoToast(`Updated ${params.joNumber} to ${params.targetStage}`, () => {
      idempotencyRef.current.release(key);
      setOrders(prevOrders);
      setPhotos(prevPhotos);
    });
  };

  const handleRecordPayment = (params: {
    joNumber: string;
    type: PaymentType;
    method: PaymentMethod;
    amount: number;
    reference: string;
  }) => {
    const key = createIdempotencyKey(
      'record-payment',
      params.joNumber,
      `${params.type}-${params.amount}-${params.reference}`,
    );
    if (!idempotencyRef.current.claim(key)) return;

    const ord = orders.find((o) => o.joNumber === params.joNumber);
    if (!ord) return;
    const prevPayments = payments;

    const payRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      joNumber: params.joNumber,
      customerName: ord.customerName,
      type: params.type,
      method: params.method,
      amount: params.amount,
      reference: params.reference,
      status: 'Verified',
      recordedAt: '2026-11-18',
    };

    setPayments((prev) => [...prev, payRec]);
    recordActivity(
      'Payment recorded',
      `${params.joNumber} · ${params.type} ₱${params.amount.toLocaleString('en-PH')} (${params.method})`,
      'payment',
      params.joNumber,
    );

    showUndoToast(`Payment recorded for ${params.joNumber}`, () => {
      idempotencyRef.current.release(key);
      setPayments(prevPayments);
    });
  };

  const handleSetPaymentChoice = (
    joNumber: string,
    choice: 'Pay now' | 'COD',
  ) => {
    const prevOrders = orders;
    setOrders((prev) =>
      prev.map((o) =>
        o.joNumber === joNumber ? { ...o, paymentChoiceAtReady: choice } : o,
      ),
    );
    recordActivity(
      'Settlement option set',
      `${joNumber} marked ${choice}`,
      'payment',
      joNumber,
    );
    showUndoToast(`${joNumber} settlement set to ${choice}`, () => {
      setOrders(prevOrders);
    });
  };

  const handleFinalizeOrder = (joNumber: string) => {
    runWithViewTransition(() => {
      setActiveNav('orders');
      setSubScreen({ type: 'delivery', joNumber });
    });
  };

  const handleMarkDelivered = (joNumber: string) => {
    const prevOrders = orders;
    setOrders((prev) =>
      prev.map((o) =>
        o.joNumber === joNumber
          ? { ...o, status: 'Delivered', deliveredAt: '2026-11-18' }
          : o,
      ),
    );
    recordActivity(
      'Order delivered',
      `${joNumber} handed over for inspection`,
      'delivery',
      joNumber,
    );
    showUndoToast(`Marked ${joNumber} delivered`, () => {
      setOrders(prevOrders);
    });
  };

  const handleDamageNo = (joNumber: string) => {
    const damageCheck = {
      checked: true,
      hasDamage: false,
      checkedAt: '2026-11-18 17:15',
    };
    setOrders((prev) =>
      prev.map((o) => (o.joNumber === joNumber ? { ...o, damageCheck } : o)),
    );
  };

  const handleDamageYesRepair = (params: {
    joNumber: string;
    description: string;
    repairCost: number;
  }) => {
    const ord = orders.find((o) => o.joNumber === params.joNumber);
    const nextRepair = (ord?.repairCharges ?? 0) + params.repairCost;
    const damageCheck = {
      checked: true,
      hasDamage: true,
      description: params.description,
      repairCost: params.repairCost,
      checkedAt: '2026-11-18 17:15',
    };
    setOrders((prev) =>
      prev.map((o) =>
        o.joNumber === params.joNumber
          ? { ...o, repairCharges: nextRepair, damageCheck }
          : o,
      ),
    );
    recordActivity(
      'Repair fee billed',
      `${params.joNumber} · +₱${params.repairCost.toLocaleString('en-PH')} (${params.description})`,
      'delivery',
      params.joNumber,
    );
  };

  const handleCompleteOrder = (joNumber: string) => {
    const ord = orders.find((o) => o.joNumber === joNumber);
    const deliveredAt = ord?.deliveredAt ?? '2026-11-18';
    setOrders((prev) =>
      prev.map((o) =>
        o.joNumber === joNumber
          ? {
              ...o,
              status: 'Completed',
              deliveredAt,
              completedAt: '2026-11-18',
            }
          : o,
      ),
    );
    recordActivity(
      'Order completed',
      `${joNumber} settled & closed`,
      'delivery',
      joNumber,
    );
  };

  const handleUpdateSettings = (next: WorkshopSettings) => {
    setSettings(next);
  };

  const handleResetDemo = () => {
    idempotencyRef.current = new IdempotencyGuard();
    setSettings(SEED_SETTINGS);
    setCustomers(SEED_CUSTOMERS);
    setOrders(SEED_ORDERS);
    setPayments(SEED_PAYMENTS);
    setRequisitions(SEED_REQUISITIONS);
    setPhotos(SEED_PHOTOS);
    setActivities(SEED_ACTIVITIES);
  };

  // Determine contextual page title
  const getHeaderTitle = (): string => {
    if (subScreen.type === 'intake') return 'New Order Intake';
    if (subScreen.type === 'estimate') return 'Estimate & Quotation';
    if (subScreen.type === 'downpayment') return '50% Down Payment';
    if (subScreen.type === 'order-detail') return `Order ${subScreen.joNumber}`;
    if (subScreen.type === 'delivery') {
      return `Delivery & Handover · ${subScreen.joNumber}`;
    }

    switch (activeNav) {
      case 'home':
        return 'Workshop Overview';
      case 'orders':
        return 'Job Orders';
      case 'production':
        return 'Production Queue';
      case 'materials':
        return 'Materials & POs';
      case 'payments':
        return 'Payments & Balances';
      case 'customers':
        return 'Customers';
      case 'settings':
        return 'Settings & Backups';
    }
  };

  const title = getHeaderTitle();

  const renderActiveContent = () => {
    if (subScreen.type === 'intake') {
      return (
        <OrderIntakeScreen
          customers={customers}
          initialDraft={subScreen.draft}
          onCancel={() => setSubScreen({ type: 'none' })}
          onNextEstimate={(draft) => setSubScreen({ type: 'estimate', draft })}
        />
      );
    }

    if (subScreen.type === 'estimate') {
      return (
        <EstimateScreen
          draft={subScreen.draft}
          defaultHourlyRate={settings.defaultHourlyRate}
          defaultMarkupRate={settings.defaultMarkupRate}
          onBack={() => {
            if (orders.some((o) => o.status === 'Declined')) {
              setSubScreen({ type: 'none' });
            } else {
              setSubScreen({ type: 'intake', draft: subScreen.draft });
            }
          }}
          onAccept={(materialsCost, laborHours) => {
            const created = createOrderFromEstimate(
              subScreen.draft,
              materialsCost,
              laborHours,
              'Deposit Required',
            );
            setSubScreen({ type: 'downpayment', joNumber: created.joNumber });
          }}
          onDecline={(materialsCost, laborHours, reason) => {
            createOrderFromEstimate(
              subScreen.draft,
              materialsCost,
              laborHours,
              'Declined',
              reason,
            );
          }}
        />
      );
    }

    if (subScreen.type === 'downpayment') {
      const ord = orders.find((o) => o.joNumber === subScreen.joNumber);
      if (!ord) return null;
      return (
        <DownPaymentScreen
          order={ord}
          onBack={() => setSubScreen({ type: 'none' })}
          onSavePending={handleSaveDepositPending}
          onVerifyDeposit={handleVerifyDeposit}
          onOpenOrderDetail={(jo) => openOrderDetail(jo, 'Overview')}
        />
      );
    }

    if (subScreen.type === 'order-detail') {
      const ord = orders.find((o) => o.joNumber === subScreen.joNumber);
      if (!ord) return null;
      return (
        <OrderDetailScreen
          order={ord}
          payments={payments}
          requisitions={requisitions}
          photos={photos}
          initialTab={subScreen.tab}
          onBack={() => setSubScreen({ type: 'none' })}
          onVerifyDeposit={(jo) =>
            setSubScreen({ type: 'downpayment', joNumber: jo })
          }
          onNewRequisition={(jo) => {
            setActiveNav('materials');
            setSubScreen({ type: 'none' });
            setCreatingReqForJo(jo);
          }}
          onOpenRequisition={(reqId) => {
            setActiveNav('materials');
            setSubScreen({ type: 'none' });
            setSelectedReqId(reqId);
          }}
          onOpenJobStatus={(jo) => {
            setActiveNav('production');
            setSubScreen({ type: 'none' });
            setSelectedProdJo(jo);
          }}
          onOpenOrderBalance={(jo) => {
            setActiveNav('payments');
            setSubScreen({ type: 'none' });
            setSelectedPayJo(jo);
          }}
          onOpenDelivery={(jo) =>
            setSubScreen({ type: 'delivery', joNumber: jo })
          }
        />
      );
    }

    if (subScreen.type === 'delivery') {
      const ord = orders.find((o) => o.joNumber === subScreen.joNumber);
      if (!ord) return null;
      return (
        <DeliveryScreen
          order={ord}
          payments={payments}
          onBack={() => openOrderDetail(ord.joNumber, 'Delivery')}
          onMarkDelivered={handleMarkDelivered}
          onDamageNo={handleDamageNo}
          onDamageYesRepairAndBill={handleDamageYesRepair}
          onCollectCod={(params) =>
            handleRecordPayment({
              joNumber: params.joNumber,
              type: 'COD Collection',
              method: params.method,
              amount: params.amount,
              reference: params.reference,
            })
          }
          onCompleteOrder={handleCompleteOrder}
          onBackToOrders={() => {
            setActiveNav('orders');
            setSubScreen({ type: 'none' });
          }}
        />
      );
    }

    switch (activeNav) {
      case 'home':
        return (
          <HomeScreen
            role="manager"
            orders={orders}
            payments={payments}
            requisitions={requisitions}
            activities={activities}
            onNewOrder={openNewOrderIntake}
            onOpenOrder={(jo) => openOrderDetail(jo, 'Overview')}
            onOpenDownPayment={(jo) => {
              setActiveNav('orders');
              setSubScreen({ type: 'downpayment', joNumber: jo });
            }}
            onOpenJobStatus={(jo) => {
              setActiveNav('production');
              setSelectedProdJo(jo);
            }}
            onOpenOrderBalance={(jo) => {
              setActiveNav('payments');
              setSelectedPayJo(jo);
            }}
            onOpenDelivery={(jo) => {
              setActiveNav('orders');
              setSubScreen({ type: 'delivery', joNumber: jo });
            }}
            onNavigateTab={(tab) => navigateSection(tab)}
          />
        );
      case 'orders':
        return (
          <OrdersListScreen
            orders={orders}
            payments={payments}
            onSelectOrder={(jo) => openOrderDetail(jo, 'Overview')}
            onNewOrder={openNewOrderIntake}
          />
        );
      case 'materials':
        return (
          <MaterialsScreen
            orders={orders}
            requisitions={requisitions}
            selectedReqId={selectedReqId}
            creatingForJo={creatingReqForJo}
            onSelectReq={setSelectedReqId}
            onStartCreate={(jo) =>
              setCreatingReqForJo(jo ?? orders[0]?.joNumber ?? 'JO-2026-0001')
            }
            onCancelCreate={() => setCreatingReqForJo(null)}
            onCreateRequisition={handleCreateRequisition}
            onUpdateShippingStatus={handleUpdateShippingStatus}
          />
        );
      case 'production':
        return (
          <ProductionScreen
            orders={orders}
            photos={photos}
            selectedJobJo={selectedProdJo}
            onSelectJob={setSelectedProdJo}
            onAdvanceStage={handleAdvanceStage}
          />
        );
      case 'payments':
        return (
          <PaymentsScreen
            orders={orders}
            payments={payments}
            selectedOrderJo={selectedPayJo}
            onSelectOrder={setSelectedPayJo}
            onRecordPayment={handleRecordPayment}
            onSetPaymentChoiceAtReady={handleSetPaymentChoice}
            onFinalizeOrder={handleFinalizeOrder}
            onOpenDelivery={(jo) => {
              setActiveNav('orders');
              setSubScreen({ type: 'delivery', joNumber: jo });
            }}
          />
        );
      case 'customers':
        return (
          <CustomersScreen
            customers={customers}
            orders={orders}
            onOpenOrder={(jo) => openOrderDetail(jo, 'Overview')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            orders={orders}
            payments={payments}
            onUpdateSettings={handleUpdateSettings}
            onResetDemoData={handleResetDemo}
          />
        );
    }
  };

  const commandItems = useMemo<CommandItem[]>(() => {
    const navCmds: CommandItem[] = [
      { id: 'nav-home', label: 'Go to Home Overview', detail: 'Queue, deposits & deliveries', shortcut: '1', group: 'Navigation', onRun: () => navigateSection('home') },
      { id: 'nav-orders', label: 'Go to Job Orders', detail: 'Order list & intake', shortcut: '2', group: 'Navigation', onRun: () => navigateSection('orders') },
      { id: 'nav-prod', label: 'Go to Production Queue', detail: '5-stage workshop tracker', shortcut: '3', group: 'Navigation', onRun: () => navigateSection('production') },
      { id: 'nav-mat', label: 'Go to Materials & Requisitions', detail: 'Supplier POs & shipping', shortcut: '4', group: 'Navigation', onRun: () => navigateSection('materials') },
      { id: 'nav-pay', label: 'Go to Payments & Balances', detail: 'Collections & COD ledger', shortcut: '5', group: 'Navigation', onRun: () => navigateSection('payments') },
      { id: 'nav-cust', label: 'Go to Customers', detail: 'Client accounts', shortcut: '6', group: 'Navigation', onRun: () => navigateSection('customers') },
      { id: 'nav-set', label: 'Go to Settings & Backups', detail: 'Pricing rules & CSV exports', shortcut: '7', group: 'Navigation', onRun: () => navigateSection('settings') },
    ];
    const actionCmds: CommandItem[] = [
      { id: 'act-new-order', label: '+ New Job Order Intake', detail: 'Start intake, Formula B quote & deposit', group: 'Actions', onRun: openNewOrderIntake },
    ];
    const orderCmds: CommandItem[] = orders.map((o) => ({
      id: `ord-${o.joNumber}`,
      label: `${o.joNumber} · ${o.specs.piece}`,
      detail: `${o.customerName} (${o.status})`,
      group: 'Orders',
      onRun: () => openOrderDetail(o.joNumber, 'Overview'),
    }));
    const customerCmds: CommandItem[] = customers.map((c) => ({
      id: `cust-${c.id}`,
      label: c.name,
      detail: `${c.type} · ${c.phone}`,
      group: 'Customers',
      onRun: () => navigateSection('customers'),
    }));
    return [...actionCmds, ...navCmds, ...orderCmds, ...customerCmds];
  }, [customers, navigateSection, openNewOrderIntake, openOrderDetail, orders]);

  const themeToggleButton = (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label={
        theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
      }
      aria-pressed={theme === 'dark'}
      title={
        theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
      }
      className="btn-scale hit-slop h-10 px-3 continuous-control glass-frosted text-xs font-semibold text-[#1B1712] inline-flex items-center gap-1.5 hover:bg-white whitespace-nowrap shrink-0"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-3.5 h-3.5 text-[#8A3B12]" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-[#F4B860]" />
          <span>Light</span>
        </>
      )}
    </button>
  );

  // Show hardcoded Member Login screen unless logged in or ?autostart=1 preview
  if (!isLoggedIn && !previewBypass) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip px-4 pb-3 lg:safe-shell lg:py-0 flex flex-col lg:flex-row lg:gap-6 lg:max-w-[1440px] lg:mx-auto">
      <Sidebar
        activeSection={activeNav}
        onSelectSection={navigateSection}
        userEmail={loggedInUser}
        onSignOut={handleSignOut}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Sticky Compact Mobile Top Header Bar (< lg) */}
      <div className="no-print lg:hidden sticky top-0 z-40 -mx-4 px-4 py-2.5 mb-4 bg-[#F5F2EA] border-b border-[#D9D2C3] shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            className="hit-slop w-10 h-10 rounded-lg hover:bg-white/80 inline-flex items-center justify-center text-[#1B1712] shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
              <img
                src="./assets/aistudio/image_ad50d4bb.png"
                alt="Saw2Sale logo"
                className="w-full h-full object-cover scale-[1.24]"
              />
            </div>
            <span className="font-display text-base font-bold tracking-wider leading-none text-[#1B1712] truncate">
              SAW2SALE
            </span>
          </div>
        </div>
        {themeToggleButton}
      </div>

      <main className="flex-1 w-full max-w-full min-w-0 py-1 lg:py-4 lg:pr-2 space-y-5 lg:space-y-6">
        {/* Top Bar */}
        <header className="no-print flex items-center justify-between gap-4 lg:gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl text-[#1B1712] leading-tight break-words">
              {title}
            </h1>
          </div>

          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {themeToggleButton}
          </div>
        </header>

        <StateShell
          mode={stateMode}
          onRetry={() => setStateMode('live')}
          emptyTitle={`No ${activeNav} records to show`}
          emptyDescription="Add a new job order or workshop entry to populate this view."
          emptyActionLabel={
            activeNav === 'orders' || activeNav === 'home'
              ? '+ New Order'
              : 'Return to Live View'
          }
          onEmptyAction={() => {
            setStateMode('live');
            if (activeNav === 'orders' || activeNav === 'home') {
              openNewOrderIntake();
            }
          }}
        >
          {renderActiveContent()}
        </StateShell>
      </main>

      <CommandMenu
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        items={commandItems}
      />

      <UndoToastBar
        toast={undoToast}
        onDismiss={() => setUndoToast(null)}
      />
    </div>
  );
}

export default App;
