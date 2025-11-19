"use client";

import { useState, type FC } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Download,
  Copy,
  Twitter,
  Loader2,
  Check,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/design-system/atoms/Button";
import { captureElement, downloadImage, copyToClipboard, shareToTwitter } from "@/lib/utils/screenshot";

interface ShareButtonProps {
  elementRef: React.RefObject<HTMLElement>;
  filename?: string;
  twitterText?: string;
  className?: string;
}

export const ShareButton: FC<ShareButtonProps> = ({
  elementRef,
  filename = "lumotrade-share",
  twitterText = "Check out this analysis from @LumoTrade",
  className,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCapture = async (action: 'download' | 'copy' | 'twitter') => {
    if (!elementRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const dataUrl = await captureElement(elementRef.current, {
        backgroundColor: '#fefffe', // Light mode bg
        scale: 2,
      });

      switch (action) {
        case 'download':
          await downloadImage(dataUrl, filename);
          break;
        case 'copy':
          const success = await copyToClipboard(dataUrl);
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
          break;
        case 'twitter':
          // First download, then open Twitter
          await downloadImage(dataUrl, filename);
          shareToTwitter(twitterText, window.location.href);
          break;
      }
    } catch (error) {
      console.error('Share action failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          <span className="ml-2">Share</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] bg-card rounded-lg border border-border p-1 shadow-lg z-50"
          sideOffset={5}
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none"
            onSelect={() => handleCapture('download')}
          >
            <Download className="h-4 w-4" />
            Download PNG
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none"
            onSelect={() => handleCapture('copy')}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Image
              </>
            )}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-border my-1" />

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 rounded cursor-pointer outline-none"
            onSelect={() => handleCapture('twitter')}
          >
            <Twitter className="h-4 w-4" />
            Share on Twitter
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

