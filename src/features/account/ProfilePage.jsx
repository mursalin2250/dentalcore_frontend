import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormError from "@/components/ui/FormError";
import Skeleton from "@/components/ui/Skeleton";
import TextField from "@/components/ui/TextField";
import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { useAuth } from "@/features/auth/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { WarningCircle } from "@phosphor-icons/react";

export default function ProfilePage() {
  usePageTitle("Profile");
  const { user, setUser, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", bio: "" });
  const [baseline, setBaseline] = useState({ name: "", phone: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(null);

  const dirty =
    form.name !== baseline.name || form.phone !== baseline.phone || form.bio !== baseline.bio;

  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    api(API_ENDPOINTS.USERS_ME, { signal: c.signal })
      .then((d) => {
        setProfile(d.user);
        const next = {
          name: d.user.name || "",
          phone: d.user.phone || "",
          bio: d.user.bio || "",
        };
        setForm(next);
        setBaseline(next);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = async () => {
    setError("");
    setMessage("");
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const data = await api(API_ENDPOINTS.USERS_ME, {
        method: HTTP_METHODS.PATCH,
        body: { name: form.name.trim(), phone: form.phone.trim(), bio: form.bio.trim() },
      });
      setProfile(data.user);
      setUser(data.user);
      setBaseline({ name: data.user.name, phone: data.user.phone || "", bio: data.user.bio || "" });
      setMessage("Profile saved.");
    } catch (e) {
      setError(e.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const onAvatarFile = async (file) => {
    if (!file) return;
    setError("");
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await api(API_ENDPOINTS.USERS_ME_AVATAR, {
          method: HTTP_METHODS.POST,
          body: { dataUrl: reader.result },
        });
        setProfile(data.user);
        setUser(data.user);
        setMessage("Avatar updated.");
      } catch (e) {
        setError(e.message || "Upload failed.");
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    try {
      const data = await api(API_ENDPOINTS.USERS_ME_AVATAR, { method: HTTP_METHODS.DELETE });
      setProfile(data.user);
      setUser(data.user);
      setMessage("Avatar removed.");
    } catch (e) {
      setError(e.message || "Could not remove avatar.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 py-4" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!profile && error) {
    return (
      <EmptyState
        icon={WarningCircle}
        title="Could not load profile"
        description={error}
        action={
          <Button variant="secondary" onClick={() => refreshUser()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your personal details shown across the clinic app.</p>

      <div className="mt-6 max-w-xl space-y-5 rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={profile?.name || user?.name} src={profile?.avatarUrl} className="size-16 text-lg" />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted">
              Upload
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => onAvatarFile(e.target.files?.[0])}
              />
            </label>
            {profile?.avatarUrl && (
              <Button type="button" variant="secondary" onClick={removeAvatar}>
                Remove
              </Button>
            )}
          </div>
        </div>

        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <TextField
          label="Bio"
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        />

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{profile?.email}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="capitalize">{profile?.role}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{profile?.createdAt ? formatShortDate(profile.createdAt) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Last login</dt>
            <dd>{profile?.lastLoginAt ? formatShortDate(profile.lastLoginAt) : "—"}</dd>
          </div>
          {profile?.staff && (
            <>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Employee ID</dt>
                <dd>{profile.staff.employeeId}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Designation</dt>
                <dd>{profile.staff.designation || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Shift</dt>
                <dd className="capitalize">{profile.staff.shift?.name || "—"}</dd>
              </div>
            </>
          )}
        </dl>

        {error && <FormError>{error}</FormError>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <Button type="button" loading={saving} disabled={!dirty} onClick={save}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
