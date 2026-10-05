// Slide content, drawn from ai-imagery-session-v2.md.
// Anything marked <Placeholder> still needs real content before the session.

import { useState } from 'react'
import { ArrowRight, CheckCircle, User } from '@phosphor-icons/react'

function Placeholder({ children, tall }) {
  return (
    <div className={`placeholder ${tall ? 'tall' : ''}`}>
      <span className="placeholder-tag">Placeholder</span>
      <span>{children}</span>
    </div>
  )
}

// Held in memory only, so marks survive moving between slides but clear on refresh.
const checkedCells = new Set()

function CheckCell({ id, label }) {
  const [checked, setChecked] = useState(() => checkedCells.has(id))
  const toggle = () => {
    if (checked) checkedCells.delete(id)
    else checkedCells.add(id)
    setChecked(!checked)
  }
  return (
    <td className="check-cell">
      <button onClick={toggle} aria-pressed={checked} aria-label={label}>
        {checked && <CheckCircle weight="fill" />}
      </button>
    </td>
  )
}

const TASKS = [
  {
    name: 'Text',
    prompt:
      'A poster on a sand-coloured background with a subtle diagonal stripe pattern. Three lines of text, centred. At the top, in huge bold letters: "HASHRATE". In the middle, in medium letters: "BLOCK 840,000". At the bottom, in small letters: "Luxor Technology Retreat". Nothing else in the image.',
    edit: 'Change the background to navy. Keep the text and the stripes exactly the same.',
  },
  {
    name: 'Flat graphic',
    prompt:
      'A flat vector icon of a pickaxe crossed with a lightning bolt. Two colours only: navy and #047BFF blue. Thick even lines, no gradients, no shadows, no text, on a plain white background.',
    edit: 'Remove the lightning bolt. Change nothing else.',
  },
  {
    name: 'Photoreal',
    prompt:
      'A close-up photo of a technician’s hand holding a gold Bitcoin coin in a mining facility. Rows of mining machines with blue status lights, blurred in the background. Fingerprints and scratches on the coin. Shot on a 50mm lens.',
    edit: 'Make the coin silver. Change nothing else.',
  },
]

const num = (i) => String(i + 1).padStart(2, '0')

const MODELS = [
  { group: 1, name: 'Flux', note: 'Use the exact name shown in WaveSpeedAI' },
  { group: 2, name: 'Ideogram 4.0', note: 'Editable text layers, character consistency' },
  { group: 3, name: 'Recraft V4.1', note: 'Editable vector output, reusable styles' },
  { group: 4, name: 'Reve 2.1', note: 'Native 4K, print-ready, lossless edits' },
  { group: 5, name: 'Krea 2', note: '100 compute units/day free, upscaling to 22K' },
  { group: 6, name: 'Nano Banana', note: 'Conversational multi-turn refinement' },
]

// The parts of a prompt, in order. Model-agnostic: they apply to every tool in the session.
const PROMPT_PARTS = [
  { name: 'Subject and medium', how: 'Say what it is and what kind of image, up front. Order matters.' },
  { name: 'Specific details', how: 'Describe the parts, not the label. Don’t assume the model knows it.' },
  { name: 'Protect key features', how: 'Restate anything another word in the prompt might erase.' },
  { name: 'Exclusions', how: 'Say what it isn’t. Rule out the likely wrong answers.' },
  { name: 'Style and finish', how: 'Colours, lines, lighting and background.' },
  { name: 'Exact text', how: 'Put any words in quotes, and expect to re-roll.' },
]

// The working tanuki sticker prompt, split into the parts above (part 6 has no text here).
const TANUKI = [
  {
    part: 0,
    text: 'A sticker illustration of a white tanuki sitting upright.',
    note: 'Lead with the medium and the subject.',
  },
  {
    part: 1,
    text: 'Stocky, low-slung body, short blunt muzzle, small rounded ears set low on the head, short thick tail with no rings, shaggy fur ruffs on the cheeks.',
    note: '“Make it clearly a tanuki” failed. Naming the anatomy worked.',
  },
  {
    part: 2,
    text: 'Keep the dark mask around the eyes.',
    note: '“White” fights the dark mask that makes it a tanuki, so say the mask stays.',
  },
  {
    part: 3,
    text: 'Not a fox: no long snout, no white-tipped tail. Not a raccoon: no ringed tail.',
    note: 'Rule out both wrong answers by their features.',
  },
  {
    part: 4,
    text: 'Flat colours, thick white outline, plain background.',
    note: 'The finish that makes it printable as a sticker.',
  },
]

const SCHEDULE = [
  { min: 10, name: 'Context', detail: 'How image models work and the six we’ll use' },
  { min: 5, name: 'Groups and logins', detail: 'Find your group and sign in to your model' },
  { min: 15, name: 'Round 1', detail: 'Three tasks, then one edit on each' },
  { min: 10, name: 'Strategy meeting', detail: 'Compare results and set rules for Round 2' },
  { min: 15, name: 'Round 2', detail: 'The poster competition' },
  { min: 10, name: 'Vote and wrap-up', detail: 'Pick winners and match tools to jobs' },
  { min: 5, name: 'Questions', detail: 'Open floor' },
]

export const slides = [
  {
    title: null,
    body: (
      <div className="cover">
        <div className="cover-kicker">Punta Cana Retreat 2026</div>
        <div className="cover-title">Automating Visuals</div>
        <div className="cover-sub">Which AI image model to reach for, depending on the job</div>
        <div className="cover-byline">
          <span className="cover-name">Eddy Peng</span>
          <span className="cover-role">Product Designer</span>
        </div>
      </div>
    ),
    notes: 'Opening. Groups form and confirm logins in the first 3 minutes.',
  },
  {
    section: 'Overview',
    title: 'How the session runs',
    body: (
      <ol className="schedule-list">
        {SCHEDULE.map((p, i) => (
          <li key={p.name}>
            <span className="schedule-num">{i + 1}</span>
            <span className="schedule-name">{p.name}</span>
            <span className="schedule-detail">{p.detail}</span>
            <span className="schedule-min">{p.min} min</span>
          </li>
        ))}
      </ol>
    ),
    notes: 'Keep an eye on the clock in Round 1. It tends to run long and eat into Round 2.',
  },
  {
    section: 'Context · 10 min',
    title: 'AI imagery in the wild',
    body: (
      <div className="grid-3">
        <Placeholder tall>Example image</Placeholder>
        <Placeholder tall>Example image</Placeholder>
        <Placeholder tall>A merch failure</Placeholder>
      </div>
    ),
    notes:
      'This slide should be mostly images with you talking over them. The old bullets were speaker notes, not slide content. Include at least one merch failure.',
  },
  {
    section: 'Context · 10 min',
    title: 'How AI generates images',
    body: (
      <div className="stack">
        <p className="lead">
          Your prompt becomes numbers. The model starts from pure noise and removes it, step by
          step, until something matching those numbers emerges.
        </p>
        <div className="grid-2">
          <div className="card">
            <h3>Same prompt, different image</h3>
            <p>
              The starting noise is random. That seed is why you can’t reproduce a result you
              liked unless you saved it. <strong>Save your seeds.</strong>
            </p>
          </div>
          <div className="card">
            <h3>Text is hard because nothing is typesetting</h3>
            <p>
              The model pushes pixels toward “looks like letters”. It doesn’t place glyphs. That’s
              why most models get text wrong and why Ideogram exists as a separate product.
            </p>
          </div>
        </div>
      </div>
    ),
    notes:
      'Say out loud: this is a denoising loop on a GPU. Luxor sells the machines it runs on. One image is a few seconds of the compute we rent out.',
  },
  {
    section: 'Context · 10 min',
    title: 'Six groups, six models',
    body: (
      <div className="grid-3">
        {MODELS.map((m) => (
          <div className="card model" key={m.name}>
            <div className="model-group">Group {m.group}</div>
            <h3>{m.name}</h3>
            <p>{m.note}</p>
          </div>
        ))}
      </div>
    ),
    notes:
      'Before the session: confirm the Flux name in WaveSpeedAI and which Nano Banana the free AI Studio tier gives you. GPT-4o has been dropped: it has no free tier and needs API org verification.',
  },
  {
    section: 'Groups and logins · 5 min',
    title: '18 people, 6 groups of 3. Each group gets one model.',
    body: (
      <div className="stack">
        <div className="pairs">
          {MODELS.map((m) => (
            <div className="pair" key={m.name}>
              <div className="pair-head">
                <span className="model-group">Group {m.group}</span>
                <h3>{m.name}</h3>
              </div>
              <div className="pair-people">
                {[1, 2, 3].map((n) => (
                  <div className="person" key={n}>
                    <User weight="fill" />
                    <span>Name</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    notes: 'Replace each “Name” square with a real name before the session, or the first five minutes go to sorting out who has which model.',
  },
  {
    section: 'Round 1 · 15 min',
    title: 'Three tasks, then one edit on each',
    body: (
      <div className="stack">
        <div className="grid-4">
          {TASKS.map((t, i) => (
            <div className="card task" key={t.name}>
              <div className="task-letter">{num(i)}</div>
              <h3>{t.name}</h3>
              <Placeholder tall>Example output</Placeholder>
            </div>
          ))}
          <div className="card task accent">
            <div className="task-letter">04</div>
            <h3>The edit</h3>
            <Placeholder tall>Edited results</Placeholder>
          </div>
        </div>
        <div className="banner warn">No reference images in Round 1</div>
      </div>
    ),
    notes:
      'Every group runs the same three prompts on their one model. If groups upload different references you end up comparing the references, not the models. Free tiers also differ on uploads. References come back in Round 2.',
  },
  {
    section: 'Round 1 · 15 min',
    title: 'The prompts',
    body: (
      <div className="prompt-rows">
        {TASKS.map((t, i) => (
          <div className="prompt-row" key={t.name}>
            <div className="task-letter">{num(i)}</div>
            <div>
              <h3>{t.name}</h3>
              <p className="prompt-full">“{t.prompt}”</p>
              <p className="prompt-edit">
                <strong>Then edit:</strong> {t.edit}
              </p>
            </div>
          </div>
        ))}
      </div>
    ),
    notes:
      'Write these once and also print them on a card for each group. Post results to the shared board, which has a pre-labelled section for each model.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'Walk the grid',
    body: (
      <div className="stack">
        <table className="grid-table walk">
          <thead>
            <tr>
              <th>Question</th>
              {MODELS.map((m) => (
                <th key={m.name}>{m.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              'Which models got all three lines right?',
              'Which models matched the flat style you asked for?',
              'Which models made a scene that looks like a real photo?',
              'Which models changed only the one thing you asked for?',
            ].map((q) => (
              <tr key={q}>
                <td>{q}</td>
                {MODELS.map((m) => (
                  <CheckCell key={m.name} id={`${q}|${m.name}`} label={`${m.name}: ${q}`} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    notes:
      '3 min on the grid, one task at a time; each question becomes a row of the closing table. Then 3 min of group reports at 20 seconds each.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'A prompt in six parts',
    body: (
      <div className="stack">
        <div className="grid-3 parts">
          {PROMPT_PARTS.map((p, i) => (
            <div className="card" key={p.name}>
              <div className="task-letter">{num(i)}</div>
              <h3>{p.name}</h3>
              <p>{p.how}</p>
            </div>
          ))}
        </div>
        <div className="banner ok">
          Beyond the prompt: attach a reference image, then change one thing per turn.
        </div>
      </div>
    ),
    notes:
      'These parts work for every model, not just one. All three Round 1 prompts follow this order, so ask the room which parts their best results had. Reveal the parts as the room arrives at them, and add anything new they find. Spend 2 min here.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'Worked example: the white tanuki',
    body: (
      <div className="stack">
        <p className="muted">
          First try: “Make it clearly a tanuki, not a fox.” It failed because it assumed the model
          already knew what a tanuki looks like. The prompt that worked:
        </p>
        <div className="annotated">
          <ol className="annotations">
            {TANUKI.map((seg) => (
              <li key={seg.part}>
                <span className="seg-num">{num(seg.part)}</span>
                <div>
                  <strong>{PROMPT_PARTS[seg.part].name}</strong>
                  <p>{seg.note}</p>
                </div>
              </li>
            ))}
            <li>
              <span className="seg-num">06</span>
              <div>
                <strong>Reference image</strong>
                <p>Attach a photo of a real tanuki. It locks the anatomy faster than any wording.</p>
              </div>
            </li>
          </ol>
          <div className="stack">
            <p className="annotated-prompt">
              {TANUKI.map((seg, i) => {
                // Keep the marker on the same line as the first word.
                const [first, ...rest] = seg.text.split(' ')
                return (
                  <span className={`seg ${i % 2 ? 'alt' : ''}`} key={seg.part}>
                    <span className="nowrap">
                      <span className="seg-num">{num(seg.part)}</span>
                      {first}
                    </span>{' '}
                    {rest.join(' ')}
                  </span>
                )
              })}
            </p>
            <Placeholder tall>
              <span className="seg-num">06</span> Reference image of a tanuki
            </Placeholder>
          </div>
        </div>
      </div>
    ),
    notes:
      'After the reference image, change one thing per turn instead of rewriting the prompt. That is the Nano Banana approach on a small scale, so demo it live if there’s time.',
  },
  {
    section: 'Strategy meeting · 10 min',
    title: 'Live demo: add a reference image',
    body: (
      <div className="grid-2">
        <Placeholder tall>Round 1 prompt, no reference</Placeholder>
        <Placeholder tall>Same prompt with a reference image</Placeholder>
      </div>
    ),
    notes:
      'Takes 1 minute and you run it, not the groups. This is the most useful technique in the session. Recraft’s “consistent styles without training” is the same feature built into a product, so name it.',
  },
  {
    section: 'Round 2 · 15 min',
    title: 'The poster competition',
    body: (
      <div className="brief">
        <div className="stack">
          <dl className="brief-list">
            <div>
              <dt>Topic</dt>
              <dd>Punta Cana Retreat 2026</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>24 × 36 in, portrait</dd>
            </div>
            <div>
              <dt>Must include</dt>
              <dd>“Punta Cana Retreat 2026”, readable from across the room</dd>
            </div>
          </dl>
          <div className="banner ok">Reference images are allowed in Round 2</div>
          <p className="muted">
            Brand reference pack on the shared board: Tenki blue, the existing 24 × 36 poster, the
            sticker artwork.
          </p>
        </div>
        <div className="poster-frame">
          <div className="poster">
            <span>Punta Cana Retreat 2026</span>
          </div>
          <div className="poster-size">24 × 36 in</div>
        </div>
      </div>
    ),
    notes:
      'Still to decide: is Round 2 locked to each group’s model, or free choice? Free choice puts the model-selection finding to the test. Reve is the only model claiming native 4K print-ready output, with Krea’s 22K upscale second. Say so in the strategy meeting, or tell people judging is on concept, not resolution.',
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'Vote and winners',
    body: (
      <div className="grid-3">
        {MODELS.map((m) => (
          <Placeholder key={m.name}>
            Group {m.group} poster · {m.name}
          </Placeholder>
        ))}
      </div>
    ),
    notes: 'Voting method and prize are still to be decided.',
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'Which tool for which job',
    body: (
      <div className="stack">
        <table className="grid-table closing">
          <tbody>
            {[
              'Text in the image',
              'A consistent set',
              'Exact compliance',
              'Fixing what you already have',
              'Everything else',
            ].map((job) => (
              <tr key={job}>
                <td>{job}</td>
                <td className="blank">
                  <ArrowRight weight="fill" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Filled in live from the room’s findings.</p>
      </div>
    ),
    notes:
      'Expected answers, for you only: Text → Ideogram. Consistent set → Recraft or Krea. Exact compliance → Reve. Everything else → Flux. Fixing what you have → Nano Banana. Filling it in live makes it a finding the room reached, not something you told them.',
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'What still goes to a human',
    body: (
      <div className="grid-2">
        <div className="card">
          <h3>Exact brand colour</h3>
          <p>
            We shipped a card where <code>#047BFF</code> came back as <code>#4674B9</code>.
          </p>
        </div>
        <div className="card">
          <h3>Print-ready vectors</h3>
          <p>Generated “vectors” aren’t real paths. Anything going to press gets rebuilt.</p>
        </div>
        <div className="card">
          <h3>Typography</h3>
          <p>Kerning and a specific typeface.</p>
        </div>
        <div className="card">
          <h3>A cohesive set</h3>
          <p>Six posters that feel like one family.</p>
        </div>
      </div>
    ),
  },
  {
    section: 'Vote and wrap-up · 10 min',
    title: 'The licensing footnote',
    body: (
      <div className="stack">
        <p className="lead">
          Every free tier we used today is non-commercial. Nothing from this session ships as-is.
        </p>
        <div className="card">
          <h3>Example: Recraft’s free plan</h3>
          <p>
            Recraft owns the images, publishes them to its public community gallery, and doesn’t
            license them for commercial use.
          </p>
        </div>
        <p>We’ll regenerate the winning poster on a paid account for about two dollars.</p>
      </div>
    ),
    notes: 'If you run short on time, don’t cut this slide. It’s what stops someone shipping a retreat output next week.',
  },
  {
    title: null,
    body: (
      <div className="cover">
        <div className="cover-title">Questions?</div>
      </div>
    ),
  },
]
