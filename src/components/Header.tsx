import { LogOut, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  showAdminLink?: boolean;
  onAdminClick?: () => void;
}

export function Header({ title, showAdminLink, onAdminClick }: HeaderProps) {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold truncate">{title}</h1>
        
        <div className="flex items-center gap-2">
          {isAdmin && showAdminLink && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAdminClick}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Package className="h-5 w-5" />
            </Button>
          )}
          
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm opacity-90">
                <User className="h-4 w-4" />
                <span className="max-w-[150px] truncate">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
