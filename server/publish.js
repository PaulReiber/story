/* 
** (C)Copyright 2012 Paul Reiber
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

// Publish names and ids of all stories
Stories = new Meteor.Collection("stories");
Meteor.publish('stories', function () { return Stories.find(); });

// Publish all paragraphs for a specific story
Paragraphs = new Meteor.Collection("paragraphs");
Meteor.publish('paragraphs', function (story_id) { return Paragraphs.find({story_id: story_id}); });

