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
    han: "街",
    title: "The Street of Lanterns",
    body: "Below the gate lay the night market: tiled roofs stacked like folded paper, steam off the noodle carts, a hundred small fires. The traveller had walked its whole length twice and heard the same warning at every stall — nobody passes the guardian.",
    note: "The city rises out of the dark.",
  },
  {
    numeral: "III",
    han: "宿",
    title: "The Inn at the Bend",
    body: "He took a room above the water where the roof curled like a wave. There, an old woman pouring tea told him the truth the street had softened: the guardian does not fight travellers. It plays them. And it has never lost.",
    note: "One night's lodging. One night's courage.",
  },
  {
    numeral: "IV",
    han: "赌",
    title: "The Wager",
    body: "Every coin he owned went onto the stone table — a small bright hill of them, ringing as it settled. The guardian did not look at the money. Stone has no use for silver. It wanted only to see what a man would risk to keep walking.",
    note: "The stake is never really the gold.",
  },
  {
    numeral: "V",
    han: "局",
    title: "The Board Between Worlds",
    body: "Xiangqi: two armies split by a river they may cross only once. Cannons that need a mountain to fire. Generals who may never meet eye to eye across the empty file. The guardian played red, and moved first.",
    note: "The set turns as the night deepens.",
  },
  {
    numeral: "VI",
    han: "刃",
    title: "The Blade Set Down",
    body: "Halfway through, the traveller drew his sword and planted it in the earth beside the board — not as a threat, but as an answer. A man who intends to cheat keeps his hands free. He kept his hands on the pieces.",
    note: "Steel resting is louder than steel drawn.",
  },
  {
    numeral: "VII",
    han: "车",
    title: "The Cart at the Crossroads",
    body: "Near dawn a food cart rattled up the valley road and stopped without being asked — painted wood, a hot iron plate, steam standing straight up in the cold. The cook said nothing about the game. He set down two bowls, one on each side of the board.",
    note: "Even legends stop to eat.",
  },
  {
    numeral: "VIII",
    han: "汤",
    title: "Broth and Patience",
    body: "The guardian did not eat, but it waited while the traveller did. Nine hundred winters had taught it that a hurried man loses in eleven moves. The cook fed the fire, the steam turned gold under the lanterns, and the board sat untouched until the bowl was empty.",
    note: "The cart turns slowly through the steam.",
  },
  {
    numeral: "IX",
    han: "渡",
    title: "Crossing the River",
    body: "On the eighty-first move the traveller pushed a single soldier over the river — a piece that could never return. It was the smallest sacrifice on the board, and it was the whole answer. The gate opened without a sound.",
    note: "Every legend keeps one piece it cannot take back.",
  },

  {
    numeral: "IX",
    han: "画",
    title: "Painted Afterwards",
    body: "No one recorded his name. They painted the moment instead: ink mountains, one thin figure at a stone table, and a river running through the middle of the scroll. The painting still hangs. The pieces in it are mid-game.",
    note: "The scroll is the only witness left.",
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
