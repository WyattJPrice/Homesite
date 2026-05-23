import { useRef, useState, useEffect } from 'react'
import { ArrowUpRight, GithubLogo } from '@phosphor-icons/react'
import { SectionHeading } from '../components/SectionHeading'
import { SpotlightCard } from '../components/SpotlightCard'
import { projects } from '../data/projects'

function ProjectCard({ project }) {
  return (
    <SpotlightCard className="border border-border bg-bg-secondary flex-shrink-0 w-[260px] md:w-[300px]">
      <div className="aspect-[16/10] bg-bg-tertiary/50 flex items-center justify-center rounded-t-2xl overflow-hidden">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-text-muted text-xs font-mono uppercase tracking-widest">Image coming soon</span>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-text-primary text-lg font-semibold tracking-tight">
            {project.title}
          </h3>
          <div className="flex gap-2 flex-shrink-0">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-primary transition-colors duration-200"
              aria-label={`${project.title} source code`}
            >
              <GithubLogo size={18} weight="bold" />
            </a>
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-red-accent transition-colors duration-200"
              aria-label={`${project.title} live site`}
            >
              <ArrowUpRight size={18} weight="bold" />
            </a>
          </div>
        </div>

        <p className="text-text-secondary text-sm leading-relaxed">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className="text-text-muted text-xs font-mono bg-bg-tertiary/60 px-2.5 py-1 rounded-md"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </SpotlightCard>
  )
}

export default function Projects() {
  const scrollRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const dragState = useRef({ startX: 0, scrollLeft: 0 })

  const onMouseDown = (e) => {
    const el = scrollRef.current
    if (!el) return
    setIsDragging(true)
    dragState.current.startX = e.pageX - el.offsetLeft
    dragState.current.scrollLeft = el.scrollLeft
  }

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e) => {
      const el = scrollRef.current
      if (!el) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX)
    }

    const onMouseUp = () => setIsDragging(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  return (
    <section className="py-24 md:py-32" id="projects">
      <SectionHeading>Projects</SectionHeading>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 select-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={onMouseDown}
        >
          {projects.map((project) => (
            <div
              key={project.title}
              style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
