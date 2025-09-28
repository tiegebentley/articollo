import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArticolloLogo } from "@/components/ui/articollo-logo"
import { ChevronDown, Settings, HelpCircle, User } from "lucide-react"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={`flex h-14 items-center bg-card border-b border-border px-6 justify-between ${className || ""}`}>
      <div className="flex items-center gap-6">
        <ArticolloLogo />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Research & Content Creation</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-xs font-medium">AI Assistant Active</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="https://github.com/emmanuel-martinez-dev.png" alt="User avatar" />
              </Avatar>
              <span>Account</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
