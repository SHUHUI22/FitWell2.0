const express = require("express"); // Use require(‘express’) to import the Express module
const app = express();              // Call express() to create an Express application instance
const port = 3000;                  // Define the port for the application
const path = require("path");       //include Path module to work with directories and file paths

// Connect to database and start the server
const mongoose = require("mongoose");
const uri = "mongodb+srv://admin:OCC2G7FitWell@fitwell.ybm1ueb.mongodb.net/FitwellDB?retryWrites=true&w=majority&appName=FitWell";
mongoose.connect(uri)
.then(()=> {
    console.log("Connected to MongoDB Atlas");
    app.listen(port, ()=>{
        console.log(`Server start listen to ${port}`);
    });
})
.catch((err)=> {
    console.error("MongoDB connection error: ", err);
});

// Set EJS as the view engine for the Express application 
// Configure Express.js to use the EJS View engine and `views` directory.
// The path.join() method joins the current directory (_dirname) path and /views segments into one path.
app.set('view engine','ejs');
app.set('views', path.join(__dirname, '/views'));

//To serve static files, use the express.static built-in middleware function in Express.
app.use(express.static(path.join(__dirname,'public')));

// To parse form data in POST request body:
app.use(express.urlencoded({ extended: true })); 

// To parse JSON data in POST request body:
app.use(express.json());

// Session middleware
const session = require("express-session");
const MongoStore = require("connect-mongo");
app.use(session({
    secret: "FitWell",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: uri, // your existing MongoDB URI
        dbName: "FitwellDB",
        collectionName: "sessions", // optional, name of the session collection
        ttl: 60 * 60, // 1 hour
    }),
    cookie: {maxAge: 1000*60*60} // 1 hour session
}));

// Middleware to make `isLoggedIn` available in all EJS views
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.userId ? true : false;
    next();
});


app.use(express.json());

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/FitWell/Login')
    }
    next();
}


// Import routes
const LandingPageRoute = require("./routes/LandingPageRoute");
const authRoute = require("./routes/authRoute");
const ProfileRoute = require("./routes/ProfileRoute");
const NutritionPlannerRoute = require("./routes/NutritionPlannerRoute");
const MealSuggestionRoute = require("./routes/MealSuggestionRoute");
const MealLoggingRoute = require("./routes/MealLoggingRoute");
const FavouriteMealRoute = require("./routes/FavouriteMealRoute");
const CalculatorRoute = require("./routes/CalculatorRoute");
const AuthStatusRoute = require("./routes/AuthStatusRoute");

// ...

// Use routes
app.use('/FitWell', LandingPageRoute);
app.use('/FitWell', authRoute);
app.use('/FitWell', requireLogin, ProfileRoute);
app.use('/FitWell', requireLogin, NutritionPlannerRoute);
app.use('/FitWell', requireLogin, MealSuggestionRoute);
app.use('/FitWell', requireLogin, MealLoggingRoute);
app.use('/FitWell', requireLogin, FavouriteMealRoute);
app.use('/FitWell', requireLogin, CalculatorRoute);
app.use('/FitWell', AuthStatusRoute);

// ...


// 404 error handler 
app.use((req, res) => {
    res.status(404).send("Page not found");
});