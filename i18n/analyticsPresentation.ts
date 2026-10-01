import { SupportedLanguage } from "./index";

const pt: Record<string, string> = {
  "Analytics": "Análises", "PROGRESS": "PROGRESSO", "Level 1 - Foundation": "Nível 1 - Fundação", "Level 2 - Growth": "Nível 2 - Crescimento", "Level 3 - Max Hypertrophy": "Nível 3 - Hipertrofia Máxima", "YOUR JOURNEY": "O SEU PERCURSO", "PROGRESS OVERVIEW": "VISÃO GERAL DO PROGRESSO",
  "MATCH OR BEAT": "IGUALAR OU SUPERAR", "EXERCISE PROGRESS": "PROGRESSO DOS EXERCÍCIOS", "RECOVERY": "RECUPERAÇÃO", "TRAINING LOAD": "CARGA DE TREINO",
  "Building your progress view…": "A preparar a visão do seu progresso…", "You are here": "Está aqui", "Back": "Voltar", "Clear": "Sem sinais",
  "Current training picture": "Estado atual do treino", "Based on the selected period": "Com base no período selecionado", "Workouts": "Treinos", "Adherence": "Adesão",
  "Closed program weeks": "Semanas de programa concluídas", "Match or Beat": "Igualar ou Superar", "Avg rating": "Avaliação média", "Out of 5": "Em 5",
  "Graduation readiness": "Preparação para progressão", "Completed program-week evaluations": "Avaliações concluídas das semanas do programa",
  "Progressive overload": "Sobrecarga progressiva", "Eligible Match-or-Beat targets only": "Apenas objetivos elegíveis de Igualar ou Superar",
  "Most trained exercises": "Exercícios mais treinados", "Best performance and current trend": "Melhor desempenho e tendência atual",
  "Recovery & fatigue": "Recuperação e fadiga", "Historical training signals, not medical diagnosis": "Sinais históricos do treino, não um diagnóstico médico",
  "Pain reports": "Registos de dor", "Low energy": "Pouca energia", "Form breakdown": "Perda de técnica", "Deload workouts": "Treinos de descarga",
  "Work completed": "Trabalho realizado", "Volume accumulated in the selected period": "Volume acumulado no período selecionado", "Working sets": "Séries de trabalho",
  "Total reps": "Repetições totais", "Hold time": "Tempo de manutenção", "Time under tension": "Tempo sob tensão",
  "Coach interpretation": "Interpretação do Coach", "Data → interpretation → action": "Dados → interpretação → ação", "NEXT ACTION": "PRÓXIMA AÇÃO",
  "View Coach analysis": "Ver análise do Coach", "View Match-or-Beat details": "Ver detalhes de Igualar ou Superar", "View recovery & fatigue details": "Ver detalhes de recuperação e fadiga",
  "View training load & body-part details": "Ver detalhes da carga de treino e zonas corporais", "Complete workouts to build exercise trends.": "Conclua treinos para criar tendências dos exercícios.",
  "Not enough history": "Histórico insuficiente", "Not enough history yet": "Ainda não existe histórico suficiente", "↑ Improving": "↑ A melhorar", "↓ Declining": "↓ A piorar", "→ Stable": "→ Estável",
  "BODY-PART EXPOSURE": "EXPOSIÇÃO POR ZONA CORPORAL", "Body Part": "Zona corporal", "Body-part analytics": "Análise por zona corporal", "Body-part exposure": "Exposição por zona corporal",
  "Building body-part analytics…": "A preparar a análise por zona corporal…", "Unable to identify the selected body part.": "Não foi possível identificar a zona corporal selecionada.",
  "Set exposures": "Exposições por série", "Share of exposure": "Percentagem da exposição", "Avg sets / workout": "Média de séries / treino", "Contributing exercises": "Exercícios que contribuem",
  "Selected training period": "Período de treino selecionado", "Tap an exercise to open its Exercise Analytics": "Toque num exercício para abrir a respetiva Análise do Exercício",
  "Complete workouts to build body-part exposure history.": "Conclua treinos para criar o histórico de exposição por zona corporal.",
  "COACH ANALYSIS": "ANÁLISE DO COACH", "What your data is saying": "O que os seus dados indicam", "Interpreting your training history…": "A interpretar o seu histórico de treino…",
  "Current interpretation": "Interpretação atual", "What to do next": "O que fazer a seguir", "Action based on the combined evidence": "Ação baseada no conjunto das evidências", "WHY THE COACH SAYS THIS": "PORQUE É QUE O COACH DIZ ISTO",
  "Readiness": "Preparação", "Recovery": "Recuperação", "Consistency": "Consistência", "Exercises": "Exercícios", "Training load": "Carga de treino",
  "EXERCISE ANALYTICS": "ANÁLISE DO EXERCÍCIO", "Building exercise analytics…": "A preparar a análise do exercício…", "No exercise was selected.": "Não foi selecionado nenhum exercício.",
  "Performance": "Desempenho", "Best result across each completed session": "Melhor resultado de cada sessão concluída", "Average": "Média", "Total hold": "Tempo total de manutenção",
  "Sessions": "Sessões", "Frequency": "Frequência", "Progression evidence": "Evidência de progressão", "How this exercise is responding": "Como este exercício está a responder",
  "Eligible targets": "Objetivos elegíveis", "No eligible targets": "Sem objetivos elegíveis", "First set to final set": "Da primeira à última série", "Personal bests": "Recordes pessoais",
  "Avg effort": "Esforço médio", "Effort trend": "Tendência do esforço", "New best session performances": "Novos melhores desempenhos por sessão", "New personal best": "Novo recorde pessoal",
  "Complete more sessions to build personal-best history.": "Conclua mais sessões para criar um histórico de recordes pessoais.", "Recent sessions": "Sessões recentes",
  "Tap a session to open the full workout": "Toque numa sessão para abrir o treino completo", "No sessions for this exercise in the selected period.": "Não existem sessões deste exercício no período selecionado.",
  "↑ Feeling harder": "↑ A parecer mais difícil", "↓ Getting easier": "↓ A parecer mais fácil",
  "Building Match-or-Beat analytics…": "A preparar a análise de Igualar ou Superar…", "Progression Evidence": "Evidência de Progressão", "Overall performance": "Desempenho global",
  "Eligible progression targets in the selected period": "Objetivos de progressão elegíveis no período selecionado", "Successful": "Com sucesso", "Missed": "Não atingidos", "Excluded": "Excluídos",
  "Not counted against success": "Não contam contra o sucesso", "Outcome breakdown": "Distribuição dos resultados", "How eligible targets were classified": "Como foram classificados os objetivos elegíveis",
  "Exceeded": "Superados", "Matched": "Igualados", "By exercise": "Por exercício", "Tap an exercise for its full performance analytics": "Toque num exercício para ver a análise completa do desempenho",
  "No Match-or-Beat evidence is available in this period yet.": "Ainda não existe evidência de Igualar ou Superar neste período.", "Excluded evidence": "Evidência excluída",
  "Why some performances were kept out of progression calculations": "Porque alguns desempenhos foram excluídos dos cálculos de progressão", "Retained in workout history": "Mantido no histórico do treino",
  "No performances were excluded in the selected period.": "Nenhum desempenho foi excluído no período selecionado.", "Recent evidence": "Evidência recente", "Target-by-target progression evidence": "Evidência de progressão objetivo a objetivo",
  "Complete more comparable sets to build Match-or-Beat evidence.": "Conclua mais séries comparáveis para criar evidência de Igualar ou Superar.", "Deload exposure": "Exposição a descarga", "Low workout rating": "Avaliação baixa do treino",
  "Joint discomfort": "Desconforto articular", "Set excluded from progression": "Série excluída da progressão",
  "RECOVERY & FATIGUE": "RECUPERAÇÃO E FADIGA", "Recovery Evidence": "Evidência de Recuperação", "Building recovery analytics…": "A preparar a análise da recuperação…", "Recovery overview": "Visão geral da recuperação",
  "Feedback and recovery signals in the selected period": "Feedback e sinais de recuperação no período selecionado", "Workout rating trend": "Tendência da avaliação dos treinos", "How subjective workout ratings changed over time": "Como as avaliações subjetivas dos treinos evoluíram ao longo do tempo",
  "Recovery signal burden": "Carga de sinais de recuperação", "Lower signal burden over time is interpreted as improving recovery": "Uma redução dos sinais ao longo do tempo é interpretada como melhoria da recuperação",
  "Signal breakdown": "Distribuição dos sinais", "Which recovery/fatigue signals appeared most often": "Quais os sinais de recuperação/fadiga que surgiram com maior frequência", "Historical workout feedback": "Feedback histórico dos treinos",
  "No negative recovery or fatigue signals were recorded in this period.": "Não foram registados sinais negativos de recuperação ou fadiga neste período.", "Recovery phases": "Fases de recuperação", "Deload and verification exposure in this period": "Exposição a descarga e verificação neste período",
  "Verification": "Verificação", "Total signals": "Total de sinais", "Recent workouts": "Treinos recentes", "Tap a workout to see the underlying training record": "Toque num treino para ver o registo de treino correspondente",
  "No feedback tags recorded": "Sem etiquetas de feedback registadas", "No workouts are available in the selected period.": "Não existem treinos disponíveis no período selecionado.", "Normal training": "Treino normal",
  "Fatigue deload": "Descarga por fadiga", "Pain deload": "Descarga por dor", "Form deload": "Descarga por técnica", "Recovery deload": "Descarga de recuperação", "Perfect difficulty": "Dificuldade ideal", "Good pump": "Um bom pump", "Great focus": "Ótima concentração", "Could do more": "Conseguia fazer mais", "Too easy": "Demasiado fácil", "Couldn't finish": "Não conseguiu terminar",
  "Load & Body Parts": "Carga e Zonas Corporais", "Building training-load analytics…": "A preparar a análise da carga de treino…", "Weekly working sets": "Séries de trabalho semanais",
  "Completed sets by training week": "Séries concluídas por semana de treino", "Recorded workout TUT by week": "Tempo sob tensão registado por semana", "Average per workout": "Média por treino", "Completed set exposure from the exercises you performed": "Exposição das séries concluídas nos exercícios realizados",
  "Chest": "Peito", "Shoulders": "Ombros", "Biceps": "Bíceps", "Triceps": "Tríceps", "Core": "Core", "Quads": "Quadríceps", "Hamstrings": "Isquiotibiais", "Glutes": "Glúteos", "Calves": "Gémeos", "Grip": "Agarre",
  "Program started": "Programa iniciado", "Graduation earned": "Progressão conquistada", "Graduated": "Progressão concluída", "Repeat week started": "Repetição da semana iniciada", "Deload recommended": "Descarga recomendada", "Deload started": "Descarga iniciada", "Pain recovery started": "Recuperação por dor iniciada", "Pain recovery triggered": "Recuperação por dor ativada", "Verification started": "Verificação iniciada", "Recovery cycle completed": "Ciclo de recuperação concluído",
  "Building": "Em construção", "Deload": "Descarga", "Blocked": "Bloqueado", "Progressing": "A progredir", "Ready": "Pronto", "Improving": "A melhorar", "Stable": "Estável", "Declining": "A piorar", "Building history": "A criar histórico",
  "ALL": "TUDO", "4W": "4S", "12W": "12S", "1Y": "1A",
  "More completed program-week evaluations are needed.": "São necessárias mais avaliações concluídas das semanas do programa.",
  "Current readiness criteria have been met.": "Os critérios atuais de preparação foram cumpridos.",
  "Current program evaluation is blocking progression.": "A avaliação atual do programa está a bloquear a progressão.",
  "Readiness is still being built in the current program.": "A preparação continua a ser construída no programa atual.",
  "There is not enough eligible progression evidence yet.": "Ainda não existe evidência elegível de progressão suficiente.",
  "Eligible performance evidence is moving upward.": "A evidência de desempenho elegível está a evoluir positivamente.",
  "Recent eligible targets are being met less often.": "Os objetivos elegíveis recentes estão a ser atingidos com menor frequência.",
  "Eligible performance evidence is holding relatively steady.": "A evidência de desempenho elegível mantém-se relativamente estável.",
  "Recovery pattern": "Padrão de recuperação", "Program adherence": "Adesão ao programa", "Exercise trends": "Tendências dos exercícios",
  "No recovery pattern is available yet.": "Ainda não existe um padrão de recuperação disponível.", "Negative training feedback is becoming less frequent.": "O feedback negativo do treino está a tornar-se menos frequente.",
  "Negative training feedback is becoming more frequent.": "O feedback negativo do treino está a tornar-se mais frequente.", "Recovery-related feedback is relatively stable.": "O feedback relacionado com a recuperação está relativamente estável.",
  "Closed program weeks are needed before adherence can be judged.": "São necessárias semanas de programa concluídas antes de se poder avaliar a adesão.",
  "Training consistency is giving the progression engine strong comparable history.": "A consistência do treino está a fornecer ao motor de progressão um histórico comparável sólido.",
  "Inconsistent completion is limiting the reliability of progression evidence.": "A conclusão inconsistente está a limitar a fiabilidade da evidência de progressão.", "Training consistency is usable but still has room to improve.": "A consistência do treino é utilizável, mas ainda pode melhorar.",
  "Exercise-specific trends will appear after more repeated sessions.": "As tendências específicas dos exercícios surgirão após mais sessões repetidas.", "More tracked exercises are improving than declining.": "Há mais exercícios acompanhados a melhorar do que a piorar.",
  "More tracked exercises are declining than improving.": "Há mais exercícios acompanhados a piorar do que a melhorar.", "Exercise trends are mixed or mostly stable.": "As tendências dos exercícios são mistas ou maioritariamente estáveis.",
  "No completed training load exists in this period.": "Não existe carga de treino concluída neste período.",
  "Building your training picture": "A construir o seu panorama de treino", "There is not enough comparable history yet for a strong cross-signal interpretation. The Coach will become more specific as workouts, eligible Match-or-Beat targets and program-week evaluations accumulate.": "Ainda não existe histórico comparável suficiente para uma interpretação sólida entre vários sinais. O Coach tornar-se-á mais específico à medida que se acumularem treinos, objetivos elegíveis de Igualar ou Superar e avaliações das semanas do programa.",
  "Keep completing the program normally and recording workout feedback so the app can build reliable evidence.": "Continue a cumprir o programa normalmente e a registar o feedback dos treinos para que a aplicação possa construir evidência fiável.",
  "Your current program looks ready to progress": "O seu programa atual parece preparado para progredir", "Graduation readiness has been reached without a worsening recovery pattern. Your performance history is providing enough evidence for the Graduation Coach to guide the next program decision.": "A preparação para progressão foi atingida sem agravamento do padrão de recuperação. O seu histórico de desempenho fornece evidência suficiente para o Coach de Progressão orientar a próxima decisão do programa.",
  "Follow the Graduation Coach rather than forcing additional progression outside the program flow.": "Siga o Coach de Progressão em vez de forçar progressão adicional fora do fluxo do programa.",
  "Performance is rising, but recovery signals are worsening": "O desempenho está a subir, mas os sinais de recuperação estão a piorar", "You are meeting progression targets more successfully, but negative workout feedback is becoming more frequent. That combination can mean the current progress is costing more recovery than before.": "Está a cumprir os objetivos de progressão com mais sucesso, mas o feedback negativo dos treinos está a tornar-se mais frequente. Esta combinação pode significar que o progresso atual exige mais recuperação do que antes.",
  "Keep quality high, avoid adding extra work, and follow any deload or recovery guidance the app presents.": "Mantenha a qualidade elevada, evite acrescentar trabalho extra e siga qualquer orientação de descarga ou recuperação apresentada pela aplicação.",
  "Recovery evidence should take priority": "A evidência de recuperação deve ter prioridade", "Performance evidence is not improving while fatigue, pain, form or completion signals are becoming more prominent. The current history supports protecting recovery before pushing progression.": "A evidência de desempenho não está a melhorar, enquanto os sinais de fadiga, dor, técnica ou conclusão se tornam mais evidentes. O histórico atual apoia a proteção da recuperação antes de forçar a progressão.",
  "Use the app's recovery/deload guidance and focus on completing high-quality prescribed work rather than chasing additional volume.": "Use a orientação de recuperação/descarga da aplicação e concentre-se em concluir o trabalho prescrito com qualidade, em vez de procurar volume adicional.",
  "Consistency is the clearest next lever": "A consistência é o próximo fator mais claro", "The available performance and recovery data are harder to interpret confidently because too few scheduled sessions in closed program weeks are being completed.": "Os dados disponíveis de desempenho e recuperação são mais difíceis de interpretar com confiança porque estão a ser concluídas poucas sessões programadas nas semanas de programa encerradas.",
  "Prioritise completing the recommended schedule consistently before changing volume or progression targets.": "Dê prioridade ao cumprimento consistente do plano recomendado antes de alterar o volume ou os objetivos de progressão.",
  "Progress is moving in a sustainable direction": "O progresso está a evoluir numa direção sustentável", "Eligible Match-or-Beat evidence is improving while recovery feedback is stable or improving. That is the pattern we want to see while building toward readiness.": "A evidência elegível de Igualar ou Superar está a melhorar enquanto o feedback de recuperação se mantém estável ou melhora. Este é o padrão desejado enquanto se constrói a preparação.",
  "Continue following the current progression targets and let the program increase difficulty when its readiness criteria are met.": "Continue a seguir os objetivos de progressão atuais e deixe o programa aumentar a dificuldade quando os critérios de preparação forem cumpridos.",
  "Performance has slowed without a clear recovery warning": "O desempenho abrandou sem um aviso claro de recuperação", "Match-or-Beat evidence is declining, but recovery feedback is not worsening. This looks more like a performance plateau or adaptation period than a strong fatigue signal.": "A evidência de Igualar ou Superar está a diminuir, mas o feedback de recuperação não está a piorar. Isto parece mais um patamar de desempenho ou período de adaptação do que um forte sinal de fadiga.",
  "Stay with the prescribed targets, protect technique, and allow more comparable sessions before changing the plan.": "Mantenha os objetivos prescritos, proteja a técnica e permita mais sessões comparáveis antes de alterar o plano.",
  "Your training picture is currently steady": "O seu panorama de treino está atualmente estável", "No single signal is strong enough to justify changing direction. Performance, recovery, consistency and workload should continue to be interpreted together as more history accumulates.": "Nenhum sinal isolado é suficientemente forte para justificar uma mudança de direção. O desempenho, a recuperação, a consistência e a carga de treino devem continuar a ser interpretados em conjunto à medida que o histórico aumenta.",
  "Continue the current program and use the detail screens when you want to inspect the evidence behind this interpretation.": "Continue o programa atual e utilize os ecrãs de detalhe quando quiser analisar a evidência por trás desta interpretação.",
  "Where you are, how you are progressing, and what your training history is telling us.": "Onde está, como está a progredir e o que o seu histórico de treino nos está a indicar.",
  "Major program milestones will appear here as your journey continues.": "Os principais marcos do programa aparecerão aqui à medida que o seu percurso continuar.",
  "Excluded performances stay in workout history but are not counted against Match-or-Beat progression.": "Os desempenhos excluídos permanecem no histórico do treino, mas não contam contra a progressão de Igualar ou Superar.",
  "sessions": "sessões", "sets": "séries", "sec best": "melhor em seg", "reps best": "melhor em reps",
  "Coach Analysis explains patterns in your recorded training history. It does not diagnose injury, illness or medical conditions.": "A Análise do Coach explica padrões no seu histórico de treino registado. Não diagnostica lesões, doenças ou condições médicas.",
  "A deterministic interpretation of performance, recovery, consistency, readiness and workload in the selected period.": "Uma interpretação determinística do desempenho, recuperação, consistência, preparação e carga de treino no período selecionado.",
  "Which exercises contributed completed working-set exposure to this area.": "Que exercícios contribuíram com exposição de séries de trabalho concluídas para esta zona.",
  "Performance, progression evidence and recent training history.": "Desempenho, evidência de progressão e histórico de treino recente.",
  "See which targets were exceeded, matched, missed or deliberately excluded from progression evidence.": "Veja quais os objetivos que foram superados, igualados, não atingidos ou deliberadamente excluídos da evidência de progressão.",
  "Success rate uses only eligible targets. Excluded performances stay in workout history but do not lower Match-or-Beat progression evidence.": "A taxa de sucesso utiliza apenas objetivos elegíveis. Os desempenhos excluídos permanecem no histórico do treino, mas não reduzem a evidência de progressão de Igualar ou Superar.",
  "Historical training signals that help explain workload tolerance and recovery. This is training guidance, not medical diagnosis.": "Sinais históricos do treino que ajudam a explicar a tolerância à carga e a recuperação. Trata-se de orientação de treino, não de diagnóstico médico.",
  "Signal burden counts pain, low-energy, form-breakdown and couldn\"t-finish reports. It is not a medical score.": "A carga de sinais contabiliza registos de dor, pouca energia, perda de técnica e incapacidade de terminar. Não é uma pontuação médica.",
  "Work completed over time and where your training sets are being directed.": "Trabalho realizado ao longo do tempo e zonas para onde são direcionadas as séries de treino.",
  "Target": "Objetivo", "Actual": "Realizado", "Set": "Série", "Rating": "Classificação",
  "A compound set can count toward more than one body part. These are set exposures, not estimated muscle activation or a medical/physiological load score.": "Uma série de um exercício composto pode contar para mais do que uma zona corporal. Estas são exposições por série, não uma estimativa da ativação muscular nem uma pontuação médica/fisiológica de carga.",
};

export function localizeAnalyticsText(language: SupportedLanguage, text: string): string {
  if (language !== "pt-PT" || !text) return text;
  if (pt[text]) return pt[text];
  let value = text;
  value = value.replace(/Current program • Week (\d+)/g, "Programa atual • Semana $1")
    .replace(/\bWeek (\d+)\b/g, "Semana $1")
    .replace(/ • Week (\d+)/g, " • Semana $1")
    .replace(/^(\d+) sessions$/, "$1 sessões")
    .replace(/^(\d+) working sets$/, "$1 séries de trabalho")
    .replace(/^(\d+) improving · (\d+) declining$/, "$1 a melhorar · $2 a piorar")
    .replace(/^Graduated to (.+)$/, "Progressão para $1")
    .replace(/^Workload comes from (\d+) completed workout(s?) in the selected period\.$/, "A carga resulta de $1 treino(s) concluído(s) no período selecionado.")
    .replace(/\bImproving\b/g, "A melhorar").replace(/\bStable\b/g, "Estável").replace(/\bDeclining\b/g, "A piorar")
    .replace(/\bBuilding history\b/g, "A criar histórico").replace(/\bReady\b/g, "Pronto").replace(/\bBuilding\b/g, "Em construção").replace(/\bBlocked\b/g, "Bloqueado").replace(/\bDeload\b/g, "Descarga");
  value = value
    .replace(/Level 1 - Foundation/g, "Nível 1 - Fundação")
    .replace(/Level 2 - Growth/g, "Nível 2 - Crescimento")
    .replace(/Level 3 - Max Hypertrophy/g, "Nível 3 - Hipertrofia Máxima");
  value = value
    .replace(/^(\d+)\/(\d+) eligible targets$/, "$1/$2 objetivos elegíveis")
    .replace(/^(\d+) excluded$/, "$1 excluídos")
    .replace(/^Average workout rating • (\d+) workouts$/, "Classificação média do treino • $1 treinos")
    .replace(/^Normal training • Rating ([\d.—-]+)$/, "Treino normal • Classificação $1")
    .replace(/^Rating ([\d.—-]+)$/, "Classificação $1")
    .replace(/^(\d+) signals?$/, "$1 sinais")
    .replace(/^(\d+) sessions? • (\d+) exercises?$/, "$1 sessões • $2 exercícios")
    .replace(/^(\d+) working sets? could not be assigned to a body-part category\.$/, "$1 séries de trabalho não puderam ser atribuídas a uma zona corporal.");
  return pt[value] ?? value;
}

export function localizeAnalyticsBodyPart(language: SupportedLanguage, bodyPart: string): string {
  if (language !== "pt-PT") return bodyPart;
  const bodyParts: Record<string, string> = {
    Chest: "Peito", Back: "Costas", Shoulders: "Ombros", Biceps: "Bíceps", Triceps: "Tríceps",
    Core: "Core", Quads: "Quadríceps", Hamstrings: "Isquiotibiais", Glutes: "Glúteos", Calves: "Gémeos", Grip: "Agarre",
  };
  return bodyParts[bodyPart] ?? bodyPart;
}
