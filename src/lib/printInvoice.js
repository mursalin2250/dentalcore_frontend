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
 * Invoice print layout. Always pass the latest form snapshot when printing from the generator.
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
    <header class="header">
      <div class="brand">
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
      ${phone ? `<div class="bill-detail">${escapeHtml(phone)}</div>` : ""}
      ${address ? `<div class="bill-detail">${escapeHtml(address)}</div>` : ""}
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
        <tr class="due-row">
          <td>Amount due</td>
          <td class="num right">${formatMoney(amountDue, CURRENCY)}</td>
        </tr>
      </table>
    </div>

    ${
      invoice.notes
        ? `<section class="notes-block">
      <div class="section-label">Notes</div>
      <div class="footer-text">${escapeHtml(invoice.notes)}</div>
    </section>`
        : ""
    }

    <div class="page-bottom">
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
      </footer>
    </div>
  </div>`;
}

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #fff;
    color: #14142b;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    max-width: 800px;
    margin: 0 auto;
    padding: 28px 32px 20px;
    background: #ffffff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .page-bottom {
    margin-top: auto;
    padding-top: 24px;
  }
  .notes-block { margin-top: 24px; }
  .header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 28px;
  }
  .brand-name { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
  .title-block { text-align: right; }
  .doc-title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #14142b;
    margin-bottom: 8px;
  }
  .meta { font-size: 13px; line-height: 1.7; }
  .meta strong { font-variant-numeric: tabular-nums; }
  .muted { color: #6e6e85; }

  .bill-to {
    margin-bottom: 24px;
    padding: 0;
    background: none;
    border: none;
  }
  .section-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6e6e85;
    margin-bottom: 6px;
  }
  .bill-name { font-size: 17px; font-weight: 600; line-height: 1.4; }
  .bill-detail { font-size: 14px; color: #4a4a5c; line-height: 1.5; margin-top: 2px; }

  .items {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 14px;
    border: 1px solid #c8c8d4;
    border-radius: 4px;
    overflow: hidden;
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
    border: 1px solid #14142b;
    border-radius: 0;
  }
  .items thead th:first-child { border-top-left-radius: 4px; }
  .items thead th:last-child { border-top-right-radius: 4px; }
  .items tbody tr:last-child .cell:first-child { border-bottom-left-radius: 4px; }
  .items tbody tr:last-child .cell:last-child { border-bottom-right-radius: 4px; }
  .items thead th.right { text-align: right; }
  .items .cell {
    padding: 16px;
    border: 1px solid #c8c8d4;
    vertical-align: middle;
    line-height: 1.45;
    font-size: 14px;
  }
  .num { font-variant-numeric: tabular-nums; }
  .right { text-align: right; }

  .summary-wrap { display: flex; justify-content: flex-end; margin-top: 20px; }
  .summary { width: 280px; font-size: 14px; border-collapse: collapse; margin-left: auto; }
  .summary td { padding: 8px 0; }
  .summary td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  .summary .due-row td {
    padding-top: 12px;
    border-top: 2px solid #14142b;
    font-weight: 700;
    font-size: 15px;
  }
  .summary .due-row td:last-child { text-align: right; }

  .footer-block { margin-bottom: 12px; }
  .footer-text { font-size: 13px; line-height: 1.5; white-space: pre-wrap; }

  .page-foot {
    margin-top: 0;
    padding-top: 12px;
    padding-bottom: 4px;
    border-top: 1px solid #e8e8f0;
    font-size: 13px;
    color: #14142b;
  }

  @media print {
    /* Zero page margin hides Chrome/Edge URL + date headers/footers */
    @page { margin: 0; size: auto; }
    body {
      background: #fff;
      padding: 14mm 12mm 12mm;
    }
    .sheet {
      margin: 0;
      max-width: none;
      padding: 0;
      min-height: calc(100vh - 26mm);
    }
    .items thead th {
      background: #14142b !important;
      color: #fff !important;
      border-color: #14142b !important;
    }
    .items, .items .cell { border-color: #c8c8d4 !important; }
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

  // Blank document title so the browser does not print "Draft | DentalCore" in the header.
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title></title>
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
  printInvoiceHtml("", buildInvoicePrintHtml(invoice));
}
