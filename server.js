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
              "label": "รถไฟฟ้าสายสีชมพู",
              "text": "รถไฟฟ้าสายสีชมพู"
            }, {
              "type": "message",
              "label": "รถไฟฟ้าสายสีส้ม",
              "text": "รถไฟฟ้าสายสีส้ม"
            }, {
              "type": "message",
              "label": "ทางด่วนถนนรัดเกล้า",
              "text": "ทางด่วนถนนรัดเกล้า"
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
          text: `
🚧 ประกาศ 🚧

ขณะนี้กำลังมีการขุดเจาะถนน ตั้งแต่เวลา22:00-00:00น.⛏
กรุณาเลี่ยงเส้นทางที่ผ่านถนนเส้นนี้ ขอบคุณครับ🙏🏻
`.trim(),
        }
      ])
    }, 8000)
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `
คุณได้ติดตามโครงการ รถไฟฟ้าสายสีส้ม เป็นที่เรียบร้อยครับ 🤗
`.trim()
    }])
  }

  if (event.message.type === 'image' || event.message.text === 'report') {
    step = 'report'
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `
📎 ได้รับรูปภาพแล้ว
กรุณากรอกรายละเอียดเพิ่มเติมด้วยนะครับ 😊
`.trim()
    }])
  }

  if (step === 'report') {
    step = null
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `
📝 บันทึกข้อความเรียบร้อย!

ขอบคุณที่ช่วยรายงานเหตุการณ์เพื่อประโยชน์ต่อทุกคนในสังคมนะคับ 😇
`.trim()
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
    return client.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: `
📃รายละเอียดโครงการรถไฟฟ้าสายสีส้ม

โครงสร้างรถไฟฟ้าแบบยกระดับระยะทาง 9 กม. สถานียกระดับ 7 สถานี และโครงสร้างรถไฟฟ้าแบบใต้ดินระยะทาง 30.6 กม. สถานีใต้ดิน 23 สถานี (รวม 39.6 กม. 30 สถานี)
`.trim()
      },
      {
        "type": "image",
        "originalContentUrl": "https://f.ptcdn.info/921/041/000/o5vianlidi6I2pTPhcN-o.jpg",
        "previewImageUrl": "https://f.ptcdn.info/921/041/000/o5vianlidi6I2pTPhcN-o.jpg"
      },
    ])
  }

  if (event.message.text === '*ความคืบหน้า') {
    step = null
    return client.replyMessage(event.replyToken, [{
      type: 'text',
      text: `
✉️ การดำเนินการล่าสุด:

เมื่อคืนวันที่ 18 พฤษภาคม ได้มีการเจาะเสาเข็ม บริเวณ สถานีมีนบุรี

📆การดำเนินการปัจจุบัน: ณ ขณะนี้ยังไม่มีการก่อสร้างเพิ่มเติมทุกสถานี

🎉ภาพรวม: โครงการแล้วเสร็จไป 46%
`.trim()
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
