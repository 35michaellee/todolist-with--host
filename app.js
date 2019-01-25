//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const app = express();
const _= require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-michael:Owlcity1!@cluster0-f5oeb.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const itemsSchema = {
  name: String
}

const Item = mongoose.model("item", itemsSchema);
const item1 = new Item({
  name: "welcome to the to do list."
});
const item2 = new Item({
  name: "Hit the + buttin to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String, //for custom pages
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);
app.get("/", function(req, res) {


  Item.find({}, function(err, founditems) {
    if (founditems.length === 0) { ////this stops the datatbase from building up with each refresh
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully inserted the items");
        }
      });
      res.redirect("/"); // this is so when the population is empyty the first tume the user can be redirected to the new home screeen that is populated
    } else {
      res.render("list", {
        listTitle: "today",
        newListItems: founditems
      });
    }


  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);


  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        //create new list
        list.save();
        res.redirect('/' + customListName);
      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

});


app.get("/about", function(req, res) {
  res.render("about");
});







app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === "today") {
    item.save();
    res.redirect('/');
  } else { //new item comes from a custom list
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save(); //adds to the right list
      res.redirect("/" + listName); // server catches the correct list and
    });

  }


});









app.post("/delete", function(req, res) {
  const checkedid = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "today") { //default list
    Item.findByIdAndRemove(checkedid, function(err) {
      if (!err) {
        console.log("successfully deleted item that was checked");
        res.redirect('/');
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName},
      {$pull: {items: {_id:checkedid}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName)
      }
    });
  }


});

//for heroku servers
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}



app.listen(port, function() {
  console.log("Server has started successfully");
});
