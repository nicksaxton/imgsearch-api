var express = require('express')

var app = express()

app.set('port', (process.env.PORT || 8080))


app.get('/', function (req, res) {
    var headerInfo = {
        'ipaddress': req.headers['x-forwarded-for'],
        'language': req.headers['accept-language'].split(',')[0],
        'software': req.headers['user-agent'].split('(')[1].split(')')[0]
    }
    
    res.send(JSON.stringify(headerInfo))
})

app.listen(app.get('port'), function () {
  console.log('Example app listening on port ' + app.get('port') + '!')
})
