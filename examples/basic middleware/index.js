module.exports = () => /** @type {import('rjweb-server').Middleware} */ ({
  name: 'my-middleware',

  code: (ctr, ctx, ctg) => {
    ctr.printEmpty = () => {
      ctx.content = ''

      return ctr
    }
  }
})