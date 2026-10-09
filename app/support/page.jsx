import PageShell from '@/components/PageShell';
import PageHeading from '@/components/PageHeading';
import Reveal from '@/components/Reveal';
import FaqAccordion from '@/components/FaqAccordion';
import ContactForm from '@/components/ContactForm';
import { SETUP_STEPS, FAQS, TROUBLESHOOTING } from '@/lib/iriz';
import { faqJsonLd, pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'IRIZ Support — Setup, FAQs & Troubleshooting | BluNeuron',
  description:
    'Set up your IRIZ mini projector, read answers on brightness and throw distance, troubleshoot common issues, or contact BluNeuron support in India.',
  path: '/support',
});

// FAQPage, derived from the same FAQS array the accordion renders below — see
// faqJsonLd in lib/seo.js for why it is derived and not retyped.
const FAQ_JSON_LD = faqJsonLd(FAQS);

export default function SupportPage() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <PageHeading
        eyebrow="Support"
        title="We've got you covered."
        subtitle="Setup help, answers to common questions, troubleshooting, and a direct line to our team."
      />

      <section id="setup-guide" className="scroll-mt-24 border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">Getting Started</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">Setup guide</h2>
          </Reveal>

          {/* Five steps on the 12-column board: two 6-wide pairs, then the
              last one full width so the row doesn't end on a hole. */}
          <ol className="bento-grid">
            {SETUP_STEPS.map((step, i) => (
              <Reveal
                key={step.title}
                delay={Math.min(i, 3) * 0.05}
                y={20}
                as="li"
                className={`bento-tile flex-row gap-4 p-6 ${
                  i === SETUP_STEPS.length - 1 ? 'sm:col-span-2 lg:col-span-12' : 'lg:col-span-6'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/55">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-b border-border-subtle bg-black-soft py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">Common Questions</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">FAQ</h2>
          </Reveal>

          <FaqAccordion items={FAQS} />
        </div>
      </section>

      <section id="troubleshooting" className="scroll-mt-24 border-b border-border-subtle bg-black py-16 sm:py-20">
        <div className="section-container">
          <Reveal className="mb-10 max-w-lg">
            <p className="eyebrow mb-3">Something Not Working?</p>
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">Troubleshooting</h2>
          </Reveal>

          <div className="bento-grid">
            {TROUBLESHOOTING.map((item, i) => (
              <Reveal
                key={item.issue}
                delay={Math.min(i, 3) * 0.04}
                y={20}
                className={`bento-tile p-6 ${
                  i === TROUBLESHOOTING.length - 1 ? 'sm:col-span-2 lg:col-span-12' : 'lg:col-span-6'
                }`}
              >
                <h3 className="mb-2 text-sm font-semibold text-white">{item.issue}</h3>
                <p className="text-sm leading-relaxed text-white/55">{item.fix}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 bg-black-soft py-16 sm:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <Reveal className="max-w-md">
            <p className="eyebrow mb-3">Still Stuck?</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tighter text-white sm:text-4xl">Contact support</h2>
            <p className="text-sm leading-relaxed text-white/55">
              Send us a message and our team will get back to you — no bots, no ticket queue purgatory.
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
