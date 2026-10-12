# FAST videos for zip. (brzi videi)

Hrvatski, za Vita: ova mapa sadrži alat za brze edukativne videe. Zakazani zadatak "Zip dnevni video" ga koristi utorkom, četvrtkom i petkom. Ako nešto ispravljaš, ispravi ovdje.

---

## For Claude: read all of this before making a FAST video

zip. (donebyzip.com) is a 3-person marketing agency in Zagreb for small businesses: websites, SEO and Google visibility, Google and Meta ads, copywriting, and an automation "System" (AI assistant, automatic replies, booking reminders, review requests). Tagline "Systems that sell." All on-screen text, voice and captions are in ENGLISH. Talk to the user in CROATIAN.

### What a FAST video is (decided by the user, 11–12 Oct 2026)
- Vertical 1080×1920, 15–25 s, 30 fps, the same file for Instagram Reels and TikTok.
- The look is the **3D phone ad**: template `templates/phone_make.py` (example: "pull to refresh"). Reference: `reference/3d phone ad - reference sheet.jpg` (an ad for a booking app: copy its techniques, never its brand, name, colours or words) and `reference/pull to refresh - frame sheet.jpg`.
  - A phone flies in turning in 3D (CSS perspective + rotateY), then wobbles slightly and spins on some cuts.
  - Soft 3D capsule shapes drift in the background in brand greys.
  - The headline above the phone builds word by word, with one key word in the accent colour.
  - The phone screen changes every 1.5–2.5 s (layers in SCHED), with a finger circle, pulls, taps and ripples.
  - Small white chips fly in around the phone and drift.
  - At least one strong moment: a big number, a document with a stamp, slot reels, a counter, a quote card.
  - End card: zip logo plus "Systems that sell.", usually with no call to action.
- `templates/laptop_make.py` ("left digit", 16:9) is a second look the team films from a laptop. Use it only when the user asks for a laptop video.
- **Topic: something interesting or educational that is NOT about zip or its services.** Examples of the kind: why prices end in .99, who invented pull-to-refresh. It must be true, specific and surprising in the first second. Think inventions, decisions by well-known companies, the psychology of buying, the history of everyday interfaces, design details. Check every fact on the web in this run, keep the source URLs, and never let the screen say more than the source. Lines that only illustrate say "Illustration" or "A made-up example." on screen.

### Pace rules (non-negotiable; the user rejected a slow video after 4 seconds)
- **Frame 0** already shows the full hook text and the phone.
- **Something changes every 0.3–0.6 s.** Nothing stays still longer than ~1.5 s.
- **Words appear one at a time** (the `.w` with `data-w` mechanism).
- **The camera never stops:** a slow push-in, a punch-in on every cut (CUTS) and whip transitions.
- **One dominant element at a time.** The eye goes to the upper centre first. Keep text inside the area that is safe on both Instagram and TikTok: about x 90–990 and y 250–1650, away from the right-side buttons.
- **Before the full render:**
  - run `python3 phone_make.py sheet t1,t2,...` at about 18 moments;
  - tile the frames into one image (PIL) and look at it;
  - fix overlaps, cut-off text and dead moments;
  - judge the first 4 seconds harshly.
- **Sound:**
  - Edit `templates/phone_sound.py`: about 120 BPM, kick, clap, hats and bass.
  - A whoosh and a stab on every cut, a pop on every word, ticks on counters, a riser before a reveal, and a chime on the end card.
  - Put the same cut times in both files.
- **Voice:** 5–8 short, energetic lines that react to the screen and never read it word for word. Never say "zip", the tagline, "link in bio" or button text.

### Brand
- **Background:** black #000000 with the zip grid (1 px lines, white at about 4 %, every 90 px). The phone screen content may be colourful because it is the "app".
- **Text colours:** #FAFAFA main, #A1A1A9 secondary, #6B6B73 dimmed. Accent: orange #FF5A1F.
- **Fonts:** League Spartan 700 for headlines, Work Sans for body text, an italic serif for a quote.
- **Logo:** `assets/zip.svg.txt`. It needs the CSS variables `--c1..--c6` on the container, as in the template.
- **Lime #C8FF3D with black text is ONLY for the call to action "Get the free check".** Educational videos normally have no call to action. Never "comment X", "like and follow", "DM us" or "link in bio".
- **Never** put a Found / Trusted / Booked label in a corner. No videos about the team.

### Do not repeat
- **Fast videos already made:** left digit (prices ending in .99, used-car mileage), pull to refresh (Loren Brichter, Tweetie, Twitter patent, "addictive" quote).
- **Also check** the Notion page "Zip videi – dnevnik" for later fast videos, and never reuse a topic from any zip post or video.

### Build and deliver
1. Once per workspace, from this folder: `bash setup.sh`. It installs playwright, piper-tts and numpy, and downloads the Piper voice "en-us-ryan-high" from GitHub into `voice/`.
2. Copy `templates/phone_make.py` and `templates/phone_sound.py` to a new folder inside `fast/`, e.g. `work/`, and rewrite them for the topic. `templates/` and `assets/` paths are relative, so keep the new folder one level below `fast/`.
3. Run `python3 phone_make.py` to get `out/silent.mp4`, then `python3 phone_sound.py` to get `sound.wav`.
4. Write `voice.json` as `[[seconds, "line"], ...]`. Run `python3 ../tools/finish.py "<content name>" . voice.json <cover second>`. It writes `deliverables/<content name> - video.mp4` (music and effects), `... - video voice.mp4` and `... - cover.png`, and reports whether both MP4s have audio. A silent file is never acceptable.
5. **Name:** two or three plain lowercase English words about the topic. No date, no "test" or "draft".
6. Send the three files with SendUserFile. Never post anything anywhere.
7. **Summary in Croatian:**
   - the timeline in short;
   - the spoken lines;
   - the Instagram caption (at most 3 short lines, the last one a question, no hashtags until 8 Nov 2026);
   - the TikTok caption (at most 2 lines, ending with a question);
   - the colour codes of every text element;
   - the alt text plus a short version under 100 characters;
   - the eye path in one line;
   - the sources;
   - a plain statement that nobody could listen to the audio.
