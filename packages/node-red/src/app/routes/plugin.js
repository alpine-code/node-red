// const { fetchLabMetadata, fetchLabResources } = require('../helpers/graphql')
var express = require('express');
var router = express.Router();

// const lab_uid = process.env.LAB_UID;

var secured = require('../middleware/secured');
var userInViews = require('../middleware/userInViews');
router.use(secured());
router.use(userInViews());

// router.get('/user', function (req, res, next) {
//     const { _raw, _json, ...userProfile } = req.user;
//     res.json(userProfile)
// });

// router.get('/settings', async function (req, res) {
//     let metadata = await fetchLabMetadata(lab_uid);
//     let result = '<table>';
//     for (let index in metadata) {
//         result += `<tr><td><strong>${metadata[index].key}</strong></td><td><a href="${metadata[index].value}">${metadata[index].value}</a></td></tr>`;
//     }
//     result += '</table>';
//     res.send(result);
// });

// router.get('/resources', async function (req, res) {
//     let resources = await fetchLabResources(lab_uid);
//     res.json(resources);
// });

// router.get('/documentation', function (req, res) {
//     res.redirect('https://www.alpine-code.com/products/node-red')
// });

module.exports = router;