const express = require('express')
const line = require('@line/bot-sdk')
const axios = require('axios')
const firebase = require('./firebase')
const keywords = require('./keywords')
const { getImage } = require('./util')
const visionAPI = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyCOLw7yAvDHhXa1_FdoFD6QzXEooESleo8'
const translateAPI = 'https://translation.googleapis.com/language/translate/v2?key=AIzaSyCOLw7yAvDHhXa1_FdoFD6QzXEooESleo8'

const config = {
  channelAccessToken: 'CTko6aT0ooka5oylc6uU9d2MvFdWDG7aThf4YwRlJnVuTA2z3BENzjUGrCFBr4DASn0K/3I3XIO8lhXcIeRu3+T7R99G9c1O+bTEFGmF+UOhlIT63P4lPcEPbKVRNkC959HM9j2LjTvpzXIBIVj9AwdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'aa2b4e251b7872c3c2ca581deb706a1e'
}

const client = new line.Client(config)

const app = express()

app.get('/', (req, res) => {
    res.send({
      msg: 'hello from home page'
    })
})

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
})

let stages = []
let users = {}

const match = (text, keywords) => {
  return keywords.some(keyword => text.includes(keyword))
}

let step = null
// let step = 'subscribe'

async function handleEvent(event) {
  console.log(event)
  if (event.type !== 'message') { //|| event.message.type !== 'text') {
    return Promise.resolve(null)
  }
  // subscribe
  if (event.message.type === 'location' || event.message.text === 'sub') {
    step = 'subscribe'
    return client.replyMessage(event.replyToken, [
      {
        "type": "template",
        "altText": "เลือกติดตามโครงการ",
        "template": {
          "type": "buttons",
          "title": "เลือกติดตามโครงการ",
          "text": "กรุณาเลือกโครงการที่ต้องการติดตาม",
          "defaultAction": {
            "type": "uri",
            "label": "View detail",
            "uri": "http://example.com/page/123"
          },
          "actions": [
            {
              "type": "message",
              "label": "รถไฟฟ้าสายสีม่วง",
              "text": "รถไฟฟ้าสายสีม่วง"
            }, {
              "type": "message",
              "label": "เขื่อนซุปเปอร์ไซย่าบุรี",
              "text": "เขื่อนซุปเปอร์ไซย่าบุรี"
            }, {
              "type": "message",
              "label": "ทัชมาฮาลลล",
              "text": "ทัชมาฮาลลล"
            }
          ]
        }
      }
    ])
  }

  if (step === 'subscribe') {
    step = null
    setTimeout(() => {
      client.multicast([event.source.userId], [
        {
          type: 'text',
          text: `🚧‍อัพเดทความคืบหน้า🚧\n\nเขื่อนแตกละโว้ยยยยยยยยย\nหนีๆๆๆๆๆๆ`,
        }
      ])
    }, 8000)
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: 'ติดตามเรียบโร้ยยยย'
    }])
  }

  if (event.message.type === 'image' || event.message.text === 'report') {
    step = 'report'
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: 'ได้รับรูปภาพแล้ว\nกรุณากรอกรายละเอียดเพิ่มเติม'
    }])
  }

  if (step === 'report') {
    step = null
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: 'บันทึกเสดละ มีไรอีกปะ รำคาญ'
    }])
  }

  if (event.message.text === '*สภาพมลภาวะ') {
    step = null
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `
รายงานสภาพมลภาวะ

O3: 3 ppb
CO: 0.53 ppm
NO3: 1 ppb
SO2: 1 ppb
ละอองฝุ่น (PM 2.5): 42
ดัชนีคุณภาพอากาศ (AQI): 52

สรุป: มีฝุ่นละอองเล็กน้อย ไม่เป็นอันตรายคับป๋ม
`.trim()
    }])
  }

  if (event.message.text === '*รายละเอียด') {
    step = null
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `รายละเอียดโครงการ\n`
    }])
  }

  if (event.message.text === '*ความคืบหน้า') {
    step = null
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `การดำเนินการล่าสุด:\nการดำเนินการปัจจุบัน:\nภาพรวม:\n`
    }])
  }

  if (event.message.text === '*ติดตาม') {
    return Promise.resolve(null)
  }

  if (event.message.text === '*แจ้งเหตุ') {
    return Promise.resolve(null)
  }

  return Promise.resolve(null)

  return client.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: 'คืออะไรหรอครับ? ผมไม่เข้าใจ'
    }
  ])

  return client.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: event.message.text
    }
  ])
}

app.listen(process.env.PORT || 8000)
