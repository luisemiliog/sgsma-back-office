import mqtt, { type MqttClient } from 'mqtt'
import { config } from '../config.js'

let client: MqttClient | null = null

export function connectMqtt() {
  client = mqtt.connect(`mqtt://${config.mqttHost}:${config.mqttPort}`)
  client.on('connect', () => console.log('[mqtt] connected'))
  client.on('error', (err) => console.warn('[mqtt] error:', err.message))
}

export function publishAnnouncement(payload: object) {
  if (!client?.connected) {
    console.warn('[mqtt] not connected, skipping publish')
    return
  }
  client.publish('sgsma/announcements', JSON.stringify(payload), { qos: 1 })
}
