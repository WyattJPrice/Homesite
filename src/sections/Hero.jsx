import { ASCII_ART } from '../data/ascii'
import { MagneticButton } from '../components/MagneticButton'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Records', href: '#records' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]

export default function Hero() {
  return (
    <section className="min-h-[100dvh] relative flex items-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #18181b 0%, #09090b 70%)',
        }}
      />

      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #a1a1aa 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-[900px] mx-auto text-center">
          <pre
            className="text-red-accent leading-[1.15] inline-block text-left overflow-x-auto whitespace-pre"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 'clamp(5px, 1.05vw, 13px)',
            }}
          >
            {ASCII_ART}
          </pre>


          <div className="mt-4 w-16 h-px bg-red-accent mx-auto" />

          <nav className="mt-8 flex justify-center gap-6 md:gap-8">
            {navLinks.map(({ label, href }) => (
              <MagneticButton key={label} intensity={0.3}>
                <a
                  href={href}
                  className="text-text-muted hover:text-text-primary font-mono text-sm uppercase tracking-widest transition-colors duration-200 relative group"
                >
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-accent transition-all duration-300 group-hover:w-full" />
                </a>
              </MagneticButton>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
