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

// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Stories = new Meteor.Collection("stories");
Paragraphs = new Meteor.Collection("paragraphs");

// ID of currently selected story
Session.set('story_id', null);

// Name of currently selected tag for filtering
Session.set('tag_filter', null);

// When adding tag to a para, ID of the para
Session.set('editing_addtag', null);

// When editing a story name, ID of the story
Session.set('editing_storyname', null);

// When editing para text, ID of the para
Session.set('editing_itemname', null);


// Subscribe to 'stories' collection on startup.
// Select a story once data has arrived.
Meteor.subscribe('stories', function () {
  if (!Session.get('story_id')) {
    var story = Stories.findOne({}, {sort: {name: 1}});
    if (story)
      Router.setStory(story._id);
  }
});

// Always be subscribed to the paragraphs for the selected story.
Meteor.autosubscribe(function () {
  var story_id = Session.get('story_id');
  if (story_id)
    Meteor.subscribe('paragraphs', story_id);
});


////////// Helpers for textarea editing //////////

// textarea resizer adapted from approach given by Alsciende on SO
var resizeTA = function(ta){
    if (ta == document.getElementById("new-para") ||
       (ta == document.getElementById("para-input"))) {
	    ta.style.height = "1px";
	    ta.style.height = (18+ta.scrollHeight)+"px"; //original said 25+ta...
    }
}

// routine to clear away the initial text
var resetTA = function(ta){
    if (ta.defaultValue==ta.value) { ta.value="" };
}

////////// Helpers for in-place editing //////////


// Returns an event_map key for attaching "ok/cancel" events to
// a text input (given by selector)
var okcancel_events = function (selector) {
  return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};

// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
var make_okcancel_handler = function (options) {
  var ok = options.ok || function () {};
  var cancel = options.cancel || function () {};

  return function (evt) {

    var shift = evt.modifiers ? (evt.modifiers & Event.SHIFT_MASK) : evt.shiftKey;

    if (evt.type === "keyup") resizeTA(evt.target);

    if (evt.type === "keydown" && evt.which === 27) {
      // escape = cancel
      cancel.call(this, evt);

    } else if (evt.type === "keyup" && evt.which === 13 && !shift ||
               evt.type === "xfocusout") {   // HACK - add/remove x for debugging
      // blur/return/enter = ok/submit if non-empty
      var value = String(evt.target.value || "");
      if (value ) 
        ok.call(this, value, evt);
      else
        cancel.call(this, evt);
    };
  };
};

// Finds a text input in the DOM by id and focuses it.
var focus_field_by_id = function (id) {
  var input = document.getElementById(id);
  if (input) {
    input.focus();
    //input.select();
  }
};

////////// Stories //////////

Template.stories.stories = function () {
  return Stories.find({}, {sort: {name: 1}});
};

Template.stories.events = {
  'click .destroy': function () {
    if (Paragraphs.findOne({story_id: this._id}) && !confirm("Story has paragraphs.  Are you sure?")) return; 
    Paragraphs.remove({story_id: this._id});
    Stories.remove(this._id);
    Router.setStory(Stories.findOne({}, {sort: {name: 1}})._id);
  },
  // 'mousedown .story-name': function (evt) { // select story
  'click .story-name': function (evt) { // select story
    //alert("mousedown this._id="+this._id);
    Router.setStory(this._id);
  },
  'dblclick .story-name': function (evt) { // start editing story name
    Session.set('editing_storyname', this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    focus_field_by_id("story-name-input");
  }
};

Template.stories.events[ okcancel_events('#story-name-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      value=value.trim();
      if (value != "")
         Stories.update(this._id, {$set: {name: value}});
      Session.set('editing_storyname', null);
    },
    cancel: function () {
      Session.set('editing_storyname', null);
    }
  });

// Attach events to keydown, keyup, and blur on "New story" input box.
Template.stories.events[ okcancel_events('#new-story') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      text = text.trim();
      if (text == "") return;
      var id = Stories.insert({name: text});
      Router.setStory(id);
      evt.target.value = "";
    }
  });

Template.stories.selected = function () {
  //alert("story_id="+Session.get('story_id')+" and this._id="+this._id);
  return Session.equals('story_id', this._id) ? 'selected' : '';
};

Template.stories.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.stories.editing = function () {
  return Session.equals('editing_storyname', this._id);
};

////////// Paragraphs //////////

Template.paragraphs.any_story_selected = function () {
  return !Session.equals('story_id', null);
};

Template.paragraphs.events = {};

Template.paragraphs.events[ okcancel_events('#new-para') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      text = text.trim();
      if (text != '') {
	  var tag = Session.get('tag_filter');
	  Paragraphs.insert({
	    text: text.trim(),
	    story_id: Session.get('story_id'),
	    done: false,
	    timestamp: (new Date()).getTime(),
	    tags: tag ? [tag] : []
	  });
	}
	evt.target.value = '';
    }
  });

Template.paragraphs.paragraphs = function () {
  // Determine which paragraphs to display in main pane,
  // selected based on story_id and tag_filter.

  var story_id = Session.get('story_id');
  if (!story_id)
    return {};

  var sel = {story_id: story_id};
  var tag_filter = Session.get('tag_filter');
  if (tag_filter)
    sel.tags = tag_filter;

  return Paragraphs.find(sel, {sort: {timestamp: 1}});
};

Template.para_item.tag_objs = function () {
  var para_id = this._id;
  return _.map(this.tags || [], function (tag) {
    return {para_id: para_id, tag: tag};
  });
};

Template.para_item.done_class = function () {
  return this.done ? 'done' : '';
};

Template.para_item.done_checkbox = function () {
  return this.done ? 'checked="checked"' : '';
};

Template.para_item.editing = function () {
  return Session.equals('editing_itemname', this._id);
};

Template.para_item.adding_tag = function () {
  return Session.equals('editing_addtag', this._id);
};

Template.para_item.events = {
  'click .check': function () {
    Paragraphs.update(this._id, {$set: {done: !this.done}});
  },

  'click .destroy': function () {
    Paragraphs.remove(this._id);
  },

  'click .addtag': function (evt) {
    Session.set('editing_addtag', this._id);
    Meteor.flush(); // update DOM before focus
    focus_field_by_id("edittag-input");
  },

  'dblclick .display .para-text': function (evt) {
    Session.set('editing_itemname', this._id);
    Meteor.flush(); // update DOM before focus
    focus_field_by_id("para-input");
    resizeTA(document.getElementById("para-input"));
  },

  'click .remove': function (evt) {
    var tag = this.tag;
    var id = this.para_id;

    evt.target.parentNode.style.opacity = 0;
    // wait for CSS animation to finish
    Meteor.setTimeout(function () {
      Paragraphs.update({_id: id}, {$pull: {tags: tag}});
    }, 300);
  }

};

Template.para_item.events[ okcancel_events('#para-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      Paragraphs.update(this._id, {$set: {text: value}});
      Session.set('editing_itemname', null);
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  });

Template.para_item.events[ okcancel_events('#edittag-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      value = value.trim();
      if (value != "") 
         Paragraphs.update(this._id, {$addToSet: {tags: value}});
      Session.set('editing_addtag', null);
    },
    cancel: function () {
      Session.set('editing_addtag', null);
    }
  });

////////// Tag Filter //////////


// Pick out the unique tags from all paragraphs in current story.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Paragraphs.find({story_id: Session.get('story_id')}).forEach(function (para) {
    _.each(para.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (! tag_info)
        tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });

  tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
  tag_infos.unshift({tag: null, count: total_count});

  return tag_infos;
};

Template.tag_filter.tag_text = function () {
  return this.tag || "All paragraphs";
};

Template.tag_filter.selected = function () {
  return Session.equals('tag_filter', this.tag) ? 'selected' : '';
};

Template.tag_filter.events = {
  'mousedown .tag': function () {
    if (Session.equals('tag_filter', this.tag))
      Session.set('tag_filter', null);
    else
      Session.set('tag_filter', this.tag);
  }
};

////////// Tracking selected story in URL //////////

var ParagraphsRouter = Backbone.Router.extend({
  routes: {
    ":story_id": "main"
  },
  main: function (story_id) {
    Session.set("story_id", story_id);
    Session.set("tag_filter", null);
  },
  setStory: function (story_id) {
    //alert("setStory story_id="+story_id);
    this.navigate(story_id, true);
  }
});

Router = new ParagraphsRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

