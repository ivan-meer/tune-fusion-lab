import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Music } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: "Ошибка",
            description: "Пароли не совпадают",
            variant: "destructive"
          });
          return;
        }
        
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Ошибка регистрации",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Регистрация успешна",
            description: "Проверьте почту для подтверждения аккаунта"
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Ошибка входа",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Что-то пошло не так",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Music className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isSignUp ? 'Создать аккаунт' : 'Вход в МузыкАИ'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Зарегистрируйтесь для создания музыки с ИИ' 
              : 'Войдите в свой аккаунт для продолжения'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading 
                ? 'Загрузка...' 
                : (isSignUp ? 'Зарегистрироваться' : 'Войти')
              }
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? 'Уже есть аккаунт? Войти' 
                : 'Нет аккаунта? Зарегистрироваться'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}