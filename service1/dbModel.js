const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dbSchema = new Schema({
    name: {
        type: String,
        required: true
    },

   email: {
        type: String,
        required: true
    }
}, {
    timestamps : true
});

var Files = mongoose.model("File", dbSchema);
module.exports = Files;