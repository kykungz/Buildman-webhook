
  console.log(event)
  users[event.source.userId] = true
  console.log(users)

  const user = stages.find(userx => userx.userId === event.source.userId) || {}

  // reset
  if (event.message.text === 'reset') {
    stages = stages.filter(stage => stage.userId !== user.userId)
    return client.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: `Reset เรียบร้อย`
      }
    ])
  }

  // Printing
  if (user.stage === 'printing') {
    if (event.message.type !== 'image') {
      stages = stages.filter(stage => stage.userId !== user.userId)
    } else {
      const base64 = await getImage(client, event)
      let { data } = await axios.post(visionAPI, {
        "requests":[
          {
            "image":{
              "content": base64
            },
            "features":[
              {
                "type":"LABEL_DETECTION",
                "maxResults":6
              }
            ]
          }
        ]
      })
      console.log(data.responses[0].labelAnnotations.map(item => item.description))

      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `ได้รับรูป ${data.responses[0].labelAnnotations[0].description} แล้ว`
        }
      ])
    }
  }

  if (user.stage === 'carstamp') {
    if (event.message.type !== 'image') {
      stages = stages.filter(stage => stage.userId !== user.userId)
    } else {
      const base64 = await getImage(client, event)
      let { data } = await axios.post(visionAPI, {
        "requests":[
          {
            "image":{
              "content": base64
            },
            "features":[
              {
                "type":"TEXT_DETECTION"
              }
            ]
          }
        ]
      })
      let text = data.responses[0].textAnnotations.reduce((acc, cur) => acc + ' ' + cur.description, '')
      console.log(text)
      let matched = text.match(/(สกุล)(.*)(Name)/g)[0]
      let name = matched.substring(5, matched.length - 5)

      stages = stages.filter(stage => stage.userId !== user.userId)

      client.multicast(Object.keys(users), [ //.filter(key => key !== event.source.userId), [
        {
          type: 'text',
          text: `${name} แลกบัตรเข้ามาจอดรถที่ห้องของคุณ`,
        },
        {
          type: 'text',
          text: `กรุณากดที่ลิงค์นี้เพื่อ Stamp บัตรจอดรถ http://www.freepngimg.com/download/stamp/7-2-certified-stamp-picture.png`,
        }
      ])

      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `${name} เข้ามาจอดรถห้อง 203`
        }
      ])
    }
  }

  if (user.stage === 'checkin') {
    if (event.message.type !== 'image') {
      stages = stages.filter(stage => stage.userId !== user.userId)
    } else {
      const base64 = await getImage(client, event)
      let { data } = await axios.post(visionAPI, {
        "requests":[
          {
            "image":{
              "content": base64
            },
            "features":[
              {
                "type":"FACE_DETECTION",
                "maxResults":6
              }
            ]
          }
        ]
      })

      const joy = data.responses[0].faceAnnotations[0].joyLikelihood
      if (joy === 'VERY_LIKELY' || joy === 'LIKELY') {
        // smiling
        stages = stages.filter(stage => stage.userId !== user.userId)
        firebase.database().ref('/siri/approved').push({
          image: buffer.toString('base64'),
          date: firebase.database.ServerValue.TIMESTAMP
        })
        return client.replyMessage(event.replyToken, [
          {
            type: 'text',
            text: `Check-in เรียบร้อย! ขอให้มีความสุขกับการทำงานครับ!`
          }
        ])
      } else {
        // not smiling
        firebase.database().ref('/siri/declined').push({
          image: buffer.toString('base64'),
          date: firebase.database.ServerValue.TIMESTAMP
        })
        return client.replyMessage(event.replyToken, [
          {
            type: 'text',
            text: `ยิ้มกว้างๆกว่านี้หน่อยน่าาาาา`
          }
        ])
      }
    }
  }

  console.log(user)

  // No stages yet
  if (!user.stage) {
    if (event.message.type === 'image') {
      const base64 = await getImage(client, event)
      let { data } = await axios.post(visionAPI, {
        "requests":[
          {
            "image":{
              "content": base64
            },
            "features":[
              {
                "type":"LABEL_DETECTION",
                "maxResults":6
              }
            ]
          }
        ]
      })
      console.log(data.responses[0].labelAnnotations.map(item => item.description))
      let label = data.responses[0].labelAnnotations[0].description
      let res = await axios.post(translateAPI, {
        'q': label,
        'source': 'en',
        'target': 'th',
        'format': 'text'
      })
      let labelTH = res.data.data.translations[0].translatedText

      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `ส่งรูป ${labelTH} มาทำไมหรอครับ?`
        }
      ])
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `แหม ส่งรูปไรมาครับเนี่ย`
        }
      ])
    }
    // hungryCH
    if (match(event.message.text, keywords.hungryCH)) {
      // return Promise.resolve(null)
      return client.replyMessage(event.replyToken, [
        {
          type: "text",
          text: `你要吃甚么 🍜 ?`
        },
        {
          "type": "template",
          "altText": "this is a carousel template",
          "template": {
              "type": "carousel",
              "columns": [
                  {
                    "thumbnailImageUrl": "https://i.ytimg.com/vi/5AYejifBhbg/hqdefault.jpg",
                    "imageBackgroundColor": "#FFFFFF",
                    "title": "面条",
                    "text": "没有味精的美味面条配上菊花",
                    "defaultAction": {
                        "type": "uri",
                        "label": "View detail",
                        "uri": "http://example.com/page/123"
                    },
                    "actions": [
                        {
                            "type": "postback",
                            "label": "Order",
                            "data": "action=buy&itemid=111"
                        },
                        {
                            "type": "uri",
                            "label": "View detail",
                            "uri": "http://example.com/page/111"
                        }
                    ]
                  },
                  {
                    "thumbnailImageUrl": "https://nongployeiei.files.wordpress.com/2015/08/maxresdefault.jpg",
                    "imageBackgroundColor": "#000000",
                    "title": "猪腿",
                    "text": "德国猪肉腿直奔巴黎。",
                    "defaultAction": {
                        "type": "uri",
                        "label": "View detail",
                        "uri": "http://example.com/page/222"
                    },
                    "actions": [
                        {
                            "type": "postback",
                            "label": "Order",
                            "data": "action=buy&itemid=222"
                        },
                        {
                            "type": "uri",
                            "label": "View detail",
                            "uri": "http://example.com/page/222"
                        }
                    ]
                  }
              ],
              "imageAspectRatio": "rectangle",
              "imageSize": "cover"
          }
        }
      ])
    }

    // printing
    if (match(event.message.text, keywords.printing)) {
      stages.push({
        userId: event.source.userId,
        stage: 'printing'
      })
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: 'ฝากปริ้นท์หรอ? ส่งรูปมาได้เลย!'
        }
      ])
    }
    // greeting
    if (match(event.message.text, keywords.greeting)) {
      const { displayName } = await client.getProfile(event.source.userId)
      return client.replyMessage(event.replyToken, [
        {
          "type": "image",
          "originalContentUrl": "https://image.winudf.com/v2/image/Y29tLmdvb2QueG94bzYzX3NjcmVlbnNob3RzXzFfN2FjNzkyYmU/screen-1.jpg?h=355&fakeurl=1&type=.jpg",
          "previewImageUrl": "https://image.winudf.com/v2/image/Y29tLmdvb2QueG94bzYzX3NjcmVlbnNob3RzXzFfN2FjNzkyYmU/screen-1.jpg?h=355&fakeurl=1&type=.jpg"
        },
        {
          type: 'text',
          text: `สวัสดีตอนเช้าครับคุณ ${displayName.trim()}`
        }
      ])
    }

    // checkin
    if (match(event.message.text, keywords.checkin)) {
      stages.push({
        userId: event.source.userId,
        stage: 'checkin'
      })
      let { displayName } = await client.getProfile(event.source.userId)
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `สวัสดีตอนเช้าครับ ยืนยันความพร้อมในการทำการด้วยการ ยิ้ม😄 !`
        }
      ])
    }

    // carstamp
    if (match(event.message.text, keywords.carstamp)) {
      stages.push({
        userId: event.source.userId,
        stage: 'carstamp'
      })
      let { displayName } = await client.getProfile(event.source.userId)
      return client.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: `ถ่ายรูปบัตรประจำตัวผู้เข้ามาด้วยครับ`
        }
      ])
    }
  }
  // translate
  // let { data } = await axios.post(translateAPI, {
  //   'q': event.message.text,
  //   'source': 'th',
  //   'target': 'en',
  //   'format': 'text'
  // })
  // console.log(data.data.translations[0].translatedText)
