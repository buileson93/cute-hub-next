import * as React from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MarkdownProps {
  children: string
  /** Bậc heading bắt đầu (1-6) để khớp phân cấp của trang. */
  headingLevelStart?: 1 | 2 | 3 | 4 | 5 | 6
  /** Giới hạn độ dài dòng cho dễ đọc, VD "72ch". */
  contentWidth?: string
  /** Nén khoảng cách cho khung chat / panel hẹp. */
  compact?: boolean
  className?: string
}

const HEAD_CLASS = [
  "text-xl font-semibold tracking-tight",
  "text-lg font-semibold tracking-tight",
  "text-[15px] font-semibold",
  "text-[14px] font-semibold",
  "text-[13px] font-semibold",
  "text-[13px] font-medium text-muted-foreground",
]

function isExternal(href?: string) {
  return !!href && /^https?:\/\//i.test(href)
}

/**
 * Astryx Markdown — render chuỗi markdown bằng token của design system.
 * Dùng cho nội dung người dùng nhập, phản hồi AI và tài liệu.
 */
export function Markdown({
  children,
  headingLevelStart = 2,
  contentWidth,
  compact = false,
  className,
}: MarkdownProps) {
  const components = React.useMemo<Components>(() => {
    const heading = (offset: number) => {
      const level = Math.min(6, headingLevelStart + offset)
      const Tag = `h${level}` as "h1"
      const Cmp = ({ children: c }: { children?: React.ReactNode }) => (
        <Tag className={cn(HEAD_CLASS[level - 1], compact ? "mt-3 mb-1" : "mt-5 mb-2", "first:mt-0")}>
          {c}
        </Tag>
      )
      return Cmp
    }

    return {
      h1: heading(0),
      h2: heading(1),
      h3: heading(2),
      h4: heading(3),
      h5: heading(4),
      h6: heading(5),
      p: ({ children: c }) => (
        <p className={cn("text-[13px] leading-relaxed", compact ? "my-1.5" : "my-2")}>{c}</p>
      ),
      a: ({ href, children: c }) => (
        <a
          href={href}
          target={isExternal(href) ? "_blank" : undefined}
          rel={isExternal(href) ? "noreferrer noopener" : undefined}
          className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {c}
          {isExternal(href) && <ExternalLink className="h-3 w-3" aria-hidden />}
        </a>
      ),
      ul: ({ children: c }) => (
        <ul className="my-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed">{c}</ul>
      ),
      ol: ({ children: c }) => (
        <ol className="my-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed">{c}</ol>
      ),
      li: ({ children: c }) => <li className="marker:text-muted-foreground">{c}</li>,
      blockquote: ({ children: c }) => (
        <blockquote className="my-3 border-l-2 border-primary/40 bg-muted/30 py-2 pl-3 pr-2 text-[13px] italic text-foreground/90">
          {c}
        </blockquote>
      ),
      hr: () => <hr className="my-4 border-border" />,
      strong: ({ children: c }) => <strong className="font-semibold">{c}</strong>,
      em: ({ children: c }) => <em className="italic">{c}</em>,
      del: ({ children: c }) => <del className="text-muted-foreground line-through">{c}</del>,
      code: ({ className: cls, children: c }) => {
        const block = /language-/.test(cls ?? "")
        if (!block) {
          return (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground">
              {c}
            </code>
          )
        }
        return <code className="font-mono text-[12px] leading-relaxed">{c}</code>
      },
      pre: ({ children: c }) => (
        <pre className="my-3 overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-[12px]">
          {c}
        </pre>
      ),
      table: ({ children: c }) => (
        <div className="my-3 overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-[12px]">{c}</table>
        </div>
      ),
      thead: ({ children: c }) => <thead className="bg-muted/50">{c}</thead>,
      th: ({ children: c }) => (
        <th className="border-b px-2 py-1.5 text-left font-semibold">{c}</th>
      ),
      td: ({ children: c }) => <td className="border-b px-2 py-1.5 align-top">{c}</td>,
      img: ({ src, alt }) => (
        <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="my-3 rounded-lg border" />
      ),
    }
  }, [compact, headingLevelStart])

  return (
    <div
      className={cn("text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      style={contentWidth ? { maxWidth: contentWidth } : undefined}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown
