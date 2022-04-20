let orderId = null;
let orderAlternativeTime = null;
let orderAction = null;
let needOperator = false;
let lastUtterance = null;
let name = null;

let orderItem = null;
let orderFormIphoneCurrentSlot = null;
let orderFormIphone = {
    memory: {
      value: null,
      entity: 'memory',
      phrases: [
        'А какой объем памяти вас интересует?',
        'Прошу прощения, не поняла, какой объем? У нас есть шестьдесят четыре и сто двадцать восемь гигабайт'
      ],
      tries: 0
    },
    color: {
      value: null,
      entity: 'color',
      phrases: [
        'А какой цвет?',
        'Простите не расслышала, какой цвет? У нас есть серый черный и золотой.'
      ],
      tries: 0
    },
    address: {
      value: null,
      entity: 'systemLocation',
      phrases: [
        'Ага, и продиктуйте ваш адрес доставки, пожалуйста',
        'Простите не расслышала, на какой адрес доставить?'
      ],
      tries: 0
    },
    time: {
      value: null,
      entity: 'systemTime',
      phrases: [
        'И последнее, на какую дату вы хотите заказать доставкку?',
        'Простите не расслышала, на какую дату?'
      ],
      tries: 0
    }
}


function fillFormStep(form, entities) {
  /* заполнить слоты теми данными что пришли из запроса */
  if (entities) {
    for (const [slotId, slot] of Object.entries(form)) {
      if (entities[slot.entity]) {
        slot.value = entities[slot.entity][0].value
      }
    }
  }
}

function getFormState(form) {
    /* если какой-то из слотов остался незаполненным, то доспросить */
  for (const [slotId, slot] of Object.entries(form)) {
    if (slot.value === null) {
      orderFormIphoneCurrentSlot = slotId
      slot.tries += 1
      if (slot.tries <= slot.phrases.length) {
        return {status: 'inprogress', utterance: slot.phrases[slot.tries-1]}
      } else {
        return {status: 'failed', utterance: null}
      }
    }
  }
  return {status: 'done', utterance: null}
}


function dateToString(dt) {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  return `${parseInt(dt.substring(8,10))} ${months[parseInt(dt.substring(5,7))-1]}`
}

function extractOrderIDFromRequest(entities) {
  if (entities.systemNumber) {
    let id = ''
    for (const num of entities.systemNumber) {
      id = id.concat(num.value)
    }
    orderId = id
  }
}

function Reaction(pack) {
  if (pack.utterance) {
    lastUtterance = pack.utterance
  }
  return Response(pack)
}


addState({
  name: 'start',
  onEnter: async (event) => {
    /* Привествуем пользователя и начинаем слушать */
    orderAlternativeTime = null;
    orderAction = null;

    if (event.visitsCounter === 1) {
      return Reaction({
        utterance: 'Магазин Apple Store, приветствую вас. Чем могу помочь?',
        listen: true,
        interruptableAfter: 50
      });
    } else {
      return Reaction({utterance: 'Могу помочь чем-то еще?', listen: true})
    }
  },
  onTimeout: async (event) => {
    return Reaction({utterance: 'Че умолк чертила', listen: true})
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.intent === 'order') {
      if (event.entities.storeItem) {
        orderItem = event.entities.storeItem[0].value
        if (orderItem === 'iPhone') {
          fillFormStep(orderFormIphone, event.entities)
        }
      }
      return Reaction({nextState: 'orderGetName'})
    }
    if (event.intent === 'orderStatus') {
      extractOrderIDFromRequest(event.entities)
      orderAction = 'status'
      return Reaction({nextState: 'orderGetNumber'})
    }
    if (event.intent === 'orderCancel') {
      extractOrderIDFromRequest(event.entities)
      orderAction = 'cancel'
      return Reaction({nextState: 'orderGetNumber'})
    }
    if (event.intent === 'orderChangeTime') {
      extractOrderIDFromRequest(event.entities)
      orderAction = 'move'
      return Reaction({nextState: 'orderGetNumber'})
    }
    if (event.intent === 'welcome') {
      /* Отвечаем и продолжаем ждать новые фразы в этом состоянии диалога */
      return Reaction({ utterance: 'Да, здравствуйте. Могу помочь чем-то?', listen: true })
    } else if (event.intent === 'yes') {
      return Reaction({ utterance: 'Так чем могу помочь?', listen: true })
    } else if (event.intent === 'no') {
      /* Отвечаем и переходим в следущее состояние диалога */
      return Reaction({ utterance: 'Тогда спасибо за обращение и всего доброго!', nextState: 'final' })
    } else {
      /* Отвечаем одной из фраз, прописанных для этого интента */
      if (event.response) {
        return Reaction({ utterance: event.response, listen: true })
      } else {
        return Reaction({ utterance: 'Что простите?', listen: true })
      }
    }
  }
});

addState({
  name: 'orderGetNumber',
  onEnter: async (event) => {
    if (orderId) {
      return Reaction({utterance:`Сейчас проверю в базе, одну секунду`, nextState: 'orderFindInCRM'});
    } else {
      return Reaction({utterance:`А продиктуйте пожалуйста номер заказа`, listen: true});
    }
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.intent === 'whereIsMyNumber') {
      return Reaction({utterance: event.response, listen: true})
    }

    extractOrderIDFromRequest(event.entities)
    if (orderId) {
      return Reaction({utterance:`Сейчас проверю в базе, одну секунду`, nextState: 'orderFindInCRM'});
    } else {
      if (event.utteranceCounter < 3) {
        return Reaction({utterance: 'Я плохо вас расслышала, пожалуйста повторите номер заказа по цифрам', listen: true})
      } else {
        needOperator = true
        return Reaction({uttenrace: 'Прошу прощения, у меня не получилось вас понять, я переведу вас на живого оператора', isFinal: true})
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
        return Reaction({nextState: 'orderStatus'})
      } else if (orderAction === 'move') {
        if (orderAlternativeTime) {
          return Reaction({nextState: 'orderMoveConfirm'})
        } else {
          return Reaction({nextState: 'orderMove'})
        }
      } else {
        return Reaction({nextState: 'orderDelete'})
      }
    } else {
      return Reaction({utterance: 'Прошу прощения но мы не нашли ваш заказ в базе', nextState: 'start'})
    }
  }
});


addState({
  name: 'orderStatus',
  onEnter: async (event) => {
    return Reaction({utterance: 'Ваш заказ будет доставлен в срок 2 апреля. Курьер свяжется с вами за час до приезда', nextState: 'start'})
  }
});


addState({
  name: 'orderDelete',
  onEnter: async (event) => {
    await httpRequest(`http://avatarsdemo.voximplant.com:8976/orders/${orderId}/delete`, {method: 'POST'})
    return Reaction({utterance: 'Ваш заказ отменен. Деньги вернутся вам на карту в течении двух рабочих дней', nextState: 'start'})
  }
});


addState({
  name: 'orderMove',
  onEnter: async (event) => {
    if (event.visitsCounter == 1 && !orderAlternativeTime) {
      return Reaction({utterance: 'А на какую дату вы хотели бы перенести?', listen: true})
    } else {
      return Reaction({listen: true})
    }
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.entities.systemTime) {
      orderAlternativeTime = event.entities.systemTime[0].value
      return Reaction({nextState: 'orderMoveConfirm'})
    } else if (event.intent === 'no') {
      return Reaction({utterance: 'Ясно', nextState: 'start'})
    } else {
      if (event.utteranceCounter < 3) {
        return Reaction({utterance: 'Я плохо вас расслышала, на какую дату?', listen: true})
      } else {
        needOperator = true
        return Reaction({uttenrace: 'Прошу прощения, у меня не получилось вас понять, я переведу вас на живого оператора', isFinal: true})
      }
    }
  }
});


addState({
  name: 'orderMoveConfirm',
  onEnter: async (event) => {
    return Reaction({utterance: `Вы хотите перенести на ${dateToString(orderAlternativeTime)}. Все верно?`, listen: true})
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.intent === 'yes') {
      const crmResponse = await httpRequest(`http://avatarsdemo.voximplant.com:8976/orders/${orderId}/move`, {method: 'POST', postData: JSON.stringify({'ts': orderAlternativeTime}), headers: ['Content-Type: application/json']})
      const succeed = JSON.parse(crmResponse.text).status === 'succeed'
      if (succeed) {
        return Reaction({utterance:`Отлично, перенесла`, nextState: 'start'})
      } else {
        return Reaction({utterance:`Простите, но в этот день наша доставка не будет работать, может на другой день?`, nextState: 'orderMove'})
      }
    } else {
      if (event.entities.systemTime) {
        orderAlternativeTime = event.entities.systemTime[0].value
        return Reaction({nextState: 'orderMoveConfirm'})
      } else {
        if (event.utteranceCounter < 3) {
          return Reaction({utterance: 'Простите плохо расслышала. Переносим или нет?', listen: true})
        } else {
          needOperator = true
          return Reaction({uttenrace: 'Прошу прощения, у меня не получилось вас понять, я переведу вас на живого оператора', isFinal: true})
        }
      }
    }
  }
});


addState({
  name: 'orderGetName',
  onEnter: async (event) => {
    return Reaction({utterance: 'Как могу к вам обращаться?', listen: true})
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.entities.systemPerson) {
      name = event.entities.systemPerson[0].value
      return Reaction({utterance: `Очень приятно, ${name}`, nextState: 'order'})
    } else {
      return Reaction({utterance: `Очень приятно`, nextState: 'order'})
    }
  }
});

addState({
  name: 'order',
  onEnter: async (event) => {
    if (orderItem === null) {
      return Reaction({ utterance: 'Конечно, а что именно вы хотели бы приобрести', listen: true });
    } else if (orderItem != 'iPhone') {
      needSwithToOperator = true
      return Reaction({ utterance: 'Я переключю вас на отдел продаж, одну секунду', nextState: 'final'})
    } else {
      return Reaction({nextState: 'orderIphone'})
    }
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.entities.storeItem) {
      orderItem = event.entities.storeItem[0].value
      if (orderItem === 'iPhone') {
        fillFormStep(orderFormIphone, event.entities)
      }
    }
    if (orderItem === null) {
      if (event.utteranceCounter < 2) {
        return Reaction({uttenrace: 'Что-что простите?', listen: true})
      } else {
        needSwithToOperator = true
        return Reaction({uttenrace: 'Я переведу вас на отдел продаж, они вам подскажут, одну секунду', nextState: 'final'})
      }
    } else if (orderItem != 'iPhone') {
      needSwithToOperator = true
      return Reaction({ utterance: 'Я переключю вас на отдел продаж, одну секунду', nextState: 'final'})
    } else {
      fillFormStep(orderFormIphone, event.entities)
      return Reaction({nextState: 'orderIphone'})
    }
  }
});

addState({
  name: 'orderIphone',
  onEnter: async (event) => {
    const {status, utterance} = getFormState(orderFormIphone, null)
    if (utterance) {
      return Reaction({utterance: utterance, listen: true})
    } else {
      if (status === 'done') {
        return Reaction({nextState: 'orderConfirm'})
      } else {
        needSwithToOperator = true
        return Reaction({ utterance: 'У меня возникли проблемы, переключаю на отдел продаж, одну секунду', nextState: 'final'})
      }
    }
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.intent === 'whatColor' || (orderFormIphoneCurrentSlot === 'color' && event.intent === 'whatOptions')) {
      return Reaction({utterance: 'Доступны серый, черный и золотой. Какой вы выберете?', listen: true})
    }
    if (event.intent === 'whatMemory' || (orderFormIphoneCurrentSlot === 'memory' && event.intent === 'whatOptions')) {
      return Reaction({utterance: 'Есть 64 и 128 гигабайт. Какой выберете?', listen: true})
    }
    fillFormStep(orderFormIphone, event.entities)
    return Reaction({nextState: 'orderIphone'})
  }
});


addState({
  name: 'orderConfirm',
  onEnter: async (event) => {
    const orderDate = dateToString(orderFormIphone.time.value)
    const price = orderFormIphone.memory.value === '64 GB' ? '200 тысяч рублей' : '300 тысяч рублей'
    const nameString = name + ',' ? name : ''
    const confirmationString = `Итак, ${nameString} ваш заказ: ${orderFormIphone.color.value} iPhone ${orderFormIphone.memory.value} на сумму ${price}. Доставка ${orderDate} по адресу ${orderFormIphone.address.value}. Оформляю?`
    return Reaction({utterance: confirmationString, listen: true})
  },
  onUtterance: async (event) => {
    if (event.intent === 'what') {
      return Reaction({utterance: lastUtterance, listen: true})
    }
    if (event.intent === 'yes') {
      const crmResponse = await httpRequest(
        `http://avatarsdemo.voximplant.com:8976/orders/create`, 
        {
          method: 'POST', 
          postData: JSON.stringify({ts: orderFormIphone.time, memory: orderFormIphone.memory, color: orderFormIphone.color, address: orderFormIphone.address, item: 'iPhone'}), 
          headers: ['Content-Type: application/json']
        }
      )
      orderId = JSON.parse(crmResponse.text).order_id
      return Reaction({uttenrace: 'Отлично! заказ оформлен. Код подтверждения выслан вам СМС.', nextState: 'start'})
    } else {
      if (event.utteranceCounter < 3) {
        return Reaction({utterance: 'Простите не расслышала, оформляем?', listen: true})
      } else {
        needSwithToOperator = true
        return Reaction({utterance: 'Прошу прошения, я переведу на живого оператора', nextState: 'final'})
      }
    }
  }
});


addState({
  name: 'final',
  onEnter: async (event) => {
    /* Заканчиваем диалог*/
    return Reaction({ isFinal: true, customData: {needSwithToOperator: needOperator} });
  },
});

/* Делаем 'start' начальным состоянием нашего диалога */
setStartState('start');