import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { Music, User, LogOut, Users, Folder } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold">
              <span className="hidden sm:inline">МузыкАИ Студия</span>
              <span className="sm:hidden">МузыкАИ</span>
            </h1>
          </Link>
          
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant={location.pathname === '/' ? 'default' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link to="/" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Студия
                </Link>
              </Button>
              <Button 
                variant={location.pathname === '/artists' ? 'default' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link to="/artists" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Артисты
                </Link>
              </Button>
              <Button 
                variant={location.pathname === '/projects' ? 'default' : 'ghost'} 
                size="sm" 
                asChild
              >
                <Link to="/projects" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Проекты
                </Link>
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2 sm:px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm truncate max-w-[120px]">
                    {user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="md:hidden">
                  <DropdownMenuItem asChild>
                    <Link to="/artists" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Артисты
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/projects" className="flex items-center">
                      <Folder className="mr-2 h-4 w-4" />
                      Проекты
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="px-4">
              <a href="/auth">Войти</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}