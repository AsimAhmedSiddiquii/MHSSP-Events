const mongoose = require('mongoose')

let ImageSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    imageURL: String,
});

const eventSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: { type: String, required: true },
    img: { type: String, required: true },
    desc: { type: String, default: "" },
    type: { type: String, required: true },
    department: { type: String, required: true },
    eventsImg: [ImageSchema]
})

module.exports = mongoose.model('Events', eventSchema)