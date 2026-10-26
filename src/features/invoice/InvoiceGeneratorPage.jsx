import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Plus, Printer, Trash } from "@phosphor-icons/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import DateField from "@/components/ui/DateField";
import FormError from "@/components/ui/FormError";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { CURRENCY, CURRENCY_MINOR_UNIT } from "@/constants/locale";
import { ROUTES } from "@/constants/routes";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatMoney, formatShortDate } from "@/lib/format";
import { computeInvoiceTotals, lineSubtotal } from "@/lib/invoiceTotals";
import { buildInvoicePrintHtml, printInvoiceHtml } from "@/lib/printInvoice";

const takaToMinor = (v) => Math.round((Number(v) || 0) * CURRENCY_MINOR_UNIT);
const minorToTaka = (v) => (Number(v) || 0) / CURRENCY_MINOR_UNIT;

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function softInput(extra = "") {
  return `${INPUT_CLASS} border-border ${extra}`;
}

function emptyLine() {
  return {
    key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    quantity: 1,
    rateTaka: "",
  };
}

function PatientNameField({ value, onChange, onSelectPatient, options }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const q = value.trim().toLowerCase();
  const filtered = options.filter((o) => !q || o.label.toLowerCase().includes(q)).slice(0, 8);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium">Patient</label>
      <input
        className={softInput()}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type a name or search patients…"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-popover"
          role="listbox"
        >
          {filtered.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                onClick={() => {
                  onSelectPatient(o);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{o.label}</span>
                {o.meta && <span className="mt-0.5 block text-xs text-muted-foreground">{o.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InvoiceGeneratorPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  usePageTitle(isEdit ? "Edit invoice" : "Create invoice");
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [mobileTab, setMobileTab] = useState("form");
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientsMap, setPatientsMap] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [clinicName, setClinicName] = useState("DentalCore Clinic");
  const [clinicContact, setClinicContact] = useState("Clinic Admin");
  const [clinicAddress, setClinicAddress] = useState("House 12, Road 5");
  const [clinicCity, setClinicCity] = useState("Dhaka");
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(todayIso());
  const [lines, setLines] = useState([emptyLine()]);
  const [discountTaka, setDiscountTaka] = useState("");
  const [amountPaidTaka, setAmountPaidTaka] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Please make payment by the due date.");

  useEffect(() => {
    const c = new AbortController();
    api(API_ENDPOINTS.PATIENTS, { params: { limit: 50, sort: "-updatedAt" }, signal: c.signal })
      .then((d) => {
        const list = d.patients || [];
        setPatientOptions(
          list.map((p) => ({
            value: p.id,
            label: p.name,
            meta: [p.phone, p.address].filter(Boolean).join(" · "),
            raw: p,
          })),
        );
        setPatientsMap(Object.fromEntries(list.map((p) => [p.id, p])));
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          /* ignore list load errors */
        }
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    if (!isEdit) return undefined;
    const c = new AbortController();
    setLoading(true);
    setFormError("");
    api(API_ENDPOINTS.invoice(id), { signal: c.signal })
      .then((d) => {
        const inv = d.invoice || d;
        setPatientId(inv.patient?.id || "");
        setPatientName(inv.patient?.name || inv.patientName || "");
        setPatientPhone(inv.patientPhone || inv.patient?.phone || "");
        setPatientAddress(inv.patientAddress || inv.patient?.address || "");
        setInvoiceNumber(inv.invoiceNumber || "");
        setInvoiceDate(inv.createdAt ? String(inv.createdAt).slice(0, 10) : todayIso());
        setDueDate(inv.dueDate ? String(inv.dueDate).slice(0, 10) : todayIso());
        setNotes(inv.notes || "");
        setTerms(inv.terms || "Please make payment by the due date.");
        setLogoDataUrl(inv.logoDataUrl || "");
        setDiscountTaka(inv.discountMinor ? String(minorToTaka(inv.discountMinor)) : "");
        {
          const paidMinor = Number(inv.amountPaid) || 0;
          setAmountPaidTaka(String(minorToTaka(paidMinor)));
        }
        if (inv.lineItems?.length) {
          setLines(
            inv.lineItems.map((li) => ({
              key: li.id || emptyLine().key,
              description: li.description || "",
              quantity: li.quantity ?? 1,
              rateTaka: String(minorToTaka(li.rate)),
            })),
          );
        } else if (inv.treatment) {
          setLines([
            {
              key: emptyLine().key,
              description: inv.treatment,
              quantity: 1,
              rateTaka: String(minorToTaka(inv.totalCost)),
            },
          ]);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFormError(e.message || "Could not load invoice.");
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [id, isEdit]);

  const applyPatient = (patient) => {
    if (!patient) return;
    setPatientId(patient.id);
    setPatientName(patient.name || "");
    setPatientPhone(patient.phone || "");
    setPatientAddress(patient.address || "");
    // Treatment plan only — never use problem/complaint as the line item.
    const treatment = (patient.treatment || "").trim();
    const costTaka = minorToTaka(patient.treatmentCost || 0);
    const paidTaka = minorToTaka(patient.amountPaid || 0);
    setLines([
      {
        key: emptyLine().key,
        description: treatment,
        quantity: 1,
        rateTaka: costTaka > 0 ? String(costTaka) : "0",
      },
    ]);
    setAmountPaidTaka(String(paidTaka));
  };

  const totals = useMemo(() => {
    const items = lines.map((l) => ({
      quantity: Number(l.quantity) || 0,
      rate: takaToMinor(l.rateTaka),
    }));
    return computeInvoiceTotals(items, { discountMinor: takaToMinor(discountTaka) });
  }, [lines, discountTaka]);

  const amountDue = Math.max(0, totals.total - takaToMinor(amountPaidTaka));

  const buildSnapshot = () => ({
    invoiceNumber: invoiceNumber || "Draft",
    patientName,
    patientPhone,
    patientAddress,
    clinicName,
    clinicContact,
    clinicAddress,
    clinicCity,
    createdAt: invoiceDate,
    invoiceDate,
    dueDate,
    lineItems: lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity) || 0,
      rate: takaToMinor(l.rateTaka),
    })),
    discountMinor: takaToMinor(discountTaka),
    totalCost: totals.total,
    amountPaid: takaToMinor(amountPaidTaka),
    amountDue,
    notes,
    terms,
    treatment: lines.map((l) => l.description).filter(Boolean).join(", "),
  });

  const handlePrint = () => {
    // Snapshot current form values so edits appear on the PDF before/without save.
    const snapshot = buildSnapshot();
    printInvoiceHtml(
      `${snapshot.invoiceNumber || "Invoice"} | DentalCore`,
      buildInvoicePrintHtml(snapshot),
    );
  };

  const handleSave = async () => {
    setFormError("");
    if (!patientName.trim() && !patientId) {
      setFormError("Enter a patient name.");
      return;
    }
    const lineItems = lines
      .filter((l) => l.description.trim() || Number(l.rateTaka) > 0)
      .map((l) => ({
        description: l.description.trim(),
        quantity: Math.max(0, Math.round(Number(l.quantity) || 0)),
        rate: takaToMinor(l.rateTaka),
      }));
    if (!lineItems.length) {
      setFormError("Add at least one treatment line.");
      return;
    }
    const payload = {
      patient: patientId || null,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientAddress: patientAddress.trim(),
      lineItems,
      discountMinor: takaToMinor(discountTaka),
      terms: terms.trim(),
      notes: notes.trim(),
      logoDataUrl: logoDataUrl || "",
      dueDate: dueDate || null,
      totalCost: totals.total,
      treatment: lineItems.map((i) => i.description).filter(Boolean).join(", "),
      initialPayment: isEdit ? undefined : takaToMinor(amountPaidTaka),
    };
    setSaving(true);
    try {
      if (isEdit) {
        await api(API_ENDPOINTS.invoice(id), { method: HTTP_METHODS.PATCH, body: payload });
      } else {
        await api(API_ENDPOINTS.INVOICES, { method: HTTP_METHODS.POST, body: payload });
      }
      navigate(ROUTES.INVOICE);
    } catch (err) {
      if (err.name === "AbortError") return;
      const detail = err.fieldErrors ? Object.values(err.fieldErrors).join(" ") : "";
      setFormError(detail || err.message || "Could not save invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground" aria-busy="true">
        Loading invoice…
      </div>
    );
  }

  const formPanel = (
    <div className="space-y-6 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid size-20 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-muted text-muted-foreground hover:border-primary hover:text-primary"
          aria-label="Upload logo"
        >
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="" className="size-full object-contain" />
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto size-6" />
              <span className="mt-1 block text-[10px]">Upload</span>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || file.size > 1_000_000) return;
            const reader = new FileReader();
            reader.onload = () => setLogoDataUrl(String(reader.result || ""));
            reader.readAsDataURL(file);
          }}
        />
        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
          <input className={softInput()} value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Clinic name" />
          <input className={softInput()} value={clinicContact} onChange={(e) => setClinicContact(e.target.value)} placeholder="Contact" />
          <input className={`${softInput()} sm:col-span-2`} value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} placeholder="Address" />
          <input className={softInput()} value={clinicCity} onChange={(e) => setClinicCity(e.target.value)} placeholder="City" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <PatientNameField
            value={patientName}
            onChange={(name) => {
              setPatientName(name);
              setPatientId("");
            }}
            onSelectPatient={(o) => applyPatient(o.raw || patientsMap[o.value])}
            options={patientOptions}
          />
          <TextField
            label="Phone"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="Patient phone"
          />
          <TextField
            label="Address"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
            placeholder="Patient address"
          />
        </div>
        <div className="space-y-3">
          <TextField label="Invoice #" value={invoiceNumber || (isEdit ? "" : "Auto on save")} disabled onChange={() => {}} />
          <DateField label="Invoice date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          <DateField label="Due date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-muted-foreground">
              <th className="px-2 py-2 font-medium">Treatment</th>
              <th className="w-20 px-2 py-2 font-medium">Qty</th>
              <th className="w-28 px-2 py-2 font-medium">Rate</th>
              <th className="w-28 px-2 py-2 text-right font-medium">Total</th>
              <th className="w-10 px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const amt = lineSubtotal(Number(line.quantity) || 0, takaToMinor(line.rateTaka));
              return (
                <tr key={line.key} className="border-b border-border">
                  <td className="px-2 py-1.5">
                    <input
                      className={softInput("h-9")}
                      value={line.description}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l) => (l.key === line.key ? { ...l, description: e.target.value } : l)),
                        )
                      }
                      placeholder="Enter treatment"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      className={softInput("h-9 tabular-nums")}
                      value={line.quantity}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l) => (l.key === line.key ? { ...l, quantity: e.target.value } : l)),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      className={softInput("h-9 tabular-nums")}
                      value={line.rateTaka}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l) => (l.key === line.key ? { ...l, rateTaka: e.target.value } : l)),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium">{formatMoney(amt, CURRENCY)}</td>
                  <td className="px-1 py-1.5">
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-muted hover:text-danger"
                      onClick={() => setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== line.key)))}
                      aria-label="Remove line"
                    >
                      <Trash className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="secondary" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
        <Plus className="size-4" /> Add line item
      </Button>

      <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sub total</span>
          <span className="tabular-nums font-medium">{formatMoney(totals.subTotal, CURRENCY)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Discount</span>
          <input
            type="number"
            min={0}
            className={softInput("h-9 w-28 text-right tabular-nums")}
            value={discountTaka}
            onChange={(e) => setDiscountTaka(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Amount paid</span>
          <input
            type="number"
            min={0}
            className={softInput("h-9 w-28 text-right tabular-nums")}
            value={amountPaidTaka}
            onChange={(e) => setAmountPaidTaka(e.target.value)}
            disabled={isEdit}
            title={isEdit ? "Record payments from the invoice details modal" : undefined}
          />
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Amount due</span>
          <span className="tabular-nums font-medium">{formatMoney(amountDue, CURRENCY)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(totals.total, CURRENCY)}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Notes</label>
          <textarea className={softInput("min-h-[5rem] resize-y")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for the patient…" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Terms & conditions</label>
          <textarea className={softInput("min-h-[5rem] resize-y")} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms…" />
        </div>
      </div>

      {formError && <FormError>{formError}</FormError>}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.INVOICE)}>
          Cancel
        </Button>
        <Button type="button" variant="secondary" onClick={handlePrint}>
          <Printer className="size-4" /> Print
        </Button>
        <Button type="button" onClick={handleSave} loading={saving}>
          Save invoice
        </Button>
      </div>
    </div>
  );

  const preview = (
    <div className="rounded-xl border border-border bg-white p-6 text-[#14142b] shadow-card sm:p-8">
      <div className="flex justify-between gap-4">
        <div>
          <p className="font-semibold">{clinicName}</p>
          <p className="text-sm text-[#6e6e85]">{clinicContact}</p>
          <p className="text-sm text-[#6e6e85]">{clinicAddress}</p>
          <p className="text-sm text-[#6e6e85]">{clinicCity}</p>
        </div>
        <h2 className="text-3xl font-semibold tracking-wide">INVOICE</h2>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6e6e85]">Bill To</p>
          <p className="mt-1 font-medium">{patientName || "—"}</p>
          {patientPhone && <p className="text-sm text-[#6e6e85]">{patientPhone}</p>}
          {patientAddress && <p className="text-sm text-[#6e6e85]">{patientAddress}</p>}
        </div>
        <div className="space-y-1 text-sm sm:text-right">
          <p>
            <span className="text-[#6e6e85]">Invoice #: </span>
            <span className="tabular-nums">{invoiceNumber || "Draft"}</span>
          </p>
          <p>
            <span className="text-[#6e6e85]">Date: </span>
            <span className="tabular-nums">{invoiceDate ? formatShortDate(invoiceDate) : "—"}</span>
          </p>
          <p>
            <span className="text-[#6e6e85]">Due: </span>
            <span className="tabular-nums">{dueDate ? formatShortDate(dueDate) : "—"}</span>
          </p>
        </div>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="bg-[#14142b] text-white">
            <th className="px-3 py-2">Treatment</th>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">Rate</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const amt = lineSubtotal(Number(line.quantity) || 0, takaToMinor(line.rateTaka));
            if (!line.description && !line.rateTaka) return null;
            return (
              <tr key={line.key} className="border-b border-[#e8e8f0]">
                <td className="px-3 py-2">{line.description || "—"}</td>
                <td className="px-3 py-2 tabular-nums">{line.quantity}</td>
                <td className="px-3 py-2 tabular-nums">{formatMoney(takaToMinor(line.rateTaka), CURRENCY)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{formatMoney(amt, CURRENCY)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[#6e6e85]">Total</span>
          <span className="font-semibold tabular-nums">{formatMoney(totals.total, CURRENCY)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6e6e85]">Paid</span>
          <span className="tabular-nums">{formatMoney(takaToMinor(amountPaidTaka), CURRENCY)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6e6e85]">Due</span>
          <span className="tabular-nums font-medium">{formatMoney(amountDue, CURRENCY)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Edit invoice" : "Create invoice"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link to={ROUTES.INVOICE} className="text-primary hover:underline">
              Invoices
            </Link>
            <span> / </span>
            {isEdit ? "Edit" : "New"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1 lg:hidden">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${mobileTab === "form" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setMobileTab("form")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${mobileTab === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setMobileTab("preview")}
          >
            Preview
          </button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={mobileTab === "form" ? "block" : "hidden lg:block"}>{formPanel}</div>
        <div className={mobileTab === "preview" ? "block" : "hidden lg:block"}>
          <div className="lg:sticky lg:top-4">{preview}</div>
        </div>
      </div>
    </div>
  );
}
