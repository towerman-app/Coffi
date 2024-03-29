import * as express from 'express';
import { networkInterfaces } from 'os';
import { WebClient } from '@slack/web-api';
import os = require('os');


const app = express();
const isPi = os.platform() != 'darwin';
app.use('/css', express.static('./css'));
app.use('/img', express.static('./img'));

app.use(express.json());

const slackToken = 'xoxb-6449709772069-6455115197380-UcEX9wMGyFCeTkyqmRWsl9Ft';

var brewLength = 1000 * 60 * 2; // 2min?
let status: 'empty' | 'ready' | 'brewing' | 'done' = 'empty';
let brewStart: number | null = null;
let brewEnd: number | null = null;

sendSlack();

app.get('/', async (req, res) => {
    res.sendFile('./index.html', { root: 'html' });
})

app.get('/status', async (req, res) => {
    if (status == 'done') {
        res.send({ status, brewLength });
        status = 'empty';
        return;
    }
    res.send({ status, start: brewStart, end: brewEnd, brewLength });
});

app.post('/change-brew-time', (req, res) => {
    if (status == 'brewing') {
        res.send({ error: 'Cannot change brew time while brewing', success: false });
        return;
    }
    if (parseInt(req.query.time?.toString() ?? '') == null) {
        res.send({ error: 'That was not a time', success: false });
        return;
    }
    brewLength = 1000 * parseInt(req.query.time!.toString());
    res.send({ error: null, success: true })
})

app.post('/brew', async (req, res) => {
    if (status != 'ready') {
        res.send({ error: 'Machine is not ready' });
        return;
    }
    status = 'brewing';
    brewStart = Date.now();
    brewEnd = Date.now() + brewLength;

    activateBrew();

    setTimeout(() => {
        brewStart = null;
        brewEnd = null;
        status = 'done';
    }, brewLength);
    res.send({ error: null });
});

app.post('/ready', async (req, res) => {
    if (status != 'empty') {
        res.send({ error: 'Machine is not empty' });
        return;
    }
    status = 'ready';
    res.send({ error: null });
})

// var relay: any = null;
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
const relay = new Gpio(4, 'out'); //use GPIO pin 4, and specify that it is output
function activateBrew() {
    if (!isPi) {
        console.log('The machine would brew now');
        return;
    }
    relay.writeSync(1); // turn on
    setTimeout(() => relay.writeSync(0), brewLength); // turn off
}

async function sendSlack() {
    if (!isPi) { return };
    const nets = networkInterfaces();
    const msg = 'Local IP: ' + (nets['wlan0'] ? [1] ? ['address'] : 'Not found' : 'Not found');
    console.log(msg);
    var sent = false;
    while (!sent) {
        const web = new WebClient(slackToken);

        try {
            await web.chat.postMessage({
                text: msg,
                channel: 'C06DZCEEKPS',
            });
            sent = true;
            console.log('Message sent');
            break;
        } catch (e) {
            console.log(e);
            sent = true;
            await timeout(5_000);
        }
    }
}

async function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(3001, () => {
    console.log("Server started on port 3001");
});

