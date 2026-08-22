import * as React from "react";
import { cn } from "@/lib/utils";

export interface BlockquoteProps extends React.BlockquoteHTMLAttributes<HTMLQuoteElement> {
  author?: string;
  source?: string;
}

/**
 * Astryx Blockquote Component
 * Standardized styling for quotes, notes, and references.
 */
const Blockquote = React.forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ className, children, author, source, ...props }, ref) => {
    return (
      <figure className="my-4">
        <blockquote
          ref={ref}
          className={cn(
            "relative border-l-4 border-primary/40 bg-muted/30 py-4 pl-6 pr-4 italic text-foreground/90 transition-mirats-base",
            "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary/20",
            className,
          )}
          {...props}
        >
          {typeof children === "string" ? <p className="leading-relaxed">{children}</p> : children}
        </blockquote>
        {(author || source) && (
          <figcaption className="mt-2 text-right text-xs text-muted-foreground">
            {author && <cite className="font-semibold not-italic">— {author}</cite>}
            {author && source && ", "}
            {source && <span className="italic">{source}</span>}
          </figcaption>
        )}
      </figure>
    );
  },
);

Blockquote.displayName = "Blockquote";

export { Blockquote };
