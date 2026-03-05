"use client"

import { useEffect, useRef, useCallback } from "react"

// Minecraft enchanting table (SGA) + Elder Futhark runes + Katakana
const GLYPHS = [
  "ᔑ", "ʖ", "ᓵ", "↸", "ŀ", "⎓", "⊣", "〒", "╎", "⋮",
  "ꖌ", "ꖎ", "ᒲ", "リ", "フ", "¡", "ᑑ", "∷", "ᓭ", "ℸ",
  "⚍", "⊻", "∴", "‖", "∕",
  "ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚻ", "ᚾ",
  "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛋ", "ᛏ", "ᛒ", "ᛖ",
  "ᛗ", "ᛚ", "ᛞ", "ᛟ", "ᛠ",
  "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ",
  "サ", "シ", "ス", "セ", "ソ", "タ", "チ", "ツ", "テ", "ト",
]

const CHAR_COUNT = 45
const CYCLE_MS = 50

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
}

export function EnchantedText() {
  const containerRef = useRef<HTMLDivElement>(null)
  const spansRef = useRef<HTMLSpanElement[]>([])
  const animatingRef = useRef(false)

  const triggerWave = useCallback(() => {
    const spans = spansRef.current
    if (animatingRef.current || spans.length === 0) return
    animatingRef.current = true

    // Wave lights up chars left-to-right
    spans.forEach((span, i) => {
      setTimeout(() => {
        span.classList.add("enchanted-wave")
        span.textContent = randomGlyph()
      }, i * 15)
    })

    // After wave completes, burst all bright then fade back
    const waveDone = spans.length * 15 + 100
    setTimeout(() => {
      spans.forEach((span) => span.classList.add("enchanted-burst"))
    }, waveDone)

    setTimeout(() => {
      spans.forEach((span) => {
        span.classList.remove("enchanted-wave", "enchanted-burst")
        span.textContent = randomGlyph()
      })
      animatingRef.current = false
    }, waveDone + 600)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const spans: HTMLSpanElement[] = []
    for (let i = 0; i < CHAR_COUNT; i++) {
      const span = document.createElement("span")
      span.className = "enchanted-char"
      span.textContent = randomGlyph()
      span.style.animationDelay = `${Math.random() * 3}s`
      span.style.animationDuration = `${1.5 + Math.random() * 2}s`
      el.appendChild(span)
      spans.push(span)
    }
    spansRef.current = spans

    const interval = setInterval(() => {
      if (animatingRef.current) return
      const count = 3 + Math.floor(Math.random() * 4)
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * spans.length)
        const span = spans[idx]
        span.textContent = randomGlyph()
        span.classList.remove("enchanted-flash")
        void span.offsetWidth
        span.classList.add("enchanted-flash")
      }
    }, CYCLE_MS)

    return () => {
      clearInterval(interval)
      el.innerHTML = ""
    }
  }, [])

  return (
    <div className="enchanted-strip" onClick={triggerWave} aria-hidden="true">
      <div className="enchanted-text">
        <span className="enchanted-cursor">&gt;</span>
        <div ref={containerRef} className="enchanted-chars" />
      </div>
      <div className="enchanted-scanline" />
    </div>
  )
}
