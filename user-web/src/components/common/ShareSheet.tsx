import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Link2, Mail, MessageSquare, Send, X } from "lucide-react";

import AppSheet from "@/src/components/common/AppSheet";
import { WhatsappIcon } from "@/src/components/common/BrandIcons";
import { copyToClipboard } from "@/src/utils/share";

interface ShareSheetTheme {
  text: string;
  secondaryBackground: string;
}

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Product name shown under the sheet title and in the email subject. */
  title: string;
  /** Canonical URL to share. */
  url: string;
  /** Share message WITHOUT the URL; the sheet appends it. */
  text: string;
  theme: ShareSheetTheme;
}

/**
 * Shared product share sheet: WhatsApp, Telegram, X, Email, SMS and
 * copy-link. Used by the clothing and jewellery product detail pages.
 */
export default function ShareSheet({
  visible,
  onClose,
  title,
  url,
  text,
  theme,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const message = useMemo(() => `${text}\n${url}`, [text, url]);

  const handleClose = useCallback(() => {
    setCopied(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (await copyToClipboard(message)) setCopied(true);
  }, [message]);

  const targets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
      bg: "#25D366",
      icon: <WhatsappIcon size={24} color="#ffffff" />,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      bg: "#229ED9",
      icon: <Send size={20} color="#ffffff" />,
    },
    {
      label: "X",
      href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      bg: "#000000",
      icon: <X size={20} color="#ffffff" />,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`,
      bg: "#EA4335",
      icon: <Mail size={20} color="#ffffff" />,
    },
    {
      label: "SMS",
      href: `sms:?&body=${encodeURIComponent(message)}`,
      bg: "#F59E0B",
      icon: <MessageSquare size={20} color="#ffffff" />,
    },
  ];

  return (
    <AppSheet
      visible={visible}
      onClose={handleClose}
      title="Share this product"
      subtitle={title}
    >
      <div className="grid grid-cols-3 gap-4 px-4 pt-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {targets.map((target) => (
          <a
            key={target.label}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="flex flex-col items-center gap-2"
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: target.bg }}
            >
              {target.icon}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: theme.text }}
            >
              {target.label}
            </span>
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="flex cursor-pointer flex-col items-center gap-2"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.secondaryBackground }}
          >
            {copied ? (
              <Check size={20} color={theme.text} />
            ) : (
              <Link2 size={20} color={theme.text} />
            )}
          </span>
          <span className="text-xs font-semibold" style={{ color: theme.text }}>
            {copied ? "Copied" : "Copy link"}
          </span>
        </button>
      </div>
    </AppSheet>
  );
}
