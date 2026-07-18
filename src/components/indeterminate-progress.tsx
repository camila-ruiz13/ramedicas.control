"use client";

import { useEffect, useState } from "react";

const DEFAULT_MESSAGES = [
  "Procesando tu archivo...",
  "Contando ovejitas... 1, 2, 3... 🐑",
  "Despertando a los servidores ☕",
  "Alineando los planetas 🪐",
  "¿Por qué los programadores prefieren el modo oscuro? Porque la luz atrae bugs 🐛",
  "Convenciendo a Excel de que coopere 📊",
  "Buscando WiFi en la nube ☁️",
  "Espantando bugs con una escoba 🧹",
  "Preguntándole a la IA si ya casi termina 🤖",
  "Cargando... cargando... ¡ya casi! 😅",
];

// Reusable fun indeterminate progress bar with rotating messages — use this
// for any long-running import/process where there's no real byte progress
// to report, instead of a plain disabled button.
export function IndeterminateProgress({
  messages = DEFAULT_MESSAGES,
  intervalMs = 2200,
}: {
  messages?: string[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [messages.length, intervalMs]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-5">
      <div className="relative h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
          style={{ animation: "indeterminate-slide 1.4s ease-in-out infinite" }}
        />
      </div>
      <p key={index} className="animate-in fade-in text-center text-sm text-muted-foreground">
        {messages[index]}
      </p>
    </div>
  );
}
