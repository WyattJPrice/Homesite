import { ArrowSquareOut } from '@phosphor-icons/react'
import { SectionHeading } from '../components/SectionHeading'
import { usePRData } from '../hooks/usePRData'

function SkeletonRow() {
  return (
    <tr className="border-b border-bg-tertiary/50">
      <td className="py-4 px-4"><div className="h-5 w-20 bg-bg-tertiary rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-5 w-16 bg-bg-tertiary rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-5 w-24 bg-bg-tertiary rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-5 w-5 bg-bg-tertiary rounded animate-pulse" /></td>
    </tr>
  )
}

export default function PersonalRecords() {
  const { data, isLoading, error, refetch } = usePRData()

  return (
    <section className="py-24 md:py-32" id="records">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Personal Records:</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-secondary border-t border-b border-bg-tertiary">
            <th className="text-left py-3 px-4 text-text-primary text-sm font-bold">Event</th>
            <th className="text-left py-3 px-4 text-text-primary text-sm font-bold">Time</th>
            <th className="text-left py-3 px-4 text-text-primary text-sm font-bold">Date</th>
            <th className="text-left py-3 px-4 text-text-primary text-sm font-bold">Link</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && !data && (
            <>
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </>
          )}

          {error && !data && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-text-muted">
                Failed to load records.{' '}
                <button
                  onClick={refetch}
                  className="text-red-accent hover:underline underline-offset-4 cursor-pointer"
                >
                  Try again
                </button>
              </td>
            </tr>
          )}

          {data && data.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-text-muted">No records found</td>
            </tr>
          )}

          {data && data.length > 0 && data.map((pr, i) => (
            <tr key={pr.Event || i} className="border-b border-bg-tertiary/50 hover:bg-bg-secondary/50 transition-colors duration-200">
              <td className="py-4 px-4 text-text-primary">{pr.Event}</td>
              <td className="py-4 px-4 text-text-secondary">{pr.Time}</td>
              <td className="py-4 px-4 text-text-muted">{pr.Date}</td>
              <td className="py-4 px-4">
                <a
                  href={pr.Link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-red-accent transition-colors duration-200"
                  aria-label={`View ${pr.Event} result`}
                >
                  <ArrowSquareOut size={18} weight="bold" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
