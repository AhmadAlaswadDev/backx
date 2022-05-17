const express = require('express')

const OrgController =require('../../../controllers/api/OrgController')
const Validate = require('../../../others/validation')
const auth = require('../../../others/auth');

var router = express.Router();



router.post('/',auth.validateToken,Validate.OrgValidate,OrgController.Save)

router.put('/:orgId',auth.validateToken,Validate.OrgValidate,OrgController.Update)

router.delete('/:orgId',auth.validateToken,OrgController.Delete)

module.exports = router;