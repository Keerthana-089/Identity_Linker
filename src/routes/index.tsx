import { createFileRoute, Link } from "@tanstack/react-router";
import { TypingHero } from "@/components/identity/TypingHero";
import { Search, Network, ShieldAlert, GitMerge, Terminal, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Identity Linker — Cross-Platform OSINT Correlation" },
      { name: "description", content: "Find the digital footprint of anyone. Correlate identities across GitHub, Reddit, GitLab, Dev.to, StackOverflow and more." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Search, title: "OSINT Collection", desc: "Scan 8+ platforms in parallel for username and email signals." },
  { icon: GitMerge, title: "Fuzzy Matching", desc: "Score correlations on username, bio, email and location similarity." },
  { icon: Network, title: "Graph Visualization", desc: "Interactive D3 force graph maps the identity network." },
  { icon: ShieldAlert, title: "Breach Detection", desc: "Surface known leak patterns and exposed credentials." },
];

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* nav */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/60 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-mono font-bold">
            <Terminal className="h-4 w-4 text-primary" />
            <span>identity_linker</span>
            <span className="text-primary">.osint</span>
          </Link>
          <Link to="/auth" className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
            [ login ]
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {/* hero */}
        <section className="pt-20 pb-24 md:pt-32 md:pb-32">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 terminal-border rounded-sm font-mono text-[10px] tracking-widest text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-ring" />
              SYSTEM ONLINE · v0.1.0
            </div>
            <TypingHero />
            <p className="mt-6 max-w-2xl text-muted-foreground font-mono text-sm leading-relaxed">
              Cross-platform OSINT identity correlation for security researchers. Feed in a username,
              <span className="text-foreground"> get a graph </span>
              of every digital trace and connection across GitHub, Reddit, GitLab, Dev.to, StackOverflow,
              Keybase and more.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/auth"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-sm font-semibold rounded-sm hover-glow glow-primary"
              >
                {"> "} Start Investigating
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border font-mono text-sm rounded-sm hover-glow text-muted-foreground"
              >
                ./view_capabilities
              </a>
            </div>
          </motion.div>

          {/* terminal preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 bg-card border border-border rounded-md font-mono text-xs overflow-hidden scanlines"
          >
            <div className="border-b border-border px-4 py-2 flex items-center gap-2 bg-background/40">
              <span className="w-3 h-3 rounded-full bg-primary/60" />
              <span className="w-3 h-3 rounded-full bg-warning/40" />
              <span className="w-3 h-3 rounded-full bg-success/40" />
              <span className="ml-2 text-muted-foreground">~/investigations/recon.sh</span>
            </div>
            <pre className="p-5 leading-6 text-muted-foreground">
              <span className="text-primary">$</span> identity-linker scan --user "<span className="text-foreground">octocat</span>"{"\n"}
              <span className="text-success">[✓]</span> github.com/octocat — display: The Octocat — SF{"\n"}
              <span className="text-success">[✓]</span> gitlab.com/octocat — public repos · 12{"\n"}
              <span className="text-success">[✓]</span> dev.to/octocat — bio match: 0.84{"\n"}
              <span className="text-success">[✓]</span> stackoverflow.com/u/octocat — rep: 4.2k{"\n"}
              <span className="text-warning">[~]</span> twitter.com — checking…{"\n"}
              <span className="text-primary">{"->"}</span> 4 high-confidence correlations · graph rendered
            </pre>
          </motion.div>
        </section>

        {/* features */}
        <section id="features" className="pb-24">
          <div className="font-mono text-xs text-muted-foreground tracking-widest mb-6">// CAPABILITIES</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-card border border-border rounded-md p-5 hover-glow group"
              >
                <f.icon className="h-6 w-6 text-primary mb-4 group-hover:glow-text" />
                <h3 className="font-mono font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="pb-32">
          <div className="terminal-border rounded-md p-10 text-center bg-card/40">
            <h2 className="font-mono text-2xl md:text-3xl font-bold mb-3">Ready to map an identity?</h2>
            <p className="text-muted-foreground font-mono text-sm mb-6">
              Sign in and run your first investigation in under 30 seconds.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-sm font-semibold rounded-sm hover-glow glow-primary"
            >
              {"> "} Launch console <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-6 font-mono text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>identity_linker · for authorized research only</span>
          <span className="text-primary/60">{"// status: nominal"}</span>
        </div>
      </footer>
    </div>
  );
}
