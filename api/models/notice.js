const mongoose = require('mongoose')

const noticeSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    date: { type: String, required: true },
    title: { type: String, required: true },
    upFile: { type: String, required: true },
    department: { type: String, required: true }
})

module.exports = mongoose.model('Notice', noticeSchema)