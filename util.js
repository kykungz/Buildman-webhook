module.exports.getImage = async (client, event) => {
  const stream = await client.getMessageContent(event.message.id)
  return new Promise((resolve, reject) => {
    let bufs = []
    stream.on('data', (chunk) => { bufs.push(chunk) })
    stream.on('error', (err) => { reject(err) })
    stream.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'))
    })
  })
}

module.exports.feature = async (name, { fail, onFail, onSuccess }) => {
  if (fail && fail()) { onFail() }
  // success
  onSuccess()
}
