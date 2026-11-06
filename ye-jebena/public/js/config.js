/* ==========================================================================
   YE’ JEBENA — SITE SETTINGS
   Edit this file only. Anything left as "" is hidden on the website, so the
   site never shows made-up information.
   ========================================================================== */
window.SITE_CONFIG = {

  /* ---------- Contact & location ---------- */
  contact: {
    phone: "",            // Shown text and tap-to-call link, e.g. "+251 9XX XXX XXX"
    whatsapp: "",         // Digits only with country code, e.g. "2519XXXXXXXX"
    whatsappMessage: "Hello Ye’ Jebena! ☕",
    address: "",          // e.g. "Bole, Addis Ababa, Ethiopia"
    mapsEmbedUrl: "",     // Google Maps → Share → Embed a map → copy the src="..." URL
    directionsUrl: "",    // Optional. If empty, it is built from the address above.
    googleReviewUrl: "",  // Your official Google review link (Google Business Profile → "Ask for reviews")
    hours: [
      // Add your real hours, for example:
      // { days: "Monday – Saturday", time: "7:00 AM – 9:00 PM" },
      // { days: "Sunday",            time: "8:00 AM – 8:00 PM" }
    ]
  },

  /* ---------- Social media (leave "" to hide an icon) ---------- */
  social: {
    tiktok:    "https://www.tiktok.com/@ye.jebena",  // taken from the watermark on your photos
    instagram: "",
    facebook:  "",
    telegram:  "",
    whatsapp:  ""   // Leave empty to use the WhatsApp number above automatically
  },

  /* ---------- Gallery ----------
     Drop your photos into public/assets/photos/ using these names (or change
     the names here). Photos that do not exist are skipped automatically. */
  gallery: [
    { src: "assets/photos/interior-basket.jpg", alt: "Handwoven basket wall art between two woven pendant lamps on a white brick wall", caption: "Handwoven details" },
    { src: "assets/photos/signboard.jpg",       alt: "The illuminated green and red Ye’ Jebena signboard", caption: "Look for the green & red sign" },
    { src: "assets/photos/ceremony.jpg",        alt: "Traditional Ethiopian jebena coffee ceremony", caption: "The jebena ceremony" },
    { src: "assets/photos/roasting.jpg",        alt: "Freshly roasted Ethiopian coffee beans", caption: "Freshly roasted" },
    { src: "assets/photos/snacks.jpg",          alt: "Traditional Ethiopian snacks served with coffee", caption: "Traditional snacks" },
    { src: "assets/photos/seating.jpg",         alt: "Indoor seating at Ye’ Jebena", caption: "Indoor seating" },
    { src: "assets/photos/outdoor.jpg",         alt: "Outdoor seating at Ye’ Jebena", caption: "Outdoor seating" }
  ],

  /* ---------- Reviews ---------- */
  reviews: {
    apiUrl: "/api/reviews",   // The Node server in this project provides this
    pageSize: 6
  }
};
