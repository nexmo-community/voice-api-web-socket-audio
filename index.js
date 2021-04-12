'use strict'

const express = require('express');
const WaveFile = require('wavefile').WaveFile;
const fs = require('fs');

const app = express();
const expressWs = require('express-ws')(app);
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

expressWs.getWss().on('connection', function (ws) {
    console.log('Websocket connection is open');
});

app.get('/webhooks/answer', (req, res) => {
    let nccoResponse = [
        {
            "action": "talk",
            "text": "Please wait while we connect you to the echo server"
        },
        {
            "action": "connect",
            "from": "NexmoTest",
            "endpoint": [
                {
                    "type": "websocket",
                    "uri": `wss://${req.hostname}/socket`,
                    "content-type": "audio/l16;rate=16000",
                }
            ]
        }
    ]

    res.status(200).json(nccoResponse);
});

app.post('/webhooks/events', (req, res) => {
    console.log(req.body);
    res.sendStatus(200);
});

app.ws('/socket', async (ws, req) => {
    // Load the sound file
    const wav = new WaveFile(fs.readFileSync("./sound.wav"));

    /* 
    Convert file sample rate and bit depth
    to the expected values by the Voice API.
    */
    wav.toSampleRate(16000);
    wav.toBitDepth("16");

    /* 
    1. Get the samples of the audio file (first channel).
    2. Break the samples into the size expected by the Voice API
    */
    const samples = chunkArray(wav.getSamples()[0], 320);
    for (var index = 0; index < samples.length; ++index) {
        // Send a buffer over the web socket
        ws.send(Uint16Array.from(samples[index]).buffer);
    }
});

function chunkArray(array, chunkSize) {
    var chunkedArray = [];
    for (var i = 0; i < array.length; i += chunkSize)
        chunkedArray.push(array.slice(i, i + chunkSize));
    return chunkedArray;
}

app.listen(port, () => console.log(`Listening on port ${port}`));