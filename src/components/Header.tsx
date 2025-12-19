import { LogOut, Package, User, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showAdminLink?: boolean;
  onAdminClick?: () => void;
}

export function Header({ title, showAdminLink, onAdminClick }: HeaderProps) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold truncate">{title}</h1>
        
        <div className="flex items-center gap-2">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/20"
              title="Painel de Desempenho"
            >
              <BarChart3 className="h-5 w-5" />
            </Button>
          )}
          
          {isAdmin && showAdminLink && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAdminClick}
              className="text-white hover:bg-white/20"
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
                className="text-white hover:bg-white/20"
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
