export function ArticolloLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className="relative">
        <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-serif font-bold text-sm">A</span>
        </div>
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent"></div>
      </div>
      <span className="font-serif font-bold text-lg">Articollo</span>
    </div>
  )
}
