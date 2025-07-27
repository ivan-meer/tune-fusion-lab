import { useEffect, useRef, useState, useCallback } from 'react';

interface ProgressUpdate {
  jobId: string;
  stage: string;
  progress: number;
  details?: string;
  tokensUsed?: number;
  estimatedTimeRemaining?: number;
}

interface AudioChunk {
  data: string;
  index: number;
  format: string;
  duration?: number;
}

interface RealtimeProgressHook {
  isConnected: boolean;
  currentStage: string;
  progress: number;
  details?: string;
  tokensUsed: number;
  estimatedTimeRemaining?: number;
  audioChunks: AudioChunk[];
  connect: (jobId: string) => void;
  disconnect: () => void;
  clearAudioChunks: () => void;
}

export function useRealtimeProgress(): RealtimeProgressHook {
  const [isConnected, setIsConnected] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [details, setDetails] = useState<string>();
  const [tokensUsed, setTokensUsed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>();
  const [audioChunks, setAudioChunks] = useState<AudioChunk[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const connect = useCallback((jobId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    jobIdRef.current = jobId;
    
    try {
      // Use the correct WebSocket URL for your Supabase project
      const wsUrl = `wss://psqxgksushbaoisbbdir.functions.supabase.co/realtime-progress?jobId=${jobId}`;
      
      console.log('🔗 Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected for job:', jobId);
        setIsConnected(true);
        setCurrentStage('Подключение установлено');
        setProgress(0);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);

          switch (message.type) {
            case 'connection_established':
              setIsConnected(true);
              setCurrentStage('Готовность к генерации');
              break;

            case 'progress_update':
              setCurrentStage(message.stage || 'Обработка...');
              setProgress(message.progress || 0);
              setDetails(message.details);
              if (message.tokensUsed) setTokensUsed(prev => prev + message.tokensUsed);
              setEstimatedTimeRemaining(message.estimatedTimeRemaining);
              break;

            case 'status_update':
              setCurrentStage(message.status === 'completed' ? 'Завершено' : 
                             message.status === 'failed' ? 'Ошибка' : 'Обработка...');
              setProgress(message.progress || 0);
              break;

            case 'audio_chunk':
              setAudioChunks(prev => [...prev, message.chunk]);
              break;

            case 'error':
              console.error('❌ WebSocket error message:', message);
              setCurrentStage('Ошибка соединения');
              break;

            case 'pong':
              // Keep-alive response
              break;

            default:
              console.log('🔍 Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        if (event.code !== 1000) {
          setCurrentStage('Соединение потеряно');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
        setCurrentStage('Ошибка соединения');
      };

      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setCurrentStage('Ошибка подключения');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setCurrentStage('');
    setProgress(0);
    setDetails(undefined);
    setTokensUsed(0);
    setEstimatedTimeRemaining(undefined);
    jobIdRef.current = null;
  }, []);

  const clearAudioChunks = useCallback(() => {
    setAudioChunks([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    currentStage,
    progress,
    details,
    tokensUsed,
    estimatedTimeRemaining,
    audioChunks,
    connect,
    disconnect,
    clearAudioChunks
  };
}
