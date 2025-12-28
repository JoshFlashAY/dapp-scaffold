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
  const [level, setLevel] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [currentTileOrder, setCurrentTileOrder] = useState(1);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [levelStage, setLevelStage] = useState<'stage1' | 'stage2' | 'stage3' | 'announcement' | 'transition'>('stage1');
  const [stageTimer, setStageTimer] = useState(45);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [nextTileReady, setNextTileReady] = useState(true);
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const tileCounter = useRef(0);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tileIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTileRef = useRef<Set<string>>(new Set());
  const scoreUpdateRef = useRef(score);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<Set<AudioNode>>(new Set());
  const backgroundMusicRef = useRef<OscillatorNode | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const tapProcessedRef = useRef<boolean>(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0));
    };
    checkMobile();
  }, []);

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
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        let currentNote = 0;
        const melody = [440, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88];
        
        oscillator.type = 'sine';
        gainNode.gain.value = 0.08;
        
        backgroundMusicRef.current = oscillator;
        
        const playMelody = () => {
          if (musicPlaying && backgroundMusicRef.current) {
            oscillator.frequency.setValueAtTime(melody[currentNote], ctx.currentTime);
            currentNote = (currentNote + 1) % melody.length;
          }
        };
        
        oscillator.start();
        
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
  const playTileSound = (frequency: number, type: 'hit' | 'perfect' | 'miss' | 'transition') => {
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
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'hit':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case 'miss':
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'transition':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
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

  // Stage timer and level management
  useEffect(() => {
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;

    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
    }

    levelIntervalRef.current = setInterval(() => {
      setStageTimer(prev => {
        if (prev <= 1) {
          triggerStageAnnouncement();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
    };
  }, [gameActive, gameStarted, levelStage]);

  const triggerStageAnnouncement = () => {
    if (!gameActive) return;
    
    setLevelStage('announcement');
    setGameActive(false);
    
    let announcement = '';
    let nextLevel: 'Easy' | 'Medium' | 'Hard' = 'Easy';
    let nextStageTimer = 0;
    let nextSpeed = 1;
    
    switch(level) {
      case 'Easy':
        announcement = '🎉 Stage 1 Complete!\nGet ready for Stage 2!';
        nextLevel = 'Medium';
        nextStageTimer = 40;
        nextSpeed = 1.8;
        break;
      case 'Medium':
        announcement = '🔥 Stage 2 Complete!\nFinal Stage! Go Hard!';
        nextLevel = 'Hard';
        nextStageTimer = 30;
        nextSpeed = 2.5;
        break;
      case 'Hard':
        announcement = '🏆 All Stages Complete!\nKeep going for high score!';
        nextLevel = 'Hard';
        nextStageTimer = 30;
        nextSpeed = 2.5;
        break;
    }
    
    setAnnouncementText(announcement);
    setShowAnnouncement(true);
    
    playTileSound(1200, 'transition');
    
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    
    announcementTimeoutRef.current = setTimeout(() => {
      setShowAnnouncement(false);
      setLevelStage('transition');
      
      setTimeout(() => {
        setLevel(nextLevel);
        setGameSpeed(nextSpeed);
        setStageTimer(nextStageTimer);
        setLevelStage('stage1');
        setGameActive(true);
        
        playTileSound(800, 'hit');
      }, 1000);
    }, 5000);
  };

  // Generate unique ID for tiles
  const generateId = () => {
    tileCounter.current += 1;
    return `tile_${tileCounter.current}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Generate tiles based on current level
  useEffect(() => {
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;
    
    const generateTile = () => {
      if (!gameActive || !gameStarted) return;
      
      const orangeColumn = Math.floor(Math.random() * columns);
      const baseSpeed = 1.5 * gameSpeed;
      
      const newTile = {
        id: generateId(),
        column: orangeColumn,
        position: -30,
        active: true,
        speed: baseSpeed,
        tapped: false,
        order: tileCounter.current,
        xOffset: 0,
      };
      
      setTiles(prev => {
        const newTiles = [...prev, newTile];
        const maxTotalTiles = level === 'Easy' ? 10 : level === 'Medium' ? 15 : 20;
        if (newTiles.length > maxTotalTiles) {
          return newTiles.slice(-maxTotalTiles);
        }
        return newTiles;
      });
      
      setNextTileReady(true);
    };

    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
    }

    let tileInterval;
    switch (level) {
      case 'Easy':
        tileInterval = 800;
        break;
      case 'Medium':
        tileInterval = 500;
        break;
      case 'Hard':
        tileInterval = 300;
        break;
      default:
        tileInterval = 1000;
    }

    tileIntervalRef.current = setInterval(() => {
      if (gameActive && gameStarted && nextTileReady) {
        generateTile();
        setNextTileReady(false);
      }
    }, tileInterval / gameSpeed);

    return () => {
      if (tileIntervalRef.current) {
        clearInterval(tileIntervalRef.current);
      }
    };
  }, [gameActive, gameSpeed, gameStarted, level, columns, nextTileReady, levelStage]);

  // Game loop for moving tiles
  useEffect(() => {
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;

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
            if (tile.position > 120 && tile.active && !tile.tapped) {
              if (gameActive) {
                playTileSound(150, 'miss');
                setTimeout(() => handleGameOver('Missed tile!'), 50);
              }
              return false;
            }
            return tile.position > -40;
          })
      );

      setGameTime(prev => prev + 1);
    }, 16);

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [gameActive, gameSpeed, gameStarted, levelStage]);

  // Handle column tap - SIMPLIFIED FOR MOBILE
  const handleColumnTap = (columnIndex: number) => {
    // Prevent multiple taps in quick succession
    const now = Date.now();
    if (now - lastTapRef.current < 100) {
      return;
    }
    lastTapRef.current = now;
    
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;
    
    setTouchActive(true);
    setTimeout(() => setTouchActive(false), 50);

    // Find the current tile
    const currentTile = tiles
      .filter(tile => tile.active && !tile.tapped)
      .sort((a, b) => a.order - b.order)[0];

    if (!currentTile) {
      return; // Just return, don't end game
    }

    // Check if tapped column has the current tile
    if (currentTile.column === columnIndex) {
      const positionScore = Math.max(20, Math.round(100 - currentTile.position * 0.6));
      const basePoints = positionScore;
      let points = 0;
      let feedback: 'perfect' | 'good' = 'good';
      let feedbackText = 'GOOD!';
      
      if (currentTile.position < 50) {
        points = basePoints * multiplier * 2.0;
        feedback = 'perfect';
        feedbackText = 'PERFECT!';
        playTileSound(1000 + Math.random() * 300, 'perfect');
        setStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak % 3 === 0) {
            setMultiplier(prevMult => Math.min(prevMult + 0.5, 4));
          }
          return newStreak;
        });
      } else if (currentTile.position < 80) {
        points = basePoints * multiplier;
        feedback = 'good';
        feedbackText = 'GREAT!';
        playTileSound(700 + Math.random() * 200, 'hit');
        setStreak(prev => prev + 1);
      } else {
        points = basePoints * multiplier * 0.8;
        feedback = 'good';
        feedbackText = 'GOOD!';
        playTileSound(500 + Math.random() * 150, 'hit');
        setStreak(prev => Math.max(1, prev + 0.5));
      }

      const levelBonus = level === 'Medium' ? 1.5 : level === 'Hard' ? 2.0 : 1;
      points = Math.round(points * levelBonus);

      setScore(prev => prev + Math.round(points));
      setCombo(prev => prev + 1);
      setCurrentTileOrder(currentTile.order + 1);
      setShowFeedback({type: feedback, show: true, text: feedbackText});
      setLastTapTime(now);
      
      setTimeout(() => {
        setShowFeedback(prev => ({...prev, show: false}));
      }, 300);

      // Mark tile as tapped
      setTiles(prev => {
        const newTiles = prev.filter(t => t.id !== currentTile.id);
        
        if (newTiles.length === 0) {
          setNextTileReady(true);
        }
        
        return newTiles;
      });
      
      setNextTileReady(true);
      
    } else {
      // Wrong column - game over
      playTileSound(100, 'miss');
      handleGameOver('Wrong column!');
    }
  };

  const handleGameOver = (reason: string) => {
    if (!gameActive) return;
    
    stopBackgroundMusic();
    setGameActive(false);
    setShowFeedback({type: 'miss', show: true, text: reason});
    setTimeout(() => setShowFeedback(prev => ({...prev, show: false})), 1000);
    if (score > highScore) setHighScore(score);
    
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (tileIntervalRef.current) clearInterval(tileIntervalRef.current);
    if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
    
    gameIntervalRef.current = null;
    tileIntervalRef.current = null;
    levelIntervalRef.current = null;
    announcementTimeoutRef.current = null;
  };

  const startGame = () => {
    startBackgroundMusic();
    
    playTileSound(1500, 'perfect');
    
    setScore(0);
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setGameActive(true);
    setGameStarted(true);
    setGameSpeed(1);
    setLevel('Easy');
    setLevelStage('stage1');
    setStageTimer(45);
    setTiles([]);
    setCurrentTileOrder(1);
    setGameTime(0);
    setNextTileReady(true);
    tileCounter.current = 0;
    activeTileRef.current.clear();
    startTimeRef.current = Date.now();
    lastTapRef.current = 0;
    setShowFeedback({type: 'good', show: false, text: ''});
    setShowAnnouncement(false);
  };

  const restartGame = () => {
    startBackgroundMusic();
    
    playTileSound(1200, 'hit');
    
    setGameStarted(true);
    setScore(0);
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setGameActive(true);
    setGameSpeed(1);
    setLevel('Easy');
    setLevelStage('stage1');
    setStageTimer(45);
    setTiles([]);
    setCurrentTileOrder(1);
    setGameTime(0);
    setNextTileReady(true);
    tileCounter.current = 0;
    activeTileRef.current.clear();
    startTimeRef.current = Date.now();
    lastTapRef.current = 0;
    setShowFeedback({type: 'good', show: false, text: ''});
    setShowAnnouncement(false);
    
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
      announcementTimeoutRef.current = null;
    }
  };

  const exitToMenu = () => {
    stopBackgroundMusic();
    
    playTileSound(400, 'hit');
    
    setGameStarted(false);
    setGameActive(false);
    setLevelStage('stage1');
    setShowAnnouncement(false);
    setTiles([]);
    activeTileRef.current.clear();
    startTimeRef.current = null;
    cleanupAudio();
    
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (tileIntervalRef.current) clearInterval(tileIntervalRef.current);
    if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
    
    gameIntervalRef.current = null;
    tileIntervalRef.current = null;
    levelIntervalRef.current = null;
    announcementTimeoutRef.current = null;
  };

  // Faster multiplier progression
  useEffect(() => {
    if (streak >= 15) {
      setMultiplier(4);
    } else if (streak >= 10) {
      setMultiplier(3);
    } else if (streak >= 6) {
      setMultiplier(2.5);
    } else if (streak >= 3) {
      setMultiplier(2);
    } else if (streak >= 1) {
      setMultiplier(1.5);
    }
  }, [streak]);

  // Find the current tile for display
  const currentTile = tiles
    .filter(tile => tile.active && !tile.tapped)
    .sort((a, b) => a.order - b.order)[0];

  // Generate start tile when game is ready
  useEffect(() => {
    if (!gameStarted && tiles.length === 0 && !showAnnouncement) {
      const startTile = {
        id: 'start_tile',
        column: 1, // Center column
        position: 50, // Center position
        active: true,
        speed: 0,
        tapped: false,
        order: 0,
        xOffset: 0,
      };
      setTiles([startTile]);
      setCurrentTileOrder(1);
    }
  }, [gameStarted, tiles.length, showAnnouncement]);

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[480px] bg-gradient-to-b from-gray-950 to-black p-0 overflow-hidden">
      <div 
        ref={gameContainerRef}
        className="relative w-[270px] h-[480px] bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-2xl border border-orange-500/20 shadow-[0_0_60px_rgba(255,119,0,0.1)] overflow-hidden touch-none select-none mx-auto"
        style={{ aspectRatio: '9/16' }}
      >
        {/* App-like glass morphism background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,119,0,0.05),transparent_50%)]"></div>
        
        {/* INITIAL SCREEN WITH CENTERED START BUTTON */}
        {!gameStarted && tiles.length > 0 && tiles[0].id === 'start_tile' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
            <div className="text-center mb-6">
              <div className="text-xl font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent mb-1">
                SEQUENCE RHYTHM
              </div>
              <div className="text-xs text-gray-400">Tap START to begin the challenge</div>
            </div>
            
            {/* Large Centered Start Button */}
            <button
              onClick={startGame}
              onTouchStart={(e) => {
                e.preventDefault();
                startGame();
              }}
              className="relative w-32 h-32 bg-gradient-to-br from-green-500 via-green-400 to-emerald-600 rounded-2xl shadow-[0_0_40px_rgba(72,187,120,0.8)] animate-pulse border-4 border-emerald-300 flex flex-col items-center justify-center cursor-pointer touch-auto z-30 active:scale-95 transition-transform"
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl"></div>
              </div>
              <div className="relative text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                START
              </div>
              <div className="relative text-xs text-emerald-100 mt-1">
                Tap Here!
              </div>
              <div className="absolute -inset-4 rounded-3xl border-4 border-emerald-400/30 animate-ping"></div>
            </button>
            
            <div className="mt-6 text-center">
              <div className="text-xs text-gray-500 mb-2">🏆 High Score: {highScore}</div>
              <div className="text-[10px] text-gray-600">
                Tap tiles in sequence • Avoid wrong columns
              </div>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENT SCREEN */}
        {showAnnouncement && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-gray-950/95 to-black/95 flex flex-col items-center justify-center z-40 p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl p-4 text-center border border-orange-500/30 w-[250px] shadow-[0_20px_60px_rgba(255,119,0,0.3)]">
              <div className="text-4xl mb-3 animate-bounce">
                {level === 'Easy' ? '🎉' : level === 'Medium' ? '🔥' : '🏆'}
              </div>
              <div className="text-lg font-bold text-white mb-3 whitespace-pre-line">
                {announcementText}
              </div>
              <div className="text-sm text-orange-300 mb-2">
                Next Stage: {Math.ceil(stageTimer / 45 * 5)}s
              </div>
              <div className="text-xs text-gray-400">
                Get ready for increased speed!
              </div>
            </div>
          </div>
        )}

        {/* TRANSITION SCREEN */}
        {levelStage === 'transition' && (
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-transparent to-black/90 flex items-center justify-center z-30">
            <div className="text-xl font-bold text-orange-300 animate-pulse">
              GET READY...
            </div>
          </div>
        )}

        {/* GAME SCREEN - Active gameplay */}
        {gameStarted && gameActive && !showAnnouncement && levelStage !== 'transition' && (
          <>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent z-10 p-2 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="text-[8px] font-medium text-gray-400">SCORE</div>
                  <div className="text-lg font-bold text-white">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-medium text-gray-400">NEXT</div>
                  <div className="text-md font-bold text-orange-300">
                    #{currentTileOrder}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] font-medium text-gray-400">COMBO</div>
                  <div className="text-md font-bold text-yellow-300">{combo}×</div>
                </div>
              </div>
              
              {/* Level indicators */}
              <div className="absolute top-9 left-1/2 transform -translate-x-1/2 flex gap-1">
                <div className={`px-2 py-1 rounded-full backdrop-blur-sm border ${
                  level === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                  level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                  'bg-red-500/20 text-red-300 border-red-500/30'
                } text-xs`}>
                  {level}
                </div>
                <div className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-orange-500/30">
                  ×{gameSpeed.toFixed(1)}
                </div>
                <div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-blue-500/30">
                  {stageTimer}s
                </div>
              </div>
            </div>

            {/* Game columns - SIMPLIFIED TOUCH HANDLING */}
            <div className="flex h-full pt-14">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div
                  key={`column_${columnIndex}`}
                  className={`flex-1 relative ${columnIndex < columns - 1 ? 'border-r border-gray-800/30' : ''}`}
                  onClick={() => handleColumnTap(columnIndex)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleColumnTap(columnIndex);
                  }}
                >
                  <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-800/20 to-transparent left-1/2 transform -translate-x-1/2"></div>
                  
                  {currentTile && currentTile.column === columnIndex && (
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-orange-400/3 to-transparent"></div>
                  )}
                  
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[9px] text-gray-500">
                    {columnIndex + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Falling tiles */}
            {tiles.map(tile => (
              <div
                key={tile.id}
                className={`absolute w-12 h-12 transition-all duration-75 rounded-lg ${
                  tile.tapped ? 'opacity-0 scale-0' : 'opacity-100'
                } ${tile.active && !tile.tapped && currentTile?.id === tile.id ? 'z-20' : 'z-10'}`}
                style={{
                  left: `calc(${(tile.column * 25) + 12.5}% - 24px)`,
                  top: `${tile.position}%`,
                  transform: 'translateY(-50%)',
                }}
              >
                <div className={`absolute inset-0 rounded-lg ${
                  tile.active && !tile.tapped
                    ? currentTile?.id === tile.id
                      ? 'bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 shadow-[0_0_15px_rgba(255,119,0,0.6)] animate-pulse'
                      : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_0_8px_rgba(255,119,0,0.3)] opacity-90'
                    : 'bg-gradient-to-br from-green-500 to-green-700 opacity-50'
                } border-2 ${tile.active && !tile.tapped ? 'border-orange-300/60' : 'border-green-400/30'}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-sm font-bold ${
                      tile.active && !tile.tapped
                        ? currentTile?.id === tile.id ? 'text-white' : 'text-white/90'
                        : 'text-green-200'
                    }`}>
                      {tile.order}
                    </div>
                  </div>
                  
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg"></div>
                  
                  {tile.active && !tile.tapped && currentTile?.id === tile.id && (
                    <>
                      <div className="absolute inset-0 rounded-lg animate-ping bg-gradient-to-b from-orange-400/20 to-transparent"></div>
                      <div className="absolute -inset-1 rounded-lg border-2 border-orange-400/40 animate-pulse"></div>
                    </>
                  )}
                  
                  {tile.active && !tile.tapped && currentTile?.id === tile.id && tile.position < 60 && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[9px] text-orange-300 font-bold whitespace-nowrap">
                      +{Math.round((100 - tile.position * 0.6) * multiplier)}pts
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Current tile indicator */}
            {currentTile && gameActive && (
              <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 text-center z-10">
                <div className="bg-gradient-to-r from-gray-900/80 to-black/80 text-orange-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-orange-500/30">
                  TAP: <span className="font-bold text-white">Column {currentTile.column + 1}</span>
                  <div className="text-[9px] text-orange-400">#{currentTile.order}</div>
                </div>
              </div>
            )}

            {/* Timing feedback */}
            {showFeedback.show && (
              <div className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold z-20 ${
                showFeedback.type === 'perfect' 
                  ? 'text-yellow-300 animate-bounce' 
                  : 'text-orange-300 animate-pulse'
              }`}>
                {showFeedback.text}
                {showFeedback.type === 'perfect' && (
                  <div className="text-xs text-center mt-1 text-yellow-200">
                    +{Math.round(100 * multiplier)} pts
                  </div>
                )}
              </div>
            )}

            {/* High streak notification */}
            {streak >= 3 && streak % 3 === 0 && (
              <div className="absolute top-32 left-1/2 transform -translate-x-1/2 text-sm font-bold text-yellow-300 animate-bounce z-10 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 px-2 py-1 rounded-full backdrop-blur-sm">
                ✨ {streak} STREAK! ×{multiplier.toFixed(1)}
              </div>
            )}

            {/* Level progress */}
            <div className="absolute bottom-20 left-0 right-0 text-center z-10">
              <div className={`inline-block ${
                level === 'Easy' ? 'bg-green-500/20 text-green-300' : 
                level === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                'bg-red-500/20 text-red-300'
              } text-xs px-2 py-1 rounded-full backdrop-blur-sm border ${
                level === 'Easy' ? 'border-green-500/30' : 
                level === 'Medium' ? 'border-yellow-500/30' : 
                'border-red-500/30'
              }`}>
                {level === 'Easy' ? `🎵 Stage 1 - ${stageTimer}s` : 
                 level === 'Medium' ? `⚡ Stage 2 - ${stageTimer}s` : 
                 `🔥 Stage 3 - ${stageTimer}s`}
              </div>
            </div>

            {/* Music indicator */}
            <div className="absolute top-16 right-2 bg-black/30 rounded-full p-1 z-10">
              <div className="text-[9px] text-gray-400">
                <span className={musicPlaying ? 'text-green-400' : 'text-red-400'}>
                  {musicPlaying ? '🔊' : '🔈'}
                </span>
              </div>
            </div>

            {/* Quick tap indicator */}
            {lastTapTime && Date.now() - lastTapTime < 200 && (
              <div className="absolute top-28 left-1/2 transform -translate-x-1/2 text-xs text-green-400 animate-pulse">
                ⚡ QUICK!
              </div>
            )}
          </>
        )}

        {/* GAME OVER SCREEN */}
        {gameStarted && !gameActive && tiles.length === 0 && !showAnnouncement && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-gray-950/95 to-black/95 flex flex-col items-center justify-center z-30 p-3 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl p-3 text-center border border-orange-500/30 w-[250px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="text-3xl mb-2">
                {score >= 1000 ? '🏆' : score >= 500 ? '⭐' : '🎵'}
              </div>
              
              <div className="text-lg font-bold text-white mb-1">
                {score >= 1000 ? 'RHYTHM MASTER!' : 
                 score >= 500 ? 'GREAT SCORE!' : 
                 score >= 200 ? 'GOOD GAME!' : 'GAME OVER'}
              </div>
              
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                {score}
              </div>
              
              <div className="grid grid-cols-2 gap-1 mb-3">
                <div className="bg-gray-900/50 rounded p-1">
                  <div className="text-[9px] text-gray-400">COMBO</div>
                  <div className="text-sm font-bold text-orange-300">{combo}×</div>
                </div>
                <div className="bg-gray-900/50 rounded p-1">
                  <div className="text-[9px] text-gray-400">STAGE</div>
                  <div className={`text-sm font-bold ${
                    level === 'Easy' ? 'text-green-300' : 
                    level === 'Medium' ? 'text-yellow-300' : 
                    'text-red-300'
                  }`}>{level}</div>
                </div>
                <div className="bg-gray-900/50 rounded p-1">
                  <div className="text-[9px] text-gray-400">HIGH SCORE</div>
                  <div className="text-sm font-bold text-yellow-300">{highScore}</div>
                </div>
                <div className="bg-gray-900/50 rounded p-1">
                  <div className="text-[9px] text-gray-400">MULT</div>
                  <div className="text-sm font-bold text-green-300">×{multiplier.toFixed(1)}</div>
                </div>
              </div>
              
              <div className="flex gap-1 mb-2">
                <button
                  onClick={restartGame}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-2 px-2 rounded-xl shadow-lg text-xs active:scale-95 transition-transform"
                >
                  PLAY AGAIN
                </button>
                <button
                  onClick={exitToMenu}
                  className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold py-2 px-2 rounded-xl shadow-lg text-xs active:scale-95 transition-transform"
                >
                  EXIT
                </button>
              </div>
              
              <div className="text-[9px] text-gray-500">
                {score < 200 ? 'Tip: Tap tiles as soon as they appear!' :
                 score < 500 ? 'Tip: Build combo streaks for multipliers!' :
                 'Tip: Perfect timing gives 2x points!'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};