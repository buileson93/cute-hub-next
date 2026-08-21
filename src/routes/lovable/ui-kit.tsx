import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { Search, Plus, RotateCcw, Trash2, Mail } from "lucide-react"
import { TYPO } from "@/lib/mirats/ui/typography"
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density"

export const Route = createFileRoute('/lovable/ui-kit')({
  component: UIKitPage,
})

function UIKitPage() {
  const variants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const
  const sizes = ['lg', 'default', 'sm', 'xs'] as const

  return (
    <div className={UI_DENSITY.PAGE_PADDING}>
      <h1 className={TYPO.H1}>MIRATS UI Kit Audit</h1>
      <p className="text-muted-foreground mb-8">Kiểm tra tính nhất quán của Button component và Style Ownership.</p>

      <div className="space-y-12">
        {/* Variants Section */}
        <section>
          <h2 className={TYPO.H2 + " mb-4"}>1. Variants (Default Size)</h2>
          <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-6 rounded-2xl border">
            {variants.map(v => (
              <div key={v} className="flex flex-col items-center gap-2">
                <Button variant={v}>
                  {v === 'destructive' ? <Trash2 className="size-4" /> : <Plus className="size-4" />}
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Button>
                <span className="text-[10px] font-mono opacity-50">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sizes Section */}
        <section>
          <h2 className={TYPO.H2 + " mb-4"}>2. Sizes (Default Variant)</h2>
          <div className="flex flex-wrap gap-6 items-end bg-muted/20 p-6 rounded-2xl border">
            {sizes.map(s => (
              <div key={s} className="flex flex-col items-center gap-2">
                <Button size={s}>
                  <Search className="size-4" />
                  Size {s}
                </Button>
                <span className="text-[10px] font-mono opacity-50">{s}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <Button size="icon">
                <Search className="size-4" />
              </Button>
              <span className="text-[10px] font-mono opacity-50">icon</span>
            </div>
          </div>
        </section>

        {/* States Section */}
        <section>
          <h2 className={TYPO.H2 + " mb-4"}>3. States (Loading & Disabled)</h2>
          <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-6 rounded-2xl border">
             <Button loading>Đang tải...</Button>
             <Button variant="outline" loading>Đang tải...</Button>
             <Button disabled>Bị vô hiệu</Button>
             <Button variant="ghost" size="icon" loading><Search /></Button>
          </div>
        </section>

        {/* Real World Examples */}
        <section>
          <h2 className={TYPO.H2 + " mb-4"}>4. Real World Patterns</h2>
          <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-6 rounded-2xl border">
             <div className="flex items-center gap-2 border p-2 rounded-xl bg-background">
                <Button variant="ghost" size="sm">Hủy</Button>
                <Button size="sm">Lưu thay đổi</Button>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" tooltip="Làm mới"><RotateCcw /></Button>
                <Button variant="default" size="default">
                   <Plus /> Thêm mới
                </Button>
             </div>
          </div>
        </section>
      </div>
    </div>
  )
}
