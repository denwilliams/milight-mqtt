#!/usr/bin/env node

const { MilightController, commands, commands2 } = require('node-milight-promise');

const mqttusvc = require('mqtt-usvc');
const service = mqttusvc.create();

const bridges = {};
const lights = {};

service.on('message', (topic, data) => {
  const [action, light, value] = topic.split('/');

  if (action !== 'set') return;

  const device = lights[light];
  if (!device) return;

  if (value === 'on') {
    device.on();
  } else if (value === 'off') {
    device.off();
  }
});

service.config.bridges.forEach(b => {
  bridges[b.id] = new MilightController({
    ip: b.host,
    delayBetweenCommands: 75,
    commandRepeat: 2
  });
});

service.config.lights.forEach(l => {
  const bridge = bridges[l.bridge];
  const zone = l.zone;
  lights[l.id] = {
    bridge,
    zone,
    on() {
      console.log(`Turning on ${l.id}`);
      // bridge.sendCommands(commands.white.on(zone), commands.white.maxBright(zone));
      bridge.sendCommands(commands.white.on(zone));
      service.send(`status/${l.id}`, {on: true});
    },
    off() {
      console.log(`Turning off ${l.id}`);
      bridge.sendCommands(commands.white.off(zone));
      service.send(`status/${l.id}`, {on: false});
    }
  };
  service.subscribe('set/' + l.id + '/on');
  service.subscribe('set/' + l.id + '/off');
});
