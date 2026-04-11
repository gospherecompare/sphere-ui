import React from "react";
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaReddit,
  FaEnvelope,
  FaCopy,
} from "react-icons/fa";

const SocialShareButtons = ({ title, url, description = "" }) => {
  const [copied, setCopied] = React.useState(false);

  const encodedUrl = encodeURIComponent(url || window.location.href);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shareLinks = [
    {
      name: "Facebook",
      icon: FaFacebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Twitter",
      icon: FaTwitter,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:text-sky-500",
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:text-blue-700",
    },
    {
      name: "Reddit",
      icon: FaReddit,
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      color: "hover:text-orange-500",
    },
    {
      name: "Email",
      icon: FaEnvelope,
      url: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`,
      color: "hover:text-gray-600",
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-slate-600">Share:</span>
      <div className="flex gap-3">
        {shareLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Share on ${link.name}`}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 ${link.color}`}
            >
              <Icon className="h-4 w-4" />
            </a>
          );
        })}

        <button
          onClick={handleCopyLink}
          title="Copy link"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
            copied ? "text-green-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <FaCopy className="h-4 w-4" />
        </button>
      </div>
      {copied && (
        <span className="text-xs font-medium text-green-600">Link copied!</span>
      )}
    </div>
  );
};

export default SocialShareButtons;
