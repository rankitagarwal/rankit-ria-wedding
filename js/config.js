/* ---------------------------------------------------------------
   Easy settings. Edit the values below, save, and re-upload.
   --------------------------------------------------------------- */
window.WEDDING_CONFIG = {
  // Countdown target, in the visitor's own local time.
  // Format: "YYYY-MM-DDTHH:MM:SS". Add a time (for example "2027-02-16T19:00:00")
  // if you want the countdown to end at the evening ceremony.
  weddingDate: "2027-02-16T00:00:00",

  // Music is on by default. Phones and browsers only allow sound after the guest's
  // first tap, so it starts with that tap. Set to false to start with music off.
  musicDefault: true,

  // Optional: path to a properly licensed music file (for example "assets/music.mp3").
  // Leave empty to use the built-in soft instrumental ambience, which is generated
  // in the browser, so no audio file or licence is needed.
  musicSrc: "",

  // 0 = the film begins when the guest taps "Open Our Invitation" (this is what lets the
  // music start with that tap). Set e.g. 2600 to start the film by itself after 2.6 seconds.
  autoStartMs: 0
};
