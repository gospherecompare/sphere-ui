import React, { useId } from "react";

const PhoneShell = ({ x = 92, y = 18, width = 76, height = 144, children }) => (
  <g className="home-v2-device-art__phone">
    <rect x={x} y={y} width={width} height={height} rx="18" />
    <rect x={x + 7} y={y + 12} width={width - 14} height={height - 25} rx="12" />
    <rect x={x + width / 2 - 12} y={y + 6} width="24" height="4" rx="2" />
    <circle cx={x + width / 2} cy={y + height - 7} r="2.4" />
    {children}
  </g>
);

const SignalDots = () => (
  <g className="home-v2-device-art__dots">
    <circle cx="26" cy="26" r="3" />
    <circle cx="236" cy="34" r="4" />
    <circle cx="218" cy="148" r="2.5" />
    <circle cx="42" cy="154" r="2" />
  </g>
);

const SmartDeviceArt = ({ variant = "ecosystem", className = "", caption = "" }) => {
  const rawId = useId();
  const gradientId = `home-device-gradient-${rawId.replace(/:/g, "")}`;

  return (
    <div
      className={`home-v2-device-art is-${variant} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg viewBox="0 0 260 180" role="presentation" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <rect
          className="home-v2-device-art__wash"
          x="1"
          y="1"
          width="258"
          height="178"
          rx="28"
          fill={`url(#${gradientId})`}
        />
        <SignalDots />

        {variant === "ecosystem" ? (
          <>
            <g className="home-v2-device-art__laptop">
              <rect x="24" y="47" width="117" height="76" rx="9" />
              <path d="M14 128h138l-9 13H24z" />
              <path d="M45 67h74M45 79h58M45 91h66" />
            </g>
            <PhoneShell x={121} y={30} width={70} height={132}>
              <circle cx="142" cy="58" r="8" />
              <circle cx="162" cy="58" r="8" />
              <path d="M140 89h32M140 101h22M140 113h28" />
            </PhoneShell>
            <g className="home-v2-device-art__watch">
              <path d="M207 46v19M207 112v22" />
              <rect x="187" y="62" width="40" height="52" rx="13" />
              <circle cx="207" cy="88" r="8" />
            </g>
            <g className="home-v2-device-art__earbuds">
              <path d="M34 26c9 0 15 6 15 14v18M62 26c-9 0-15 6-15 14v18" />
              <rect x="34" y="55" width="10" height="24" rx="5" />
              <rect x="52" y="55" width="10" height="24" rx="5" />
            </g>
          </>
        ) : null}

        {variant === "search" ? (
          <>
            <PhoneShell>
              <path d="M112 57h36M112 69h24M112 116h38" />
              <circle cx="130" cy="92" r="22" />
              <path d="m146 108 17 17" />
            </PhoneShell>
            <path className="home-v2-device-art__orbit" d="M21 119c25 35 68 50 109 47" />
            <path className="home-v2-device-art__orbit" d="M178 18c27 9 49 29 61 53" />
          </>
        ) : null}

        {variant === "performance" ? (
          <>
            <PhoneShell>
              <rect x="114" y="61" width="32" height="32" rx="6" />
              <path d="M121 70h18M121 78h18M121 86h12" />
              <path d="M114 68h-10M114 78h-13M114 88h-10M146 68h10M146 78h13M146 88h10" />
            </PhoneShell>
            <path className="home-v2-device-art__chart" d="m24 133 27-24 22 10 29-37" />
            <path className="home-v2-device-art__chart" d="M24 145h80" />
            <circle cx="51" cy="109" r="4" />
            <circle cx="73" cy="119" r="4" />
            <circle cx="102" cy="82" r="4" />
            <g className="home-v2-device-art__speed">
              <path d="M183 121a31 31 0 0 1 53 0" />
              <path d="m210 105 13-18" />
              <circle cx="210" cy="122" r="4" />
            </g>
          </>
        ) : null}

        {variant === "brands" ? (
          <>
            <PhoneShell x={95} y={25} width={70} height={134}>
              <path d="M111 65h38M111 77h28M111 112h38" />
            </PhoneShell>
            {[28, 66, 190, 216].map((x, index) => (
              <g key={x} className="home-v2-device-art__brand-tile">
                <rect x={x} y={index % 2 === 0 ? 42 : 91} width="34" height="34" rx="10" />
                <circle cx={x + 17} cy={(index % 2 === 0 ? 42 : 91) + 17} r="6" />
              </g>
            ))}
            <path className="home-v2-device-art__orbit" d="M46 75c25-48 113-70 165-26" />
            <path className="home-v2-device-art__orbit" d="M47 118c39 44 126 45 166 2" />
          </>
        ) : null}

        {variant === "launch" ? (
          <>
            <PhoneShell x={99} y={22} width={66} height={132}>
              <path d="m116 96 16-35 16 35-16-8z" />
              <path d="M122 101v20M142 101v20" />
            </PhoneShell>
            <path className="home-v2-device-art__orbit" d="M22 105c45-54 153-77 216-28" />
            <path className="home-v2-device-art__orbit" d="M36 137c63 35 137 34 188-3" />
            <path d="m55 47 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" />
            <path d="m215 40 3 7 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1z" />
          </>
        ) : null}

        {variant === "value" ? (
          <>
            <PhoneShell x={44} y={28} width={70} height={130}>
              <path d="M62 68h34M62 80h24M62 119h34" />
            </PhoneShell>
            <g className="home-v2-device-art__ticket">
              <path d="M128 53h91v68h-91l-13-34z" />
              <path d="M151 70h44M151 84h34M151 99h50" />
              <circle cx="132" cy="87" r="6" />
            </g>
            <g className="home-v2-device-art__bars">
              <rect x="148" y="135" width="13" height="19" rx="4" />
              <rect x="169" y="124" width="13" height="30" rx="4" />
              <rect x="190" y="110" width="13" height="44" rx="4" />
              <rect x="211" y="96" width="13" height="58" rx="4" />
            </g>
          </>
        ) : null}

        {variant === "compare" ? (
          <>
            <PhoneShell x={30} y={28} width={68} height={126}>
              <circle cx="51" cy="58" r="8" />
              <circle cx="74" cy="58" r="8" />
              <path d="M47 92h34M47 104h25" />
            </PhoneShell>
            <PhoneShell x={162} y={28} width={68} height={126}>
              <circle cx="183" cy="58" r="8" />
              <circle cx="206" cy="58" r="8" />
              <path d="M179 92h34M179 104h25" />
            </PhoneShell>
            <g className="home-v2-device-art__compare-arrows">
              <path d="M108 72h42l-10-10M150 72l-10 10" />
              <path d="M152 112h-42l10-10M110 112l10 10" />
            </g>
            <circle cx="130" cy="92" r="17" />
            <path d="M122 92h16" />
          </>
        ) : null}

        {variant === "newsroom" ? (
          <>
            <PhoneShell x={145} y={26} width={66} height={128}>
              <path d="M160 59h36M160 72h28M160 94h36M160 107h31M160 120h22" />
              <rect x="160" y="40" width="36" height="12" rx="5" />
            </PhoneShell>
            <g className="home-v2-device-art__news-sheet">
              <path d="M31 46h108v91H31z" />
              <rect x="44" y="60" width="39" height="27" rx="5" />
              <path d="M92 62h33M92 72h25M92 82h31M44 100h81M44 112h70M44 124h77" />
            </g>
            <g className="home-v2-device-art__broadcast">
              <circle cx="218" cy="45" r="5" />
              <path d="M218 33a12 12 0 0 1 12 12M218 24a21 21 0 0 1 21 21" />
            </g>
          </>
        ) : null}
      </svg>
      {caption ? <span>{caption}</span> : null}
    </div>
  );
};

export default SmartDeviceArt;
