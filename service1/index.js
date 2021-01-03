const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Files = require('./dbModel');
const bodyParser = require('body-parser');
const {publishToQueue} = require('./MqService');
dotenv.config();

const PORT = process.env.PORT || 5000;

var app = express();
const server = http.createServer(app);

const connect = mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

connect.then((db) => {
    console.log("Connected to Database!");
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get('/', (req, res, next) => {
    console.log("Working");
});


app.use(bodyParser.json());


app.post('/setRecord',  async (req, res, next) => {
    const { name, email } = req.body;
    const file = new Files({name, email});
    try {
        const newFile = await file.save();
        console.log(newFile);
        res.status(200).json({ newFile });
        publishToQueue("user-messages", JSON.stringify(newFile));
      } catch (err) {
        console.log({ message: err.message });
      }
});

app.get('/getRecord', (req, res, next) => {
    const { id } = req.body;
    Files.findOne({_id: id}).then((file) => {
        console.log(file);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({file});
    })
});

server.listen(PORT, () => {
    console.log(`Server is running at port: ${PORT}`);
});
