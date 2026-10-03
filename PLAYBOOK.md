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
6. **Ending.** At most two videos per Mon–Fri week end with the free-check CTA (`"cta"` on the end scene). The others end with a concrete question (`"question"`). Seven identical "FREE website check" endings in a row read as ads.

## 3. Content rules

- All on-screen text, voice-over and caption in **English**. Plain, practical, no hype. Short lines: a viewer reads each one in about a second.
- The first frame must already show the full hook. No logo intro.
- Speak to both groups: owners with a bad website and owners with none. Do not build a video only for apartments, salons or any single trade.
- **Never invent** statistics, studies, client results, testimonials or review counts. No "53% of visitors…". If a number is not a plain fact anyone can check (a date, a count of items on screen), leave it out.
- Do not write "no bots" (zip sells an AI assistant in one package). "From a person" is fine.
- Do not claim experience zip does not have yet ("mistakes we see in almost every check").
- Mock screens show generic businesses ("Your business", "Your competitor"). No real company names or logos, no real Google interface copied; "Google" as a word is fine.
- Caption: 3–6 short paragraphs, no emoji spam, no hashtag wall, ends with a concrete question or a soft CTA ("link in bio").
- CTA wording: "Get the free check" + "link in bio · donebyzip.com". The address alone is not clickable in an organic reel.

## 4. Design rules (already built into the engine, do not fight them)

- Black background, near-white text `#FAFAFA`, grey `#A1A1A9`, Geist, chrome gradient on the logo and on one emphasised word.
- Lime `#C8FF3D` with black text only for the CTA, the "FREE" pill, check marks and the progress bar. Never as decoration.
- Colour otherwise appears only inside the phone, as "client work".
- No watermarks, page counters or swipe hints.
- Instagram covers roughly the top 14% and the bottom 35% of a reel. Headlines, taps and buttons stay between y≈270 and y≈1300. The engine places them there; do not push text lower.
- Instagram recommends fewer reels that are mostly text. Prefer a scene (a phone, cards, something happening) over a wall of words, even in the kinetic style.

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
- Mark the scene where the video turns from problem to solution with `"turn": true`. The beat gets fuller there.
- Voice-over: `"say": "..."` on a scene (starts 0.15 s in), or `"says": [{"t": 3.1, "text": "..."}]` for several lines in one scene. Roughly 2.6 words per second; leave the first line short. Write numbers as words ("twenty sixteen"), and "zip dot com" style for addresses.
- Change `audio.seed` and `mood` every day so the music differs (key, pattern and feel all follow the seed).
- `style: "kinetic"` gives hard cuts and the small technical HUD; the other two styles fade between scenes over a faint grid.

### Scene types

| type | use | main fields |
|---|---|---|
| `phone` | a phone with a screen, headline above | `title` (2 lines), `retitle` `[{t, lines}]`, `screen`, `actions`, `labels` `[{t, text, sub}]` |
| `bignum` | giant chrome number or year | `label`, `values` (list, steps through them), `step`, `word`, `bar` |
| `flash` | white full-screen beat | `lines` |
| `lines` | statements one by one, earlier ones dim | `lines`, `kicker`, `step`, `numbered` |
| `statement` | big 1–3 line statement | `lines`, `chrome` (index of the chrome line), `sub` |
| `cards` | up to three dark cards with a small widget | `kicker`, `cards` `[{title, sub, widget}]`, `checks` |
| `offer` | lime "FREE" pill | `pill`, `title`, `list` or `sub` |
| `end` | logo, tagline, then CTA or question | `tagline`, `cta` + `note`, or `question` |
| `chaos` | kinetic: huge words slam in over drifting ghost words | `main`, `ghosts`, `seed` |
| `blurtype` | kinetic: lines resolve from a blur | `lines`, `chrome`, `stripes`, `sub` |
| `stack` | kinetic: list on a rail | `items`, `kicker`, `collapse` |
| `slam` | kinetic: 1–3 huge lines, last one chrome | `lines`, `sub` |

Consecutive `phone` scenes share one phone; the screen changes inside it. With `labels`, the phone moves left and the labels appear on the right.

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
| `form` | `title`, `fields`, `submit` | `submit` |

### Actions (`actions: [{t, do, on}]`, `t` is seconds from the scene start)

`tap` (add `"miss": true` for a missed tap), `highlight`, `flag` (mark red), `promote` (move a search result to the top with a #1 badge), `zoom` (`to`), `scroll` (`by`, `dur`), `press` (tap a button and switch it to its done state), `fix` (turn a bad listing row or the photos good), `leave` (the screen slides away). Use `on` with a key from the table, or `x`/`y` from 0 to 1 on the screen.

`specs/_demo-screens.json` uses every screen and most actions. Use it as a reference; do not publish it.

Sound effects come automatically from what happens on screen (taps, messages, checks, cuts). You do not place them.

## 6. Build and check

```bash
bash setup.sh                                   # once per session
python3 make.py specs/<date>.json --sheet       # fast: 12 check frames only
python3 make.py specs/<date>.json               # full build, about a minute
```

Look at `out/<date>-<slug>-sheet.jpg` (open the image) and fix the spec until:

- frame 1 shows the complete hook, sharp
- no text is cut off, overlapping, or below the safe area
- every line stays on screen long enough to read
- lime appears only on CTA elements

Then read the build report:

- `voice_lines[].match` below 0.7 means the machine check did not recognise the line: rewrite it (numbers written as words score lower and are fine at 0.7+).
- `speed` above 1.15 or `overrun` above 0.15: shorten the line or lengthen the scene.
- loudness should be near −14 LUFS with true peak below −1 dBFS.

Nobody in the pipeline can hear the audio. Say that plainly in the summary every time: the team must listen before posting.

## 7. Finish

1. Add a row to `LOG.md`.
2. Commit `specs/<date>.json` and `LOG.md` to `main` and push.
3. Send the files to the user: both MP4s and the cover.
4. Reply in **Croatian** with a short summary: day and date, style, pillar, topic, hook, how it ends, the voice-over script, the caption (English), and anything that could not be done or checked.

Never post to Instagram. These are drafts for the team.

If the engine needs a fix or a new scene type to do the day's idea well, change it in `engine/`, rebuild `specs/_demo-screens.json --sheet` to make sure nothing broke, and commit that too. Keep the brand rules.
