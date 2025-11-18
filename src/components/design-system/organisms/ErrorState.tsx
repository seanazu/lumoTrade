import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../atoms/Button";
import { GlassCard } from "./GlassCard";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  onRetry,
}) => {
  return (
    <GlassCard className="flex flex-col items-center justify-center text-center py-12">
      <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Another Symbol
        </Button>
      )}
    </GlassCard>
  );
};

export { ErrorState };

