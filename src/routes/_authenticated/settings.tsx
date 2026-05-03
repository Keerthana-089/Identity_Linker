import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">// CONFIG</div>
        <h1 className="font-mono text-2xl font-bold">Settings</h1>
      </div>
      <div className="bg-card border border-border rounded-md p-6 space-y-4">
        <Field label="EMAIL" value={user?.email ?? ""} />
        <Field label="USER ID" value={user?.id ?? ""} mono />
        <Field label="LAST SIGN IN" value={user?.last_sign_in_at ?? ""} />
        <p className="font-mono text-[10px] text-muted-foreground pt-4 border-t border-border">
          // additional preferences coming soon
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 ${mono ? "font-mono text-xs" : "text-sm"} text-foreground break-all`}>{value || "—"}</div>
    </div>
  );
}
