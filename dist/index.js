"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const os_1 = require("os");
const web_api_1 = require("@slack/web-api");
const app = express();
app.use('/css', express.static('./css'));
app.use('/img', express.static('./img'));
app.use(express.json());
const slackToken = 'xoxb-6449709772069-6455115197380-4b821Ci5VGN1jKOfcWUYogKv';
var brewLength = 1000 * 60 * 2; // 2min?
let status = 'empty';
let brewStart = null;
let brewEnd = null;
sendSlack();
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile('./index.html', { root: 'html' });
}));
app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (status == 'done') {
        res.send({ status, brewLength });
        status = 'empty';
        return;
    }
    res.send({ status, start: brewStart, end: brewEnd, brewLength });
}));
app.post('/change-brew-time', (req, res) => {
    var _a, _b;
    if (parseInt((_b = (_a = req.query.time) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '') == null) {
        res.send({ error: 'That was not a time', success: false });
        return;
    }
    brewLength = 1000 * parseInt(req.query.time.toString());
    res.send({ error: null, success: true });
});
app.post('/brew', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
app.post('/ready', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (status != 'empty') {
        res.send({ error: 'Machine is not empty' });
        return;
    }
    status = 'ready';
    res.send({ error: null });
}));
const IS_PI = false;
var relay = null;
function activateBrew() {
    if (!IS_PI) {
        return;
    }
    ;
    if (relay == null) {
        var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
        relay = new Gpio(4, 'out'); //use GPIO pin 4, and specify that it is output
    }
    relay.writeSync(1); // turn on
    setTimeout(() => relay.writeSync(0), brewLength); // turn off
}
function sendSlack() {
    return __awaiter(this, void 0, void 0, function* () {
        const nets = (0, os_1.networkInterfaces)();
        const msg = 'Local IP: ' + (nets['wlan0'] ? [1] ? ['address'] : 'Not found' : 'Not found');
        console.log(msg);
        var sent = false;
        while (!sent) {
            const web = new web_api_1.WebClient(slackToken);
            try {
                web.chat.postMessage({
                    text: msg,
                    channel: 'C06DZCEEKPS',
                });
                sent = true;
                console.log('Message sent');
                break;
            }
            catch (e) {
                console.log(e);
                yield timeout(5000);
            }
        }
    });
}
function timeout(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
app.listen(3001, () => {
    console.log("Server started on port 3001");
});
//# sourceMappingURL=index.js.map