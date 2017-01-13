var express = require('express')
var google = require('googleapis');
var mongo = require('mongodb').MongoClient
var path = require('path')


var app = express()
var customsearch = google.customsearch('v1');


var url = process.env.MONGOLAB_URI

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'))
})

app.get('/imagesearch/:search', function (req, res) {
  var offset = 1
  
  if (req.query.offset && parseInt(req.query.offset) > 0) {
    offset = parseInt(req.query.offset)
  }

  customsearch.cse.list({ cx: process.env.GOOGLE_CX, q: req.params.search, auth: process.env.GOOGLE_APIKEY, searchType: 'image', start: offset }, function (err, resp) {
    if (err) {
      return console.log('An error occured', err)
    }
    
    mongo.connect(url, function (err, db) {
      if (err) {
        console.log(err)
      }
      else {
        var collection = db.collection('recent')
        
        var searchObj = {
          term: req.params.search,
          when: (new Date()).toISOString()
        }
        
        collection.insert([searchObj], function (err, r) {
          if (err) {
            console.log(err)
          }
          else {
            console.log("Successfully inserted")
          }
          
          db.close()
        })
      }
    })
    
    if (resp.items && resp.items.length > 0) {
      var results = []
      
      for (var i = 0; i < 10; i++) {
        var resObj = {
          url: resp.items[i].link,
          snippet: resp.items[i].snippet,
          thumbnail: resp.items[i].image.thumbnailLink,
          context: resp.items[i].image.contextLink
        }
        
        results.push(resObj)
      }
      
      res.send(JSON.stringify(results))
    }
  })
})

app.get('/latest', function (req, res) {
  mongo.connect(url, function (err, db) {
    if (err) {
      console.log(err)
    }
    else {
      var collection = db.collection('recent')
      
      collection.find({}, {"sort" : [['when', 'desc']], "limit" : 10} ).toArray(function(err,docs) {
        if (err) {
          console.log(err)
        }
        else {
          var results = []
          
          for (var i = 0; i < docs.length; i++) {
            var resultObj = {
              term: docs[i].term,
              when: docs[i].when
            }
            
            results.push(resultObj)
          }
          
          res.send(JSON.stringify(results))
        }
        
        db.close()
      })
    }
  })
})

app.set('port', (process.env.PORT || 8080))

app.listen(app.get('port'), function () {
  console.log('Example app listening on port ' + app.get('port') + '!')
})
