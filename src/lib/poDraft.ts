/** Session draft when leaving Raw Materials → Suppliers to add a supplier for a PO. */
export const PO_DRAFT_STORAGE_KEY = "whizupp_po_draft";

export type PurchaseOrderDraftV1 = {
  v: 1;
  poOpen: boolean;
  mainTab: string;
  poSupplierId: string;
  poExpected: string;
  poMaterialId: string;
  poQty: string;
  poUnitCost: string;
  poNotes: string;
};

/** Session draft when leaving Raw Materials → Suppliers while adding a material. */
export const MATERIAL_ADD_DRAFT_STORAGE_KEY = "whizupp_material_add_draft";

export type MaterialAddDraftV1 = {
  v: 1;
  addOpen: boolean;
  mainTab: string;
  addName: string;
  addCategory: string;
  addUnit: string;
  addMin: string;
  addCost: string;
  addSupplierId: string;
  addStock: string;
};
