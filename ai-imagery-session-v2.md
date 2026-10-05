# AI Imagery Session — Revision 2

Supersedes `ai-imagery-session-outline.md` where they disagree. Written after reviewing the live Google Slides deck and verifying every model against its own product page on 27 Sep 2026.

---

## 1. What changed, in one page

| Decision | v1 | v2 | Why |
|---|---|---|---|
| Round 1 prompt | One shared prompt | **Three task types + one edit** | One prompt is one task. "Which model for which job" needs multiple job types or the closing slide isn't earned. |
| Per-group hypotheses | n/a | **Cut** | They test prompting technique, which is a different axis from model selection. Proposed and withdrawn. |
| Strategy meeting | Present | **Kept, and is now the pivot** | Reports are divergent, the strategy meeting is convergent. Without it the room leaves with seven facts and no plan. |
| Model count | 6 | **6** (cut OpenAI, which the live deck had added as a 7th) | No free tier and API org verification required. |
| Closing table | Prepared | **Filled in live** | It becomes a finding instead of an assertion. |
| Competition brief | Six SF room names | **Unchanged, and must go on the slide** | The live deck has "topic/objective" as a placeholder. |
| Reference images | Mentioned as a tip | **Banned in Round 1, demoed live, allowed in Round 2** | Highest-leverage technique there is, but it destroys the controlled comparison if groups use different references. |

---

## 2. Model roster, corrected

Verified against each product's own site, 27 Sep 2026.

| Group | Use this name | Note |
|---|---|---|
| 1 | **Flux** (whatever WaveSpeedAI calls it) | BFL now leads with FLUX 3, and "FLUX.2 Pro" appears nowhere on bfl.ai. FLUX 3's image modality is marked "soon," so the FLUX.2 generation is likely what WaveSpeed serves. **Use the string in WaveSpeed's UI, not BFL's homepage.** |
| 2 | **Ideogram 4.0** | Current. Now an open-weights model, and ships editable text layers and character consistency. |
| 3 | **Recraft V4.1** | V4 is stale. V4.1 shipped May 2026. |
| 4 | **Reve 2.1** | Current. |
| 5 | **Krea 2** | Current. |
| 6 | **Nano Banana** | Now a family: Nano Banana Pro (Gemini 3 Pro Image), Nano Banana 2 (Gemini 3.1 Flash Image), Nano Banana 2 Lite. Specify which one the free AI Studio path gives. |
| — | ~~GPT-4o~~ | **Cut.** Superseded by `gpt-image-2.5-sunburst` / `-flare`, no free tier is stated anywhere, and the docs say you may need API Organization Verification first. Highest failure risk on the day. |

**Free tiers.** Only Krea's is confirmed from source: **100 compute units/day, no credit card**. The others were not stated on the pages checked, so the allowances in v1 came from earlier research and need one pass through signup before the pre-work goes out.

---

## 3. Verified strengths

Quoting each product's own claims.

| Model | Claim |
|---|---|
| **Ideogram 4.0** | "Prompt fidelity. Crystal-clear type. Reliable editing." Editable text layers, character consistency, custom model training. |
| **Recraft V4.1** | "Unmatched vector generation," fully exportable and reshapeable vectors. "Consistent styles without training": drop in images, get a reusable style. |
| **Reve 2.1** | "Images you can touch." Images represented as code to separate planning from rendering. **Native 4K, 16 megapixels, print-ready.** Lossless iterative editing. |
| **Krea 2** | "Most expressive image model… aesthetic diversity, style control." 64+ models in one subscription, LoRA training on your own style, realtime canvas, **upscaling to 22K**. |
| **Flux** | "A wide variety of styles, highly-accurate text rendering, and the ability to handle complex prompts." Open weights. |
| **Nano Banana** | Multi-turn conversational refinement, multimodal input, "images that follow real-world logic" from Gemini's reasoning. |

**Closing slide, five rules instead of six rows:**

> Text in the image → Ideogram. A consistent set → Recraft or Krea. Exact compliance → Reve. Everything else → Flux. Fixing what you already have → Nano Banana.

---

## 4. Round 1, redesigned

Each group runs **three short prompts plus one edit** on their one model. Same three prompts for every group.

**A. Text.** A poster with one word in it. Separates Ideogram and Flux.

**B. Flat graphic.** An icon or logo-like mark in a named style. Separates Recraft, the only one selling editable vector output.

**C. Photoreal.** A scene or product shot. Separates Flux and Reve.

**Then the edit:** take your best of the three and change one element without changing anything else. This is where Nano Banana and Reve pull away, because conversational and lossless editing are a different workflow from re-rolling.

Four generations, each under a minute of actual compute. The cost is reading and posting, not waiting.

**No reference images in Round 1.** Say this on the slide. The round only works because every group runs the identical prompt, and the moment groups upload different references you're comparing references instead of models. Free tiers also differ on uploads, so capability would be uneven. References come back in Round 2.

### Why this and not one prompt

The session's stated takeaway is which model to reach for depending on the task. One prompt is one task, so the old Round 1 could only ever show that models diverge, not what each is for. Three task types turn the comparison into a models-by-tasks grid, and the closing table falls out of it.

---

## 5. Strategy meeting

The pivot of the session. Four parts, in order.

1. **Walk the grid, one task at a time** (3 min). Who got the text right? Who read "flat vector" as flat vector? Who held the scene together? Whose edit changed only the thing you asked for? Four questions, four rows of the closing table.
2. **Group reports, 20 seconds each** (3 min). Six groups.
3. **Reference image demo, live** (1 min). Run one of the Round 1 prompts again with a reference image attached, projected, side by side with the original. This is the highest-leverage technique in the session and it costs a minute because you run it, not them. Recraft's "consistent styles without training" is the same feature productised, so it's worth naming.
4. **Write the list for Round 2, live, on screen** (2 min). Four or five rules the whole room then applies, with "use a reference" now on it.

**Safeguard:** have five techniques pre-written on a hidden or greyed slide and reveal them as the room arrives at each. If findings come in thin you edit that list instead of composing from a blank slide in front of everyone.

The five to pre-load: order matters, name the medium, say what isn't there, one variable at a time, text goes in quotes and expects re-rolls.

---

## 6. Run of show — 40 minutes

| Minutes | Segment |
|---|---|
| 3 | Groups + confirm logins |
| 12 | **Round 1:** three tasks + one edit |
| 9 | **Strategy meeting:** walk the grid, reports, write the list |
| 10 | **Round 2:** the poster competition |
| 6 | Vote and winners |

**Round 2 note:** the brief is a 24 × 36 poster, which is task type B or C, so it doesn't test the model-selection finding. Either frame it as "apply what you learned," or let groups pick any model for Round 2 so the finding gets tested.

**Reference images are allowed in Round 2, and say so on the brief slide.** Otherwise half the groups will assume the Round 1 ban still holds. Supply a small brand reference pack they can pull from: the Tenki blue, the existing 24 × 36 poster, the sticker artwork. That turns the outputs from nice images into usable direction, which is the reason the room names were the brief in the first place.

**Reve is the poster model.** The only one claiming native 4K print-ready output, with Krea's 22K upscaling second. Say this in the strategy meeting or the competition gets decided by who happened to be assigned a model that can output at print resolution. Alternatively, state that judging is on concept, not resolution.

---

## 7. Gaps in the live deck

Reviewed 27 Sep 2026.

- **Slide 4 "How AI generates images" is empty.** Content below.
- **Slide 7 "Closing" is empty.** Content below.
- **Slide 5 has no per-phase timings.** Round 1 will run long and eat Round 2.
- **Slide 5's competition says "topic/objective."** Needs the six room names: Block, Chain, Nonce, Hash, Sat, Mint. Portrait, poster proportions, must work at 24 × 36, room name legible.
- **Groups of 2 with 20+ people** is 10+ groups against 6 models, so some models double up. Fine, but assign by name on the slide or the first five minutes go to sorting it out.
- **Slide 3's bullets are speaker notes, not slide content.** That slide should be mostly images with you talking over them.

### Slide 4 content

> Your prompt becomes numbers. The model starts from pure noise and removes noise, step by step, until something matching those numbers emerges.

Two consequences, and only these two:

> **Same prompt, different image.** The starting noise is random. That seed is why you can't reproduce a result you liked unless you saved it. Save your seeds.
>
> **Text is hard because nothing is typesetting.** The model pushes pixels toward "looks like letters," it doesn't place glyphs. That's why some models render text well, most don't, and why Ideogram exists as a separate product.

Say out loud: this is a denoising loop on a GPU. Luxor sells the machines it runs on. One image is a few seconds of the compute we rent out.

### Slide 7 content

> **Which tool for which job** — leave blank, fill in live from the room's findings.
>
> **What still goes to a human.** Exact brand colour: we shipped a card where `#047BFF` came back `#4674B9`. Generated "vectors" aren't paths, so anything going to press gets rebuilt. Kerning and a specific typeface. Six posters that feel like one family.
>
> **The licensing footnote.** Every free tier we used today is non-commercial. Nothing from this session ships as-is. We regenerate the winner on a paid account for about two dollars.

---

## 8. Licensing — now with a citable example

**Recraft's free plan**: images are owned by Recraft, published to their public community gallery, and not licensed for commercial use. That's a specific, checkable version of the general warning, and it's the one to name on the closing slide.

Protect this slide if you run short. It's the only thing stopping someone shipping a retreat output next week.

---

## 9. Prompt construction, worked example

From building a white tanuki for the sticker. Useful as concrete material for the techniques slide.

The naive prompt ("make it clearly a tanuki, not a fox") failed because it asks the model to already know the thing. The working prompt specified anatomy instead:

- **Name the anatomy, not the animal.** Stocky low-slung body, short blunt muzzle, small low-set rounded ears, short thick unringed tail, shaggy cheek ruffs.
- **Protect the identifying feature against your own instruction.** "White tanuki" fights the dark facial mask that makes it a tanuki, so the prompt has to say the mask stays.
- **Exclude both wrong answers.** Not a fox (no long snout, no white-tipped tail), not a raccoon (no ringed tail).
- **A reference image beats half the prompt.** Upload one and the anatomy locks immediately.
- **Iterate conversationally, one change per turn,** rather than rewriting the whole prompt.

That last point is the Nano Banana hypothesis in miniature, and it's worth demonstrating live if there's time.

---

## 10. Prep checklist, updated

- [ ] Confirm what WaveSpeedAI calls the Flux model and use that string
- [ ] Confirm which Nano Banana the free AI Studio path serves
- [ ] Re-verify free credit amounts for Flux, Ideogram, Recraft and Reve at signup
- [ ] Remove GPT-4o from the deck
- [ ] Fill slides 4 and 7
- [ ] Put per-phase minutes on slide 5
- [ ] Put the six room names on the competition slide
- [ ] Assign groups to models by name
- [ ] Write the three Round 1 prompts and the edit instruction on a card, one per group
- [ ] Build the shared board with six pre-labelled sections
- [ ] Pre-write the five fallback techniques on a hidden slide
- [ ] Prepare the reference image demo: one Round 1 prompt, run with and without a reference, ready to show side by side
- [ ] Assemble the Round 2 brand reference pack (Tenki blue, existing poster, sticker artwork) and put it on the shared board
- [ ] State "no reference images" on the Round 1 slide and "reference images allowed" on the Round 2 slide
- [ ] Replace slide 3's bullets with images, including one merch failure
- [ ] Decide whether Round 2 is model-locked or free choice
- [ ] Decide the prize

---

## Sources

[ideogram.ai](https://ideogram.ai/) · [recraft.ai](https://www.recraft.ai/) · [reve.art](https://reve.art/) · [krea.ai](https://www.krea.ai/) · [bfl.ai](https://bfl.ai/) · [Gemini Image](https://deepmind.google/models/gemini-image/) · [OpenAI image guide](https://platform.openai.com/docs/guides/image-generation)
