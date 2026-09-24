# RELEASE-TESTS — Vector Vortex

⛔ **Paul runs these by hand before `dist/vector-vortex-itch.zip` goes public on
itch.io, and none of them is skipped** (Paul, 2026-09-23). At that date he had not
yet played the game. The suite proves the logic headless; these tests cover what
it cannot: a real browser, real hardware, real ears, and whether a first player
understands what is happening.

**Where they came from.** Each test was an entry in `SKIPPED-PLAYTESTS.md`,
marked there **▶ RELEASE**. That entry still lists the knobs a failure would
move. The rest of that file is tuning and feel. It stays skipped, and nothing
in it blocks the release.

**How to record a result.** Under each test, write the date, the device and
browser, and **PASS** or **FAIL** plus what you saw. Only a FAIL needs detail.
A failure becomes a patch: a planning session reads this file and the source
entry, and plans the fix. Once every test passes, the zip can be uploaded.

**Setup.**
- Desktop: double-click `dist/vector-vortex.html` (a `file://` URL).
- Phone: run `npm run serve` and open the LAN address it prints.
- Deep starts: START DEPTH shows only levels you have reached. In the browser
  console, `levelRecord("classic").noteCleared(81)` and
  `levelRecord("overdrive").noteCleared(81)` unlock both modes to 81 for that
  session.
- itch.io: upload the zip to a **Draft** or **Restricted** project. Only you
  can see it, and it runs in itch's real embed.

---

## R1 — First play, both modes, cold

Make a new profile. Play Classic from level 1, then Overdrive from level 1, as
a stranger would. Don't read the GDD first, and play until game over each time.
- **PASS if:** you can explain every death ("that was my fault, I saw it"). You
  can tell a Drifter you can shoot from one you can't, a Surger about to fire,
  and a Thorn. The prompts in the bottom band are readable and teach the next
  thing. Levels 1–4 still have some pressure.
- *Was:* CS005 P2, P3, P4; CS006 P3; CS008 P1b; CS016 P1, P4.

## R2 — Deep play, both modes

Start at Start Depth 23 in Classic, then in Overdrive, and play several wells
of each.
- **PASS if:** a board with six enemy kinds stays readable. Lit lanes read as
  lit in the dim band. Airborne is unmistakable. The ring flight reads as a
  flight, and a missed ring is audible. Tokens can be picked up and told
  apart. A Mimic's reflection feels like your mistake, not a cheat.
- *Was:* CS005 P5; CS006 P4; CS012 P5; CS013 P1, P4; CS014 P2.

## R3 — Every screen, on every input device

Go title → PLAY → CLASSIC → LEVEL 5 → die → RESTART → die → QUIT TO TITLE, then
pause → OPTIONS (all ten rows) → CONTROLS → CREDITS → back. Do this with a
mouse, a keyboard, a gamepad and a phone.
- **PASS if:** at every step it's obvious what moves, what confirms and what
  backs out. A tap on a phone never gets stuck in the drag zone.
- *Was:* CS008 P5, P6; CS008 P7.

## R4 — Traverse-and-stop, by hand, on every device

Use a closed well (the Ring) and an open one (the Vee). Do ten whips per device
(mouse, keyboard held, keyboard tapped, phone thumb, gamepad stick). Before each
whip, name a lane a third of the way round, then stop on it.
- **PASS if:** you land on the named lane nearly every time, and a slow move
  goes as far as your hand did. This is pillar P1.
- *Was:* CS017 P2.

## R5 — The Surger tone, by ear

Start at Start Depth 13 and 23 with music at default volume. Listen on laptop
speakers, on headphones and on a phone.
- **PASS if:** you hear a Surger charging in time to leave its lane, including
  over the busiest music. It's the one sound whose absence costs a life.
- *Was:* CS009 P5; CS010 P5.

## R6 — Frame rate on a laptop and a phone

Play Overdrive from Start Depth 23 until Spread is up and the board is full,
with the browser's FPS meter on. Keep playing through a death.
- **PASS if:** it holds 60 fps, or close enough that you never notice a stutter.
- *Was:* CS017 P1.

## R7 — Browsers, from `file://`

Test Chrome, Firefox, Safari (desktop) and Safari on iOS. Play a Classic run and
an Overdrive run to game over with sound on, and visit every title row. Make a
profile, change a volume, set a local score, reload, and check that all three
are still there. Repeat once in a private window.
- **PASS if:** it runs with sound and saves survive a reload in each browser.
  In a private window, the game must still play even if it can't save.
- *Was:* CS017 P3; CS011 P6.

## R8 — The itch.io draft page

Upload the zip to a Draft or Restricted project, then play it in the embed on
desktop and on a phone. Try fullscreen, and switch tabs mid-run.
- **PASS if:** it boots, sound starts on the first key, click or tap, saves
  survive a reload, and a lost focus pauses the game.
- *Was:* CS011 P6; CS017 P3.

## R9 — Online scores

Play a Classic run to game over and one that you quit from pause, then open
SCORES → VIEW → ONLINE. Play once more offline, then reconnect.
- **PASS if:** the runs show up on the board, and the queued line empties when
  the network returns.
- *Was:* CS011 P5.

## R10 — NAME entry on each device

Name a new profile and rename it with a gamepad, on a phone and on a keyboard,
then delete one.
- **PASS if:** each device can enter a name without a fight.
- *Was:* CS011 P4.

## R11 — Ten minutes of music

Play ten unpaused minutes of Overdrive from a deep Start Depth, once on
speakers and once on headphones. Switch tabs once partway through.
- **PASS if:** the beat never smears, no layer slips against the melody, and
  there is no stutter.
- *Was:* CS017 P3.
