import React, { useEffect, useRef, useState } from "react";

export type CreditItem = { type: "title" | "role" | "name" | "blank"; text?: string };

type CreditsProps = {
  credits?: CreditItem[]; // lista de créditos (padrão interna)
  speed?: number; // pixels por segundo
  className?: string; // para customizar o container
  onFinish?: () => void; // callback quando terminar
  musicSrc?: string | null; // caminho/URL opcional da música de fundo
  showSkip?: boolean; // mostra botão pular
  initialPause?: boolean; // começa pausado
};

// Componente exportado como default — pronto para usar em .tsx
export default function Credits({
  credits = [
    { type: "title", text: "CRÉDITOS FINAIS" },
    { type: "blank" },
    { type: "role", text: "Direção de Projeto" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "blank" },
    { type: "role", text: "Artes visuais" },
    { type: "name", text: "[Gianlucca F.C. Machado]" },
    { type: "name", text: "[Gustavo A. Silva]" },
    { type: "blank" },
    { type: "role", text: "Design" },
    { type: "name", text: "Elias D. Dias" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "name", text: "Gustavo A. Silva" },
    { type: "name", text: "João P.L. Aparecido" },
    { type: "blank" },
    { type: "role", text: "Desenvolvimento" },
    { type: "name", text: "Elias D. Dias" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "name", text: "Gustavo A. Silva" },
    { type: "name", text: "João P.L. Aparecido" },
    { type: "blank" },
    { type: "role", text: "Testes" },
    { type: "name", text: "Elias D. Dias" },
    { type: "name", text: "Gianlucca F.C. Machado" },
    { type: "name", text: "Gustavo A. Silva" },
    { type: "name", text: "João P.L. Aparecido" },
    { type: "blank" },
    { type: "role", text: "Agradecimentos Especiais" },
    { type: "name", text: "[Prof° Hudson J.F. Júnior]" },
    { type: "name", text: "[A toda equipe envolvida]" },
    { type: "blank" },
    { type: "role", text: "Ferramentas e Tecnologias" },
    { type: "name", text: "React • TypeScript • Firebase • Git • VS Code" },
    { type: "blank" },
    { type: "role", text: "Versão" },
    { type: "name", text: "v1.0 — 24/11/2025" },
    { type: "blank" },
    { type: "title", text: "Obrigado por jogar!" },
    { type: "blank" },
  ],
  speed = 40,
  className = "",
  onFinish,
  musicSrc = null,
  showSkip = true,
  initialPause = false,
}: CreditsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(!initialPause);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // calcula a altura total do conteúdo após o primeiro render
  useEffect(() => {
    const cont = containerRef.current;
    const content = contentRef.current;
    if (!cont || !content) return;

    // start offset: começo logo abaixo da viewport
    setOffset(cont.clientHeight);
  }, []);

  // animação com requestAnimationFrame para rolagem suave
  useEffect(() => {
    const tick = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000; // segundos
      lastTimeRef.current = time;

      if (running && contentRef.current && containerRef.current) {
        setOffset((prev) => prev - speed * dt);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, speed]);

  // detecta quando terminou: quando o offset tiver passado todo o conteúdo
  useEffect(() => {
    const content = contentRef.current;
    const cont = containerRef.current;
    if (!content || !cont) return;

    const contentHeight = content.scrollHeight;
    if (offset < -contentHeight) {
      // acabamento
      setRunning(false);
      if (onFinish) onFinish();
    }
  }, [offset, onFinish]);

  // tecla ESC para pular
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        if (onFinish) onFinish();
      }
      if (e.key === " ") {
        setRunning((r) => !r); // espaço pausa / play
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFinish]);

  // áudio (opcional)
  useEffect(() => {
    if (!musicSrc) return;
    const audio = new Audio(musicSrc);
    audio.loop = true;
    audio.volume = 0.6;
    audioRef.current = audio;
    const tryPlay = async () => {
      try {
        await audio.play();
      } catch (e) {
        // autoplay pode falhar em alguns navegadores; ficará pronto para ser acionado
      }
    };
    if (running) tryPlay();

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [musicSrc, running]);

  // ao pausar, pausar música; ao continuar, tocar
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (running) a.play().catch(() => {});
    else a.pause();
  }, [running]);

  // estilos inline simples — você pode substituir por Tailwind ou CSS
  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #050509, #0b0b10)",
  };

  const contentStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    transform: `translateY(${offset}px)`,
    willChange: "transform",
    textAlign: "center",
    padding: "40px 20px",
    boxSizing: "border-box",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "2.25rem",
    fontWeight: 800,
    color: "#fff",
    margin: "12px 0",
  };

  const roleStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#e6e6e6",
    margin: "8px 0",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: "1rem",
    fontWeight: 500,
    color: "#cfcfcf",
    margin: "6px 0",
  };

  const blankStyle: React.CSSProperties = { height: 18 };

  // overlay de fade (top & bottom) para aspecto cinematográfico
  const fadeStyleTop: React.CSSProperties = {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "18%",
    background: "linear-gradient(to bottom, rgba(11,11,16,1), rgba(11,11,16,0))",
  };
  const fadeStyleBottom: React.CSSProperties = {
    pointerEvents: "none",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "18%",
    background: "linear-gradient(to top, rgba(11,11,16,1), rgba(11,11,16,0))",
  };

  return (
    <div ref={containerRef} className={`credits-roll ${className}`} style={containerStyle}>
      <div ref={contentRef} style={contentStyle}>
        {credits.map((c, i) => {
          if (c.type === "title") return (
            <div key={i} style={titleStyle}>{c.text}</div>
          );
          if (c.type === "role") return (
            <div key={i} style={roleStyle}>{c.text}</div>
          );
          if (c.type === "name") return (
            <div key={i} style={nameStyle}>{c.text}</div>
          );
          return <div key={i} style={blankStyle} />;
        })}
      </div>

      {/* fade overlays */}
      <div style={fadeStyleTop} />
      <div style={fadeStyleBottom} />

      {/* controles simples */}
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
        {showSkip && (
          <button
            onClick={() => { if (onFinish) onFinish(); }}
            style={{ padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}
          >
            Pular
          </button>
        )}

        <button
          onClick={() => setRunning((r) => !r)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}
        >
          {running ? "Pausar" : "Continuar"}
        </button>
      </div>

      {/* instrução rodapé */}
      <div style={{ position: "absolute", bottom: 14, width: "100%", textAlign: "center", color: "#999", fontSize: 12 }}>
        Pressione ESC ou ENTER para voltar • Espaço para pausar/retomar
      </div>
    </div>
  );
}

/*
  Como usar:

  import Credits, { CreditItem } from "./Credits";

  const credits: CreditItem[] = [ ... ];

  <div style={{ width: 1024, height: 600 }}>
    <Credits
      credits={credits}
      speed={48}
      musicSrc={"/assets/music/credits.mp3"}
      onFinish={() => router.push("/")}
    />
  </div>

  Observações:
  - Este componente foi escrito para React + TypeScript (.tsx).
  - Você pode trocar os estilos por classes Tailwind (se estiver usando Tailwind) ou por CSS modular.
  - Para carregar créditos dinamicamente, passe a prop `credits` (por exemplo, carregada de um JSON).
*/
