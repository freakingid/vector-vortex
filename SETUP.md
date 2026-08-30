# SETUP — creating the Vector Vortex repo

One-time steps. Delete this file after the first commit.

## 1. Create the repo

```bash
cd ~/projects/game
mkdir vector-vortex && cd vector-vortex
# unzip the skeleton here, then:
git init
git branch -M main
```

## 2. Licence and LFS

```bash
curl -sL https://www.gnu.org/licenses/gpl-3.0.txt -o LICENSE
git lfs install          # .gitattributes already routes binaries through LFS
```

## 3. Verify before the first commit

```bash
node build.js                    # -> built dist/vector-vortex.html (24 modules)
node scratchpad/run-all.js       # -> ok  2 test files passed
open dist/vector-vortex.html     # blank canvas, no console errors
```

All three must pass. The skeleton ships green so that "the suite is red" is
never ambiguous at the start of a project.

## 4. First commit

```bash
rm SETUP.md
git add -A
git commit -m "CS001 P0: repo skeleton, build, harness, smoke test"
gh repo create freakingid/vector-vortex --private --source=. --remote=origin
git push -u origin main
```

## 5. Claude.ai Project

Create a Project named **Vector Vortex**. Paste the block from
`CLAUDE-AI-PROJECT-INSTRUCTIONS.md` into its custom instructions. Upload as
project knowledge: `VECTOR-VORTEX-GDD.md`, `CLAUDE.md`, `DIFFICULTY-NOTES.md`,
and the current `PLANNED-FEATURES-CS0##.md`. Nothing else.

## 6. Before CS001 P1

Two GDD open questions block later work but not P1, so building can start now:

- §21 #2 — Start Depth bonus treatment. Blocks the Worker registry entry.
- §21 #3 — kit consumption vs local implementation. Blocks `src/22-meta.js`.
