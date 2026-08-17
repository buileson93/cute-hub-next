import * as React from "react"
import { UploadCloud, X, FileText, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export interface FileInputProps {
  label?: string
  description?: string
  accept?: string
  multiple?: boolean
  /** Giới hạn dung lượng mỗi tệp (MB) */
  maxSizeMb?: number
  maxFiles?: number
  disabled?: boolean
  disabledMessage?: string
  /** Chế độ kéo-thả (mặc định bật) */
  dropzone?: boolean
  value?: File[]
  error?: string
  className?: string
  buttonLabel?: string
  onFilesChange: (files: File[]) => void
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function FileInput({
  label,
  description,
  accept,
  multiple = false,
  maxSizeMb,
  maxFiles,
  disabled,
  disabledMessage,
  dropzone = true,
  value,
  error,
  className,
  buttonLabel = "Chọn tệp",
  onFilesChange,
}: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [internal, setInternal] = React.useState<File[]>([])
  const [localError, setLocalError] = React.useState<string | null>(null)
  const id = React.useId()
  const files = value ?? internal

  const accepts = React.useCallback(
    (f: File) => {
      if (!accept) return true
      const rules = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (!rules.length) return true
      const name = f.name.toLowerCase()
      const type = (f.type || "").toLowerCase()
      return rules.some((r) =>
        r.startsWith(".")
          ? name.endsWith(r)
          : r.endsWith("/*")
            ? type.startsWith(r.slice(0, -1))
            : type === r,
      )
    },
    [accept],
  )

  const commit = React.useCallback(
    (list: FileList | null) => {
      if (!list || disabled) return
      let next = Array.from(list)
      if (!multiple) next = next.slice(0, 1)

      const bad = next.find((f) => !accepts(f))
      if (bad) {
        setLocalError(`Tệp "${bad.name}" không đúng định dạng cho phép.`)
        return
      }
      if (maxSizeMb) {
        const big = next.find((f) => f.size > maxSizeMb * 1024 * 1024)
        if (big) {
          setLocalError(`Tệp "${big.name}" vượt quá ${maxSizeMb}MB.`)
          return
        }
      }
      const merged = multiple ? [...files, ...next] : next
      if (maxFiles && merged.length > maxFiles) {
        setLocalError(`Chỉ được chọn tối đa ${maxFiles} tệp.`)
        return
      }
      setLocalError(null)
      setInternal(merged)
      onFilesChange(merged)
    },
    [accepts, disabled, files, maxFiles, maxSizeMb, multiple, onFilesChange],
  )

  const remove = (i: number) => {
    const next = files.filter((_, idx) => idx !== i)
    setInternal(next)
    setLocalError(null)
    onFilesChange(next)
  }

  const shown = error ?? localError

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="text-xs font-medium">
          {label}
        </Label>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          commit(e.target.files)
          e.currentTarget.value = ""
        }}
      />

      {dropzone ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          aria-label={label ?? buttonLabel}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (disabled) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            commit(e.dataTransfer.files)
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled
              ? "cursor-not-allowed opacity-60 bg-muted/30"
              : "cursor-pointer bg-muted/20 hover:bg-muted/40",
            dragging && "border-primary bg-primary/5",
            shown && "border-destructive",
          )}
        >
          <UploadCloud className={cn("h-6 w-6", dragging ? "text-primary" : "text-muted-foreground")} />
          <div className="text-[13px] font-medium">Kéo thả tệp vào đây hoặc bấm để chọn</div>
          {description && <div className="text-[11px] text-muted-foreground">{description}</div>}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            title={disabled ? disabledMessage : undefined}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="mr-1.5 h-4 w-4" />
            {buttonLabel}
          </Button>
          {description && <span className="text-[11px] text-muted-foreground">{description}</span>}
        </div>
      )}

      {disabled && disabledMessage && (
        <p className="text-[11px] text-muted-foreground">{disabledMessage}</p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1.5"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-xs">{f.name}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{fmtBytes(f.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                aria-label={`Xóa tệp ${f.name}`}
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  remove(i)
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {shown && (
        <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
          <AlertCircle className="h-3 w-3" /> {shown}
        </p>
      )}
    </div>
  )
}

export default FileInput
