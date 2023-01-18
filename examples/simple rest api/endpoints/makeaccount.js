const webserver = require('rjweb-server')
const accounts = new Map()

module.exports = {
  type: webserver.types.post,
  path: '/makeaccount',

  async code(ctr) {
    if (!ctr.body) return ctr.print({ error: true, msg: 'Body not found!' })
    if (!('username' in ctr.body)) return ctr.print({ error: true, msg: 'Username missing!' })
    if (!('password' in ctr.body)) return ctr.print({ error: true, msg: 'Password missing!' })

    accounts.set(ctr.body.username, {
      password: ctr.body.password,
      creation: Math.floor(+new Date() / 1000)
    })

    ctr.print({ error: false, msg: 'Account created successfully!' })
    return console.log(accounts)
  }
}