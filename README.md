# Rankit & Ria – Wedding Invitation (16 February 2027)

A static website. No build step, no installs.

## Upload (any one)
- **Netlify**: drag this whole folder onto app.netlify.com/drop
- **Vercel**: `vercel --prod` inside this folder, or import it as a static project
- **Any host**: upload the folder contents so `index.html` is at the root

## Edit
- Date, music, intro timing: `js/config.js`
- Text and venues: `index.html`
- Colours and layout: `css/styles.css`

## After deploying
In `index.html`, change `og:image` (and add `og:url`) to your full address, e.g.
`https://your-site.netlify.app/og-image.png`, so the WhatsApp preview shows the image.

## Music
Off until a guest taps the speaker button. By default a soft ambience is generated in the browser (no licence needed). To use your own licensed file, put it in `assets/` and set `musicSrc` in `js/config.js`.
