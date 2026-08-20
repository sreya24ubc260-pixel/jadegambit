import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

const StoryScene = lazy(() => import("@/components/story/scene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Jade Gambit — An Interactive 3D Legend" },
      {
        name: "description",
        content:
          "Scroll through a three-act legend told with real 3D artifacts: a temple guardian statue and an ancient Xiangqi board, lit by drifting lanterns.",
      },
      { property: "og:title", content: "The Jade Gambit — An Interactive 3D Legend" },
      {
        property: "og:description",
        content:
          "A scroll-driven 3D story of a stone guardian and the game that decided a dynasty.",
      },
    ],
  }),
  component: Index,
});

const ACTS = [
  {
    numeral: "I",
    han: "守",
    title: "The Guardian Wakes",
    body: "For nine hundred winters the stone sentinel held the mountain gate. Rain carved its robes, moss learned its name, and still it did not move. Then a single lantern drifted up the valley — and the eyes remembered how to see.",
    note: "Drag your cursor. The world leans with you.",
  },
  {
    numeral: "II",
    han: "问",
    title: "A Question of Stone",
    body: "The traveller asked the guardian for passage. The guardian asked for a game. Not of swords — of patience. Whoever read the river of moves furthest ahead would decide who walked through the gate at dawn.",
    note: "Keep scrolling — the board is being set.",
  },
  {
    numeral: "III",
    han: "局",
    title: "The Board Between Worlds",
    body: "Xiangqi: two armies split by a river they may cross only once. Cannons that need a mountain to fire. Generals who may never meet eye to eye across the empty file. The guardian played red, and moved first.",
    note: "The set turns as the night deepens.",
  },
  {
    numeral: "IV",
    han: "渡",
    title: "Crossing the River",
    body: "On the eighty-first move the traveller pushed a single soldier over the river — a piece that could never return. It was the smallest sacrifice on the board, and it was the whole answer. The gate opened without a sound.",
    note: "Every legend keeps one piece it cannot take back.",
  },
];

function Index() {
  const progress = useRef(0);
  const [ready, setReady] = useState(false);
  const [uiProgress, setUiProgress] = useState(0);

  useEffect(() => {
    setReady(true);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.body.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        progress.current = p;
        setUiProgress(p);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="relative text-foreground">
      <div className="fixed inset-0 z-0">
        {ready && (
          <Suspense fallback={null}>
            <StoryScene progress={progress} />
          </Suspense>
        )}
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 ink-veil" />

      <header className="fixed top-0 z-20 flex w-full items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-display text-lg tracking-[0.35em] text-gilded uppercase">
          Jade Gambit
        </span>
        <span className="hidden text-xs tracking-[0.3em] text-muted-foreground uppercase sm:block">
          玉 · 局 · 渡
        </span>
      </header>

      <div className="fixed top-1/2 right-5 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
        {ACTS.map((act, i) => (
          <span
            key={act.numeral}
            className={`h-8 w-px transition-all duration-500 ${
              uiProgress * ACTS.length >= i && uiProgress * ACTS.length < i + 1
                ? "bg-gold"
                : "bg-border"
            }`}
          />
        ))}
      </div>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end pb-24 text-center">
        <p className="mb-4 text-xs tracking-[0.5em] text-muted-foreground uppercase">
          An interactive legend in four acts
        </p>
        <h1 className="font-display text-6xl leading-[0.95] font-light sm:text-8xl">
          The <span className="text-gilded italic">Jade</span> Gambit
        </h1>
        <div className="my-6 h-px w-48 gold-rule" />
        <p className="max-w-md px-6 text-sm text-muted-foreground">
          A stone guardian, a travelling stranger, and one game of Xiangqi played through the whole
          of a single night.
        </p>
        <p className="mt-10 animate-pulse text-xs tracking-[0.3em] text-gold uppercase">
          Scroll to begin
        </p>
      </section>

      {ACTS.map((act, i) => (
        <section
          key={act.numeral}
          className={`relative z-10 flex min-h-screen items-center px-6 sm:px-16 ${
            i % 2 === 0 ? "justify-start" : "justify-end"
          }`}
        >
          <article className="max-w-xs drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-2xl leading-none text-gilded">{act.numeral}</span>
              <span className="text-sm text-jade">{act.han}</span>
            </div>
            <h2 className="mt-2 font-display text-lg font-light sm:text-xl">{act.title}</h2>
            <div className="my-3 h-px w-16 gold-rule" />
            <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{act.body}</p>
            <p className="mt-4 text-[0.55rem] tracking-[0.28em] text-jade uppercase">{act.note}</p>
          </article>
        </section>
      ))}

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="flex max-w-xl flex-col items-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
          <span className="text-xl text-jade">終</span>
          <h2 className="mt-4 font-display text-2xl font-light sm:text-3xl">
            The gate is still open
          </h2>
          <div className="my-4 h-px w-28 gold-rule" />
          <p className="max-w-xs text-[0.7rem] text-muted-foreground">
            The guardian sits where it always sat. The board is never cleared. Travellers still
            climb the valley, and the first move is always red.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="mt-10 rounded-sm border border-gold/50 px-6 py-3 text-xs tracking-[0.3em] text-gold uppercase transition-colors hover:bg-gold/10"
          >
            Retell the story
          </button>
        </div>
        <p className="mt-16 text-[0.65rem] tracking-[0.25em] text-muted-foreground/70 uppercase">
          Real-time 3D · scroll-driven · pointer-reactive
        </p>
      </section>
    </main>
  );
}
