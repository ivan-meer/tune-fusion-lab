/**
 * Track Uploader Component
 * 
 * Компонент для загрузки и сохранения музыкальных треков
 * с drag & drop интерфейсом и валидацией файлов
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useUserTracks, Track } from '@/hooks/useUserTracks';
import { 
  Upload, X, Music, FileAudio, Check, 
  AlertCircle, Loader2, Download, Save
} from 'lucide-react';

interface TrackMetadata {
  title: string;
  description: string;
  genre: string;
  mood: string;
  tags: string[];
  is_public: boolean;
  provider: 'mureka' | 'suno' | 'hybrid';
}

const SUPPORTED_FORMATS = ['.mp3', '.wav', '.m4a', '.flac', '.aac'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const GENRE_OPTIONS = [
  'pop', 'rock', 'electronic', 'hip-hop', 'jazz', 'classical', 
  'folk', 'reggae', 'blues', 'country', 'r&b', 'funk'
];

const MOOD_OPTIONS = [
  'energetic', 'calm', 'happy', 'melancholic', 'romantic', 
  'mysterious', 'epic', 'peaceful', 'aggressive', 'dreamy'
];

export default function TrackUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState<TrackMetadata>({
    title: '',
    description: '',
    genre: 'pop',
    mood: 'energetic',
    tags: [],
    is_public: false,
    provider: 'suno'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadTrack } = useUserTracks();
  const { toast } = useToast();

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!SUPPORTED_FORMATS.includes(extension)) {
      return { 
        valid: false, 
        error: `Неподдерживаемый формат. Доступные: ${SUPPORTED_FORMATS.join(', ')}` 
      };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Файл слишком большой. Максимум: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }
    
    return { valid: true };
  };

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelection(droppedFiles);
  }, []);

  // Handle file selection
  const handleFileSelection = (selectedFiles: File[]) => {
    const validFiles: File[] = [];
    
    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast({
          title: `Ошибка файла "${file.name}"`,
          description: validation.error,
          variant: "destructive"
        });
      }
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      
      // Auto-fill title if empty and single file
      if (validFiles.length === 1 && !metadata.title) {
        setMetadata(prev => ({
          ...prev,
          title: validFiles[0].name.replace(/\.[^/.]+$/, "")
        }));
      }
    }
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle input file selection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  // Upload all files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Нет файлов",
        description: "Выберите файлы для загрузки",
        variant: "destructive"
      });
      return;
    }

    if (!metadata.title.trim()) {
      toast({
        title: "Укажите название",
        description: "Название трека обязательно",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileMetadata = {
          ...metadata,
          title: files.length > 1 ? `${metadata.title} - ${index + 1}` : metadata.title
        };

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 200);

        try {
          const result = await uploadTrack(file, fileMetadata);
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          
          clearInterval(progressInterval);
          return result;
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        toast({
          title: "Загрузка завершена",
          description: `Успешно: ${successCount}, Ошибок: ${failCount}`
        });
        
        // Reset form
        setFiles([]);
        setUploadProgress({});
        setMetadata({
          title: '',
          description: '',
          genre: 'pop',
          mood: 'energetic',
          tags: [],
          is_public: false,
          provider: 'suno'
        });
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файлы",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Add tag
  const addTag = (tag: string) => {
    if (tag && !metadata.tags.includes(tag)) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Загрузка треков
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <FileAudio className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  Перетащите файлы сюда или выберите
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Поддерживаемые форматы: {SUPPORTED_FORMATS.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Максимальный размер: {MAX_FILE_SIZE / 1024 / 1024}MB
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Выбрать файлы
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORTED_FORMATS.join(',')}
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Выбранные файлы ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <FileAudio className="h-5 w-5 text-primary flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {uploadProgress[file.name] && (
                      <div className="w-20">
                        <Progress value={uploadProgress[file.name]} className="h-2" />
                      </div>
                    )}

                    {uploadProgress[file.name] === 100 ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metadata Form */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Метаданные трека</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название *</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Название трека"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Жанр</Label>
                <Select
                  value={metadata.genre}
                  onValueChange={(value) => setMetadata(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_OPTIONS.map(genre => (
                      <SelectItem key={genre} value={genre}>
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Настроение</Label>
                <Select
                  value={metadata.mood}
                  onValueChange={(value) => setMetadata(prev => ({ ...prev, mood: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map(mood => (
                      <SelectItem key={mood} value={mood}>
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Провайдер</Label>
                <Select
                  value={metadata.provider}
                  onValueChange={(value: 'mureka' | 'suno' | 'hybrid') => 
                    setMetadata(prev => ({ ...prev, provider: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suno">Suno AI</SelectItem>
                    <SelectItem value="mureka">Mureka AI</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Краткое описание трека"
                rows={3}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Теги</Label>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                <Input
                  placeholder="Добавить тег..."
                  className="w-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={() => setMetadata(prev => ({ ...prev, is_public: !prev.is_public }))}
              >
                {metadata.is_public ? 'Публичный' : 'Приватный'}
              </Button>

              <Button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0 || !metadata.title.trim()}
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загружаю...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Загрузить треки
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}