import * as OIMO from 'oimo'
import { SlidePicker } from 'muse-ui';

var bodies = [

]

var world = false

const setup = (data) => {
  world = new OIMO.World({
    timestep: 1 / 60,
    iterations: 8,
    broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
    worldscale: 1, // scale full world
    random: true,  // randomize sample
    info: false,   // calculate statistic or not
    gravity: [0,-9.8,0]
  });

  setInterval(() => {
    update()
  }, 1000 / 60)
}

const update = () => {
  world.step()

  let db = bodies.map((b) => {
    return {
      ...b.data,

      position: b.body.getPosition(),
      quaternion: b.body.getQuaternion()
    }
  })
  self.postMessage({ type: 'update', db })
}

const addItem = (data) => {
  var body = world.add({
      type: data.geo || 'sphere', // type of shape : sphere, box, cylinder
      size: [data.size.x,data.size.y,data.size.z], // size of shape
      pos:data.position, // start position in degree
      rot:data.rotation, // start rotation in degree
      move: data.move === true ? true : false, // dynamic or statique
      density: data.density || 1,
      friction: data.friction || 0.2,
      restitution: data.restitution || 0.2,
      belongsTo: data.belongsTo || 1, // The bits of the collision groups to which the shape belongs.
      collidesWith: data.collidesWith || 0xffffffff // The bits of the collision groups with which the shape collides.
  })

  bodies.push({
    data,
    body
  })
}

const removeItem = (data) => {
  let idx = bodies.findIndex(b => b.data._id === data._id)
  if (idx !== -1) {
    let entry = bodies[idx]
    let body = entry.body
    bodies.splice(idx, 1)
    body.remove()
  }
}

self.addEventListener('message', (evt) => {
  console.log('worker', evt.data)

  let data = evt.data
  let type = data.type

  if (type === 'setup') {
    setup(data)
  } else if (type === 'addItem') {
    addItem(data)
  } else if (type === 'removeItem') {
    removeItem(data)
  }
})