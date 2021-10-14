module.exports = function () {
    return function secured(req, res, next) {
        next()
        // if (req.user) { return next(); }
        // req.session.returnTo = req.originalUrl;
        // res.redirect('/auth/login');
    };
};