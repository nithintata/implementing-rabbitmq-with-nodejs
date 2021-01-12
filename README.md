[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Javascript](https://img.shields.io/badge/NodeJs-12.15.0-yellow.svg)
# Implementing Rabbitmq with Nodejs
RabbitMq is a messaging broker or queue manager which uses AMQP(Advanced Message Queuing Protocol) to transfer messages between various services.
<br><br>
A message broker acts as a middleman for various services (e.g. a web application, as in this example). They can be used to reduce loads and delivery 
times of web application servers by delegating tasks that would normally take up a lot of time or resources to a third party that has no other job.
<h3>Implementation</h3><br>
<ul>
<li>Here I have implemented two simple services in Nodejs where RabbitMq acts as a message broker between the two.</li>
<li>The first service <a href="service1/">/service1</a> is used to push a new record with name and email to a database. Here we record the autogenerated id from the response and send it to a 
message queue.</li>
<li>The second service <a href="service2/">/service2</a> consumes the messages from the message queue and prints the data it received on the console.</li>
<li>The data stored in the message queues is persistent which means even if one service goes down the data in the queue will be retained until the service 
is up again and acknowledges the messages it consumed.</li>