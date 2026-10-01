import type { SupportedLanguage } from "./index";

const pt: Record<string, string> = {
  "Workout History": "Histórico de Treinos",
  "Your training timeline, including recovery and lifecycle workouts.": "O seu percurso de treino, incluindo sessões de recuperação e fases do programa.",
  "No workouts yet": "Ainda não existem treinos",
  "Completed workouts and recovery sessions will appear here.": "Os treinos concluídos e as sessões de recuperação aparecerão aqui.",
  "Workout Detail": "Detalhes do Treino", "Back": "Voltar",
  "Week not recorded": "Semana não registada", "Scheduled workout": "Treino programado", "Repeat workout": "Treino repetido",
  "NORMAL": "NORMAL", "REPEAT": "REPETIÇÃO", "PAIN RECOVERY": "RECUPERAÇÃO POR DOR", "VERIFICATION": "VERIFICAÇÃO",
  "DELOAD · FATIGUE": "DESCARGA · FADIGA", "DELOAD · FORM": "DESCARGA · TÉCNICA", "DELOAD · RECOVERY": "DESCARGA · RECUPERAÇÃO", "MAINTENANCE": "MANUTENÇÃO",
  "Guided mobility": "Mobilidade guiada", "Walking": "Caminhada", "Easy cycling": "Ciclismo ligeiro", "Mobility": "Mobilidade", "Other recovery activity": "Outra atividade de recuperação",
  "Completed manually after interruption": "Concluído manualmente após interrupção", "Resumed with manual recovered results": "Retomado com resultados recuperados manualmente", "Resumed after interruption": "Retomado após interrupção",
  "App restart / closed app": "Reinício da aplicação / aplicação fechada", "Extended background interruption": "Interrupção prolongada em segundo plano", "Brief background interruption": "Interrupção breve em segundo plano",
  "Recovered Workout": "Treino Recuperado", "Hide recovery details": "Ocultar detalhes da recuperação", "Recovery details": "Detalhes da recuperação",
  "Recovery method": "Método de recuperação", "Interruption": "Interrupção", "Manual recovered sets": "Séries recuperadas manualmente", "Unusual results confirmed": "Resultados invulgares confirmados", "Excluded from progression": "Excluídos da progressão",
  "Performance Summary": "Resumo do Desempenho", "Total duration": "Duração total", "Time under tension": "Tempo sob tensão", "Completed sets": "Séries concluídas", "Total reps": "Repetições totais", "Exercises": "Exercícios", "Skipped sets": "Séries ignoradas",
  "Started": "Início", "Finished": "Fim", "Main workout": "Treino principal", "Workout reason": "Motivo do treino", "Training mode": "Modo de treino",
  "Recovery & Coaching Context": "Contexto de Recuperação e Coaching", "Reason": "Motivo", "Phase": "Fase", "Target scale": "Escala alvo", "Activity": "Atividade", "Duration": "Duração", "Distance": "Distância", "Notes": "Notas",
  "Main Exercises": "Exercícios Principais", "Sets": "Séries", "completed": "concluídas", "Total Reps": "Repetições Totais", "Time Under Tension": "Tempo Sob Tensão", "Side imbalance": "Desequilíbrio entre lados", "Set": "Série", "Skipped": "Ignorada", "reps": "repetições",
  "Workout Feedback": "Feedback do Treino", "Rating": "Avaliação", "Tags": "Etiquetas", "Not recorded": "Não registada", "None": "Nenhuma", "No comments": "Sem comentários",
  "Dynamic Warm-up": "Aquecimento Dinâmico", "Static Stretch": "Alongamentos Estáticos", "Completed": "Concluídos", "Section skipped": "Secção ignorada", "Yes": "Sim", "No": "Não",
  "Export Workout": "Exportar Treino", "Export the complete workout record to another app or save it externally.": "Exporte o registo completo do treino para outra aplicação ou guarde-o externamente.",
  "Export failed": "Falha na exportação", "The workout could not be exported.": "Não foi possível exportar o treino.", "No workout data found.": "Não foram encontrados dados do treino.", "Unable to read this workout.": "Não foi possível ler este treino.",
  "Program": "Programa", "Focus": "Foco", "Date": "Data", "Recovery activity": "Atividade de recuperação", "Recovery duration": "Duração da recuperação", "Recovery distance": "Distância de recuperação", "Recovery notes": "Notas de recuperação",
  "Main workout duration": "Duração do treino principal", "Total workout duration": "Duração total do treino", "Comment": "Comentário", "Program week": "Semana do programa", "Workout": "Treino", "Recovery history": "Histórico de recuperação", "Method": "Método", "Recovery context": "Contexto de recuperação", "Recovered workout": "Treino recuperado", "Recovery interruption": "Interrupção da recuperação", "Manually recovered sets": "Séries recuperadas manualmente", "Recovered sets excluded from progression": "Séries recuperadas excluídas da progressão",
};

export function localizeHistoryText(language: SupportedLanguage, text: string): string {
  return language === "pt-PT" ? (pt[text] ?? text) : text;
}

export function localizeWeek(language: SupportedLanguage, value: number): string { return language === "pt-PT" ? `Semana ${value}` : `Week ${value}`; }
export function localizeDay(language: SupportedLanguage, value: number): string { return language === "pt-PT" ? `Dia ${value}` : `Day ${value}`; }
export function localizeCount(language: SupportedLanguage, count: number, enOne: string, enMany: string, ptOne: string, ptMany: string): string {
  return `${count} ${language === "pt-PT" ? (count === 1 ? ptOne : ptMany) : (count === 1 ? enOne : enMany)}`;
}
