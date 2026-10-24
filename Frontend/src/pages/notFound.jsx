"use client"; // Next.js App Router only. Harmless in Vite / CRA.

import { useEffect, useRef } from "react";

/**
 * 404 page, ported 1:1 from the approved HTML. Same CSS, same keyframes, same behaviour.
 * Class names and keyframes are prefixed "nf-" so they can't clash with your app's CSS.
 * Note: the :root / html / body / * rules are kept as in the original, so they are global.
 * Swap the <a href> links for your router's <Link> (next/link, react-router).
 */

const CSS = `
/* Tokens. Light is the base; dark overrides. One accent, locked across the page. */
:root {
  color-scheme: light;
  --bg: #F3F3F0;
  --fg: #0C0C0E;
  --muted: #55555B;
  --line: rgba(12,12,14,.28);
  --accent: #F2300F;
  --on-accent: #0C0C0E;
  --eye: #FFFFFF;
  --pupil: #0C0C0E;
  --font: "Archivo", "Helvetica Neue", Arial, sans-serif;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #0C0C0E; --fg: #EDEBE6; --muted: #A0A0A6;
    --line: rgba(237,235,230,.28);
    --accent: #FF4026; --eye: #F3F3F0;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0C0C0E; --fg: #EDEBE6; --muted: #A0A0A6;
  --line: rgba(237,235,230,.28);
  --accent: #FF4026; --eye: #F3F3F0;
}
html { scroll-padding-top: env(safe-area-inset-top, 0px); }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg); color: var(--fg);
  font-family: var(--font); font-stretch: 100%;
  -webkit-font-smoothing: antialiased;
}

/* Shape lock: everything is sharp-cornered. Only the eye and status dot are round, because they are drawn objects. */
.nf-page {
  min-height: 100dvh;
  display: grid; grid-template-rows: auto 1fr auto;
  padding: 0 clamp(14px, 1.6vw, 24px);
  overflow: hidden;
}

/* Sprocket strip + meta row */
.nf-sprockets {
  height: 8px; margin: 12px 0 0;
  background: repeating-linear-gradient(90deg, var(--line) 0 8px, transparent 8px 20px);
}
.nf-meta {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  padding: 14px 0; font-size: 12px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase; color: var(--muted);
}
.nf-meta > :last-child { justify-self: end; }
.nf-brand { color: var(--fg); display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 800; }
.nf-brand::before { content: ""; width: 9px; height: 9px; border-radius: 50%; background: var(--accent); }
.nf-meta a { color: var(--fg); text-decoration: none; }
.nf-meta a:hover { text-decoration: underline; text-underline-offset: 4px; }

/* Copy block: pushed right, leaves the left as open space */
.nf-help {
  align-self: start; justify-self: end;
  width: min(100%, 25rem);
  padding-top: clamp(20px, 5vh, 64px);
  display: grid; gap: 20px;
}
.nf-help p { margin: 0; font-size: 1.125rem; line-height: 1.4; font-weight: 500; max-width: 34ch; }
.nf-btn {
  justify-self: start; display: inline-flex; align-items: center;
  padding: 0 22px; height: 48px; white-space: nowrap;
  background: var(--accent); color: var(--on-accent);
  font: 700 .9375rem/1 var(--font); text-decoration: none; border: 2px solid var(--accent);
  transition: transform .15s ease, background-color .15s ease, color .15s ease;
}
.nf-btn:hover { background: transparent; color: var(--fg); }
.nf-btn:active { transform: translateY(1px); }
.nf-find { display: grid; gap: 8px; padding-top: 16px; border-top: 1px solid var(--line); }
.nf-find label { font-size: .8125rem; font-weight: 600; color: var(--muted); }
.nf-find .nf-row { display: flex; }
.nf-find input {
  flex: 1; min-width: 0; height: 44px; padding: 0 12px;
  font: 500 1rem var(--font); color: var(--fg); background: transparent;
  border: 2px solid var(--fg); border-right: 0; border-radius: 0;
}
.nf-find button {
  height: 44px; padding: 0 16px; cursor: pointer;
  font: 700 .875rem var(--font); color: var(--bg); background: var(--fg);
  border: 2px solid var(--fg); border-radius: 0;
}
.nf-find button:active { transform: translateY(1px); }
:is(a, button, input):focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

/* The numerals. The zero is an eye that watches the cursor. */
.nf-stage { align-self: end; }
.nf-num {
  margin: 0 0 -.14em; line-height: 1; white-space: nowrap;
  font-weight: 900; font-stretch: 125%; letter-spacing: -.02em;
  color: var(--accent); font-size: 40vw;
}
.nf-row { display: inline-flex; }
.nf-d { display: inline-block; }
.nf-zero { position: relative; isolation: isolate; }
.nf-eyeball {
  position: absolute; z-index: -1; left: 50%; top: 49%;
  width: .32em; height: .5em; transform: translate(-50%, -50%);
  background: var(--eye); border-radius: 50%;
}
.nf-gaze {
  position: absolute; left: 50%; top: 50%; width: .15em; height: .15em;
  transform: translate(calc(-50% + var(--px, 0) * .05em), calc(-50% + var(--py, 0) * .1em));
  transition: transform .14s ease-out;
}
.nf-pupil { display: block; width: 100%; height: 100%; border-radius: 50%; background: var(--pupil); }

@media (prefers-reduced-motion: no-preference) {
  .nf-d { animation: nf-rise 1s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--i) * 110ms); }
  @keyframes nf-rise { from { transform: translateY(45%); opacity: 0; } }
  .nf-eyeball { animation: nf-blink 7s infinite 2s; }
  @keyframes nf-blink { 0%, 94%, 100% { transform: translate(-50%, -50%) scaleY(1); } 97% { transform: translate(-50%, -50%) scaleY(.06); } }
  .nf-pupil { animation: nf-idle 9s ease-in-out infinite 1.2s; }
  .nf-tracking .nf-pupil { animation: none; }
  @keyframes nf-idle {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-.04em, -.05em); }
    55% { transform: translate(.04em, .05em); }
    80% { transform: translate(.02em, -.07em); }
  }
}

/* Mobile: single column, stack, trim the meta row */
@media (max-width: 767px) {
  .nf-meta { grid-template-columns: 1fr auto; }
  .nf-meta > :nth-child(2), .nf-meta > :nth-child(3) { display: none; }
  .nf-help { justify-self: stretch; width: 100%; padding-bottom: 28px; }
}
`;

export default function NotFound({ siteName = "" }) {
    const pageRef = useRef(null);
    const stageRef = useRef(null);
    const numRef = useRef(null);
    const rowRef = useRef(null);
    const zeroRef = useRef(null);

    // Same font the original loads in <head>. Skip if your app already loads Archivo (wdth axis).
    useEffect(() => {
        const href = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap";
        if (!document.querySelector(`link[href="${href}"]`)) {
            const l = document.createElement("link");
            l.rel = "stylesheet";
            l.href = href;
            document.head.appendChild(l);
        }
    }, []);

    useEffect(() => {
        const num = numRef.current,
            row = rowRef.current,
            stage = stageRef.current,
            zero = zeroRef.current,
            page = pageRef.current,
            reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

        // Scale the numerals to the container width; on short wide screens, cap by height so the copy stays visible.
        function fit() {
            num.style.fontSize = "100px";
            const w = row.getBoundingClientRect().width || 1;
            let size = (100 * stage.clientWidth) / w;
            if (window.innerWidth >= 768) {
                const cap = (window.innerHeight - 340) / 0.69;
                size = Math.min(size, Math.max(cap, 160));
            }
            num.style.fontSize = size + "px";
        }
        fit();
        window.addEventListener("resize", fit);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

        // Eye follows the pointer. Disabled under reduced motion.
        function onMove(e) {
            if (reduce.matches) return;
            const r = zero.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height * 0.49);
            const d = Math.hypot(dx, dy) || 1;
            const k = Math.min(1, d / (r.width * 1.1));
            zero.style.setProperty("--px", ((dx / d) * k).toFixed(3));
            zero.style.setProperty("--py", ((dy / d) * k).toFixed(3));
            page.classList.add("nf-tracking");
        }
        window.addEventListener("pointermove", onMove, { passive: true });

        return () => {
            window.removeEventListener("resize", fit);
            window.removeEventListener("pointermove", onMove);
        };
    }, []);

    return (
        <>
            <style>{CSS}</style>
            <div className="nf-page" ref={pageRef}>
                <header>
                    <div className="nf-sprockets" aria-hidden="true"></div>
                    <div className="nf-meta">
                        <a className="nf-brand" href="/" aria-label={`${siteName} home`}>{siteName}</a>
                        <span>Reel not found</span>
                        <span>Error 404</span>
                        <a href="/reviews">All reviews</a>
                    </div>
                </header>

                <section className="nf-help" aria-labelledby="nf-msg">
                    <p id="nf-msg">This page isn’t in our archive. The link may be wrong, or the review has moved.</p>
                    <a className="nf-btn" href="/">Back to home</a>
                    <form className="nf-find" action="/search" method="get" role="search">
                        <label htmlFor="nf-q">Find a film</label>
                        <div className="nf-row">
                            <input id="nf-q" name="q" type="search" autoComplete="off" />
                            <button type="submit">Search</button>
                        </div>
                    </form>
                </section>

                <div className="nf-stage" ref={stageRef}>
                    <h1 className="nf-num" ref={numRef} aria-label="Error 404">
                        <span className="nf-row" ref={rowRef} aria-hidden="true">
                            <span className="nf-d" style={{ "--i": "0" }}>4</span>
                            <span className="nf-d nf-zero" ref={zeroRef} style={{ "--i": "1" }}>
                                0
                                <span className="nf-eyeball">
                                    <span className="nf-gaze">
                                        <span className="nf-pupil"></span>
                                    </span>
                                </span>
                            </span>
                            <span className="nf-d" style={{ "--i": "2" }}>4</span>
                        </span>
                    </h1>
                </div>
            </div>
        </>
    );
}
