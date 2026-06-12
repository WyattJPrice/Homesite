import { Analytics } from '@vercel/analytics/react'
import Hero from './sections/Hero'
import About from './sections/About'
import PersonalRecords from './sections/PersonalRecords'
import Projects from './sections/Projects'
import Contact from './sections/Contact'

export default function App() {
  return (
    <div className="min-h-[100dvh] bg-bg-primary">
      <Hero />
      <main className="max-w-[900px] mx-auto px-6 md:px-12">
        <About />
        <PersonalRecords />
        <Projects />
      </main>
      <div className="max-w-[900px] mx-auto px-6 md:px-12">
        <Contact />
      </div>
      <Analytics />
    </div>
  )
}
