const amqp = require('amqplib/callback_api');
require('dotenv').config();

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

      whenConnected();
   })
}

var pubChannel = null;
var offlinePubQueue = []; //stores messages when server is MQ is offline

function whenConnected() {
   amqpConn.createConfirmChannel((err, channel) => {
      if (err) {
         console.error("[AMQP] error", err);
         amqpConn.close();
         return;
      }

      channel.on("error", function (err) {
         console.error("[AMQP] channel error", err.message);
      });
      channel.on("close", function () {
         console.log("[AMQP] channel closed");
      });

      channel.assertQueue('user-messages', {
         durable: true
      });

      pubChannel = channel;
      console.log("Channel Created!!");
      
      //process the messages of offline queue
      while (true) {
         var msg = offlinePubQueue.shift();
         if (!msg) break;
         publish(m[0], m[1]);
      }
   });
}

// method to publish a message, will queue messages internally if the connection is down and resend later
function publish(queueName, msg) {
   try {
      pubChannel.sendToQueue(queueName, Buffer.from(msg), { persistent: true },
         function (err, ok) {
            if (err) {
               console.error("[AMQP] publish", err);
               offlinePubQueue.push([queueName, msg]);
               pubChannel.connection.close();
            }
         });
   } catch (e) {
      console.error("[AMQP] publish", e.message);
      offlinePubQueue.push([queueName, msg]);
   }
}

start();
module.exports.publishToQueue = publish;