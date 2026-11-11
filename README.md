# K.ONE: artist site (preview)

A work-in-progress artist site for K.ONE (New York producer and DJ), laid out
after [alexandracapitanescu.com](https://alexandracapitanescu.com/): the name
with a light passing over it, then a full-screen picture with the listening
links set in large serif capitals (a gap inside each word) and a "latest" card;
sections that open with a tiny label, two huge lines of Times and a small
justified paragraph beside a corner-marked button; a grid of sleeves; the next
show as a ticket with a stub and a barcode; a row of cut-out figures; a wall of
pictures beside a title that stays put; tilted, out-of-focus cards you unlock by
holding a button; a contact screen where you pick a topic and see who reads it;
and a footer with a pulse line and "Side A / Side B" lists.

Live preview: https://samsegan.github.io/kone-site/

The page carries a `noindex` tag and a "Preview build, not yet official" line
until K.ONE signs off on it.

## Colours

Taken from K.ONE's own pictures instead of the reference's black, bone and red:

| Colour | Where it comes from |
|---|---|
| Blue-black `#07090e` | the shadows of the blue studio portrait |
| Cream `#e8e4d6` | the cap |
| Cobalt `#1234c8` / bright `#4a74ff` | the sweater; the accent (arrows, the star, the stamp) |
| Powder blue `#b7c9e1` | the studio wall, the "Go (Fear No One)" star |

The four-point star is the one in K.ONE's Instagram name line; the mark
"K ✦ ONE" is the name with that star in place of the dot. Type is Times New Roman and Arial, as on
the reference (both are system fonts, nothing is loaded).

## What is on the page

1. **Landing**: the blue studio portrait taken into the dark, links to Spotify,
   SoundCloud, Apple Music and Bandcamp, the latest release.
2. **Music**: all 23 records (singles, collabs, edits, free downloads, one
   remix), newest first; eight show, "View all" opens the rest. On a computer
   they play in the page through SoundCloud's own player; on phones Play opens
   SoundCloud. The remix is on Spotify only and opens there.
3. **Tickets**: the next show as a ticket. It counts the days down and steps
   aside by itself the morning after.
4. **About**: three lines and four cut-out figures.
5. **Seen**: pictures from K.ONE's own posts.
6. **Unreleased**: the next single and four IDs named in the Clubhouse FM set,
   each with where to hear it. Hold the button (or press Enter on it).
7. **Contact**: management, the Australia / New Zealand agent, Instagram.
8. **Latest**: the next single's pre-save and two filmed sets.

## Files

Plain HTML, CSS and JavaScript. No framework, no build step for the page.

| File | What it holds |
|---|---|
| `index.html` | Every section and all the wording |
| `css/styles.css` | The look |
| `js/app.js` | Opening, menu, the record grid, ticket countdown, unlock, contact, player |
| `js/data.js` | Generated: the records and the unreleased list (do not edit by hand) |
| `data/catalog.json` | The discography, one row per record |
| `data/unreleased.json` | Unreleased songs and where each was heard |
| `art/`, `img/` | Cover art, photos |
| `tools/build.py` | Rebuilds `js/data.js`, and the pictures from the originals |
| `tools/cutout.swift` | Cuts a person out of a photo (Apple Vision), for the About figures |

## Changing things

**A new record:** add a row at the top of `data/catalog.json` (`sc` is the
SoundCloud link, `sp` the Spotify album id, `src` the cover file inside the
originals folder, `label` only where Spotify names one that is not the artist),
then:

    uv run --with pillow tools/build.py --src <folder with the originals>

Add `"embed": false` to a row if SoundCloud will not play that track inside
other sites; Play then opens SoundCloud instead. (All 22 SoundCloud links were
tested and play.)

Without `--src` only `js/data.js` is rewritten. The originals are not kept in
this repo.

**A new show:** in `index.html`, the `#ticket` block: `data-date`, the day,
month, weekday, city, venue line, both links, the stub, and the poster's two
lines; also the "Next show" date in the footer.

**A cut-out figure:**

    swiftc -O tools/cutout.swift -o cutout
    ./cutout photo.jpg <originals>/work/cut_name.png 1800

then list it in `tools/build.py` and rebuild.

**Wording, contact, links:** straight in `index.html` (contact topics are at
the top of the contact part of `js/app.js`).

## Where the facts come from

- Records, dates, collaborators: K.ONE's SoundCloud and Spotify pages. A label
  is shown only where Spotify names one (IN / ROTATION, MadLoud, sixk, How
  Lucky We Are).
- "New York": SoundCloud and Bandcamp profiles. Sound: the genre tags on the
  SoundCloud uploads. 298K monthly listeners: Spotify, November 2026.
- The show: Elsewhere's own listing and ticket page (Saturday 21 November 2026,
  Zone One with TWOFACED, doors 10:30 PM, 21+). K.ONE's posts said 14 November;
  the venue's page is the one followed here.
- Earlier dates: K.ONE's "upcoming dates" post.
- Contacts: the Instagram bio (management, Australia / New Zealand) and the
  SoundCloud and Spotify profiles (management).
- Unreleased titles and times: Clubhouse FM's post about the K.ONE b2b Gusta
  livestream. Next single: the pre-save page in K.ONE's Instagram bio.
- "Trust the process", "Turn the music louder": K.ONE's own captions.
- Photos: K.ONE's profile pictures and posts. They need K.ONE's OK before the
  site is made official.

## Preview locally

    python3 -m http.server 8814

then open http://127.0.0.1:8814/.
