import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FlaskConical, Play, UserRound } from "lucide-react";
import styles from "./showcase.module.css";

const games = [
  {
    slug: "tower-defense",
    title: "Base Defense",
    subject: "Math & strategy",
    description: "Build your defense. Solve challenges to power every tower.",
    image: "tower-defense",
  },
  {
    slug: "space-maze",
    title: "Space Maze",
    subject: "Math, English & more",
    description: "Find the right answer, dodge the patrols and chart your way out.",
    image: "space-maze",
  },
  {
    slug: "orbital-runner",
    title: "Orbital Runner",
    subject: "Math, English & more",
    description: "Pick your lane, race through answers and keep the streak alive.",
    image: "orbital-runner",
  },
];

const labs = [
  {
    slug: "circuit",
    title: "Electric Circuit",
    subject: "Electricity",
    description: "Light up the depot. Connect wires and see what changes the glow.",
    image: "circuit",
  },
  {
    slug: "refraction",
    title: "Bending Light",
    subject: "Optics",
    description: "Move the laser and follow a beam as it bends between materials.",
    image: "refraction",
  },
  {
    slug: "pendulum",
    title: "Pendulum Workshop",
    subject: "Motion & energy",
    description: "Pull, release and experiment. What makes a pendulum swing faster?",
    image: "pendulum",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#games">Skip to games</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="LessonQuest home">
          <Image src="/corgi-logo-concept.png" alt="" width={42} height={42} />
          <span>Lesson<span>Quest</span></span>
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          <a href="#games">Games</a>
          <a href="#labs">Science labs</a>
        </nav>
        <Link href="/profile" className={styles.profile}><UserRound size={18} aria-hidden="true" /><span>My character</span></Link>
      </header>

      <main className={styles.content}>
        <div className={styles.intro}>
          <h1>Choose your next adventure.</h1>
          <p>Play a game. Step into a lab. Learn by doing.</p>
        </div>

        {[
          { id: "games", title: "Play & learn", subtitle: "An adventure with every answer.", items: games, action: "Play game", Icon: Play },
          { id: "labs", title: "Make a discovery", subtitle: "Hands-on science in a world of your own.", items: labs, action: "Explore lab", Icon: FlaskConical },
        ].map(({ id, title, subtitle, items, action, Icon }) => (
          <section id={id} key={id} className={styles.section} aria-labelledby={`${id}-title`}>
            <div className={styles.sectionHeading}>
              <h2 id={`${id}-title`}>{title}</h2>
              <p>{subtitle}</p>
            </div>
            <div className={styles.grid}>
              {items.map((item, index) => (
                <Link href={`/lab/${item.slug}`} prefetch={false} className={styles.card} key={item.slug} aria-label={`${action}: ${item.title}`}>
                  <div className={styles.artwork}>
                    <Image src={`/game-assets/previews/${item.image}.webp`} alt="" width={800} height={500}
                      loading={id === "games" && index === 0 ? "eager" : "lazy"} unoptimized />
                    <span className={styles.launch}><Icon size={19} aria-hidden="true" /></span>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.subject}>{item.subject}</p>
                    <h3>{item.title}</h3>
                    <p className={styles.description}>{item.description}</p>
                    <span className={styles.action}>{action}<ArrowRight size={17} aria-hidden="true" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <footer className={styles.footer}>
          <span>Little challenges. Real discoveries.</span>
          <Link href="/profile">Choose your character<ArrowRight size={16} aria-hidden="true" /></Link>
        </footer>
      </main>
    </div>
  );
}
