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

## Get a notification when she says Yes

When she taps **Yes**, your phone gets a push notification through the free ntfy app:
"হ্যাঁ ফাহিম, আমিও তোমাকে ভালোবাসি। ❤️🥰" with the rest of the message under it, then the time and how many times she tried to catch the No button. Change the words with `NOTIFY_TITLE` in `config.js` (first line = title).
Nothing changes on her screen.

1. Install **ntfy** on your phone (Google Play or App Store) and allow notifications.
2. In the app tap **+**, type the topic `fahim-yes-3nrq6pd9zn5y` (exactly as `NOTIFY_TOPIC` in `config.js`), keep the server `ntfy.sh`, tap **Subscribe**.
3. Test: open your link with `?test` at the end, for example `https://suchi-surprise.vercel.app/?test`. On a PC click to start, press the Right arrow key until the question appears, click Yes. Your phone shows "পরীক্ষা: হ্যাঁ ফাহিম, আমিও তোমাকে ভালোবাসি। ❤️🥰" within a few seconds.
4. Send her the normal link, without `?test`.

**If the notification does not arrive:**

1. Test the phone app alone: open `https://ntfy.sh/fahim-yes-3nrq6pd9zn5y/publish?message=hello` in any browser. Your phone should show "hello". If it does not, fix the app: exact topic name, notifications allowed for ntfy, Do Not Disturb off, battery usage "Unrestricted" (Android), and "Instant delivery" turned on in the subscription.
2. Open your site with `?test` at the end. A "Notification test" panel appears at the bottom. If it does not appear, the new files are not live yet.
3. Tap **Send test notification**. The panel tells you whether ntfy.sh received it, or which error happened.

The topic name is visible to anyone who reads the page's code, which is why it is random. To change it, edit `NOTIFY_TOPIC` and subscribe to the new name in the app. To switch the notification off, set `NOTIFY_TOPIC: ""`.

## Playing it on a phone

- Open the link in **Chrome** (Android) or **Safari** (iPhone), not inside Messenger or Facebook. Their built-in browser cannot keep the screen awake or go full screen.
- Turn on **Do Not Disturb**, so calls and notifications do not pop up over the show.
- Turn off **Battery Saver / Low Power Mode**. They can cut the frame rate in half.
- **Lock the rotation** to portrait. Tilting the phone sideways replays the current scene in the landscape layout.
- Turn the **media volume** up.
- Once the start screen is showing, it no longer needs internet.
- iPhone: Safari always keeps its address bar. For true full screen, tap Share, then **Add to Home Screen**, and open it from the new icon.
- On slower phones the show lowers its sharpness a little by itself to stay smooth.

## Good to know

- Speed buttons appear only in the song and poem scenes. To also get them in the book chapters, add `"book"` to `SPEED_SCENES` in `config.js`.
- Browsers only allow sound after the first tap, so the music starts when she taps the start screen. On iPhone, turn the volume up.
- On phones it switches to full screen where supported (Android), keeps the screen from sleeping, and uses a portrait layout. Rotating the phone replays the current scene in the new layout.
- Keyboard: Space or Enter starts, Right arrow skips to the next scene (handy for testing).
- Your own song: put `song.mp3` next to `index.html`, upload it too, and set `CUSTOM_SONG: "song.mp3"` in `config.js`.
- Desktop version: `python desktop/proposal.py` (needs Python with Tkinter).
