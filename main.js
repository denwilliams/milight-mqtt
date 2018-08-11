#!/usr/bin/env node

const milight = require('node-milight-promise');
const { MilightController } = milight;

const mqttusvc = require('mqtt-usvc');
const service = mqttusvc.create();

const bridges = {};
const lights = {};

service.on('message', (topic, data) => {
  const [action, light, value] = topic.split('/');

  if (action !== 'set') return;

  const device = lights[light];
  if (!device) return;

  switch (value) {
    case 'on':
      device.on();
      break;
    case 'off':
      device.off();
      break;
    case 'raw':
      if (typeof data === 'string') device.raw([data]);
      else device.raw(data);
      break;
  }
});

service.config.bridges.forEach(b => {
  bridges[b.id] = new MilightController({
    ip: b.host,
    delayBetweenCommands: 75,
    commandRepeat: 2,
    type: b.type
  });
  const cmdStr = b.commands || 'commandsV6';
  bridges[b.id].commands = milight[cmdStr];
});

service.config.lights.forEach(l => {
  const bridge = bridges[l.bridge];
  const zone = l.zone;
  const type = l.type || 'white';
  const cmd = bridge.commands[type];

  lights[l.id] = {
    bridge,
    zone,
    on() {
      console.log(`Turning on ${l.id}`);
      // bridge.sendCommands(commands.white.on(zone), commands.white.maxBright(zone));
      bridge.sendCommands(cmd.on(zone));
      service.send(`status/${l.id}`, {on: true});
    },
    off() {
      console.log(`Turning off ${l.id}`);
      bridge.sendCommands(cmd.off(zone));
      service.send(`status/${l.id}`, {on: false});
    },
    raw(actions) {
      const cmdActions = actions.map(action => {
        const fn = cmd[action];
        return fn(zone);
      });
      console.log(`Raw ${l.id} ${actions}`);
      bridge.sendCommands(...cmdActions);
    }
  };
  service.subscribe('set/' + l.id + '/on');
  service.subscribe('set/' + l.id + '/off');
  service.subscribe('set/' + l.id + '/raw');
});
