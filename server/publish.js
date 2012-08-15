// Stories -- {name: String}
Stories = new Meteor.Collection("stories");

// Publish complete set of stories to all clients.
Meteor.publish('stories', function () {
  return Stories.find();
});


// Paragraphs -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           story_id: String,
//           timestamp: Number}
Paragraphs = new Meteor.Collection("paragraphs");

// Publish all items for requested story_id.
Meteor.publish('paragraphs', function (story_id) {
  return Paragraphs.find({story_id: story_id});
});

