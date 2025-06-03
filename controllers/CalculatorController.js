const getCalculator = (req, res) => {
    const isLoggedIn = req.session.userId ? true : false;

    res.render('Calculator', {
        title: 'Nutrition Calculator',
        isLoggedIn
    });
};

module.exports = { getCalculator };