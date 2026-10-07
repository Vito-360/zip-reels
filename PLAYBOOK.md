# zip reels playbook

How to make one zip. reel. Read this fully before writing a spec.

zip. (donebyzip.com) is a three-person marketing agency in Croatia for small businesses with a bad
website or no website. Tagline: "Systems that sell." Framework: **Found / Trusted / Booked**
(Google and local visibility → a website that earns trust → a short path to an enquiry or booking).
Entry offer: a free website check, three findings in writing.

## 1. What one run produces

One video for one posting day (Mon–Fri), 15 seconds, 1080×1920, 30 fps, in two versions:

- `out/<date>-<slug>.mp4`: sound effects and rhythm, no voice
- `out/<date>-<slug>-voice.mp4`: the same, with a synthetic English voice-over

plus `-cover.jpg`, `-caption.txt` and `-sheet.jpg` (12 frames for checking). MP4s are not committed.
What is committed: the spec in `specs/` and one new row in `LOG.md`.

## 2. Pick the day, style, pillar and topic

1. **Day.** The next posting day (Mon–Fri, Europe/Zagreb) after today that has no `specs/<date>.json`.
2. **Style.** Rotate `phone → kinetic → cards`, continuing from the last row of `LOG.md`.
3. **Pillar.** Found, Trusted or Booked: the one used least in the last six rows, never the same as the previous row.
4. **Kind.** Vary between educational (one useful thing), a real-world scenario (a moment a small-business owner recognises), and dry deadpan humour.
5. **Topic and hook.** Must differ from every row in `LOG.md`: different topic, angle and first line. Check the hook column before writing.
6. **Ending.** At most two videos per Mon–Fri week carry the free-check call to action. The others end with a concrete question (`"question"`) or with no ask at all: logo, tagline and one closing line (`"line"`). Seven identical "FREE website check" endings in a row read as ads. Section 3a says how the one call to action is shown.

## 2b. Tied or independent

Of the five videos in a week, one or two are **tied** to that week's image posts; the others are **independent** (an owner problem chosen by the rules above, unrelated to the posts).

- A tied video is the 15-second version of one general-story carousel from the Canva folder "zip – Instagram" (designs named `<Monday's date> – STORY – <title>`; a story carousel made before this naming rule counts too if it is clearly this week's). Take the first story that has no tied video in `LOG.md`.
- Shape: the hook is the story's headline fact, the middle shows its one point, the ending turns it toward the small-business owner, exactly as the carousel does.
- Use **only** facts that are on the design. No new facts, numbers or names. Company names the post itself names may appear as text; no logos.
- Do not mention a posting day in the caption. "The full story is on our profile." is fine.
- Topic and hook come from the post; style, music and ending still follow the rotation. A story video that is not built on Found / Trusted / Booked uses `"pillar": "none"` and does not count in the pillar rotation.
- Set `"tied": "<design title>"` in the spec and fill the `tied` column in `LOG.md` (`independent` otherwise), so the team can schedule the video on the same day as its post.

## 2a. Every video must be different

A viewer who saw yesterday's reel must not feel they are watching it again. Run `python3 make.py --history` first, then make sure the new video differs from each of the last five in **all** of these:

- **Topic, angle and hook** (see `LOG.md`).
- **Scene sequence.** Never reuse the same order of scene types or the same phone screens as the previous video of that style. Open with a different kind of scene than the last two videos did.
- **At least one visual idea not used in the last five videos**: a screen, action, layout or scene type that has not appeared, or a new one you add to the engine (section 7). `specs/_demo-screens.json` shows what exists.
- **Music.** Different `mood`, `seed` and `bpm` than the previous two rows.
- **Ending.** Different end-card question or closing line than any before. The call to action is the one thing that never varies (section 3a).

Same brand, new video: the colours, type and logo stay; everything else moves.

## 3. Content rules

- All on-screen text, voice-over and caption in **English**. Plain, practical, no hype. Short lines: a viewer reads each one in about a second.
- The first frame must already show the full hook. No logo intro.
- Speak to both groups: owners with a bad website and owners with none. Do not build a video only for apartments, salons or any single trade.
- **Never invent** statistics, studies, client results, testimonials or review counts. No "53% of visitors…". If a number is not a plain fact anyone can check (a date, a count of items on screen), leave it out.
- Do not write "no bots" (zip sells an AI assistant in one package). "From a person" is fine.
- Do not claim experience zip does not have yet ("mistakes we see in almost every check").
- Mock screens show generic businesses ("Your business", "Your competitor"). No real company names or logos, no real Google interface copied; "Google" as a word is fine.
- Caption: 3–6 short paragraphs, no emoji spam, no hashtag wall, ends with a concrete question or a soft CTA ("link in bio").
- "link in bio" belongs in the caption, next to the free check. It is not shown on the video.
- **No pillar label in a corner.** Never show "Found", "Trusted", "Booked" or "Found / Trusted / Booked" as a label, tag or HUD text in any corner of the video or the cover. The words may appear inside the content itself (a headline, a callout, the scene) when the video is about them. The technical HUD of the kinetic style is off by default for the same reason (`"hud": true` turns it on; do not use it for published videos).

## 3a. One call to action, always the same one

- **At most one ask per video.** Never two, never in consecutive scenes. If an `offer` scene ("FREE check") makes the offer, the end card shows only the logo and the tagline: no button, no question. If the end card carries the ask, no earlier scene does.
- **The ask is always the free check**, worded "Get the free check" on the end-card button (`"cta"`), or "FREE check" as the offer scene, in lime `#C8FF3D` with black text. Do not invent other asks ("DM us", "Book a call", "Follow for more", "link in bio") and do not rephrase it from video to video.
- **A question on the end card counts as an ask**, so it never appears together with the button. The end card takes exactly one of `cta`, `question`, `line`, or none of them.
- **No address line under the button.** `"note"` exists but stays unused; the button stands alone.
- `make.py` refuses a spec that breaks these rules. Check the sheet for it as well.

## 4. Design rules (already built into the engine, do not fight them)

- Black background, near-white text `#FAFAFA`, grey `#A1A1A9`, Geist, chrome gradient on the logo and on one emphasised word.
- Lime `#C8FF3D` with black text only for the CTA, the "FREE" pill, check marks and the progress bar. Never as decoration.
- Colour otherwise appears only inside the phone, as "client work".
- No watermarks, page counters or swipe hints.
- Instagram covers roughly the top 14% and the bottom 35% of a reel. Headlines, taps and buttons stay between y≈270 and y≈1300. The engine places them there; do not push text lower.
- Instagram recommends fewer reels that are mostly text. Prefer a scene (a phone, cards, something happening) over a wall of words, even in the kinetic style.

## 4a. Eye path

Every video is built around where the viewer's eyes go. From eye-tracking research on video: the first look goes to screen centre, motion pulls the gaze, and viewers' gaze clusters in a small part of the frame (Smith & Mital 2013); after a cut everyone's gaze re-converges within about half a second, slightly above centre (Bruckert, Christie & Le Meur 2022); text is fixated almost at once (Cerf, Frady & Koch 2009).

1. **First frame.** The hook text or the key object sits at screen centre or slightly above it, inside the safe zone. Nothing important at the edges or in corners.
2. **Cuts.** Put the new scene's key element where the previous key element was, or at centre, so nobody has to search for it.
3. **Motion.** Move one thing at a time, and make it the thing that must be seen or read. No moving decoration while text has to be read.
4. **Text.** One text block on screen at a time, meaning-carrying words first, held long enough to read once at a normal pace (about four words a second).
5. **Cover.** Same logic as a still: the main text in the upper-centre area as one block.
6. **Check.** On the sheet, say for each scene where the eye lands first and where it goes next. Fix any scene where the first look lands on something unimportant. Put the eye path in one line in the summary.

The story scenes (`button`, `merge`, `count`) are built on this: a centred headline whose bottom edge is at y=900 and one object centred on y=1040, in the same place in every scene. The listing scenes (`dial`, `listings`) do the same one step higher: headline bottom edge at y=800, the call card or the first row starting at y=860.

## 5. Write the spec

Copy the closest existing spec in `specs/` and change it. Minimal shape:

```json
{
  "date": "2026-10-08", "slug": "short-kebab-title", "style": "phone|kinetic|cards",
  "pillar": "found|trusted|booked", "ending": "question|cta", "topic": "one sentence",
  "duration": 15,
  "audio": {"bpm": 120, "mood": "pulse|bounce|deep|tick", "seed": 4},
  "scenes": [ ... ],
  "caption": "..."
}
```

- Scenes play in order. Each needs `type` and `dur`; durations must add up to 15.
- Mark the scene where the video turns from problem to solution with `"turn": true`. The beat gets fuller there. When the turn happens inside a scene, add `"turn_at": <seconds from the scene start>`.
- Voice-over: `"say": "..."` on a scene (starts 0.15 s in), or `"says": [{"t": 3.1, "text": "..."}]` for several lines in one scene. See section 5a for what the voice may and may not say.
- Change `audio.seed`, `mood` (`pulse`, `bounce`, `deep`, `tick`, `snap`, `shuffle`, `glide`) and `bpm` (104–128) every day so the music differs (key, pattern, tempo and feel). Add a new mood to `MOODS` in `engine/audio.py` when the last videos have used them all.
- Optional: `"tied": "<design title>"` (section 2b), `"cover_at": <seconds>` (frame used for the cover, default 0).
- `style: "kinetic"` gives hard cuts on plain black; the other two styles fade between scenes over a faint grid.

### 5a. Voice-over rules

The voice is a person reacting to what is on screen. It is not a narrator reading the screen aloud.

- **Three or four short spoken lines per video, no more.** A scene without a `say` is normal. In the build report `voice_share` should stay between 0.3 and 0.5: the voice talks for less than half of the video and the music carries the rest.
- **Never read the screen word for word.** If the screen says "they already booked elsewhere.", the voice says "Too late, they're gone."
- **Never spoken:** the tagline, "zip" on its own, "link in bio", web addresses, lists of items, labels, button text, UI text, timestamps and other numbers shown on screen.
- **Sound like someone who cares.** Short sentences, contractions, everyday words, one thought per line. Use an exclamation mark where a person would lift their voice (usually the hook and the turn), a question where they would ask. No corporate words ("solutions", "leverage", "optimise").
- A good shape: hook (what just happened) → the sting (what it costs) → the turn (what to do instead) → optionally one closing line (a question or the offer, said the way you would say it to a friend).
- Roughly 2.8 words per second at the house pace. Write numbers as words if one must be spoken.
- The house voice and its delivery (pace, pitch movement) are set once in `engine/voice.py` (`DEFAULT`). Do not set `"voice"` in a spec unless the user asked for a different voice for that video.

### Scene types

| type | use | main fields |
|---|---|---|
| `phone` | a phone with a screen, headline above | `title` (2 lines), `retitle` `[{t, lines}]`, `screen`, `actions`, `labels` `[{t, text, sub}]`, `labels_top` (y of the first label, default 650), `keep_screen` |
| `bignum` | giant chrome number or year | `label`, `values` (list, steps through them), `step`, `word`, `bar` |
| `flash` | white full-screen beat | `lines` |
| `lines` | statements one by one, earlier ones dim | `lines`, `kicker`, `step`, `numbered` |
| `statement` | big 1–3 line statement | `lines`, `chrome` (index of the chrome line), `sub` |
| `cards` | up to three dark cards with a small widget | `kicker`, `cards` `[{title, sub, widget}]`, `checks` |
| `offer` | lime "FREE" pill | `pill`, `title`, `list` or `sub` |
| `end` | logo, tagline, then at most one of: the button, a question, a closing line | `tagline`, and one of `cta` ("Get the free check"), `question`, `line`, or none (section 3a) |
| `chaos` | kinetic: huge words slam in over drifting ghost words | `main`, `ghosts`, `seed` |
| `blurtype` | kinetic: lines resolve from a blur | `lines`, `chrome`, `stripes`, `sub` |
| `stack` | kinetic: list on a rail | `items`, `kicker`, `collapse` |
| `slam` | kinetic: 1–3 huge lines, last one chrome | `lines`, `sub` |
| `cut` | a long list; items not in `keep` are struck out and drop away, the kept ones grow to fill the frame | `items`, `keep` (indexes), `kicker`, `kicker_after`, `sub`, `cut_at`, `step` |
| `button` | story: centred headline over one pill button that gets clicked (mouse cursor) or tapped (finger) | `lines`, `chrome` (line index), `label`, `label_done`, `check` (lime check when done), `pointer` (`cursor`/`tap`), `press_at`, `stamp` `{t, text}` |
| `merge` | story: a row of labelled steps is struck out and collapses into one circle, then a second headline line appears | `lines`, `after` `{t, line}`, `items`, `lead`, `step`, `strike_at`, `merge_at`, `into` |
| `count` | story: the circle counts up in place, the name of the current step under it, one more ring behind it per count | `lines`, `items`, `lead`, `step`, `outro` `{t, text}`, `collapse` |
| `dial` | listing: centred headline over one call card (handset with rings, number, status); at `fail_at` the number is struck out, the status changes and the card shakes | `lines`, `chrome`, `number`, `status`, `status_fail`, `fail_at` |
| `listings` | listing: centred headline over up to three rows (a place and the value shown there, grey with a cross); from `fix.t` the rows are corrected one at a time: the digits that differ roll to the new value and a lime check replaces the cross | `lines`, `retitle` `{t, lines, chrome}`, `value`, `rows` `[{name, value, to}]`, `lead`, `step`, `fix` `{t, value, step}` |

Consecutive `phone` scenes share one phone; the screen changes inside it. With `labels`, the phone moves left and the labels appear on the right (set `labels_top` so each label sits beside the thing it names). `"keep_screen": true` on a phone scene keeps the previous scene's screen exactly as it is, state included, instead of loading a new one: use it when one screen carries the story through several scenes (new headline, labels, the turn). Such a scene takes no `screen`; its actions use the kept screen's keys. A phone scene may have no `title` at all; a `retitle` can then bring the headline in after the action on the screen has finished, so only one thing moves at a time.

### Phone screens (`screen.kind`)

| kind | fields | keys for actions |
|---|---|---|
| `search` | `query`, `typing {t, dur}`, `results [{name, stars, meta, tags [{t, tone: good/bad}], you, after {…}}]` | `bar`, `r0`, `r1`… |
| `oldsite` | `hero`, `link`, `footer` | `link` |
| `newsite` | `name`, `open`, `headline`, `stars`, `meta`, `button`, `button_done` | `btn` |
| `call` | `name`, `initial`, `status` | – |
| `chat` | `name`, `sub`, `items [{t, stamp} / {t, from: them/you, text} / {t, note, bad}]` | – |
| `listing` | `name`, `category`, `stars`, `meta`, `photos`, `rows [{k, v, bad, fix}]` | `row0`…, `photos` |
| `loading` | `url`, `rate`, `count_to`, `caption` | – |
| `form` | `title`, `fields`, `submit`, `submit_done`, `counter` (chip "1 of 11" that counts typed fields), `short` (large friendly form, dark full-width button), `extras` (small lines under the button) | `f0`, `f1`… , `submit` |
| `reviews` | `name`, `stars`, `meta`, `review {name, stars, age, text}` (the one review the video is about), `empty` (text in the empty owner's-reply slot), `more` (dimmed reviews below, default 2) | `review`, `age`, `slot` |

### Actions (`actions: [{t, do, on}]`, `t` is seconds from the scene start)

`tap` (add `"miss": true` for a missed tap), `highlight`, `flag` (mark red), `promote` (move a search result to the top with a #1 badge), `zoom` (`to`), `scroll` (`by`, `dur`), `press` (tap a button and switch it to its done state), `fix` (turn a bad listing row or the photos good), `type` (`text`, `dur`: types into a form field, or the owner's reply into the `slot` of a `reviews` screen; `\n` breaks the line), `age` (`text`, `bad`: rolls the age pill of a review forward, e.g. "2 days ago" → "2 years ago"; `bad` turns it red), `leave` (the screen slides away). On a `reviews` screen, `highlight` frames the review, `flag` turns the empty reply slot red and `fix` puts a lime check on the written reply. Use `on` with a key from the table, or `x`/`y` from 0 to 1 on the screen.

`specs/_demo-screens.json` uses every screen and most actions. Use it as a reference; do not publish it.

Sound effects come automatically from what happens on screen (taps, messages, checks, cuts). You do not place them.

## 6. Build and check

```bash
bash setup.sh                                   # once per session
python3 make.py specs/<date>.json --sheet       # fast: 12 check frames only
python3 make.py specs/<date>.json               # full build, about a minute
python3 make.py specs/<date>.json --audio-only  # picture unchanged, redo only sound and voice (seconds)
python3 make.py --history                       # what the last videos used
```

Look at `out/<date>-<slug>-sheet.jpg` (open the image) and fix the spec until:

- frame 1 shows the complete hook, sharp, at centre or slightly above it
- no pillar label or other text sits in a corner
- there is at most one call to action (section 3a): no offer scene followed by a button, no question next to a button
- the eye path works in every scene (section 4a)
- no text is cut off, overlapping, or below the safe area
- every line stays on screen long enough to read
- lime appears only on CTA elements

Then read the build report:

- `voice_lines[].match` below 0.7 means the machine check did not recognise the line: rewrite it (numbers written as words score lower and are fine at 0.7+).
- `speed` above 1.15 or `overrun` above 0.15: shorten the line or lengthen the scene.
- `voice_share` above 0.5: the voice talks too much. Cut a line.
- loudness should be near −14 LUFS with true peak below −1 dBFS.

Nobody in the pipeline can hear the audio. Say that plainly in the summary every time: the team must listen before posting.

## 7. Finish

1. Add a row to `LOG.md`.
2. Commit `specs/<date>.json` and `LOG.md` to `main` and push.
3. Send the files to the user: both MP4s and the cover.
4. Reply in **Croatian** with a short summary: day and date and whether the video is tied (to which post) or independent, style, pillar (only if the video is built on it), topic, hook, the eye path in one line, where the single call to action sits (or that the video has none), what is visually new, how it ends, the voice-over script, the caption (English), and anything that could not be done or checked.

Never post to Instagram. These are drafts for the team.

If the engine needs a fix or a new scene type to do the day's idea well, change it in `engine/`, rebuild `specs/_demo-screens.json --sheet` to make sure nothing broke, and commit that too. Keep the brand rules.
