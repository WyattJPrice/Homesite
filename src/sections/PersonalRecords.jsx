import { ArrowSquareOut } from '@phosphor-icons/react'
import { SectionHeading } from '../components/SectionHeading'
import { usePRData } from '../hooks/usePRData'

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 py-4 px-4 border-b border-bg-tertiary/50">
      <div className="h-5 w-20 bg-bg-tertiary rounded animate-pulse" />
      <div className="h-5 w-16 bg-bg-tertiary rounded animate-pulse" />
      <div className="h-5 w-24 bg-bg-tertiary rounded animate-pulse" />
      <div className="h-5 w-5 bg-bg-tertiary rounded animate-pulse" />
    </div>
  )
}

function PRRow({ pr }) {
  return (
    <div className="group grid grid-cols-[1fr_1fr_1fr_auto] gap-4 py-4 px-4 border-b border-bg-tertiary/50 hover:bg-bg-secondary transition-colors duration-200 rounded-lg">
      <span className="text-text-primary font-medium">{pr.Event}</span>
      <span className="font-mono text-text-secondary">{pr.Time}</span>
      <span className="font-mono text-text-muted text-sm self-center">{pr.Date}</span>
      <a
        href={pr.Link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-muted hover:text-red-accent transition-colors duration-200 self-center"
        aria-label={`View ${pr.Event} result`}
      >
        <ArrowSquareOut size={18} weight="bold" />
      </a>
    </div>
  )
}

export default function PersonalRecords() {
  const { data, isLoading, error, refetch } = usePRData()

  return (
    <section className="py-24 md:py-32" id="records">
      <SectionHeading>Personal Records</SectionHeading>

      <div>
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 py-3 px-4 mb-2">
          <span className="text-text-muted text-xs font-mono uppercase tracking-widest">Event</span>
          <span className="text-text-muted text-xs font-mono uppercase tracking-widest">Time</span>
          <span className="text-text-muted text-xs font-mono uppercase tracking-widest">Date</span>
          <span className="text-text-muted text-xs font-mono uppercase tracking-widest">Link</span>
        </div>

        {isLoading && !data && (
          <div>
            {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {error && !data && (
          <div className="py-8 text-center">
            <p className="text-text-muted mb-4">Failed to load records</p>
            <button
              onClick={refetch}
              className="text-red-accent font-mono text-sm hover:underline underline-offset-4 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {data && data.length === 0 && (
          <p className="py-8 text-text-muted text-center">No records found</p>
        )}

        {data && data.length > 0 && (
          <div>
            {data.map((pr, i) => (
              <PRRow key={pr.Event || i} pr={pr} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
