
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const dotenv = require('dotenv');
dotenv.config();

//connect to MongoDB Atlas
mongoose.connect(process.env.ATLAS_URL);

//1)create a SCHEMA
const itemsSchema = {
  name:String
};

//2)create a MODEL
const Item = mongoose.model("Item", itemsSchema);

//3)create a DOCUMENTs
const item1 = new Item ({
  name: "Welcome to your todolist"
});

const item2 = new Item ({
  name: "Hit the + button to add new item"
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

//create second schema
const listSchema = {
  name: String,
  items:[itemsSchema]
};

//create model
const List = mongoose.model("List", listSchema);


// home route
// get
app.get("/", function(req, res){

//modelName.find({conditions}, function(err, results){})
//foundItems is array back as a result
Item.find({}, function(err, foundItems){
  //check when user accesses the root route whether if the item collection empty
  //we're going to add the defaultItems
  if (foundItems.length === 0){
    //(Item) is the Model name
    Item.insertMany(defaultItems, function(err){
      if(err){
        console.log(err);
      }else {
        console.log("Succesfully saved default items to DB.");
      }
    });
    res.redirect("/");
  }else {
       res.render("list", {listTitle: "Today", newListItems: foundItems});
  }
});

});


//route parametrs
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

// findOne return object back only return one document if it is found
 List.findOne({name: customListName}, function(err, foundList){
   if(!err){
     if(!foundList){
      //Create a new list
      //create document
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
      // save list document to List collection
      list.save();
      res.redirect("/" + customListName);
     }else {
      // Show existing list
       res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
     }
   }
 });

});


// home route
// post
app.post("/", function(req, res){
  // newItem is input name
  const itemName = req.body.newItem;
  // list is button nmae
  const listName = req.body.list;

  // create a DOCUMENT
  const item = new Item({
    name: itemName
  });

 if(listName === "Today"){
   item.save();
   // to show up the new item that was added, inside "/"
   res.redirect("/");
 }else {
   List.findOne({name: listName}, function(err, foundList){
     foundList.items.push(item);
     foundList.save();
     // redirect to route that user came from
     res.redirect("/" + listName);
   });
 }

});


app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  //listName is the noame of input type hidden
  const listName = req.body.listName;

 if(listName === "Today"){
   Item.findByIdAndRemove(checkedItemID, function(err){
     if(!err){
       console.log("Succesfully deleted checked item");
       // to see the result in our webpage  not just in mongo shell
       res.redirect("/");
     }
   });
 }else {
   //modelName.findOneAndUpdate({condition}, {Update}, callback function(){})
   //update>> {$pull: {field: {query}}}
   List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
     if(!err){
       res.redirect("/" + listName);
     }
   });
 }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
