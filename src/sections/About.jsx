import { SectionHeading } from '../components/SectionHeading'

export default function About() {
  return (
    <section className="py-24 md:py-32" id="about">
      <SectionHeading>About</SectionHeading>

      <ul className="space-y-3 text-text-secondary text-base md:text-lg leading-relaxed list-disc list-inside marker:text-red-accent">
        <li>
          Class of 2028 distance runner for{' '}
          <a
            href="https://www.ndpios.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-red-accent transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-red-accent"
          >
            Notre Dame High School
          </a>{' '}
          in Louisiana
        </li>
        <li>
          Training under a great team of coaches and mentors, including{' '}
          <a
            href="https://www.leveebreakers.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-red-accent transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-red-accent"
          >
            Jarret Leblanc
          </a>
        </li>
        <li>4.0 GPA</li>
        <li>31 ACT</li>
      </ul>
    </section>
  )
}
