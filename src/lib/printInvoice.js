import { CURRENCY } from "@/constants/locale";
import { formatMoney, formatShortDate } from "@/lib/format";
import { computeInvoiceTotals, lineSubtotal } from "@/lib/invoiceTotals";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Professional print layout aligned with DentalCore theme tokens
 * (primary #6d4ae5, ink #14142b, muted #6e6e85, border #e8e8f0).
 * Always pass the latest form snapshot when printing from the generator.
 */
export function buildInvoicePrintHtml(invoice) {
  const name = invoice.patientName || invoice.patient?.name || "—";
  const phone = invoice.patientPhone || invoice.patient?.phone || "";
  const address = invoice.patientAddress || invoice.patient?.address || "";
  const clinicName = invoice.clinicName || "DentalCore Clinic";
  const clinicContact = invoice.clinicContact || "";
  const clinicAddress = invoice.clinicAddress || "";
  const clinicCity = invoice.clinicCity || "Dhaka, Bangladesh";

  const lines = (invoice.lineItems || []).length
    ? invoice.lineItems
    : [
        {
          description: invoice.treatment || "Treatment",
          quantity: 1,
          rate: Number(invoice.totalCost) || 0,
        },
      ];

  const totals = computeInvoiceTotals(lines, {
    discountMinor: Number(invoice.discountMinor) || 0,
  });
  const totalCost = Number(invoice.totalCost) || totals.total;
  const amountPaid = Number(invoice.amountPaid) || 0;
  const amountDue =
    invoice.amountDue != null
      ? Number(invoice.amountDue)
      : Math.max(0, totalCost - amountPaid);

  const rows = lines
    .map((item) => {
      const amt = lineSubtotal(item.quantity, item.rate);
      return `<tr>
        <td class="cell">${escapeHtml(item.description || "—")}</td>
        <td class="cell num">${item.quantity ?? 0}</td>
        <td class="cell num">${formatMoney(item.rate, CURRENCY)}</td>
        <td class="cell num right">${formatMoney(amt, CURRENCY)}</td>
      </tr>`;
    })
    .join("");

  return `
  <div class="sheet">
    <div class="accent-bar"></div>
    <header class="header">
      <div class="brand">
        <div class="brand-mark">DC</div>
        <div>
          <div class="brand-name">${escapeHtml(clinicName)}</div>
          ${clinicContact ? `<div class="muted">${escapeHtml(clinicContact)}</div>` : ""}
          ${clinicAddress ? `<div class="muted">${escapeHtml(clinicAddress)}</div>` : ""}
          ${clinicCity ? `<div class="muted">${escapeHtml(clinicCity)}</div>` : ""}
        </div>
      </div>
      <div class="title-block">
        <div class="doc-title">INVOICE</div>
        <div class="meta">
          <div><span class="muted">Invoice #</span> <strong>${escapeHtml(invoice.invoiceNumber || "—")}</strong></div>
          <div><span class="muted">Date</span> ${invoice.createdAt || invoice.invoiceDate ? formatShortDate(invoice.createdAt || invoice.invoiceDate) : "—"}</div>
          <div><span class="muted">Due</span> ${invoice.dueDate ? formatShortDate(invoice.dueDate) : "—"}</div>
        </div>
      </div>
    </header>

    <section class="bill-to">
      <div class="section-label">Bill to</div>
      <div class="bill-name">${escapeHtml(name)}</div>
      ${phone ? `<div class="muted">${escapeHtml(phone)}</div>` : ""}
      ${address ? `<div class="muted">${escapeHtml(address)}</div>` : ""}
    </section>

    <table class="items">
      <thead>
        <tr>
          <th>Treatment</th>
          <th class="num">Qty</th>
          <th class="num">Rate</th>
          <th class="num right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td class="cell muted" colspan="4">No treatments listed</td></tr>`}
      </tbody>
    </table>

    <div class="summary-wrap">
      <table class="summary">
        <tr>
          <td class="muted">Sub total</td>
          <td class="num right">${formatMoney(totals.subTotal, CURRENCY)}</td>
        </tr>
        ${
          totals.discountMinor > 0
            ? `<tr>
          <td class="muted">Discount</td>
          <td class="num right">−${formatMoney(totals.discountMinor, CURRENCY)}</td>
        </tr>`
            : ""
        }
        <tr>
          <td class="muted">Amount paid</td>
          <td class="num right">${formatMoney(amountPaid, CURRENCY)}</td>
        </tr>
        <tr>
          <td class="muted">Amount due</td>
          <td class="num right">${formatMoney(amountDue, CURRENCY)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td class="num right">${formatMoney(totalCost, CURRENCY)}</td>
        </tr>
      </table>
    </div>

    ${
      invoice.notes
        ? `<section class="footer-block">
      <div class="section-label">Notes</div>
      <div class="footer-text">${escapeHtml(invoice.notes)}</div>
    </section>`
        : ""
    }
    ${
      invoice.terms
        ? `<section class="footer-block">
      <div class="section-label">Terms & conditions</div>
      <div class="footer-text">${escapeHtml(invoice.terms)}</div>
    </section>`
        : ""
    }

    <footer class="page-foot">
      <span>Thank you for choosing ${escapeHtml(clinicName)}</span>
      <span class="muted">Generated with DentalCore</span>
    </footer>
  </div>`;
}

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f6f6f9;
    color: #14142b;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    position: relative;
    max-width: 800px;
    margin: 24px auto;
    padding: 40px 44px 32px;
    background: #ffffff;
    border: 1px solid #e8e8f0;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(20, 20, 43, 0.06);
  }
  .accent-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, #6d4ae5, #8b6cf0);
    border-radius: 16px 16px 0 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 32px;
  }
  .brand { display: flex; gap: 14px; align-items: flex-start; }
  .brand-mark {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: #6d4ae5;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .brand-name { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
  .title-block { text-align: right; }
  .doc-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #14142b;
    margin-bottom: 10px;
  }
  .meta { font-size: 13px; line-height: 1.7; }
  .meta strong { font-variant-numeric: tabular-nums; }
  .muted { color: #6e6e85; }
  .bill-to {
    background: #f2eefe;
    border: 1px solid #e8e8f0;
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 28px;
  }
  .section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6d4ae5;
    margin-bottom: 6px;
  }
  .bill-name { font-size: 16px; font-weight: 600; }
  .items {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .items thead th {
    background: #14142b;
    color: #ffffff;
    text-align: left;
    padding: 14px 16px;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .items thead th:first-child { border-radius: 10px 0 0 0; }
  .items thead th:last-child { border-radius: 0 10px 0 0; }
  .items .cell {
    padding: 16px 16px;
    border-bottom: 1px solid #e8e8f0;
    vertical-align: middle;
    line-height: 1.45;
  }
  .items tbody tr:last-child .cell { border-bottom: none; }
  .items tbody tr:nth-child(even) .cell { background: #fafafc; }
  .num { font-variant-numeric: tabular-nums; }
  .right { text-align: right; }
  .summary-wrap { display: flex; justify-content: flex-end; margin-top: 20px; }
  .summary { width: 280px; font-size: 14px; border-collapse: collapse; }
  .summary td { padding: 8px 0; }
  .summary .total-row td {
    padding-top: 12px;
    margin-top: 4px;
    border-top: 2px solid #14142b;
    font-weight: 700;
    font-size: 15px;
  }
  .footer-block { margin-top: 28px; }
  .footer-text { font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
  .page-foot {
    margin-top: 36px;
    padding-top: 16px;
    border-top: 1px solid #e8e8f0;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    color: #14142b;
  }
  @media print {
    body { background: #fff; }
    .sheet {
      margin: 0;
      max-width: none;
      border: none;
      border-radius: 0;
      box-shadow: none;
      padding: 28px 32px;
    }
    .accent-bar { border-radius: 0; }
    .items thead th { background: #14142b !important; color: #fff !important; }
    .bill-to { background: #f2eefe !important; }
    .items tbody tr:nth-child(even) .cell { background: #fafafc !important; }
  }
`;

/** Print via hidden iframe — no pop-up required. Uses current HTML snapshot. */
export function printInvoiceHtml(title, innerHtml) {
  const existing = document.getElementById("invoice-print-frame");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "invoice-print-frame";
  iframe.setAttribute("title", title || "Invoice");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    window.alert("Could not prepare the print view.");
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
    <style>${PRINT_CSS}</style></head><body>${innerHtml}</body></html>`);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => iframe.remove(), 800);
    }
  }, 150);
}

export function printInvoice(invoice) {
  printInvoiceHtml(
    `${invoice.invoiceNumber || "Invoice"} | DentalCore`,
    buildInvoicePrintHtml(invoice),
  );
}
