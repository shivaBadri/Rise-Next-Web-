"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";

function Btn() { const { pending } = useFormStatus(); return <button className="btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>; }

export default function LoginPage() {
  const [state, action] = useFormState(loginAction, undefined);
  const next = useSearchParams().get("next") ?? "/admin";
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand p-4">
      <form action={action} className="card w-full max-w-sm p-6">
        <h1 className="font-display text-2xl">Rise Next Admin</h1>
        <p className="text-sm text-ink/60">Sign in to manage projects, inventory and leads.</p>
        <input type="hidden" name="next" value={next} />
        <div className="mt-5"><label className="label">Email</label><input name="email" type="email" required className="input" autoComplete="username" /></div>
        <div className="mt-3"><label className="label">Password</label><input name="password" type="password" required className="input" autoComplete="current-password" /></div>
        {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
        <div className="mt-5"><Btn /></div>
      </form>
    </main>
  );
}
