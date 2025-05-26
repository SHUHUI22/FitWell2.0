async function getLandingPage(req, res) {
    const isLoggedIn = req.session.userId? true:false;
    res.render("LandingPage",{isLoggedIn}); 
}

module.exports = { getLandingPage };