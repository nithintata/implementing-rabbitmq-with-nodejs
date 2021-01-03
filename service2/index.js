var amqp = require('amqplib/callback_api');
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5003;

var app = express();
var server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get('/', (req, res, next) => {
  console.log("Working");
});

var isConnecting = false;
var amqpConn = null;

function start() {
  if (isConnecting) return;
  isConnecting = true;  //to make sure that we don't be having duplicate connections

  amqp.connect(process.env.CONN_URL + "?heartbeat=60", (err, conn) => {
    isConnecting = false;
    if (err) {
      //if there is any error we need to try connecting again after some time
      console.error("[AMQP] conn error", err.message);
      return setTimeout(start, 3000); //tries connecting to server again
    }

    conn.on("error", function (err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function () {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });

    console.log("[AMQP] connected");
    amqpConn = conn;

    startProcessing();
  })
}

function startProcessing() {
  amqpConn.createChannel((err, channel) => {
    if (err) {
      console.error("[AMQP] error", err);
      amqpConn.close();
      return;
    }

    channel.on("error", function (err) {
      console.error("[AMQP] channel error", err.message);
    });

    channel.on("close", function () {
      amqpConn.close();
      console.log("[AMQP] channel closed");
    });

    channel.assertQueue("user-messages", {durable: true}, (err, ok) => {
      if (err) {
        console.error("[AMQP] error", err);
        amqpConn.close();
      }

      channel.consume("user-messages", (msg) => {
        processMsg(msg, (isDone) => {
          try {
            if (isDone)
              channel.ack(msg);
            else
              channel.reject(msg, true);
          } catch (error) {
            console.error("[AMQP] error!", error);
            amqpConn.close();
          }
        })
      });
    })
  })
}

function processMsg(msg, callback) {
  //Do some work with the msg received
  console.log("Received: ", JSON.parse(msg.content.toString()));
  console.log("_____________________");
  callback(true);
}

start();

server.listen(PORT, () => {
  console.log(`Server is running at port: ${PORT}`);
});