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
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, hasMoved: false })

  const onMouseDown = (e) => {
    const el = scrollRef.current
    if (!el) return
    dragState.current.active = true
    dragState.current.startX = e.pageX - el.offsetLeft
    dragState.current.scrollLeft = el.scrollLeft
    dragState.current.hasMoved = false
  }

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragState.current.active) return
      const el = scrollRef.current
      if (!el) return
      const x = e.pageX - el.offsetLeft
      const diff = x - dragState.current.startX
      if (Math.abs(diff) > 5) {
        dragState.current.hasMoved = true
        setIsDragging(true)
        e.preventDefault()
        el.scrollLeft = dragState.current.scrollLeft - diff
      }
    }

    const onMouseUp = () => {
      dragState.current.active = false
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const onClickCapture = (e) => {
    if (dragState.current.hasMoved) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

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
          onClickCapture={onClickCapture}
        >
          {projects.map((project) => (
            <div key={project.title}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
