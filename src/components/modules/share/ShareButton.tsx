import { Share2 } from "lucide-react";
import { Button } from "@/components/design-system/atoms/Button";

interface ShareButtonProps {
  onShare?: () => void;
  className?: string;
}

export function ShareButton({ onShare, className }: ShareButtonProps) {
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      if (navigator.share) {
        navigator.share({
          title: "LumoTrade",
          text: "Check out my watchlist on LumoTrade",
          url: window.location.href,
        });
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={className}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
}

