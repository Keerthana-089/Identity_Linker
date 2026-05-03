import { useEffect, useState } from "react";

const PHRASES = [
  "Find the digital footprint of anyone",
  "Correlate identities across platforms",
  "Map the network behind the username",
];

export function TypingHero() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = PHRASES[phraseIdx];
    const speed = deleting ? 30 : 55;
    const t = setTimeout(() => {
      if (!deleting) {
        if (text.length < full.length) setText(full.slice(0, text.length + 1));
        else setTimeout(() => setDeleting(true), 1800);
      } else {
        if (text.length > 0) setText(full.slice(0, text.length - 1));
        else { setDeleting(false); setPhraseIdx((i) => (i + 1) % PHRASES.length); }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, phraseIdx]);

  return (
    <h1 className="font-mono text-4xl md:text-6xl font-bold tracking-tight cursor-blink text-foreground">
      <span className="text-primary">{">"} </span>{text}
    </h1>
  );
}
