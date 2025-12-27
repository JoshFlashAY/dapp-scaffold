// Next, React
import { FC, useEffect, useRef, useState } from 'react';
import pkg from '../../../package.json';

// ❌ DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* HEADER – fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN – central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake “feed card” top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Scrolly Game
            </span>
            <span className="text-[9px] opacity-70">#NoCodeJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER – tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Scrolly · v{pkg.version}</span>
      </footer>
    </div>
  );
};

// ✅ THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// Replace this entire GameSandbox component with the one AI generates.
// Keep the name `GameSandbox` and the `FC` type.

const GameSandbox: FC = () => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [columns] = useState(4);
  const [tiles, setTiles] = useState<Array<{
    id: string;
    column: number;
    position: number;
    active: boolean;
    speed: number;
    tapped: boolean;
    order: number;
    xOffset: number;
  }>>([]);
  const [showFeedback, setShowFeedback] = useState<{type: 'perfect' | 'good' | 'miss', show: boolean, text: string}>({type: 'good', show: false, text: ''});
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameTime, setGameTime] = useState(0);
  const [touchActive, setTouchActive] = useState(false);
  const [level, setLevel] = useState<'Easy' | 'Medium' | 'Fast'>('Easy');
  const [currentTileOrder, setCurrentTileOrder] = useState(1);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const tileCounter = useRef(0);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tileIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeTileRef = useRef<Set<string>>(new Set());
  const scoreUpdateRef = useRef(score);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<Set<AudioNode>>(new Set());
  const backgroundMusicRef = useRef<OscillatorNode | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const mobileSwipeStartRef = useRef<number | null>(null);

  // Initialize audio context
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Start background music
  const startBackgroundMusic = () => {
    if (!musicPlaying) {
      const ctx = initAudio();
      
      try {
        // Create oscillator for background music
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Simple melody pattern
        let currentNote = 0;
        const melody = [440, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88]; // A, B, C, D, E, D, C, B
        
        oscillator.type = 'sine';
        gainNode.gain.value = 0.08; // Lower volume for background
        
        backgroundMusicRef.current = oscillator;
        
        // Schedule note changes
        const playMelody = () => {
          if (musicPlaying && backgroundMusicRef.current) {
            oscillator.frequency.setValueAtTime(melody[currentNote], ctx.currentTime);
            currentNote = (currentNote + 1) % melody.length;
          }
        };
        
        oscillator.start();
        
        // Change note every 0.5 seconds
        const melodyInterval = setInterval(playMelody, 500);
        
        setMusicPlaying(true);
        
        return () => {
          clearInterval(melodyInterval);
          oscillator.stop();
        };
      } catch (error) {
        console.log("Background music error:", error);
      }
    }
  };

  // Stop background music
  const stopBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      try {
        backgroundMusicRef.current.stop();
        backgroundMusicRef.current = null;
      } catch (e) {}
    }
    setMusicPlaying(false);
  };

  // Play sound for tile tap
  const playTileSound = (frequency: number, type: 'hit' | 'perfect' | 'miss' | 'background') => {
    const ctx = initAudio();
    
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      
      switch(type) {
        case 'perfect':
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'hit':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'miss':
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.4);
          break;
        case 'background':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.5);
          break;
      }
      
      audioNodesRef.current.add(oscillator);
      oscillator.onended = () => audioNodesRef.current.delete(oscillator);
    } catch (error) {
      console.log("Audio error:", error);
    }
  };

  // Clean up audio nodes
  const cleanupAudio = () => {
    stopBackgroundMusic();
    audioNodesRef.current.forEach(node => {
      try {
        if ('stop' in node) (node as any).stop();
      } catch (e) {}
    });
    audioNodesRef.current.clear();
  };

  // Initialize audio on first user interaction
  useEffect(() => {
    const initOnInteraction = () => {
      initAudio();
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('touchstart', initOnInteraction);
    };
    
    document.addEventListener('click', initOnInteraction);
    document.addEventListener('touchstart', initOnInteraction);
    
    return () => {
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('touchstart', initOnInteraction);
      cleanupAudio();
    };
  }, []);

  // Track game time and adjust level (10s for Medium, 20s for Fast)
  useEffect(() => {
    if (!gameActive || !gameStarted) return;

    const updateLevel = () => {
      const currentTime = Date.now();
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
        return;
      }

      const elapsedSeconds = (currentTime - startTimeRef.current) / 1000;
      
      if (elapsedSeconds >= 20) { // 20 seconds = Fast
        if (level !== 'Fast') {
          setLevel('Fast');
          setGameSpeed(2.5);
          // Play level up sound
          playTileSound(1200, 'perfect');
        }
      } else if (elapsedSeconds >= 10) { // 10 seconds = Medium
        if (level !== 'Medium') {
          setLevel('Medium');
          setGameSpeed(1.8);
          // Play level up sound
          playTileSound(1000, 'perfect');
        }
      } else {
        if (level !== 'Easy') {
          setLevel('Easy');
          setGameSpeed(1.0);
        }
      }
    };

    const levelCheckInterval = setInterval(updateLevel, 100);

    return () => {
      clearInterval(levelCheckInterval);
    };
  }, [gameActive, gameStarted, level]);

  // Generate unique ID for tiles
  const generateId = () => {
    tileCounter.current += 1;
    return `tile_${tileCounter.current}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Generate tiles based on current level
  useEffect(() => {
    if (!gameActive || !gameStarted) return;
    
    const generateTile = () => {
      if (!gameActive || !gameStarted) return;
      
      const orangeColumn = Math.floor(Math.random() * columns);
      const baseSpeed = 1.2 * gameSpeed;
      
      const newTile = {
        id: generateId(),
        column: orangeColumn,
        position: -20,
        active: true,
        speed: baseSpeed,
        tapped: false,
        order: tileCounter.current,
        xOffset: (Math.random() * 10 - 5), // Reduced variation
      };
      
      setTiles(prev => {
        const newTiles = [...prev, newTile];
        // Limit total tiles on screen
        const maxTotalTiles = level === 'Easy' ? 8 : level === 'Medium' ? 12 : 16;
        if (newTiles.length > maxTotalTiles) {
          return newTiles.slice(-maxTotalTiles);
        }
        return newTiles;
      });
    };

    // Clear any existing interval
    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
    }

    // Initial tile with delay
    setTimeout(() => {
      if (gameActive && gameStarted) generateTile();
    }, 500 / gameSpeed);

    // Set tile generation interval based on level
    let tileInterval;
    switch (level) {
      case 'Easy':
        tileInterval = 1200;
        break;
      case 'Medium':
        tileInterval = 700;
        break;
      case 'Fast':
        tileInterval = 400;
        break;
      default:
        tileInterval = 1000;
    }

    tileIntervalRef.current = setInterval(() => {
      if (gameActive && gameStarted) generateTile();
    }, tileInterval / gameSpeed);

    return () => {
      if (tileIntervalRef.current) {
        clearInterval(tileIntervalRef.current);
      }
    };
  }, [gameActive, gameSpeed, gameStarted, level, columns]);

  // Game loop for moving tiles
  useEffect(() => {
    if (!gameActive || !gameStarted) return;

    // Clear any existing interval
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }

    gameIntervalRef.current = setInterval(() => {
      setTiles(prev => 
        prev
          .map(tile => ({
            ...tile,
            position: tile.position + tile.speed,
          }))
          .filter(tile => {
            // Check if tile reached bottom without being tapped
            if (tile.position > 100 && tile.active && !tile.tapped) {
              // Missed a tile - game over
              playTileSound(150, 'miss');
              setTimeout(() => handleGameOver('Missed tile!'), 0);
              return false;
            }
            return tile.position > -30;
          })
      );

      // Update game time
      setGameTime(prev => prev + 1);
    }, 16);

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [gameActive, gameSpeed, gameStarted]);

  // Handle mobile swipe/tap
  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      mobileSwipeStartRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gameActive || !gameStarted || !mobileSwipeStartRef.current) return;
      
      const touchX = e.changedTouches[0].clientX;
      const startX = mobileSwipeStartRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      // Calculate column based on touch position
      const relativeX = touchX - containerRect.left;
      const columnWidth = containerWidth / columns;
      const columnIndex = Math.floor(relativeX / columnWidth);
      
      if (columnIndex >= 0 && columnIndex < columns) {
        handleColumnTap(columnIndex, e as any);
      }
      
      mobileSwipeStartRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameActive, gameStarted, columns]);

  const handleGameOver = (reason: string) => {
    if (!gameActive) return;
    
    stopBackgroundMusic();
    setGameActive(false);
    setShowFeedback({type: 'miss', show: true, text: reason});
    setTimeout(() => setShowFeedback(prev => ({...prev, show: false})), 1500);
    if (score > highScore) setHighScore(score);
    
    // Clear intervals
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
      tileIntervalRef.current = null;
    }
  };

  // Handle column tap (for both mouse and touch)
  const handleColumnTap = (columnIndex: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!gameActive || !gameStarted) return;
    
    e.stopPropagation();
    setTouchActive(true);
    setTimeout(() => setTouchActive(false), 100);

    // Find the current tile (lowest order that hasn't been tapped)
    const currentTile = tiles
      .filter(tile => tile.active && !tile.tapped)
      .sort((a, b) => a.order - b.order)[0];

    if (!currentTile) {
      // No current tile, but screen was tapped - game over
      playTileSound(120, 'miss');
      handleGameOver('No tile to tap!');
      return;
    }

    // Check if tapped column has the current tile
    if (currentTile.column === columnIndex) {
      // Calculate points based on timing (position affects points)
      const positionScore = Math.max(10, Math.round(100 - currentTile.position * 0.8));
      const basePoints = positionScore;
      let points = 0;
      let feedback: 'perfect' | 'good' = 'good';
      let feedbackText = 'GOOD!';
      
      // Higher position = better timing (tapped earlier)
      if (currentTile.position < 40) {
        points = basePoints * multiplier * 1.5;
        feedback = 'perfect';
        feedbackText = 'EARLY BIRD!';
        // Play perfect sound with higher frequency
        playTileSound(800 + Math.random() * 200, 'perfect');
        setStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak % 5 === 0) {
            setMultiplier(prevMult => Math.min(prevMult + 0.5, 3));
          }
          return newStreak;
        });
      } else if (currentTile.position < 70) {
        points = basePoints * multiplier;
        feedback = 'good';
        feedbackText = 'GREAT!';
        // Play good hit sound
        playTileSound(600 + Math.random() * 150, 'hit');
        setStreak(prev => prev + 1);
      } else {
        points = basePoints * multiplier * 0.7;
        feedback = 'good';
        feedbackText = 'GOOD!';
        // Play regular hit sound
        playTileSound(400 + Math.random() * 100, 'hit');
        setStreak(prev => Math.max(1, prev + 0.5));
      }

      // Bonus points based on level
      const levelBonus = level === 'Medium' ? 1.2 : level === 'Fast' ? 1.5 : 1;
      points = Math.round(points * levelBonus);

      setScore(prev => prev + Math.round(points));
      setCombo(prev => prev + 1);
      setCurrentTileOrder(currentTile.order + 1);
      setShowFeedback({type: feedback, show: true, text: feedbackText});
      
      setTimeout(() => {
        setShowFeedback(prev => ({...prev, show: false}));
      }, 400);

      // Mark tile as tapped and slow it down
      setTiles(prev => prev.map(t => 
        t.id === currentTile.id ? {...t, tapped: true, speed: 0.3} : t
      ));
    } else {
      // Tapped wrong column - game over
      playTileSound(100, 'miss');
      handleGameOver('Wrong column!');
    }
  };

  const startGame = () => {
    // Start background music
    startBackgroundMusic();
    
    // Play start sound
    playTileSound(1200, 'perfect');
    
    setScore(0);
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setGameActive(true);
    setGameStarted(true);
    setGameSpeed(1);
    setLevel('Easy');
    setTiles([]);
    setCurrentTileOrder(1);
    setGameTime(0);
    tileCounter.current = 0;
    activeTileRef.current.clear();
    startTimeRef.current = Date.now();
    setShowFeedback({type: 'good', show: false, text: ''});
  };

  const restartGame = () => {
    // Restart background music
    startBackgroundMusic();
    
    // Play restart sound
    playTileSound(1000, 'hit');
    
    setGameStarted(true);
    setScore(0);
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setGameActive(true);
    setGameSpeed(1);
    setLevel('Easy');
    setTiles([]);
    setCurrentTileOrder(1);
    setGameTime(0);
    tileCounter.current = 0;
    activeTileRef.current.clear();
    startTimeRef.current = Date.now();
    setShowFeedback({type: 'good', show: false, text: ''});
  };

  const exitToMenu = () => {
    // Stop background music
    stopBackgroundMusic();
    
    // Play menu sound
    playTileSound(300, 'hit');
    
    setGameStarted(false);
    setGameActive(false);
    setTiles([]);
    activeTileRef.current.clear();
    startTimeRef.current = null;
    cleanupAudio();
    
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
      tileIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (streak >= 20) {
      setMultiplier(3);
    } else if (streak >= 15) {
      setMultiplier(2.5);
    } else if (streak >= 10) {
      setMultiplier(2);
    } else if (streak >= 5) {
      setMultiplier(1.5);
    }
  }, [streak]);

  // Find the current tile for display
  const currentTile = tiles
    .filter(tile => tile.active && !tile.tapped)
    .sort((a, b) => a.order - b.order)[0];

  return (
    <div 
      ref={gameContainerRef}
      className="relative w-full h-full min-h-[480px] max-h-[480px] max-w-[270px] mx-auto bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-2xl border border-orange-500/20 shadow-[0_0_60px_rgba(255,119,0,0.1)] overflow-hidden touch-none select-none"
      style={{ aspectRatio: '9/16' }}
    >
      {/* App-like glass morphism background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,119,0,0.05),transparent_50%)]"></div>
      
      {/* MENU SCREEN - Shows when gameStarted is false */}
      {!gameStarted && (
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black flex flex-col items-center justify-center z-30 p-4">
          <div className="text-center w-full h-full flex flex-col justify-between">
            {/* Top section with title and subtitle */}
            <div>
              <div className="mb-3">
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent mb-1">
                  SEQUENCE RHYTHM
                </div>
                <div className="text-xs text-gray-400 font-light">Tap in Order • Mobile Friendly</div>
              </div>

              {/* START GAME BUTTON */}
              <button
                onClick={startGame}
                className="relative w-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 text-white font-bold text-lg py-3 px-4 rounded-2xl shadow-[0_0_20px_rgba(255,119,0,0.6)] hover:shadow-[0_0_30px_rgba(255,119,0,0.8)] active:scale-[0.98] transition-all duration-200 border-4 border-orange-300 overflow-hidden group animate-pulse mb-4 touch-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-white/20 to-orange-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <span className="text-lg">▶</span>
                  <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">START GAME</span>
                </span>
              </button>
              
              <div className="text-xs text-orange-400 mb-3 font-light text-center">
                👆 Tap to start! Works on mobile & desktop
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800 mb-3">
              <div className="text-sm text-white mb-2 font-medium">🎵 HOW TO PLAY</div>
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded border border-orange-400/50 flex items-center justify-center text-xs font-bold">1</div>
                  <span>Tap tiles in order (1, 2, 3...)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-500 rounded border border-orange-400/30 flex items-center justify-center text-xs">↑↓</div>
                  <span>Tap ANYWHERE in correct column</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-xs text-gray-500">✗</div>
                  <span>Wrong column = Game Over</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800">
                  <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded border border-purple-400/50 flex items-center justify-center text-xs">🎵</div>
                  <span className="text-purple-300">Background music plays automatically</span>
                </div>
              </div>
            </div>

            {/* High score display */}
            <div className="bg-gradient-to-r from-gray-900/80 to-black/80 rounded-xl p-3 border border-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400 font-light">HIGH SCORE</div>
                  <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">{highScore}</div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {highScore > 0 ? 'Beat your record!' : 'Be the first!'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME SCREEN - Shows when gameStarted is true */}
      {gameStarted && (
        <>
          {/* Modern app header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent z-10 p-2 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-[9px] font-medium text-gray-400 tracking-wider">SCORE</div>
                <div className="text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{score}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-medium text-gray-400 tracking-wider">NEXT</div>
                <div className="text-lg font-bold text-orange-300 drop-shadow-[0_2px_4px_rgba(255,119,0,0.3)]">
                  #{currentTileOrder}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-medium text-gray-400 tracking-wider">COMBO</div>
                <div className="text-lg font-bold text-yellow-300 drop-shadow-[0_2px_4px_rgba(255,204,0,0.3)]">{combo}×</div>
              </div>
            </div>
            
            {/* Level and Speed indicator */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex gap-2">
              <div className={`px-2 py-1 rounded-full backdrop-blur-sm border ${
                level === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                'bg-red-500/20 text-red-300 border-red-500/30'
              } text-xs font-medium`}>
                {level}
              </div>
              <div className="bg-orange-500/20 text-orange-300 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm border border-orange-500/30">
                SPEED ×{gameSpeed.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Game columns - Entire column is clickable */}
          <div className="flex h-full pt-16 touch-none">
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <button
                key={`column_${columnIndex}`}
                className={`flex-1 relative transition-all duration-100 touch-none ${
                  touchActive && currentTile?.column === columnIndex ? 'bg-orange-500/10' : 'bg-transparent'
                } ${columnIndex < columns - 1 ? 'border-r border-gray-800/30' : ''} active:bg-orange-500/20`}
                onClick={(e) => handleColumnTap(columnIndex, e)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleColumnTap(columnIndex, e);
                }}
              >
                {/* Column lane guide lines */}
                <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-800/20 to-transparent left-1/2 transform -translate-x-1/2"></div>
                
                {/* Highlight current tile's column */}
                {currentTile && currentTile.column === columnIndex && (
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-orange-400/3 to-transparent"></div>
                )}
                
                {/* Column number at top */}
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 font-medium">
                  {columnIndex + 1}
                </div>
              </button>
            ))}
          </div>

          {/* Falling orange tiles - FIXED FOR MOBILE DISPLAY */}
          {tiles.map(tile => (
            <div
              key={tile.id}
              className={`absolute touch-none w-14 h-14 transition-all duration-100 rounded-lg ${
                tile.tapped ? 'opacity-30 scale-90' : 'opacity-100'
              } ${tile.active && !tile.tapped && currentTile?.id === tile.id ? 'z-20' : 'z-10'}`}
              style={{
                left: `calc(${(tile.column * 25) + 12.5}% + ${tile.xOffset}px)`,
                top: `${tile.position}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {/* Orange tile with gradient and glow */}
              <div className={`absolute inset-0 rounded-lg ${
                tile.active && !tile.tapped
                  ? currentTile?.id === tile.id
                    ? 'bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,119,0,0.6)] animate-pulse'
                    : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_0_10px_rgba(255,119,0,0.3)] opacity-80'
                  : 'bg-gradient-to-br from-green-500 to-green-700 opacity-50'
              } border-2 ${tile.active && !tile.tapped ? 'border-orange-300/60' : 'border-green-400/30'}`}>
                {/* Order number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-lg font-bold ${
                    tile.active && !tile.tapped
                      ? currentTile?.id === tile.id ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-white/80'
                      : 'text-green-200'
                  }`}>
                    {tile.order}
                  </div>
                </div>
                
                {/* Inner shine effect */}
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg"></div>
                
                {/* Active indicator for current tile */}
                {tile.active && !tile.tapped && currentTile?.id === tile.id && (
                  <>
                    <div className="absolute inset-0 rounded-lg animate-ping bg-gradient-to-b from-orange-400/20 to-transparent"></div>
                    <div className="absolute -inset-2 rounded-lg border-2 border-orange-400/40 animate-pulse"></div>
                  </>
                )}
                
                {/* Tap indicator for early taps */}
                {tile.active && !tile.tapped && currentTile?.id === tile.id && tile.position < 50 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] text-orange-300 font-bold whitespace-nowrap">
                    +{Math.round((100 - tile.position * 0.8) * multiplier)}pts
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Current tile indicator */}
          {currentTile && gameActive && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center z-10 touch-none">
              <div className="bg-gradient-to-r from-gray-900/80 to-black/80 text-orange-300 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-orange-500/30">
                TAP IN: <span className="font-bold text-white">Column {currentTile.column + 1}</span>
                <div className="text-[10px] text-orange-400">Tile #{currentTile.order}</div>
              </div>
            </div>
          )}

          {/* Timing feedback with smooth animation */}
          {showFeedback.show && (
            <div className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold z-20 touch-none ${
              showFeedback.type === 'perfect' 
                ? 'text-yellow-300 animate-bounce' 
                : 'text-orange-300 animate-pulse'
            }`}>
              {showFeedback.text}
              {showFeedback.type === 'perfect' && (
                <div className="text-sm text-center mt-1 text-yellow-200">
                  +{Math.round(100 * multiplier)} pts
                </div>
              )}
            </div>
          )}

          {/* High streak notification */}
          {streak >= 5 && streak % 5 === 0 && (
            <div className="absolute top-36 left-1/2 transform -translate-x-1/2 text-lg font-bold text-yellow-300 animate-bounce z-10 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm touch-none">
              ✨ {streak} STREAK! ×{multiplier.toFixed(1)}
            </div>
          )}

          {/* Level progress indicator */}
          <div className="absolute bottom-24 left-0 right-0 text-center z-10 touch-none">
            <div className={`inline-block ${
              level === 'Easy' ? 'bg-green-500/20 text-green-300' : 
              level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 
              'bg-red-500/20 text-red-300'
            } text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border ${
              level === 'Easy' ? 'border-green-500/30' : 
              level === 'Medium' ? 'border-yellow-500/30' : 
              'border-red-500/30'
            }`}>
              {level === 'Easy' ? '🎵 EASY - Starting level' : 
               level === 'Medium' ? '⚡ MEDIUM - Speed increased!' : 
               '🔥 FAST - Maximum speed!'}
            </div>
          </div>

          {/* Music indicator */}
          <div className="absolute top-20 right-2 bg-black/30 rounded-full p-1.5 z-10">
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className={musicPlaying ? 'text-green-400' : 'text-red-400'}>
                {musicPlaying ? '🔊' : '🔈'}
              </span>
            </div>
          </div>

          {/* Game Over Screen */}
          {!gameActive && gameStarted && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-gray-950/95 to-black/95 flex flex-col items-center justify-center z-30 p-3 backdrop-blur-sm touch-auto">
              <div className="bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl p-4 text-center border border-orange-500/30 w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-w-[95%]">
                {/* Result emoji */}
                <div className="text-4xl mb-3">
                  {score >= 500 ? '🏆' : score >= 300 ? '⭐' : '🎵'}
                </div>
                
                {/* Result title */}
                <div className="text-xl font-bold text-white mb-2">
                  {score >= 500 ? 'SEQUENCE MASTER!' : 
                   score >= 300 ? 'GREAT CHAIN!' : 
                   score >= 100 ? 'GOOD SEQUENCE!' : 'GAME OVER'}
                </div>
                
                {/* Score display */}
                <div className="text-5xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(255,119,0,0.3)]">
                  {score}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">MAX COMBO</div>
                    <div className="text-lg font-bold text-orange-300">{combo}×</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">FINAL LEVEL</div>
                    <div className={`text-lg font-bold ${
                      level === 'Easy' ? 'text-green-300' : 
                      level === 'Medium' ? 'text-yellow-300' : 
                      'text-red-300'
                    }`}>{level}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">HIGH SCORE</div>
                    <div className="text-lg font-bold text-yellow-300">{highScore}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-2">
                    <div className="text-[10px] text-gray-400">BEST MULT</div>
                    <div className="text-lg font-bold text-green-300">×{multiplier.toFixed(1)}</div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={restartGame}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg hover:shadow-[0_8px_20px_rgba(255,119,0,0.3)] active:scale-95 transition-all duration-200 border border-orange-300/30 touch-auto text-sm"
                  >
                    PLAY AGAIN
                  </button>
                  <button
                    onClick={exitToMenu}
                    className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-200 border border-gray-700/50 touch-auto text-sm"
                  >
                    MENU
                  </button>
                </div>
                
                {/* Tips */}
                <div className="text-[10px] text-gray-500">
                  {score < 100 ? 'Tip: Find the tile with the correct order number and tap its column' :
                   score < 300 ? 'Tip: Tapping earlier gives more points and better sounds!' :
                   'Tip: Perfect timing gives bonus points and special sounds!'}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};