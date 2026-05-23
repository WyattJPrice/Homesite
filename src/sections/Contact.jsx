import { GithubLogo, InstagramLogo } from '@phosphor-icons/react'
import { MagneticButton } from '../components/MagneticButton'

function StravaIcon({ size = 24, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

const socials = [
  {
    label: 'GitHub',
    href: 'https://github.com/WyattJPrice/',
    icon: GithubLogo,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/wyattjprice/',
    icon: InstagramLogo,
  },
  {
    label: 'Strava',
    href: 'https://www.strava.com/athletes/118654480',
    icon: StravaIcon,
  },
]

export default function Contact() {
  return (
    <footer className="border-t border-bg-tertiary mt-16" id="contact">
      <div className="py-16 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tighter text-text-primary">
            Contact
          </h2>
          <a
            href="mailto:me@wyattprice.dev"
            className="font-mono text-lg text-red-accent hover:text-text-primary transition-colors duration-200 underline underline-offset-4 decoration-red-dim hover:decoration-text-primary block"
          >
            me@wyattprice.dev
          </a>
        </div>

        <div className="flex gap-5">
          {socials.map(({ label, href, icon: Icon }) => (
            <MagneticButton key={label} intensity={0.4}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-text-primary transition-colors duration-200 block"
                aria-label={label}
              >
                <Icon size={32} weight="fill" />
              </a>
            </MagneticButton>
          ))}
        </div>
      </div>
    </footer>
  )
}
