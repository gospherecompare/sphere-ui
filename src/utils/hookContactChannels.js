export const hookContactChannels = [
  {
    key: "business",
    name: "Business",
    email: "business@tryhook.shop",
    contactType: "Business partnerships",
    headline: "Partnerships and commercial conversations",
    summary:
      "For brand partnerships, affiliate ideas, sponsorships, and growth conversations.",
    story:
      "The business inbox keeps collaboration and commercial opportunities separate from everyday support, so partnership conversations reach the right people quickly.",
  },
  {
    key: "contact",
    name: "Contact",
    email: "contact@tryhook.shop",
    contactType: "General contact",
    headline: "General questions and routing",
    summary:
      "For messages that need a first review before being sent to support, editorial, or business.",
    story:
      "The contact inbox is the front door for TryHook. It helps broad questions, suggestions, and account-neutral requests get routed cleanly.",
  },
  {
    key: "news",
    name: "News",
    email: "news@tryhook.shop",
    contactType: "News and press",
    headline: "Launches, press notes, and editorial leads",
    summary:
      "For product launches, press material, editorial tips, and news corrections.",
    story:
      "The news inbox supports the content side of TryHook, where launches, product updates, and useful buying context become clearer stories for readers.",
  },
  {
    key: "support",
    name: "Support",
    email: "support@tryhook.shop",
    contactType: "Customer support",
    headline: "Help, corrections, and product data",
    summary:
      "For incorrect specs, broken pages, comparison issues, and help using TryHook.",
    story:
      "The support inbox is where user questions, product-page corrections, and comparison issues are reviewed so TryHook keeps improving.",
  },
];

export const hookContactEmailMap = hookContactChannels.reduce(
  (channelsByKey, channel) => ({
    ...channelsByKey,
    [channel.key]: channel.email,
  }),
  {},
);

export const primaryContactEmail = hookContactEmailMap.contact;
export const supportContactEmail = hookContactEmailMap.support;
