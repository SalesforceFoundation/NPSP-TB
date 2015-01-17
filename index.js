var Twit = require('twit')

var T = new Twit({

})

//
//  tweet 'hello world!'
//
T.post('statuses/update', { status: 'I am alive!' }, function(err, data, response) {
  console.log(data)
})
