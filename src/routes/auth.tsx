import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Terminal, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Identity Linker" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Authenticated");
      }
      navigate({ to: "/dashboard", search: { u: undefined } });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3 w-3" /> back
      </Link>
      <div className="w-full max-w-md bg-card border border-border rounded-md p-8 scanlines">
        <div className="flex items-center gap-2 font-mono font-bold mb-1">
          <Terminal className="h-4 w-4 text-primary" />
          <span>identity_linker</span><span className="text-primary">.auth</span>
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-6">
          {mode === "signin" ? "// authenticate to access console" : "// register new operator"}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] tracking-widest text-muted-foreground">EMAIL</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              placeholder="operator@domain.com"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-widest text-muted-foreground">PASSWORD</label>
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-input border border-border rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-mono text-sm font-semibold rounded-sm hover-glow disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : ">"}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full font-mono text-xs text-muted-foreground hover:text-primary"
        >
          {mode === "signin" ? "// no account? register" : "// have account? sign in"}
        </button>
      </div>
    </div>
  );
}
