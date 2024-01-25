var express = require('express');
var router = express.Router();

const userModel = require("./users");
const postModel = require("./post");
const passport = require('passport');
const localStrategy = require("passport-local");
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Register' });
});

router.get('/login', function(req, res, next) {
  res.render('login', {error : req.flash('error')});
});

router.get('/profile', isLoggedIn , async function(req, res, next) {
  
  const user = await userModel.findOne({
    username : req.session.passport.user
  }).populate("posts");

  res.render("profile", {user});
});

router.get('/feed', isLoggedIn ,function(req, res, next) {
  res.render("feed");
});


//register
router.post("/register", (req, res)=>{
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname
  })

  userModel.register(userData, req.body.password)
  .then(() => {
    passport.authenticate("local")(req, res, ()=>{
      res.redirect("/profile");
    })
  })
})

//login
router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}) ,(req, res)=>{
  
})

//logout
router.get("/logout", (req, res)=>{
  req.logout( (err)=>{
    if (err) { return next(err); }
    res.redirect('/login');
  });
})

//upload
router.post("/upload", isLoggedIn ,upload.single('file'), async (req, res)=>{
  if(!req.file){
    return res.status(404).send("No files were uploaded");
  }

  const user = await userModel.findOne({username: req.session.passport.user});
  
  const post = await postModel.create({
    image: req.file.filename,
    postText: req.body.filecaption,
    user: user._id
  });

  console.log(req);

  user.posts.push(post._id);
  await user.save();

  res.redirect("/profile");
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/");
}

module.exports = router;
