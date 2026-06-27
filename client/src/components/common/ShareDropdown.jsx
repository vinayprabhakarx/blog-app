import React, { useRef, useMemo, useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaLinkedin, FaTelegram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const ShareDropdown = ({ isOpen, url, title, onMouseEnter, onMouseLeave }) => {
  const dropdownRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const shareLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    return {
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      twitter: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    };
  }, [url, title]);

  const shareOptions = useMemo(
    () => [
      { name: "WhatsApp", icon: FaWhatsapp, platform: "whatsapp" },
      { name: "X", icon: FaXTwitter, platform: "twitter" },
      { name: "Facebook", icon: FaFacebook, platform: "facebook" },
      { name: "LinkedIn", icon: FaLinkedin, platform: "linkedin" },
      { name: "Telegram", icon: FaTelegram, platform: "telegram" },
    ],
    []
  );

  const handleShare = useCallback(
    (platform) => {
      window.open(shareLinks[platform], "_blank", "width=600,height=400");
    },
    [shareLinks]
  );

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }, [url]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      data-share-dropdown
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute top-full left-0 mt-2 bg-card text-card-foreground rounded-lg shadow-lg border border-border p-3 z-50 min-w-max"
    >
      <div className="flex flex-col gap-2">
        {shareOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.platform}
              onClick={() => handleShare(option.platform)}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer border border-border"
              title={option.name}
            >
              <IconComponent
                className="w-5 h-5 text-muted-foreground"
              />
            </button>
          );
        })}

        <button
          onClick={copyToClipboard}
          className="flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer text-foreground border border-border"
          title={copied ? "Copied!" : "Copy Link"}
        >
          {copied ? (
            <Check className="w-5 h-5 text-success" />
          ) : (
            <Copy
              className="w-5 h-5 text-muted-foreground"
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default React.memo(ShareDropdown);
