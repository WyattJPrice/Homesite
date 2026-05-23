import { useState, useEffect, useRef, memo } from 'react'

const CHARS = '█░▓▒▐▌▀▄▆▇■□▣▤▥▦▧▨▩'

function scrambleText(original, progress) {
  return original
    .split('')
    .map((char, i) => {
      if (char === ' ' || char === '\n') return char
      if (i < progress) return char
      return CHARS[Math.floor(Math.random() * CHARS.length)]
    })
    .join('')
}

export const TextScramble = memo(function TextScramble({
  text,
  className,
  as: Tag = 'pre',
  duration = 2000,
  trigger = true,
  style,
  ...rest
}) {
  const [display, setDisplay] = useState('')
  const frameRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!trigger) {
      setDisplay(text)
      return
    }

    const nonSpaceCount = text.replace(/[\s\n]/g, '').length

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const charProgress = Math.floor(progress * nonSpaceCount)

      let revealed = 0
      const result = text
        .split('')
        .map((char) => {
          if (char === ' ' || char === '\n') return char
          revealed++
          if (revealed <= charProgress) return char
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplay(result)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplay(text)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [text, duration, trigger])

  return <Tag className={className} style={style} {...rest}>{display}</Tag>
})
