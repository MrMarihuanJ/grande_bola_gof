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
import { Trophy, Save, Check, Users, Shield, Download, Info, Loader2, ChevronDown, ChevronUp, Trash2, Clock, AlertTriangle, Star, PartyPopper, Settings, Award, Medal, X } from 'lucide-react';

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
  penaltyWinner: string | null; // "home" or "away" — only for knockout phases when tied
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

// Phase configuration constants — CORRECTED match counts
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

// Winner positions per phase — 1º, 2º, 3º lugar for EACH phase
const WINNER_POSITIONS = [
  { suffix: '_1', label: '1º Lugar', emoji: '🥇' },
  { suffix: '_2', label: '2º Lugar', emoji: '🥈' },
  { suffix: '_3', label: '3º Lugar', emoji: '🥉' },
];

// Phases that can have winners (all phases)
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

// Teams for admin team selector — CORRECTED: removed SAL/SEM, fixed CDM
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

  // Betting page sub-tab: 'bets' or 'winners'
  const [betSubTab, setBetSubTab] = useState<'bets' | 'winners'>('bets');

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

  // Read URL params
  const adminParam = searchParams.get('admin');
  const [currentPage, setCurrentPage] = useState<'home' | 'bet' | 'admin'>(
    adminParam !== null ? 'admin' : 'home'
  );

  // Auto-migrate + fetch ALL matches on initial load
  // Migration must complete BEFORE any queries that touch the Bet table
  useEffect(() => {
    const initApp = async () => {
      // Step 1: Auto-migrate (ensure all columns exist)
      try {
        await fetch('/api/migrate');
      } catch (e) {
        console.warn('Auto-migration failed (non-critical, server-side migration should handle it):', e);
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

      // Step 3: Fetch phase winners (can run after matches, doesn't depend on Bet)
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
        toast({ title: 'Banco configurado!', description: `Tabelas criadas e ${data.counts?.matches || 0} jogos inseridos.` });
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
        if (data.isNew) {
          toast({ title: 'Bem-vindo ao bolão!', description: `Conta criada com sucesso. Bons palpites, ${data.name}!` });
        } else {
          toast({ title: `Bem-vindo de volta, ${data.name}!`, description: 'Seus palpites anteriores foram carregados.' });
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

    const betList: { matchId: string; homeScore: number | null; awayScore: number | null }[] = [];
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
      toast({ title: 'Nenhum palpite', description: 'Preencha pelo menos um placar antes de salvar.', variant: 'destructive' });
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
        toast({ title: 'Palpites salvos!', description: data.message });
        setHasChanges(false);

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

        // Auto-clear penaltyWinner if scores are no longer tied (knockout phases only)
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
      // penaltyWinner
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
        const map = new Map<string, string>();
        data.forEach((w) => map.set(w.phase, w.winnerName));
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
        toast({ title: 'Ganhador removido!', description: `Ganhador de "${getWinnerLabel(phaseKey)}" foi removido.` });
        // Update local state
        setAdminPhaseWinners(prev => {
          const newMap = new Map(prev);
          newMap.delete(phaseKey);
          return newMap;
        });
        // Also refresh public winners
        const winnersRes = await fetch('/api/phase-winners');
        if (winnersRes.ok) {
          const data: PhaseWinnerData[] = await winnersRes.json();
          const map = new Map<string, string>();
          data.forEach((w) => map.set(w.phase, w.winnerName));
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

  // Reordenar partidas sem perder palpites
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

  // Load phase matches for admin config — FIX: pad with empty slots if existing matches < expected
  const loadAdminPhaseConfig = async (phase: string) => {
    setAdminPhaseConfig(phase);
    try {
      const res = await fetch(`/api/admin/phase-matches?phase=${phase}`);
      if (res.ok) {
        const data = await res.json();
        const phaseConfig = KNOCKOUT_PHASES.find(p => p.key === phase);
        const expectedCount = phaseConfig?.matchCount || 1;

        if (data.length > 0) {
          // Map existing matches
          const existing: typeof adminPhaseMatches = data.map((m: any) => ({
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeName: m.homeName,
            awayName: m.awayName,
            matchNum: m.matchNum,
          }));

          // If existing count is less than expected, pad with empty slots
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
          // Initialize with empty slots
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
      // Only send filled matches (skip empty slots)
      const filledMatches = adminPhaseMatches.filter(m => m.homeTeam && m.awayTeam);

      const res = await fetch(`/api/admin/phase-matches?password=${encodeURIComponent(adminPassword)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: adminPhaseConfig, matches: filledMatches }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Fase configurada!', description: data.message });
        // Clear cache and re-fetch
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
      for (const [phase, winnerName] of entries) {
        if (winnerName.trim()) {
          // Save non-empty winner
          const res = await fetch(`/api/admin/phase-winner?password=${encodeURIComponent(adminPassword)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phase, winnerName: winnerName.trim() }),
          });
          if (!res.ok) {
            const error = await res.json();
            toast({ title: 'Erro ao salvar ganhador', description: error.error || 'Tente novamente.', variant: 'destructive' });
            return;
          }
        } else {
          // Delete empty winner
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
      toast({ title: 'Ganhadores salvos!', description: 'Todos os ganhadores foram atualizados.' });
      // Refresh public winners
      const winnersRes = await fetch('/api/phase-winners');
      if (winnersRes.ok) {
        const data: PhaseWinnerData[] = await winnersRes.json();
        const map = new Map<string, string>();
        data.forEach((w) => map.set(w.phase, w.winnerName));
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

  // Handle "Ver Ganhador" click — now works for all phases
  const handleViewWinner = (phaseKey: string) => {
    // For the "Ver Ganhador" button on match tabs, show the 1st place winner
    const winnerKey = `${phaseKey}_1`;
    const winner = phaseWinners.get(winnerKey);
    setWinnerModal({ phase: phaseKey, winnerName: winner || null });
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
      <header className="bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="h-10 w-10 text-yellow-300" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Copa do Mundo 2026</h1>
            <Trophy className="h-10 w-10 text-yellow-300" />
          </div>
          <p className="text-lg text-green-100 font-medium">Bolão de Palpites — Faça seus palpites e torça!</p>
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
                  className="bg-red-600 hover:bg-red-700 text-white px-6">
                  {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Configurar Banco'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-emerald-200 bg-emerald-50/50">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                  maxLength={100} className="text-base" />
              </div>
              <Button onClick={handleLogin} disabled={loading || !playerName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-auto">
        Bolão Copa do Mundo 2026 — Bons palpites!
        <a href="/?admin" className="ml-2 text-gray-300 hover:text-gray-400 text-xs">⚙</a>
      </footer>
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
      <div key={match.id} className={`px-4 py-3 ${isFilled ? 'bg-green-50/50' : ''}`}>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex-1 text-right">
            <span className="font-bold text-sm md:text-base text-gray-800">{match.homeTeam}</span>
            <span className="hidden md:inline text-xs text-gray-500 ml-1">({match.homeName})</span>
            <span className="md:hidden block text-xs text-gray-500">{match.homeName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Input type="text" inputMode="numeric" pattern="[0-9]*" min={0} max={30}
              className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 focus:border-green-500 focus:ring-green-500"
              placeholder="-" value={bet.homeScore}
              onChange={(e) => updateBet(match.id, 'homeScore', e.target.value, match.phase)}
              aria-label={`Placar ${match.homeTeam}`} />
            <span className="text-lg font-bold text-gray-400">×</span>
            <Input type="text" inputMode="numeric" pattern="[0-9]*" min={0} max={30}
              className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-200 focus:border-green-500 focus:ring-green-500"
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
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-[8px] text-gray-400">
                {new Date(savedBets.get(match.id)?.updatedAt || '').toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
        {/* Penalty winner selector — only for knockout phases when scores are tied */}
        {showPenaltyField && (
          <div className="mt-2 flex items-center gap-2 justify-center">
            <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">Pênaltis:</span>
            <button
              onClick={() => updateBet(match.id, 'penaltyWinner', 'home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                bet.penaltyWinner === 'home'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
              }`}
            >
              {match.homeTeam} 🏆
            </button>
            <span className="text-gray-400 text-xs">ou</span>
            <button
              onClick={() => updateBet(match.id, 'penaltyWinner', 'away')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                bet.penaltyWinner === 'away'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
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
                <Button variant="outline" size="sm"
                  onClick={() => { setPlayer(null); setBets(new Map()); setSavedBets(new Map()); setCurrentPage('home'); }}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs">
                  Sair
                </Button>
              </div>
            </div>
            <div className="mt-3 bg-green-800/40 rounded-full h-2">
              <div className="bg-yellow-300 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalMatches > 0 ? Math.round((totalFilled / totalMatches) * 100) : 0}%` }} />
            </div>
            <p className="text-xs text-green-200 mt-1">
              {totalFilled} de {totalMatches} palpites preenchidos ({totalMatches > 0 ? Math.round((totalFilled / totalMatches) * 100) : 0}%)
            </p>
          </div>
        </header>

        {/* Sub-tabs: Palpites / Ganhadores */}
        <div className="bg-emerald-900 sticky top-[104px] z-10 shadow-md">
          <div className="max-w-4xl mx-auto flex">
            <button onClick={() => setBetSubTab('bets')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-center transition-colors ${
                betSubTab === 'bets' ? 'bg-yellow-400 text-emerald-900' : 'text-green-200 hover:bg-emerald-800/50'}`}>
              <Save className="h-4 w-4 inline mr-1" /> Palpites
            </button>
            <button onClick={() => setBetSubTab('winners')}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-center transition-colors ${
                betSubTab === 'winners' ? 'bg-yellow-400 text-emerald-900' : 'text-green-200 hover:bg-emerald-800/50'}`}>
              <Award className="h-4 w-4 inline mr-1" /> Ganhadores
            </button>
          </div>
        </div>

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

          {/* === WINNERS TAB === */}
          {betSubTab === 'winners' && (
            <div className="space-y-3">
              {PHASES_FOR_WINNERS.map(phase => (
                <Card key={phase.key} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2">
                    <span className="font-bold text-sm">{phase.label}</span>
                  </div>
                  <CardContent className="p-0 divide-y divide-gray-100">
                    {WINNER_POSITIONS.map(pos => {
                      const winnerKey = `${phase.key}${pos.suffix}`;
                      const winner = phaseWinners.get(winnerKey);
                      return (
                        <div key={winnerKey}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            setWinnerModal({ phase: winnerKey, winnerName: winner || null });
                            if (winner) playAudio('/winner.mp3');
                            else playAudio('/no_winner_to_show.mp3');
                          }}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{pos.emoji}</span>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{pos.label}</p>
                              {winner ? (
                                <p className="text-xs text-emerald-600 font-medium">{winner}</p>
                              ) : (
                                <p className="text-xs text-gray-400">Ainda não definido</p>
                              )}
                            </div>
                          </div>
                          <Badge variant={winner ? 'default' : 'secondary'} className={winner ? 'bg-emerald-600' : ''}>
                            {winner ? 'Ver' : '???'}
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
              <div className="bg-emerald-800/90 rounded-lg shadow-md p-2">
                <div className="flex overflow-x-auto scrollbar-hide gap-1">
                  {PHASES.map(phase => {
                    const hasMatches = phase.key === 'groups' || (phaseMatches.has(phase.key) && (phaseMatches.get(phase.key)?.length || 0) > 0);
                    const isActive = activePhase === phase.key;
                    return (
                      <button key={phase.key} onClick={() => handlePhaseTabClick(phase.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          isActive ? 'bg-yellow-400 text-emerald-900 shadow-md'
                            : hasMatches ? 'bg-emerald-700/50 text-green-100 hover:bg-emerald-600/50'
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
              <Card className="border-blue-200 bg-blue-50/50">
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
                      <Card key={round} className="overflow-hidden">
                        <button onClick={() => toggleRound(round)}
                          className="w-full text-left bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 flex items-center justify-between hover:from-emerald-700 hover:to-green-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-yellow-300 text-emerald-900 font-bold">{ROUND_LABELS[round]}</Badge>
                            <span className="text-sm text-green-100">{roundFilled}/{roundMatches.length} palpites</span>
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

                  {/* Ver Ganhador button for GROUPS phase too */}
                  <Button onClick={() => handleViewWinner('groups')}
                    variant="outline"
                    className="w-full h-12 text-base font-bold border-yellow-400 text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50">
                    <Star className="h-5 w-5 mr-2" /> Ver Ganhador da 1ª Fase
                  </Button>
                </>
              ) : (
                <>
                  {phaseLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : currentPhaseMatches.length === 0 ? (
                    <Card className="border-gray-200">
                      <CardContent className="py-8 text-center text-gray-500">
                        Nenhum jogo configurado para esta fase ainda. Aguarde o administrador configurar os confrontos.
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
                  <Button onClick={() => handleViewWinner(activePhase)}
                    variant="outline"
                    className="w-full h-12 text-base font-bold border-yellow-400 text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50">
                    <Star className="h-5 w-5 mr-2" /> Ver Ganhador
                  </Button>
                </>
              )}

              {/* Save button */}
              <div className="sticky bottom-4 z-10">
                <Button onClick={handleSave} disabled={loading}
                  className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl rounded-xl">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Salvar Palpites
                  {hasChanges && <span className="ml-2 text-yellow-200">●</span>}
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
                  <div className="text-5xl font-black text-emerald-700 animate-bounce">🏆</div>
                  <p className="text-2xl font-bold text-emerald-800">{winnerModal.winnerName}</p>
                  <p className="text-sm text-gray-500">Parabéns ao ganhador!</p>
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
              <Button onClick={() => setWinnerModal(null)} className="bg-emerald-600 hover:bg-emerald-700">Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <footer className="bg-gray-50 border-t py-4 text-center text-sm text-gray-500 mt-4">
          Bolão Copa do Mundo 2026 — {player.name}
        </footer>
      </div>
    );
  };

  // Render admin panel
  const renderAdmin = () => (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex flex-col">
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
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" onClick={handleReorder} disabled={reorderLoading}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  {reorderLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                  Reordenar Jogos
                </Button>
                <Button variant="outline" onClick={handleExport}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Download className="h-4 w-4 mr-2" /> Exportar CSV
                </Button>
                <Button variant="outline"
                  onClick={() => { setIsAdminAuth(false); setAdminPassword(''); window.location.href = '/'; }}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20">
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
                <Input id="admin-pass-page" type="password" placeholder="Senha do administrador"
                  value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} className="text-base mt-1" />
              </div>
              <Button onClick={handleAdminLogin} disabled={loading || !adminPassword}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Entrar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Admin tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setAdminTab('bets')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  adminTab === 'bets' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'}`}>
                <Users className="h-4 w-4 inline mr-1" /> Palpites
              </button>
              <button onClick={() => { setAdminTab('phases'); loadAdminPhaseConfig(adminPhaseConfig); }}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  adminTab === 'phases' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'}`}>
                <Settings className="h-4 w-4 inline mr-1" /> Configurar Fases
              </button>
              <button onClick={() => { setAdminTab('winners'); loadAdminPhaseWinners(); }}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  adminTab === 'winners' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'}`}>
                <Award className="h-4 w-4 inline mr-1" /> Ganhadores
              </button>
            </div>

            {/* Bets tab */}
            {adminTab === 'bets' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-amber-700">{adminData.length}</p>
                    <p className="text-sm text-gray-500">Participantes</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-green-700">
                      {adminData.reduce((acc, p) => acc + p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length, 0)}
                    </p>
                    <p className="text-sm text-gray-500">Palpites totais</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-blue-700">
                      {adminData.filter(p => p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length > 0).length}
                    </p>
                    <p className="text-sm text-gray-500">Com palpites</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-red-700">
                      {adminData.filter(p => p.bets.filter((b: any) => b.homeScore !== null || b.awayScore !== null).length === 0).length}
                    </p>
                    <p className="text-sm text-gray-500">Sem palpites</p>
                  </CardContent></Card>
                </div>

                <Card>
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
                          <div className="p-8 text-center text-gray-500">Nenhum participante registrado ainda.</div>
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
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
                                          <div key={bet.id} className="bg-gray-50 rounded p-1.5 text-center text-xs">
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
                                  {/* Knockout phase bets */}
                                  {betsByPhase.map(group => (
                                    <div key={group.key}>
                                      <p className="text-xs font-semibold text-amber-700 mb-1">{group.label}</p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
                                        {group.bets.map((bet: any) => (
                                          <div key={bet.id} className="bg-amber-50 rounded p-1.5 text-center text-xs">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Configurar Fases Eliminatórias</CardTitle>
                  <CardDescription>Selecione os times para cada jogo das fases eliminatórias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Fase</Label>
                    <select value={adminPhaseConfig} onChange={(e) => loadAdminPhaseConfig(e.target.value)}
                      className="w-full mt-1 p-2 border rounded-lg bg-white text-sm">
                      {KNOCKOUT_PHASES.map(phase => (
                        <option key={phase.key} value={phase.key}>
                          {phase.label} ({phase.matchCount} jogos, {phase.matchSlots} times)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {adminPhaseMatches.map((match, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-bold text-gray-500 w-8 shrink-0">J{idx + 1}</span>
                        <button onClick={() => openTeamPicker(idx, 'home')}
                          className={`flex-1 p-2 rounded border text-left text-sm transition-colors ${
                            match.homeTeam ? 'bg-white border-green-300 hover:border-green-400'
                              : 'bg-gray-100 border-dashed border-gray-300 hover:border-gray-400'}`}>
                          {match.homeTeam ? (
                            <span><span className="font-bold">{match.homeTeam}</span><span className="text-gray-500 ml-1">({match.homeName})</span></span>
                          ) : (
                            <span className="text-gray-400">Selecione mandante...</span>
                          )}
                        </button>
                        <span className="text-gray-400 font-bold">×</span>
                        <button onClick={() => openTeamPicker(idx, 'away')}
                          className={`flex-1 p-2 rounded border text-left text-sm transition-colors ${
                            match.awayTeam ? 'bg-white border-green-300 hover:border-green-400'
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
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    {adminPhaseSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Configuração da Fase
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Winners tab — restructured: 1º/2º/3º per phase + delete button */}
            {adminTab === 'winners' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Ganhadores</CardTitle>
                  <CardDescription>Defina o 1º, 2º e 3º lugar de cada fase. Clique no ✕ para remover um ganhador.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {PHASES_FOR_WINNERS.map(phase => (
                    <div key={phase.key} className="space-y-2">
                      <h4 className="font-semibold text-sm text-amber-800 border-b border-amber-200 pb-1">{phase.label}</h4>
                      {WINNER_POSITIONS.map(pos => {
                        const winnerKey = `${phase.key}${pos.suffix}`;
                        const currentValue = adminPhaseWinners.get(winnerKey) || '';
                        return (
                          <div key={winnerKey} className="flex items-center gap-2">
                            <span className="text-lg w-6 text-center shrink-0">{pos.emoji}</span>
                            <Label className="w-20 shrink-0 text-xs font-medium">{pos.label}</Label>
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                placeholder="Nome do ganhador"
                                value={currentValue}
                                onChange={(e) => setAdminPhaseWinners(prev => new Map(prev).set(winnerKey, e.target.value))}
                                className="flex-1 text-sm"
                              />
                              {currentValue && (
                                <Button variant="ghost" size="sm"
                                  onClick={() => deleteWinner(winnerKey)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
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
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white">
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
                  className="p-2 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 text-left transition-colors">
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
                <p className="text-red-600 font-medium">Esta ação não pode ser desfeita.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {deleting ? 'Deletando...' : 'Deletar participante'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    case 'bet': return renderBet();
    case 'admin': return renderAdmin();
    default: return renderHome();
  }
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
