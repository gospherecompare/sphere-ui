const imageUrl = (seed) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`;

const buildBody = (paragraphs) => paragraphs;

export const BLOG_ARTICLES = [
  {
    slug: "evofox-launches-ronin-x75-mechanical-keyboard-at-rs-4999",
    tag: "FEATURES",
    title:
      "EvoFox launches Ronin X75 Mechanical Keyboard at Rs 4,999 with gasket mount, tri-mode connectivity, and cross-platform support",
    excerpt:
      "A value-focused mechanical keyboard with a softer typing feel, wireless flexibility, and a price that keeps it within reach.",
    author: "Nakul Sawant",
    publishedAt: "2025-03-28",
    image: imageUrl("evofox-ronin-x75-feature"),
    inlineImage: imageUrl("evofox-ronin-x75-inline"),
    body: buildBody([
      "EvoFox is pushing the Ronin X75 as a feature-rich mechanical keyboard for people who want a more premium typing experience without a huge price jump.",
      "The gasket mount and tri-mode connectivity are the headline features here, giving users a softer acoustic profile and the freedom to switch between wired, Bluetooth, and 2.4GHz modes.",
      "For students, creators, and casual gamers, the Rs 4,999 price tag makes the Ronin X75 an easy product to notice in the crowded budget keyboard space.",
    ]),
  },
  {
    slug: "iphone-15-and-iphone-16-about-to-get-costlier-in-india",
    tag: "MOBILE",
    title:
      "iPhone 15 and iPhone 16 about to get costlier in India, but not for the reason you think",
    excerpt:
      "A fresh pricing ripple is building around Apple's current lineup, and the cause may be more complicated than a simple price hike.",
    author: "Sanket Vijaysarathy",
    publishedAt: "2025-03-28",
    image: imageUrl("iphone-15-16-price-story"),
    body: buildBody([
      "Retail chatter suggests that Apple's current iPhone lineup could become more expensive in India, even though the phones themselves have not changed.",
      "The pressure appears to be coming from import costs, promotional inventory shifts, and the way local retailers are resetting stock for the next cycle.",
      "If the movement continues, buyers may see tighter discounts on the iPhone 15 and iPhone 16 family before the market settles again.",
    ]),
  },
  {
    slug: "smartphones-launching-next-week-vivo-v70-fe-realme-16-5g-and-more",
    tag: "SMARTPHONES",
    title:
      "Smartphones launching next week: Vivo V70 FE, Realme 16 5G, and more",
    excerpt:
      "A compact launch calendar is stacking up, with several mid-range phones set to compete on battery life, camera tuning, and fast charging.",
    author: "Marcia Sethose",
    publishedAt: "2025-03-28",
    image: imageUrl("smartphones-launching-next-week"),
    body: buildBody([
      "Next week looks busy for the smartphone market, with Vivo, Realme, and other brands preparing new launches in the mid-range segment.",
      "The focus appears to be on practical upgrades such as bigger batteries, brighter displays, and more aggressive charging speeds rather than headline-grabbing design changes.",
      "That mix should make the week interesting for buyers who want better everyday value without moving all the way into premium pricing.",
    ]),
  },
  {
    slug: "samsung-galaxy-book6-series-launched-in-india",
    tag: "LAPTOPS",
    title:
      "Samsung Galaxy Book6 series launched in India with the latest performance refresh",
    excerpt:
      "Samsung's new Book6 family lands with a cleaner design, updated internals, and a focus on productivity-first users.",
    author: "Dhruv Joshi",
    publishedAt: "2025-03-27",
    image: imageUrl("samsung-galaxy-book6"),
    inlineImage: imageUrl("samsung-galaxy-book6-inline"),
    body: buildBody([
      "Samsung has refreshed its Galaxy Book6 line for Indian buyers who want a thin-and-light machine that still feels fast enough for day-to-day work.",
      "The series leans on a stronger performance baseline and the usual Samsung software polish, making it an easy shortlist option for students and office users.",
      "The real story here is the balance between portability, display quality, and an ecosystem that still feels cohesive across Samsung devices.",
    ]),
  },
  {
    slug: "vivo-t5-pro-tipped-to-launch-in-india-by-mid-april",
    tag: "SMARTPHONES",
    title:
      "Vivo T5 Pro tipped to launch in India by mid-April, price range has been hinted",
    excerpt:
      "A new Vivo T-series phone is expected soon, and the early pricing window suggests a familiar mid-range strategy.",
    author: "Saloni Tandon",
    publishedAt: "2025-03-27",
    image: imageUrl("vivo-t5-pro"),
    body: buildBody([
      "The Vivo T5 Pro is reportedly on track for an India launch by mid-April, which would give the brand a fresh entry in the competitive mid-range segment.",
      "The early chatter points to a price band that should place it against several familiar rivals rather than against flagship killers.",
      "If Vivo gets the camera tuning and battery life right, the T5 Pro could become one of the more balanced launches of the season.",
    ]),
  },
  {
    slug: "realme-narzo-100-lite-india-launch-expected-soon",
    tag: "EXCLUSIVE",
    title:
      "[Exclusive] Realme Narzo 100 Lite India launch expected soon; RAM, storage and colours leaked",
    excerpt:
      "The Narzo 100 Lite may arrive with a familiar formula, but the leaked variants suggest a strong focus on value.",
    author: "Marcia Sethose",
    publishedAt: "2025-03-27",
    image: imageUrl("realme-narzo-100-lite"),
    inlineImage: imageUrl("realme-narzo-100-lite-inline"),
    body: buildBody([
      "Realme's Narzo lineup usually targets buyers who want affordable hardware without losing the playful branding that the series is known for.",
      "This leak points to RAM, storage, and colour combinations that are designed to make the phone easy to shop by budget rather than by spec sheet alone.",
      "If the final launch follows the leak closely, the Narzo 100 Lite should land as another simple, value-first option for entry-level buyers.",
    ]),
  },
  {
    slug: "tecno-spark-50-5g-with-6500mah-battery-and-military-grade-build",
    tag: "FEATURE",
    title:
      "Tecno Spark 50 5G with 6,500mAh battery and military grade build officially teased",
    excerpt:
      "Tecno is leaning into battery life and toughness with its next Spark phone, which should appeal to long-use buyers.",
    author: "Ramneek Singh",
    publishedAt: "2025-03-27",
    image: imageUrl("tecno-spark-50-5g"),
    body: buildBody([
      "Tecno is highlighting endurance first with the Spark 50 5G, using a 6,500mAh battery and ruggedness claims as the main talking points.",
      "That strategy makes sense in a segment where buyers often compare battery size, charging speed, and real-world durability before anything else.",
      "The design may not be flashy, but the device is clearly aimed at users who want a phone that can keep going through a long day.",
    ]),
  },
  {
    slug: "oneplus-to-expand-service-network-in-india-to-over-600-centres",
    tag: "NETWORK",
    title:
      "OnePlus to expand service network in India to over 600 centres; new support push planned",
    excerpt:
      "OnePlus is broadening its service footprint, which should help users who care about faster support and easier repairs.",
    author: "Saloni Tandon",
    publishedAt: "2025-03-27",
    image: imageUrl("oneplus-service-network"),
    body: buildBody([
      "OnePlus is expanding its service network across India as it tries to strengthen the experience after purchase.",
      "A larger network of centres should help with quicker repairs, simpler walk-in support, and a more dependable ownership story.",
      "For buyers comparing brands, after-sales support is often the deciding factor once the spec sheet stops being enough on its own.",
    ]),
  },
  {
    slug: "motorola-razr-70-ultra-leak-suggests-similar-design",
    tag: "LEAK",
    title:
      "Motorola Razr 70 Ultra leak suggests similar design, possible internal changes",
    excerpt:
      "Motorola's next foldable may look familiar on the outside, but the real changes could be hidden inside.",
    author: "Saloni Tandon",
    publishedAt: "2025-03-27",
    image: imageUrl("motorola-razr-70-ultra"),
    body: buildBody([
      "The Razr 70 Ultra leak points toward an evolution rather than a total redesign, which is common for premium foldables.",
      "Motorola may be focusing on internal refinements, performance tuning, and a more mature software package instead of changing the silhouette too much.",
      "That could still be enough to keep the Razr line interesting for buyers who care about the foldable form factor.",
    ]),
  },
  {
    slug: "redmi-note-15-se-complete-design-and-crimson-reserve-colour",
    tag: "FEATURE",
    title:
      "Redmi Note 15 SE complete design and Crimson Reserve colour revealed",
    excerpt:
      "Redmi's next SE model is showing up with a fresh colourway and a design that looks ready for a wider launch.",
    author: "Marcia Sethose",
    publishedAt: "2025-03-27",
    image: imageUrl("redmi-note-15-se"),
    inlineImage: imageUrl("redmi-note-15-se-inline"),
    body: buildBody([
      "The Redmi Note 15 SE appears to be moving into the spotlight with a finished design and a named colour variant that stands out in promo material.",
      "The Crimson Reserve finish gives the phone a bit of personality without pushing it into a flashy aesthetic, which should suit the Note lineup well.",
      "If the rest of the hardware follows Redmi's usual pattern, the SE model should aim at buyers who want a practical mid-range phone with a touch of style.",
    ]),
  },
  {
    slug: "iqoo-z11-goes-official-in-china-with-9020mah-battery",
    tag: "NEWS",
    title:
      "iQOO Z11 goes official in China with 9,020mAh battery, 165Hz display, and 16GB RAM",
    excerpt:
      "A huge battery and a fast display headline the iQOO Z11, giving it a very spec-heavy launch identity.",
    author: "Ashish Kumar",
    publishedAt: "2025-03-28",
    image: imageUrl("iqoo-z11"),
    body: buildBody([
      "The iQOO Z11 is leaning hard into spec-sheet dominance with a massive battery, a high-refresh display, and a generous memory configuration.",
      "That combination makes it the kind of phone that immediately attracts attention from power users who compare numbers first and design second.",
      "Whether or not it arrives in India in exactly the same form, the phone sets a strong benchmark for the rest of the mid-range crowd.",
    ]),
  },
  {
    slug: "realme-16-5g-to-debut-in-india-on-april-2nd",
    tag: "LAUNCH",
    title:
      "Realme 16 5G to debut in India on April 2nd with launch details now appearing online",
    excerpt:
      "Realme's next 5G phone is nearly ready, and the launch messaging is starting to take shape.",
    author: "Marcia Sethose",
    publishedAt: "2025-03-28",
    image: imageUrl("realme-16-5g"),
    body: buildBody([
      "Realme 16 5G is expected to become official in India on April 2nd, which puts it right in the middle of the seasonal launch rush.",
      "The early signals suggest a phone built to compete on balanced specs and a price that should keep it within reach of mainstream buyers.",
      "For Realme, the challenge will be standing out in a market where launch frequency is high and attention spans are short.",
    ]),
  },
  {
    slug: "apple-reportedly-testing-200mp-camera-sensor",
    tag: "REPORT",
    title:
      "Apple reportedly testing 200MP camera sensor for future iPhone models",
    excerpt:
      "A much larger sensor count could reshape the iPhone camera discussion if Apple decides to move in that direction.",
    author: "Ramneek Singh",
    publishedAt: "2025-03-26",
    image: imageUrl("apple-200mp-camera"),
    inlineImage: imageUrl("apple-200mp-camera-inline"),
    body: buildBody([
      "Apple is reportedly testing a 200MP camera sensor for future iPhone models, which would be a big shift in the company's usual camera story.",
      "Even if the final implementation looks very different from competing Android phones, the move would signal a stronger push toward higher-resolution imaging.",
      "That kind of change tends to matter as much for marketing as it does for the actual photo output, especially in a premium phone market.",
    ]),
  },
  {
    slug: "redmi-note-15-se-5g-india-launch-set-for-april-2nd",
    tag: "LAUNCH",
    title:
      "Redmi Note 15 SE 5G India launch set for April 2nd; teaser reveals design and colour",
    excerpt:
      "Redmi's next SE model is arriving with a fresh colourway and a design that looks ready for a wider launch.",
    author: "Marcia Sethose",
    publishedAt: "2025-03-28",
    image: imageUrl("redmi-note-15-se-april-2"),
    inlineImage: imageUrl("redmi-note-15-se-april-2-inline"),
    body: buildBody([
      "The Redmi Note 15 SE 5G appears to be heading for an India launch on April 2, with teaser material already showing off the phone's design language.",
      "The company seems to be leaning into a practical mid-range formula that mixes a polished look with the familiar Redmi value proposition.",
      "If the final pricing stays competitive, the Note 15 SE could become one of the easier phones to recommend in the segment.",
    ]),
  },
  {
    slug: "oneplus-15t-with-7500mah-battery-and-snapdragon-8-elite-gen-5",
    tag: "FEATURE",
    title:
      "OnePlus 15T with 7,500mAh battery, Snapdragon 8 Elite Gen 5 SoC, and 50MP cameras is now official",
    excerpt:
      "OnePlus is pushing battery capacity and high-end silicon to make the 15T feel like a serious power device.",
    author: "Ramneek Singh",
    publishedAt: "2025-03-28",
    image: imageUrl("oneplus-15t-official"),
    body: buildBody([
      "The OnePlus 15T brings a very large battery and premium silicon together in a package that is clearly built to stand out on paper.",
      "A 50MP camera setup and flagship-grade processing should help the phone stay relevant with buyers who want all-day endurance without moving away from performance.",
      "It is the kind of spec sheet that makes the mid-premium segment feel more crowded than ever.",
    ]),
  },
  {
    slug: "logitech-leads-as-most-sought-after-peripheral-brand",
    tag: "SURVEY",
    title:
      "Logitech leads as the most sought-after peripheral brand in new gaming buyer survey",
    excerpt:
      "A new buyer-insight survey shows how gaming accessories are influencing purchase decisions more than ever.",
    author: "Ashish Kumar",
    publishedAt: "2025-03-28",
    image: imageUrl("logitech-peripheral-survey"),
    body: buildBody([
      "Logitech continues to show up as the preferred accessory brand for buyers who want dependable keyboards, mice, and headsets for gaming and work.",
      "The survey points to a growing interest in products that balance design, durability, and easy software support.",
      "For the market as a whole, that suggests buyers are becoming more selective and more brand-aware around peripherals.",
    ]),
  },
  {
    slug: "vivo-y21-y11-5g-launched-in-india-with-6500mah-battery",
    tag: "SMARTPHONES",
    title:
      "Vivo Y21 5G and Y11 5G launched in India with 6,500mAh battery and MediaTek Dimensity 6300",
    excerpt:
      "Vivo's new entry-level pair leans hard into battery life, practical performance, and straightforward pricing.",
    author: "Marcia Sethose",
    publishedAt: "2025-03-28",
    image: imageUrl("vivo-y21-y11-5g"),
    inlineImage: imageUrl("vivo-y21-y11-5g-inline"),
    body: buildBody([
      "The Vivo Y21 5G and Y11 5G are aimed at value-conscious shoppers who care about battery capacity and reliable day-to-day performance more than headline features.",
      "With the Dimensity 6300 in the mix, the phones should feel comfortable for typical browsing, social apps, streaming, and messaging use.",
      "That makes them easy to slot into Vivo's affordable 5G portfolio without overcomplicating the proposition.",
    ]),
  },
];

export const BLOG_TRENDING = BLOG_ARTICLES.slice(0, 6);

export const POPULAR_PHONES = [
  "Samsung Galaxy A37 5G",
  "Samsung Galaxy A57 5G",
  "Samsung Galaxy S26 Ultra",
  "Samsung Galaxy S26 Plus",
  "Nothing Phone 4a",
  "Motorola Edge 70 Fusion",
  "Vivo V70",
  "iQOO Z11x",
  "POCO X8 Pro Max",
  "iQOO 15R",
  "OnePlus Nord CE 5 5G",
  "Vivo V70 Elite",
  "realme P4 Power",
  "Moto G67 Power",
];

export const MOBILES_LIST = [
  "Best Phones Under 10000",
  "Best Phones Under 15000",
  "Best Phones Under 20000",
  "Best Camera Phones",
  "5G Mobiles",
  "Latest Mobiles",
  "Best Mobiles",
  "Best Gaming Phones",
  "Samsung Mobiles",
  "Xiaomi Mobiles",
];

export const getBlogBySlug = (slug) =>
  BLOG_ARTICLES.find((item) => item.slug === String(slug || "").trim()) || null;
