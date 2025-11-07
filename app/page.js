"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SCENES = [
  {
    key: "opening",
    stage: "???? ?? ??? ??? ???? ?? ?????? ?????? ??? ?? ??? ??? ???? ???????? ?? ??????? ????? ??? ???? ??? ???",
    art: "palace",
    lines: [
      {
        speaker: "Narrator",
        text:
          "???? ??? ????, ?????? ??? ?? ????? ??? ??????? ?? ??? ??? ???? ?? ????????? ????? ???? ??????? ?? ??? ?? ??? ???? ????? ??? ???????? ???",
      },
      {
        speaker: "Narrator",
        text:
          "?? ??? ????? ??? ???? ?? ?? ?????? ???? ? ????",
      },
    ],
  },
  {
    key: "training",
    stage: "???? ?? ?????? ??? ????? ?? ????-???? ?? ?????? ?? ??? ???",
    art: "training",
    lines: [
      {
        speaker: "????",
        text: "??? ???! ????? ???? ???, ???? ??? ?? ??? ?? ??? ?? ?? ??? ????!",
      },
      { speaker: "???", text: "????, ?? ??? ????! ?? ??? ???? ?? ?????? ??? ?? ????? ????" },
      { speaker: "????", text: "??? ???, ??? ?? ??? ?? ??, ??? ????????!" },
    ],
  },
  {
    key: "garden",
    stage: "??? ?? ?????? ????? ?? ?????? ?? ????? ????",
    art: "garden",
    lines: [
      { speaker: "????????? ?????", text: "???, ?? ????? ??? ??? ????? ??, ??? ???? ???" },
      { speaker: "???", text: "?????? ?????????! ???? ???? ????? ?? ???? ?????" },
      { speaker: "Narrator", text: "????? ?? ?????? ???? ????? ??? ????? ??? ????? ??? ???? ????? ?? ?? ?? ???? ?? ???? ?? ???? ????? ??? ???? ???" },
    ],
  },
];

export default function Page() {
  const [started, setStarted] = useState(false);
  const [voiceOver, setVoiceOver] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const audioCtxRef = useRef(null);
  const birdsIntervalRef = useRef(null);

  const currentScene = SCENES[sceneIndex];
  const currentLine = currentScene?.lines[lineIndex];

  // Typed text effect
  useEffect(() => {
    if (!currentLine) return;
    setIsTyping(true);
    setTyped("");
    let i = 0;
    const text = currentLine.text;
    const interval = setInterval(() => {
      i += 1;
      setTyped(text.slice(0, i));
      if (i >= text.length) {
        setIsTyping(false);
        clearInterval(interval);
        if (voiceOver) speak(text);
        if (autoAdvance) {
          // Auto move after a short pause
          const t = setTimeout(() => {
            nextLine();
          }, Math.min(2200 + text.length * 15, 6000));
          return () => clearTimeout(t);
        }
      }
    }, 22);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIndex, lineIndex]);

  // Voice selection happens on-demand inside speak()

  function speak(text) {
    try {
      if (!voiceOver) return;
      if (typeof window === "undefined") return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "hi-IN";
      // Pick a Hindi-capable voice if available
      const voices = window.speechSynthesis?.getVoices?.() || [];
      const preferred =
        voices.find((v) => (v.lang || "").toLowerCase().startsWith("hi")) ||
        voices.find((v) => (v.lang || "").toLowerCase().includes("india")) ||
        null;
      if (preferred) u.voice = preferred;
      u.rate = 0.97;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function startAudioScene() {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    // Gentle pad chords (I - IV - V - I) in C major
    const chords = [
      [261.63, 329.63, 392.0], // C E G
      [293.66, 349.23, 440.0], // D F A (approx IV feel)
      [329.63, 392.0, 493.88], // E G B (V feel)
      [261.63, 329.63, 392.0],
    ];

    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1600;
    filter.Q.value = 0.7;
    filter.connect(master);

    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.25;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(filter);

    function playChord(chordIdx, when) {
      const chord = chords[chordIdx % chords.length];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? "sine" : i === 1 ? "triangle" : "sawtooth";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.linearRampToValueAtTime(0.18 / (i + 1), when + 0.6);
        gain.gain.linearRampToValueAtTime(0.06 / (i + 1), when + 4.4);
        gain.gain.linearRampToValueAtTime(0.0001, when + 5.5);
        osc.connect(gain);
        gain.connect(delay);
        osc.start(when);
        osc.stop(when + 6.0);
      });
    }

    const start = ctx.currentTime + 0.05;
    for (let k = 0; k < 32; k++) {
      const when = start + k * 5.8;
      playChord(k, when);
    }

    // Birds chirps
    function playBirdChirp() {
      const now = ctx.currentTime;
      const chirp = ctx.createOscillator();
      const gain = ctx.createGain();
      chirp.type = "sine";
      const f0 = 1800 + Math.random() * 1200;
      chirp.frequency.setValueAtTime(f0, now);
      chirp.frequency.exponentialRampToValueAtTime(700 + Math.random() * 400, now + 0.18);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      chirp.connect(gain);
      gain.connect(master);
      chirp.start(now);
      chirp.stop(now + 0.3);
    }
    birdsIntervalRef.current = setInterval(() => {
      if (Math.random() < 0.55) playBirdChirp();
    }, 1200);
  }

  function stopAudioScene() {
    if (birdsIntervalRef.current) clearInterval(birdsIntervalRef.current);
    try { window.speechSynthesis?.cancel?.(); } catch {}
    const ctx = audioCtxRef.current;
    if (ctx) {
      // Let scheduled sounds finish; we won't close immediately to avoid pops
    }
  }

  function nextLine() {
    if (!currentScene) return;
    if (lineIndex + 1 < currentScene.lines.length) {
      setLineIndex((i) => i + 1);
    } else if (sceneIndex + 1 < SCENES.length) {
      setSceneIndex((s) => s + 1);
      setLineIndex(0);
    }
  }

  function prevLine() {
    if (!currentScene) return;
    if (lineIndex > 0) {
      setLineIndex((i) => i - 1);
    } else if (sceneIndex > 0) {
      const prev = sceneIndex - 1;
      setSceneIndex(prev);
      setLineIndex(SCENES[prev].lines.length - 1);
    }
  }

  useEffect(() => () => stopAudioScene(), []);

  const progressPct = ((sceneIndex * 1 + (lineIndex + 1) / (currentScene?.lines.length || 1)) / SCENES.length) * 100;

  return (
    <div className="container">
      <div className="card" role="main" aria-label="?????? ? ???">
        <div className="scene" aria-hidden>
          {currentScene?.art === "palace" && (
            <>
              <div className="sun" />
              <svg className="palace" viewBox="0 0 1200 360" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd36e" stopOpacity="0.9"/>
                    <stop offset="100%" stopColor="#8a6bff" stopOpacity="0.6"/>
                  </linearGradient>
                </defs>
                <g fill="url(#g)" opacity="0.85">
                  <rect x="80" y="120" width="120" height="160" rx="6"/>
                  <rect x="220" y="100" width="200" height="180" rx="8"/>
                  <rect x="450" y="60" width="300" height="220" rx="10"/>
                  <rect x="780" y="110" width="150" height="170" rx="8"/>
                  <rect x="950" y="130" width="100" height="150" rx="6"/>
                </g>
              </svg>
              <div className="birds" />
            </>
          )}

          {currentScene?.art === "training" && (
            <>
              <div className="sword-swish" />
              <svg className="palace" viewBox="0 0 1200 360" xmlns="http://www.w3.org/2000/svg">
                <g fill="#4aa5ff" opacity="0.4">
                  <rect x="0" y="300" width="1200" height="60" />
                  <circle cx="180" cy="290" r="46" />
                  <circle cx="320" cy="290" r="32" />
                  <circle cx="980" cy="290" r="28" />
                </g>
              </svg>
            </>
          )}

          {currentScene?.art === "garden" && (
            <>
              <div className="vines" />
              <svg className="palace" viewBox="0 0 1200 360" xmlns="http://www.w3.org/2000/svg">
                <g opacity="0.25">
                  <circle cx="100" cy="260" r="50" fill="#7bd389"/>
                  <circle cx="180" cy="270" r="40" fill="#6fcf97"/>
                  <circle cx="260" cy="265" r="46" fill="#7bd389"/>
                </g>
                <g opacity="0.35">
                  <rect x="420" y="210" width="18" height="90" fill="#ff7aa2"/>
                  <circle cx="429" cy="204" r="22" fill="#ff9abb"/>
                </g>
              </svg>
            </>
          )}
        </div>

        <div className="stage">{currentScene?.stage}</div>

        <div className="dialogue">
          {currentLine && (
            <p className="line">
              {currentLine.speaker && (
                <span className="speaker">{currentLine.speaker}:</span>
              )}
              <span className="typewriter" aria-live="polite">{typed}</span>
            </p>
          )}
        </div>

        <div className="controls">
          <div className="row">
            <button className="btn secondary" onClick={prevLine} disabled={sceneIndex === 0 && lineIndex === 0}>
              ????
            </button>
            <button className="btn" onClick={nextLine} disabled={sceneIndex === SCENES.length - 1 && lineIndex === currentScene?.lines.length - 1}>
              {isTyping ? "?????" : "????"}
            </button>
          </div>
          <div className="row">
            <label className="toggle">
              <input type="checkbox" checked={voiceOver} onChange={(e) => setVoiceOver(e.target.checked)} />
              <span className="small">???? ???</span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
              <span className="small">???-???????</span>
            </label>
          </div>
        </div>

        <div className="progress" aria-hidden>
          <div style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {!started && (
        <div className="banner" role="dialog" aria-modal>
          <div className="panel">
            <h1>?????? ? ??? ?? ?????</h1>
            <p>???? ????? ??? ?? ???????? ?? ??? ?? ??? ????? ???? ?????</p>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <label className="toggle">
                <input type="checkbox" checked={voiceOver} onChange={(e) => setVoiceOver(e.target.checked)} />
                <span>???? ??? ????? ????</span>
              </label>
              <button
                className="btn"
                onClick={() => {
                  setStarted(true);
                  startAudioScene();
                  // read first line
                  const first = SCENES[0].lines[0]?.text;
                  if (first && voiceOver) speak(first);
                }}
              >
                ????? ???? ????
              </button>
            </div>
            <p className="small" style={{ marginTop: 10 }}>
              ???: ???????? ?? ???? ?? ???? ????? ????? ?? ??? ????? ?????? ???
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
