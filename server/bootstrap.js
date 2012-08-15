// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
  if (Stories.find().count() === 0) {
    var data = [
      {name: "Short Story",
       contents: [
         ["Once upon a time", "beginning"],
         ["In a land far far away", "middle"],
         ["Where nobody smoked", "middle"],
         ["And nobody drank", "middle"],
         ["And nobody cussed", "middle"],
         ["Our hero, desperate for some entertainment", "middle"],
         ["Died.", "end"]
       ]
      },
      {name: "Another story",
       contents: [
         ["Once upon a time", "beginning"],
         ["In a land not so far far away", "middle"],
         ["Where nobody smoked", "middle"],
         ["And nobody cussed", "middle"],
         ["And nobody drank", "middle"],
         ["Our hero, desperate for some entertainment", "middle"],
         ["Went to see a movie.", "end"]
       ]
      }
    ];

    var timestamp = (new Date()).getTime();
    for (var i = 0; i < data.length; i++) {
      var story_id = Stories.insert({name: data[i].name});
      for (var j = 0; j < data[i].contents.length; j++) {
        var info = data[i].contents[j];
        Paragraphs.insert({story_id: story_id,
                      text: info[0],
                      timestamp: timestamp,
                      tags: info.slice(1)});
        timestamp += 1; // ensure unique timestamp.
      }
    }
  }
});
