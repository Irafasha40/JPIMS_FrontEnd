// ── Raw Materials ──
export const rawMaterials = [
  { id: "RM001", name: "Orange Concentrate", supplier: "FreshFruit Co.", category: "Concentrate", unit: "Liters", stock: 450, minStock: 100, lastPurchase: "2026-03-20", costPerUnit: 3.50 },
  { id: "RM002", name: "Mango Pulp", supplier: "Tropical Imports", category: "Pulp", unit: "Kg", stock: 280, minStock: 80, lastPurchase: "2026-03-18", costPerUnit: 5.20 },
  { id: "RM003", name: "Sugar (Refined)", supplier: "SweetSource Ltd.", category: "Sweetener", unit: "Kg", stock: 60, minStock: 100, lastPurchase: "2026-03-15", costPerUnit: 1.10 },
  { id: "RM004", name: "Citric Acid", supplier: "ChemSupply Inc.", category: "Additive", unit: "Kg", stock: 35, minStock: 10, lastPurchase: "2026-03-22", costPerUnit: 8.00 },
  { id: "RM005", name: "Passion Fruit Extract", supplier: "Tropical Imports", category: "Extract", unit: "Liters", stock: 120, minStock: 50, lastPurchase: "2026-03-19", costPerUnit: 7.80 },
  { id: "RM006", name: "PET Bottles (500ml)", supplier: "PackRight Ltd.", category: "Packaging", unit: "Pieces", stock: 5200, minStock: 2000, lastPurchase: "2026-03-21", costPerUnit: 0.15 },
  { id: "RM007", name: "PET Bottles (1L)", supplier: "PackRight Ltd.", category: "Packaging", unit: "Pieces", stock: 3100, minStock: 1500, lastPurchase: "2026-03-21", costPerUnit: 0.22 },
  { id: "RM008", name: "Preservative (Sodium Benzoate)", supplier: "ChemSupply Inc.", category: "Additive", unit: "Kg", stock: 18, minStock: 5, lastPurchase: "2026-03-10", costPerUnit: 12.50 },
  { id: "RM009", name: "Pineapple Concentrate", supplier: "FreshFruit Co.", category: "Concentrate", unit: "Liters", stock: 200, minStock: 60, lastPurchase: "2026-03-17", costPerUnit: 4.00 },
  { id: "RM010", name: "Labels (500ml)", supplier: "PrintWorks Kenya", category: "Packaging", unit: "Pieces", stock: 8500, minStock: 3000, lastPurchase: "2026-03-20", costPerUnit: 0.05 },
];

export const stockMovements = [
  { id: "SM001", materialId: "RM001", type: "in" as const, quantity: 200, date: "2026-03-20", reference: "PO-2026-008", recordedBy: "Jane Akinyi" },
  { id: "SM002", materialId: "RM001", type: "out" as const, quantity: 50, date: "2026-03-22", reference: "B-20260322-001", recordedBy: "John Kariuki" },
  { id: "SM003", materialId: "RM003", type: "out" as const, quantity: 40, date: "2026-03-23", reference: "B-20260323-001", recordedBy: "John Kariuki" },
  { id: "SM004", materialId: "RM003", type: "in" as const, quantity: 100, date: "2026-03-15", reference: "PO-2026-005", recordedBy: "Jane Akinyi" },
  { id: "SM005", materialId: "RM006", type: "out" as const, quantity: 2400, date: "2026-03-25", reference: "B-20260325-001", recordedBy: "John Kariuki" },
  { id: "SM006", materialId: "RM002", type: "in" as const, quantity: 150, date: "2026-03-18", reference: "PO-2026-006", recordedBy: "Jane Akinyi" },
  { id: "SM007", materialId: "RM005", type: "out" as const, quantity: 30, date: "2026-03-24", reference: "B-20260324-001", recordedBy: "Sarah Wanjiku" },
  { id: "SM008", materialId: "RM004", type: "in" as const, quantity: 20, date: "2026-03-22", reference: "PO-2026-007", recordedBy: "Jane Akinyi" },
];

export const purchaseOrders = [
  { id: "PO-2026-005", supplier: "SweetSource Ltd.", items: 1, total: 110, status: "received" as const, date: "2026-03-13", expectedDate: "2026-03-15" },
  { id: "PO-2026-006", supplier: "Tropical Imports", items: 2, total: 1560, status: "received" as const, date: "2026-03-16", expectedDate: "2026-03-18" },
  { id: "PO-2026-007", supplier: "ChemSupply Inc.", items: 1, total: 160, status: "received" as const, date: "2026-03-20", expectedDate: "2026-03-22" },
  { id: "PO-2026-008", supplier: "FreshFruit Co.", items: 1, total: 700, status: "received" as const, date: "2026-03-18", expectedDate: "2026-03-20" },
  { id: "PO-2026-009", supplier: "PackRight Ltd.", items: 2, total: 1462, status: "pending" as const, date: "2026-03-26", expectedDate: "2026-03-30" },
  { id: "PO-2026-010", supplier: "Tropical Imports", items: 3, total: 2840, status: "pending" as const, date: "2026-03-27", expectedDate: "2026-04-01" },
];

// ── Production Batches ──
export const productionBatches = [
  { id: "B-20260325-001", product: "Orange Blast 500ml", recipeId: "RCP001", quantity: 2400, status: "completed" as const, startDate: "2026-03-25", yield: 96, loss: 96, lossReason: "Spillage", assignedTo: "John Kariuki", ingredients: [{ materialId: "RM001", required: 120, issued: 120 }, { materialId: "RM003", required: 24, issued: 24 }, { materialId: "RM006", required: 2400, issued: 2400 }] },
  { id: "B-20260325-002", product: "Mango Tango 500ml", recipeId: "RCP002", quantity: 1800, status: "in_progress" as const, startDate: "2026-03-25", yield: null, loss: null, lossReason: null, assignedTo: "Sarah Wanjiku", ingredients: [{ materialId: "RM002", required: 90, issued: 90 }, { materialId: "RM003", required: 18, issued: 18 }, { materialId: "RM006", required: 1800, issued: 1800 }] },
  { id: "B-20260324-001", product: "Passion Punch 1L", recipeId: "RCP003", quantity: 1000, status: "completed" as const, startDate: "2026-03-24", yield: 94, loss: 60, lossReason: "Evaporation", assignedTo: "John Kariuki", ingredients: [{ materialId: "RM005", required: 100, issued: 100 }, { materialId: "RM003", required: 10, issued: 10 }, { materialId: "RM007", required: 1000, issued: 1000 }] },
  { id: "B-20260326-001", product: "Tropical Mix 500ml", recipeId: "RCP004", quantity: 3000, status: "planned" as const, startDate: "2026-03-26", yield: null, loss: null, lossReason: null, assignedTo: "Peter Mwangi", ingredients: [{ materialId: "RM001", required: 60, issued: 0 }, { materialId: "RM009", required: 60, issued: 0 }, { materialId: "RM005", required: 30, issued: 0 }, { materialId: "RM006", required: 3000, issued: 0 }] },
  { id: "B-20260323-001", product: "Orange Blast 1L", recipeId: "RCP001", quantity: 1500, status: "completed" as const, startDate: "2026-03-23", yield: 97, loss: 45, lossReason: "Spillage", assignedTo: "Sarah Wanjiku", ingredients: [{ materialId: "RM001", required: 150, issued: 150 }, { materialId: "RM003", required: 15, issued: 15 }, { materialId: "RM007", required: 1500, issued: 1500 }] },
  { id: "B-20260327-001", product: "Mango Tango 1L", recipeId: "RCP002", quantity: 800, status: "qc_pending" as const, startDate: "2026-03-27", yield: null, loss: null, lossReason: null, assignedTo: "Peter Mwangi", ingredients: [{ materialId: "RM002", required: 80, issued: 80 }, { materialId: "RM003", required: 8, issued: 8 }, { materialId: "RM007", required: 800, issued: 800 }] },
];

// ── Quality Control ──
export const qualityTests = [
  { id: "QC001", batchId: "B-20260325-001", product: "Orange Blast 500ml", ph: 3.8, brix: 11.5, appearance: "Clear" as const, color: "Normal" as const, taste: "Normal" as const, result: "pass" as const, testedBy: "Grace Njeri", date: "2026-03-25", notes: "Excellent batch quality" },
  { id: "QC002", batchId: "B-20260324-001", product: "Passion Punch 1L", ph: 3.5, brix: 13.2, appearance: "Slight Haze" as const, color: "Normal" as const, taste: "Normal" as const, result: "pass" as const, testedBy: "Grace Njeri", date: "2026-03-24", notes: "Slight haze acceptable for passion fruit" },
  { id: "QC003", batchId: "B-20260323-001", product: "Orange Blast 1L", ph: 4.2, brix: 9.8, appearance: "Clear" as const, color: "Off-color" as const, taste: "Off-taste" as const, result: "fail" as const, testedBy: "David Omondi", date: "2026-03-23", notes: "pH too high, Brix below range. Batch rejected." },
  { id: "QC004", batchId: "B-20260325-002", product: "Mango Tango 500ml", ph: null, brix: null, appearance: null, color: null, taste: null, result: "pending" as const, testedBy: null, date: null, notes: null },
  { id: "QC005", batchId: "B-20260327-001", product: "Mango Tango 1L", ph: null, brix: null, appearance: null, color: null, taste: null, result: "pending" as const, testedBy: null, date: null, notes: null },
];

// ── Finished Products ──
export const finishedProducts = [
  { id: "FP001", name: "Orange Blast 500ml", flavor: "Orange", size: "500ml", batch: "B-20260325-001", lotNumber: "LOT-OB500-001", stock: 2304, expiry: "2026-09-25", status: "available" as const, location: "Warehouse A", unitCost: 45 },
  { id: "FP002", name: "Passion Punch 1L", flavor: "Passion Fruit", size: "1L", batch: "B-20260324-001", lotNumber: "LOT-PP1L-001", stock: 940, expiry: "2026-09-24", status: "available" as const, location: "Warehouse A", unitCost: 85 },
  { id: "FP003", name: "Orange Blast 1L", flavor: "Orange", size: "1L", batch: "B-20260323-001", lotNumber: "LOT-OB1L-001", stock: 180, expiry: "2026-04-05", status: "near_expiry" as const, location: "Warehouse B", unitCost: 80 },
  { id: "FP004", name: "Tropical Mix 500ml", flavor: "Tropical", size: "500ml", batch: "B-20260320-001", lotNumber: "LOT-TM500-001", stock: 0, expiry: "2026-03-20", status: "expired" as const, location: "Warehouse B", unitCost: 50 },
  { id: "FP005", name: "Mango Tango 500ml", flavor: "Mango", size: "500ml", batch: "B-20260310-001", lotNumber: "LOT-MT500-001", stock: 1200, expiry: "2026-09-10", status: "available" as const, location: "Warehouse A", unitCost: 48 },
  { id: "FP006", name: "Pineapple Splash 500ml", flavor: "Pineapple", size: "500ml", batch: "B-20260315-001", lotNumber: "LOT-PS500-001", stock: 650, expiry: "2026-09-15", status: "available" as const, location: "Warehouse A", unitCost: 46 },
];

// ── Sales Orders ──
export const salesOrders = [
  { id: "SO-001", customer: "Naivas Supermarket", customerId: "CUS001", items: 3, products: [{ productId: "FP001", name: "Orange Blast 500ml", qty: 500, unitPrice: 55, total: 27500 }, { productId: "FP002", name: "Passion Punch 1L", qty: 200, unitPrice: 95, total: 19000 }], total: 45600, status: "delivered" as const, date: "2026-03-22", paymentMethod: "Bank Transfer", notes: "" },
  { id: "SO-002", customer: "Quickmart Ltd.", customerId: "CUS002", items: 2, products: [{ productId: "FP005", name: "Mango Tango 500ml", qty: 400, unitPrice: 58, total: 23200 }], total: 28400, status: "shipped" as const, date: "2026-03-24", paymentMethod: "Credit", notes: "Deliver to Westlands branch" },
  { id: "SO-003", customer: "Carrefour Kenya", customerId: "CUS003", items: 5, products: [{ productId: "FP001", name: "Orange Blast 500ml", qty: 800, unitPrice: 52, total: 41600 }, { productId: "FP006", name: "Pineapple Splash 500ml", qty: 600, unitPrice: 56, total: 33600 }], total: 72000, status: "confirmed" as const, date: "2026-03-25", paymentMethod: "Bank Transfer", notes: "" },
  { id: "SO-004", customer: "Chandarana Foodplus", customerId: "CUS004", items: 1, products: [{ productId: "FP002", name: "Passion Punch 1L", qty: 150, unitPrice: 90, total: 13500 }], total: 12800, status: "pending" as const, date: "2026-03-26", paymentMethod: "Cash", notes: "Awaiting confirmation" },
  { id: "SO-005", customer: "Tuskys Supermarket", customerId: "CUS005", items: 2, products: [{ productId: "FP005", name: "Mango Tango 500ml", qty: 300, unitPrice: 58, total: 17400 }], total: 17400, status: "pending" as const, date: "2026-03-27", paymentMethod: "Credit", notes: "" },
];

export const customers = [
  { id: "CUS001", name: "Naivas Supermarket", contact: "James Mwangi", phone: "+254 722 111 222", email: "procurement@naivas.co.ke", address: "Nairobi, Kenya", totalOrders: 24, lastOrder: "2026-03-22" },
  { id: "CUS002", name: "Quickmart Ltd.", contact: "Alice Wairimu", phone: "+254 733 222 333", email: "orders@quickmart.co.ke", address: "Nairobi, Kenya", totalOrders: 18, lastOrder: "2026-03-24" },
  { id: "CUS003", name: "Carrefour Kenya", contact: "Francis Otieno", phone: "+254 711 333 444", email: "supply@carrefour.co.ke", address: "Nairobi, Kenya", totalOrders: 31, lastOrder: "2026-03-25" },
  { id: "CUS004", name: "Chandarana Foodplus", contact: "Priya Patel", phone: "+254 722 444 555", email: "buying@chandarana.com", address: "Nairobi, Kenya", totalOrders: 12, lastOrder: "2026-03-26" },
  { id: "CUS005", name: "Tuskys Supermarket", contact: "Daniel Kiprop", phone: "+254 733 555 666", email: "orders@tuskys.com", address: "Nairobi, Kenya", totalOrders: 8, lastOrder: "2026-03-27" },
];

// ── Recipes ──
export const recipes = [
  { id: "RCP001", name: "Orange Blast", product: "Orange Blast 500ml", version: 3, status: "active" as const, costPerBatch: 4250, ingredients: [{ materialId: "RM001", name: "Orange Concentrate", qty: 50, unit: "Liters", percentage: 62.5 }, { materialId: "RM003", name: "Sugar (Refined)", qty: 10, unit: "Kg", percentage: 12.5 }, { materialId: "RM004", name: "Citric Acid", qty: 0.5, unit: "Kg", percentage: 0.6 }, { materialId: "RM008", name: "Preservative", qty: 0.2, unit: "Kg", percentage: 0.25 }], nutrition: { calories: 120, sugar: "28g", vitaminC: "45mg" }, notes: "Flagship orange juice recipe. Adjust citric acid for seasonal fruit variation.", createdBy: "Admin", lastModified: "2026-02-15" },
  { id: "RCP002", name: "Mango Tango", product: "Mango Tango 500ml", version: 2, status: "active" as const, costPerBatch: 5100, ingredients: [{ materialId: "RM002", name: "Mango Pulp", qty: 50, unit: "Kg", percentage: 55 }, { materialId: "RM003", name: "Sugar (Refined)", qty: 10, unit: "Kg", percentage: 11 }, { materialId: "RM004", name: "Citric Acid", qty: 0.3, unit: "Kg", percentage: 0.3 }], nutrition: { calories: 135, sugar: "32g", vitaminC: "25mg" }, notes: "Use ripe Alphonso mangoes for best flavor.", createdBy: "Admin", lastModified: "2026-01-20" },
  { id: "RCP003", name: "Passion Punch", product: "Passion Punch 1L", version: 1, status: "active" as const, costPerBatch: 6800, ingredients: [{ materialId: "RM005", name: "Passion Fruit Extract", qty: 100, unit: "Liters", percentage: 70 }, { materialId: "RM003", name: "Sugar (Refined)", qty: 10, unit: "Kg", percentage: 7 }], nutrition: { calories: 110, sugar: "26g", vitaminC: "55mg" }, notes: "High vitamin C content, premium line.", createdBy: "Admin", lastModified: "2026-03-01" },
  { id: "RCP004", name: "Tropical Mix", product: "Tropical Mix 500ml", version: 1, status: "active" as const, costPerBatch: 5500, ingredients: [{ materialId: "RM001", name: "Orange Concentrate", qty: 20, unit: "Liters", percentage: 25 }, { materialId: "RM009", name: "Pineapple Concentrate", qty: 20, unit: "Liters", percentage: 25 }, { materialId: "RM005", name: "Passion Fruit Extract", qty: 10, unit: "Liters", percentage: 12.5 }], nutrition: { calories: 125, sugar: "30g", vitaminC: "50mg" }, notes: "Blend of three tropical fruits.", createdBy: "Admin", lastModified: "2026-02-28" },
  { id: "RCP005", name: "Pineapple Splash", product: "Pineapple Splash 500ml", version: 1, status: "draft" as const, costPerBatch: 4800, ingredients: [{ materialId: "RM009", name: "Pineapple Concentrate", qty: 55, unit: "Liters", percentage: 65 }, { materialId: "RM003", name: "Sugar (Refined)", qty: 8, unit: "Kg", percentage: 9.5 }], nutrition: { calories: 118, sugar: "27g", vitaminC: "40mg" }, notes: "New recipe, pending approval.", createdBy: "Sarah Wanjiku", lastModified: "2026-03-25" },
];

// ── Suppliers ──
export const suppliers = [
  { id: "SUP001", name: "FreshFruit Co.", contact: "Mary Njoki", phone: "+254 722 100 200", email: "sales@freshfruit.co.ke", address: "Thika, Kenya", products: ["Orange Concentrate", "Pineapple Concentrate"], paymentTerms: "Net 30", status: "active" as const, rating: 4.5, onTimeDelivery: 92, qualityRating: 4.3, totalOrders: 48 },
  { id: "SUP002", name: "Tropical Imports", contact: "Alex Kamau", phone: "+254 733 200 300", email: "info@tropicalimports.co.ke", address: "Mombasa, Kenya", products: ["Mango Pulp", "Passion Fruit Extract"], paymentTerms: "Net 45", status: "active" as const, rating: 4.2, onTimeDelivery: 88, qualityRating: 4.5, totalOrders: 36 },
  { id: "SUP003", name: "SweetSource Ltd.", contact: "Peter Odhiambo", phone: "+254 711 300 400", email: "orders@sweetsource.co.ke", address: "Kisumu, Kenya", products: ["Sugar (Refined)"], paymentTerms: "Net 15", status: "active" as const, rating: 3.8, onTimeDelivery: 80, qualityRating: 4.0, totalOrders: 52 },
  { id: "SUP004", name: "ChemSupply Inc.", contact: "Diana Wambui", phone: "+254 722 400 500", email: "supply@chemsupply.co.ke", address: "Nairobi, Kenya", products: ["Citric Acid", "Preservative (Sodium Benzoate)"], paymentTerms: "Net 30", status: "active" as const, rating: 4.0, onTimeDelivery: 95, qualityRating: 4.2, totalOrders: 28 },
  { id: "SUP005", name: "PackRight Ltd.", contact: "Joseph Maina", phone: "+254 733 500 600", email: "sales@packright.co.ke", address: "Nairobi, Kenya", products: ["PET Bottles (500ml)", "PET Bottles (1L)"], paymentTerms: "Net 30", status: "active" as const, rating: 4.6, onTimeDelivery: 96, qualityRating: 4.7, totalOrders: 40 },
  { id: "SUP006", name: "PrintWorks Kenya", contact: "Lucy Adhiambo", phone: "+254 711 600 700", email: "print@printworks.co.ke", address: "Nairobi, Kenya", products: ["Labels (500ml)"], paymentTerms: "Net 15", status: "inactive" as const, rating: 3.2, onTimeDelivery: 70, qualityRating: 3.5, totalOrders: 15 },
];

export const supplierComms = [
  { id: "COM001", supplierId: "SUP001", type: "Email" as const, date: "2026-03-20", notes: "Confirmed delivery of 200L orange concentrate for March 20.", followUp: "2026-03-25" },
  { id: "COM002", supplierId: "SUP002", type: "Call" as const, date: "2026-03-18", notes: "Discussed pricing for Q2 mango pulp orders.", followUp: "2026-04-01" },
  { id: "COM003", supplierId: "SUP003", type: "Meeting" as const, date: "2026-03-15", notes: "Quarterly review meeting. Discussed improving delivery times.", followUp: null },
];

// ── Notifications ──
export const notifications = [
  { id: "N001", type: "low_stock" as const, title: "Low Stock: Sugar (Refined)", message: "Current stock 60 Kg is below minimum threshold of 100 Kg", date: "2026-03-26T08:30:00", read: false, severity: "critical" as const },
  { id: "N002", type: "near_expiry" as const, title: "Near Expiry: Orange Blast 1L", message: "LOT-OB1L-001 expires on 2026-04-05 (10 days remaining)", date: "2026-03-26T07:00:00", read: false, severity: "warning" as const },
  { id: "N003", type: "batch_complete" as const, title: "Batch Completed: B-20260325-001", message: "Orange Blast 500ml batch completed with 96% yield", date: "2026-03-25T16:00:00", read: true, severity: "success" as const },
  { id: "N004", type: "qc_due" as const, title: "QC Test Due: B-20260325-002", message: "Mango Tango 500ml batch awaiting quality control testing", date: "2026-03-25T14:00:00", read: false, severity: "info" as const },
  { id: "N005", type: "order_confirmed" as const, title: "Order Confirmed: SO-003", message: "Carrefour Kenya order for KES 72,000 confirmed", date: "2026-03-25T10:00:00", read: true, severity: "info" as const },
  { id: "N006", type: "new_order" as const, title: "New Order: SO-004", message: "Chandarana Foodplus placed order for KES 12,800", date: "2026-03-26T09:15:00", read: false, severity: "info" as const },
  { id: "N007", type: "low_stock" as const, title: "Stock Warning: PET Bottles (1L)", message: "Current stock 3100 approaching minimum threshold of 1500", date: "2026-03-26T06:00:00", read: true, severity: "warning" as const },
  { id: "N008", type: "batch_complete" as const, title: "Batch Completed: B-20260324-001", message: "Passion Punch 1L batch completed with 94% yield", date: "2026-03-24T17:30:00", read: true, severity: "success" as const },
];

// ── Users ──
export type UserRole = "administrator" | "production_manager" | "inventory_manager" | "qc_officer" | "sales_staff";

export const users = [
  { id: "USR001", name: "Admin User", email: "admin@whizupp.co.ke", phone: "+254 700 000 001", employeeId: "EMP001", department: "Management", role: "administrator" as UserRole, status: "active" as const, lastLogin: "2026-03-26T08:00:00", mfaEnabled: true },
  { id: "USR002", name: "John Kariuki", email: "john.kariuki@whizupp.co.ke", phone: "+254 700 000 002", employeeId: "EMP002", department: "Production", role: "production_manager" as UserRole, status: "active" as const, lastLogin: "2026-03-26T07:30:00", mfaEnabled: true },
  { id: "USR003", name: "Jane Akinyi", email: "jane.akinyi@whizupp.co.ke", phone: "+254 700 000 003", employeeId: "EMP003", department: "Inventory", role: "inventory_manager" as UserRole, status: "active" as const, lastLogin: "2026-03-25T16:00:00", mfaEnabled: false },
  { id: "USR004", name: "Grace Njeri", email: "grace.njeri@whizupp.co.ke", phone: "+254 700 000 004", employeeId: "EMP004", department: "Quality Control", role: "qc_officer" as UserRole, status: "active" as const, lastLogin: "2026-03-26T08:15:00", mfaEnabled: true },
  { id: "USR005", name: "David Omondi", email: "david.omondi@whizupp.co.ke", phone: "+254 700 000 005", employeeId: "EMP005", department: "Quality Control", role: "qc_officer" as UserRole, status: "active" as const, lastLogin: "2026-03-24T09:00:00", mfaEnabled: false },
  { id: "USR006", name: "Sarah Wanjiku", email: "sarah.wanjiku@whizupp.co.ke", phone: "+254 700 000 006", employeeId: "EMP006", department: "Sales", role: "sales_staff" as UserRole, status: "active" as const, lastLogin: "2026-03-26T09:00:00", mfaEnabled: false },
  { id: "USR007", name: "Peter Mwangi", email: "peter.mwangi@whizupp.co.ke", phone: "+254 700 000 007", employeeId: "EMP007", department: "Production", role: "production_manager" as UserRole, status: "inactive" as const, lastLogin: "2026-03-20T12:00:00", mfaEnabled: false },
];

// ── Audit Logs ──
export const auditLogs = [
  { id: "AUD001", user: "John Kariuki", action: "create" as const, module: "Production", record: "B-20260325-001", details: "Created batch for Orange Blast 500ml", timestamp: "2026-03-25T06:00:00", ip: "192.168.1.10" },
  { id: "AUD002", user: "Grace Njeri", action: "create" as const, module: "Quality Control", record: "QC001", details: "Recorded QC test for batch B-20260325-001", timestamp: "2026-03-25T14:30:00", ip: "192.168.1.15" },
  { id: "AUD003", user: "Jane Akinyi", action: "update" as const, module: "Raw Materials", record: "RM001", details: "Stock-in: 200 Liters of Orange Concentrate", timestamp: "2026-03-20T10:00:00", ip: "192.168.1.12" },
  { id: "AUD004", user: "Sarah Wanjiku", action: "create" as const, module: "Sales", record: "SO-003", details: "Created order for Carrefour Kenya", timestamp: "2026-03-25T09:00:00", ip: "192.168.1.20" },
  { id: "AUD005", user: "Admin User", action: "update" as const, module: "User Management", record: "USR007", details: "Deactivated user Peter Mwangi", timestamp: "2026-03-24T11:00:00", ip: "192.168.1.5" },
  { id: "AUD006", user: "David Omondi", action: "create" as const, module: "Quality Control", record: "QC003", details: "Recorded QC test (FAIL) for batch B-20260323-001", timestamp: "2026-03-23T15:00:00", ip: "192.168.1.16" },
  { id: "AUD007", user: "John Kariuki", action: "update" as const, module: "Production", record: "B-20260325-001", details: "Updated batch status to Completed, yield: 96%", timestamp: "2026-03-25T16:00:00", ip: "192.168.1.10" },
  { id: "AUD008", user: "Jane Akinyi", action: "create" as const, module: "Raw Materials", record: "PO-2026-009", details: "Created purchase order for PackRight Ltd.", timestamp: "2026-03-26T08:30:00", ip: "192.168.1.12" },
  { id: "AUD009", user: "Admin User", action: "login" as const, module: "Authentication", record: "USR001", details: "Successful login", timestamp: "2026-03-26T08:00:00", ip: "192.168.1.5" },
  { id: "AUD010", user: "Unknown", action: "login_failed" as const, module: "Authentication", record: "—", details: "Failed login attempt for admin@whizupp.co.ke", timestamp: "2026-03-26T03:12:00", ip: "41.89.225.100" },
];

export const loginActivity = [
  { id: "LA001", user: "Admin User", timestamp: "2026-03-26T08:00:00", ip: "192.168.1.5", device: "Chrome / Windows", status: "success" as const },
  { id: "LA002", user: "John Kariuki", timestamp: "2026-03-26T07:30:00", ip: "192.168.1.10", device: "Chrome / macOS", status: "success" as const },
  { id: "LA003", user: "Grace Njeri", timestamp: "2026-03-26T08:15:00", ip: "192.168.1.15", device: "Firefox / Windows", status: "success" as const },
  { id: "LA004", user: "Unknown", timestamp: "2026-03-26T03:12:00", ip: "41.89.225.100", device: "Chrome / Linux", status: "failed" as const },
  { id: "LA005", user: "Unknown", timestamp: "2026-03-26T03:13:00", ip: "41.89.225.100", device: "Chrome / Linux", status: "failed" as const },
  { id: "LA006", user: "Unknown", timestamp: "2026-03-26T03:14:00", ip: "41.89.225.100", device: "Chrome / Linux", status: "blocked" as const },
  { id: "LA007", user: "Sarah Wanjiku", timestamp: "2026-03-26T09:00:00", ip: "192.168.1.20", device: "Safari / macOS", status: "success" as const },
];

// ── Chart Data ──
export const productionChartData = [
  { day: "Mon", batches: 4, volume: 8200 },
  { day: "Tue", batches: 3, volume: 6800 },
  { day: "Wed", batches: 5, volume: 11200 },
  { day: "Thu", batches: 4, volume: 9400 },
  { day: "Fri", batches: 6, volume: 14500 },
  { day: "Sat", batches: 2, volume: 4000 },
  { day: "Sun", batches: 0, volume: 0 },
];

export const qcTrendData = [
  { week: "W1", passRate: 85, tests: 12 },
  { week: "W2", passRate: 78, tests: 14 },
  { week: "W3", passRate: 90, tests: 10 },
  { week: "W4", passRate: 75, tests: 16 },
];

export const salesChartData = [
  { month: "Jan", revenue: 280000 },
  { month: "Feb", revenue: 310000 },
  { month: "Mar", revenue: 420000 },
];

export const materialUsageData = [
  { name: "Orange Concentrate", used: 320, cost: 1120 },
  { name: "Mango Pulp", used: 170, cost: 884 },
  { name: "Sugar (Refined)", used: 82, cost: 90 },
  { name: "Passion Fruit Extract", used: 130, cost: 1014 },
  { name: "Citric Acid", used: 5, cost: 40 },
  { name: "PET Bottles (500ml)", used: 7200, cost: 1080 },
];

// ── Role config for sidebar filtering ──
export const roleMenuConfig: Record<UserRole, string[]> = {
  administrator: ["/", "/raw-materials", "/production", "/quality-control", "/finished-products", "/sales", "/recipes", "/suppliers", "/reports", "/notifications", "/users", "/security"],
  production_manager: ["/", "/raw-materials", "/production", "/quality-control", "/recipes", "/reports"],
  inventory_manager: ["/", "/raw-materials", "/finished-products", "/suppliers", "/reports"],
  qc_officer: ["/", "/quality-control", "/production", "/reports"],
  sales_staff: ["/", "/sales", "/finished-products", "/notifications"],
};

export const roleLabels: Record<UserRole, string> = {
  administrator: "Administrator",
  production_manager: "Production Manager",
  inventory_manager: "Inventory Manager",
  qc_officer: "QC Officer",
  sales_staff: "Sales Staff",
};
