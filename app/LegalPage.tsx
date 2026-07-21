type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="legal-shell">
      <header className="legal-nav">
        <a className="wordmark" href="/" aria-label="UX Design Den home">
          UX DESIGN<br />DEN
        </a>
        <a className="legal-back" href="/">
          Back to the Den ↗
        </a>
      </header>

      <main className="legal-main">
        <div className="legal-heading">
          <p className="scene-index">/ {eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-updated">Last updated July 21, 2026</p>
        </div>

        <article className="legal-document">
          <p className="legal-intro">{intro}</p>
          {sections.map((section, index) => (
            <section className="legal-section" key={section.title}>
              <p className="legal-number">{String(index + 1).padStart(2, "0")}</p>
              <div>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </article>
      </main>

      <footer className="legal-footer">
        <p>UX DESIGN DEN</p>
        <a href="mailto:uxdesignden-bc@gmail.com">uxdesignden-bc@gmail.com</a>
        <nav className="footer-legal" aria-label="Legal">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span>Vancouver, BC</span>
      </footer>
    </div>
  );
}
