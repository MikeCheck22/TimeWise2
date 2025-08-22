import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function LiveTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      setStartTime(new Date());
      toast({
        title: "Timer Iniciado",
        description: "Cronometragem em curso"
      });
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    toast({
      title: "Timer Pausado",
      description: "Cronometragem pausada"
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    setSeconds(0);
    setStartTime(null);
    toast({
      title: "Timer Parado",
      description: "Cronometragem reiniciada"
    });
  };

  const getStatus = () => {
    if (isRunning) return { text: 'A contar', color: 'text-green-500' };
    if (seconds > 0) return { text: 'Pausado', color: 'text-yellow-500' };
    return { text: 'Parado', color: 'text-muted-foreground' };
  };

  const status = getStatus();

  return (
    <Card className="bg-glass border-glass backdrop-blur-sm shadow-elegant">
      <CardContent className="p-6 sm:p-8">
        <div className="text-center">
          <div className="text-6xl sm:text-8xl font-mono font-bold text-primary mb-6">
            {formatTime(seconds)}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/20 dark:bg-black/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Início</p>
              <p className="text-lg font-semibold">
                {startTime ? startTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
            </div>
            <div className="bg-white/20 dark:bg-black/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Duração</p>
              <p className="text-lg font-semibold">{formatDuration(seconds)}</p>
            </div>
            <div className="bg-white/20 dark:bg-black/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className={`text-lg font-semibold ${status.color}`}>{status.text}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={handleStart}
              disabled={isRunning}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
            <Button
              onClick={handlePause}
              disabled={!isRunning}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
            <Button
              onClick={handleStop}
              disabled={seconds === 0}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <Square className="w-4 h-4 mr-2" />
              Parar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
