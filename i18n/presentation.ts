import type { SupportedLanguage } from "./index";

const ptExerciseNames: Record<string, string> = {
  "jumping-jacks": "Saltos com abertura de braços e pernas",
  "standing-knee-tucks": "Elevação de joelhos em pé",
  "leg-swings": "Balanços de perna",
  "side-lunges": "Afundos laterais",
  "butt-kicks": "Calcanhares aos glúteos",
  "arm-circles-normal-clockwise": "Círculos de braços (sentido horário)",
  "arm-circles-normal-counter": "Círculos de braços (sentido anti-horário)",
  "arm-circles-large-clockwise": "Círculos amplos de braços (sentido horário)",
  "arm-circles-large-counter": "Círculos amplos de braços (sentido anti-horário)",
  "seated-back-twist": "Rotação do tronco sentado",
  "quad-stretch": "Alongamento dos quadríceps",
  "hip-abductor-stretch": "Alongamento dos abdutores da anca",
  "standing-forward-bend": "Flexão do tronco em pé",
  "lat-stretches": "Alongamento dos dorsais",
  "glute-stretches": "Alongamento dos glúteos",
  "calf-stretches": "Alongamento dos gémeos",
  "lying-abdominal-stretches": "Alongamento abdominal deitado",
  "neck-side-bend": "Inclinação lateral do pescoço",
  "shoulder-stretch": "Alongamento dos ombros",
  "triceps-stretch": "Alongamento dos tríceps",
  "incline-push-ups": "Flexões inclinadas",
  "standard-push-ups": "Flexões padrão",
  "pike-push-ups": "Flexões em pike",
  "bench-dips": "Fundos no banco",
  "body-weight-squats-slow": "Agachamentos lentos com peso corporal",
  "reverse-lunges": "Afundos para trás",
  "hip-thrusts": "Elevações da anca",
  "standing-calf-raises-slow": "Elevações lentas dos gémeos em pé",
  "inverted-rows-bent-knees": "Remadas invertidas",
  "towel-curls": "Curls com toalha",
  "scapular-pulls": "Trações escapulares",
  "push-ups-slow-negatives": "Flexões",
  "hollow-body-hold": "Isometria hollow body",
  "plank": "Prancha",
  "decline-push-ups": "Flexões declinadas",
  "pseudo-planche-push-ups": "Flexões pseudo planche",
  "elevated-pike-push-ups": "Flexões em pike elevadas",
  "diamond-push-ups": "Flexões diamante",
  "inverted-rows-straight-legs": "Remadas invertidas",
  "chin-ups": "Elevações com pega supinada",
  "bulgarian-split-squats": "Agachamentos búlgaros",
  "tempo-squats": "Agachamentos com cadência",
  "single-leg-hip-thrusts": "Elevações da anca unilaterais",
  "single-leg-hip-thrusts-left": "Elevação da anca unilateral (esquerda)",
  "single-leg-hip-thrusts-right": "Elevação da anca unilateral (direita)",
  "single-leg-calf-raises": "Elevações dos gémeos unilaterais",
  "single-leg-calf-raises-left": "Elevação dos gémeos unilateral (esquerda)",
  "single-leg-calf-raises-right": "Elevação dos gémeos unilateral (direita)",
  "push-ups": "Flexões",
  "inverted-rows": "Remadas invertidas",
  "pike-holds": "Isometria em pike",
  "walking-lunges": "Afundos em deslocamento",
  "wall-sit": "Agachamento isométrico na parede",
  "archer-push-ups": "Flexões arqueiro",
  "deep-push-ups": "Flexões profundas / nas argolas",
  "handstand-push-up": "Flexão em pino",
  "triceps-extensions": "Extensões de tríceps",
  "pull-ups": "Elevações na barra",
  "archer-rows": "Remadas arqueiro",
  "ring-bicep-curls": "Curls de bíceps nas argolas",
  "dead-hangs": "Suspensão passiva na barra",
  "pistol-negatives": "Agachamentos pistol negativos",
  "nordic-hamstring-negatives": "Nórdicos negativos para isquiotibiais",
  "ring-push-up": "Flexões nas argolas",
  "step-ups": "Subidas para banco",
  "close-grip-push-ups": "Flexões com pega fechada",
  "bodyweight-good-mornings": "Good mornings com peso corporal",
  "reverse-snow-angels": "Anjos invertidos",
  "dead-bug": "Dead bug",
  "hamstring-walkouts": "Walkouts de isquiotibiais",
  "ring-triceps-extensions": "Extensões de tríceps nas argolas",
  "ring-face-pulls": "Face pulls nas argolas",
};

const ptFocus: Record<string, string> = {
  push: "Empurrar", pull: "Puxar", legs: "Pernas", full: "Corpo inteiro",
  "full / core": "Corpo inteiro / Core", core: "Core",
  "lower body": "Membros Inferiores", "upper body": "Membros Superiores", "volume day": "Volume",
};

export function localizeExerciseName(language: SupportedLanguage, exerciseId: string | undefined, fallback: string): string {
  if (language !== "pt-PT" || !exerciseId) return fallback;
  return ptExerciseNames[exerciseId] ?? fallback;
}

export function localizeWorkoutTitle(language: SupportedLanguage, title: string): string {
  if (language !== "pt-PT") return title;
  const clean = title.replace(/ Routine$/i, "");
  const programTitles: Record<string, string> = {
    "Level 1 - Foundation": "Nível 1 - Fundação",
    "Level 2 - Growth": "Nível 2 - Crescimento",
    "Level 3 - Max Hypertrophy": "Nível 3 - Hipertrofia Máxima",
  };
  if (programTitles[clean]) return programTitles[clean];
  if (/^Dynamic (Stretching|Stretches|Warm-up|Warm-ups)$/i.test(clean)) return "Alongamentos dinâmicos";
  if (/^Static (Stretching|Stretches)$/i.test(clean)) return "Alongamentos estáticos";
  const match = clean.match(/^Day\s*(\d+)\s*[-–—]\s*(.+)$/i);
  if (match) return `Dia ${match[1]} - ${ptFocus[match[2].trim().toLowerCase()] ?? match[2]}`;
  return title;
}

export function localizeHypertrophyLevel(language: SupportedLanguage, label: string): string {
  if (language !== "pt-PT") return label;
  return ({ "Very Low": "Muito baixa", Low: "Baixa", Moderate: "Moderada", High: "Alta", Extreme: "Extrema" } as Record<string,string>)[label] ?? label;
}

export function localizeExerciseType(language: SupportedLanguage, type: string): string {
  if (language !== "pt-PT") return type;
  return ({ reps: "Repetições", tempo: "Cadência", hold: "Isometria", time: "Tempo" } as Record<string,string>)[type.toLowerCase()] ?? type;
}

const ptUiText: Record<string, string> = {
  "READY": "PRONTO", "PROGRESSING": "A PROGREDIR", "CAUTION": "ATENÇÃO", "RECOVER": "RECUPERAR",
  "BUILD RHYTHM": "CRIAR RITMO", "PLATEAU": "PLATÔ", "ON TRACK": "NO BOM CAMINHO", "BUILDING": "A CONSTRUIR",
  "Improving": "A melhorar", "Stable": "Estável", "Needs attention": "Requer atenção", "Building": "A construir",
  "REST PERIOD": "PERÍODO DE DESCANSO", "RECOVERY READY": "RECUPERAÇÃO DISPONÍVEL",
  "CURRENT PROGRAM": "PROGRAMA ATUAL", "this week": "esta semana", "MATCH OR BEAT": "MATCH OR BEAT",
  "RECOVERY": "RECUPERAÇÃO", "View Progress ›": "Ver progresso ›",
  "Program Recommended": "Recomendado pelo Programa", "Balanced Recovery": "Recuperação Equilibrada", "Extra Flexibility": "Flexibilidade Extra",
  "Building your training picture": "A construir o seu perfil de treino",
  "Your training picture is currently steady": "O seu perfil de treino está atualmente estável",
  "Exercise not found": "Exercício não encontrado", "Go back": "Voltar", "‹ Back": "‹ Voltar",
  "REST BEFORE NEXT EXERCISE": "DESCANSO ANTES DO PRÓXIMO EXERCÍCIO", "REST BEFORE NEXT SET": "DESCANSO ANTES DA PRÓXIMA SÉRIE", "REST COMPLETE": "DESCANSO CONCLUÍDO",
  "Up next": "A seguir", "Current exercise": "Exercício atual", "GO!": "VAI!",
  "Description": "Descrição", "Category": "Categoria", "Muscles Worked": "Músculos trabalhados", "Primary": "Principais", "Secondary": "Secundários",
  "Difficulty": "Dificuldade", "Hypertrophy Effectiveness": "Eficácia para hipertrofia", "How to Perform": "Como executar", "Watch Video": "Ver vídeo", "Open Video": "Abrir vídeo", "Safety": "Segurança",
  "Match or Beat": "Igualar ou Superar", "Side": "Lado", "Next Side...": "Próximo lado...", "Get Ready...": "Prepare-se...", "Current": "Atual",
  "cardio": "cardio", "core": "core", "hypertrophy": "hipertrofia", "legs": "pernas", "mobility": "mobilidade", "stability": "estabilidade", "strength": "força", "stretch": "alongamento", "warmup": "aquecimento",
  "abs": "abdominais", "achilles tendon": "tendão de Aquiles", "adductors": "adutores", "ankle stabilizers": "estabilizadores do tornozelo", "arms": "braços", "back": "costas", "biceps": "bíceps", "calves": "gémeos", "chest": "peitoral", "forearms": "antebraços", "full body": "corpo inteiro", "glutes": "glúteos", "hamstrings": "isquiotibiais", "hip abductors": "abdutores da anca", "hip flexors": "flexores da anca", "hip rotators": "rotadores da anca", "lats": "dorsais", "lower back": "zona lombar", "neck": "pescoço", "obliques": "oblíquos", "quadriceps": "quadríceps", "quads": "quadríceps", "rear shoulders": "deltoides posteriores", "shoulders": "ombros", "trapezius": "trapézio", "triceps": "tríceps", "upper back": "parte superior das costas", "upper chest": "peitoral superior",
  "TECHNIQUE HOLD": "PAUSA POR TÉCNICA", "Give Your Form Another Week": "Dê mais uma semana à sua técnica", "Your movement quality is telling us that progressing the level now would be premature.": "A qualidade do seu movimento indica que avançar de nível agora seria prematuro.", "Repeat this training week at the current level. If form breakdown keeps recurring, the Adaptive Coach can escalate the next step to a reduced-load deload before verification.": "Repita esta semana de treino no nível atual. Se a deterioração da técnica continuar a ocorrer, o Coach Adaptativo pode avançar para uma descarga com carga reduzida antes da verificação.",
  "LOW ENERGY": "POUCA ENERGIA", "Recovery Needs More Time": "A recuperação precisa de mais tempo", "Your latest week shows that recovery is limiting progression right now.": "A última semana mostra que a recuperação está atualmente a limitar a progressão.", "Repeat the week instead of forcing the next level. If fatigue continues to accumulate to the Adaptive Coach threshold, the app will move you into the reduced-load deload and verification cycle.": "Repita a semana em vez de forçar o nível seguinte. Se a fadiga continuar a acumular-se até ao limiar do Coach Adaptativo, a aplicação irá encaminhá-lo para o ciclo de descarga com carga reduzida e verificação.",
  "PROGRESSION HOLD": "PROGRESSÃO EM PAUSA", "One More Week at This Level": "Mais uma semana neste nível", "Your Match-or-Beat evidence is not yet strong enough to support progression.": "A evidência de Igualar ou Superar ainda não é suficientemente forte para suportar a progressão.", "Repeat the week and use the existing targets as your next opportunity to reconfirm progression readiness.": "Repita a semana e utilize os objetivos existentes como a próxima oportunidade para voltar a confirmar a prontidão para progredir.",
  "REPEAT WEEK": "REPETIR SEMANA", "More Time at This Level": "Mais tempo neste nível", "The current progression requirements have not all been satisfied.": "Nem todos os requisitos atuais de progressão foram cumpridos.", "Repeat the week and let the next full week of evidence determine whether progression is ready.": "Repita a semana e deixe que a próxima semana completa de evidência determine se a progressão está pronta.",
  "CURRENT LEVEL": "NÍVEL ATUAL", "NEXT PHASE": "PRÓXIMA FASE", "Repeat Training Week": "Repetir semana de treino", "Progression remains on hold. Repeating is normal training; a deload is introduced only when the recovery/form thresholds require it.": "A progressão permanece em pausa. Repetir é treino normal; uma descarga só é introduzida quando os limiares de recuperação ou técnica o exigem.",
  "VOLUME\nREVIEW": "REVISÃO DO\nVOLUME", "VOLUME\nREADY": "VOLUME\nDISPONÍVEL", "Review This Week’s Volume Choices": "Rever as escolhas de volume desta semana", "You’re Ready for More Volume": "Está preparado para mais volume",
  "Before this training week closes, review every adaptive-volume offer you earned. You can change any earlier choice one last time.": "Antes de terminar esta semana de treino, reveja todas as propostas de volume adaptativo que obteve. Pode alterar qualquer escolha anterior uma última vez.", "Your recent Match-or-Beat performance and workout feedback suggest that a small increase in training volume is appropriate.": "O seu desempenho recente em Igualar ou Superar e o feedback dos treinos sugerem que um pequeno aumento do volume de treino é adequado.",
  "These are all of the volume changes I offered during this week. Checked items are your current choices. Uncheck or select anything you want to change before we continue.": "Estas são todas as alterações de volume propostas durante esta semana. Os itens assinalados são as suas escolhas atuais. Desmarque ou selecione o que pretender alterar antes de continuar.", "Here are all of the adaptive-volume options earned so far this week. Checked items are currently selected. You can revise earlier choices whenever I return with new evidence.": "Estas são todas as opções de volume adaptativo obtidas até agora nesta semana. Os itens assinalados estão atualmente selecionados. Pode rever escolhas anteriores sempre que surgirem novas evidências.",
  "This remains your choice. Match-or-Beat, readiness, recovery and deload safeguards continue to apply after any increase.": "A escolha continua a ser sua. As salvaguardas de Igualar ou Superar, prontidão, recuperação e descarga continuam a aplicar-se após qualquer aumento.", "Confirm Selected Changes": "Confirmar alterações selecionadas", "Accept Selected Changes": "Aceitar alterações selecionadas", "Keep Current Volume": "Manter volume atual",
  "This is the final adaptive-volume decision for the completed week. Keep Current Volume clears all of this week’s offered changes.": "Esta é a decisão final de volume adaptativo para a semana concluída. Manter volume atual elimina todas as alterações propostas nesta semana.", "Keep Current Volume leaves all of this week’s offers unchecked for now. A later qualifying workout, or the final weekly review, can give you another opportunity to reconsider them.": "Manter volume atual deixa, por agora, todas as propostas desta semana desmarcadas. Um treino qualificável posterior ou a revisão semanal final poderá dar-lhe outra oportunidade para as reconsiderar.",
  "Day": "Dia", "sets": "séries", "Add": "Adicionar", "as the optional adaptive exercise": "como exercício adaptativo opcional",
  "Repeat Week": "Repetir Semana",
  "Checking interrupted workout…": "A verificar treino interrompido…",
  "Workout Recovery Issue": "Problema na recuperação do treino",
  "An unfinished workout was found, but its saved recovery state cannot be safely restored.": "Foi encontrado um treino não concluído, mas o estado de recuperação guardado não pode ser restaurado em segurança.",
  "DISCARD UNUSABLE RECOVERY": "DESCARTAR RECUPERAÇÃO INUTILIZÁVEL",
  "Discard unusable recovery?": "Descartar recuperação inutilizável?",
  "The corrupted recovery snapshot will be removed. Completed workout history is not affected.": "O estado de recuperação corrompido será removido. O histórico de treinos concluídos não será afetado.",
  "Cancel": "Cancelar", "Discard": "Descartar", "No interrupted workout found.": "Não foi encontrado nenhum treino interrompido.", "Return Home": "Voltar ao Início",
  "Discard interrupted workout?": "Descartar treino interrompido?",
  "The recoverable workout state will be removed. Completed workout history is not affected.": "O estado recuperável do treino será removido. O histórico de treinos concluídos não será afetado.",
  "Interrupted Workout Found": "Treino interrompido encontrado", "Week": "Semana", "Set": "Série", "Last active:": "Última atividade:",
  "This recovery is more than 7 days old.": "Esta recuperação tem mais de 7 dias.", "This recovery is more than 24 hours old.": "Esta recuperação tem mais de 24 horas.",
  "You can still resume it, but confirm this is the workout you intend to continue.": "Ainda pode retomá-lo, mas confirme que este é o treino que pretende continuar.",
  "You can continue the live workout, or complete the missing results manually without timers.": "Pode continuar o treino em direto ou completar manualmente os resultados em falta sem temporizadores.",
  "RESUME WORKOUT": "RETOMAR TREINO", "COMPLETE / EDIT REMAINING": "CONCLUIR / EDITAR RESTANTE", "DISCARD WORKOUT": "DESCARTAR TREINO",
  "COACH": "COACH", "MAX LEVEL COMPLETE": "NÍVEL MÁXIMO CONCLUÍDO", "LEVEL COMPLETE": "NÍVEL CONCLUÍDO", "COMPLETED": "CONCLUÍDO", "NEXT CHALLENGE": "PRÓXIMO DESAFIO",
  "Maintenance": "Manutenção", "Start Maintenance": "Iniciar Manutenção", "Progress to": "Progredir para", "Progress to Next Level": "Progredir para o nível seguinte", "Train Another Week": "Treinar mais uma semana",
  "You've Reached Maintenance": "Chegou à fase de Manutenção", "You've Earned the Next Step": "Conquistou o próximo passo", "The Next Step Is on Hold": "O próximo passo está em pausa",
  "You've completed the structured progression and demonstrated the performance required at this level.": "Concluiu a progressão estruturada e demonstrou o desempenho exigido neste nível.",
  "From here, training continues in Maintenance. Keep training consistently, meeting your targets and using recovery feedback to maintain your progress.": "A partir daqui, o treino continua em Manutenção. Continue a treinar com consistência, a cumprir os seus objetivos e a utilizar o feedback de recuperação para manter o progresso.",
  "I'll continue monitoring Match-or-Beat performance, recovery, fatigue, form and pain. Adaptive Rest, Analytics and recovery interventions remain active exactly as before.": "Continuarei a acompanhar o desempenho em Igualar ou Superar, a recuperação, a fadiga, a técnica e a dor. O Descanso Adaptativo, as Análises e as intervenções de recuperação continuam ativos como antes.",
  "Maintenance is open-ended. Each completed training week rolls into the next while the Coach continues to manage recovery and performance.": "A Manutenção não tem uma duração definida. Cada semana de treino concluída dá lugar à seguinte, enquanto o Coach continua a gerir a recuperação e o desempenho.",
  "RECOVERY COMPLETE": "RECUPERAÇÃO CONCLUÍDA", "Ready to Verify Your Recovery": "Pronto para verificar a sua recuperação", "Verification Week": "Semana de Verificação", "80% of healthy pre-deload MB targets": "80% dos objetivos Igualar ou Superar saudáveis anteriores à descarga", "Continue to Verification Week": "Continuar para a Semana de Verificação",
  "You’ve completed the recovery phase. The next week is a controlled return to normal training so we can see how your body responds.": "Concluiu a fase de recuperação. A próxima semana é um regresso controlado ao treino normal para avaliarmos como o seu corpo responde.",
  "Your normal exercise structure, sets and rest periods return now, but the Match-or-Beat targets will begin at 80% of your healthy pre-deload baseline.": "A estrutura normal dos exercícios, as séries e os períodos de descanso regressam agora, mas os objetivos Igualar ou Superar começam a 80% da sua referência saudável anterior à descarga.",
  "This week is not about making up for lost time. Train with control, pay attention to how you feel, and let the verification week show whether you’re ready to resume full progression.": "Esta semana não serve para compensar o tempo perdido. Treine com controlo, preste atenção à forma como se sente e deixe que a semana de verificação mostre se está preparado para retomar a progressão completa.",
  "RECOVERY REQUIRED": "RECUPERAÇÃO NECESSÁRIA", "Recovery Comes First": "A recuperação vem primeiro", "Start Recovery Cycle": "Iniciar ciclo de recuperação", "Recovery Cycle": "Ciclo de Recuperação",
  "Your recent training shows recurring joint discomfort. The next cycle should focus on recovery rather than normal strength work.": "Os treinos recentes mostram desconforto articular recorrente. O próximo ciclo deve concentrar-se na recuperação em vez do trabalho normal de força.",
  "I’m putting normal Match-or-Beat training on hold for now. Reduced strength work is not the right response to recurring joint discomfort.": "Vou colocar temporariamente em pausa o treino normal de Igualar ou Superar. Reduzir simplesmente o trabalho de força não é a resposta adequada ao desconforto articular recorrente.",
  "Your recovery cycle will focus on comfortable, pain-free recovery work. Normal training will return only after the recovery phase and a verification cycle.": "O ciclo de recuperação irá concentrar-se em trabalho confortável e sem dor. O treino normal regressará apenas após a fase de recuperação e um ciclo de verificação.",
  "DELOAD RECOMMENDED": "DESCARGA RECOMENDADA", "Technique Needs Recovery": "A técnica precisa de recuperação", "A Recovery Week Is Due": "Está na altura de uma semana de recuperação", "Recovery Is the Next Step": "A recuperação é o próximo passo", "Start Deload Week": "Iniciar semana de descarga", "Deload Week": "Semana de Descarga",
  "Recurring form breakdown suggests that accumulated training stress is affecting movement quality.": "A deterioração recorrente da técnica sugere que o stress de treino acumulado está a afetar a qualidade do movimento.",
  "Recurring fatigue shows that recovery has fallen behind the current training demand.": "A fadiga recorrente mostra que a recuperação não está a acompanhar as exigências atuais do treino.",
  "Your latest readiness signals show that a short recovery phase is more useful than pushing normal progression right now.": "Os sinais de prontidão mais recentes mostram que uma breve fase de recuperação é atualmente mais útil do que forçar a progressão normal.",
  "The next cycle will reduce the training demand so you can recover while keeping the movement patterns familiar.": "O próximo ciclo reduzirá a exigência do treino para permitir a recuperação, mantendo os padrões de movimento habituais.",
  "The next cycle will keep your normal exercise pattern but reduce the workload and give you more recovery between efforts.": "O próximo ciclo manterá o padrão normal de exercícios, mas reduzirá o volume de trabalho e dará mais recuperação entre esforços.",
  "The next cycle will reduce training demand and focus on recovery.": "O próximo ciclo reduzirá a exigência do treino e concentrar-se-á na recuperação.",
  "Match-or-Beat progression will be suspended during the deload. Afterward, you’ll return through a verification cycle before normal progression resumes.": "A progressão de Igualar ou Superar ficará suspensa durante a descarga. Depois, regressará através de um ciclo de verificação antes de retomar a progressão normal.",
  "Match-or-Beat progression will be suspended during the deload. Afterward, you’ll complete a verification cycle before normal progression resumes.": "A progressão de Igualar ou Superar ficará suspensa durante a descarga. Depois, concluirá um ciclo de verificação antes de retomar a progressão normal.",
  "Match-or-Beat progression will be suspended during the deload. A verification cycle will follow before normal progression resumes.": "A progressão de Igualar ou Superar ficará suspensa durante a descarga. Seguir-se-á um ciclo de verificação antes de retomar a progressão normal.",
  "This recovery step is required by the Coach. Normal progression and Match-or-Beat evaluation remain on hold until the deload and verification phases are complete.": "Este passo de recuperação é exigido pelo Coach. A progressão normal e a avaliação Igualar ou Superar permanecem em pausa até à conclusão das fases de descarga e verificação.",
  "Your previously earned progression remains recorded; it is only temporarily unavailable while recovery is required.": "A progressão anteriormente conquistada permanece registada; está apenas temporariamente indisponível enquanto a recuperação for necessária.",
  "Your consistency and performance show that you're ready for the next challenge.": "A sua consistência e desempenho mostram que está preparado para o próximo desafio.",
  "You've already reached the progression standard, but your latest training signals suggest staying at this level for now.": "Já atingiu o padrão de progressão, mas os sinais dos treinos mais recentes sugerem que deve permanecer neste nível por agora.",
  "You've completed the required training period and demonstrated that you can meet the performance standard consistently.": "Concluiu o período de treino exigido e demonstrou que consegue cumprir o padrão de desempenho de forma consistente.",
  "You've earned progression. I recommend taking the next step — but the decision is yours.": "Conquistou a progressão. Recomendo avançar para o próximo passo — mas a decisão é sua.",
  "You've already shown that you can reach the progression standard, but your latest week suggests that moving forward right now is not the best call.": "Já demonstrou que consegue atingir o padrão de progressão, mas a última semana sugere que avançar neste momento não é a melhor opção.",
  "Stay at this level for another week. Once your performance and recovery signals are back where they need to be, progression will become available again.": "Permaneça neste nível por mais uma semana. Quando os sinais de desempenho e recuperação voltarem ao nível necessário, a progressão ficará novamente disponível.",
  "Your progression remains earned if you choose to spend another week at this level.": "A progressão que conquistou mantém-se mesmo que opte por passar mais uma semana neste nível.",
  "Your previous achievement remains recorded. Progression will become available again when the Coach confirms that the current criteria are met.": "A conquista anterior permanece registada. A progressão ficará novamente disponível quando o Coach confirmar que os critérios atuais foram cumpridos.",

};
export function localizeUiText(language: SupportedLanguage, text: string): string {
  return language === "pt-PT" ? (ptUiText[text] ?? text) : text;
}
