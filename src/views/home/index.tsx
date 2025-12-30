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
  const [gameSpeed, setGameSpeed] = useState(0.8); // Reduced from 1.0
  const [columns] = useState(4);
  const [tiles, setTiles] = useState<Array<{
    id: string;
    column: number;
    position: number;
    active: boolean;
    speed: number;
    order: number;
    xOffset: number;
    released: boolean;
    disintegrating?: boolean;
  }>>([]);
  const [showFeedback, setShowFeedback] = useState<{type: 'perfect' | 'good' | 'miss', show: boolean, text: string}>({type: 'good', show: false, text: ''});
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameTime, setGameTime] = useState(0);
  const [touchActive, setTouchActive] = useState(false);
  const [level, setLevel] = useState<'Stage 1' | 'Stage 2' | 'Stage 3' | 'Stage 4' | 'Stage 5'>('Stage 1');
  const [currentTileOrder, setCurrentTileOrder] = useState(1);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [levelStage, setLevelStage] = useState<'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'announcement' | 'transition'>('stage1');
  const [stageTimer, setStageTimer] = useState(30);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [isProcessingTap, setIsProcessingTap] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuState, setMenuState] = useState<'main' | 'gameOver'>('main');
  const [activeTapColumn, setActiveTapColumn] = useState<number | null>(null);
  const [particleEffects, setParticleEffects] = useState<Array<{
    id: string;
    column: number;
    x: number;
    y: number;
    particles: Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
    }>;
  }>>([]);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showStreakEffect, setShowStreakEffect] = useState(false);
  const [stageComplete, setStageComplete] = useState(false);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);

  const tileCounter = useRef(0);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tileIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const releaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoreUpdateRef = useRef(score);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<Set<AudioNode>>(new Set());
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const tileOrderMapRef = useRef<Map<number, string>>(new Map());
  const tileReleaseQueueRef = useRef<Array<{
    id: string;
    column: number;
    order: number;
    releaseTime: number;
  }>>([]);
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tapProcessingQueue = useRef<Array<{columnIndex: number, timestamp: number}>>([]);
  const isProcessingQueue = useRef(false);
  const particleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundMutexRef = useRef(false);
  const streakEffectRef = useRef<NodeJS.Timeout | null>(null);
  const stageCompleteRef = useRef<NodeJS.Timeout | null>(null);
  const touchInProgressRef = useRef<boolean>(false);
  const touchStartRef = useRef<number>(0);
  const lastProcessedTapRef = useRef<number>(0);
  const touchMoveThresholdRef = useRef<number>(10); // pixels

  // Share to X function
  const shareToX = () => {
    try {
      // Create the tweet text with game stats
      const tweetText = `🎮 I scored ${score} points and reached ${level} in Beat Rush! Can you beat my score? #BeatRush #RhythmGame`;
      
      // Create the share URL
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      
      // Open Twitter share in a new window
      window.open(shareUrl, '_blank', 'width=550,height=420');
      
      // Play a sound for feedback
      playTileSound(800, 'hit');
      
      // Optional: Add a small visual feedback
      setShowFeedback({
        type: 'good',
        show: true,
        text: 'Sharing to X...'
      });
      
      setTimeout(() => {
        setShowFeedback(prev => ({...prev, show: false}));
      }, 1000);
      
    } catch (error) {
      console.error('Error sharing to X:', error);
      // Fallback: Copy to clipboard
      const tweetText = `🎮 I scored ${score} points and reached ${level} in Beat Rush! Can you beat my score?`;
      navigator.clipboard.writeText(tweetText).then(() => {
        setShowFeedback({
          type: 'perfect',
          show: true,
          text: 'Copied to clipboard!'
        });
        setTimeout(() => {
          setShowFeedback(prev => ({...prev, show: false}));
        }, 1000);
      });
    }
  };

  // Initialize audio context
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Load background music
  const loadBackgroundMusic = () => {
    try {
      // Clean up any existing audio
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }

      // Create a new audio element
      const audio = new Audio();
      
      // Using a popular-sounding EDM track from Mixkit (royalty-free)
      audio.src = "https://assets.mixkit.co/music/preview/mixkit-game-show-suspense-waiting-667.mp3";
      audio.loop = true;
      audio.volume = 0.6;
      audio.preload = "auto";
      
      audio.oncanplaythrough = () => {
        console.log("Audio loaded successfully");
        setAudioLoaded(true);
      };
      
      audio.onerror = (e) => {
        console.error("Audio loading error:", e);
        setAudioLoaded(false);
      };
      
      backgroundMusicRef.current = audio;
      
      // Connect to Web Audio API
      const ctx = initAudio();
      const source = ctx.createMediaElementSource(audio);
      
      // Add gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.8;
      
      // Add compressor to prevent clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-20, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      
      source.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Try to play
      audio.play().then(() => {
        setMusicPlaying(true);
      }).catch(error => {
        console.log("Autoplay prevented:", error);
      });
      
    } catch (error) {
      console.log("Music setup error:", error);
      setAudioLoaded(false);
    }
  };

  // Start background music
  const startBackgroundMusic = () => {
    if (!musicPlaying) {
      loadBackgroundMusic();
    }
  };

  // Stop background music
  const stopBackgroundMusic = () => {
    if (backgroundMusicRef.current) {
      try {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      } catch (e) {
        console.log("Error stopping music:", e);
      }
    }
    setMusicPlaying(false);
  };

  // Play sound for tile tap
  const playTileSound = (frequency: number, type: 'hit' | 'perfect' | 'miss' | 'transition') => {
    if (soundMutexRef.current) return;
    
    soundMutexRef.current = true;
    
    const ctx = initAudio();
    
    try {
      // Clear any previous sound effects
      audioNodesRef.current.forEach(node => {
        try {
          if ('stop' in node) {
            try {
              (node as any).stop();
            } catch (e) {}
          }
        } catch (e) {}
      });
      audioNodesRef.current.clear();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      
      let duration = 0.1;
      
      switch(type) {
        case 'perfect':
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          duration = 0.1;
          break;
        case 'hit':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          duration = 0.08;
          break;
        case 'miss':
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          duration = 0.15;
          break;
        case 'transition':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          duration = 0.3;
          break;
      }
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
      
      // Auto-release mutex after sound completes
      setTimeout(() => {
        soundMutexRef.current = false;
      }, duration * 1000);
      
    } catch (error) {
      console.log("Audio error:", error);
      soundMutexRef.current = false;
    }
  };

  // Create particle explosion effect
  const createParticleExplosion = (tileId: string, column: number, position: number) => {
    const particles = [];
    const particleCount = 6;
    const colors = ['#FF9900', '#FF6600', '#FF3300'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 3;
      
      particles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        life: 1.0
      });
    }
    
    const particleEffect = {
      id: `particles_${tileId}_${Date.now()}`,
      column: column,
      x: (column * 25) + 12.5,
      y: position,
      particles: particles
    };
    
    setParticleEffects(prev => [...prev, particleEffect]);
    
    // Auto-remove after animation
    setTimeout(() => {
      setParticleEffects(prev => prev.filter(p => p.id !== particleEffect.id));
    }, 600);
  };

  // Update particles animation
  useEffect(() => {
    if (particleEffects.length === 0) return;
    
    const updateParticles = () => {
      setParticleEffects(prev => 
        prev.map(effect => ({
          ...effect,
          particles: effect.particles.map(p => ({
            ...p,
            x: p.x + p.vx * 0.5,
            y: p.y + p.vy * 0.5,
            vy: p.vy + 0.1,
            life: p.life - 0.03,
            size: p.size * 0.95
          })).filter(p => p.life > 0 && p.size > 0.5)
        })).filter(effect => effect.particles.length > 0)
      );
    };
    
    particleIntervalRef.current = setInterval(updateParticles, 16);
    
    return () => {
      if (particleIntervalRef.current) {
        clearInterval(particleIntervalRef.current);
      }
    };
  }, [particleEffects.length]);

  // Clean up ALL audio
  const cleanupAudio = () => {
    // Stop background music
    stopBackgroundMusic();
    
    // Stop all audio nodes
    audioNodesRef.current.forEach(node => {
      try {
        if ('stop' in node) (node as any).stop();
      } catch (e) {}
    });
    audioNodesRef.current.clear();
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    
    soundMutexRef.current = false;
  };

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      cleanupAudio();
    };
  }, []);

  // Stage timer
  useEffect(() => {
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;

    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
    }

    levelIntervalRef.current = setInterval(() => {
      setStageTimer(prev => {
        if (prev <= 1) {
          triggerStageComplete();
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

  const triggerStageComplete = () => {
    if (!gameActive || stageComplete) return;
    
    setStageComplete(true);
    setShowStageComplete(true);
    setGameActive(false);
    
    playTileSound(1200, 'transition');
    
    // Show completion for 2 seconds
    if (stageCompleteRef.current) clearTimeout(stageCompleteRef.current);
    stageCompleteRef.current = setTimeout(() => {
      setShowStageComplete(false);
      advanceToNextStage();
    }, 1500);
  };

  const advanceToNextStage = () => {
    let nextLevel: 'Stage 1' | 'Stage 2' | 'Stage 3' | 'Stage 4' | 'Stage 5' = 'Stage 1';
    let nextSpeed = 0.8;
    let nextStage: typeof levelStage = 'stage1';
    
    switch(level) {
      case 'Stage 1':
        nextLevel = 'Stage 2';
        nextSpeed = 1.0; // More gradual increase from 0.8
        nextStage = 'stage2';
        break;
      case 'Stage 2':
        nextLevel = 'Stage 3';
        nextSpeed = 1.2; // More gradual increase
        nextStage = 'stage3';
        break;
      case 'Stage 3':
        nextLevel = 'Stage 4';
        nextSpeed = 1.4; // More gradual increase
        nextStage = 'stage4';
        break;
      case 'Stage 4':
        nextLevel = 'Stage 5';
        nextSpeed = 1.6; // More gradual increase
        nextStage = 'stage5';
        break;
      case 'Stage 5':
        // Loop back to Stage 1 with bonus
        nextLevel = 'Stage 1';
        nextSpeed = 1.8; // Reasonable final speed
        nextStage = 'stage1';
        break;
    }
    
    // Reset tiles completely for new stage
    setTiles([]);
    tileOrderMapRef.current.clear();
    tileReleaseQueueRef.current = [];
    setCurrentTileOrder(1);
    tileCounter.current = 0;
    
    setLevel(nextLevel);
    setGameSpeed(nextSpeed);
    setStageTimer(30);
    setLevelStage(nextStage);
    setStageComplete(false);
    setGameActive(true);
    
    playTileSound(800, 'hit');
    
    // Start tile generation immediately for all stages
    setTimeout(() => {
      startTileBatchGeneration();
    }, 300);
  };

  // Generate unique ID for tiles
  const generateId = () => {
    tileCounter.current += 1;
    return `tile_${tileCounter.current}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Generate tiles in batches - ONLY 1 TILE AT A TIME
  const generateTileBatch = (count: number) => {
    const now = Date.now();
    const newTiles = [];
    
    // Only generate 1 tile at a time maximum
    const tilesToGenerate = 1;
    
    for (let i = 0; i < tilesToGenerate; i++) {
      const order = tileCounter.current + 1;
      
      // Choose a random column
      const selectedColumn = Math.floor(Math.random() * columns);
      
      // Speed based on level - GRADUAL INCREASE
      let baseSpeed;
      switch(level) {
        case 'Stage 1':
          baseSpeed = 0.7 * gameSpeed; // Slower starting speed
          break;
        case 'Stage 2':
          baseSpeed = 0.8 * gameSpeed; // Gradual increase
          break;
        case 'Stage 3':
          baseSpeed = 0.9 * gameSpeed; // Gradual increase
          break;
        case 'Stage 4':
          baseSpeed = 1.0 * gameSpeed; // Gradual increase
          break;
      case 'Stage 5':
          baseSpeed = 1.1 * gameSpeed; // Gradual increase
          break;
        default:
          baseSpeed = 0.7 * gameSpeed; // Slower starting speed
      }
      
      const newTile = {
        id: generateId(),
        column: selectedColumn,
        position: -40,
        active: true,
        speed: baseSpeed,
        order: order,
        xOffset: 0,
        released: false,
      };
      
      // Release timing - immediate
      const releaseTime = now + 100;
      
      tileOrderMapRef.current.set(order, newTile.id);
      tileReleaseQueueRef.current.push({
        id: newTile.id,
        column: selectedColumn,
        order: order,
        releaseTime: releaseTime,
      });
      
      newTiles.push(newTile);
      tileCounter.current = order;
    }
    
    setTiles(prev => [...prev, ...newTiles]);
    
    // Schedule releases
    tileReleaseQueueRef.current.forEach((queuedTile) => {
      setTimeout(() => {
        setTiles(prev => prev.map(tile => 
          tile.id === queuedTile.id ? { ...tile, released: true, position: -30 } : tile
        ));
        
        tileReleaseQueueRef.current = tileReleaseQueueRef.current.filter(t => t.id !== queuedTile.id);
      }, queuedTile.releaseTime - now);
    });
  };

  // Generate initial batch for game start
  useEffect(() => {
    if (gameActive && gameStarted && tiles.length === 0 && tileReleaseQueueRef.current.length === 0) {
      // Generate only 1 tile to start
      setTimeout(() => {
        generateTileBatch(1);
      }, 100);
    }
  }, [gameActive, gameStarted, tiles.length, level, gameSpeed]);

  // Start batch tile generation - ONE TILE AT A TIME
  const startTileBatchGeneration = () => {
    if (!gameActive || !gameStarted) return;
    
    // Clear any existing interval
    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
    }
    
    // Generate first batch immediately (only 1 tile to start)
    if (tileReleaseQueueRef.current.length < 1) {
      generateTileBatch(1);
    }
    
    // Set interval for continuous generation - ONLY WHEN NEEDED
    tileIntervalRef.current = setInterval(() => {
      // Only generate if:
      // 1. Game is active
      // 2. We have less than 2 tiles in the release queue (so at most 1 upcoming tile)
      // 3. We have less than 2 tiles on screen (not including disintegrating ones)
      const activeTileCount = tiles.filter(t => !t.disintegrating).length;
      if (gameActive && gameStarted && tileReleaseQueueRef.current.length < 2 && activeTileCount < 2) {
        generateTileBatch(1);
      }
    }, 1000); // Slower check interval for more breathing room
  };

  // Continuously generate more tiles
  useEffect(() => {
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;

    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
    }

    // Start tile generation immediately for all stages
    startTileBatchGeneration();

    return () => {
      if (tileIntervalRef.current) {
        clearInterval(tileIntervalRef.current);
      }
    };
  }, [gameActive, gameStarted, level, columns, levelStage]);

  // Game loop for moving tiles
  useEffect(() => {
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;

    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }

    gameIntervalRef.current = setInterval(() => {
      setTiles(prev => {
        const updatedTiles = prev.map(tile => ({
          ...tile,
          position: tile.released && !tile.disintegrating ? tile.position + tile.speed : tile.position,
        }));
        
        // Find current tile ID
        const currentTileId = tileOrderMapRef.current.get(currentTileOrder);
        
        if (currentTileId) {
          const currentTile = updatedTiles.find(t => t.id === currentTileId);
          
          // Check if current tile missed - HIGHER THRESHOLD FOR MORE TIME
          if (currentTile && currentTile.released && !currentTile.disintegrating && currentTile.position > 95) { // Changed from 90 to 95
            playTileSound(150, 'miss');
            setTimeout(() => handleGameOver('Missed tile #' + currentTile.order + '!'), 50);
            return updatedTiles;
          }
        }
        
        return updatedTiles.filter(tile => tile.position > -50 && !tile.disintegrating);
      });

      setGameTime(prev => prev + 1);
    }, 16);

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [gameActive, gameSpeed, gameStarted, levelStage, currentTileOrder]);

  // FIXED: Mobile touch handler - Unified approach
  const handleColumnTap = (columnIndex: number, eventType: 'touch' | 'mouse' = 'mouse') => {
    const now = Date.now();
    
    // Prevent multiple rapid taps
    if (now - lastTapRef.current < 120) { // Increased from 100ms for more forgiveness
      return;
    }
    
    // Prevent processing if already processing
    if (touchInProgressRef.current) {
      return;
    }
    
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;
    
    // Mark touch as in progress
    touchInProgressRef.current = true;
    lastTapRef.current = now;
    
    // Visual feedback
    setActiveTapColumn(columnIndex);
    setTimeout(() => setActiveTapColumn(null), 100);
    
    // Process the tap
    processColumnTap(columnIndex);
    
    // Release touch lock after delay
    setTimeout(() => {
      touchInProgressRef.current = false;
    }, 100);
  };

  // Process individual tap with updated scoring
  const processColumnTap = (columnIndex: number) => {
    // Get current tile ID
    const currentTileId = tileOrderMapRef.current.get(currentTileOrder);
    
    if (!currentTileId) {
      // Only generate if we have less than 1 tile in queue and less than 1 tile on screen
      const activeTileCount = tiles.filter(t => !t.disintegrating).length;
      if (tileReleaseQueueRef.current.length < 1 && activeTileCount < 1) {
        setTimeout(() => generateTileBatch(1), 300); // Increased from 200ms
      }
      return;
    }

    // Find the current tile
    const currentTile = tiles.find(tile => tile.id === currentTileId);

    if (!currentTile || !currentTile.released || currentTile.disintegrating) {
      return;
    }

    // Check if tapped column has the current tile
    if (currentTile.column === columnIndex) {
      // Calculate points based on timing (reduced points)
      let points = 0;
      let feedback: 'perfect' | 'good' = 'good';
      let feedbackText = 'GOOD!';
      
      // ADJUSTED TIMING WINDOWS FOR EASIER PLAY
      if (currentTile.position < 55) { // Changed from 50
        points = 10;
        feedback = 'perfect';
        feedbackText = 'PERFECT!';
        playTileSound(1000 + Math.random() * 300, 'perfect');
        
        // Streak bonus: +1 point for streaks of 3 or more
        if (streak >= 3) {
          points += 1;
        }
        
        setStreak(prev => {
          const newStreak = prev + 1;
          // Simplified streak effect (no multiplier)
          if (newStreak % 5 === 0) {
            setShowStreakEffect(true);
            if (streakEffectRef.current) clearTimeout(streakEffectRef.current);
            streakEffectRef.current = setTimeout(() => setShowStreakEffect(false), 800);
          }
          return newStreak;
        });
      } else if (currentTile.position < 85) { // Changed from 80
        points = 5;
        feedback = 'good';
        feedbackText = 'GREAT!';
        playTileSound(700 + Math.random() * 200, 'hit');
        setStreak(prev => prev + 1);
      } else {
        points = 2;
        feedback = 'good';
        feedbackText = 'GOOD!';
        playTileSound(500 + Math.random() * 150, 'hit');
        setStreak(prev => Math.max(1, prev + 0.5));
      }

      // Level bonus (small bonus instead of multiplier)
      const levelBonus = 
        level === 'Stage 2' ? 1 : 
        level === 'Stage 3' ? 2 : 
        level === 'Stage 4' ? 3 : 
        level === 'Stage 5' ? 4 : 0;
      points = points + levelBonus;

      setScore(prev => prev + Math.round(points));
      setCombo(prev => prev + 1);
      
      // Create particle effect
      createParticleExplosion(currentTileId, currentTile.column, currentTile.position);
      
      // Mark for disintegration
      setTiles(prev => prev.map(tile => 
        tile.id === currentTileId ? { ...tile, disintegrating: true } : tile
      ));
      
      // Move to next tile
      const nextOrder = currentTileOrder + 1;
      setCurrentTileOrder(nextOrder);
      
      // Show smaller feedback
      setShowFeedback({
        type: feedback, 
        show: true, 
        text: `${feedbackText} +${points}`
      });
      setLastTapTime(Date.now());
      
      setTimeout(() => {
        setShowFeedback(prev => ({...prev, show: false}));
      }, 400);

      // Clear from order map
      tileOrderMapRef.current.delete(currentTileOrder);
      
      // Remove tile after animation
      setTimeout(() => {
        setTiles(prev => prev.filter(tile => tile.id !== currentTileId));
      }, 250); // Increased from 200ms
      
      // Check if need more tiles - generate only if we have room
      const nextTileId = tileOrderMapRef.current.get(nextOrder);
      const activeTileCount = tiles.filter(t => !t.disintegrating).length - 1; // Subtract current tile being removed
      
      if (!nextTileId && tileReleaseQueueRef.current.length < 1 && activeTileCount < 1) {
        setTimeout(() => generateTileBatch(1), 400); // Increased from 300ms
      }
      
    } else {
      // Wrong column - game over
      playTileSound(100, 'miss');
      handleGameOver('Wrong column!');
    }
  };

  const handleGameOver = (reason: string) => {
    if (!gameActive) return;
    
    cleanupAudio();
    setGameActive(false);
    setShowFeedback({type: 'miss', show: true, text: reason});
    
    if (score > highScore) setHighScore(score);
    
    // Clear all intervals
    [gameIntervalRef, tileIntervalRef, levelIntervalRef, announcementTimeoutRef, 
     releaseTimeoutRef, particleIntervalRef, streakEffectRef, stageCompleteRef].forEach(ref => {
      if (ref.current) clearTimeout(ref.current as any);
      ref.current = null;
    });
    
    // Clear touch state
    touchInProgressRef.current = false;
    
    // Show game over menu
    setTimeout(() => {
      setShowMenu(true);
      setMenuState('gameOver');
      setShowFeedback(prev => ({...prev, show: false}));
    }, 500);
  };

  const startGame = () => {
    // Clean up everything first
    cleanupAudio();
    
    // Initialize fresh
    initAudio();
    setTimeout(() => {
      startBackgroundMusic();
    }, 200);
    
    playTileSound(1500, 'perfect');
    
    setScore(0);
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setGameActive(true);
    setGameStarted(true);
    setGameSpeed(0.8); // Slower start
    setLevel('Stage 1');
    setLevelStage('stage1');
    setStageTimer(30);
    setTiles([]);
    setCurrentTileOrder(1);
    setGameTime(0);
    tileCounter.current = 0;
    tileOrderMapRef.current.clear();
    tileReleaseQueueRef.current = [];
    startTimeRef.current = Date.now();
    lastTapRef.current = 0;
    touchInProgressRef.current = false;
    setParticleEffects([]);
    setShowFeedback({type: 'good', show: false, text: ''});
    setShowAnnouncement(false);
    setShowMenu(false);
    setAudioLoaded(false);
    setShowStreakEffect(false);
    setStageComplete(false);
    setShowStageComplete(false);
    
    // Start tile generation immediately for stage 1
    setTimeout(() => {
      startTileBatchGeneration();
    }, 400); // Increased from 300ms for slower start
  };

  const restartGame = () => {
    cleanupAudio();
    
    setTimeout(() => {
      initAudio();
      startBackgroundMusic();
    }, 200);
    
    playTileSound(1200, 'hit');
    
    setGameStarted(true);
    setScore(0);
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setGameActive(true);
    setGameSpeed(0.8); // Slower start
    setLevel('Stage 1');
    setLevelStage('stage1');
    setStageTimer(30);
    setTiles([]);
    setCurrentTileOrder(1);
    setGameTime(0);
    tileCounter.current = 0;
    tileOrderMapRef.current.clear();
    tileReleaseQueueRef.current = [];
    startTimeRef.current = Date.now();
    lastTapRef.current = 0;
    touchInProgressRef.current = false;
    setParticleEffects([]);
    setShowFeedback({type: 'good', show: false, text: ''});
    setShowAnnouncement(false);
    setShowMenu(false);
    setShowStreakEffect(false);
    setStageComplete(false);
    setShowStageComplete(false);
    
    // Start tile generation immediately for stage 1
    setTimeout(() => {
      startTileBatchGeneration();
    }, 400); // Increased from 300ms for slower start
  };

  const exitToMenu = () => {
    cleanupAudio();
    
    playTileSound(400, 'hit');
    
    setGameStarted(false);
    setGameActive(false);
    setLevelStage('stage1');
    setShowAnnouncement(false);
    setTiles([]);
    tileOrderMapRef.current.clear();
    tileReleaseQueueRef.current = [];
    startTimeRef.current = null;
    touchInProgressRef.current = false;
    setParticleEffects([]);
    setShowMenu(true);
    setMenuState('main');
    setShowStreakEffect(false);
    setStageComplete(false);
    setShowStageComplete(false);
  };

  // Find current tile
  const currentTileId = tileOrderMapRef.current.get(currentTileOrder);
  const currentTile = currentTileId ? tiles.find(t => t.id === currentTileId && t.released && !t.disintegrating) : null;

  // Show main menu initially
  useEffect(() => {
    if (!gameStarted && !showMenu) {
      setShowMenu(true);
      setMenuState('main');
    }
  }, [gameStarted, showMenu]);

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[480px] bg-gradient-to-br from-gray-900 via-black to-gray-950 p-0 overflow-hidden">
      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          touch-action: manipulation !important;
        }
        
        html, body {
          overscroll-behavior: none;
          overflow: hidden;
        }
        
        .game-column {
          touch-action: manipulation;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .tile-disintegrate {
          animation: tileShatter 0.15s ease-out forwards;
        }
        
        @keyframes tileShatter {
          0% {
            opacity: 1;
            transform: translateY(-50%) scale(1) rotate(0deg);
            filter: brightness(1) blur(0px);
          }
          30% {
            opacity: 0.8;
            transform: translateY(-50%) scale(1.2) rotate(5deg);
            filter: brightness(1.8) blur(2px);
          }
          70% {
            opacity: 0.3;
            transform: translateY(-50%) scale(0.7) rotate(-10deg);
            filter: brightness(2.5) blur(4px);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) scale(0.1) rotate(45deg);
            filter: brightness(3) blur(8px);
          }
        }
        
        .column-tap {
          animation: columnFlash 0.1s ease-out;
        }
        
        @keyframes columnFlash {
          0% { background-color: rgba(255, 165, 0, 0); }
          50% { background-color: rgba(255, 165, 0, 0.15); }
          100% { background-color: rgba(255, 165, 0, 0); }
        }
        
        .streak-effect {
          animation: streakPulse 0.3s ease-out;
        }
        
        @keyframes streakPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .stage-complete {
          animation: stageCompleteAnim 1.5s ease-out;
        }
        
        @keyframes stageCompleteAnim {
          0% { transform: scale(0.5); opacity: 0; }
          30% { transform: scale(1.1); opacity: 1; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
      
      <div 
        ref={gameContainerRef}
        className="relative w-[280px] h-[500px] bg-gradient-to-b from-gray-900/95 via-black to-gray-900/95 rounded-3xl border-2 border-orange-500/30 shadow-[0_0_80px_rgba(255,119,0,0.15)] overflow-hidden touch-none select-none mx-auto backdrop-blur-sm"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Enhanced background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-purple-500/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,165,0,0.1),transparent_60%)]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        </div>
        
        {/* MENU SCREENS */}
        {showMenu && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 p-5 backdrop-blur-md bg-gradient-to-b from-black/98 via-gray-950/98 to-black/98">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-7 text-center border-2 border-orange-500/40 w-full max-w-[95%] shadow-2xl shadow-orange-500/20">
              {menuState === 'main' ? (
                <>
                  <div className="text-5xl mb-4 animate-pulse">
                    🎮
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent mb-2 tracking-wider">
                    BEAT RUSH
                  </div>
                  <div className="text-sm text-gray-300 mb-6 font-medium">
                    Tap the rhythm • Chase the beat
                  </div>
                  
                  <button
                    onClick={startGame}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startGame();
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold text-lg py-4 px-4 rounded-2xl shadow-[0_0_30px_rgba(255,119,0,0.7)] hover:shadow-[0_0_40px_rgba(255,119,0,0.9)] active:scale-95 transition-all duration-200 border-2 border-yellow-300 mb-5 hover:brightness-110"
                  >
                    🎵 START GAME
                  </button>
                  
                  <div className="text-sm text-gray-400 mb-2 font-semibold">🏆 HIGH SCORE: {highScore}</div>
                  <div className="text-xs text-gray-500 mb-2">5 Stages • 30s Each • Gradual Speed Increase</div>
                  <div className="text-xs text-gray-600">
                    Fixed mobile touch controls • Comfortable pacing
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">
                    {score >= 1000 ? '👑' : score >= 500 ? '⭐' : '🎵'}
                  </div>
                  
                  <div className="text-xl font-bold text-white mb-3">
                    {score >= 1000 ? 'BEAT MASTER!' : 
                     score >= 500 ? 'AMAZING SCORE!' : 
                     score >= 200 ? 'WELL PLAYED!' : 'GAME OVER'}
                  </div>
                  
                  <div className="text-5xl font-bold mb-5 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    {score}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-900/70 rounded-xl p-3 border border-orange-500/20">
                      <div className="text-xs text-gray-400 mb-1">COMBO</div>
                      <div className="text-xl font-bold text-orange-300">{combo}×</div>
                    </div>
                    <div className="bg-gray-900/70 rounded-xl p-3 border border-orange-500/20">
                      <div className="text-xs text-gray-400 mb-1">STAGE</div>
                      <div className={`text-xl font-bold ${
                        level === 'Stage 1' ? 'text-green-300' : 
                        level === 'Stage 2' ? 'text-yellow-300' : 
                        level === 'Stage 3' ? 'text-orange-300' :
                        level === 'Stage 4' ? 'text-red-300' :
                        'text-purple-300'
                      }`}>{level}</div>
                    </div>
                    <div className="bg-gray-900/70 rounded-xl p-3 border border-orange-500/20">
                      <div className="text-xs text-gray-400 mb-1">HIGH SCORE</div>
                      <div className="text-xl font-bold text-yellow-300">{highScore}</div>
                    </div>
                    <div className="bg-gray-900/70 rounded-xl p-3 border border-orange-500/20">
                      <div className="text-xs text-gray-400 mb-1">STREAK</div>
                      <div className="text-xl font-bold text-green-300">{streak}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mb-5">
                    <button
                      onClick={restartGame}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        restartGame();
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-3 px-3 rounded-xl shadow-lg text-sm hover:brightness-110 transition-all"
                    >
                      🔄 PLAY AGAIN
                    </button>
                    <button
                      onClick={exitToMenu}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        exitToMenu();
                      }}
                      className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold py-3 px-3 rounded-xl shadow-lg text-sm hover:brightness-110 transition-all"
                    >
                      🏠 MAIN MENU
                    </button>
                  </div>

                  {/* Share to X Button - ADDED FEATURE */}
                  <button
                    onClick={shareToX}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      shareToX();
                    }}
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold py-3 px-3 rounded-xl shadow-lg text-sm hover:brightness-110 transition-all mb-5 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    SHARE SCORE ON X
                  </button>
                  
                  <div className="text-xs text-gray-400">
                    {score < 200 ? 'Keep going! Perfect taps give bonus points!' :
                     score < 500 ? 'Nice! Try to maintain your streak!' :
                     'Incredible! You are a rhythm master!'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STAGE COMPLETE SCREEN */}
        {showStageComplete && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-gray-950/95 to-black/95 flex flex-col items-center justify-center z-40 p-5 backdrop-blur-md">
            <div className="stage-complete bg-gradient-to-br from-gray-900/90 to-black/90 rounded-3xl p-6 text-center border-2 border-orange-500/40 w-[260px] shadow-2xl shadow-orange-500/20">
              <div className="text-4xl mb-4 animate-bounce">
                {level === 'Stage 1' ? '🎉' : 
                 level === 'Stage 2' ? '🔥' : 
                 level === 'Stage 3' ? '⚡' :
                 level === 'Stage 4' ? '💎' : '👑'}
              </div>
              <div className="text-xl font-bold text-white mb-3">
                {level} COMPLETE!
              </div>
              <div className="text-sm text-orange-300 mb-2">
                Next Stage Starting...
              </div>
              <div className="text-xs text-gray-400">
                Speed increases to ×{level === 'Stage 1' ? '1.0' : 
                                   level === 'Stage 2' ? '1.2' :
                                   level === 'Stage 3' ? '1.4' :
                                   level === 'Stage 4' ? '1.6' : '1.8'}
              </div>
            </div>
          </div>
        )}

        {/* GAME SCREEN */}
        {gameStarted && gameActive && !showMenu && !showStageComplete && (
          <>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/95 to-transparent z-10 p-3 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-400 tracking-wide">SCORE</div>
                  <div className="text-xl font-bold text-white tracking-wider">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-400 tracking-wide">NEXT</div>
                  <div className="text-lg font-bold text-orange-300 tracking-wider">
                    #{currentTileOrder}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-400 tracking-wide">TILES</div>
                  <div className="text-lg font-bold text-yellow-300 tracking-wider">{tiles.filter(t => !t.disintegrating).length}</div>
                </div>
              </div>
              
              {/* Level indicators */}
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2 flex gap-2">
                <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border-2 ${
                  level === 'Stage 1' ? 'bg-green-500/20 text-green-300 border-green-500/40' : 
                  level === 'Stage 2' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 
                  level === 'Stage 3' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                  level === 'Stage 4' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                  'bg-purple-500/20 text-purple-300 border-purple-500/40'
                } text-sm font-bold`}>
                  {level}
                </div>
                <div className="bg-orange-500/20 text-orange-300 text-sm px-3 py-1.5 rounded-full backdrop-blur-md border-2 border-orange-500/40 font-bold">
                  ×{gameSpeed.toFixed(1)}
                </div>
                <div className="bg-blue-500/20 text-blue-300 text-sm px-3 py-1.5 rounded-full backdrop-blur-md border-2 border-blue-500/40 font-bold">
                  {stageTimer}s
                </div>
              </div>
            </div>

            {/* Game columns - FIXED TOUCH HANDLING */}
            <div className="flex h-full pt-24">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div
                  key={`column_${columnIndex}`}
                  className={`game-column flex-1 relative transition-all duration-100 ${columnIndex < columns - 1 ? 'border-r-2 border-gray-800/40' : ''} ${
                    activeTapColumn === columnIndex ? 'column-tap' : ''
                  }`}
                  // Desktop: Use onMouseDown
                  onMouseDown={(e) => {
                    if (e.button !== 0) return; // Only left click
                    e.preventDefault();
                    handleColumnTap(columnIndex, 'mouse');
                  }}
                  // Mobile: Use onTouchStart with better handling
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Record touch start time
                    touchStartRef.current = Date.now();
                    handleColumnTap(columnIndex, 'touch');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchCancel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  // Prevent context menu
                  onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                  // Prevent drag
                  draggable="false"
                  unselectable="on"
                >
                  {/* Column guide line */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent left-1/2 transform -translate-x-1/2"></div>
                </div>
              ))}
            </div>

            {/* Particle effects */}
            {particleEffects.map((effect) => (
              <div key={effect.id} className="absolute inset-0 pointer-events-none z-30">
                {effect.particles.map((particle) => (
                  <div
                    key={`${effect.id}_${particle.id}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: `${effect.x}%`,
                      top: `${effect.y + particle.y * 0.5}%`,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      backgroundColor: particle.color,
                      opacity: particle.life * 0.7,
                      transform: `translate(-50%, -50%) scale(${particle.life})`,
                      boxShadow: `0 0 ${particle.size/2}px ${particle.color}`,
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Falling tiles */}
            {tiles.filter(tile => tile.released).map(tile => (
              <div
                key={tile.id}
                className={`absolute w-14 h-14 rounded-xl transition-all duration-75 ${
                  tile.disintegrating ? 'tile-disintegrate' : ''
                } ${currentTile?.id === tile.id ? 'z-20' : 'z-10'}`}
                style={{
                  left: `calc(${(tile.column * 25) + 12.5}% - 28px)`,
                  top: `${tile.position}%`,
                  transform: 'translateY(-50%)',
                  transition: tile.disintegrating ? 'none' : 'top 0.075s linear',
                }}
              >
                <div className={`absolute inset-0 rounded-xl overflow-hidden ${
                  currentTile?.id === tile.id && !tile.disintegrating
                    ? 'bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-500 shadow-[0_0_25px_rgba(255,165,0,0.9)] border-2 border-yellow-300'
                    : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_0_10px_rgba(255,165,0,0.4)] border border-orange-300/60'
                } ${tile.disintegrating ? 'brightness-150' : ''}`}>
                  
                  {/* Tile shine effect */}
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl"></div>
                  
                  {/* Tile number */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-base font-black ${
                      currentTile?.id === tile.id && !tile.disintegrating
                        ? 'text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]' 
                        : 'text-white/90'
                    } ${tile.disintegrating ? 'text-white/20' : ''}`}>
                      {tile.order}
                    </div>
                  </div>
                  
                  {/* Current tile effects */}
                  {currentTile?.id === tile.id && !tile.disintegrating && (
                    <>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-yellow-400/20 to-transparent animate-pulse"></div>
                      <div className="absolute -inset-1 rounded-xl border-2 border-yellow-400/50 animate-pulse"></div>
                    </>
                  )}
                  
                  {/* Tap indicator */}
                  {currentTile?.id === tile.id && !tile.disintegrating && tile.position < 60 && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-yellow-300 font-bold whitespace-nowrap bg-black/80 px-2 py-1 rounded-lg animate-pulse border border-yellow-400/50">
                      TAP NOW!
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Current tile indicator (simplified - no column info) */}
            {currentTile && gameActive && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center z-30">
                <div className="bg-gradient-to-r from-gray-900/90 to-black/90 text-orange-300 text-sm px-4 py-2 rounded-full backdrop-blur-md border-2 border-orange-500/50 shadow-lg">
                  <span className="font-bold text-white">TILE #{currentTile.order}</span>
                </div>
              </div>
            )}

            {/* Timing feedback (smaller) */}
            {showFeedback.show && (
              <div className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-black z-40 ${
                showFeedback.type === 'perfect' 
                  ? 'text-yellow-300 animate-bounce drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' 
                  : showFeedback.type === 'good'
                  ? 'text-orange-300 animate-pulse drop-shadow-[0_0_6px_rgba(255,165,0,0.4)]'
                  : 'text-red-300 animate-pulse drop-shadow-[0_0_6px_rgba(255,0,0,0.4)]'
              }`}>
                {showFeedback.text}
              </div>
            )}

            {/* Streak effect */}
            {showStreakEffect && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 streak-effect">
                <div className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  STREAK +1!
                </div>
              </div>
            )}

            {/* Stage progress */}
            <div className="absolute bottom-24 left-0 right-0 text-center z-10">
              <div className={`inline-block ${
                level === 'Stage 1' ? 'bg-green-500/20 text-green-300 border-green-500/40' : 
                level === 'Stage 2' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : 
                level === 'Stage 3' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                level === 'Stage 4' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                'bg-purple-500/20 text-purple-300 border-purple-500/40'
              } text-sm px-4 py-2 rounded-full backdrop-blur-md border-2 font-bold`}>
                {level === 'Stage 1' ? `🎵 STAGE 1 • ${stageTimer}s` : 
                 level === 'Stage 2' ? `⚡ STAGE 2 • ${stageTimer}s` : 
                 level === 'Stage 3' ? `🔥 STAGE 3 • ${stageTimer}s` :
                 level === 'Stage 4' ? `💎 STAGE 4 • ${stageTimer}s` :
                 `👑 STAGE 5 • ${stageTimer}s`}
              </div>
            </div>

            {/* Music indicator */}
            <div className="absolute top-20 right-3 bg-black/50 rounded-xl p-2 z-10 backdrop-blur-md border border-orange-500/30">
              <div className="text-xs text-gray-300 font-medium">
                <span className={musicPlaying ? 'text-green-400' : 'text-red-400'}>
                  {musicPlaying ? '🔊 BEAT ON' : '🔈 MUTED'}
                </span>
              </div>
            </div>

            {/* Quick tap indicator */}
            {lastTapTime && Date.now() - lastTapTime < 200 && (
              <div className="absolute top-32 left-1/2 transform -translate-x-1/2 text-xs text-green-400 font-bold animate-pulse bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                ⚡ QUICK TAP
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}