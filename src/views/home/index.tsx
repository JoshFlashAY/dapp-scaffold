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
    order: number;
    xOffset: number;
    released: boolean;
    disintegrating?: boolean;
    particles?: Array<{x: number, y: number, color: string}>;
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
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const [isProcessingTap, setIsProcessingTap] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuState, setMenuState] = useState<'main' | 'gameOver'>('main');
  const [activeTapColumn, setActiveTapColumn] = useState<number | null>(null);
  const [particleEffects, setParticleEffects] = useState<Array<{
    id: string;
    column: number;
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
  const [audioError, setAudioError] = useState(false);

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
  const backgroundMusicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
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
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const concurrentTilesBuffer = useRef<Set<number>>(new Set()); // Tracks tiles that are currently active and close together
  const tilePositionsRef = useRef<Map<string, number>>(new Map());

  // Initialize audio context
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Load and play background music - Using "Stay" by The Kid LAROI & Justin Bieber (instrumental version)
  const loadBackgroundMusic = () => {
    try {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.currentTime = 0;
        backgroundMusicRef.current.volume = 0.7; // Increased volume
        backgroundMusicRef.current.play().then(() => {
          setMusicPlaying(true);
          setAudioLoaded(true);
        }).catch(error => {
          console.log("Audio play error:", error);
          setAudioError(true);
          // Fallback to generated music if audio file fails
          createFallbackMusic();
        });
        return;
      }

      // Create audio element with a popular royalty-free/chill track
      const audio = new Audio();
      
      // Using a royalty-free chill electronic track from Pixabay
      // This is a placeholder URL - in production, you'd host your own audio file
      audio.src = "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3";
      audio.loop = true;
      audio.volume = 0.7; // Increased volume from 0.3 to 0.7
      audio.preload = "auto";
      
      audio.oncanplaythrough = () => {
        console.log("Audio loaded successfully");
        setAudioLoaded(true);
      };
      
      audio.onerror = (e) => {
        console.error("Audio loading error:", e);
        setAudioError(true);
        createFallbackMusic();
      };
      
      backgroundMusicRef.current = audio;
      
      // Connect to Web Audio API for better control
      const ctx = initAudio();
      const source = ctx.createMediaElementSource(audio);
      backgroundMusicSourceRef.current = source;
      
      // Add some audio processing for better sound
      const gainNode = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      
      source.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Set gain for volume control
      gainNode.gain.value = 1.0;
      
      // Compressor settings for consistent volume
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      
      audio.play().then(() => {
        setMusicPlaying(true);
      }).catch(error => {
        console.log("Autoplay prevented, will play on user interaction");
        // User interaction will trigger play
      });
    } catch (error) {
      console.log("Background music error:", error);
      setAudioError(true);
      createFallbackMusic();
    }
  };

  // Fallback music if audio file fails
  const createFallbackMusic = () => {
    try {
      const ctx = initAudio();
      
      // Create multiple oscillators for richer sound
      const bassOsc = ctx.createOscillator();
      const leadOsc = ctx.createOscillator();
      const padOsc = ctx.createOscillator();
      
      const bassGain = ctx.createGain();
      const leadGain = ctx.createGain();
      const padGain = ctx.createGain();
      
      // Connect nodes
      bassOsc.connect(bassGain);
      leadOsc.connect(leadGain);
      padOsc.connect(padGain);
      
      bassGain.connect(ctx.destination);
      leadGain.connect(ctx.destination);
      padGain.connect(ctx.destination);
      
      // Set oscillator types
      bassOsc.type = 'sawtooth';
      leadOsc.type = 'sine';
      padOsc.type = 'triangle';
      
      // Set volumes
      bassGain.gain.value = 0.1; // Increased volume
      leadGain.gain.value = 0.08; // Increased volume
      padGain.gain.value = 0.06; // Increased volume
      
      // Simple chord progression for a chill vibe
      const chords = [
        {bass: 130.81, lead: 523.25, pad: 329.63}, // C Major
        {bass: 146.83, lead: 587.33, pad: 369.99}, // D Minor
        {bass: 164.81, lead: 659.25, pad: 415.30}, // E Minor
        {bass: 196.00, lead: 783.99, pad: 493.88}  // G Major
      ];
      
      let currentChord = 0;
      
      const playChord = () => {
        if (!musicPlaying) return;
        
        const now = ctx.currentTime;
        const chord = chords[currentChord % chords.length];
        
        // Bass
        bassOsc.frequency.setValueAtTime(chord.bass, now);
        bassGain.gain.setValueAtTime(0.1, now);
        bassGain.gain.exponentialRampToValueAtTime(0.08, now + 0.5);
        
        // Lead melody
        leadOsc.frequency.setValueAtTime(chord.lead, now);
        leadGain.gain.setValueAtTime(0.08, now);
        leadGain.gain.exponentialRampToValueAtTime(0.06, now + 0.3);
        
        // Pad
        padOsc.frequency.setValueAtTime(chord.pad, now);
        padGain.gain.setValueAtTime(0.06, now);
        
        currentChord++;
      };
      
      // Start oscillators
      bassOsc.start();
      leadOsc.start();
      padOsc.start();
      
      // Play chord every 2 seconds
      const chordInterval = setInterval(playChord, 2000);
      
      backgroundMusicRef.current = bassOsc as any;
      
      setMusicPlaying(true);
      
      return () => {
        clearInterval(chordInterval);
        bassOsc.stop();
        leadOsc.stop();
        padOsc.stop();
      };
    } catch (error) {
      console.log("Fallback music error:", error);
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
        if (backgroundMusicRef.current instanceof HTMLAudioElement) {
          backgroundMusicRef.current.pause();
          backgroundMusicRef.current.currentTime = 0;
        } else if ('stop' in backgroundMusicRef.current) {
          (backgroundMusicRef.current as any).stop();
        }
        backgroundMusicRef.current = null;
      } catch (e) {
        console.log("Error stopping music:", e);
      }
    }
    setMusicPlaying(false);
    setAudioLoaded(false);
  };

  // Play sound for tile tap
  const playTileSound = (frequency: number, type: 'hit' | 'perfect' | 'miss' | 'transition' | 'break') => {
    const ctx = initAudio();
    
    try {
      // Stop any ongoing sound effects first to prevent overlap
      audioNodesRef.current.forEach(node => {
        try {
          if ('stop' in node) (node as any).stop();
        } catch (e) {}
      });
      audioNodesRef.current.clear();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      
      switch(type) {
        case 'perfect':
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime); // Reduced volume
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); // Shorter duration
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case 'hit':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime); // Reduced volume
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); // Shorter duration
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'miss':
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime); // Reduced volume
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); // Shorter duration
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'transition':
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime); // Reduced volume
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); // Shorter duration
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'break':
          // Breaking glass sound - simplified
          const glassOsc = ctx.createOscillator();
          const glassGain = ctx.createGain();
          
          glassOsc.connect(glassGain);
          glassGain.connect(ctx.destination);
          
          glassOsc.frequency.setValueAtTime(800, ctx.currentTime);
          glassOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
          
          glassOsc.type = 'sine';
          glassGain.gain.setValueAtTime(0.1, ctx.currentTime); // Reduced volume
          glassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          
          glassOsc.start();
          glassOsc.stop(ctx.currentTime + 0.2);
          
          audioNodesRef.current.add(glassOsc);
          glassOsc.onended = () => audioNodesRef.current.delete(glassOsc);
          return; // Don't create the default oscillator
      }
      
      audioNodesRef.current.add(oscillator);
      oscillator.onended = () => audioNodesRef.current.delete(oscillator);
    } catch (error) {
      console.log("Audio error:", error);
    }
  };

  // Create particle explosion effect
  const createParticleExplosion = (tileId: string, column: number, position: number) => {
    const particles = [];
    const particleCount = 8; // Reduced from 12 for better performance
    const colors = [
      '#FF9900', '#FF6600', '#FF3300', '#FFCC00'
    ];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 1.5 + Math.random() * 3; // Reduced speed
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      particles.push({
        id: i,
        x: 0,
        y: 0,
        vx: vx + (Math.random() - 0.5) * 1.5, // Reduced randomness
        vy: vy + (Math.random() - 0.5) * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 6, // Reduced size
        life: 1.0
      });
    }
    
    const particleEffect = {
      id: `particles_${tileId}_${Date.now()}`,
      column: column,
      particles: particles
    };
    
    setParticleEffects(prev => [...prev, particleEffect]);
    
    // Remove particle effect after animation
    setTimeout(() => {
      setParticleEffects(prev => prev.filter(p => p.id !== particleEffect.id));
    }, 800); // Reduced from 1000ms
  };

  // Update particles animation
  useEffect(() => {
    if (particleEffects.length === 0) return;
    
    if (particleIntervalRef.current) {
      clearInterval(particleIntervalRef.current);
    }
    
    particleIntervalRef.current = setInterval(() => {
      setParticleEffects(prev => 
        prev.map(effect => ({
          ...effect,
          particles: effect.particles.map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08, // Reduced gravity
            life: p.life - 0.025, // Faster fade
            size: p.size * 0.96 // Faster shrinking
          })).filter(p => p.life > 0)
        })).filter(effect => effect.particles.length > 0)
      );
    }, 20); // Reduced frequency from 16ms to 20ms
    
    return () => {
      if (particleIntervalRef.current) {
        clearInterval(particleIntervalRef.current);
      }
    };
  }, [particleEffects.length]);

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
        nextStageTimer = 45; // Increased from 40
        nextSpeed = 1.3; // Reduced from 1.8
        break;
      case 'Medium':
        announcement = '🔥 Stage 2 Complete!\nFinal Stage! Go Hard!';
        nextLevel = 'Hard';
        nextStageTimer = 40; // Increased from 30
        nextSpeed = 1.6; // Reduced from 2.5
        break;
      case 'Hard':
        announcement = '🏆 All Stages Complete!\nKeep going for high score!';
        nextLevel = 'Hard';
        nextStageTimer = 40; // Increased from 30
        nextSpeed = 1.6; // Reduced from 2.5
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

  // Check if tiles are close enough to be considered concurrent
  const areTilesConcurrent = (tile1: any, tile2: any) => {
    const verticalDistance = Math.abs(tile1.position - tile2.position);
    return verticalDistance < 20; // Tiles within 20% vertical distance are considered concurrent
  };

  // Generate tiles in batches with staggered release
  const generateTileBatch = (count: number) => {
    const now = Date.now();
    const newTiles = [];
    
    for (let i = 0; i < count; i++) {
      const order = tileCounter.current + 1;
      const orangeColumn = Math.floor(Math.random() * columns);
      
      // ADJUSTED SPEEDS FOR BETTER USER EXPERIENCE
      let baseSpeed;
      switch(level) {
        case 'Easy':
          baseSpeed = 0.6 * gameSpeed; // Reduced from 0.8
          break;
        case 'Medium':
          baseSpeed = 0.9 * gameSpeed; // Reduced from 1.2
          break;
        case 'Hard':
          baseSpeed = 1.2 * gameSpeed; // Reduced from 1.8
          break;
        default:
          baseSpeed = 0.6 * gameSpeed;
      }
      
      const newTile = {
        id: generateId(),
        column: orangeColumn,
        position: -30, // Start off-screen
        active: true,
        speed: baseSpeed,
        order: order,
        xOffset: 0,
        released: false,
      };
      
      // Calculate release time (staggered with more spacing)
      const releaseTime = now + (i * 800); // Increased from 500ms to 800ms for more spacing
      
      tileOrderMapRef.current.set(order, newTile.id);
      tileReleaseQueueRef.current.push({
        id: newTile.id,
        column: orangeColumn,
        order: order,
        releaseTime: releaseTime,
      });
      
      // Add to tiles array immediately but not released yet
      newTiles.push(newTile);
      tileCounter.current = order;
    }
    
    setTiles(prev => [...prev, ...newTiles]);
    
    // Schedule tile releases
    tileReleaseQueueRef.current.forEach((queuedTile, index) => {
      setTimeout(() => {
        setTiles(prev => prev.map(tile => 
          tile.id === queuedTile.id ? { ...tile, released: true, position: -20 } : tile
        ));
        
        // Remove from queue
        tileReleaseQueueRef.current = tileReleaseQueueRef.current.filter(t => t.id !== queuedTile.id);
      }, queuedTile.releaseTime - now);
    });
  };

  // Generate initial batch when game starts
  useEffect(() => {
    if (gameActive && gameStarted && tiles.length === 0 && tileReleaseQueueRef.current.length === 0) {
      // Generate 2 tiles initially (reduced from 3)
      generateTileBatch(2);
    }
  }, [gameActive, gameStarted, tiles.length, level, gameSpeed]);

  // Continuously generate more tiles as needed
  useEffect(() => {
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;

    if (tileIntervalRef.current) {
      clearInterval(tileIntervalRef.current);
    }

    // Generate new batch when queue is running low
    tileIntervalRef.current = setInterval(() => {
      if (tileReleaseQueueRef.current.length < 2) {
        generateTileBatch(2); // Reduced from 3
      }
    }, 2500); // Increased from 2000ms

    return () => {
      if (tileIntervalRef.current) {
        clearInterval(tileIntervalRef.current);
      }
    };
  }, [gameActive, gameStarted, level, columns, levelStage]);

  // Game loop for moving tiles - UPDATED TO CHECK FOR CONCURRENT TILES
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
        
        // Update positions ref for concurrent tile checking
        tilePositionsRef.current.clear();
        updatedTiles.forEach(tile => {
          if (tile.released && !tile.disintegrating) {
            tilePositionsRef.current.set(tile.id, tile.position);
          }
        });
        
        // Find current tile ID from the order map
        const currentTileId = tileOrderMapRef.current.get(currentTileOrder);
        
        if (currentTileId) {
          const currentTile = updatedTiles.find(t => t.id === currentTileId);
          
          // Check if current tile reached bottom without being tapped
          if (currentTile && currentTile.released && !currentTile.disintegrating && currentTile.position > 100) {
            // Current tile missed - game over
            playTileSound(150, 'miss');
            setTimeout(() => handleGameOver('Missed tile #' + currentTile.order + '!'), 50);
            return updatedTiles;
          }
        }
        
        // Remove tiles that are way past the bottom or have finished disintegrating
        return updatedTiles.filter(tile => tile.position > -40 && !tile.disintegrating);
      });

      setGameTime(prev => prev + 1);
    }, 20); // Increased from 16ms to 20ms for slightly slower updates

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [gameActive, gameSpeed, gameStarted, levelStage, currentTileOrder]);

  // Process tap queue for smooth flow
  const processTapQueue = async () => {
    if (isProcessingQueue.current || tapProcessingQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    
    while (tapProcessingQueue.current.length > 0) {
      const tap = tapProcessingQueue.current.shift();
      if (!tap) continue;
      
      await processColumnTap(tap.columnIndex);
      
      // Very small delay for ultra-smooth flow
      if (tapProcessingQueue.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 10)); // Increased from 5ms
      }
    }
    
    isProcessingQueue.current = false;
  };

  // Main tap handler - optimized for flow
  const handleColumnTap = (columnIndex: number) => {
    const now = Date.now();
    
    // Minimal debounce for smooth flow
    if (now - lastTapRef.current < 30) {
      return;
    }
    
    if (!gameActive || !gameStarted || levelStage === 'announcement' || levelStage === 'transition') return;
    
    // Add to queue for smooth processing
    tapProcessingQueue.current.push({ columnIndex, timestamp: now });
    lastTapRef.current = now;
    
    // Process queue if not already processing
    if (!isProcessingQueue.current) {
      processTapQueue();
    }
    
    // Visual feedback for tap
    setActiveTapColumn(columnIndex);
    setTimeout(() => setActiveTapColumn(null), 100);
  };

  // Check if a tile should be considered "concurrent" with the current tile
  const isConcurrentTile = (tile: any, currentTile: any) => {
    if (!tile || !currentTile) return false;
    
    // Check if tiles are in the same horizontal line (within 20% vertical distance)
    const verticalDistance = Math.abs(tile.position - currentTile.position);
    const isCloseVertically = verticalDistance < 20;
    
    // Check if tiles are close in order (next few tiles)
    const orderDifference = tile.order - currentTile.order;
    const isCloseInOrder = orderDifference > 0 && orderDifference <= 3;
    
    return isCloseVertically && isCloseInOrder;
  };

  // Process individual tap - UPDATED TO ALLOW CONCURRENT TILE TAPPING
  const processColumnTap = async (columnIndex: number) => {
    // Get current tile ID from the order map
    const currentTileId = tileOrderMapRef.current.get(currentTileOrder);
    
    if (!currentTileId) {
      return;
    }

    // Find the current tile
    const currentTile = tiles.find(tile => tile.id === currentTileId);

    if (!currentTile || !currentTile.released || currentTile.disintegrating) {
      return;
    }

    // Check if tapped column has the current tile OR a concurrent tile
    let tappedTile = currentTile;
    let isConcurrentTap = false;
    
    if (currentTile.column !== columnIndex) {
      // Check if there's a concurrent tile in the tapped column
      const releasedTiles = tiles.filter(t => t.released && !t.disintegrating);
      const tileInColumn = releasedTiles.find(t => t.column === columnIndex);
      
      if (tileInColumn && isConcurrentTile(tileInColumn, currentTile)) {
        tappedTile = tileInColumn;
        isConcurrentTap = true;
      } else {
        // Tapped wrong column and no concurrent tile - game over
        playTileSound(100, 'miss');
        handleGameOver('Wrong column! Should have tapped column ' + (currentTile.column + 1));
        return;
      }
    }

    // Calculate score based on tapped tile
    const positionScore = Math.max(20, Math.round(100 - tappedTile.position * 0.6));
    const basePoints = positionScore;
    let points = 0;
    let feedback: 'perfect' | 'good' = 'good';
    let feedbackText = 'GOOD!';
    
    if (tappedTile.position < 50) {
      points = basePoints * multiplier * (isConcurrentTap ? 1.5 : 2.0); // Reduced bonus for concurrent taps
      feedback = 'perfect';
      feedbackText = isConcurrentTap ? 'CONCURRENT!' : 'PERFECT!';
      playTileSound(1000 + Math.random() * 300, 'perfect');
      playTileSound(800, 'break');
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak % 3 === 0) {
          setMultiplier(prevMult => Math.min(prevMult + 0.5, 4));
        }
        return newStreak;
      });
    } else if (tappedTile.position < 80) {
      points = basePoints * multiplier * (isConcurrentTap ? 1.2 : 1.0);
      feedback = 'good';
      feedbackText = isConcurrentTap ? 'SIMULTANEOUS!' : 'GREAT!';
      playTileSound(700 + Math.random() * 200, 'hit');
      playTileSound(600, 'break');
      setStreak(prev => prev + 1);
    } else {
      points = basePoints * multiplier * (isConcurrentTap ? 1.0 : 0.8);
      feedback = 'good';
      feedbackText = isConcurrentTap ? 'TOGETHER!' : 'GOOD!';
      playTileSound(500 + Math.random() * 150, 'hit');
      playTileSound(400, 'break');
      setStreak(prev => Math.max(1, prev + 0.5));
    }

    const levelBonus = level === 'Medium' ? 1.5 : level === 'Hard' ? 2.0 : 1;
    points = Math.round(points * levelBonus);

    setScore(prev => prev + Math.round(points));
    setCombo(prev => prev + 1);
    
    // Create particle explosion effect
    createParticleExplosion(tappedTile.id, tappedTile.column, tappedTile.position);
    
    // MARK TAPPED TILE FOR DISINTEGRATION
    setTiles(prev => prev.map(tile => 
      tile.id === tappedTile.id ? { ...tile, disintegrating: true } : tile
    ));
    
    // Update current tile order
    let nextOrder = currentTileOrder;
    
    if (!isConcurrentTap) {
      // Normal tap - move to next order
      nextOrder = currentTileOrder + 1;
      setCurrentTileOrder(nextOrder);
      
      // Clear from order map
      tileOrderMapRef.current.delete(currentTileOrder);
    } else {
      // Concurrent tap - find the next tile order (skip the concurrent tile's order)
      // We need to ensure we don't skip too many orders
      const tappedTileOrder = tappedTile.order;
      tileOrderMapRef.current.delete(tappedTileOrder);
      
      // If the concurrent tile was ahead of current tile, we need to adjust
      if (tappedTileOrder > currentTileOrder) {
        nextOrder = currentTileOrder + 1;
        setCurrentTileOrder(nextOrder);
        tileOrderMapRef.current.delete(currentTileOrder);
      }
    }
    
    setShowFeedback({type: feedback, show: true, text: feedbackText});
    setLastTapTime(Date.now());
    
    setTimeout(() => {
      setShowFeedback(prev => ({...prev, show: false}));
    }, 200);

    // If no more released tiles available, generate more immediately
    const nextTileId = tileOrderMapRef.current.get(nextOrder);
    if (!nextTileId) {
      setTimeout(() => {
        generateTileBatch(1);
      }, 0);
    }
    
    // Remove tile after disintegration animation
    setTimeout(() => {
      setTiles(prev => prev.filter(tile => tile.id !== tappedTile.id));
    }, 300);
  };

  const handleGameOver = (reason: string) => {
    if (!gameActive) return;
    
    stopBackgroundMusic();
    setGameActive(false);
    setShowFeedback({type: 'miss', show: true, text: reason});
    
    if (score > highScore) setHighScore(score);
    
    // Clear all intervals and timeouts
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (tileIntervalRef.current) clearInterval(tileIntervalRef.current);
    if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
    if (releaseTimeoutRef.current) clearTimeout(releaseTimeoutRef.current);
    if (particleIntervalRef.current) clearInterval(particleIntervalRef.current);
    
    gameIntervalRef.current = null;
    tileIntervalRef.current = null;
    levelIntervalRef.current = null;
    announcementTimeoutRef.current = null;
    releaseTimeoutRef.current = null;
    particleIntervalRef.current = null;
    
    // Clear tap queue
    tapProcessingQueue.current = [];
    isProcessingQueue.current = false;
    
    // Clear particles
    setParticleEffects([]);
    
    // Show game over menu after a short delay
    setTimeout(() => {
      setShowMenu(true);
      setMenuState('gameOver');
      setShowFeedback(prev => ({...prev, show: false}));
    }, 800);
  };

  const startGame = () => {
    // Reset all audio
    cleanupAudio();
    
    // Start music after a small delay to ensure clean audio context
    setTimeout(() => {
      startBackgroundMusic();
    }, 100);
    
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
    tileCounter.current = 0;
    tileOrderMapRef.current.clear();
    tileReleaseQueueRef.current = [];
    startTimeRef.current = Date.now();
    lastTapRef.current = 0;
    tapProcessingQueue.current = [];
    isProcessingQueue.current = false;
    setParticleEffects([]);
    setShowFeedback({type: 'good', show: false, text: ''});
    setShowAnnouncement(false);
    setShowMenu(false);
    setAudioError(false);
  };

  const restartGame = () => {
    // Reset all audio
    cleanupAudio();
    
    setTimeout(() => {
      startBackgroundMusic();
    }, 100);
    
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
    tileCounter.current = 0;
    tileOrderMapRef.current.clear();
    tileReleaseQueueRef.current = [];
    startTimeRef.current = Date.now();
    lastTapRef.current = 0;
    tapProcessingQueue.current = [];
    isProcessingQueue.current = false;
    setParticleEffects([]);
    setShowFeedback({type: 'good', show: false, text: ''});
    setShowAnnouncement(false);
    setShowMenu(false);
    setAudioError(false);
    
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
    tileOrderMapRef.current.clear();
    tileReleaseQueueRef.current = [];
    startTimeRef.current = null;
    tapProcessingQueue.current = [];
    isProcessingQueue.current = false;
    setParticleEffects([]);
    setShowMenu(true);
    setMenuState('main');
    cleanupAudio();
    setAudioError(false);
    
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (tileIntervalRef.current) clearInterval(tileIntervalRef.current);
    if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    if (announcementTimeoutRef.current) clearTimeout(announcementTimeoutRef.current);
    if (releaseTimeoutRef.current) clearTimeout(releaseTimeoutRef.current);
    if (particleIntervalRef.current) clearInterval(particleIntervalRef.current);
    
    gameIntervalRef.current = null;
    tileIntervalRef.current = null;
    levelIntervalRef.current = null;
    announcementTimeoutRef.current = null;
    releaseTimeoutRef.current = null;
    particleIntervalRef.current = null;
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
    <div className="flex items-center justify-center w-full h-full min-h-[480px] bg-gradient-to-b from-gray-950 to-black p-0 overflow-hidden">
      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          touch-action: manipulation;
        }
        
        .game-column {
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .disintegrate {
          animation: shatter 0.3s ease-out forwards;
        }
        
        @keyframes shatter {
          0% {
            opacity: 1;
            transform: translateY(-50%) scale(1) rotate(0deg);
            filter: brightness(1) blur(0px);
          }
          20% {
            opacity: 0.9;
            transform: translateY(-50%) scale(1.1) rotate(5deg);
            filter: brightness(1.5) blur(0px);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-50%) scale(0.8) rotate(-10deg);
            filter: brightness(2) blur(2px);
          }
          100% {
            opacity: 0;
            transform: translateY(-50%) scale(0.1) rotate(45deg);
            filter: brightness(3) blur(10px);
          }
        }
        
        .column-tap {
          animation: columnPulse 0.1s ease-out;
        }
        
        @keyframes columnPulse {
          0% {
            background-color: rgba(255, 119, 0, 0);
          }
          50% {
            background-color: rgba(255, 119, 0, 0.3);
          }
          100% {
            background-color: rgba(255, 119, 0, 0);
          }
        }
        
        .particle {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          opacity: 0.8;
          mix-blend-mode: screen;
          box-shadow: 0 0 10px currentColor;
        }
        
        .glow-particle {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
          opacity: 0.6;
          filter: blur(2px);
        }
      `}</style>
      
      {/* Hidden audio element for background music */}
      {audioLoaded && !audioError && (
        <audio
          ref={el => {
            if (el && !backgroundMusicRef.current) {
              backgroundMusicRef.current = el;
            }
          }}
          src="https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3"
          loop
          preload="auto"
          style={{ display: 'none' }}
        />
      )}
      
      <div 
        ref={gameContainerRef}
        className="relative w-[270px] h-[480px] bg-gradient-to-b from-gray-900 via-black to-gray-900 rounded-2xl border border-orange-500/20 shadow-[0_0_60px_rgba(255,119,0,0.1)] overflow-hidden touch-none select-none mx-auto"
        style={{ aspectRatio: '9/16' }}
      >
        {/* App-like glass morphism background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,119,0,0.05),transparent_50%)]"></div>
        
        {/* MENU SCREENS */}
        {showMenu && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-4 backdrop-blur-sm bg-gradient-to-b from-black/95 via-gray-950/95 to-black/95">
            <div className="bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl p-6 text-center border border-orange-500/30 w-full max-w-[95%] shadow-[0_20px_60px_rgba(255,119,0,0.3)]">
              {menuState === 'main' ? (
                <>
                  <div className="text-4xl mb-4">
                    🎵
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent mb-2">
                    SEQUENCE RHYTHM
                  </div>
                  <div className="text-sm text-gray-400 mb-6">
                    Tap tiles in numerical order
                  </div>
                  
                  <button
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 text-white font-bold text-lg py-3 px-4 rounded-2xl shadow-[0_0_20px_rgba(255,119,0,0.6)] hover:shadow-[0_0_30px_rgba(255,119,0,0.8)] active:scale-95 transition-all duration-200 border-4 border-orange-300 mb-4"
                  >
                    START GAME
                  </button>
                  
                  <div className="text-xs text-gray-500 mb-2">🏆 High Score: {highScore}</div>
                  <div className="text-[10px] text-gray-600">
                    Now with concurrent tile tapping!
                  </div>
                  {audioError && (
                    <div className="text-[10px] text-yellow-500 mt-2">
                      Note: Using generated music (external audio blocked)
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">
                    {score >= 1000 ? '🏆' : score >= 500 ? '⭐' : '🎵'}
                  </div>
                  
                  <div className="text-xl font-bold text-white mb-2">
                    {score >= 1000 ? 'RHYTHM MASTER!' : 
                     score >= 500 ? 'GREAT SCORE!' : 
                     score >= 200 ? 'GOOD GAME!' : 'GAME OVER'}
                  </div>
                  
                  <div className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    {score}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-[10px] text-gray-400">COMBO</div>
                      <div className="text-lg font-bold text-orange-300">{combo}×</div>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-[10px] text-gray-400">STAGE</div>
                      <div className={`text-lg font-bold ${
                        level === 'Easy' ? 'text-green-300' : 
                        level === 'Medium' ? 'text-yellow-300' : 
                        'text-red-300'
                      }`}>{level}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-[10px] text-gray-400">HIGH SCORE</div>
                      <div className="text-lg font-bold text-yellow-300">{highScore}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded p-2">
                      <div className="text-[10px] text-gray-400">MULT</div>
                      <div className="text-lg font-bold text-green-300">×{multiplier.toFixed(1)}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={restartGame}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg text-sm"
                    >
                      PLAY AGAIN
                    </button>
                    <button
                      onClick={exitToMenu}
                      className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold py-2.5 px-3 rounded-xl shadow-lg text-sm"
                    >
                      MAIN MENU
                    </button>
                  </div>
                  
                  <div className="text-[10px] text-gray-500">
                    {score < 200 ? 'Tip: Tiles close together can be tapped together!' :
                     score < 500 ? 'Tip: Watch for concurrent tiles on the same line!' :
                     'Tip: Perfect timing gives 2x points!'}
                  </div>
                </>
              )}
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
        {gameStarted && gameActive && !showMenu && !showAnnouncement && levelStage !== 'transition' && (
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

            {/* Game columns with improved touch handling */}
            <div className="flex h-full pt-14">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div
                  key={`column_${columnIndex}`}
                  className={`game-column flex-1 relative ${columnIndex < columns - 1 ? 'border-r border-gray-800/30' : ''} ${
                    activeTapColumn === columnIndex ? 'column-tap' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleColumnTap(columnIndex);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleColumnTap(columnIndex);
                  }}
                  onTouchEnd={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseUp={(e) => e.preventDefault()}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    WebkitTouchCallout: 'none',
                  }}
                >
                  <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-800/20 to-transparent left-1/2 transform -translate-x-1/2"></div>
                  
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-[9px] text-gray-500">
                    {columnIndex + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Particle effects */}
            {particleEffects.map((effect) => (
              <div key={effect.id} className="absolute inset-0 pointer-events-none z-30">
                {effect.particles.map((particle) => (
                  <div
                    key={`${effect.id}_${particle.id}`}
                    className="particle"
                    style={{
                      left: `calc(${(effect.column * 25) + 12.5}% + ${particle.x}px)`,
                      top: `calc(${particle.y}px + 50%)`,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      backgroundColor: particle.color,
                      opacity: particle.life * 0.8,
                      transform: `translate(-50%, -50%) scale(${particle.life})`,
                    }}
                  />
                ))}
                {effect.particles.map((particle, index) => (
                  <div
                    key={`${effect.id}_glow_${particle.id}`}
                    className="glow-particle"
                    style={{
                      left: `calc(${(effect.column * 25) + 12.5}% + ${particle.x}px)`,
                      top: `calc(${particle.y}px + 50%)`,
                      width: `${particle.size * 2}px`,
                      height: `${particle.size * 2}px`,
                      opacity: particle.life * 0.3,
                      transform: `translate(-50%, -50%)`,
                    }}
                  />
                ))}
              </div>
            ))}

            {/* Falling tiles with enhanced disintegration effect */}
            {tiles.filter(tile => tile.released).map(tile => (
              <div
                key={tile.id}
                ref={(el) => {
                  if (el) tileRefs.current.set(tile.id, el);
                  else tileRefs.current.delete(tile.id);
                }}
                className={`absolute w-12 h-12 rounded-lg transition-all duration-75 ${
                  tile.disintegrating ? 'disintegrate' : ''
                } ${currentTile?.id === tile.id ? 'z-20' : 'z-10'}`}
                style={{
                  left: `calc(${(tile.column * 25) + 12.5}% - 24px)`,
                  top: `${tile.position}%`,
                  transform: 'translateY(-50%)',
                  transition: tile.disintegrating ? 'none' : 'top 0.075s linear',
                }}
              >
                <div className={`absolute inset-0 rounded-lg overflow-hidden ${
                  currentTile?.id === tile.id && !tile.disintegrating
                    ? 'bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 shadow-[0_0_20px_rgba(255,119,0,0.8)] border-2 border-yellow-400'
                    : 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_0_5px_rgba(255,119,0,0.3)] border border-orange-300/50'
                } ${tile.disintegrating ? 'brightness-150' : ''}`}>
                  {/* Crack lines when disintegrating */}
                  {tile.disintegrating && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40 transform -translate-y-1/2"></div>
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40 transform -translate-x-1/2"></div>
                      <div className="absolute top-0 left-0 right-0 bottom-0 border-2 border-white/30 rounded-lg"></div>
                    </>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-sm font-bold ${
                      currentTile?.id === tile.id && !tile.disintegrating
                        ? 'text-white' 
                        : 'text-white/80'
                    } ${tile.disintegrating ? 'text-white/20' : ''}`}>
                      {tile.order}
                    </div>
                  </div>
                  
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg"></div>
                  
                  {/* Current tile glow effect */}
                  {currentTile?.id === tile.id && !tile.disintegrating && (
                    <>
                      <div className="absolute inset-0 rounded-lg animate-pulse bg-gradient-to-b from-orange-400/30 to-transparent"></div>
                      <div className="absolute -inset-1 rounded-lg border border-yellow-400/50 animate-pulse"></div>
                    </>
                  )}
                  
                  {/* Concurrent tile indicator */}
                  {currentTile && !tile.disintegrating && tile.id !== currentTile.id && 
                   Math.abs(tile.position - currentTile.position) < 20 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[8px] text-green-300 font-bold whitespace-nowrap bg-black/70 px-1 rounded animate-pulse">
                      CONCURRENT
                    </div>
                  )}
                  
                  {/* Tap indicator only for current tile */}
                  {currentTile?.id === tile.id && !tile.disintegrating && tile.position < 60 && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[9px] text-yellow-300 font-bold whitespace-nowrap bg-black/70 px-1 rounded animate-pulse">
                      TAP NOW!
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Current tile indicator */}
            {currentTile && gameActive && (
              <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 text-center z-30">
                <div className="bg-gradient-to-r from-gray-900/80 to-black/80 text-orange-300 text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-orange-500/30">
                  CURRENT: <span className="font-bold text-white">Tile #{currentTile.order}</span>
                  <div className="text-[9px] text-orange-400">Column {currentTile.column + 1}</div>
                </div>
              </div>
            )}

            {/* Show next tile order in queue */}
            {tileReleaseQueueRef.current.length > 0 && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-center z-10">
                <div className="text-[10px] text-gray-400 bg-black/30 px-2 py-1 rounded-full">
                  Next in: {tileReleaseQueueRef.current.length}
                </div>
              </div>
            )}

            {/* Timing feedback */}
            {showFeedback.show && (
              <div className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold z-40 ${
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

            {/* Music indicator with volume info */}
            <div className="absolute top-16 right-2 bg-black/30 rounded-full p-1 z-10">
              <div className="text-[9px] text-gray-400">
                <span className={musicPlaying ? 'text-green-400' : 'text-red-400'}>
                  {musicPlaying ? '🔊' : '🔈'}
                </span>
                <div className="text-[6px] text-gray-500">VOL: 70%</div>
              </div>
            </div>

            {/* Quick tap indicator */}
            {lastTapTime && Date.now() - lastTapTime < 200 && (
              <div className="absolute top-28 left-1/2 transform -translate-x-1/2 text-xs text-green-400 animate-pulse">
                ⚡ QUICK!
              </div>
            )}

            {/* Concurrent tiles info */}
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center z-10">
              <div className="text-[10px] text-green-400 bg-black/30 px-2 py-1 rounded-full">
                CONCURRENT TILES ENABLED
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameSandbox;