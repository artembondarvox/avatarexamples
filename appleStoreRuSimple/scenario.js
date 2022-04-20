addState({
  name: 'start',
  onEnter: async (event) => {
    /* Привествуем пользователя и начинаем слушать */
    return Response({
      utterance: 'Магазин Apple Store, приветствую вас. Чем могу помочь?',
      listen: true,
    });
  },
  onUtterance: async (event) => {
    /*
     * Реагируем на фразу пользователя
     */
    if (event.intent === 'welcome') {
      /* Отвечаем и продолжаем ждать новые фразы в этом состоянии диалога */
      return Response({ utterance: 'Да, здравствуйте. Могу помочь чем-то?', listen: true });
    } else if (event.intent === 'yes') {
      return Response({ utterance: 'Так чем могу помочь?', listen: true });
    } else if (event.intent === 'no') {
      /* Отвечаем и переходим в следущее состояние диалога */
      return Response({ utterance: 'Тогда спасибо за обращение и всего доброго!', nextState: 'final' });
    } else {
      /* Отвечаем одной из фраз, прописанных для этого интента */
      return Response({ utterance: event.response, listen: true });
    }
  },
});

addState({
  name: 'final',
  onEnter: async (event) => {
    /* Заканчиваем диалог*/
    return Response({ isFinal: true });
  },
});

/* Делаем 'start' начальным состоянием нашего диалога */
setStartState('start');
