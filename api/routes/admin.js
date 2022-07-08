const express = require("express")
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer');
const jwt = require("jsonwebtoken");
var fs = require("fs")

const Admin = require("../models/admin")
const Notice = require('../models/notice')
const Event = require('../models/event');
const Achieve = require("../models/achieve");
const Circular = require("../models/circular");

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

var eventUpload = upload.fields([{ name: 'img', maxCount: 1 }, { name: "eventsImg", maxCount: 10 }])

router.get('/', (req, res, next) => {
    res.render('admin/login');
})

router.post("/", (req, res) => {
    const email = req.body.email;
    const pass = req.body.pass;

    Admin.find({
            email: email,
            pass: pass,
        })
        .exec()
        .then((user) => {
            if (user.length < 1) {
                res.status(404).json({
                    message: "Admin Not found",
                });
            } else {
                const token = jwt.sign({
                        email: user[0].email,
                        userId: user[0]._id,
                    },
                    process.env.JWT_KEY, {}
                );
                req.session.email = email;
                req.session.type = user[0].type;
                req.session.adminID = user[0]._id;
                res.status(200).redirect("/admin/dashboard");
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({
                message: error,
            });
        });
});

router.get('/dashboard', (req, res, next) => {
    if (req.session.email) {
        Event.find().exec().then(events => {
            Notice.find().exec().then(notices => {
                Achieve.find().exec().then(achieve => {
                    Circular.find().exec().then(circular => {
                        res.render('admin/dashboard', { noofevents: events.length, noofnotices: notices.length, noofcirculars: circular.length, noofachieve: achieve.length, userType: req.session.type });
                    })
                })
            })
        })
    } else {
        res.redirect('/admin')
    }
})

router.get('/events', (req, res, next) => {
    if (req.session.email) {
        Event.find().select("title type desc")
            .exec()
            .then(docs => {
                res.render('admin/event/events', { eventsData: docs, userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
})

router.get('/add-event', (req, res, next) => {
    if (req.session.email) {
        res.render('admin/event/addEvent', { userType: req.session.type });
    } else {
        res.redirect('/admin')
    }
})

router.get("/delete-event/(:id)", (req, res, next) => {
    Event.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            fs.unlinkSync("\public/" + doc.img)
            if (doc.type == "Past") {
                doc.eventsImg.forEach((img) => {
                    fs.unlinkSync("\public/" + img.imageURL)
                })
            }
            return res.redirect('/admin/events')
        } else {
            res.redirect('/admin')
        }
    })
});

router.get("/edit-event/(:id)", (req, res, next) => {
    if (req.session.email) {
        Event.find({
                _id: req.params.id
            }).select("title type desc")
            .exec()
            .then(docs => {
                res.render('admin/event/editEvent', { eventsData: docs[0], userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
});


router.get('/notices', (req, res, next) => {
    if (req.session.email) {
        Notice.find().select("_id date title department")
            .exec()
            .then(docs => {
                res.render('admin/notice/notices', { noticeData: docs, userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
})

router.get('/add-notice', (req, res, next) => {
    if (req.session.email) {
        res.render('admin/notice/addNotice', { userType: req.session.type });
    } else {
        res.redirect('/admin')
    }
})

router.post('/add-notice', upload.single('upFile'), (req, res, next) => {
    console.log(req.file)

    const notice = new Notice({
        _id: new mongoose.Types.ObjectId(),
        date: req.body.date,
        title: req.body.title,
        department: req.body.department,
        upFile: 'uploads/' + req.file.filename
    });

    notice
        .save()
        .then(doc => {
            res.redirect('/admin/notices')
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
});

router.get("/delete-notice/(:id)", (req, res, next) => {
    Notice.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            console.log(doc.upFile)
            fs.unlinkSync("\public/" + doc.upFile)
            return res.redirect('/admin/notices')
        } else {
            res.redirect('/admin')
        }
    })
});

router.get('/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect("/admin")
})


router.post('/add-event', eventUpload, (req, res, next) => {
    var ssArr = [];
    if (req.files.eventsImg) {
        var rawSS = req.files.eventsImg;
        rawSS.forEach((element) => {
            ssArr.push({ imageURL: 'uploads/' + element.filename });
        });
    }

    console.log(ssArr);

    const event = new Event({
        _id: new mongoose.Types.ObjectId(),
        img: 'uploads/' + req.files.img[0].filename,
        eventsImg: ssArr,
        title: req.body.title,
        desc: req.body.desc,
        department: req.body.department,
        type: req.body.type
    });

    event
        .save()
        .then(doc => {
            res.redirect('/admin/events')
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
});

router.post("/edit-event/:eventID", eventUpload, (req, res) => {
    const id = req.params.eventID

    var ssArr = [];
    if (req.body.eventsImg) {
        var rawSS = req.files.eventsImg;
        rawSS.forEach((element) => {
            ssArr.push({ imageURL: 'uploads/' + element.filename });
        });
    }

    if (req.files.img) {
        var newValues = {
            img: 'uploads/' + req.files.img[0].filename,
            eventsImg: ssArr,
            title: req.body.title,
            desc: req.body.desc,
            type: req.body.type
        }
    } else {
        var newValues = {
            eventsImg: ssArr,
            title: req.body.title,
            desc: req.body.desc,
            type: req.body.type
        }
    }

    Event.updateMany({ _id: id }, { $set: newValues })
        .exec()
        .then(result => {
            console.log(result)
            res.redirect("/admin/events")
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
});

router.get("/edit-notice/(:id)", (req, res, next) => {
    if (req.session.email) {
        Notice.find({
                _id: req.params.id
            }).select("title date department")
            .exec()
            .then(docs => {
                res.render('admin/notice/editNotice', { noticeData: docs[0], userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
});

router.post("/edit-notice/:noticeID", upload.single('upFile'), (req, res) => {
    const id = req.params.noticeID

    if (req.file) {
        var newValues = {
            date: req.body.date,
            title: req.body.title,
            department: req.body.department,
            upFile: 'uploads/' + req.file.filename
        }
    } else {
        var newValues = {
            date: req.body.date,
            title: req.body.title,
            department: req.body.department,
        }
    }

    Notice.updateMany({ _id: id }, { $set: newValues })
        .exec()
        .then(result => {
            console.log(result)
            res.redirect("/admin/notices")
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
});

router.get('/users', (req, res, next) => {
    if (req.session.email && req.session.type == "Admin") {
        Admin.find({
                type: "Teacher"
            }).select("name email pass type")
            .exec()
            .then(docs => {
                res.render('admin/user/users', { usersData: docs, userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
})

router.get('/add-user', (req, res, next) => {
    if (req.session.email && req.session.type == "Admin") {
        res.render('admin/user/addUser', { userType: req.session.type });
    } else {
        res.redirect('/admin')
    }
})

router.post('/add-user', (req, res, next) => {
    const user = new Admin({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        pass: req.body.pass,
    });

    user
        .save()
        .then(doc => {
            res.redirect('/admin/users')
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
});

router.get("/delete-user/(:id)", (req, res, next) => {
    Admin.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            return res.redirect('/admin/users')
        } else {
            res.redirect('/admin')
        }
    })
});

router.get("/edit-user/(:id)", (req, res, next) => {
    if (req.session.email && req.session.type == "Admin") {
        Admin.find({
                _id: req.params.id
            }).select("name email pass")
            .exec()
            .then(docs => {
                res.render('admin/user/editUser', { usersData: docs[0], userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
});

router.post("/edit-user/:userID", (req, res) => {
    const id = req.params.userID

    var newValues = {
        name: req.body.name,
        email: req.body.email,
        pass: req.body.pass,
    }


    Admin.updateMany({ _id: id }, { $set: newValues })
        .exec()
        .then(result => {
            console.log(result)
            res.redirect("/admin/users")
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
});


router.get('/achievements', (req, res, next) => {
    if (req.session.email) {
        Achieve.find()
            .exec()
            .then(docs => {
                res.render('admin/achieve/achievements', { achData: docs, userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
})

router.get('/add-achieve', (req, res, next) => {
    if (req.session.email) {
        res.render('admin/achieve/addAchieve', { userType: req.session.type });
    } else {
        res.redirect('/admin')
    }
})

router.post('/add-achieve', upload.single('achFile'), (req, res, next) => {
    console.log(req.file)
    const achieve = new Achieve({
        _id: new mongoose.Types.ObjectId(),
        date: req.body.date,
        title: req.body.title,
        achFile: 'uploads/' + req.file.filename
    });

    achieve
        .save()
        .then(doc => {
            res.redirect('/admin/achievements')
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
});

router.get("/delete-achieve/(:id)", (req, res, next) => {
    Achieve.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            console.log(doc.achFile)
            fs.unlinkSync("\public/" + doc.achFile)
            return res.redirect('/admin/achievements')
        } else {
            res.redirect('/admin')
        }
    })
});

router.get("/edit-achieve/(:id)", (req, res, next) => {
    if (req.session.email) {
        Achieve.find({
                _id: req.params.id
            }).select("title date")
            .exec()
            .then(docs => {
                res.render('admin/achieve/editAchieve', { achData: docs[0], userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
});

router.post("/edit-achieve/:achID", upload.single('achFile'), (req, res) => {
    const id = req.params.achID

    if (req.file) {
        var newValues = {
            date: req.body.date,
            title: req.body.title,
            upFile: 'uploads/' + req.file.filename
        }
    } else {
        var newValues = {
            date: req.body.date,
            title: req.body.title,
        }
    }

    Achieve.updateMany({ _id: id }, { $set: newValues })
        .exec()
        .then(result => {
            console.log(result)
            res.redirect("/admin/achievements")
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
});

// Circulars
router.get('/circulars', (req, res, next) => {
    if (req.session.email) {
        Circular.find()
            .exec()
            .then(docs => {
                res.render('admin/circular/circulars', { cirData: docs, userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
})

router.get('/add-circular', (req, res, next) => {
    if (req.session.email) {
        res.render('admin/circular/addCircular', { userType: req.session.type });
    } else {
        res.redirect('/admin')
    }
})

router.post('/add-circular', upload.single('cirFile'), (req, res, next) => {
    console.log(req.file)
    const circular = new Circular({
        _id: new mongoose.Types.ObjectId(),
        date: req.body.date,
        title: req.body.title,
        cirFile: 'uploads/' + req.file.filename
    });

    circular
        .save()
        .then(doc => {
            res.redirect('/admin/circulars')
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })
});

router.get("/delete-circular/(:id)", (req, res, next) => {
    Circular.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            fs.unlinkSync("\public/" + doc.cirFile)
            return res.redirect('/admin/circulars')
        } else {
            res.redirect('/admin')
        }
    })
});

router.get("/edit-circular/(:id)", (req, res, next) => {
    if (req.session.email) {
        Circular.find({
                _id: req.params.id
            }).select("title date")
            .exec()
            .then(docs => {
                res.render('admin/circular/editCircular', { cirData: docs[0], userType: req.session.type });
            })
    } else {
        res.redirect('/admin')
    }
});

router.post("/edit-circular/:cirID", upload.single('cirFile'), (req, res) => {
    const id = req.params.cirID

    if (req.file) {
        var newValues = {
            date: req.body.date,
            title: req.body.title,
            cirFile: 'uploads/' + req.file.filename
        }
    } else {
        var newValues = {
            date: req.body.date,
            title: req.body.title,
        }
    }

    Circular.updateMany({ _id: id }, { $set: newValues })
        .exec()
        .then(result => {
            console.log(result)
            res.redirect("/admin/circulars")
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
});

router.get("/change-password", (req, res, next) => {
    if (req.session.email && req.session.type == "Admin") {
        res.render('admin/password/editPass', { userType: req.session.type });
    } else {
        res.redirect('/admin')
    }
});

router.post("/change-password", (req, res) => {
    const id = req.session.adminID

    var newValues = {
        pass: req.body.pass,
    }

    Admin.updateMany({ _id: id }, { $set: newValues })
        .exec()
        .then(result => {
            console.log(result)
            res.redirect("/admin/dashboard")
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            })
        })
});

module.exports = router;