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
import { Trophy, Save, Check, Users, Shield, Download, Info, Loader2, ChevronDown, ChevronUp, Trash2, Clock, AlertTriangle, Star, PartyPopper, Settings, Award } from 'lucide-react';

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
}

// Phase configuration constants
const PHASES = [
  { key: 'groups', label: '1ª Fase', matchCount: 72, order: 0 },
  { key: 'segunda_fase', label: '2ª Fase', matchSlots: 16, matchCount: 8, order: 1 },
  { key: 'oitavas', label: 'Oitavas', matchSlots: 8, matchCount: 4, order: 2 },
  { key: 'quartas', label: 'Quartas', matchSlots: 4, matchCount: 2, order: 3 },
  { key: 'semifinal', label: 'Semifinal', matchSlots: 2, matchCount: 1, order: 4 },
  { key: 'terceiro_lugar', label: '3º Lugar', matchSlots: 2, matchCount: 1, order: 5 },
  { key: 'final', label: 'Final', matchSlots: 2, matchCount: 1, order: 6 },
];

const KNOCKOUT_PHASES = PHASES.filter(p => p.key !== 'groups');

const ROUND_LABELS: Record<number, string> = {
  1: '1ª Rodada',
  2: '2ª Rodada',
  3: '3ª Rodada',
};

// Teams for admin team selector
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
  { abbr: 'CDM', name: 'Comores' },
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
  { abbr: 'AGL', name: 'Angola' },
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
  { abbr: 'SAL', name: 'El Salvador' },
  { abbr: 'SEM', name: 'São Tomé e Príncipe' },
];

// Audio playback helper
const playAudio = (src: string) => {
  try {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  } catch {}
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
    CDM: '#002F6C', SAL: '#0F47AF', SEM: '#009739', AFS: '#007749',
    ESC: '#003087',
  };
  return colors[abbr] || '#6B7280';
}

function HomeContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Data state
  const [matches, setMatches] = useState<Match[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [bets, setBets] = useState<Map<string, { homeScore: string; awayScore: string }>>(new Map());
  const [savedBets, setSavedBets] = useState<Map<string, { homeScore: number | null; awayScore: number | null; updatedAt: string }>>(new Map());

  // Form state
  const [playerName, setPlayerName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminData, setAdminData] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1]));
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; betCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  // Phase tabs state (for betting page)
  const [activePhase, setActivePhase] = useState('groups');
  const [phaseMatches, setPhaseMatches] = useState<Map<string, Match[]>>(new Map());
  const [phaseWinners, setPhaseWinners] = useState<Map<string, string>>(new Map());
  const [winnerModal, setWinnerModal] = useState<{ phase: string; winnerName: string | null } | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(false);

  // Admin tabs state
  const [adminTab, setAdminTab] = useState<'bets' | 'phases' | 'winners'>('bets');
  const [adminPhaseConfig, setAdminPhaseConfig] = useState<string>('segunda_fase');
  const [adminPhaseMatches, setAdminPhaseMatches] = useState<Array<{ homeTeam: string; awayTeam: string; homeName: string; awayName: string; matchNum: number }>>([]);
  const [adminPhaseWinners, setAdminPhaseWinners] = useState<Map<string, string>>(new Map());
  const [adminPhaseSaving, setAdminPhaseSaving] = useState(false);
  const [adminWinnerSaving, setAdminWinnerSaving] = useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [teamPickerTarget, setTeamPickerTarget] = useState<{ matchIdx: number; side: 'home' | 'away' } | null>(null);
  const [teamSearch, setTeamSearch] = useState('');

  // Reorder state
  const [reorderLoading, setReorderLoading] = useState(false);

  // Read URL params - compute initial page
  const adminParam = searchParams.get('admin');
  // Use a ref to track the initial page from URL to avoid setState in effect
  const [currentPage, setCurrentPage] = useState<'home' | 'bet' | 'admin'>(
    adminParam !== null ? 'admin' : 'home'
  );

  // Fetch matches (group stage)
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/matches');
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
          // Store group matches in phase map
          setPhaseMatches(prev => new Map(prev).set('groups', data));
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
    };
    fetchMatches();
  }, []);

  // Fetch phase winners
  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch('/api/phase-winners');
        if (res.ok) {
          const data: PhaseWinnerData[] = await res.json();
          const map = new Map<string, string>();
          data.forEach((w) => map.set(w.phase, w.winnerName));
          setPhaseWinners(map);
        }
      } catch (e) {
        console.error('Failed to fetch phase winners:', e);
      }
    };
    fetchWinners();
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

          const inputMap = new Map<string, { homeScore: string; awayScore: string }>();
          betsData.forEach((bet: any) => {
            inputMap.set(bet.matchId, {
              homeScore: bet.homeScore !== null ? String(bet.homeScore) : '',
              awayScore: bet.awayScore !== null ? String(bet.awayScore) : '',
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

  // Fetch phase matches when tab switches
  const fetchPhaseMatches = useCallback(async (phase: string) => {
    if (phaseMatches.has(phase)) return; // already loaded

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

  // Get phases that have matches
  const availablePhases = PHASES.filter(p => {
    if (p.key === 'groups') return true;
    return phaseMatches.has(p.key) && (phaseMatches.get(p.key)?.length || 0) > 0;
  });

  // Register new player
  const handleSetup = async () => {
    if (!adminPassword.trim()) {
      toast({
        title: 'Senha necessária',
        description: 'Digite a senha de administrador para configurar o banco de dados.',
        variant: 'destructive',
      });
      return;
    }
    setSetupLoading(true);
    try {
      const res = await fetch(`/api/setup?password=${encodeURIComponent(adminPassword)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Banco configurado!',
          description: `Tabelas criadas e ${data.counts?.matches || 0} jogos inseridos. A página será recarregada.`,
        });
        setNeedsSetup(false);
        setTimeout(() => window.location.reload(), 1500);
      } else if (res.status === 401) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha de administrador está incorreta.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro no setup',
          description: data.detail || data.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      });
    } finally {
      setSetupLoading(false);
    }
  };

  // Login ou registro pelo nome
  const handleLogin = async () => {
    if (!playerName.trim() || playerName.trim().length < 2) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite seu nome com pelo menos 2 caracteres.',
        variant: 'destructive',
      });
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
        if (data.isNew) {
          toast({
            title: 'Bem-vindo ao bolão!',
            description: `Conta criada com sucesso. Bons palpites, ${data.name}!`,
          });
        } else {
          toast({
            title: `Bem-vindo de volta, ${data.name}!`,
            description: 'Seus palpites anteriores foram carregados.',
          });
        }
      } else {
        const error = await res.json();
        toast({
          title: 'Erro ao entrar',
          description: error.error || 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save bets (works for all phases)
  const handleSave = async () => {
    if (!player) return;

    // Get current phase matches
    const currentMatches = activePhase === 'groups' ? matches : (phaseMatches.get(activePhase) || []);

    const betList: { matchId: string; homeScore: number | null; awayScore: number | null }[] = [];
    currentMatches.forEach(match => {
      const bet = bets.get(match.id);
      if (bet) {
        const hs = bet.homeScore !== '' ? parseInt(bet.homeScore, 10) : null;
        const as_ = bet.awayScore !== '' ? parseInt(bet.awayScore, 10) : null;

        if (hs !== null && (isNaN(hs) || hs < 0 || hs > 30)) {
          toast({
            title: 'Placar inválido',
            description: `O placar de ${match.homeTeam} no jogo ${match.homeTeam} x ${match.awayTeam} deve ser entre 0 e 30.`,
            variant: 'destructive',
          });
          return;
        }
        if (as_ !== null && (isNaN(as_) || as_ < 0 || as_ > 30)) {
          toast({
            title: 'Placar inválido',
            description: `O placar de ${match.awayTeam} no jogo ${match.homeTeam} x ${match.awayTeam} deve ser entre 0 e 30.`,
            variant: 'destructive',
          });
          return;
        }

        betList.push({ matchId: match.id, homeScore: hs, awayScore: as_ });
      }
    });

    if (betList.length === 0) {
      toast({
        title: 'Nenhum palpite',
        description: 'Preencha pelo menos um placar antes de salvar.',
        variant: 'destructive',
      });
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
        toast({
          title: 'Palpites salvos!',
          description: data.message,
        });
        setHasChanges(false);

        // Refresh saved bets
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
        }
      } else {
        const error = await res.json();
        toast({
          title: 'Erro ao salvar',
          description: error.error || 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update bet input
  const updateBet = (matchId: string, field: 'homeScore' | 'awayScore', value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 2);
    setBets(prev => {
      const newMap = new Map(prev);
      newMap.set(matchId, {
        ...prev.get(matchId) || { homeScore: '', awayScore: '' },
        [field]: sanitized,
      });
      return newMap;
    });
    setHasChanges(true);
  };

  // Admin login
  const handleAdminLogin = async () => {
    if (!adminPassword) {
      toast({
        title: 'Senha obrigatória',
        description: 'Digite a senha de administrador.',
        variant: 'destructive',
      });
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
        // Load admin phase winners
        loadAdminPhaseWinners();
      } else if (res.status === 401) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha de administrador está incorreta.',
          variant: 'destructive',
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: 'Erro no servidor',
          description: errorData.error || `Erro ${res.status}. Verifique se o banco de dados está configurado corretamente.`,
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      });
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
        const map = new Map<string, string>();
        data.forEach((w) => map.set(w.phase, w.winnerName));
        setAdminPhaseWinners(map);
      }
    } catch (e) {
      console.error('Failed to load admin phase winners:', e);
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
        toast({
          title: 'Participante removido',
          description: data.message,
        });
        setDeleteTarget(null);
        await reloadAdminData();
      } else {
        const error = await res.json();
        toast({
          title: 'Erro ao deletar',
          description: error.error || 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro de conexão',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Export CSV
  const handleExport = () => {
    window.open(`/api/admin/export?password=${encodeURIComponent(adminPassword)}`, '_blank');
  };

  // Reordenar partidas sem perder palpites
  const handleReorder = async () => {
    if (!confirm('Confirma a reordenacao das partidas conforme o seed-data.ts atual? Os palpites serao preservados.')) {
      return;
    }
    setReorderLoading(true);
    try {
      const res = await fetch(`/api/admin/reorder-matches?password=${encodeURIComponent(adminPassword)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Reordenacao concluida!',
          description: `${data.summary.partidas_atualizadas} partidas atualizadas. ${data.summary.palpites_preservados} palpites preservados.`,
        });
        await reloadAdminData();
      } else if (res.status === 401) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha de administrador esta incorreta.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro na reordenacao',
          description: data.detail || data.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro de conexao',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setReorderLoading(false);
    }
  };

  // Toggle round expansion
  const toggleRound = (round: number) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(round)) {
        newSet.delete(round);
      } else {
        newSet.add(round);
      }
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
      if (bet && (bet.homeScore !== '' || bet.awayScore !== '')) {
        count++;
      }
    });
    return count;
  }, [matches, phaseMatches, activePhase, bets]);

  // ========== ADMIN: Phase configuration methods ==========

  // Load phase matches for admin config
  const loadAdminPhaseConfig = async (phase: string) => {
    setAdminPhaseConfig(phase);
    try {
      const res = await fetch(`/api/admin/phase-matches?phase=${phase}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setAdminPhaseMatches(data.map((m: any) => ({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeName: m.homeName,
            awayName: m.awayName,
            matchNum: m.matchNum,
          })));
        } else {
          // Initialize with empty slots
          const phaseConfig = KNOCKOUT_PHASES.find(p => p.key === phase);
          const matchCount = phaseConfig?.matchCount || 1;
          const slots: typeof adminPhaseMatches = [];
          for (let i = 0; i < matchCount; i++) {
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
    // Validate
    for (let i = 0; i < adminPhaseMatches.length; i++) {
      const m = adminPhaseMatches[i];
      if (!m.homeTeam || !m.awayTeam) {
        toast({
          title: 'Configuração incompleta',
          description: `Jogo ${i + 1}: Selecione ambos os times antes de salvar.`,
          variant: 'destructive',
        });
        return;
      }
      if (m.homeTeam === m.awayTeam) {
        toast({
          title: 'Times duplicados',
          description: `Jogo ${i + 1}: O time mandante e visitante não podem ser iguais.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setAdminPhaseSaving(true);
    try {
      const res = await fetch(`/api/admin/phase-matches?password=${encodeURIComponent(adminPassword)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: adminPhaseConfig,
          matches: adminPhaseMatches,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Fase configurada!',
          description: data.message,
        });
        // Refresh phase matches
        setPhaseMatches(prev => {
          const newMap = new Map(prev);
          newMap.delete(adminPhaseConfig); // force reload next time
          return newMap;
        });
      } else if (res.status === 401) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha de administrador está incorreta.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: data.error || 'Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Erro de conexão',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setAdminPhaseSaving(false);
    }
  };

  // Save phase winners
  const savePhaseWinners = async () => {
    setAdminWinnerSaving(true);
    try {
      const entries = Array.from(adminPhaseWinners.entries());
      for (const [phase, winnerName] of entries) {
        if (winnerName.trim()) {
          const res = await fetch(`/api/admin/phase-winner?password=${encodeURIComponent(adminPassword)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phase, winnerName: winnerName.trim() }),
          });
          if (!res.ok) {
            const error = await res.json();
            toast({
              title: 'Erro ao salvar ganhador',
              description: error.error || 'Tente novamente.',
              variant: 'destructive',
            });
            return;
          }
        }
      }
      toast({
        title: 'Ganhadores salvos!',
        description: 'Todos os ganhadores foram atualizados.',
      });
      // Refresh public winners
      const winnersRes = await fetch('/api/phase-winners');
      if (winnersRes.ok) {
        const data: PhaseWinnerData[] = await winnersRes.json();
        const map = new Map<string, string>();
        data.forEach((w) => map.set(w.phase, w.winnerName));
        setPhaseWinners(map);
      }
    } catch (e) {
      toast({
        title: 'Erro de conexão',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
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
  const handleViewWinner = (phase: string) => {
    const winner = phaseWinners.get(phase);
    setWinnerModal({ phase, winnerName: winner || null });
    if (winner) {
      playAudio('/winner.mp3');
    } else {
      playAudio('/no_winner_to_show.mp3');
    }
  };

  // ========== RENDER FUNCTIONS ==========

  // Render home page
  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="h-10 w-10 text-yellow-300" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Copa do Mundo 2026
            </h1>
            <Trophy className="h-10 w-10 text-yellow-300" />
          </div>
          <p className="text-lg text-green-100 font-medium">
            Bolão de Palpites — Faça seus palpites e torça!
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Setup Alert */}
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
                Digite a senha de administrador abaixo e clique em &quot;Configurar Banco&quot; para criar as tabelas e carregar os jogos da Copa automaticamente.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="password"
                    placeholder="Senha do administrador"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                    className="text-base border-red-300 focus:border-red-500"
                  />
                </div>
                <Button
                  onClick={handleSetup}
                  disabled={setupLoading || !adminPassword}
                  className="bg-red-600 hover:bg-red-700 text-white px-6"
                >
                  {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Configurar Banco'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
              <Info className="h-5 w-5" />
              Como funciona
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

        {/* Login/Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Entrar no Bolão
            </CardTitle>
            <CardDescription>
              Digite seu nome para entrar ou criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="name" className="sr-only">Seu nome</Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  maxLength={100}
                  className="text-base"
                />
              </div>
              <Button
                onClick={handleLogin}
                disabled={loading || !playerName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-auto">
        Bolão Copa do Mundo 2026 — Bons palpites!
        <a href="/?admin" className="ml-2 text-gray-300 hover:text-gray-400 text-xs">⚙</a>
      </footer>
    </div>
  );

  // Render a match row (reused for both group and knockout)
  const renderMatchRow = (match: Match) => {
    const bet = bets.get(match.id) || { homeScore: '', awayScore: '' };
    const savedBet = savedBets.get(match.id);
    const isSaved = savedBet !== undefined && (savedBet.homeScore !== null || savedBet.awayScore !== null);
    const isFilled = bet.homeScore !== '' || bet.awayScore !== '';

    return (
      <div key={match.id} className={`px-4 py-3 flex items-center gap-2 md:gap-4 ${isFilled ? 'bg-green-50/50' : ''}`}>
        {/* Home team */}
        <div className="flex-1 text-right">
          <span className="font-bold text-sm md:text-base text-gray-800">{match.homeTeam}</span>
          <span className="hidden md:inline text-xs text-gray-500 ml-1">({match.homeName})</span>
          <span className="md:hidden block text-xs text-gray-500">{match.homeName}</span>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            max={30}
            className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 focus:border-green-500 focus:ring-green-500"
            placeholder="-"
            value={bet.homeScore}
            onChange={(e) => updateBet(match.id, 'homeScore', e.target.value)}
            aria-label={`Placar ${match.homeTeam}`}
          />
          <span className="text-lg font-bold text-gray-400">×</span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            max={30}
            className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 focus:border-green-500 focus:ring-green-500"
            placeholder="-"
            value={bet.awayScore}
            onChange={(e) => updateBet(match.id, 'awayScore', e.target.value)}
            aria-label={`Placar ${match.awayTeam}`}
          />
        </div>

        {/* Away team */}
        <div className="flex-1 text-left">
          <span className="font-bold text-sm md:text-base text-gray-800">{match.awayTeam}</span>
          <span className="hidden md:inline text-xs text-gray-500 ml-1">({match.awayName})</span>
          <span className="md:hidden block text-xs text-gray-500">{match.awayName}</span>
        </div>

        {/* Save indicator */}
        {isSaved && (
          <div className="shrink-0 flex flex-col items-center">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-[8px] text-gray-400">
              {new Date(savedBets.get(match.id)?.updatedAt || '').toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render betting page
  const renderBet = () => {
    if (!player) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      );
    }

    const totalFilled = filledCount();
    const currentPhaseMatches = activePhase === 'groups' ? matches : (phaseMatches.get(activePhase) || []);
    const totalMatches = currentPhaseMatches.length || 72;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 text-white shadow-lg sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPlayer(null); setBets(new Map()); setSavedBets(new Map()); setCurrentPage('home'); }}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs"
                >
                  Sair
                </Button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 bg-green-800/40 rounded-full h-2">
              <div
                className="bg-yellow-300 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalMatches > 0 ? Math.round((totalFilled / totalMatches) * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-green-200 mt-1">
              {totalFilled} de {totalMatches} palpites preenchidos ({totalMatches > 0 ? Math.round((totalFilled / totalMatches) * 100) : 0}%)
            </p>
          </div>
        </header>

        {/* Phase tabs */}
        <div className="bg-emerald-800/90 sticky top-[104px] z-10 shadow-md">
          <div className="max-w-4xl mx-auto">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 px-2 py-2">
              {PHASES.map(phase => {
                const hasMatches = phase.key === 'groups' || (phaseMatches.has(phase.key) && (phaseMatches.get(phase.key)?.length || 0) > 0);
                const isActive = activePhase === phase.key;
                return (
                  <button
                    key={phase.key}
                    onClick={() => hasMatches && handlePhaseTabClick(phase.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-yellow-400 text-emerald-900 shadow-md'
                        : hasMatches
                          ? 'bg-emerald-700/50 text-green-100 hover:bg-emerald-600/50'
                          : 'bg-emerald-900/30 text-green-300/40 cursor-not-allowed'
                    }`}
                  >
                    {phase.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
          {/* Instructions card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="py-3">
              <p className="text-sm text-blue-800">
                <strong>Instruções:</strong> Preencha o placar de cada jogo com números inteiros (0 a 30).
                Clique em <strong>&quot;Salvar Palpites&quot;</strong> ao final da página quando terminar.
                Você pode salvar quantas vezes quiser — os palpites anteriores serão substituídos.
              </p>
            </CardContent>
          </Card>

          {/* Phase content */}
          {activePhase === 'groups' ? (
            // Group stage: rounds with collapsible sections
            <>
              {[1, 2, 3].map(round => {
                const roundMatches = matchesByRound[round] || [];
                const isExpanded = expandedRounds.has(round);
                const roundFilled = roundMatches.filter(m => {
                  const bet = bets.get(m.id);
                  return bet && (bet.homeScore !== '' || bet.awayScore !== '');
                }).length;

                return (
                  <Card key={round} className="overflow-hidden">
                    <button
                      onClick={() => toggleRound(round)}
                      className="w-full text-left bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 flex items-center justify-between hover:from-emerald-700 hover:to-green-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-yellow-300 text-emerald-900 font-bold">
                          {ROUND_LABELS[round]}
                        </Badge>
                        <span className="text-sm text-green-100">
                          {roundFilled}/{roundMatches.length} palpites
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    {isExpanded && (
                      <CardContent className="p-0 divide-y divide-gray-100">
                        {roundMatches.map(match => renderMatchRow(match))}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </>
          ) : (
            // Knockout phase: flat match list
            <>
              {phaseLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : currentPhaseMatches.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="py-8 text-center text-gray-500">
                    Nenhum jogo configurado para esta fase ainda.
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden">
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

              {/* Ver Ganhador button for knockout phases */}
              <Button
                onClick={() => handleViewWinner(activePhase)}
                variant="outline"
                className="w-full h-12 text-base font-bold border-yellow-400 text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50"
              >
                <Star className="h-5 w-5 mr-2" />
                Ver Ganhador
              </Button>
            </>
          )}

          {/* Save button */}
          <div className="sticky bottom-4 z-10">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              Salvar Palpites
              {hasChanges && <span className="ml-2 text-yellow-200">●</span>}
            </Button>
          </div>
        </main>

        {/* Winner modal */}
        <Dialog open={winnerModal !== null} onOpenChange={(open) => { if (!open) setWinnerModal(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-center justify-center">
                {winnerModal?.winnerName ? (
                  <>
                    <PartyPopper className="h-6 w-6 text-yellow-500" />
                    Ganhador da {PHASES.find(p => p.key === winnerModal?.phase)?.label || winnerModal?.phase}!
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
                  <div className="text-5xl font-black text-emerald-700 animate-bounce">
                    🏆
                  </div>
                  <p className="text-2xl font-bold text-emerald-800">
                    {winnerModal.winnerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Parabéns ao ganhador desta fase!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-5xl">
                    🤨
                  </div>
                  <p className="text-lg font-semibold text-amber-700">
                    Essa fase nem terminou ainda... Tá fazendo o que aqui? 🤨
                  </p>
                  <p className="text-sm text-gray-500">
                    Volte quando o resultado estiver definido!
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setWinnerModal(null)} className="bg-emerald-600 hover:bg-emerald-700">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <footer className="bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-4">
          Bolão Copa do Mundo 2026 — {player.name}
        </footer>
      </div>
    );
  };

  // Render admin panel
  const renderAdmin = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-yellow-300" />
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-amber-100 text-sm">Bolão Copa do Mundo 2026</p>
              </div>
            </div>
            {isAdminAuth && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleReorder}
                  disabled={reorderLoading}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  title="Atualiza a ordem das partidas conforme seed-data.ts, preservando palpites"
                >
                  {reorderLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                  Reordenar Jogos
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setIsAdminAuth(false); setAdminPassword(''); window.location.href = '/'; }}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        {!isAdminAuth ? (
          <Card className="max-w-md mx-auto mt-12">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-amber-600 mx-auto mb-2" />
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>Digite a senha de administrador para continuar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="admin-pass-page">Senha</Label>
                <Input
                  id="admin-pass-page"
                  type="password"
                  placeholder="Senha do administrador"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  className="text-base mt-1"
                />
              </div>
              <Button
                onClick={handleAdminLogin}
                disabled={loading || !adminPassword}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Entrar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Admin tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setAdminTab('bets')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  adminTab === 'bets'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Palpites
              </button>
              <button
                onClick={() => { setAdminTab('phases'); loadAdminPhaseConfig(adminPhaseConfig); }}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  adminTab === 'phases'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-1" />
                Configurar Fases
              </button>
              <button
                onClick={() => { setAdminTab('winners'); loadAdminPhaseWinners(); }}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  adminTab === 'winners'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Award className="h-4 w-4 inline mr-1" />
                Ganhadores
              </button>
            </div>

            {/* Bets tab */}
            {adminTab === 'bets' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-amber-700">{adminData.length}</p>
                      <p className="text-sm text-gray-500">Participantes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-green-700">
                        {adminData.reduce((acc, p) => acc + p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length, 0)}
                      </p>
                      <p className="text-sm text-gray-500">Palpites totais</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-blue-700">
                        {adminData.filter(p => p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length > 0).length}
                      </p>
                      <p className="text-sm text-gray-500">Com palpites</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-red-700">
                        {adminData.filter(p => p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length === 0).length}
                      </p>
                      <p className="text-sm text-gray-500">Sem palpites</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Player bets */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Palpites dos Participantes
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[600px]">
                      <div className="divide-y">
                        {adminData.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            Nenhum participante registrado ainda.
                          </div>
                        ) : (
                          adminData.map((p: any) => {
                            const betCount = p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length;
                            const filledBets = p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null);
                            const betsByRound = [1, 2, 3].map(round =>
                              p.bets
                                .filter((b: any) => b.match.round === round)
                                .sort((a: any, b: any) => a.match.matchNum - b.match.matchNum)
                            );

                            const lastUpdated = filledBets.length > 0
                              ? filledBets.reduce((latest: Date, b: any) => {
                                  const d = new Date(b.updatedAt);
                                  return d > latest ? d : latest;
                                }, new Date(0))
                              : null;

                            return (
                              <div key={p.id} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-semibold text-lg">{p.name}</h3>
                                    <div className="text-sm text-gray-500 space-y-0.5">
                                      <p className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        Registro: {new Date(p.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      {lastUpdated && (
                                        <p className="flex items-center gap-1">
                                          <Clock className="h-3.5 w-3.5" />
                                          Último palpite: {lastUpdated.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      )}
                                      <p>{betCount} palpites</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      {betCount > 0 ? `${betCount} palpites` : 'Sem palpites'}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                      onClick={() => setDeleteTarget({ id: p.id, name: p.name, betCount })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Bets by round */}
                                <div className="space-y-3">
                                  {[1, 2, 3].map(round => (
                                    <div key={round}>
                                      <p className="text-xs font-semibold text-gray-500 mb-1">{ROUND_LABELS[round]}</p>
                                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                                        {betsByRound[round - 1].map((bet: any) => (
                                          <div key={bet.id} className="bg-gray-50 rounded p-1.5 text-center text-xs group relative">
                                            <div className="text-[10px] text-gray-400 truncate">
                                              {bet.match.homeTeam} v {bet.match.awayTeam}
                                            </div>
                                            <div className="font-bold text-gray-800">
                                              {bet.homeScore !== null && bet.awayScore !== null
                                                ? `${bet.homeScore}×${bet.awayScore}`
                                                : '—'}
                                            </div>
                                            {bet.homeScore !== null && bet.awayScore !== null && (
                                              <div className="text-[8px] text-gray-400 mt-0.5">
                                                {new Date(bet.updatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurar Fases Eliminatórias
                  </CardTitle>
                  <CardDescription>
                    Selecione os times para cada jogo das fases eliminatórias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Phase selector */}
                  <div>
                    <Label>Fase</Label>
                    <select
                      value={adminPhaseConfig}
                      onChange={(e) => loadAdminPhaseConfig(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg bg-white text-sm"
                    >
                      {KNOCKOUT_PHASES.map(phase => (
                        <option key={phase.key} value={phase.key}>
                          {phase.label} ({phase.matchCount} jogos)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Match slots */}
                  <div className="space-y-3">
                    {adminPhaseMatches.map((match, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-bold text-gray-500 w-8 shrink-0">J{idx + 1}</span>
                        {/* Home team selector */}
                        <button
                          onClick={() => openTeamPicker(idx, 'home')}
                          className={`flex-1 p-2 rounded border text-left text-sm transition-colors ${
                            match.homeTeam
                              ? 'bg-white border-green-300 hover:border-green-400'
                              : 'bg-gray-100 border-dashed border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {match.homeTeam ? (
                            <span>
                              <span className="font-bold">{match.homeTeam}</span>
                              <span className="text-gray-500 ml-1">({match.homeName})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">Selecione mandante...</span>
                          )}
                        </button>
                        <span className="text-gray-400 font-bold">×</span>
                        {/* Away team selector */}
                        <button
                          onClick={() => openTeamPicker(idx, 'away')}
                          className={`flex-1 p-2 rounded border text-left text-sm transition-colors ${
                            match.awayTeam
                              ? 'bg-white border-green-300 hover:border-green-400'
                              : 'bg-gray-100 border-dashed border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {match.awayTeam ? (
                            <span>
                              <span className="font-bold">{match.awayTeam}</span>
                              <span className="text-gray-500 ml-1">({match.awayName})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">Selecione visitante...</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Save button */}
                  <Button
                    onClick={savePhaseConfig}
                    disabled={adminPhaseSaving}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {adminPhaseSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Configuração da Fase
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Winners tab */}
            {adminTab === 'winners' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Ganhadores das Fases
                  </CardTitle>
                  <CardDescription>
                    Defina o nome do ganhador de cada fase eliminatória
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {KNOCKOUT_PHASES.map(phase => (
                    <div key={phase.key} className="flex items-center gap-3">
                      <Label className="w-40 shrink-0 text-sm font-medium">{phase.label}</Label>
                      <Input
                        placeholder="Nome do ganhador"
                        value={adminPhaseWinners.get(phase.key) || ''}
                        onChange={(e) => setAdminPhaseWinners(prev => new Map(prev).set(phase.key, e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  ))}

                  <Button
                    onClick={savePhaseWinners}
                    disabled={adminWinnerSaving}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
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
            <Input
              placeholder="Buscar time..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full"
            />
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {TEAMS
                .filter(team => {
                  if (!teamSearch) return true;
                  const q = teamSearch.toLowerCase();
                  return team.abbr.toLowerCase().includes(q) || team.name.toLowerCase().includes(q);
                })
                .map(team => (
                  <button
                    key={team.abbr}
                    onClick={() => selectTeam(team)}
                    className="p-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 text-left transition-colors"
                  >
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
              <AlertTriangle className="h-5 w-5" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Tem certeza que deseja deletar <strong>{deleteTarget?.name}</strong> e todos os seus <strong>{deleteTarget?.betCount} palpites</strong>?
                </p>
                <p className="text-red-600 font-medium">
                  Esta ação não pode ser desfeita. O participante perderá sua conta e todos os palpites serão removidos permanentemente.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlayer}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {deleting ? 'Deletando...' : 'Deletar participante'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-auto">
        Painel Administrativo — Bolão Copa do Mundo 2026
      </footer>
    </div>
  );

  // Main render
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  switch (currentPage) {
    case 'bet':
      return renderBet();
    case 'admin':
      return renderAdmin();
    default:
      return renderHome();
  }
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
