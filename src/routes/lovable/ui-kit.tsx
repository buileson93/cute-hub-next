import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { TYPO } from '@/lib/mirats/ui/typography'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/lovable/ui-kit')({
  component: UIKitPage,
})

function UIKitPage() {
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('compact')
  
  const variants = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
  const sizes = ['default', 'sm', 'xs', 'lg', 'icon'] as const

  return (
    <div className="p-8 space-y-12" data-density={density}>
      <header className="flex justify-between items-center">
        <div>
          <h1 className={TYPO.H1}>UI Test Fixture: Buttons</h1>
          <p className="text-muted-foreground mt-2 text-sm">Dùng để xác minh style ownership & regression.</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          {(['compact', 'comfortable', 'spacious'] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDensity(d)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                density === d ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-8">
        {variants.map(variant => (
          <section key={variant} className="space-y-4">
            <h2 className={cn(TYPO.H2, "capitalize border-b pb-2")}>{variant} Variant</h2>
            <div className="flex flex-wrap items-end gap-6">
              {sizes.map(size => (
                <div key={size} className="space-y-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{size}</span>
                  <div className="flex flex-col gap-2">
                    <Button variant={variant} size={size}>
                      {size === 'icon' ? '🚀' : 'Button Text'}
                    </Button>
                    <Button variant={variant} size={size} loading>
                      {size === 'icon' ? '🚀' : 'Button Text'}
                    </Button>
                    <Button variant={variant} size={size} disabled>
                      {size === 'icon' ? '🚀' : 'Button Text'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
