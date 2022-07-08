const express = require("express")
const router = express.Router()

const Notice = require('../models/notice')
const Event = require('../models/event')
const Achieve = require('../models/achieve')
const Circular = require('../models/circular')

router.get('/', (req, res, next) => {
    Event.find().select("title img type eventsImg")
        .exec()
        .then(docs => {
            var images = [];
            docs.forEach((element) => {
                element.eventsImg.forEach((img) => {
                    images.push(img.imageURL);
                })
            });

            Notice.find({
                department: { $in: ["Computer Engineering", "Information Technology", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering (Aided)", "Mechanical Engineering (Unaided)", "Electronics & Telecommunication"] }
            }).exec().then(notices => {
                Notice.find({
                    department: { $in: ["First Year Diploma Admission", "Direct Second Year Diploma Admission", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering (Aided)", "Mechanical Engineering (Unaided)", "Electronics & Telecommunication"] }
                }).exec().then(admission => {
                    res.render('user/home', { eventsData: docs, eventImages: images, noticesData: notices, admissionData: admission });
                })
            })
        });
})

router.get('/view-notices/(:depart)', (req, res, next) => {
    Notice.find({
            department: req.params.depart
        }).select("date title upFile")
        .exec()
        .then(docs => {
            res.render('user/viewNotices', { dept: req.params.depart, notices: docs })
        })
})

router.get('/view-events/(:ID)', (req, res, next) => {
    Event.find({
            _id: req.params.ID
        }).select("title img desc type eventsImg")
        .exec()
        .then(docs => {
            res.render('user/viewEvents', { dept: req.params.depart, events: docs[0] })
        })
})

router.get('/view-dept-events/(:depart)', (req, res, next) => {
    Event.find({
            department: req.params.depart
        }).exec()
        .then(docs => {
            res.render('user/viewDeptEvents', { dept: req.params.depart, events: docs })
        })
})

router.get('/gallery', (req, res, next) => {
    Event.find().select("title img type eventsImg")
        .exec()
        .then(docs => {
            var images = [];
            docs.forEach((element) => {
                element.eventsImg.forEach((img) => {
                    images.push(img.imageURL);
                })
            });
            res.render('user/gallery', { eventsData: docs, eventImages: images });
        });
})

router.get('/achievements', (req, res, next) => {
    Achieve.find()
        .exec()
        .then(docs => {
            res.render('user/viewAchieve', { achData: docs });
        });
})

router.get('/circulars', (req, res, next) => {
    Circular.find()
        .exec()
        .then(docs => {
            res.render('user/viewCircular', { cirData: docs });
        });
})

module.exports = router;