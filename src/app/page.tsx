'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy, Save, Check, Users, Shield, Download, Info, Loader2,
  ChevronDown, ChevronUp, Trash2, Clock, AlertTriangle, Star,
  PartyPopper, Settings, Award, X, Music, Sparkles,
  Volume2
} from 'lucide-react';

interface Match {
  id: string;
  round: number | null;
  matchNum: number;
  phase: string;
  homeTeam: string;
  awayTeam: string;
  homeName: string;
  awayName: string;
}

interface Bet {
  id: string;
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyWinner: string | null;
}

interface Player {
  id: string;
  name: string;
  token: string;
}

interface PhaseWinnerData {
  id: string;
  phase: string;
  winnerName: string;
  audioSrc: string | null;
}

// Phase configuration constants
const PHASES = [
  { key: 'groups', label: '1ª Fase', matchCount: 72, order: 0 },
  { key: 'segunda_fase', label: '2ª Fase', matchSlots: 32, matchCount: 16, order: 1 },
  { key: 'oitavas', label: 'Oitavas de Final', matchSlots: 16, matchCount: 8, order: 2 },
  { key: 'quartas', label: 'Quartas de Final', matchSlots: 8, matchCount: 4, order: 3 },
  { key: 'semifinal', label: 'Semifinal', matchSlots: 4, matchCount: 2, order: 4 },
  { key: 'terceiro_lugar', label: '3º Lugar', matchSlots: 2, matchCount: 1, order: 5 },
  { key: 'final', label: 'Final', matchSlots: 2, matchCount: 1, order: 6 },
];

const KNOCKOUT_PHASES = PHASES.filter(p => p.key !== 'groups');

const WINNER_POSITIONS = [
  { suffix: '_1', label: '1º Lugar', emoji: '🥇' },
  { suffix: '_2', label: '2º Lugar', emoji: '🥈' },
  { suffix: '_3', label: '3º Lugar', emoji: '🥉' },
];

const PHASES_FOR_WINNERS = [
  { key: 'groups', label: '1ª Fase (Grupos)' },
  { key: 'segunda_fase', label: '2ª Fase' },
  { key: 'oitavas', label: 'Oitavas de Final' },
  { key: 'quartas', label: 'Quartas de Final' },
  { key: 'semifinal', label: 'Semifinal' },
  { key: 'terceiro_lugar', label: '3º Lugar' },
  { key: 'final', label: 'Final' },
];

const ROUND_LABELS: Record<number, string> = {
  1: '1ª Rodada',
  2: '2ª Rodada',
  3: '3ª Rodada',
};

const TEAMS = [
  { abbr: 'MEX', name: 'México' },
  { abbr: 'AFS', name: 'África do Sul' },
  { abbr: 'COR', name: 'Coreia do Sul' },
  { abbr: 'TCH', name: 'Tchéquia' },
  { abbr: 'CAN', name: 'Canadá' },
  { abbr: 'BOS', name: 'Bósnia' },
  { abbr: 'CAT', name: 'Catar' },
  { abbr: 'SUI', name: 'Suíça' },
  { abbr: 'BRA', name: 'Brasil' },
  { abbr: 'MAR', name: 'Marrocos' },
  { abbr: 'HAI', name: 'Haiti' },
  { abbr: 'ESC', name: 'Escócia' },
  { abbr: 'EUA', name: 'Estados Unidos' },
  { abbr: 'PAR', name: 'Paraguai' },
  { abbr: 'AUS', name: 'Austrália' },
  { abbr: 'TUR', name: 'Turquia' },
  { abbr: 'ALE', name: 'Alemanha' },
  { abbr: 'CUR', name: 'Curaçao' },
  { abbr: 'CDM', name: 'Costa do Marfim' },
  { abbr: 'EQU', name: 'Equador' },
  { abbr: 'HOL', name: 'Holanda' },
  { abbr: 'JAP', name: 'Japão' },
  { abbr: 'SUE', name: 'Suécia' },
  { abbr: 'TUN', name: 'Tunísia' },
  { abbr: 'BEL', name: 'Bélgica' },
  { abbr: 'EGI', name: 'Egito' },
  { abbr: 'IRA', name: 'Irã' },
  { abbr: 'NZE', name: 'Nova Zelândia' },
  { abbr: 'ESP', name: 'Espanha' },
  { abbr: 'CAB', name: 'Cabo Verde' },
  { abbr: 'SAU', name: 'Arábia Saudita' },
  { abbr: 'URU', name: 'Uruguai' },
  { abbr: 'FRA', name: 'França' },
  { abbr: 'SEN', name: 'Senegal' },
  { abbr: 'IRQ', name: 'Iraque' },
  { abbr: 'NOR', name: 'Noruega' },
  { abbr: 'ARG', name: 'Argentina' },
  { abbr: 'AGL', name: 'Argélia' },
  { abbr: 'AUT', name: 'Áustria' },
  { abbr: 'JOR', name: 'Jordânia' },
  { abbr: 'POR', name: 'Portugal' },
  { abbr: 'RDC', name: 'RD Congo' },
  { abbr: 'UZB', name: 'Uzbequistão' },
  { abbr: 'COL', name: 'Colômbia' },
  { abbr: 'ING', name: 'Inglaterra' },
  { abbr: 'CRO', name: 'Croácia' },
  { abbr: 'GAN', name: 'Gana' },
  { abbr: 'PAN', name: 'Panamá' },
];

// ========== Easter Egg Constants ==========
const FUNNY_LOADING_MESSAGES = [
  'Carregando... enquanto isso, aqueça as pernas! ⚽',
  'Preparando os gramados... 🌱',
  'Aquecendo a bola... 🏐',
  'O juiz está conferindo o replay... 📺',
  'Ajeitando as redes do gol... 🥅',
  'Substituição tá saindo... 🏃',
];

const VICTORY_MESSAGES = [
  'Golaço! Palpites salvos! ⚽',
  'Chute certeiro! Tá na reserva! 🎯',
  'Cobertura perfeita! Palpites no gol! 🏆',
  'Deu certo! Mais que um passe de tique-taque! ✨',
  'Gol de placa! Seus palpites foram salvos! 🌟',
  'Pênalti convertido! Palpites registrados! 💪',
];

const TROPHY_TOOLTIP_PHRASES = [
  'Quem viver verá! 👀',
  'A bola é redonda... ⚽',
  'Futebol é uma caixinha de surpresas! 🎁',
  'O jogo só termina quando termina! ⏱️',
  'Enquanto há vida, há esperança! 🙏',
  'A copa é do povo! 🇧🇷',
];

// Audio playback helper
const audioRef = typeof window !== 'undefined' ? { current: null as HTMLAudioElement | null } : { current: null as HTMLAudioElement | null };

const playAudio = (src: string) => {
  try {
    // Stop any currently playing audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Use encodeURI to handle special characters (accents, etc.) in filenames
    const audio = new Audio(encodeURI(src));
    audioRef.current = audio;
    audio.play().catch(() => {});
  } catch {}
};

// Resolve audio source path from a base name or full path
// Always returns a path that will be encodeURI'd by playAudio
const resolveAudioSrc = (audioSrc: string | null): string => {
  if (!audioSrc) return '/winner.mp3';
  // If it's already a full path (starts with /), use as-is for backward compat
  if (audioSrc.startsWith('/')) return audioSrc;
  // Otherwise it's a base name from audios.json → prepend /win/ and append .mp3
  return `/win/${audioSrc}.mp3`;
};

// Normalize audioSrc to base name for Select compatibility
// Converts "/win/winner.mp3" → "winner", "winner" → "winner"
const normalizeAudioSrc = (audioSrc: string | null): string | null => {
  if (!audioSrc) return null;
  // If it's a full path like /win/something.mp3, extract just the base name
  const match = audioSrc.match(/\/win\/(.+)\.mp3$/);
  if (match) return match[1];
  // If it's /something.mp3 (root level), extract base name
  const rootMatch = audioSrc.match(/^\/(.+)\.mp3$/);
  if (rootMatch) return rootMatch[1];
  // Otherwise return as-is (already a base name)
  return audioSrc;
};

// ========== Easter Egg Audio Constants ==========
// Specific audio files for each easter egg
const EASTER_EGG_AUDIO = {
  konami: '/win/a_lapada_é_forte.mp3',
  trophy: '/win/soviet.mp3',
  party: '/win/ilari_ilari_ilariê.mp3',
};

// ========== Vine Boom Spam Effect ==========
// Creates a rapid-fire "vine boom" style image spam across the screen
const VINE_BOOM_AUDIOS = {
  lgn: ['/lgn_1.mp3', '/lgn_2.mp3', '/lgn_3.mp3'],
  ppt: ['/ppt_1.mp3', '/ppt_2.mp3', '/ppt_3.mp3'],
};

const vineBoomSpam = (imageSrc: string, audioGroup: 'lgn' | 'ppt') => {
  const audios = VINE_BOOM_AUDIOS[audioGroup];
  const audioSrc = audios[Math.floor(Math.random() * audios.length)];
  playAudio(audioSrc);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;';
  document.body.appendChild(container);

  const count = 15;
  for (let i = 0; i < count; i++) {
    const img = document.createElement('img');
    img.src = imageSrc;
    const x = Math.random() * 80 + 10; // 10-90% from left
    const y = Math.random() * 80 + 10; // 10-90% from top
    const size = Math.random() * 120 + 80; // 80-200px
    const rotation = Math.floor(Math.random() * 60 - 30); // -30 to +30 deg
    const delay = i * 50; // 50ms stagger
    img.className = 'vine-boom-img';
    img.style.cssText = `
      position:absolute;
      left:${x}%;
      top:${y}%;
      width:${size}px;
      height:${size}px;
      object-fit:cover;
      border-radius:8px;
      --vb-rotate:${rotation}deg;
      animation-delay:${delay}ms;
      box-shadow:0 4px 20px rgba(0,0,0,0.5);
    `;
    container.appendChild(img);
  }

  // Clean up after all animations finish
  const totalTime = 600 + count * 50 + 200; // animation duration + stagger + buffer
  setTimeout(() => {
    container.remove();
  }, totalTime);
};

// Check and mark vine boom as seen for a user (returns true if should show)
const shouldShowVineBoom = (type: 'lgn' | 'ppt', playerId: string): boolean => {
  try {
    const key = `vineboom_${type}_${playerId}`;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
};

// Generate a World Cup themed gradient for team badges
function getTeamColor(abbr: string): string {
  const colors: Record<string, string> = {
    BRA: '#009739', ARG: '#75AADB, #FFFFFF', FRA: '#002395', ESP: '#AA151B',
    POR: '#006600', ING: '#CF081F', ALE: '#000000', HOL: '#FF6600',
    BEL: '#ED2939', ITA: '#0066CC', URU: '#5CBFEF', COL: '#FCD116',
    MEX: '#006847', USA: '#3C3B6E', CAN: '#FF0000', SUI: '#FF0000',
    SUE: '#006AA7', NOR: '#BA0C2F', DAN: '#C60C30', CRO: '#171796',
    AUT: '#ED2939', TCH: '#11457E', POL: '#DC143C', SER: '#C6363C',
    JAP: '#BC002D', COR: '#003478', AUS: '#00008B', TUR: '#E30A17',
    MAR: '#C1272D', EGI: '#CE1126', TUN: '#E70013', SEN: '#00653F',
    GAN: '#CE1126', NIG: '#008751', CAM: '#006633', IRQ: '#CE1126',
    IRA: '#239F40', SAU: '#006C35', CAT: '#8A1538', UZB: '#1EB53A',
    NZE: '#000000', PAN: '#005293', PAR: '#D52B1E', CHI: '#D52B1E',
    ECU: '#FFD100', CUR: '#002B7F', CAB: '#003893', HAI: '#00209F',
    BOS: '#002F6C', AGL: '#CC0000', JOR: '#000000', RDC: '#007FFF',
    CDM: '#F77F00', AFS: '#007749', ESC: '#003087',
  };
  return colors[abbr] || '#6B7280';
}

// Helper: get the base phase key from a winner key (e.g., "groups_2" → "groups")
function getBasePhaseKey(winnerKey: string): string {
  const pos = WINNER_POSITIONS.find(p => winnerKey.endsWith(p.suffix));
  if (pos) {
    return winnerKey.slice(0, -pos.suffix.length);
  }
  return winnerKey;
}

// Helper: get the display label for a winner key
function getWinnerLabel(winnerKey: string): string {
  const baseKey = getBasePhaseKey(winnerKey);
  const phaseInfo = PHASES_FOR_WINNERS.find(p => p.key === baseKey);
  const pos = WINNER_POSITIONS.find(p => winnerKey.endsWith(p.suffix));
  if (phaseInfo && pos) {
    return `${phaseInfo.label} — ${pos.label}`;
  }
  return winnerKey;
}

// Random item helper
const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Konami Code sequence: ↑ ↑ ↓ ↓ ← → ← → B A
// Defined OUTSIDE the component so it's stable across renders
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

function HomeContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Data state
  const [matches, setMatches] = useState<Match[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [bets, setBets] = useState<Map<string, { homeScore: string; awayScore: string; penaltyWinner: string }>>(new Map());
  const [savedBets, setSavedBets] = useState<Map<string, { homeScore: number | null; awayScore: number | null; updatedAt: string }>>(new Map());

  // Form state
  const [playerName, setPlayerName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminData, setAdminData] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(pickRandom(FUNNY_LOADING_MESSAGES));

  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; betCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  // Phase tabs state
  const [activePhase, setActivePhase] = useState('groups');
  const [phaseMatches, setPhaseMatches] = useState<Map<string, Match[]>>(new Map());
  const [phaseWinners, setPhaseWinners] = useState<Map<string, { winnerName: string; audioSrc: string | null }>>(new Map());
  const [winnerModal, setWinnerModal] = useState<{ phase: string; winnerName: string | null; audioSrc?: string | null } | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(false);

  // Betting page sub-tab
  const [betSubTab, setBetSubTab] = useState<'bets' | 'winners'>('bets');

  // Admin tabs state
  const [adminTab, setAdminTab] = useState<'bets' | 'phases' | 'winners'>('bets');
  const [adminPhaseConfig, setAdminPhaseConfig] = useState<string>('segunda_fase');
  const [adminPhaseMatches, setAdminPhaseMatches] = useState<Array<{ homeTeam: string; awayTeam: string; homeName: string; awayName: string; matchNum: number }>>([]);
  const [adminPhaseWinners, setAdminPhaseWinners] = useState<Map<string, { winnerName: string; audioSrc: string | null }>>(new Map());
  const [adminPhaseSaving, setAdminPhaseSaving] = useState(false);
  const [adminWinnerSaving, setAdminWinnerSaving] = useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [teamPickerTarget, setTeamPickerTarget] = useState<{ matchIdx: number; side: 'home' | 'away' } | null>(null);
  const [teamSearch, setTeamSearch] = useState('');

  // Reorder state
  const [reorderLoading, setReorderLoading] = useState(false);

  // Audio files state
  const [audioFiles, setAudioFiles] = useState<string[]>([]);

  // Trophy tooltip state
  const [trophyTooltipText] = useState(() => pickRandom(TROPHY_TOOLTIP_PHRASES));

  // All bets complete state
  const [showAllBetsComplete, setShowAllBetsComplete] = useState(false);

  // ========== Easter Egg States ==========
  // Konami Code
  const [konamiActivated, setKonamiActivated] = useState(false);
  const konamiRef = useRef<string[]>([]);

  // Secret click counter on trophy
  const [trophyClickCount, setTrophyClickCount] = useState(0);
  const [showTrophySecret, setShowTrophySecret] = useState(false);

  // Double-click footer for party mode
  const [partyMode, setPartyMode] = useState(false);

  // Read URL params
  const adminParam = searchParams.get('admin');
  const [currentPage, setCurrentPage] = useState<'home' | 'bet' | 'admin'>(
    adminParam !== null ? 'admin' : 'home'
  );

  // Fetch audio files on mount
  useEffect(() => {
    const fetchAudioFiles = async () => {
      try {
        const res = await fetch('/win/audios.json');
        if (res.ok) {
          const data: string[] = await res.json();
          setAudioFiles(data);
        }
      } catch (e) {
        console.error('Failed to fetch audio files:', e);
      }
    };
    fetchAudioFiles();
  }, []);

  // Auto-migrate + fetch ALL matches on initial load
  useEffect(() => {
    const initApp = async () => {
      // Step 1: Auto-migrate
      try {
        await fetch('/api/migrate');
      } catch (e) {
        console.warn('Auto-migration failed (non-critical):', e);
      }

      // Step 2: Fetch matches
      try {
        const res = await fetch('/api/matches?all=true');
        if (res.ok) {
          const data: Match[] = await res.json();
          const byPhase = new Map<string, Match[]>();
          data.forEach((match) => {
            const existing = byPhase.get(match.phase) || [];
            existing.push(match);
            byPhase.set(match.phase, existing);
          });
          const groupMatches = byPhase.get('groups') || [];
          setMatches(groupMatches);
          setPhaseMatches(byPhase);
          setNeedsSetup(false);
        } else {
          setNeedsSetup(true);
        }
      } catch (e) {
        console.error('Failed to fetch matches:', e);
        setNeedsSetup(true);
      } finally {
        setInitialLoading(false);
      }

      // Step 3: Fetch phase winners
      try {
        const res = await fetch('/api/phase-winners');
        if (res.ok) {
          const data: PhaseWinnerData[] = await res.json();
          const map = new Map<string, { winnerName: string; audioSrc: string | null }>();
          data.forEach((w) => map.set(w.phase, { winnerName: w.winnerName, audioSrc: normalizeAudioSrc(w.audioSrc) }));
          setPhaseWinners(map);
        }
      } catch (e) {
        console.error('Failed to fetch phase winners:', e);
      }
    };
    initApp();
  }, []);

  // Fetch player data when on bet page
  useEffect(() => {
    if (currentPage !== 'bet' || !player) return;

    const fetchPlayerData = async () => {
      try {
        const betsRes = await fetch(`/api/bets?playerId=${player.id}`);
        if (betsRes.ok) {
          const betsData = await betsRes.json();
          const betsMap = new Map<string, { homeScore: number | null; awayScore: number | null; updatedAt: string }>();
          betsData.forEach((bet: any) => {
            betsMap.set(bet.matchId, {
              homeScore: bet.homeScore,
              awayScore: bet.awayScore,
              updatedAt: bet.updatedAt,
            });
          });
          setSavedBets(betsMap);

          const inputMap = new Map<string, { homeScore: string; awayScore: string; penaltyWinner: string }>();
          betsData.forEach((bet: any) => {
            inputMap.set(bet.matchId, {
              homeScore: bet.homeScore !== null ? String(bet.homeScore) : '',
              awayScore: bet.awayScore !== null ? String(bet.awayScore) : '',
              penaltyWinner: bet.penaltyWinner || '',
            });
          });
          setBets(inputMap);
        }
      } catch (e) {
        console.error('Failed to fetch player data:', e);
      }
    };
    fetchPlayerData();
  }, [currentPage, player]);

  // ========== Konami Code Easter Egg ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Normalize key: Arrow keys stay as-is, letters are lowercased
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const seq = konamiRef.current;
      seq.push(key);
      // Keep only the last 10 keys (length of Konami code)
      if (seq.length > KONAMI_CODE.length) seq.shift();
      // Check if the sequence matches
      if (seq.length === KONAMI_CODE.length && seq.every((k, i) => k === KONAMI_CODE[i])) {
        konamiRef.current = [];
        setKonamiActivated(true);
        playAudio(EASTER_EGG_AUDIO.konami);
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          setKonamiActivated(false);
        }, 8000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ========== Trophy Secret Click Easter Egg ==========
  const handleTrophyClick = () => {
    const newCount = trophyClickCount + 1;
    setTrophyClickCount(newCount);
    if (newCount >= 7) {
      setShowTrophySecret(true);
      playAudio(EASTER_EGG_AUDIO.trophy);
      toast({
        title: '🏆 Segredo desbloqueado!',
        description: pickRandom([
          'Você encontrou o troféu secreto! O Ney tá orgulhoso! 🇧🇷',
          '7 cliques no troféu! Você é mais persistente que oVAR! ⚽',
          'Desbloqueou! Agora vai assistir o jogo! 📺',
        ]),
      });
      setTrophyClickCount(0);
      setTimeout(() => setShowTrophySecret(false), 5000);
    }
  };

  // ========== Footer Party Mode Easter Egg ==========
  const handleFooterDoubleClick = () => {
    setPartyMode(prev => !prev);
    if (!partyMode) {
      toast({
        title: '🎉 Modo Festa ATIVADO!',
        description: 'Samba de jogador ninguém segura! 🕺💃',
      });
      playAudio(EASTER_EGG_AUDIO.party);
      // Auto-disable after 10 seconds
      setTimeout(() => setPartyMode(false), 10000);
    }
  };

  // Fetch phase matches when tab switches
  const fetchPhaseMatches = useCallback(async (phase: string) => {
    if (phaseMatches.has(phase) && (phaseMatches.get(phase)?.length || 0) > 0) return;

    setPhaseLoading(true);
    try {
      const res = await fetch(`/api/matches?phase=${phase}`);
      if (res.ok) {
        const data = await res.json();
        setPhaseMatches(prev => new Map(prev).set(phase, data));
      }
    } catch (e) {
      console.error(`Failed to fetch ${phase} matches:`, e);
    } finally {
      setPhaseLoading(false);
    }
  }, [phaseMatches]);

  // Handle phase tab click
  const handlePhaseTabClick = (phaseKey: string) => {
    setActivePhase(phaseKey);
    if (phaseKey !== 'groups') {
      fetchPhaseMatches(phaseKey);
    }
  };

  // Register new player
  const handleSetup = async () => {
    if (!adminPassword.trim()) {
      toast({ title: 'Senha necessária', description: 'Digite a senha de administrador.', variant: 'destructive' });
      return;
    }
    setSetupLoading(true);
    try {
      const res = await fetch(`/api/setup?password=${encodeURIComponent(adminPassword)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Banco configurado!', description: `Tabelas criadas e ${data.counts?.matches || 0} jogos inseridos. 🎉` });
        setNeedsSetup(false);
        setTimeout(() => window.location.reload(), 1500);
      } else if (res.status === 401) {
        toast({ title: 'Senha incorreta', variant: 'destructive' });
      } else {
        toast({ title: 'Erro no setup', description: data.detail || data.error || 'Erro desconhecido', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setSetupLoading(false);
    }
  };

  // Login ou registro pelo nome
  const handleLogin = async () => {
    if (!playerName.trim() || playerName.trim().length < 2) {
      toast({ title: 'Nome obrigatório', description: 'Digite seu nome com pelo menos 2 caracteres.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setPlayer({ id: data.id, name: data.name, token: data.token });
        setCurrentPage('bet');
        // Vine boom on first login
        if (shouldShowVineBoom('lgn', data.id)) {
          setTimeout(() => vineBoomSpam('/lgn.jpg', 'lgn'), 300);
        }
        if (data.isNew) {
          toast({ title: 'Bem-vindo ao bolão!', description: `Conta criada com sucesso. Bons palpites, ${data.name}! 🎉` });
        } else {
          toast({ title: `Bem-vindo de volta, ${data.name}!`, description: 'Seus palpites anteriores foram carregados. ⚽' });
        }
      } else {
        const error = await res.json();
        toast({ title: 'Erro ao entrar', description: error.error || 'Tente novamente.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Save bets
  const handleSave = async () => {
    if (!player) return;

    const currentMatches = activePhase === 'groups' ? matches : (phaseMatches.get(activePhase) || []);

    const betList: { matchId: string; homeScore: number | null; awayScore: number | null; penaltyWinner?: string | null }[] = [];
    currentMatches.forEach(match => {
      const bet = bets.get(match.id);
      if (bet) {
        const hs = bet.homeScore !== '' ? parseInt(bet.homeScore, 10) : null;
        const as_ = bet.awayScore !== '' ? parseInt(bet.awayScore, 10) : null;

        if (hs !== null && (isNaN(hs) || hs < 0 || hs > 30)) {
          toast({ title: 'Placar inválido', description: `Placar de ${match.homeTeam} deve ser 0-30.`, variant: 'destructive' });
          return;
        }
        if (as_ !== null && (isNaN(as_) || as_ < 0 || as_ > 30)) {
          toast({ title: 'Placar inválido', description: `Placar de ${match.awayTeam} deve ser 0-30.`, variant: 'destructive' });
          return;
        }

        const pw = bet.penaltyWinner || null;
        betList.push({ matchId: match.id, homeScore: hs, awayScore: as_, penaltyWinner: pw });
      }
    });

    if (betList.length === 0) {
      toast({ title: 'Nenhum palpite', description: 'Nenhum palpite ainda... Tá esperando o quê? O apito final? 🤨', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id, bets: betList }),
      });

      if (res.ok) {
        const data = await res.json();
        // Vine boom on first save
        if (player && shouldShowVineBoom('ppt', player.id)) {
          setTimeout(() => vineBoomSpam('/ppt.jpg', 'ppt'), 200);
        }
        toast({ title: pickRandom(VICTORY_MESSAGES), description: data.message });
        setHasChanges(false);

        // Check if all bets for this phase are now filled
        const currentPhaseMatches = activePhase === 'groups' ? matches : (phaseMatches.get(activePhase) || []);
        const allFilled = currentPhaseMatches.every(match => {
          const bet = bets.get(match.id);
          return bet && bet.homeScore !== '' && bet.awayScore !== '';
        });
        if (allFilled && currentPhaseMatches.length > 0) {
          setShowAllBetsComplete(true);
          setTimeout(() => setShowAllBetsComplete(false), 4000);
        }

        const betsRes = await fetch(`/api/bets?playerId=${player.id}`);
        if (betsRes.ok) {
          const betsData = await betsRes.json();
          const betsMap = new Map<string, { homeScore: number | null; awayScore: number | null; updatedAt: string }>();
          betsData.forEach((bet: any) => {
            betsMap.set(bet.matchId, { homeScore: bet.homeScore, awayScore: bet.awayScore, updatedAt: bet.updatedAt });
          });
          setSavedBets(betsMap);
        }
      } else {
        const error = await res.json();
        toast({ title: 'Erro ao salvar', description: error.error || 'Tente novamente.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Update bet input
  const updateBet = (matchId: string, field: 'homeScore' | 'awayScore' | 'penaltyWinner', value: string, matchPhase?: string) => {
    if (field === 'homeScore' || field === 'awayScore') {
      const sanitized = value.replace(/[^0-9]/g, '').slice(0, 2);
      setBets(prev => {
        const newMap = new Map(prev);
        const current = prev.get(matchId) || { homeScore: '', awayScore: '', penaltyWinner: '' };
        const updated = { ...current, [field]: sanitized };

        if (matchPhase && matchPhase !== 'groups') {
          const hs = field === 'homeScore' ? sanitized : current.homeScore;
          const as_ = field === 'awayScore' ? sanitized : current.awayScore;
          if (hs !== '' && as_ !== '' && hs !== as_) {
            updated.penaltyWinner = '';
          }
        }

        newMap.set(matchId, updated);
        return newMap;
      });
    } else {
      setBets(prev => {
        const newMap = new Map(prev);
        newMap.set(matchId, { ...prev.get(matchId) || { homeScore: '', awayScore: '', penaltyWinner: '' }, penaltyWinner: value });
        return newMap;
      });
    }
    setHasChanges(true);
  };

  // Admin login
  const handleAdminLogin = async () => {
    if (!adminPassword) {
      toast({ title: 'Senha obrigatória', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bets?password=${encodeURIComponent(adminPassword)}`);
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
        setIsAdminAuth(true);
        setCurrentPage('admin');
        loadAdminPhaseWinners();
      } else if (res.status === 401) {
        toast({ title: 'Senha incorreta', variant: 'destructive' });
      } else {
        let errorDetail = 'Erro desconhecido';
        try {
          const errorData = await res.json();
          errorDetail = errorData.detail || errorData.error || JSON.stringify(errorData);
        } catch (_) {}
        toast({ title: 'Erro no servidor', description: errorDetail, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Reload admin data
  const reloadAdminData = async () => {
    try {
      const res = await fetch(`/api/admin/bets?password=${encodeURIComponent(adminPassword)}`);
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      }
    } catch (e) {
      console.error('Failed to reload admin data:', e);
    }
  };

  // Load admin phase winners
  const loadAdminPhaseWinners = async () => {
    try {
      const res = await fetch(`/api/admin/phase-winner?password=${encodeURIComponent(adminPassword)}`);
      if (res.ok) {
        const data: PhaseWinnerData[] = await res.json();
        const map = new Map<string, { winnerName: string; audioSrc: string | null }>();
        data.forEach((w) => map.set(w.phase, { winnerName: w.winnerName, audioSrc: normalizeAudioSrc(w.audioSrc) }));
        setAdminPhaseWinners(map);
      }
    } catch (e) {
      console.error('Failed to load admin phase winners:', e);
    }
  };

  // Delete a single winner
  const deleteWinner = async (phaseKey: string) => {
    try {
      const res = await fetch(`/api/admin/phase-winner?password=${encodeURIComponent(adminPassword)}&phase=${encodeURIComponent(phaseKey)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({ title: 'Ganhador removido!', description: `Ganhador de "${getWinnerLabel(phaseKey)}" foi removido. 🗑️` });
        setAdminPhaseWinners(prev => {
          const newMap = new Map(prev);
          newMap.delete(phaseKey);
          return newMap;
        });
        const winnersRes = await fetch('/api/phase-winners');
        if (winnersRes.ok) {
          const data: PhaseWinnerData[] = await winnersRes.json();
          const map = new Map<string, { winnerName: string; audioSrc: string | null }>();
          data.forEach((w) => map.set(w.phase, { winnerName: w.winnerName, audioSrc: normalizeAudioSrc(w.audioSrc) }));
          setPhaseWinners(map);
        }
      } else {
        toast({ title: 'Erro ao remover', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    }
  };

  // Delete player and their bets
  const handleDeletePlayer = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/delete-player?password=${encodeURIComponent(adminPassword)}&playerId=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Participante removido', description: data.message });
        setDeleteTarget(null);
        await reloadAdminData();
      } else {
        const error = await res.json();
        toast({ title: 'Erro ao deletar', description: error.error || 'Tente novamente.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // Export CSV
  const handleExport = () => {
    window.open(`/api/admin/export?password=${encodeURIComponent(adminPassword)}`, '_blank');
  };

  // Reordenar partidas
  const handleReorder = async () => {
    if (!confirm('Confirma a reordenacao das partidas conforme o seed-data.ts atual? Os palpites serao preservados.')) {
      return;
    }
    setReorderLoading(true);
    try {
      const res = await fetch(`/api/admin/reorder-matches?password=${encodeURIComponent(adminPassword)}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Reordenacao concluida!' });
        await reloadAdminData();
      } else if (res.status === 401) {
        toast({ title: 'Senha incorreta', variant: 'destructive' });
      } else {
        toast({ title: 'Erro na reordenacao', description: data.detail || data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexao', variant: 'destructive' });
    } finally {
      setReorderLoading(false);
    }
  };

  // Toggle round expansion
  const toggleRound = (round: number) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(round)) newSet.delete(round);
      else newSet.add(round);
      return newSet;
    });
  };

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round ?? 0;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Count filled bets for current phase
  const filledCount = useCallback(() => {
    const currentMatches = activePhase === 'groups' ? matches : (phaseMatches.get(activePhase) || []);
    let count = 0;
    currentMatches.forEach(match => {
      const bet = bets.get(match.id);
      if (bet && (bet.homeScore !== '' || bet.awayScore !== '')) count++;
    });
    return count;
  }, [matches, phaseMatches, activePhase, bets]);

  // ========== ADMIN: Phase configuration methods ==========

  const loadAdminPhaseConfig = async (phase: string) => {
    setAdminPhaseConfig(phase);
    try {
      const res = await fetch(`/api/admin/phase-matches?phase=${phase}`);
      if (res.ok) {
        const data = await res.json();
        const phaseConfig = KNOCKOUT_PHASES.find(p => p.key === phase);
        const expectedCount = phaseConfig?.matchCount || 1;

        if (data.length > 0) {
          const existing: typeof adminPhaseMatches = data.map((m: any) => ({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeName: m.homeName,
            awayName: m.awayName,
            matchNum: m.matchNum,
          }));

          if (existing.length < expectedCount) {
            for (let i = existing.length; i < expectedCount; i++) {
              existing.push({
                homeTeam: '',
                awayTeam: '',
                homeName: '',
                awayName: '',
                matchNum: i + 1,
              });
            }
          }

          setAdminPhaseMatches(existing);
        } else {
          const slots: typeof adminPhaseMatches = [];
          for (let i = 0; i < expectedCount; i++) {
            slots.push({
              homeTeam: '',
              awayTeam: '',
              homeName: '',
              awayName: '',
              matchNum: i + 1,
            });
          }
          setAdminPhaseMatches(slots);
        }
      }
    } catch (e) {
      console.error('Failed to load admin phase config:', e);
    }
  };

  // Save phase configuration
  const savePhaseConfig = async () => {
    for (let i = 0; i < adminPhaseMatches.length; i++) {
      const m = adminPhaseMatches[i];
      if (!m.homeTeam || !m.awayTeam) {
        toast({ title: 'Configuração incompleta', description: `Jogo ${i + 1}: Selecione ambos os times antes de salvar.`, variant: 'destructive' });
        return;
      }
      if (m.homeTeam === m.awayTeam) {
        toast({ title: 'Times duplicados', description: `Jogo ${i + 1}: Times não podem ser iguais.`, variant: 'destructive' });
        return;
      }
    }

    setAdminPhaseSaving(true);
    try {
      const filledMatches = adminPhaseMatches.filter(m => m.homeTeam && m.awayTeam);

      const res = await fetch(`/api/admin/phase-matches?password=${encodeURIComponent(adminPassword)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: adminPhaseConfig, matches: filledMatches }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Fase configurada! ✅', description: data.message });
        setPhaseMatches(prev => {
          const newMap = new Map(prev);
          newMap.delete(adminPhaseConfig);
          return newMap;
        });
        try {
          const fetchRes = await fetch(`/api/matches?phase=${adminPhaseConfig}`);
          if (fetchRes.ok) {
            const fetchData = await fetchRes.json();
            setPhaseMatches(prev => new Map(prev).set(adminPhaseConfig, fetchData));
          }
        } catch (e) {
          console.error('Failed to refresh:', e);
        }
      } else if (res.status === 401) {
        toast({ title: 'Senha incorreta', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao salvar', description: data.error || 'Tente novamente.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setAdminPhaseSaving(false);
    }
  };

  // Save phase winners (save non-empty values, delete empty ones)
  const savePhaseWinners = async () => {
    setAdminWinnerSaving(true);
    try {
      const entries = Array.from(adminPhaseWinners.entries());
      for (const [phase, winnerData] of entries) {
        if (winnerData.winnerName.trim()) {
          const res = await fetch(`/api/admin/phase-winner?password=${encodeURIComponent(adminPassword)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phase, winnerName: winnerData.winnerName.trim(), audioSrc: winnerData.audioSrc || null }),
          });
          if (!res.ok) {
            const error = await res.json();
            toast({ title: 'Erro ao salvar ganhador', description: error.error || 'Tente novamente.', variant: 'destructive' });
            return;
          }
        } else {
          const res = await fetch(`/api/admin/phase-winner?password=${encodeURIComponent(adminPassword)}&phase=${encodeURIComponent(phase)}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const error = await res.json();
            toast({ title: 'Erro ao remover ganhador', description: error.error || 'Tente novamente.', variant: 'destructive' });
            return;
          }
        }
      }
      toast({ title: 'E o campeão é... 🥁', description: 'Todos os ganhadores foram atualizados!' });
      // Refresh public winners
      const winnersRes = await fetch('/api/phase-winners');
      if (winnersRes.ok) {
        const data: PhaseWinnerData[] = await winnersRes.json();
        const map = new Map<string, { winnerName: string; audioSrc: string | null }>();
        data.forEach((w) => map.set(w.phase, { winnerName: w.winnerName, audioSrc: normalizeAudioSrc(w.audioSrc) }));
        setPhaseWinners(map);
      }
    } catch (e) {
      toast({ title: 'Erro de conexão', variant: 'destructive' });
    } finally {
      setAdminWinnerSaving(false);
    }
  };

  // Open team picker
  const openTeamPicker = (matchIdx: number, side: 'home' | 'away') => {
    setTeamPickerTarget({ matchIdx, side });
    setTeamSearch('');
    setTeamPickerOpen(true);
  };

  // Select team from picker
  const selectTeam = (team: { abbr: string; name: string }) => {
    if (!teamPickerTarget) return;
    const { matchIdx, side } = teamPickerTarget;
    setAdminPhaseMatches(prev => {
      const updated = [...prev];
      updated[matchIdx] = {
        ...updated[matchIdx],
        [side === 'home' ? 'homeTeam' : 'awayTeam']: team.abbr,
        [side === 'home' ? 'homeName' : 'awayName']: team.name,
      };
      return updated;
    });
    setTeamPickerOpen(false);
    setTeamPickerTarget(null);
  };

  // Handle "Ver Ganhador" click
  const handleViewWinner = (phaseKey: string) => {
    const winnerKey = `${phaseKey}_1`;
    const winnerData = phaseWinners.get(winnerKey);
    const winnerName = winnerData?.winnerName || null;
    const audioSrc = winnerData?.audioSrc || null;

    setWinnerModal({ phase: phaseKey, winnerName, audioSrc });

    if (winnerName) {
      playAudio(resolveAudioSrc(audioSrc));
    } else {
      playAudio('/no_winner_to_show.mp3');
    }
  };

  // Handle clicking a winner row in the winners sub-tab
  const handleWinnerRowClick = (winnerKey: string) => {
    const winnerData = phaseWinners.get(winnerKey);
    const winnerName = winnerData?.winnerName || null;
    const audioSrc = winnerData?.audioSrc || null;

    setWinnerModal({ phase: winnerKey, winnerName, audioSrc });

    if (winnerName) {
      playAudio(resolveAudioSrc(audioSrc));
    } else {
      playAudio('/no_winner_to_show.mp3');
    }
  };

  // ========== RENDER FUNCTIONS ==========

  // Render home page
  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
      <header className="relative bg-gradient-to-r from-emerald-800 via-green-600 to-emerald-800 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer" onClick={handleTrophyClick}>
                  <Trophy className={`h-12 w-12 text-yellow-300 drop-shadow-lg hover:scale-110 transition-transform ${showTrophySecret ? 'animate-spin' : ''}`} />
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-yellow-500 text-white border-none">
                {trophyTooltipText}
              </TooltipContent>
            </Tooltip>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
              Copa do Mundo 2026
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer" onClick={handleTrophyClick}>
                  <Trophy className={`h-12 w-12 text-yellow-300 drop-shadow-lg hover:scale-110 transition-transform ${showTrophySecret ? 'animate-spin' : ''}`} />
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-yellow-500 text-white border-none">
                {trophyTooltipText}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-lg text-emerald-100 font-medium">Bolão de Palpites — Faça seus palpites e torça! ⚽</p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {needsSetup && (
          <Card className="border-red-300 bg-red-50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Configuracao Inicial Necessaria
              </CardTitle>
              <CardDescription className="text-red-700">
                O banco de dados ainda nao foi configurado. As tabelas precisam ser criadas antes de usar o aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-red-600">
                Digite a senha de administrador abaixo e clique em &quot;Configurar Banco&quot; para criar as tabelas e carregar os jogos automaticamente.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input type="password" placeholder="Senha do administrador" value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                    className="text-base border-red-300 focus:border-red-500" />
                </div>
                <Button onClick={handleSetup} disabled={setupLoading || !adminPassword}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 shadow-md hover:shadow-lg transition-all">
                  {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Configurar Banco'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-green-50/50 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
              <Info className="h-5 w-5" /> Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-700 space-y-2">
            <p><strong>1.</strong> Digite seu nome abaixo para entrar no bolão.</p>
            <p><strong>2.</strong> Se for seu primeiro acesso, sua conta será criada automaticamente.</p>
            <p><strong>3.</strong> Se já tiver uma conta, seus palpites anteriores serão carregados.</p>
            <p><strong>4.</strong> Preencha os placares dos jogos e clique em <strong>&quot;Salvar Palpites&quot;</strong>.</p>
            <p><strong>5.</strong> Você pode alterar e salvar quantas vezes quiser.</p>
            <p className="text-xs text-emerald-600 mt-2">* Placares devem ser números inteiros de 0 a 30. Seu nome é seu login — use o mesmo nome sempre.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Users className="h-5 w-5 text-green-600" /> Entrar no Bolão
            </CardTitle>
            <CardDescription>Digite seu nome para entrar ou criar sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="name" className="sr-only">Seu nome</Label>
                <Input id="name" placeholder="Digite seu nome" value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  maxLength={100} className="text-base h-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500" />
              </div>
              <Button onClick={handleLogin} disabled={loading || !playerName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 shadow-md hover:shadow-lg transition-all text-base font-semibold">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
              </Button>
            </div>
            <p className="text-sm text-emerald-600 mt-3 text-center font-medium">
              Bora, bora, bora! 🇧🇷
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className={`bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-auto cursor-pointer select-none ${partyMode ? 'animate-rainbow' : ''}`}
        onDoubleClick={handleFooterDoubleClick}>
        Bolão Copa do Mundo 2026 — Bons palpites! ⚽
        <a href="/?admin" className="ml-2 text-gray-300 hover:text-gray-400 text-xs">⚙</a>
      </footer>

      {/* Konami Code Easter Egg Overlay */}
      {konamiActivated && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fade-in" onClick={() => setKonamiActivated(false)}>
          <div className="text-center space-y-6 p-8">
            <div className="text-8xl animate-bounce">🎮</div>
            <h2 className="text-4xl font-black text-yellow-400 drop-shadow-lg">KONAMI CODE!</h2>
            <p className="text-xl text-white font-bold">↑ ↑ ↓ ↓ ← → ← → B A</p>
            <p className="text-lg text-emerald-300">
              {pickRandom([
                'Você desbloqueou o modo secreto! O juiz não viu! 🏃',
                'Código Konami ativado! Gol de placa! ⚽',
                'Jogador desbloqueado: Você é o CARA! 🏆',
                'Invencibilidade ativada por 30 segundos! 💪',
              ])}
            </p>
            <div className="flex justify-center gap-4 text-5xl">
              {['🇧🇷', '⚽', '🏆', '🎯', '🥅'].map((emoji, i) => (
                <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 150}ms` }}>{emoji}</span>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">Clique para fechar</p>
          </div>
        </div>
      )}

      {/* Party Mode Easter Egg - floating emojis */}
      {partyMode && (
        <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up text-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              {pickRandom(['⚽', '🏆', '🥅', '🎯', '🇧🇷', '🎉', '🎊', '💫', '⭐', '🔥'])}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render a match row
  const renderMatchRow = (match: Match) => {
    const bet = bets.get(match.id) || { homeScore: '', awayScore: '', penaltyWinner: '' };
    const savedBet = savedBets.get(match.id);
    const isSaved = savedBet !== undefined && (savedBet.homeScore !== null || savedBet.awayScore !== null);
    const isFilled = bet.homeScore !== '' || bet.awayScore !== '';
    const isKnockout = match.phase !== 'groups';
    const isDraw = bet.homeScore !== '' && bet.awayScore !== '' && bet.homeScore === bet.awayScore;
    const showPenaltyField = isKnockout && isDraw;

    return (
      <div key={match.id} className={`px-4 py-3 transition-colors ${isFilled ? 'bg-emerald-50/60' : 'hover:bg-gray-50/50'}`}>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex-1 text-right">
            <span className="font-bold text-sm md:text-base text-gray-800">{match.homeTeam}</span>
            <span className="hidden md:inline text-xs text-gray-500 ml-1">({match.homeName})</span>
            <span className="md:hidden block text-xs text-gray-500">{match.homeName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Input type="text" inputMode="numeric" pattern="[0-9]*" min={0} max={30}
              className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg transition-colors"
              placeholder="-" value={bet.homeScore}
              onChange={(e) => updateBet(match.id, 'homeScore', e.target.value, match.phase)}
              aria-label={`Placar ${match.homeTeam}`} />
            <span className="text-lg font-bold text-gray-400">×</span>
            <Input type="text" inputMode="numeric" pattern="[0-9]*" min={0} max={30}
              className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg transition-colors"
              placeholder="-" value={bet.awayScore}
              onChange={(e) => updateBet(match.id, 'awayScore', e.target.value, match.phase)}
              aria-label={`Placar ${match.awayTeam}`} />
          </div>
          <div className="flex-1 text-left">
            <span className="font-bold text-sm md:text-base text-gray-800">{match.awayTeam}</span>
            <span className="hidden md:inline text-xs text-gray-500 ml-1">({match.awayName})</span>
            <span className="md:hidden block text-xs text-gray-500">{match.awayName}</span>
          </div>
          {isSaved && (
            <div className="shrink-0 flex flex-col items-center">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-[8px] text-gray-400">
                {new Date(savedBets.get(match.id)?.updatedAt || '').toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
        {showPenaltyField && (
          <div className="mt-2 flex items-center gap-2 justify-center">
            <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">Pênaltis:</span>
            <button
              onClick={() => updateBet(match.id, 'penaltyWinner', 'home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all duration-200 ${
                bet.penaltyWinner === 'home'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              {match.homeTeam} 🏆
            </button>
            <span className="text-gray-400 text-xs">ou</span>
            <button
              onClick={() => updateBet(match.id, 'penaltyWinner', 'away')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all duration-200 ${
                bet.penaltyWinner === 'away'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              {match.awayTeam} 🏆
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render betting page
  const renderBet = () => {
    if (!player) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-4 text-gray-600">{pickRandom(FUNNY_LOADING_MESSAGES)}</p>
          </div>
        </div>
      );
    }

    const totalFilled = filledCount();
    const currentPhaseMatches = activePhase === 'groups' ? matches : (phaseMatches.get(activePhase) || []);
    const totalMatches = currentPhaseMatches.length || 72;
    const progressPercent = totalMatches > 0 ? Math.round((totalFilled / totalMatches) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col">
        {/* Header */}
        <header className="relative bg-gradient-to-r from-emerald-800 via-green-600 to-emerald-800 text-white shadow-xl sticky top-0 z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="relative max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-300" />
                <h1 className="text-xl font-bold">Copa 2026 — Palpites</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-green-100">Olá,</p>
                  <p className="font-semibold">{player.name}</p>
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => { setPlayer(null); setBets(new Map()); setSavedBets(new Map()); setCurrentPage('home'); }}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs backdrop-blur-sm transition-all">
                  Sair
                </Button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 bg-emerald-900/50 rounded-full h-3 overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progressPercent}%` }}>
                {progressPercent > 10 && (
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] animate-[shimmer_2s_infinite]" />
                )}
              </div>
            </div>
            <p className="text-xs text-green-200 mt-1.5">
              {totalFilled} de {totalMatches} palpites preenchidos ({progressPercent}%)
              {progressPercent === 100 && ' ✨ Tabela completa!'}
            </p>
          </div>
        </header>

        {/* All bets complete celebration */}
        {showAllBetsComplete && (
          <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 text-amber-900 px-4 py-3 text-center font-bold shadow-md animate-pulse">
            <Sparkles className="h-5 w-5 inline mr-2" />
            Tabela completa! Você tá mais preparado que o Ancelotti! 😎⚽
            <Sparkles className="h-5 w-5 inline ml-2" />
          </div>
        )}

        {/* Sub-tabs */}
        <div className="bg-emerald-900 sticky top-[104px] z-10 shadow-lg">
          <div className="max-w-4xl mx-auto flex">
            <button onClick={() => setBetSubTab('bets')}
              className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-all duration-200 ${
                betSubTab === 'bets' ? 'bg-yellow-400 text-emerald-900 shadow-inner' : 'text-green-200 hover:bg-emerald-800/50'}`}>
              <Save className="h-4 w-4 inline mr-1" /> Palpites
            </button>
            <button onClick={() => setBetSubTab('winners')}
              className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-all duration-200 ${
                betSubTab === 'winners' ? 'bg-yellow-400 text-emerald-900 shadow-inner' : 'text-green-200 hover:bg-emerald-800/50'}`}>
              <Award className="h-4 w-4 inline mr-1" /> Ganhadores
            </button>
          </div>
        </div>

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

          {/* === WINNERS TAB === */}
          {betSubTab === 'winners' && (
            <div className="space-y-3">
              {PHASES_FOR_WINNERS.map(phase => (
                <Card key={phase.key} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5">
                    <span className="font-bold text-sm">{phase.label}</span>
                  </div>
                  <CardContent className="p-0 divide-y divide-gray-100">
                    {WINNER_POSITIONS.map(pos => {
                      const winnerKey = `${phase.key}${pos.suffix}`;
                      const winnerData = phaseWinners.get(winnerKey);
                      const winnerName = winnerData?.winnerName;
                      return (
                        <div key={winnerKey}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-emerald-50/50 transition-colors group"
                          onClick={() => handleWinnerRowClick(winnerKey)}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg group-hover:scale-110 transition-transform">{pos.emoji}</span>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{pos.label}</p>
                              {winnerName ? (
                                <p className="text-xs text-emerald-600 font-medium">{winnerName}</p>
                              ) : (
                                <p className="text-xs text-gray-400">Ainda não definido</p>
                              )}
                            </div>
                          </div>
                          <Badge variant={winnerName ? 'default' : 'secondary'}
                            className={`${winnerName ? 'bg-emerald-600 hover:bg-emerald-700' : ''} transition-colors`}>
                            {winnerName ? 'Ver' : '???'}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* === BETS TAB === */}
          {betSubTab === 'bets' && (
            <>
              {/* Phase tabs */}
              <div className="bg-emerald-800/90 rounded-xl shadow-lg p-2">
                <div className="flex overflow-x-auto scrollbar-hide gap-1">
                  {PHASES.map(phase => {
                    const hasMatches = phase.key === 'groups' || (phaseMatches.has(phase.key) && (phaseMatches.get(phase.key)?.length || 0) > 0);
                    const isActive = activePhase === phase.key;
                    return (
                      <button key={phase.key} onClick={() => handlePhaseTabClick(phase.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          isActive ? 'bg-yellow-400 text-emerald-900 shadow-md scale-105'
                            : hasMatches ? 'bg-emerald-700/50 text-green-100 hover:bg-emerald-600/50 hover:shadow-sm'
                              : 'bg-emerald-900/30 text-green-300/40 hover:bg-emerald-800/30 hover:text-green-200/60'}`}>
                        {phase.label}
                        {hasMatches && phase.key !== 'groups' && (
                          <span className="ml-1 text-xs opacity-70">({(phaseMatches.get(phase.key)?.length || 0)})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instructions card */}
              <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
                <CardContent className="py-3">
                  <p className="text-sm text-blue-800">
                    <strong>Instruções:</strong> Preencha o placar de cada jogo com números inteiros (0 a 30).
                    Clique em <strong>&quot;Salvar Palpites&quot;</strong> ao final da página quando terminar.
                  </p>
                </CardContent>
              </Card>

              {/* Phase content */}
              {activePhase === 'groups' ? (
                <>
                  {[1, 2, 3].map(round => {
                    const roundMatches = matchesByRound[round] || [];
                    const isExpanded = expandedRounds.has(round);
                    const roundFilled = roundMatches.filter(m => {
                      const bet = bets.get(m.id);
                      return bet && (bet.homeScore !== '' || bet.awayScore !== '');
                    }).length;

                    return (
                      <Card key={round} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <button onClick={() => toggleRound(round)}
                          className="w-full text-left bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 flex items-center justify-between hover:from-emerald-700 hover:to-green-700 transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-yellow-300 text-emerald-900 font-bold">{ROUND_LABELS[round]}</Badge>
                            <span className="text-sm text-green-100">{roundFilled}/{roundMatches.length} palpites</span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        {isExpanded && (
                          <CardContent className="p-0 divide-y divide-gray-100">
                            {roundMatches.length === 0 ? (
                              <div className="py-6 text-center text-gray-400 text-sm">
                                Essa fase ainda é um mistério... 🔮
                              </div>
                            ) : (
                              roundMatches.map(match => renderMatchRow(match))
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}

                  <Button onClick={() => handleViewWinner('groups')}
                    variant="outline"
                    className="w-full h-12 text-base font-bold border-yellow-400 text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50 shadow-md hover:shadow-lg transition-all">
                    <Star className="h-5 w-5 mr-2" /> Ver Ganhador da 1ª Fase
                  </Button>
                </>
              ) : (
                <>
                  {phaseLoading ? (
                    <div className="flex flex-col justify-center py-12 items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      <p className="text-gray-500 text-sm">{pickRandom(FUNNY_LOADING_MESSAGES)}</p>
                    </div>
                  ) : currentPhaseMatches.length === 0 ? (
                    <Card className="border-gray-200 shadow-md">
                      <CardContent className="py-8 text-center text-gray-500">
                        <p className="text-4xl mb-3">🔮</p>
                        <p className="font-medium">Essa fase ainda é um mistério...</p>
                        <p className="text-sm text-gray-400 mt-1">Aguarde o administrador configurar os confrontos.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden shadow-md">
                      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4">
                        <Badge variant="secondary" className="bg-yellow-300 text-emerald-900 font-bold">
                          {PHASES.find(p => p.key === activePhase)?.label || activePhase}
                        </Badge>
                      </div>
                      <CardContent className="p-0 divide-y divide-gray-100">
                        {currentPhaseMatches.map(match => renderMatchRow(match))}
                      </CardContent>
                    </Card>
                  )}

                  <Button onClick={() => handleViewWinner(activePhase)}
                    variant="outline"
                    className="w-full h-12 text-base font-bold border-yellow-400 text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50 shadow-md hover:shadow-lg transition-all">
                    <Star className="h-5 w-5 mr-2" /> Ver Ganhador
                  </Button>
                </>
              )}

              {/* Save button */}
              <div className="sticky bottom-4 z-10">
                <Button onClick={handleSave} disabled={loading}
                  className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl rounded-xl transition-all hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Salvar Palpites
                  {hasChanges && <span className="ml-2 text-yellow-200 animate-pulse">●</span>}
                </Button>
              </div>
            </>
          )}
        </main>

        {/* Winner modal */}
        <Dialog open={winnerModal !== null} onOpenChange={(open) => { if (!open) setWinnerModal(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-center justify-center">
                {winnerModal?.winnerName ? (
                  <>
                    <PartyPopper className="h-6 w-6 text-yellow-500" />
                    {getWinnerLabel(winnerModal.phase)}
                    <PartyPopper className="h-6 w-6 text-yellow-500" />
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                    Calma lá...
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center">
              {winnerModal?.winnerName ? (
                <div className="space-y-4">
                  <div className="text-6xl font-black text-emerald-700 animate-bounce">🏆</div>
                  <p className="text-2xl font-bold text-emerald-800">{winnerModal.winnerName}</p>
                  <p className="text-sm text-gray-500">Parabéns ao ganhador! 🎉</p>
                  {/* Audio indicator removed - no "Áudio personalizado" label shown to users */}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-5xl">🤨</div>
                  <p className="text-lg font-semibold text-amber-700">
                    Essa fase nem terminou ainda... Tá fazendo o que aqui? 🤨
                  </p>
                  <p className="text-sm text-gray-500">Volte quando o resultado estiver definido!</p>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setWinnerModal(null)} className="bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <footer className={`bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-4 cursor-pointer select-none ${partyMode ? 'animate-rainbow' : ''}`}
          onDoubleClick={handleFooterDoubleClick}>
          Bolão Copa do Mundo 2026 — {player.name} ⚽
        </footer>

        {/* Konami Code Easter Egg Overlay (bet page) */}
        {konamiActivated && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fade-in" onClick={() => setKonamiActivated(false)}>
            <div className="text-center space-y-6 p-8">
              <div className="text-8xl animate-bounce">🎮</div>
              <h2 className="text-4xl font-black text-yellow-400 drop-shadow-lg">KONAMI CODE!</h2>
              <p className="text-xl text-white font-bold">↑ ↑ ↓ ↓ ← → ← → B A</p>
              <p className="text-lg text-emerald-300">
                {pickRandom([
                  'Seus palpites agora têm poder extra! ⚡',
                  'Código Konami! A bola vai entrar sozinha! ⚽',
                  'Gol de placa desbloqueado! 🏆',
                ])}
              </p>
              <p className="text-sm text-gray-400 mt-4">Clique para fechar</p>
            </div>
          </div>
        )}

        {/* Party Mode Easter Egg (bet page) */}
        {partyMode && (
          <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-float-up text-3xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              >
                {pickRandom(['⚽', '🏆', '🥅', '🎯', '🇧🇷', '🎉', '🎊', '💫', '⭐', '🔥'])}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render admin panel
  const renderAdmin = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex flex-col">
      <header className="relative bg-gradient-to-r from-amber-800 via-yellow-600 to-amber-800 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-yellow-300" />
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-amber-100 text-sm">Bolão Copa do Mundo 2026</p>
              </div>
            </div>
            {isAdminAuth && (
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" onClick={handleReorder} disabled={reorderLoading}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all">
                  {reorderLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                  Reordenar Jogos
                </Button>
                <Button variant="outline" onClick={handleExport}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all">
                  <Download className="h-4 w-4 mr-2" /> Exportar CSV
                </Button>
                <Button variant="outline"
                  onClick={() => { setIsAdminAuth(false); setAdminPassword(''); window.location.href = '/'; }}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all">
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        {!isAdminAuth ? (
          <Card className="max-w-md mx-auto mt-12 shadow-lg">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-amber-600 mx-auto mb-2" />
              <CardTitle className="text-xl">Acesso Restrito</CardTitle>
              <CardDescription>Digite a senha de administrador para continuar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="admin-pass-page">Senha</Label>
                <Input id="admin-pass-page" type="password" placeholder="Senha do administrador"
                  value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} className="text-base mt-1 h-12" />
              </div>
              <Button onClick={handleAdminLogin} disabled={loading || !adminPassword}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 shadow-md transition-all">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Entrar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Admin tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setAdminTab('bets')}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 shadow-sm ${
                  adminTab === 'bets' ? 'bg-amber-600 text-white shadow-md scale-105' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 hover:shadow-md'}`}>
                <Users className="h-4 w-4 inline mr-1" /> Palpites
              </button>
              <button onClick={() => { setAdminTab('phases'); loadAdminPhaseConfig(adminPhaseConfig); }}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 shadow-sm ${
                  adminTab === 'phases' ? 'bg-amber-600 text-white shadow-md scale-105' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 hover:shadow-md'}`}>
                <Settings className="h-4 w-4 inline mr-1" /> Configurar Fases
              </button>
              <button onClick={() => { setAdminTab('winners'); loadAdminPhaseWinners(); }}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 shadow-sm ${
                  adminTab === 'winners' ? 'bg-amber-600 text-white shadow-md scale-105' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 hover:shadow-md'}`}>
                <Award className="h-4 w-4 inline mr-1" /> Ganhadores
              </button>
            </div>

            {/* Bets tab */}
            {adminTab === 'bets' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="shadow-md hover:shadow-lg transition-shadow"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-amber-700">{adminData.length}</p>
                    <p className="text-sm text-gray-500">Participantes</p>
                  </CardContent></Card>
                  <Card className="shadow-md hover:shadow-lg transition-shadow"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-green-700">
                      {adminData.reduce((acc, p) => acc + p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length, 0)}
                    </p>
                    <p className="text-sm text-gray-500">Palpites totais</p>
                  </CardContent></Card>
                  <Card className="shadow-md hover:shadow-lg transition-shadow"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-blue-700">
                      {adminData.filter(p => p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length > 0).length}
                    </p>
                    <p className="text-sm text-gray-500">Com palpites</p>
                  </CardContent></Card>
                  <Card className="shadow-md hover:shadow-lg transition-shadow"><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-red-700">
                      {adminData.filter(p => p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length === 0).length}
                    </p>
                    <p className="text-sm text-gray-500">Sem palpites</p>
                  </CardContent></Card>
                </div>

                <Card className="shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Palpites dos Participantes</CardTitle>
                      <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> CSV</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[600px]">
                      <div className="divide-y">
                        {adminData.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <p className="text-3xl mb-2">🤷</p>
                            Nenhum participante registrado ainda.
                          </div>
                        ) : (
                          adminData.map((p: any) => {
                            const betCount = p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length;
                            const filledBets = p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null);
                            const betsByRound = [1, 2, 3].map(round =>
                              p.bets.filter((b: any) => b.match.round === round).sort((a: any, b: any) => a.match.matchNum - b.match.matchNum)
                            );
                            const betsByPhase = KNOCKOUT_PHASES.map(phase => ({
                              key: phase.key,
                              label: phase.label,
                              bets: p.bets.filter((b: any) => b.match.phase === phase.key).sort((a: any, b: any) => a.match.matchNum - b.match.matchNum),
                            })).filter(g => g.bets.length > 0);
                            const lastUpdated = filledBets.length > 0
                              ? filledBets.reduce((latest: Date, b: any) => { const d = new Date(b.updatedAt); return d > latest ? d : latest; }, new Date(0))
                              : null;

                            return (
                              <div key={p.id} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg">{p.name}</h3>
                                    <div className="text-sm text-gray-500 space-y-0.5">
                                      <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
                                        Registro: {new Date(p.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      {lastUpdated && (
                                        <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
                                          Último palpite: {lastUpdated.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      )}
                                      <p>{betCount} palpites</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{betCount > 0 ? `${betCount} palpites` : 'Sem palpites'}</Badge>
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all"
                                      onClick={() => setDeleteTarget({ id: p.id, name: p.name, betCount })}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  {[1, 2, 3].map(round => (
                                    <div key={round}>
                                      <p className="text-xs font-semibold text-gray-500 mb-1">{ROUND_LABELS[round]}</p>
                                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                                        {betsByRound[round - 1].map((bet: any) => (
                                          <div key={bet.id} className="bg-gray-50 rounded p-1.5 text-center text-xs hover:bg-gray-100 transition-colors">
                                            <div className="text-[10px] text-gray-400 truncate">{bet.match.homeTeam} v {bet.match.awayTeam}</div>
                                            <div className="font-bold text-gray-800">
                                              {bet.homeScore !== null && bet.awayScore !== null ? `${bet.homeScore}×${bet.awayScore}` : '—'}
                                            </div>
                                            {bet.penaltyWinner && bet.homeScore === bet.awayScore && bet.match.phase !== 'groups' && (
                                              <div className="text-[9px] text-amber-600 font-semibold">
                                                Pên: {bet.penaltyWinner === 'home' ? bet.match.homeTeam : bet.match.awayTeam}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                  {betsByPhase.map(group => (
                                    <div key={group.key}>
                                      <p className="text-xs font-semibold text-amber-700 mb-1">{group.label}</p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
                                        {group.bets.map((bet: any) => (
                                          <div key={bet.id} className="bg-amber-50 rounded p-1.5 text-center text-xs hover:bg-amber-100 transition-colors">
                                            <div className="text-[10px] text-gray-400 truncate">{bet.match.homeTeam} v {bet.match.awayTeam}</div>
                                            <div className="font-bold text-gray-800">
                                              {bet.homeScore !== null && bet.awayScore !== null ? `${bet.homeScore}×${bet.awayScore}` : '—'}
                                            </div>
                                            {bet.penaltyWinner && bet.homeScore === bet.awayScore && (
                                              <div className="text-[9px] text-amber-600 font-semibold">
                                                Pên: {bet.penaltyWinner === 'home' ? bet.match.homeTeam : bet.match.awayTeam}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Configure Phases tab */}
            {adminTab === 'phases' && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Configurar Fases Eliminatórias</CardTitle>
                  <CardDescription>Selecione os times para cada jogo das fases eliminatórias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Fase</Label>
                    <select value={adminPhaseConfig} onChange={(e) => loadAdminPhaseConfig(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-xl bg-white text-sm shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all">
                      {KNOCKOUT_PHASES.map(phase => (
                        <option key={phase.key} value={phase.key}>
                          {phase.label} ({phase.matchCount} jogos, {phase.matchSlots} times)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {adminPhaseMatches.map((match, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors">
                        <span className="text-sm font-bold text-gray-500 w-8 shrink-0">J{idx + 1}</span>
                        <button onClick={() => openTeamPicker(idx, 'home')}
                          className={`flex-1 p-2.5 rounded-lg border text-left text-sm transition-all duration-200 ${
                            match.homeTeam ? 'bg-white border-green-300 hover:border-green-400 hover:shadow-sm'
                              : 'bg-gray-100 border-dashed border-gray-300 hover:border-gray-400'}`}>
                          {match.homeTeam ? (
                            <span><span className="font-bold">{match.homeTeam}</span><span className="text-gray-500 ml-1">({match.homeName})</span></span>
                          ) : (
                            <span className="text-gray-400">Selecione mandante...</span>
                          )}
                        </button>
                        <span className="text-gray-400 font-bold">×</span>
                        <button onClick={() => openTeamPicker(idx, 'away')}
                          className={`flex-1 p-2.5 rounded-lg border text-left text-sm transition-all duration-200 ${
                            match.awayTeam ? 'bg-white border-green-300 hover:border-green-400 hover:shadow-sm'
                              : 'bg-gray-100 border-dashed border-gray-300 hover:border-gray-400'}`}>
                          {match.awayTeam ? (
                            <span><span className="font-bold">{match.awayTeam}</span><span className="text-gray-500 ml-1">({match.awayName})</span></span>
                          ) : (
                            <span className="text-gray-400">Selecione visitante...</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button onClick={savePhaseConfig} disabled={adminPhaseSaving}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 shadow-md hover:shadow-lg transition-all">
                    {adminPhaseSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Configuração da Fase
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Winners tab — with audio selection */}
            {adminTab === 'winners' && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Ganhadores</CardTitle>
                  <CardDescription>
                    Defina o 1º, 2º e 3º lugar de cada fase. Clique no ✕ para remover um ganhador.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Audio files info bar */}
                  <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-700">
                      <Music className="h-3.5 w-3.5" />
                      <span>{audioFiles.length} áudio(s) disponível(is) em /public/win/</span>
                    </div>
                    <Button variant="outline" size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/regenerate-audio-manifest?password=${encodeURIComponent(adminPassword)}`, { method: 'POST' });
                          if (res.ok) {
                            const data = await res.json();
                            setAudioFiles(data.files || []);
                            toast({ title: 'Manifesto atualizado! 🎵', description: data.message });
                          } else {
                            toast({ title: 'Erro ao atualizar', variant: 'destructive' });
                          }
                        } catch {
                          toast({ title: 'Erro de conexão', variant: 'destructive' });
                        }
                      }}
                      className="h-6 text-[10px] px-2 border-amber-300 text-amber-700 hover:bg-amber-100">
                      <Volume2 className="h-3 w-3 mr-1" /> Atualizar lista
                    </Button>
                  </div>
                  {PHASES_FOR_WINNERS.map(phase => (
                    <div key={phase.key} className="space-y-2">
                      <h4 className="font-semibold text-sm text-amber-800 border-b border-amber-200 pb-1">{phase.label}</h4>
                      {WINNER_POSITIONS.map(pos => {
                        const winnerKey = `${phase.key}${pos.suffix}`;
                        const currentData = adminPhaseWinners.get(winnerKey) || { winnerName: '', audioSrc: null as string | null };
                        return (
                          <div key={winnerKey} className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg w-6 text-center shrink-0">{pos.emoji}</span>
                            <Label className="w-20 shrink-0 text-xs font-medium">{pos.label}</Label>
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <Input
                                placeholder="Nome do ganhador"
                                value={currentData.winnerName}
                                onChange={(e) => setAdminPhaseWinners(prev => {
                                  const newMap = new Map(prev);
                                  newMap.set(winnerKey, { ...currentData, winnerName: e.target.value });
                                  return newMap;
                                })}
                                className="flex-1 text-sm min-w-[120px]"
                              />
                              {/* Audio selector - using native select for reliable special character support */}
                              <div className="relative">
                                <select
                                  value={currentData.audioSrc || ''}
                                  onChange={(e) => {
                                    const val = e.target.value || null;
                                    setAdminPhaseWinners(prev => {
                                      const newMap = new Map(prev);
                                      const existing = prev.get(winnerKey) || { winnerName: '', audioSrc: null as string | null };
                                      newMap.set(winnerKey, { ...existing, audioSrc: val });
                                      return newMap;
                                    });
                                    // Preview the audio when selecting
                                    if (val) {
                                      playAudio(resolveAudioSrc(val));
                                    }
                                  }}
                                  className="h-8 pl-7 pr-8 rounded-md border border-amber-200 bg-white text-xs text-amber-800 appearance-none cursor-pointer hover:border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors w-[160px] truncate"
                                >
                                  <option value="">Padrão (winner.mp3)</option>
                                  {audioFiles.map((audioName) => (
                                    <option key={audioName} value={audioName}>{audioName}</option>
                                  ))}
                                </select>
                                <Music className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-amber-500 pointer-events-none" />
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-amber-400 pointer-events-none" />
                              </div>
                              {currentData.winnerName && (
                                <Button variant="ghost" size="sm"
                                  onClick={() => deleteWinner(winnerKey)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 transition-all"
                                  title="Remover este ganhador">
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <Button onClick={savePhaseWinners} disabled={adminWinnerSaving}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 shadow-md hover:shadow-lg transition-all">
                    {adminWinnerSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Ganhadores
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Team picker dialog */}
      <Dialog open={teamPickerOpen} onOpenChange={(open) => { if (!open) { setTeamPickerOpen(false); setTeamPickerTarget(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Selecionar {teamPickerTarget?.side === 'home' ? 'Mandante' : 'Visitante'} — Jogo {teamPickerTarget ? teamPickerTarget.matchIdx + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Buscar time..." value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)} className="w-full" />
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {TEAMS.filter(team => {
                if (!teamSearch) return true;
                const q = teamSearch.toLowerCase();
                return team.abbr.toLowerCase().includes(q) || team.name.toLowerCase().includes(q);
              }).map(team => (
                <button key={team.abbr} onClick={() => selectTeam(team)}
                  className="p-2 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm text-left transition-all duration-200">
                  <div className="font-bold text-sm">{team.abbr}</div>
                  <div className="text-xs text-gray-500 truncate">{team.name}</div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" /> Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Tem certeza que deseja deletar <strong>{deleteTarget?.name}</strong> e todos os seus <strong>{deleteTarget?.betCount} palpites</strong>?</p>
                <p className="text-red-600 font-medium">Essa não volta como substituição! ⚠️</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white transition-all">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {deleting ? 'Deletando...' : 'Deletar participante'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className={`bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-auto cursor-pointer select-none ${partyMode ? 'animate-rainbow' : ''}`}
        onDoubleClick={handleFooterDoubleClick}>
        Painel Administrativo — Bolão Copa do Mundo 2026
      </footer>

      {/* Konami Code Easter Egg Overlay (also available in admin) */}
      {konamiActivated && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fade-in" onClick={() => setKonamiActivated(false)}>
          <div className="text-center space-y-6 p-8">
            <div className="text-8xl animate-bounce">🎮</div>
            <h2 className="text-4xl font-black text-yellow-400 drop-shadow-lg">KONAMI CODE!</h2>
            <p className="text-xl text-white font-bold">↑ ↑ ↓ ↓ ← → ← → B A</p>
            <p className="text-lg text-emerald-300">
              {pickRandom([
                'Até o admin tem seus segredos! 🤫',
                'Modo ADM secreto desbloqueado! ⚡',
                'Você é mais esperto que o VAR! 🧐',
              ])}
            </p>
            <p className="text-sm text-gray-400 mt-4">Clique para fechar</p>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
            <Trophy className="h-6 w-6 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium">{loadingMessage}</p>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  switch (currentPage) {
    case 'bet': return renderBet();
    case 'admin': return renderAdmin();
    default: return renderHome();
  }
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
