"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "linkvault.auth";
type User = { id: string; name: string; mobile_number: string };

type Mode = "view" | "editName" | "changePin";

export default function AccountPage() {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const [mode, setMode] = useState<Mode>("view");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit name
  const [name, setName] = useState("");

  // Change PIN
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  // Delete account confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const { token, user: u } = JSON.parse(raw) as {
          token: string;
          user: User;
        };
        setSessionToken(token);
        setUser(u);
        setName(u.name);
      } else {
        router.replace("/");
        return;
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  // Trap focus inside delete dialog and close on Escape
  useEffect(() => {
    if (!showDeleteConfirm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowDeleteConfirm(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showDeleteConfirm]);

  function goBack() {
    setMode("view");
    setError(null);
    setPinSuccess(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  }

  async function saveName() {
    if (!name.trim() || saving || !sessionToken) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Could not save");
        return;
      }
      const updated = { ...user!, name: name.trim() };
      setUser(updated);
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ token: sessionToken, user: updated }),
      );
      goBack();
    } finally {
      setSaving(false);
    }
  }

  async function changePin() {
    if (!currentPin || !newPin || !confirmPin || saving || !sessionToken)
      return;
    if (newPin !== confirmPin) {
      setError("New PINs do not match");
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      setError("PIN must be 4–6 digits");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Could not change PIN");
        return;
      }
      setPinSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setTimeout(() => goBack(), 1400);
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    if (sessionToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-session-token": sessionToken },
      }).catch(() => null);
    }
    localStorage.removeItem(AUTH_KEY);
    router.replace("/");
  }

  async function handleDeleteAccount() {
    if (!sessionToken || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "x-session-token": sessionToken },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setDeleteError(
          d.error || "Could not delete account. Please try again.",
        );
        return;
      }
      localStorage.removeItem(AUTH_KEY);
      router.replace("/");
    } finally {
      setDeleting(false);
    }
  }

  if (!ready || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <svg
          className="w-6 h-6 animate-spin text-stone-300"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <>
      {/* Delete confirmation dialog backdrop */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteConfirm(false);
          }}
        >
          <div
            ref={dialogRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
          >
            {/* Warning icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <h2
              id="delete-dialog-title"
              className="text-base font-semibold text-ink text-center mb-2"
            >
              Delete account permanently?
            </h2>
            <p
              id="delete-dialog-desc"
              className="text-sm text-muted text-center leading-relaxed mb-6"
            >
              All your saved links may not be retained once you confirm — they
              will be gone for good along with your account.{" "}
              <span className="font-medium text-ink">
                This cannot be undone.
              </span>
            </p>

            {deleteError && (
              <p className="text-xs text-red-500 text-center mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="w-full py-2.5 bg-stone-100 text-ink rounded-xl text-sm font-medium hover:bg-stone-200 disabled:opacity-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#fafaf9]">
        {/* Header */}
        <header
          className="sticky top-0 z-30 bg-white/80 border-b border-border"
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-stone-100 transition-colors"
              aria-label="Back to home"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-ink">
              Account Settings
            </h1>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink truncate">
                {user.name || "—"}
              </p>
              <p className="text-sm text-muted font-mono">
                {user.mobile_number}
              </p>
            </div>
          </div>

          {/* Edit name */}
          <section className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                  Name
                </p>
                <p className="text-sm text-ink">{user.name || "—"}</p>
              </div>
              {mode !== "editName" && (
                <button
                  onClick={() => {
                    setName(user.name);
                    setMode("editName");
                    setError(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {mode === "editName" && (
              <div className="p-5 flex flex-col gap-3 animate-slide-up">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") goBack();
                  }}
                  placeholder="Your name"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent transition-colors"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={goBack}
                    className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-ink hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveName}
                    disabled={saving || !name.trim()}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Change PIN */}
          <section className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                  PIN
                </p>
                <p className="text-sm text-ink">••••</p>
              </div>
              {mode !== "changePin" && (
                <button
                  onClick={() => {
                    setMode("changePin");
                    setError(null);
                    setPinSuccess(false);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            {mode === "changePin" && (
              <div className="p-5 flex flex-col gap-3 animate-slide-up">
                {pinSuccess ? (
                  <div className="py-4 text-center text-green-600 font-medium text-sm">
                    PIN updated ✓
                  </div>
                ) : (
                  <>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={currentPin}
                      onChange={(e) => {
                        setCurrentPin(e.target.value.replace(/\D/g, ""));
                        setError(null);
                      }}
                      placeholder="Current PIN"
                      autoFocus
                      className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent text-center tracking-[0.4em] transition-colors"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => {
                        setNewPin(e.target.value.replace(/\D/g, ""));
                        setError(null);
                      }}
                      placeholder="New PIN (4–6 digits)"
                      className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-accent text-center tracking-[0.4em] transition-colors"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => {
                        setConfirmPin(e.target.value.replace(/\D/g, ""));
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") changePin();
                      }}
                      placeholder="Confirm new PIN"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none text-center tracking-[0.4em] transition-colors ${
                        error
                          ? "border-red-400"
                          : "border-border focus:border-accent"
                      }`}
                    />
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={goBack}
                        className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-ink hover:bg-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={changePin}
                        disabled={
                          saving || !currentPin || !newPin || !confirmPin
                        }
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 active:scale-95 transition-all"
                      >
                        {saving ? "Updating…" : "Update PIN"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Mobile number (read-only) */}
          <section className="bg-white rounded-2xl border border-border px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
              Mobile
            </p>
            <p className="text-sm text-ink font-mono">{user.mobile_number}</p>
          </section>

          {/* Actions */}
          <section className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl border-2 border-red-500 text-red-500 text-sm font-semibold hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>

            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeleteError(null);
              }}
              className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Account
            </button>
          </section>
        </main>
      </div>
    </>
  );
}
