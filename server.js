'use strict'
const PAGE_ACCESS_TOKEN = "<YOUR PAGE TOKEN>";
const WEBHOOK_TOKEN     = "<YOUR WEBHOOK SECRET>";

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

var app = express();
app.use(bodyParser.json());
// Routes registration
app.get('/messenger/webhook', (req, res, next) => {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === WEBHOOK_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    }else{
        console.error("Webhook verification failed. Received query is ", req.query);
        res.sendStatus(403);
    }
});

function sendTextMessage(recipientId, messageText) {
    var responsePayload = {
        recipient   : {
            id : recipientId
        },
        message     : {
            text : messageText
        }
    };
    return request({
        uri     : 'https://graph.facebook.com/v2.6/me/messages',
        qs      : { access_token: PAGE_ACCESS_TOKEN },
        method  : 'POST',
        json    : responsePayload
    }, (error, response, body) => {
        if(error){
            console.error("[ERR] Unable to send message. : ", error);
        }else{
            console.log('[MSG][SENT] Message sent with id %s to recipient %s', body.message_id, body.recipient_id);
        }
    });
}

app.post('/messenger/webhook', (req, res, next) => {
    var data = req.body;
    if (data.object === 'page') {
        data.entry.forEach(function(entry) {
            entry.messaging.forEach(function(event) {
                if ('message' in event && event.message) {
                    console.log('[MSG][RECV] Message is %s from user %s', event.message.text, event.sender.id);
                    sendTextMessage(event.sender.id, event.message.text);
                }else{
                    console.warn("[WAR] Webhook received unknown event: ", event);
                }
            });
        });
        // Send aknowledge response
        res.sendStatus(200);
    }
});

// Application start
app.listen(3000, function() {
    console.log('Listening on http://localhost:3000');
});