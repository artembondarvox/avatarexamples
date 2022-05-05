const reAskingPhrases = [
        'Не понял вас, повторите, пожалуйста еще раз',
        'Извините, я не понял, повторите, пожалуйста',
        'Прошу прощения, я не понял, повторите, пожалуйста',
        'Простите, не понял вас, повторите, пожалуйста, заново'
      ]

const grains = ["second", "minute", "hour"];

let lastUtterance = null;
let sex = null;
let slotHair = null;
let isSlotNotMatch = null;
let collectTime = [];
let strOfNumbers = [];
var cost = {
  'стрижка челки': 200,
  'стрижка волос ниже плеч': 250,
  'стрижка кончиков волос': 100,
  'стрижка': 500,
  'стрижка плюс стрижка бороды и усов': 600,
  'первая стрижка': 450,
  'моделирование бороды и усов': 200,
  'стрижка бороды и усов': 150,
  'окантовка и укладка': 100,
  'стрижка машинкой': 150,
  'восковое удаление волос': 50,
  'мытье головы': 300,
  'мытье волос ниже плеч': 400
};


// function extractSexSlot(ev) {

//         if (ev.entities.sex) {
//           sex = ev.entities.sex[0].value
//         }
//         if (ev.entities.haircut) {
//           slot = ev.entities.haircut[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.first_haircut) {
//           slot = ev.entities.first_haircut[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.mustache) {
//           slot = ev.entities.mustache[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.model_must) {
//           slot = ev.entities.model_must[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.haircut_and_model) {
//           slot = ev.entities.haircut_and_model[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.vosk) {
//           slot = ev.entities.vosk[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.by_car) {
//           slot = ev.entities.by_car[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.cunt) {
//           slot = ev.entities.cunt[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.ton) {
//           slot = ev.entities.ton[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.hair_cut_should) {
//           slot = ev.entities.hair_cut_should[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.hair_cut_end) {
//           slot = ev.entities.hair_cut_end[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.hair_cut_chelk) {
//           slot = ev.entities.hair_cut_chelk[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.wash) {
//           slot = ev.entities.wash[0].value
//           lot.push(slot)
//         }
//         if (ev.entities.wash_should) {
//           slot = ev.entities.wash_should[0].value
//           lot.push(slot)
//         }
//         var longest = lot.sort(
//           function (a, b) {
//             return b.length - a.length;
//           }
//         )[0];
//         slot = longest
//         return [sex, slot]
// }


function DateTimeToVoice(dateTime) {
  const monthNames = ["января", "февряля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  var dateObj = new Date(dateTime);
  var day = dateObj.getUTCDate();
  var hour = dateObj.getHours();
  var minute = dateObj.getMinutes();
  var month = monthNames[dateObj.getMonth()];
  if (! minute) {
    dateResponse = `${day} ${month} в ${hour} часов`
  } else {
    dateResponse = `${day} ${month} в ${hour} часов ${minute} минут`
  }
  return dateResponse
}



function SmartResponse(ev) {
  const result = Response(ev)
  if (ev.utterance) {
    lastUtterance = ev.utterance
  }
  return result
}


let form = {
    appointmentDate: { /* slot name */
      value: null,
      grain: null,  /* collected value will be stored here */
      entity: 'systemTime',  /* which entity time are we expecting? (can be both system or custom) */
      utterances: [   /* phrases to ask user for this slot */
        'Когда и во сколько вы хотели бы прийти?', /* phrase to use at first */
        'Уточните еще раз, пожалуйста, дату и время. Мы открыты с 10 до 20 вечера по будням',
        'Вы указали не рабочее время. Уточните еще раз, пожалуйста, дату и время. Мы открыты с 10 до 20 вечера по будням',
        'Вы не указали время. Уточните еще раз, пожалуйста, дату и время. Мы открыты с 10 до 20 вечера по будням',
        'Вы указали не будние дни. Уточните еще раз, пожалуйста, дату и время. Мы открыты с 10 до 20 вечера по будням'  /* ask again if answer doesn't make any sense after first attempt */
      ],
      optional: false,   /* can we skip this slot if user haven't passed this info? */
      requestedCounter: 0 /* how many times we've asked user to fill this slot */
    },
    name: {
      value: null,
      entity: 'systemPerson',
      utterances: [
        'Как вас зовут?',
        'Извините, я не услышал, как вас зовут, повторите, пожалуйста',
        'Извините, я не услышал, как вас зовут, повторите, пожалуйста',
        'Извините, я не услышал, как вас зовут, вы называете имя?'
      ],
      optional: false,
      requestedCounter: 0
    },
    phone: {
      value: null,
      entity: 'systemNumber',
      utterances: [
        'Какой номер телефона?',
        'Извините, я не понял, какой номер, повторите, пожалуйста',
        'Извините, я не понял, какой номер, повторите, пожалуйста',
        'Извините, я не понял, какой номер, вы называете номер?'
      ],
      optional: false,
      requestedCounter: 0
    },
}

function extractEntValue(ents) {
  listOfEnt = []
  for ( var ent of ents) {
    listOfEnt.push(ent.value)
  }
  if (listOfEnt.length > 1) {
    resultEnt = listOfEnt.join('')
    strOfNumbers = listOfEnt.join(' ')
  } else {
    resultEnt = listOfEnt[0]
  }
  return resultEnt
}


function fillFormData(form, entities) {
  /* try to fill data, required by form */
  if (entities) {
    for (const [slotId, slot] of Object.entries(form)) {
      if (entities[slot.entity]) {
        slot.value = extractEntValue(entities[slot.entity])
      if (entities[slot.entity] && 'grain' in slot) {
        collectTime.push(entities[slot.entity][0])
        slot.grain = entities[slot.entity][0].grain
        }
      }
    }
  }
}

function cleanFormData(form) {
  /* clean data of form */
    for (const [slotId, slot] of Object.entries(form)) {
      slot.value = null
      slot.requestedCounter = 0
      if ('grain' in slot) {
        slot.grain = null
      }
    }
  }



function concatTwoDt(listOfTime) {
  if (listOfTime[0].grain === 'day' && grains.includes(listOfTime[1].grain)) {
    dateFirstDate = listOfTime[0].value.split("T")[0]
    dateSecondTime = listOfTime[1].value.split("T")[1]
    concatDateTime = dateFirstDate + "T" + dateSecondTime
    return concatDateTime
  } else {
    return null
  }
}


function isSlotNotCorrect(slot) {
    isSlotNotMatch = false
    if (collectTime.length === 2 && slot.entity === 'systemTime') {
      resultOfConcat = concatTwoDt(collectTime)
      if (resultOfConcat === null) {
        collectTime = []
      } else {
        slot.value = resultOfConcat
      }
    }
    if ('grain' in slot) {
      if (! slot.value) {
        isSlotNotMatch = true
        responseInTime = slot.utterances[1]
      } else if (! grains.includes(slot.grain)) {
        responseInTime = slot.utterances[3]
        isSlotNotMatch = true
      }
      if (slot.value && (grains.includes(slot.grain))) {
        dateCheck = new Date(slot.value)
        is_weekend = (dateCheck.getDay() === 6 || dateCheck.getDay() === 0)
        if (! (9 < dateCheck.getHours()) || ! (dateCheck.getHours() < 21)) {
          responseInTime = slot.utterances[2]
          isSlotNotMatch = true
        }
        if (is_weekend){
          responseInTime = slot.utterances[4]
          isSlotNotMatch = true
        }
      }
      }
      if (slot.entity == 'systemNumber') {
        if (slot.value) {
          if (slot.value.length != 10 && slot.value.length != 11) {
            isSlotNotMatch = true
          }
        }
      }
}



function checkFormState(form) {
    /* if any of required slots is not filled up - then ask customer for this data specifically
     states [str] - current state of slot filling
     - inprogress - some required slots are not filled up yet
     - done - all required slots are filled up
     - failed - user hasn't filled up required slot even though they were asked specifically about this info

     utterance [str] - an utterance to ask user about missing information
      */

  for (const [slotId, slot] of Object.entries(form)) {
    isSlotNotCorrect(slot)
    if (slot.value === null || isSlotNotMatch) {
      if (slot.optional) {
        continue
      }
      orderFormIphoneCurrentSlot = slotId
      slot.requestedCounter += 1
      if (slot.requestedCounter <= slot.utterances.length) {
        if (slot.entity == 'systemTime' && slot.requestedCounter != 1) {
          return {status: 'inprogress', utterance: responseInTime}
        } else {
          return {status: 'inprogress', utterance: slot.utterances[slot.requestedCounter-1]}
        }
      } else {
        return {status: 'failed', utterance: null}
      }
    }
  }
  return {status: 'done', utterance: null}
}



addState({
  name: 'start',
  onEnter: async (event) => {
    /* Привествуем пользователя и начинаем слушать */
    return SmartResponse({
      utterance: 'Здравствуйте! Вы позвонили в парикмахерскую "Людмила". Что вас интересует?',
      nextState: 'whatinterest',
    });
  },
});

addState({
  name: 'whatinterest',
  onEnter:async(event)=> {
        return SmartResponse({listen: true})
    },
  onUtterance:async(event)=>{
        if (event.entities.sex) {
          sex = event.entities.sex[0].value
        }
        if (event.entities.haircut) {
          slotHair = event.entities.haircut[0].value
        }
        if (event.intent === 'no') {
          sex = null
          slotHair = null
          if (event.utteranceCounter < 5) {
            return SmartResponse({utterance: 'Видимо, я вас не понял, скажите, что вы хотели бы узнать?', listen: true})
          } else {
            return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
          }
        }
        if (event.intent === 'whatcani') {
          return SmartResponse({utterance: 'Я могу подсказать, какие услуги есть, сообщить из стоимость и записать вас', nextState: 'whatinterest'})
        }
        if (event.intent === 'bye') {
          return SmartResponse({utterance: 'До скорой встречи!', nextState: 'final'})
        }
        if (event.intent === 'welcome') {
          if (event.utteranceCounter > 7) {
            return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
          } else {
            return SmartResponse({utterance: 'Да, здравствуйте! Что вам подсказать?', listen: true})
          }
        }
        if (event.intent === 'repeat') {
          return SmartResponse({utterance: lastUtterance, listen: true})
        }
        if (event.intent === 'price') {
          return SmartResponse({nextState: 'cost'})
        }
        if (slotHair && sex) {
            const response = `Вас интересует услуга ${sex}, ${slotHair}, правильно я понял?`
            return SmartResponse({utterance: response, nextState: 'yes_or_no'})
        } else if (slotHair && sex === 'мужская') {
            if (slotHair.includes('плечь') || slotHair.includes('кончиков') || slotHair.includes('челки')) {
              slotHair = null
              sex = null
              return SmartResponse({utterance: 'Это женская прическа, повторите все заново, пожалуйста', nextState: 'whatinterest'})
            }
            const response = `Вас интересует услуга ${sex}, ${slotHair}, правильно я понял?`
            return SmartResponse({utterance: response, nextState: 'yes_or_no'})
        } else if (slotHair && sex === 'женская') {
            if (slotHair.includes('бороды') || slotHair.includes('окантовка') || slotHair.includes('тонировка')) {
              slotHair = null
              sex = null
              return SmartResponse({utterance: 'Это женская прическа, повторите все заново, пожалуйста', nextState: 'whatinterest'})
            }
            const response = `Вас интересует услуга ${sex}, ${slotHair}, правильно я понял?`
            return SmartResponse({utterance: response, nextState: 'yes_or_no'})
        } else if (event.intent === 'table') {
            return SmartResponse({nextState: 'table'})
        } else if (slotHair && ! sex && event.utteranceCounter < 5) {
            const response = `Вас интересует услуга ${slotHair}, но для мужчины или для женщины?`
            return SmartResponse({utterance: response, nextState: 'whatinterest'})
        } else if ((! slotHair && sex  && event.utteranceCounter < 5)) {
            const response = `Вас интересует услуга ${sex}, но какая именно?`
            return SmartResponse({utterance: response, nextState: 'whatinterest'})
        } else if ((! slotHair && ! sex  && event.utteranceCounter < 5)) {
            const response = `Вы не назвали тип услуги. Скажите, пожалуйста, что вас интересует`
            return SmartResponse({utterance: response, nextState: 'whatinterest'})
        } else if (event.utteranceCounter < 5) {
        return SmartResponse({ utterance: reAskingPhrases[event.utteranceCounter - 1], listen: true })
      } else {
        return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
      }
    },

});


addState({
  name: 'table',
  onEnter:async(event)=>{
    event.utteranceCounter = 1
    if (event.intent === 'repeat') {
          return SmartResponse({utterance: lastUtterance, listen: true})
        }
    if (event.intent === 'no' || event.intent === 'stop') {
      return SmartResponse({utterance: `Хорошо, давайте вернемся к вопросу, что вас интересует. Спрашивайте`, nextState: 'whatinterest'})
    }
    if (sex === 'мужская') {
      response = 'У нас представлены: первая стрижка, стрижка, стрижка бороды и усов, моделирование бороды и усов, стрижка плюс стрижка бороды и усов, стрижка машинкой, восковое удаление волос, окантовка и укладка, тонировка бороды и усов. Что-то желаете?'
      return SmartResponse({utterance: response, nextState: 'whatinterest'})
    } else if (sex === 'женская'){
      response = 'У нас представлены: первая стрижка, первая стрижка ниже плеч, стрижка машинкой, стрижка, стрижка волос ниже плечь, стрижка кончиков волос, трижка челки, мытье волос, мытье волос ниже плеч. Что-то желаете?'
      return SmartResponse({utterance: response, nextState: 'whatinterest'})
      } else if (! sex){
            return SmartResponse({utterance: 'Вас интересует услуга для мужчин или для женщин?', listen: true})
      } else if (event.utteranceCounter < 5) {
        return SmartResponse({ utterance: reAskingPhrases[event.utteranceCounter - 1], listen: true })
      } else {
        return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
      }
  },
  onUtterance:async(event)=>{
    if (event.entities.sex) {
          sex = event.entities.sex[0].value
    }
    if (event.entities.haircut) {
      slotHair = event.entities.haircut[0].value
    }
    return SmartResponse({ nextState: 'table' })
  }
});



addState({
  name: 'cost',
  onEnter:async(event)=>{
    event.utteranceCounter = 1
    if (event.intent === 'repeat') {
          return SmartResponse({utterance: lastUtterance, listen: true})
        }
    if (event.intent === 'no' || event.intent === 'stop') {
      return SmartResponse({utterance: `Хорошо, давайте вернемся к вопросу, что вас интересует. Спрашивайте`, nextState: 'whatinterest'})
    }
    if (slotHair && sex === 'мужская') {
            if (slotHair.includes('плеч') || slotHair.includes('кончиков') || slotHair.includes('челки')) {
              slotHair = null
              sex = null
              return SmartResponse({utterance: 'Это женская услуга, повторите заново, пожалуйста', listen: true})
            } else {
              price = cost[slotHair]
              return SmartResponse({utterance: `Цена данной прически ${price} рублей. Хотите эту услугу?`, nextState: 'yes_or_no'})
            }
      } else if (slotHair && sex === 'женская'){
            if (slotHair.includes('бороды') || slotHair.includes('окантовка') || slotHair.includes('тонировка')) {
              slotHair = null
              sex = null
              return SmartResponse({utterance: 'Это мужская услуга, повторите заново, пожалуйста', listen: true})
            } else {
              price = cost[slotHair]
              return SmartResponse({utterance: `Цена данной прически ${price} рублей. Хотите эту услугу?`, nextState: 'yes_or_no'})
            }
      } else if (! sex){
            return SmartResponse({utterance: 'Вас интересует услуга для мужчин или для женщин?', listen: true})
      } else if (! slotHair) {
            return SmartResponse({utterance: 'Назовите вид услуги, пожалуйста', listen: true})
      } else if (event.utteranceCounter < 5) {
        return SmartResponse({ utterance: reAskingPhrases[event.utteranceCounter - 1], listen: true })
      } else {
        return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
      }
  },
  onUtterance:async(event)=>{
    if (event.entities.sex) {
          sex = event.entities.sex[0].value
    }
    if (event.entities.haircut) {
      slotHair = event.entities.haircut[0].value
    }
    return SmartResponse({ nextState: 'cost' })
  }
});



addState({
  name: 'yes_or_no',
  onEnter: async (event) => {
    return SmartResponse({listen: true});
  },
  onUtterance:async(event)=>{
    if (event.intent === 'repeat') {
          return SmartResponse({utterance: lastUtterance, listen: true})
        }
    if (event.intent === 'yes') {
      if (event.entities.systemPerson || event.entities.systemTime) {
        fillFormData(form, event.entities)
        return SmartResponse({utterance: 'Отлично!', nextState: 'appointment'})
      }
      fillFormData(form, event.entities)
      return SmartResponse({utterance: 'Отлично! Давайте уточним подробности.', nextState: 'appointment'})
    } else if (event.intent === 'no') {
      slotHair = null
      sex = null
      return SmartResponse({utterance: 'Хорошо, я вас слушаю. Что бы вы хотели?', nextState: 'whatinterest'})
    } else if (event.utteranceCounter < 4) {
      return SmartResponse({ utterance: reAskingPhrases[event.utteranceCounter - 1], listen: true })
      } else {
        return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
    }
  },
});

addState({
  name: 'appointment',
  onEnter: async (event) => {
    const {status, utterance} = checkFormState(form)
    if (utterance) {
      return SmartResponse({utterance: utterance, listen: true})
    } else {
      if (status === 'done') {
        Logger.write(`${form.name.value} ${form.appointmentDate.value}`) /* send collected data to log */
        return SmartResponse({nextState: 'confirm'})
      } else {
        Logger.write('failed')
        return SmartResponse({utterance: 'Прошу прощения, я не справился, перевожу на орератора', nextState: 'operator'})
      }
    }
  },
  onUtterance: async (event) => {
    /* add handling for intents, which are appropriate in the middle of slot filling */
    if (event.intent === 'no' || event.intent === 'stop') {
      cleanFormData(form)
      return SmartResponse({utterance: `Понял, перехожу на шаг назад, я правильно понял, что вас интересует услуга ${sex}, ${slotHair}?`, nextState: 'yes_or_no'})
    } else if (event.intent === 'operator') {
        return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
    } else if (event.intent === 'repeat') {
        return SmartResponse({utterance: lastUtterance, listen: true})
    }
    fillFormData(form, event.entities)
    return SmartResponse({nextState: 'appointment'}) /* go back to the same state and check if form is finally filled */
  },
});

addState({
  name: 'confirm',
    onEnter: async (event) => {
      Logger.write(`${form.name.value} ${form.appointmentDate.value}`) /* send collected data to log */
      pleasureDateTime = DateTimeToVoice(form.appointmentDate.value)
      return SmartResponse({utterance: `Спасибо! Все ли верно? Вы записались на ${pleasureDateTime} на ${sex} ${slotHair} на имя ${form.name.value}, ваш номер ${strOfNumbers}`, listen: true})
  },
  onUtterance: async (event) => {
    /* add handling for intents, which are appropriate in the middle of slot filling */
    if (event.intent === 'repeat') {
          return SmartResponse({utterance: lastUtterance, listen: true})
        }
    if (event.intent === 'yes') {
      return SmartResponse({utterance: 'Благодарим за запись! Хорошего времени суток! До свидания!', nextState: 'final'}) /* go back to the same state and check if form is finally filled */
    } else if (event.intent === 'no') {
      slotHair = null
      sex = null
      return SmartResponse({utterance: 'Прошу прощения, давайте начнем сначала. Что бы вы хотели?', nextState: 'whatinterest'}) /* go back to the same state and check if form is finally filled */
    } else if (utteranceCounter > 3) {
      return SmartResponse({ utterance: reAskingPhrases[event.utteranceCounter - 1], listen: true })
      } else {
        return SmartResponse({ utterance: 'Прошу меня простить, я не справился, перевожу на оператора', nextState: 'operator' })
    }
  },
});



addState({
  name: 'final',
  onEnter: async (event) => {
    /* Заканчиваем диалог*/
    return SmartResponse({ isFinal: true });
  },
});

/* Делаем 'start' начальным состоянием нашего диалога */
setStartState('start');