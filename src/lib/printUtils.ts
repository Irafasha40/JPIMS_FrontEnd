/**
 * printUtils.ts
 * Helpers to open a styled browser print window for invoices and purchase orders.
 * The logo is passed in as a resolved asset URL (handled by the caller via Vite import).
 */

import logoUrl from "@/assets/whizupp-logo.png";

// ─── Core ─────────────────────────────────────────────────────────────────────

function openPrintWindow(htmlContent: string): void {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  // Let fonts / images settle then trigger print dialog
  setTimeout(() => {
    win.print();
  }, 500);
}

/**
 * Convert an image URL to a base64 data URL so it can be embedded in the
 * detached print window (which has no access to the Vite dev-server origin).
 */
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Page: zero browser margins so NO date / URL header/footer appears ── */
  @page {
    size: A4;
    margin: 0;
  }

  /* ── Body: we supply our own margins ── */
  body {
    font-family: 'Inter', sans-serif;
    color: #111827;
    background: #fff;
    padding: 36px 44px 44px;
    font-size: 13px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h1 { font-size: 22px; font-weight: 700; }
  h2 { font-size: 14px; font-weight: 600; }

  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: #6b7280; padding: 8px 10px;
    border-bottom: 2px solid #e5e7eb;
  }
  td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:last-child td { border-bottom: none; }

  .text-right  { text-align: right; }
  .text-center { text-align: center; }

  .badge {
    display: inline-block; padding: 2px 10px; border-radius: 9999px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
  }
  .badge-green  { background: #dcfce7; color: #166534; }
  .badge-blue   { background: #dbeafe; color: #1e40af; }
  .badge-yellow { background: #fef3c7; color: #92400e; }
  .badge-red    { background: #fee2e2; color: #991b1b; }

  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
  .footer   { margin-top: 36px; font-size: 11px; color: #9ca3af; text-align: center; }

  img.logo { height: 56px; width: auto; display: block; object-fit: contain; }
`;

// ─── Badge helpers ────────────────────────────────────────────────────────────

function invoiceStatusBadge(status: string): string {
  const map: Record<string, string> = {
    delivered: "badge-green",
    shipped: "badge-blue",
    confirmed: "badge-blue",
    pending: "badge-yellow",
    cancelled: "badge-red",
  };
  const cls = map[status] ?? "badge-blue";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge ${cls}">${label}</span>`;
}

function poStatusBadge(status: string): string {
  const map: Record<string, string> = {
    received: "badge-green",
    partial: "badge-yellow",
    cancelled: "badge-red",
    pending: "badge-blue",
  };
  const cls = map[status] ?? "badge-blue";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge ${cls}">${label}</span>`;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export interface InvoiceData {
  orderNumber: string;
  date: string;
  customer: string;
  paymentMethod: string;
  status: string;
  products: { name: string; qty: number; unitPrice: number; total: number }[];
  total: number;
  notes?: string;
}

export async function printInvoice(data: InvoiceData): Promise<void> {
  const logoSrc = await toDataUrl(logoUrl).catch(() => "");

  const rows = data.products
    .map(
      (p) => `
    <tr>
      <td>${p.name}</td>
      <td class="text-right">${p.qty.toLocaleString()}</td>
      <td class="text-right">RWF ${p.unitPrice.toLocaleString()}</td>
      <td class="text-right"><strong>RWF ${p.total.toLocaleString()}</strong></td>
    </tr>`
    )
    .join("");

  const notesRow = data.notes
    ? `<hr class="divider"/>
       <div>
         <h2>Notes</h2>
         <p style="margin-top:4px;color:#374151;">${data.notes}</p>
       </div>`
    : "";

  const logoHtml = logoSrc
    ? `<img class="logo" src="${logoSrc}" alt="Whizupp Logo"/>`
    : `<div style="font-size:22px;font-weight:800;color:#7c3aed;letter-spacing:-0.5px;">WHIZUPP</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${data.orderNumber}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
    <div>
      ${logoHtml}
      <p style="color:#6b7280;font-size:11px;margin-top:6px;">Juice Production &amp; Distribution</p>
      <p style="color:#6b7280;font-size:11px;">Kigali, Rwanda</p>
    </div>
    <div style="text-align:right;">
      <div style="font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">INVOICE</div>
      <p style="font-family:monospace;font-size:14px;font-weight:700;color:#7c3aed;margin-top:4px;">${data.orderNumber}</p>
      <p style="color:#6b7280;font-size:12px;margin-top:2px;">Date: ${data.date}</p>
      <p style="margin-top:6px;">${invoiceStatusBadge(data.status)}</p>
    </div>
  </div>

  <hr class="divider"/>

  <!-- Bill To / Payment -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
    <div>
      <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Bill To</p>
      <p style="font-size:15px;font-weight:600;">${data.customer}</p>
    </div>
    <div>
      <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Payment</p>
      <p style="font-size:13px;">${data.paymentMethod}</p>
      <p style="font-size:11px;color:#6b7280;margin-top:2px;">Terms: Net 30 days</p>
    </div>
  </div>

  <!-- Line Items -->
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Total -->
  <div style="display:flex;justify-content:flex-end;margin-top:16px;">
    <div style="min-width:260px;">
      <hr class="divider" style="margin:0 0 10px 0;"/>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#7c3aed;">
        <span>Grand Total</span>
        <span>RWF ${data.total.toLocaleString()}</span>
      </div>
    </div>
  </div>

  ${notesRow}

  <div class="footer">
    <hr class="divider"/>
    <p>Thank you for your business! — Whizupp Ltd &bull; Kigali, Rwanda</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}

// ─── Purchase Order ───────────────────────────────────────────────────────────

export interface PurchaseOrderPrintData {
  poNumber: string;
  supplier: string;
  expectedDate: string;
  status: string;
  total: number;
  notes?: string;
  items: { materialName: string; unitOfMeasure: string; quantity: number; unitCost: number; lineTotal: number }[];
}

export async function printPurchaseOrder(data: PurchaseOrderPrintData): Promise<void> {
  const logoSrc = await toDataUrl(logoUrl).catch(() => "");

  const rows = data.items
    .map(
      (it) => `
    <tr>
      <td>${it.materialName}</td>
      <td class="text-center">${it.unitOfMeasure || "—"}</td>
      <td class="text-right">${it.quantity.toLocaleString()}</td>
      <td class="text-right">RWF ${it.unitCost.toLocaleString()}</td>
      <td class="text-right"><strong>RWF ${it.lineTotal.toLocaleString()}</strong></td>
    </tr>`
    )
    .join("");

  const notesRow = data.notes
    ? `<hr class="divider"/>
       <div>
         <h2>Notes / Instructions</h2>
         <p style="margin-top:4px;color:#374151;">${data.notes}</p>
       </div>`
    : "";

  const logoHtml = logoSrc
    ? `<img class="logo" src="${logoSrc}" alt="Whizupp Logo"/>`
    : `<div style="font-size:22px;font-weight:800;color:#7c3aed;letter-spacing:-0.5px;">WHIZUPP</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Purchase Order ${data.poNumber}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
    <div>
      ${logoHtml}
      <p style="color:#6b7280;font-size:11px;margin-top:6px;">Juice Production &amp; Distribution</p>
      <p style="color:#6b7280;font-size:11px;">Kigali, Rwanda</p>
    </div>
    <div style="text-align:right;">
      <div style="font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">PURCHASE ORDER</div>
      <p style="font-family:monospace;font-size:14px;font-weight:700;color:#7c3aed;margin-top:4px;">${data.poNumber}</p>
      <p style="color:#6b7280;font-size:12px;margin-top:2px;">Expected: ${data.expectedDate}</p>
      <p style="margin-top:6px;">${poStatusBadge(data.status)}</p>
    </div>
  </div>

  <hr class="divider"/>

  <!-- Vendor / Ship To -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
    <div>
      <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Vendor / Supplier</p>
      <p style="font-size:15px;font-weight:600;">${data.supplier}</p>
    </div>
    <div>
      <p style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Ship To</p>
      <p style="font-size:13px;">Whizupp Ltd</p>
      <p style="font-size:11px;color:#6b7280;margin-top:2px;">Kigali, Rwanda</p>
    </div>
  </div>

  <!-- Line Items -->
  <table>
    <thead>
      <tr>
        <th>Material</th>
        <th class="text-center">Unit</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Cost</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Total -->
  <div style="display:flex;justify-content:flex-end;margin-top:16px;">
    <div style="min-width:260px;">
      <hr class="divider" style="margin:0 0 10px 0;"/>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#7c3aed;">
        <span>Order Total</span>
        <span>RWF ${data.total.toLocaleString()}</span>
      </div>
    </div>
  </div>

  ${notesRow}

  <!-- Signatures -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:52px;">
    <div>
      <hr class="divider"/>
      <p style="font-size:11px;color:#6b7280;margin-top:4px;">Authorized by — Whizupp Ltd</p>
    </div>
    <div>
      <hr class="divider"/>
      <p style="font-size:11px;color:#6b7280;margin-top:4px;">Acknowledged by — Supplier</p>
    </div>
  </div>

  <div class="footer">
    <hr class="divider"/>
    <p>Whizupp Ltd &bull; Kigali, Rwanda &bull; This document is computer-generated.</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

  openPrintWindow(html);
}
