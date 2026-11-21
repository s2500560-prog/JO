import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IdempotencyGuard,
  calculateCostingAndMaterialsReport,
  calculateOrderBalance,
  calculateQuotation,
  calculateRequiredDeposit,
  canCreateRequisitionForOrder,
  canFinalizeOrder,
  createIdempotencyKey,
  exportOrdersToCsv,
  generateNextJoNumber,
  validateStageTransition,
} from './workshopRules';
import type {
  ActivityEntry,
  MaterialRequisition,
  Order,
  PaymentRecord,
} from '../types/saw2sale';

test('calculateQuotation uses Formula B (materials + labor + 25% markup) and 50% deposit', () => {
  const q = calculateQuotation({
    materialsCost: 10800,
    laborHours: 40,
    laborRate: 250,
    markupRate: 0.25,
    depositPercentage: 0.5,
    serviceType: 'full-build',
  });

  assert.equal(q.materialsCost, 10800);
  assert.equal(q.laborCost, 10000);
  assert.equal(q.markupAmount, 5200);
  assert.equal(q.totalQuotedPrice, 26000);
  assert.equal(q.depositRequired, 13000);
});

test('calculateQuotation zeroes out materials for labor-only orders', () => {
  const q = calculateQuotation({
    materialsCost: 9000,
    laborHours: 32,
    laborRate: 300,
    serviceType: 'labor-only',
  });

  assert.equal(q.materialsCost, 0);
  assert.equal(q.laborCost, 9600);
  assert.equal(q.markupAmount, 2400);
  assert.equal(q.totalQuotedPrice, 12000);
  assert.equal(q.depositRequired, 6000);
});

test('calculateRequiredDeposit enforces 50% deposit rule', () => {
  assert.equal(calculateRequiredDeposit(26000), 13000);
  assert.equal(calculateRequiredDeposit(19500), 9750);
});

test('calculateOrderBalance includes repair charges and subtracts only verified payments', () => {
  const order: Pick<Order, 'joNumber' | 'quotation' | 'repairCharges' | 'status'> = {
    joNumber: 'JO-2026-0001',
    status: 'In Production',
    repairCharges: 1500,
    quotation: {
      materialsCost: 10800,
      laborHours: 40,
      laborRate: 250,
      laborCost: 10000,
      markupRate: 0.25,
      markupAmount: 5200,
      totalQuotedPrice: 26000,
      depositRequired: 13000,
    },
  };

  const payments: PaymentRecord[] = [
    {
      id: 'PAY-1',
      joNumber: 'JO-2026-0001',
      customerName: 'Maria Santos',
      type: '50% Downpayment',
      method: 'GCash',
      amount: 13000,
      reference: 'GC-99210',
      status: 'Verified',
      recordedAt: '2026-09-01',
    },
    {
      id: 'PAY-2',
      joNumber: 'JO-2026-0001',
      customerName: 'Maria Santos',
      type: 'Final Balance',
      method: 'Cash',
      amount: 5000,
      reference: 'PENDING-01',
      status: 'Pending',
      recordedAt: '2026-09-10',
    },
  ];

  const bal = calculateOrderBalance(order, payments);
  assert.equal(bal.totalBilled, 27500);
  assert.equal(bal.totalVerifiedPaid, 13000);
  assert.equal(bal.totalPendingPaid, 5000);
  assert.equal(bal.remainingBalance, 14500);
});

test('canCreateRequisitionForOrder blocks labor-only orders with client supplies materials message', () => {
  const laborCheck = canCreateRequisitionForOrder({
    serviceType: 'labor-only',
    status: 'In Production',
  });
  assert.equal(laborCheck.allowed, false);
  assert.match(laborCheck.reason ?? '', /client supplies materials/i);

  const fullBuildCheck = canCreateRequisitionForOrder({
    serviceType: 'full-build',
    status: 'In Production',
  });
  assert.equal(fullBuildCheck.allowed, true);
});

test('validateStageTransition rejects skipping stages or moving backwards', () => {
  const skipResult = validateStageTransition('Cutting', 'Assembly');
  assert.equal(skipResult.valid, false);
  assert.match(skipResult.error ?? '', /Cannot skip stages/i);

  const backResult = validateStageTransition('Finishing', 'Joinery');
  assert.equal(backResult.valid, false);

  const validResult = validateStageTransition('Cutting', 'Joinery');
  assert.equal(validResult.valid, true);
});

test('canFinalizeOrder requires zero remaining balance and Ready or Delivered status', () => {
  assert.equal(canFinalizeOrder(0, { status: 'Ready', stage: 'Ready' }), true);
  assert.equal(canFinalizeOrder(500, { status: 'Ready', stage: 'Ready' }), false);
  assert.equal(
    canFinalizeOrder(0, { status: 'In Production', stage: 'Finishing' }),
    false,
  );
});

test('generateNextJoNumber increments highest sequence cleanly', () => {
  const next = generateNextJoNumber([
    { joNumber: 'JO-2026-0001' },
    { joNumber: 'JO-2026-0007' },
  ]);
  assert.equal(next, 'JO-2026-0008');
});

test('exportOrdersToCsv produces valid CSV rows', () => {
  const csv = exportOrdersToCsv(
    [
      {
        id: '1',
        joNumber: 'JO-2026-0001',
        customerId: 'c1',
        customerName: 'Maria Santos',
        customerType: 'Residential',
        customerPhone: '0917-889-2341',
        serviceType: 'full-build',
        specs: {
          piece: '8-Seater Narra Dining Table',
          dimensions: '84" x 40" x 30"',
          woodSpecies: 'Solid Narra',
          finishNotes: 'Matte tung oil',
          furnitureKind: 'dining-table',
        },
        promisedDate: '2026-11-28',
        createdAt: '2026-11-01',
        queuePosition: 1,
        status: 'In Production',
        stage: 'Finishing',
        quotation: {
          materialsCost: 10800,
          laborHours: 40,
          laborRate: 250,
          laborCost: 10000,
          markupRate: 0.25,
          markupAmount: 5200,
          totalQuotedPrice: 26000,
          depositRequired: 13000,
        },
        depositVerified: true,
        paymentChoiceAtReady: null,
        repairCharges: 0,
        damageCheck: null,
        deliveredAt: null,
        completedAt: null,
        notes: [],
      },
    ],
    [],
  );

  assert.match(csv, /^JO Number,Customer,/);
  assert.match(csv, /JO-2026-0001,Maria Santos,Residential,Full-Build/);
});

test('IdempotencyGuard prevents duplicate claims for the same idempotency key', () => {
  const guard = new IdempotencyGuard();
  const key = createIdempotencyKey('verify-deposit', 'JO-2026-0005', 42);

  assert.equal(key, 'idem_verify-deposit_jo-2026-0005_42');
  assert.equal(guard.claim(key), true);
  assert.equal(guard.claim(key), false);
  guard.release(key);
  assert.equal(guard.claim(key), true);
});

test('calculateCostingAndMaterialsReport aggregates BOM, labor, markup, category spend, and variance', () => {
  const sampleOrders: Order[] = [
    {
      id: 'o1',
      joNumber: 'JO-2026-0001',
      customerId: 'c1',
      customerName: 'Maria Santos',
      customerType: 'Residential',
      customerPhone: '0917-000-0000',
      serviceType: 'full-build',
      specs: {
        piece: 'Dining Table',
        dimensions: '84 x 40',
        woodSpecies: 'Narra',
        finishNotes: 'Matte',
        furnitureKind: 'dining-table',
      },
      promisedDate: '2026-11-25',
      createdAt: '2026-11-01',
      queuePosition: 1,
      status: 'In Production',
      stage: 'Finishing',
      quotation: {
        materialsCost: 10800,
        laborHours: 40,
        laborRate: 250,
        laborCost: 10000,
        markupRate: 0.25,
        markupAmount: 5200,
        totalQuotedPrice: 26000,
        depositRequired: 13000,
      },
      depositVerified: true,
      paymentChoiceAtReady: null,
      repairCharges: 0,
      damageCheck: null,
      deliveredAt: null,
      completedAt: null,
      notes: [],
    },
  ];
  const sampleReqs: MaterialRequisition[] = [
    {
      id: 'r1',
      reqNumber: 'REQ-2026-001',
      joNumber: 'JO-2026-0001',
      itemTitle: 'Narra Planks',
      supplier: 'City Lumber',
      shippingStatus: 'Received',
      createdAt: '2026-11-02',
      expectedDate: '2026-11-04',
      lineItems: [
        { id: 'l1', description: 'Narra', category: 'Lumber', quantity: 40, unit: 'bd ft', unitCost: 200 },
        { id: 'l2', description: 'Oil', category: 'Finish', quantity: 2, unit: 'L', unitCost: 500 },
      ],
    },
  ];
  const report = calculateCostingAndMaterialsReport(sampleOrders, sampleReqs, []);
  assert.equal(report.estimatedBomMaterials, 10800);
  assert.equal(report.actualRequisitionSpend, 9000);
  assert.equal(report.materialsVariance, 1800);
  assert.equal(report.categorySpend.Lumber, 8000);
  assert.equal(report.categorySpend.Finish, 1000);
  assert.equal(report.shippingCounts.Received, 1);
  assert.equal(report.estimatedLaborCost, 10000);
  assert.equal(report.estimatedMarkup, 5200);
});

test('formatPhilippinePhone and isValidPhilippinePhone normalize and validate +63 numbers', async () => {
  const {
    formatPhilippinePhone,
    isValidPhilippinePhone,
    formatDimensionsWithUnit,
  } = await import('./workshopRules');

  assert.equal(formatPhilippinePhone('0917-889-2341'), '+63 917 889 2341');
  assert.equal(formatPhilippinePhone('9184421904'), '+63 918 442 1904');
  assert.equal(formatPhilippinePhone('+639175018832'), '+63 917 501 8832');
  assert.equal(isValidPhilippinePhone('+63 917 889 2341'), true);
  assert.equal(isValidPhilippinePhone('0917-889-2341'), false);

  assert.equal(formatDimensionsWithUnit('84 × 40 × 30', 'in'), '84 × 40 × 30 in');
  assert.equal(formatDimensionsWithUnit('84" × 40" × 30"', 'in'), '84 × 40 × 30 in');
  assert.equal(formatDimensionsWithUnit('210 × 100 × 76 cm', 'in'), '210 × 100 × 76 cm');
});

test('appendActivityEntry prepends new actions and enforces 5-item cap', async () => {
  const { appendActivityEntry } = await import('./workshopRules');

  let feed: ActivityEntry[] = [
    { id: '1', action: 'A1', detail: 'd1', timestamp: 't1', category: 'order' },
    { id: '2', action: 'A2', detail: 'd2', timestamp: 't2', category: 'payment' },
    { id: '3', action: 'A3', detail: 'd3', timestamp: 't3', category: 'material' },
    { id: '4', action: 'A4', detail: 'd4', timestamp: 't4', category: 'production' },
    { id: '5', action: 'A5', detail: 'd5', timestamp: 't5', category: 'delivery' },
  ];

  feed = appendActivityEntry(feed, {
    id: '6',
    action: 'New order created',
    detail: 'JO-2026-0007 · Maria Santos',
    joNumber: 'JO-2026-0007',
    timestamp: 'Nov 18, 5:00 PM',
    category: 'order',
  });

  assert.equal(feed.length, 5);
  assert.equal(feed[0].action, 'New order created');
  assert.equal(feed[0].joNumber, 'JO-2026-0007');
  assert.equal(feed[4].id, '4');
});




