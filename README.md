# milight-mqtt
Control Milight/Limitless globes using the older v4 version of WiFi hub via MQTT.

Only does the older white globes since that's all I've got running in my place.

```
CONFIG_PATH=./my_config_file.yml node main
```

Toggle power by sending a message to:

- milight/set/{id}/off
- milight/set/{id}/on

Listed for changes via
- milight/status/{id}
