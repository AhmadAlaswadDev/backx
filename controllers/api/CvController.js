const { validationResult } = require('express-validator')
var ObjectId = require('mongoose').Types.ObjectId;
const { google } = require('googleapis');
const stream = require('stream');


const CvModel = require('../../models/CvSchema');
const CvMetaModel = require('../../models/CvMetaSchema')
const UserModel = require('../../models/UserSchema');
const ExpModel = require('../../models/ExperienceSchema');
const EduModel = require('../../models/EducationSchema');
const ContactModel = require('../../models/ContactSchema')
const OrgModel = require('../../models/OrganizationSchema');
const ProjModel = require('../../models/ProjectSchema');
const ReffModel = require('../../models/ReffernceSchema');
const SkillModel = require('../../models/SkillSchema')
const AwModel = require('../../models/AwSchema');

const facades = require('../../others/facades');





exports.Get = function (req, res, next) {

    var CvId = req.params.cvId;
    if (!ObjectId.isValid(CvId)) {
        return res.json({
            success: false,
            payload: null,
            msg: 'Param not valid'
        });
    }

    var popobj = [
        {
            path: 'CVExp',
            populate: [
                {
                    path: 'ExpSkill'
                }
            ]
        },
        {
            path: 'CVSkill'
        },
        {
            path: 'CVEdu',
            populate: [
                {
                    path: 'EduSkill'
                }
            ]
        },
        {
            path: 'CVProj',
            populate: [{
                path: 'ProjSkill'
            }]
        },
        {
            path: 'CVReff'
        },
        {
            path: 'CVContact'
        },
        {
            path: 'CVOrg'
        },
        {
            path: 'CVAw',
            options: { sort: { 'AwSort':"ascending" }}
        },
        {
            path: 'CVImg'
        }
    ]


    //get Cv
    CvModel.findById(CvId).populate(popobj).exec(function (err, result) {

        if (!err && result) {

            res.json({
                success: true,
                payload: result,
                msg: 'Cv Successfuly Loaded'
            });
        }
        else {
            res.json({
                success: false,
                payload: null,
                msg: 'Unable to find Cv '
            });
        }
    })


}


exports.Save = function (req, res, next) {

    //validate inputs 
    const errors = validationResult(req);

    if (errors.errors.length > 0) {
        return res.json({
            success: false,
            payload: errors.errors,
            msg: 'Validation Error'
        });
    }

    //Create New CV
    var SaveCv = new CvModel();
    SaveCv.CVName = req.body.CvNameI;
    SaveCv.CVUId = req.user._id;
    SaveCv.save(function (err, result) {

        if (result && !err) {

            //push cv id to user
            UserModel.findOne({ _id: req.user._id }, function (err2, result2) {

                if (result2 && !err2) {
                    result2['CVUCvId'].push(result._id)
                    result2.save();
                    var arr = [
                        {
                            key: 'facebook',
                            value: '',
                        },
                        {
                            key: 'twitter',
                            value: '',
                        },
                        {
                            key: 'github',
                            value: '',
                        },
                        {
                            key: 'linkedin',
                            value: ''
                        }

                    ]
                    facades.saveContact(arr, result._id);

                    return res.json({
                        success: true,
                        payload: [],
                        msg: 'Cv Successfully Saved'
                    });
                }

            })

            //res.send(result)
        }
    })


}



exports.Update = function (req, res) {

    //validate Inputs 
    const errors = validationResult(req);
    if (errors.errors.length > 0) {
        res.json({
            success: false,
            payload: errors.errors,
            msg: 'Validation Error'
        });
    }

    var CvId = req.params.cvId;
    if (!ObjectId.isValid(CvId)) {
        return res.json({
            success: false,
            payload: null,
            msg: 'Param not valid'
        });
    }

    var Update = {
        CVName: req.body.CvNameI
    }

    CvModel.findOneAndUpdate({ _id: CvId }, Update, function (err, result) {

        if (!err && result) {
            console.log('updated')
            res.send('CV Updated')
        }
        else {
            res.send('unable to find cv')
        }

    })

    res.send('Update cv')

}

exports.Delete = function (req, res) {

    var CvId = new ObjectId(req.params.cvId);
    if (!ObjectId.isValid(req.params.cvId)) {
        return res.json({
            success: false,
            payload: null,
            msg: 'Param not valid'
        });
    }



    ExpModel.find({ CVId: CvId }, function (err, resss) {
        console.log('resss', resss)
        console.log('its woriking')
    })

    //Delete related Exp
    ExpModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //Delete related edu
    EduModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //Delete related proj
    ProjModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //Delete related contacts
    ContactModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //Delete related skills
    SkillModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //delete related org
    OrgModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //delete related reff
    ReffModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //delete related awards
    AwModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    // //delete related cv meta
    CvMetaModel.deleteMany({ CVId: CvId }, function (err) {
        console.log(err)
    })

    //remove Cv From User Arr
    CvModel.findByIdAndDelete(CvId, function (err, result) {

        UserModel.findOne({ _id: req.user._id }, function (err2, result2) {

            if (result2 && !err2) {
                result2['CVUClId'].pull(result._id)
                result2.save();
                res.send('Cv Deleted ')

            }

        })
    })

}


exports.SetImg = async function (req, res) {



    //validate param 
    var CvId = new ObjectId(req.params.cvId);
    if (!ObjectId.isValid(req.params.cvId)) {
        return res.json({
            success: false,
            payload: null,
            msg: 'Param not valid'
        });
    }

    //validate file input
    if(Object.keys(req.files).length >0 && req.files.ImgI.length > 0){

        //return res.send(req.files.ImgI[0].size <= 2046)
     
        if(req.files.ImgI[0].size >= 500000 ){
            return res.json({
                success: false,
                payload: null,
                msg: 'max file size'
            });
        }

        if (
            req.files.ImgI[0].mimetype === 'image/jpeg' ||
            req.files.ImgI[0].mimetype === 'image/jpg' ||
            req.files.ImgI[0].mimetype === 'image/gif'
        ) {
    
            var oauth2Client = facades.googleAuth();
            const drive = google.drive({
                version: 'v3',
                auth: oauth2Client,
            });
    
            const bufferStream = new stream.PassThrough();
            bufferStream.end(req.files.ImgI[0].buffer);
    
            try {
                const response = await drive.files.create({
                    requestBody: {
                        name: 'hero.png', //file name
                        mimeType: 'image/png',
                    },
                    media: {
                        mimeType: 'image/png',
                        body: bufferStream,
                    },
                });
    
                //set file permision anyone can read 
                const setPermResponse = await drive.permissions.create({
                    requestBody: {
                        role: 'reader',
                        type: 'anyone'
                    },
                    fileId: response.data.id
                }).then((resp) => {
    
                    //save as Cv meta
                    var metaArr = [
                        {
                            key: 'profile-img',
                            value: response.data.id
                        }
                    ]
    
                    facades.saveCvMeta(metaArr, CvId)
    
                    return res.json({
                        success: true,
                        payload: null,
                        msg: 'profile image successfully Uploaded'
                    });
    
                });
    
    
            } catch (error) {
                //report the error message
                console.log(error.message);
                return res.json({
                    success: false,
                    payload: null,
                    msg: 'Unable to upload file'
                });
            }
        }
        else {
            return res.json({
                success: false,
                payload: null,
                msg: 'Unable to upload file wrong mimetype'
            });
        }
    }else{
        return res.json({
            success: false,
            payload: null,
            msg: 'file is required'
        });
    }





}