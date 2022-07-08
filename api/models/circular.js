const mongoose = require('mongoose')

const circularSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    date: { type: String, required: true },
    title: { type: String, required: true },
    cirFile: { type: String, required: true }
})

module.exports = mongoose.model('Circular', circularSchema)