import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { PageTransition } from '@/components/ui/page-transition';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import { Music, Brain, Sparkles, Zap, Lock, Mail } from 'lucide-react';

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
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <Header />
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `
                 linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                 linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
               `,
               backgroundSize: '50px 50px',
               opacity: 0.1
             }}>
        </div>
        
        <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <AnimatedCard variant="glass" className="w-full glassmorphism-strong">
                <CardHeader className="text-center space-y-6 pb-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex justify-center"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                        <Music className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <Badge variant="secondary" className="glassmorphism text-xs px-2 py-1">
                          <Brain className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="space-y-3">
                    <CardTitle className="text-2xl lg:text-3xl font-bold">
                      <span className="gradient-text">
                        {isSignUp ? 'Создать аккаунт' : 'Добро пожаловать'}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      {isSignUp 
                        ? 'Присоединяйтесь к будущему музыкального творчества' 
                        : 'Войдите в свой аккаунт для продолжения создания музыки'
                      }
                    </CardDescription>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>ИИ Музыка</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-accent" />
                      <span>Мгновенно</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="glassmorphism border-border/30 focus:border-primary/50 h-12"
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Пароль
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="glassmorphism border-border/30 focus:border-primary/50 h-12"
                      />
                    </motion.div>

                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Подтвердите пароль
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="glassmorphism border-border/30 focus:border-primary/50 h-12"
                        />
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <EnhancedButton 
                        type="submit" 
                        variant="primary"
                        withGlow
                        magnetic
                        className="w-full h-12 text-base font-semibold"
                        disabled={isLoading}
                        isLoading={isLoading}
                      >
                        {!isLoading && (
                          <>
                            {isSignUp ? (
                              <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Создать аккаунт
                              </>
                            ) : (
                              <>
                                <Zap className="w-5 h-5 mr-2" />
                                Войти в систему
                              </>
                            )}
                          </>
                        )}
                      </EnhancedButton>
                    </motion.div>
                  </form>

                  <Separator className="my-6 bg-border/30" />

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-center"
                  >
                    <Button
                      variant="ghost"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isSignUp 
                        ? 'Уже есть аккаунт? Войти' 
                        : 'Нет аккаунта? Создать аккаунт'
                      }
                    </Button>
                  </motion.div>
                </CardContent>
              </AnimatedCard>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}