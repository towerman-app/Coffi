var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
const express  = require('express');
const app = express();
var relay = new Gpio(4, 'out'); //use GPIO pin 4, and specify that it is output

app.get('/', (req, res) => {
    relay.writeSync(1);
    setTimeout(() => relay.writeSync(0), 1000);
    res.send('OK');
});

app.listen(3001, () => {
    console.log('Running');
})

