# Proposal website

The web version of `desktop/proposal.py`. Same scenes, same texts, same timings and the same music box Canon, now running in any browser (PC, Android, iPhone, iPad).

New: while the **song** and the **poem** are on screen, the viewer gets **1x / 1.5x / 2x** speed buttons at the top right.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page |
| `config.js` | Names, all texts and options. **Edit this one.** |
| `app.js` | Animation engine, scenes and music (no need to touch) |
| `style.css` | Page and speed button styles |
| `desktop/proposal.py` | The original desktop (Python) version |

## Test it on your PC first

Double click `index.html` (Chrome or Edge). It runs straight from the folder.

## Step 1: Put it on GitHub

**Easy way (no commands):**

1. Go to https://github.com/new and sign in.
2. Repository name: for example `suchi-surprise`.
3. Choose **Private** (recommended: the code stays hidden, the website still works).
4. Leave "Add a README file" unticked. Click **Create repository**.
5. On the next page click the link **uploading an existing file**.
6. Open the extracted `proposal-website` folder, select everything inside it (`index.html`, `config.js`, `app.js`, `style.css`, `README.md` and the `desktop` folder) and drag it onto the GitHub page.
7. Wait until every file is listed, then click **Commit changes**.

Make sure `index.html` is at the top level of the repository, not inside another folder.

**Git command way (if you use Git):**

```bash
cd proposal-website
git init
git add .
git commit -m "Proposal website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/suchi-surprise.git
git push -u origin main
```

## Step 2: Deploy on Vercel

1. Go to https://vercel.com/new and continue with GitHub.
2. Find `suchi-surprise` in the list and click **Import**.
   If it is not in the list (private repo), click **Adjust GitHub App Permissions** and give Vercel access to that repository.
3. Framework Preset: **Other**. Root Directory: `./`. Leave the build settings empty.
4. Click **Deploy**. After about 20 seconds you get a link like `https://suchi-surprise.vercel.app`.
5. Open the link on your phone and on your PC to check it, then send it.

## Changing something later

Open `config.js` on GitHub, click the pencil icon, edit, then **Commit changes**. Vercel redeploys by itself in about 20 seconds. Refresh the link.

## Good to know

- Speed buttons appear only in the song and poem scenes. To also get them in the book chapters, add `"book"` to `SPEED_SCENES` in `config.js`.
- Browsers only allow sound after the first tap, so the music starts when she taps the start screen. On iPhone, turn the volume up.
- On phones it switches to full screen where supported (Android), keeps the screen from sleeping, and uses a portrait layout. Rotating the phone replays the current scene in the new layout.
- Keyboard: Space or Enter starts, Right arrow skips to the next scene (handy for testing).
- Your own song: put `song.mp3` next to `index.html`, upload it too, and set `CUSTOM_SONG: "song.mp3"` in `config.js`.
- Desktop version: `python desktop/proposal.py` (needs Python with Tkinter).
