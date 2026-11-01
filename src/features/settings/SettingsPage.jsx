import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import SelectField from "@/components/ui/SelectField";
import Skeleton from "@/components/ui/Skeleton";
import TextField, { INPUT_CLASS } from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { ROLES } from "@/constants/roles";
import { ACCENT_PRESETS, DEFAULT_ACCENT_ID, THEMES } from "@/constants/theme";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { WarningCircle } from "@phosphor-icons/react";

const SECTIONS = [
  { id: "appearance", label: "Appearance", adminOnly: false },
  { id: "clinic", label: "Clinic", adminOnly: true },
  { id: "hours", label: "Hours & appointments", adminOnly: true },
  { id: "billing", label: "Billing", adminOnly: true },
  { id: "inventory", label: "Inventory", adminOnly: true },
  { id: "data", label: "Data", adminOnly: true },
];

const WEEKDAYS = [
  { v: 0, l: "Sun" },
  { v: 1, l: "Mon" },
  { v: 2, l: "Tue" },
  { v: 3, l: "Wed" },
  { v: 4, l: "Thu" },
  { v: 5, l: "Fri" },
  { v: 6, l: "Sat" },
];

const MODE_OPTIONS = [
  { value: THEMES.LIGHT, label: "Light" },
  { value: THEMES.DARK, label: "Dark" },
  { value: THEMES.SYSTEM, label: "System" },
];

export default function SettingsPage() {
  usePageTitle("Settings");
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const { mode, setMode, accentId, setAccentId } = useTheme();
  const [section, setSection] = useState("appearance");
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [appearanceDraft, setAppearanceDraft] = useState({ mode, accentId });

  const load = () => {
    setLoading(true);
    setError(null);
    api(API_ENDPOINTS.SETTINGS)
      .then((d) => {
        setSettings(d.settings);
        setDraft(structuredClone(d.settings));
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setAppearanceDraft({ mode, accentId });
  }, [mode, accentId]);

  const visibleSections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);

  const saveAppearance = async () => {
    setSaving(true);
    setMessage("");
    try {
      setMode(appearanceDraft.mode);
      setAccentId(appearanceDraft.accentId);
      await api(API_ENDPOINTS.USERS_ME_PREFERENCES, {
        method: HTTP_METHODS.PATCH,
        body: { appearance: { mode: appearanceDraft.mode, accentId: appearanceDraft.accentId } },
      });
      await refreshUser();
      setMessage("Appearance saved.");
    } catch (e) {
      setMessage(e.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const resetAppearance = () => {
    setAppearanceDraft({ mode: THEMES.SYSTEM, accentId: DEFAULT_ACCENT_ID });
    setMode(THEMES.SYSTEM);
    setAccentId(DEFAULT_ACCENT_ID);
  };

  const saveSection = async (key) => {
    if (!isAdmin || !draft) return;
    setSaving(true);
    setMessage("");
    try {
      const body = { [key]: draft[key] };
      const data = await api(API_ENDPOINTS.SETTINGS, { method: HTTP_METHODS.PATCH, body });
      setSettings(data.settings);
      setDraft(structuredClone(data.settings));
      setMessage("Settings saved.");
    } catch (e) {
      setMessage(e.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async (collection, format) => {
    try {
      if (format === "json") {
        const data = await api(API_ENDPOINTS.settingsExport(collection), { params: { format: "json" } });
        const blob = new Blob([JSON.stringify(data.rows || [], null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${collection}.json`;
        a.click();
      } else {
        // CSV via fetch with credentials
        const res = await fetch(`/api/v1/settings/export/${collection}?format=csv`, { credentials: "include" });
        const text = await res.text();
        const blob = new Blob([text], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${collection}.csv`;
        a.click();
      }
    } catch (e) {
      setMessage(e.message || "Export failed.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={WarningCircle}
        title="Could not load settings"
        description={error.message}
        action={
          <Button variant="secondary" onClick={load}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Appearance, clinic, and clinic-wide defaults.</p>
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
      {settings?.updatedAt && (
        <p className="mt-1 text-xs text-muted-foreground">
          Last updated {new Date(settings.updatedAt).toLocaleString()}
          {settings.updatedBy?.name ? ` by ${settings.updatedBy.name}` : ""}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible" aria-label="Settings sections">
          {visibleSections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                section === s.id ? "bg-primary-soft text-foreground" : "text-muted-foreground hover:bg-surface-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface p-5 shadow-card">
          {section === "appearance" && (
            <div className="space-y-4">
              <h2 className="font-semibold">Appearance</h2>
              <SelectField
                label="Mode"
                options={MODE_OPTIONS}
                value={appearanceDraft.mode}
                onChange={(e) => {
                  const next = e.target.value;
                  setAppearanceDraft((d) => ({ ...d, mode: next }));
                  setMode(next);
                }}
              />
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Accent color</legend>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={p.label}
                      aria-label={p.label}
                      aria-pressed={appearanceDraft.accentId === p.id}
                      onClick={() => {
                        setAppearanceDraft((d) => ({ ...d, accentId: p.id }));
                        setAccentId(p.id);
                      }}
                      className={`size-9 rounded-full border-2 ${
                        appearanceDraft.accentId === p.id ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ background: p.light }}
                    />
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <Button type="button" loading={saving} onClick={saveAppearance}>
                  Save
                </Button>
                <Button type="button" variant="secondary" onClick={resetAppearance}>
                  Reset to default
                </Button>
              </div>
            </div>
          )}

          {section === "clinic" && draft && (
            <div className="space-y-3">
              <h2 className="font-semibold">Clinic</h2>
              {!isAdmin && <p className="text-sm text-muted-foreground">Read-only for your role.</p>}
              {["name", "address", "phone", "email", "website", "logoUrl", "registrationNo"].map((field) => (
                <TextField
                  key={field}
                  label={field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                  value={draft.clinic?.[field] || ""}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, clinic: { ...d.clinic, [field]: e.target.value } }))
                  }
                />
              ))}
              {isAdmin && (
                <Button type="button" loading={saving} onClick={() => saveSection("clinic")}>
                  Save
                </Button>
              )}
            </div>
          )}

          {section === "hours" && draft && (
            <div className="space-y-3">
              <h2 className="font-semibold">Working hours</h2>
              <fieldset disabled={!isAdmin}>
                <legend className="mb-2 text-sm font-medium">Working days</legend>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => {
                    const checked = (draft.hours?.workingDays || []).includes(d.v);
                    return (
                      <label key={d.v} className="inline-flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={checked}
                          onChange={() => {
                            setDraft((prev) => {
                              const set = new Set(prev.hours.workingDays || []);
                              if (checked) set.delete(d.v);
                              else set.add(d.v);
                              return {
                                ...prev,
                                hours: { ...prev.hours, workingDays: [...set].sort((a, b) => a - b) },
                              };
                            });
                          }}
                        />
                        {d.l}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Open"
                  value={draft.hours?.openTime || ""}
                  disabled={!isAdmin}
                  onChange={(e) => setDraft((d) => ({ ...d, hours: { ...d.hours, openTime: e.target.value } }))}
                />
                <TextField
                  label="Close"
                  value={draft.hours?.closeTime || ""}
                  disabled={!isAdmin}
                  onChange={(e) => setDraft((d) => ({ ...d, hours: { ...d.hours, closeTime: e.target.value } }))}
                />
                <TextField
                  label="Default duration (min)"
                  type="number"
                  value={draft.hours?.defaultDurationMinutes ?? 30}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hours: { ...d.hours, defaultDurationMinutes: Number(e.target.value) || 30 },
                    }))
                  }
                />
                <TextField
                  label="Slot interval (min)"
                  type="number"
                  value={draft.hours?.slotIntervalMinutes ?? 15}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hours: { ...d.hours, slotIntervalMinutes: Number(e.target.value) || 15 },
                    }))
                  }
                />
              </div>
              {isAdmin && (
                <Button type="button" loading={saving} onClick={() => saveSection("hours")}>
                  Save
                </Button>
              )}
            </div>
          )}

          {section === "billing" && draft && (
            <div className="space-y-3">
              <h2 className="font-semibold">Billing</h2>
              <TextField
                label="Invoice prefix"
                value={draft.billing?.invoicePrefix || ""}
                disabled={!isAdmin}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, billing: { ...d.billing, invoicePrefix: e.target.value } }))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Tax label"
                  value={draft.billing?.taxLabel || ""}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, billing: { ...d.billing, taxLabel: e.target.value } }))
                  }
                />
                <TextField
                  label="Tax rate %"
                  type="number"
                  value={draft.billing?.taxRate ?? 0}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, billing: { ...d.billing, taxRate: Number(e.target.value) || 0 } }))
                  }
                />
              </div>
              <TextField
                label="Default terms"
                value={draft.billing?.defaultTerms || ""}
                disabled={!isAdmin}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, billing: { ...d.billing, defaultTerms: e.target.value } }))
                }
              />
              <TextField
                label="Overdue days"
                type="number"
                value={draft.billing?.overdueDays ?? 30}
                disabled={!isAdmin}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    billing: { ...d.billing, overdueDays: Number(e.target.value) || 30 },
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Currency: {draft.billing?.currency || "BDT"} · Timezone: {draft.billing?.timezone || "Asia/Dhaka"}
              </p>
              {isAdmin && (
                <Button type="button" loading={saving} onClick={() => saveSection("billing")}>
                  Save
                </Button>
              )}
            </div>
          )}

          {section === "inventory" && draft && (
            <div className="space-y-3">
              <h2 className="font-semibold">Inventory</h2>
              <TextField
                label="Default reorder level"
                type="number"
                value={draft.inventory?.defaultReorderLevel ?? 10}
                disabled={!isAdmin}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    inventory: { ...d.inventory, defaultReorderLevel: Number(e.target.value) || 0 },
                  }))
                }
              />
              <TextField
                label="Expiring soon (days)"
                type="number"
                value={draft.inventory?.expiringSoonDays ?? 30}
                disabled={!isAdmin}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    inventory: { ...d.inventory, expiringSoonDays: Number(e.target.value) || 30 },
                  }))
                }
              />
              {isAdmin && (
                <Button type="button" loading={saving} onClick={() => saveSection("inventory")}>
                  Save
                </Button>
              )}
            </div>
          )}

          {section === "data" && isAdmin && (
            <div className="space-y-3">
              <h2 className="font-semibold">Export data</h2>
              <p className="text-sm text-muted-foreground">Download up to 5,000 rows per collection.</p>
              {["patients", "appointments", "invoices", "medications", "stockMovements"].map((c) => (
                <div key={c} className="flex flex-wrap items-center gap-2">
                  <span className="w-40 text-sm font-medium capitalize">{c}</span>
                  <Button type="button" variant="secondary" onClick={() => exportData(c, "json")}>
                    JSON
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => exportData(c, "csv")}>
                    CSV
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
