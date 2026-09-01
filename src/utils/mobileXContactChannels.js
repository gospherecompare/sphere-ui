export const mobileXContactChannels = [
  {
    key: "business",

    name: "Business",

    email: "business@mobilesx.in",

    contactType: "Business partnerships",

    headline: "Partnerships and commercial conversations",

    summary:
      "For brand partnerships, affiliate ideas, sponsorships, advertising, and growth conversations.",

    story:
      "The business inbox keeps collaboration and commercial opportunities separate from everyday support, so partnership conversations reach the right team quickly.",
  },

  {
    key: "contact",

    name: "Contact",

    email: "contact@mobilesx.in",

    contactType: "General contact",

    headline: "General questions and routing",

    summary:
      "For messages that need a first review before being sent to support, editorial, or business.",

    story:
      "The contact inbox is the front door for MobilesX. It helps broad questions, suggestions, and general requests get routed cleanly.",
  },

  {
    key: "news",

    name: "News",

    email: "news@mobilesx.in",

    contactType: "News and press",

    headline: "Launches, press notes, and editorial leads",

    summary:
      "For product launches, press material, editorial tips, and news corrections.",

    story:
      "The news inbox supports the editorial side of MobilesX, where launches, product updates, and useful mobile technology context become clearer stories for readers.",
  },

  {
    key: "support",

    name: "Support",

    email: "support@mobilesx.in",

    contactType: "Customer support",

    headline: "Help, corrections, and product data",

    summary:
      "For incorrect specifications, broken pages, comparison issues, and help using MobilesX.",

    story:
      "The support inbox is where user questions, product-page corrections, and comparison issues are reviewed so MobilesX can keep improving.",
  },
];

export const mobileXContactEmailMap = mobileXContactChannels.reduce(
  (channelsByKey, channel) => ({
    ...channelsByKey,
    [channel.key]: channel.email,
  }),
  {},
);

export const primaryContactEmail = mobileXContactEmailMap.contact;

export const supportContactEmail = mobileXContactEmailMap.support;
