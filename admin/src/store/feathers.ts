import { feathers } from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import authentication from '@feathersjs/authentication-client'
import io from 'socket.io-client'

export const socket = io('http://localhost:3030', {
  transports: ['websocket'],
  autoConnect: true,
})

const client = feathers()
client.configure(socketio(socket, { timeout: 10000 }))
client.configure(authentication({ storage: window.localStorage, storageKey: 'feathers-jwt' }))

export { client }
