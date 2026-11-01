import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import FormError from "@/components/ui/FormError";
import SelectField from "@/components/ui/SelectField";
import TextField from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { useAuth } from "@/features/auth/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatShortDate } from "@/lib/format";

const DATE_OPTIONS = [
  { value: "dd/mm/yyyy", label: "DD/MM/YYYY" },
  { value: "mm/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-mm-dd", label: "YYYY-MM-DD" },
];
const NUMBER_OPTIONS = [
  { value: "en-US", label: "1,234.56 (EN)" },
  { value: "bn-BD", label: "১,২৩৪.৫৬ (BN)" },
];

function strengthLabel(pw) {
  if (!pw) return "";
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return ["Weak", "Fair", "Good", "Strong"][Math.max(0, score - 1)] || "Weak";
}

export default function AccountSettingsPage() {
  usePageTitle("Account settings");
  const { user, logout, setUser, refreshUser } = useAuth();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [prefs, setPrefs] = useState({
    dateFormat: user?.preferences?.dateFormat || "dd/mm/yyyy",
    numberFormat: user?.preferences?.numberFormat || "en-US",
  });
  const [savingPw, setSavingPw] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api(API_ENDPOINTS.USERS_ME)
      .then((d) => {
        setProfile(d.user);
        setPrefs({
          dateFormat: d.user.preferences?.dateFormat || "dd/mm/yyyy",
          numberFormat: d.user.preferences?.numberFormat || "en-US",
        });
      })
      .catch(() => {});
  }, []);

  const strength = useMemo(() => strengthLabel(pw.next), [pw.next]);

  const changePassword = async () => {
    setError("");
    setMessage("");
    if (pw.next !== pw.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (pw.next.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSavingPw(true);
    try {
      await api(API_ENDPOINTS.USERS_ME_PASSWORD, {
        method: HTTP_METHODS.PATCH,
        body: { currentPassword: pw.current, newPassword: pw.next },
      });
      setPw({ current: "", next: "", confirm: "" });
      setMessage("Password updated.");
      await refreshUser();
    } catch (e) {
      setError(e.message || "Could not change password.");
    } finally {
      setSavingPw(false);
    }
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    setMessage("");
    try {
      const data = await api(API_ENDPOINTS.USERS_ME_PREFERENCES, {
        method: HTTP_METHODS.PATCH,
        body: prefs,
      });
      setUser(data.user);
      setMessage("Preferences saved.");
    } catch (e) {
      setError(e.message || "Could not save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const logoutAll = async () => {
    try {
      await api(API_ENDPOINTS.USERS_ME_LOGOUT_ALL, { method: HTTP_METHODS.POST });
    } finally {
      await logout();
    }
  };

  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Password, security, and display preferences.</p>

      <div className="mt-6 grid max-w-2xl gap-6">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Change password</h2>
          <div className="mt-3 space-y-3">
            <TextField
              label="Current password"
              type="password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            />
            <TextField
              label="New password"
              type="password"
              value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
            />
            {pw.next && <p className="text-xs text-muted-foreground">Strength: {strength}</p>}
            <TextField
              label="Confirm new password"
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            />
            <Button type="button" loading={savingPw} onClick={changePassword}>
              Update password
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Security</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Last login</dt>
              <dd>{profile?.lastLoginAt ? formatShortDate(profile.lastLoginAt) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Password last changed</dt>
              <dd>{profile?.passwordChangedAt ? formatShortDate(profile.passwordChangedAt) : "—"}</dd>
            </div>
          </dl>
          <Button type="button" variant="secondary" className="mt-4" onClick={logoutAll}>
            Log out of all devices
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Display preferences</h2>
          <div className="mt-3 space-y-3">
            <SelectField
              label="Date format"
              options={DATE_OPTIONS}
              value={prefs.dateFormat}
              onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))}
            />
            <SelectField
              label="Number format"
              options={NUMBER_OPTIONS}
              value={prefs.numberFormat}
              onChange={(e) => setPrefs((p) => ({ ...p, numberFormat: e.target.value }))}
            />
            <Button type="button" loading={savingPrefs} onClick={savePrefs}>
              Save preferences
            </Button>
          </div>
        </section>

        {error && <FormError>{error}</FormError>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
