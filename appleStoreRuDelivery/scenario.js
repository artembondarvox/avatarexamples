let orderId = null;
let orderAlternativeTime = null;
let orderAction = null;
let needOperator = false;


let extractOrderIDFromRequest = (entities) => {
  if (entities.systemNumber) {
    let id = ''
    for (const num of entities.systemNumber) {
      id = id.concat(num.value)
    }
    return id
  }
  return null
}

addState({
  name: 'start',
  onEnter: async (event) => {
    /* Привествуем пользователя и начинаем слушать */
    orderAlternativeTime = null;
    orderAction = null;

    if (event.visitsCounter === 1) {
      return Response({
        utterance: 'Магазин Apple Store, приветствую вас. Чем могу помочь?',
        listen: true,
      });
    } else {
      return Response({utterance: 'Могу помочь чем-то еще?', listen: true})
    }
  },
  onUtterance: async (event) => {
    /*
     * Реагируем на фразу пользователя
     */
    if (event.intent === 'orderStatus') {
      orderId = extractOrderIDFromRequest(event.entities)
      orderAction = 'status'
      return Response({nextState: 'orderGetNumber'})
    }
    if (event.intent === 'orderCancel') {
      orderId = extractOrderIDFromRequest(event.entities)
      orderAction = 'cancel'
      return Response({nextState: 'orderGetNumber'})
    }
    if (event.intent === 'orderChangeTime') {
      orderId = extractOrderIDFromRequest(event.entities)
      orderAction = 'move'
      return Response({nextState: 'orderGetNumber'})
    }
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
  }
});

addState({
  name: 'orderGetNumber',
  onEnter: async (event) => {
    if (orderId) {
      return Response({utterance:`Сейчас проверю в базе, одну секунду`, nextState: 'orderFindInCRM'});
    } else {
      return Response({utterance:`А продиктуйте пожалуйста номер заказа`, listen: true});
    }
  },
  onUtterance: async (event) => {
    if (event.intent === 'whereIsMyNumber') {
      return Response({utterance: event.response, listen: true})
    }

    orderId = extractOrderIDFromRequest(event.entities)
    if (orderId) {
      return Response({utterance:`Сейчас проверю в базе, одну секунду`, nextState: 'orderFindInCRM'});
    } else {
      if (event.utteranceCounter < 3) {
        return Response({utterance: 'Я плохо вас расслышала, пожалуйста повторите номер заказа по цифрам', listen: true})
      } else {
        needOperator = true
        return Response({uttenrace: 'Прошу прощения, у меня не получилось вас понять, я переведу вас на живого оператора', isFinal: true})
      }
    }
  }
});


addState({
  name: 'orderFindInCRM',
  onEnter: async (event) => {
    const crmResponse = await httpRequest(`http://avatarsdemo.voximplant.com:8976/orders/${orderId}`)
    const exists = JSON.parse(crmResponse.text).status === 'exists'
    if (exists) {
      if (orderAction === 'status') {
        return Response({nextState: 'orderStatus'})
      } else if (orderAction === 'move') {
        if (orderAlternativeTime) {
          return Response({nextState: 'orderMoveConfirm'})
        } else {
          return Response({nextState: 'orderMove'})
        }
      } else {
        return Response({nextState: 'orderDelete'})
      }
    } else {
      return Response({utterance: 'Прошу прощения но мы не нашли ваш заказ в базе', nextState: 'start'})
    }
  }
});


addState({
  name: 'orderStatus',
  onEnter: async (event) => {
    return Response({utterance: 'Ваш заказ будет доставлен в срок 2 апреля. Курьер свяжется с вами за час до приезда', nextState: 'start'})
  }
});


addState({
  name: 'orderDelete',
  onEnter: async (event) => {
    await httpRequest(`http://avatarsdemo.voximplant.com:8976/orders/${orderId}/delete`, {method: 'POST'})
    return Response({utterance: 'Ваш заказ отменен. Деньги вернутся вам на карту в течении двух рабочих дней', nextState: 'start'})
  }
});


addState({
  name: 'orderMove',
  onEnter: async (event) => {
    if (event.visitsCounter == 1 && !orderAlternativeTime) {
      return Response({utterance: 'А на какую дату вы хотели бы перенести?', listen: true})
    } else {
      return Response({listen: true})
    }
  },
  onUtterance: async (event) => {
    if (event.entities.systemTime) {
      orderAlternativeTime = event.entities.systemTime[0].value
      return Response({nextState: 'orderMoveConfirm'})
    } else if (event.intent === 'no') {
      return Response({utterance: 'Ясно', nextState: 'start'})
    } else {
      if (event.utteranceCounter < 3) {
        return Response({utterance: 'Я плохо вас расслышала, на какую дату?', listen: true})
      } else {
        needOperator = true
        return Response({uttenrace: 'Прошу прощения, у меня не получилось вас понять, я переведу вас на живого оператора', isFinal: true})
      }
    }
  }
});


addState({
  name: 'orderMoveConfirm',
  onEnter: async (event) => {
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    const dateStr = `${parseInt(orderAlternativeTime.substring(8,10))} ${months[parseInt(orderAlternativeTime.substring(5,7))-1]}`
    return Response({utterance: `Вы хотите перенести на ${dateStr}. Все верно?`, listen: true})
  },
  onUtterance: async (event) => {
    if (event.intent === 'yes') {
      const crmResponse = await httpRequest(`http://avatarsdemo.voximplant.com:8976/orders/${orderId}/move`, {method: 'POST', postData: JSON.stringify({'ts': orderAlternativeTime}), headers: ['Content-Type: application/json']})
      const succeed = JSON.parse(crmResponse.text).status === 'succeed'
      if (succeed) {
        return Response({utterance:`Отлично, перенесла`, nextState: 'start'})
      } else {
        return Response({utterance:`Простите, но в этот день наша доставка не будет работать, может на другой день?`, nextState: 'orderMove'})
      }
    } else {
      if (event.entities.systemTime) {
        orderAlternativeTime = event.entities.systemTime[0].value
        return Response({nextState: 'orderMoveConfirm'})
      } else {
        if (event.utteranceCounter < 3) {
          return Response({utterance: 'Простите плохо расслышала. Переносим или нет?', listen: true})
        } else {
          needOperator = true
          return Response({uttenrace: 'Прошу прощения, у меня не получилось вас понять, я переведу вас на живого оператора', isFinal: true})
        }
      }
    }
  }
});


addState({
  name: 'final',
  onEnter: async (event) => {
    /* Заканчиваем диалог*/
    return Response({ isFinal: true, customData: {needSwithToOperator: needOperator} });
  },
});

/* Делаем 'start' начальным состоянием нашего диалога */
setStartState('start');
