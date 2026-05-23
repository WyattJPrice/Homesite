export function SectionHeading({ children, id }) {
  return (
    <h2
      id={id}
      className="flex items-center gap-4 text-3xl md:text-4xl font-bold tracking-tighter text-text-primary mb-10"
    >
      <span className="block w-1 h-8 bg-red-accent rounded-full" />
      {children}
    </h2>
  )
}
