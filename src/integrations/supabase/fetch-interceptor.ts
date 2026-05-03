// Attach Supabase access token to server function requests so
// `requireSupabaseAuth` middleware can validate the user.
import { supabase } from "./client";

let installed = false;

export function installAuthFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const orig = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : input.url;
      // TanStack Start server functions are served under /_serverFn or /_server
      const isServerFn =
        !!url &&
        (url.includes("/_serverFn") ||
          url.includes("/_server/") ||
          url.includes("_serverFn="));
      if (isServerFn) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
          if (!headers.has("authorization")) {
            headers.set("authorization", `Bearer ${token}`);
          }
          init = { ...init, headers };
        }
      }
    } catch {
      // ignore — fall through to original fetch
    }
    return orig(input as any, init);
  };
}
