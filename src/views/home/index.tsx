// Next, React
import { FC, useCallback, useEffect, useRef, useState } from 'react';
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
  const [screenSize, setScreenSize] = useState({width: 240, height: 426});

  const tileCounter = useRef(0);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tileIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeTileRef = useRef<Set<string>>(new Set());
  const scoreUpdateRef = useRef(score);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const parentWidth = parent.clientWidth;
          const parentHeight = parent.clientHeight;
          
          // Calculate size based on parent container
          const width = Math.min(parentWidth * 0.9, 400); // 90% of parent or max 400px
          const height = width * (16/9); // Maintain 9:16 aspect ratio
          
          setScreenSize({
            width: Math.min(width, parentHeight * 0.9 * (9/16)), // Respect max height
            height: Math.min(height, parentHeight * 0.9)
          });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Update ref when score changes
  useEffect(() => {
    scoreUpdateRef.current = score;
  }, [score]);

  // Track game time and adjust level
  useEffect(() => {
    if (!gameActive || !gameStarted) return;

    const updateLevel = () => {
      const currentTime = Date.now();
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
        return;
      }

      const elapsedSeconds = (currentTime - startTimeRef.current) / 1000;
      
      if (elapsedSeconds >= 420) { // 7 minutes = 420 seconds
        if (level !== 'Fast') {
          setLevel('Fast');
          setGameSpeed(2.5);
        }
      } else if (elapsedSeconds >= 120) { // 2 minutes = 120 seconds
        if (level !== 'Medium') {
          setLevel('Medium');
          setGameSpeed(1.8);
        }
      } else {
        if (level !== 'Easy') {
          setLevel('Easy');
          setGameSpeed(1.0);
        }
      }
    };

    const levelCheckInterval = setInterval(updateLevel, 1000);

    return () => {
      clearInterval(levelCheckInterval);
    };
  }, [gameActive, gameStarted, level]);

  // Generate unique ID for tiles
  const generateId = () => {
    tileCounter.current += 1;
    return `tile_${tileCounter.current}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Generate tiles based on current level - OPTIMIZED
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
        xOffset: (Math.random() * 15 - 7.5),
      };
      
      setTiles(prev => {
        const newTiles = [...prev, newTile];
        const maxTotalTiles = level === 'Easy' ? 5 : level === 'Medium' ? 8 : 12;
        return newTiles.length > maxTotalTiles ? newTiles.slice(-maxTotalTiles) : newTiles;
      });
    };

    // Clear any existing interval
    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
    }

    // Initial tile with delay (easier start)
    setTimeout(() => {
      if (gameActive && gameStarted) generateTile();
    }, 800 / gameSpeed); // Faster response time

    // Set tile generation interval based on level
    let tileInterval;
    switch (level) {
      case 'Easy':
        tileInterval = 1200; // 1.2 seconds between tiles
        break;
      case 'Medium':
        tileInterval = 800; // 0.8 seconds between tiles
        break;
      case 'Fast':
        tileInterval = 400; // 0.4 seconds between tiles
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

  // Optimized game loop for moving tiles
  useEffect(() => {
    if (!gameActive || !gameStarted) return;

    // Clear any existing interval
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }

    let lastTime = Date.now();
    let accumulatedTime = 0;

    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulatedTime += deltaTime;

      // Update at ~60fps but handle variable frame rates
      if (accumulatedTime >= 16) {
        setTiles(prev => {
          const newTiles = prev.map(tile => ({
            ...tile,
            position: tile.position + tile.speed * (accumulatedTime / 16),
          }));

          // Check for missed tiles
          const missedTile = newTiles.find(tile => 
            tile.position > 100 && tile.active && !tile.tapped
          );
          
          if (missedTile) {
            setTimeout(() => handleGameOver('Missed tile!'), 0);
          }

          return newTiles.filter(tile => tile.position > -30);
        });

        // Update game time
        setGameTime(prev => prev + 1);
        accumulatedTime = 0;
      }

      gameIntervalRef.current = setTimeout(gameLoop, 16);
    };

    gameLoop();

    return () => {
      if (gameIntervalRef.current) {
        clearTimeout(gameIntervalRef.current);
        gameIntervalRef.current = null;
      }
    };
  }, [gameActive, gameSpeed, gameStarted]);

  const handleGameOver = (reason: string) => {
    if (!gameActive) return;
    
    setGameActive(false);
    setShowFeedback({type: 'miss', show: true, text: reason});
    setTimeout(() => setShowFeedback(prev => ({...prev, show: false})), 1000);
    if (score > highScore) setHighScore(score);
    
    // Clear intervals
    if (gameIntervalRef.current) {
      clearTimeout(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
      tileIntervalRef.current = null;
    }
  };

  // Handle column tap with immediate response
  const handleColumnTap = useCallback((columnIndex: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!gameActive || !gameStarted) return;
    
    e.stopPropagation();
    setTouchActive(true);
    setTimeout(() => setTouchActive(false), 50); // Faster response

    // Find the current tile (lowest order that hasn't been tapped)
    const currentTile = tiles
      .filter(tile => tile.active && !tile.tapped)
      .sort((a, b) => a.order - b.order)[0];

    if (!currentTile) {
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
        setStreak(prev => prev + 1);
      } else {
        points = basePoints * multiplier * 0.7;
        feedback = 'good';
        feedbackText = 'GOOD!';
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
      }, 300); // Faster feedback

      // Immediately mark tile as tapped
      setTiles(prev => prev.map(t => 
        t.id === currentTile.id ? {...t, tapped: true, speed: 0.1} : t
      ));
    } else {
      // Tapped wrong column - game over
      handleGameOver('Wrong column!');
    }
  }, [gameActive, gameStarted, tiles, level, multiplier]);

  const startGame = () => {
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
    setGameStarted(false);
    setGameActive(false);
    setTiles([]);
    activeTileRef.current.clear();
    startTimeRef.current = null;
    
    if (gameIntervalRef.current) {
      clearTimeout(gameIntervalRef.current);
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
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] p-1 md:p-2">
      <div 
        ref={containerRef}
        className="relative bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl border border-orange-500/20 shadow-[0_0_30px_rgba(255,119,0,0.1)] overflow-hidden"
        style={{
          width: `${screenSize.width}px`,
          height: `${screenSize.height}px`,
          maxWidth: '95vw',
          maxHeight: '95vh',
          aspectRatio: '9/16',
        }}
      >
        
        {/* App-like glass morphism background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,119,0,0.05),transparent_50%)]"></div>
        
        {/* MENU SCREEN - Shows when gameStarted is false */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black flex flex-col items-center justify-center z-30 p-4 sm:p-6 overflow-auto">
            <div className="text-center w-full h-full flex flex-col justify-between overflow-y-auto py-2">
              {/* Top section with title and subtitle */}
              <div>
                <div className="mb-3 sm:mb-4">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent mb-1">
                    SEQUENCE RHYTHM
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 font-light">Tap in Order • Anywhere in Column</div>
                </div>

                {/* START GAME BUTTON - RIGHT AFTER SUBTITLE */}
                <button
                  onClick={startGame}
                  className="relative w-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 text-white font-bold text-base sm:text-lg md:text-xl py-3 sm:py-4 px-4 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(255,119,0,0.6)] hover:shadow-[0_0_30px_rgba(255,119,0,0.8)] active:scale-[0.98] transition-all duration-200 border-2 sm:border-4 border-orange-300 overflow-hidden group animate-pulse mb-4 sm:mb-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-white/20 to-orange-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className="relative flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-xl">▶</span>
                    <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">START GAME</span>
                  </span>
                  <div className="absolute inset-0 border border-white/20 sm:border-2 sm:border-white/30 rounded-xl sm:rounded-2xl pointer-events-none"></div>
                </button>
                
                <div className="text-xs text-orange-400 mb-4 font-light text-center">
                  👆 Click to start the sequence!
                </div>
              </div>

              {/* Collapsible instruction section */}
              <div className="bg-gray-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-800 mb-2 sm:mb-3">
                <div className="text-sm text-white mb-2 font-medium">🎵 HOW TO PLAY</div>
                <div className="grid grid-cols-1 gap-1 sm:gap-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded border border-orange-400/50 flex items-center justify-center text-xs font-bold">1</div>
                    <span>Tap tiles in order (1, 2, 3...)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded border border-orange-400/30 flex items-center justify-center text-xs">↑↓</div>
                    <span>Click ANYWHERE in correct column</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-xs text-gray-500">✗</div>
                    <span>Wrong column/order = Game Over</span>
                  </div>
                </div>
              </div>

              {/* High score display - compact */}
              <div className="bg-gradient-to-r from-gray-900/80 to-black/80 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400 font-light">HIGH SCORE</div>
                    <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">{highScore}</div>
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
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent z-10 p-2 sm:p-3 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-[8px] sm:text-[10px] font-medium text-gray-400 tracking-wider">SCORE</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] sm:text-[10px] font-medium text-gray-400 tracking-wider">NEXT</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-orange-300 drop-shadow-[0_1px_2px_rgba(255,119,0,0.3)]">
                    #{currentTileOrder}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] sm:text-[10px] font-medium text-gray-400 tracking-wider">COMBO</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-yellow-300 drop-shadow-[0_1px_2px_rgba(255,204,0,0.3)]">{combo}×</div>
                </div>
              </div>
              
              {/* Level and Speed indicator */}
              <div className="absolute top-8 sm:top-10 md:top-12 left-1/2 transform -translate-x-1/2 flex gap-1 sm:gap-2">
                <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm border ${
                  level === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                  level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                  'bg-red-500/20 text-red-300 border-red-500/30'
                } text-[10px] sm:text-xs font-medium`}>
                  {level}
                </div>
                <div className="bg-orange-500/20 text-orange-300 text-[10px] sm:text-xs font-medium px-2 py-1 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm border border-orange-500/30">
                  ×{gameSpeed.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Game columns - Entire column is clickable */}
            <div className="flex h-full pt-12 sm:pt-16 md:pt-20">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <button
                  key={`column_${columnIndex}`}
                  className={`flex-1 relative transition-all duration-50 ${
                    touchActive && currentTile?.column === columnIndex ? 'bg-orange-500/10' : 'bg-transparent'
                  } ${columnIndex < columns - 1 ? 'border-r border-gray-800/30' : ''} hover:bg-gray-800/10 active:bg-orange-500/20`}
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
                  <div className="absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs text-gray-500 font-medium">
                    {columnIndex + 1}
                  </div>
                </button>
              ))}
            </div>

            {/* Falling orange tiles */}
            {tiles.map(tile => (
              <div
                key={tile.id}
                className={`absolute transition-all duration-75 ${
                  tile.tapped ? 'opacity-30 scale-90' : 'opacity-100'
                } ${tile.active && !tile.tapped && currentTile?.id === tile.id ? 'z-20' : 'z-10'}`}
                style={{
                  left: `calc(${(tile.column * 25) + 12.5}% + ${tile.xOffset}px)`,
                  top: `${tile.position}%`,
                  transform: 'translate(-50%, -100%)',
                  width: `${screenSize.width * 0.2}px`,
                  height: `${screenSize.width * 0.2}px`,
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
                    <div className={`text-base sm:text-lg md:text-xl font-bold ${
                      tile.active && !tile.tapped
                        ? currentTile?.id === tile.id ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-white/80'
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
                      <div className="absolute -inset-2 sm:-inset-3 rounded-lg border-2 border-orange-400/40 animate-pulse"></div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Current tile indicator */}
            {currentTile && gameActive && (
              <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 text-center z-10">
                <div className="bg-gradient-to-r from-gray-900/80 to-black/80 text-orange-300 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full backdrop-blur-sm border border-orange-500/30">
                  TAP: <span className="font-bold text-white">Column {currentTile.column + 1}</span>
                  <div className="text-[10px] sm:text-xs text-orange-400">Tile #{currentTile.order}</div>
                </div>
              </div>
            )}

            {/* Timing feedback with smooth animation */}
            {showFeedback.show && (
              <div className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl sm:text-2xl md:text-3xl font-bold z-20 ${
                showFeedback.type === 'perfect' 
                  ? 'text-yellow-300 animate-bounce' 
                  : 'text-orange-300 animate-pulse'
              }`}>
                {showFeedback.text}
                {showFeedback.type === 'perfect' && (
                  <div className="text-sm sm:text-base text-center mt-1 sm:mt-2 text-yellow-200">
                    +{Math.round(100 * multiplier)} pts
                  </div>
                )}
              </div>
            )}

            {/* High streak notification */}
            {streak >= 5 && streak % 5 === 0 && (
              <div className="absolute top-32 sm:top-40 left-1/2 transform -translate-x-1/2 text-base sm:text-lg md:text-xl font-bold text-yellow-300 animate-bounce z-10 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 px-3 sm:px-4 py-1 sm:py-2 rounded-full backdrop-blur-sm">
                ✨ {streak} STREAK! ×{multiplier.toFixed(1)}
              </div>
            )}

            {/* Game Over Screen with modern design */}
            {!gameActive && gameStarted && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-gray-950/95 to-black/95 flex flex-col items-center justify-center z-30 p-2 sm:p-4 backdrop-blur-sm">
                <div className="bg-gradient-to-b from-gray-900/90 to-black/90 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 text-center border border-orange-500/30 w-[90%] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                  {/* Result emoji */}
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">
                    {score >= 500 ? '🏆' : score >= 300 ? '⭐' : '🎵'}
                  </div>
                  
                  {/* Result title */}
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                    {score >= 500 ? 'SEQUENCE MASTER!' : 
                     score >= 300 ? 'GREAT CHAIN!' : 
                     score >= 100 ? 'GOOD SEQUENCE!' : 'GAME OVER'}
                  </div>
                  
                  {/* Score display */}
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(255,119,0,0.3)]">
                    {score}
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-gray-900/50 rounded p-2 sm:p-3">
                      <div className="text-xs text-gray-400">MAX COMBO</div>
                      <div className="text-base sm:text-lg md:text-xl font-bold text-orange-300">{combo}×</div>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2 sm:p-3">
                      <div className="text-xs text-gray-400">FINAL LEVEL</div>
                      <div className={`text-base sm:text-lg md:text-xl font-bold ${
                        level === 'Easy' ? 'text-green-300' : 
                        level === 'Medium' ? 'text-yellow-300' : 
                        'text-red-300'
                      }`}>{level}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2 sm:p-3">
                      <div className="text-xs text-gray-400">HIGH SCORE</div>
                      <div className="text-base sm:text-lg md:text-xl font-bold text-yellow-300">{highScore}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2 sm:p-3">
                      <div className="text-xs text-gray-400">BEST MULT</div>
                      <div className="text-base sm:text-lg md:text-xl font-bold text-green-300">×{multiplier.toFixed(1)}</div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={restartGame}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-[0_5px_20px_rgba(255,119,0,0.3)] active:scale-95 transition-all duration-200 border border-orange-300/30 text-sm sm:text-base"
                    >
                      PLAY AGAIN
                    </button>
                    <button
                      onClick={exitToMenu}
                      className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-[0_5px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-200 border border-gray-700/50 text-sm sm:text-base"
                    >
                      MENU
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Level progress indicator */}
            <div className="absolute bottom-20 sm:bottom-24 md:bottom-28 left-0 right-0 text-center z-10">
              <div className={`inline-block ${
                level === 'Easy' ? 'bg-green-500/20 text-green-300' : 
                level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                'bg-red-500/20 text-red-300'
              } text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full backdrop-blur-sm border ${
                level === 'Easy' ? 'border-green-500/30' : 
                level === 'Medium' ? 'border-yellow-500/30' : 
                'border-red-500/30'
              }`}>
                {level === 'Easy' ? '🎵 EASY' : 
                 level === 'Medium' ? '⚡ MEDIUM' : 
                 '🔥 FAST'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};