export const rawMaterials = [
  { id: "RM001", name: "Orange Concentrate", supplier: "FreshFruit Co.", unit: "Liters", stock: 450, minStock: 100, lastPurchase: "2026-03-20", costPerUnit: 3.50 },
  { id: "RM002", name: "Mango Pulp", supplier: "Tropical Imports", unit: "Kg", stock: 280, minStock: 80, lastPurchase: "2026-03-18", costPerUnit: 5.20 },
  { id: "RM003", name: "Sugar (Refined)", supplier: "SweetSource Ltd.", unit: "Kg", stock: 60, minStock: 100, lastPurchase: "2026-03-15", costPerUnit: 1.10 },
  { id: "RM004", name: "Citric Acid", supplier: "ChemSupply Inc.", unit: "Kg", stock: 35, minStock: 10, lastPurchase: "2026-03-22", costPerUnit: 8.00 },
  { id: "RM005", name: "Passion Fruit Extract", supplier: "Tropical Imports", unit: "Liters", stock: 120, minStock: 50, lastPurchase: "2026-03-19", costPerUnit: 7.80 },
  { id: "RM006", name: "PET Bottles (500ml)", supplier: "PackRight Ltd.", unit: "Pieces", stock: 5200, minStock: 2000, lastPurchase: "2026-03-21", costPerUnit: 0.15 },
];

export const productionBatches = [
  { id: "B-20260325-001", product: "Orange Blast 500ml", quantity: 2400, status: "completed", startDate: "2026-03-25", yield: 96, assignedTo: "John Kariuki" },
  { id: "B-20260325-002", product: "Mango Tango 500ml", quantity: 1800, status: "in_progress", startDate: "2026-03-25", yield: null, assignedTo: "Sarah Wanjiku" },
  { id: "B-20260324-001", product: "Passion Punch 1L", quantity: 1000, status: "completed", startDate: "2026-03-24", yield: 94, assignedTo: "John Kariuki" },
  { id: "B-20260326-001", product: "Tropical Mix 500ml", quantity: 3000, status: "planned", startDate: "2026-03-26", yield: null, assignedTo: "Peter Mwangi" },
  { id: "B-20260323-001", product: "Orange Blast 1L", quantity: 1500, status: "completed", startDate: "2026-03-23", yield: 97, assignedTo: "Sarah Wanjiku" },
];

export const qualityTests = [
  { id: "QC001", batchId: "B-20260325-001", product: "Orange Blast 500ml", ph: 3.8, brix: 11.5, appearance: "Clear", result: "pass", testedBy: "Grace Njeri", date: "2026-03-25" },
  { id: "QC002", batchId: "B-20260324-001", product: "Passion Punch 1L", ph: 3.5, brix: 13.2, appearance: "Slightly cloudy", result: "pass", testedBy: "Grace Njeri", date: "2026-03-24" },
  { id: "QC003", batchId: "B-20260323-001", product: "Orange Blast 1L", ph: 4.2, brix: 9.8, appearance: "Clear", result: "fail", testedBy: "David Omondi", date: "2026-03-23" },
  { id: "QC004", batchId: "B-20260325-002", product: "Mango Tango 500ml", ph: null, brix: null, appearance: null, result: "pending", testedBy: null, date: null },
];

export const finishedProducts = [
  { id: "FP001", name: "Orange Blast 500ml", batch: "B-20260325-001", stock: 2304, expiry: "2026-09-25", status: "available", location: "Warehouse A" },
  { id: "FP002", name: "Passion Punch 1L", batch: "B-20260324-001", stock: 940, expiry: "2026-09-24", status: "available", location: "Warehouse A" },
  { id: "FP003", name: "Orange Blast 1L", batch: "B-20260323-001", stock: 180, expiry: "2026-04-05", status: "near_expiry", location: "Warehouse B" },
  { id: "FP004", name: "Tropical Mix 500ml", batch: "B-20260320-001", stock: 0, expiry: "2026-03-20", status: "expired", location: "Warehouse B" },
];

export const salesOrders = [
  { id: "SO-001", customer: "Naivas Supermarket", items: 3, total: 45600, status: "delivered", date: "2026-03-22" },
  { id: "SO-002", customer: "Quickmart Ltd.", items: 2, total: 28400, status: "shipped", date: "2026-03-24" },
  { id: "SO-003", customer: "Carrefour Kenya", items: 5, total: 72000, status: "confirmed", date: "2026-03-25" },
  { id: "SO-004", customer: "Chandarana Foodplus", items: 1, total: 12800, status: "pending", date: "2026-03-26" },
];

export const productionChartData = [
  { day: "Mon", batches: 4, volume: 8200 },
  { day: "Tue", batches: 3, volume: 6800 },
  { day: "Wed", batches: 5, volume: 11200 },
  { day: "Thu", batches: 4, volume: 9400 },
  { day: "Fri", batches: 6, volume: 14500 },
  { day: "Sat", batches: 2, volume: 4000 },
  { day: "Sun", batches: 0, volume: 0 },
];
