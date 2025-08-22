import { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Play, Pause, Square } from "lucide-react";

interface TimerProps {
  initialSeconds?: number;
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

export function Timer({ 
  initialSeconds = 0, 
  onStart, 
  onPause, 
  onStop, 
  onTimeUpdate 
}: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          onTimeUpdate?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    onStart?.();
  };

  const handlePause = () => {
    setIsRunning(false);
    onPause?.();
  };

  const handleStop = () => {
    setIsRunning(false);
    setSeconds(0);
    onStop?.();
    onTimeUpdate?.(0);
  };

  return (
    <div className="text-center">
      <div className="timer-display text-6xl text-blue-400 mb-6 font-mono">
        {formatTime(seconds)}
      </div>
      <div className="flex justify-center items-center space-x-4 mb-6">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            className="bg-gradient-success hover:shadow-glow px-6 py-3 transition-all"
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            className="bg-gradient-warning hover:shadow-glow px-6 py-3 transition-all"
          >
            <Pause className="w-5 h-5 mr-2" />
            Pausar
          </Button>
        )}
        <Button
          onClick={handleStop}
          className="bg-gradient-danger hover:shadow-glow px-6 py-3 transition-all"
        >
          <Square className="w-5 h-5 mr-2" />
          Parar
        </Button>
      </div>
      <div className="flex items-center justify-center space-x-4">
        <div className={`status-indicator ${isRunning ? 'bg-green-500 animate-pulse-soft' : 'bg-gray-500'}`}></div>
        <span className="text-sm text-blue-200">
          {isRunning ? 'Timer ativo' : 'Timer parado'}
        </span>
      </div>
    </div>
  );
}
