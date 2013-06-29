/* 
** (C)Copyright 2012-2013 Paul Reiber
**
**    This file is part of the application "story".
**
**    "story" is free software: you can redistribute it and/or modify
**    it under the terms of the GNU General Public License as published by
**    the Free Software Foundation, either version 3 of the License, or
**    (at your option) any later version.
**
**    "story" is distributed in the hope that it will be useful,
**    but WITHOUT ANY WARRANTY; without even the implied warranty of
**    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
**    GNU General Public License for more details.
**
**    You should have received a copy of the GNU General Public License
**    along with "story".  If not, see <http://www.gnu.org/licenses/>.
**
*/

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

    // initial db populator
    var timestamp = (new Date()).getTime();
    for (var i = 0; i < data.length; i++) {
      var story_id = Stories.insert({name: data[i].name});
      for (var j = 0; j < data[i].contents.length; j++) {
        var info = data[i].contents[j];
        Paragraphs.insert({story_id: story_id, text: info[0], timestamp: timestamp, tags: info.slice(1)});
        timestamp += 1;
      }
    }
  }
});
