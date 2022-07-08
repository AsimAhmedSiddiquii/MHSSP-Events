const mongoose = require('mongoose')

const achSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    date: { type: String, required: true },
    title: { type: String, required: true },
    achFile: { type: String, required: true }
})

module.exports = mongoose.model('Achieve', achSchema)