// Identidade visual das turmas: 10 ícones esportivos + 5 cores.
// Fonte única usada pelo picker (form) e pela exibição (TurmaIcone).

export interface TurmaIconeDef { key: string; label: string; emoji: string }
export interface TurmaCorDef { key: string; label: string; bg: string; swatch: string }

export const TURMA_ICONES: TurmaIconeDef[] = [
  { key: 'whistle',    label: 'Geral',      emoji: '🏅' },
  { key: 'soccer',     label: 'Futebol',    emoji: '⚽' },
  { key: 'volleyball', label: 'Vôlei',      emoji: '🏐' },
  { key: 'basketball', label: 'Basquete',   emoji: '🏀' },
  { key: 'swimming',   label: 'Natação',    emoji: '🏊' },
  { key: 'tennis',     label: 'Tênis',      emoji: '🎾' },
  { key: 'running',    label: 'Corrida',    emoji: '🏃' },
  { key: 'fight',      label: 'Luta',       emoji: '🥊' },
  { key: 'gym',        label: 'Academia',   emoji: '🏋️' },
  { key: 'cycling',    label: 'Ciclismo',   emoji: '🚴' },
]

export const TURMA_CORES: TurmaCorDef[] = [
  { key: 'brand',   label: 'Azul',   bg: 'bg-brand-100 dark:bg-brand-500/20',     swatch: 'bg-brand-600' },
  { key: 'emerald', label: 'Verde',  bg: 'bg-emerald-100 dark:bg-emerald-500/20', swatch: 'bg-emerald-500' },
  { key: 'amber',   label: 'Laranja',bg: 'bg-amber-100 dark:bg-amber-500/20',     swatch: 'bg-amber-500' },
  { key: 'rose',    label: 'Rosa',   bg: 'bg-rose-100 dark:bg-rose-500/20',       swatch: 'bg-rose-500' },
  { key: 'violet',  label: 'Roxo',   bg: 'bg-violet-100 dark:bg-violet-500/20',   swatch: 'bg-violet-500' },
]

export function useTurmaVisual() {
  function iconeEmoji(key?: string | null) {
    return (TURMA_ICONES.find((i) => i.key === key) ?? TURMA_ICONES[0]!).emoji
  }
  function corBg(key?: string | null) {
    return (TURMA_CORES.find((c) => c.key === key) ?? TURMA_CORES[0]!).bg
  }
  return { TURMA_ICONES, TURMA_CORES, iconeEmoji, corBg }
}
