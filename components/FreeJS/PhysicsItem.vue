<template>
  <div class="hidden">
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    id: {},
    world: {},
    bodies: {},
    geo: {
      default: 'sphere'
    },
    move: {
      default: false
    },
    size: {
      default () {
        return {
          x: 11, y: 11, z: 11
        }
      }
    },
    density: {
      default: 1.0
    },
    friction: {
      default: 0.2
    },
    restitution: {
      default: 0.2
    },
    belongsTo: {
      default: 1
    },
    collidesWith: {
      default: 0xffffffff
    },
  },
  data () {
    return {
      object3D: false
    }
  },
  created () {
    this.$on('add', (object) => {
      this.object3D = object

      var body = this.world.add({
          type: this.geo || 'sphere', // type of shape : sphere, box, cylinder
          size: [this.size.x,this.size.y,this.size.z], // size of shape
          pos: object.position.toArray(), // start position in degree [0,0,0]
          rot: object.rotation.toArray().map(v => v / (Math.PI * 2) * 360), // start rotation in degree [0,0,0]
          move: this.move === true ? true : false, // dynamic or statique
          density: this.density || 1,
          friction: this.friction || 0.2,
          restitution: this.restitution || 0.2,
          belongsTo: this.belongsTo || 1, // The bits of the collision groups to which the shape belongs.
          collidesWith: this.collidesWith || 0xffffffff // The bits of the collision groups with which the shape collides.
      })

      this.bodies.push({
        id: this.id,
        object: object,
        defaultPos: object.position.clone(),
        body
      })

      this.$parent.$emit('add', object)
    })
    this.$on('remove', (object) => {
      this.object3D = object

      let entry = this.bodies.find(b => b.id === this.id)

      if (entry) {
        entry.body.remove()
        console.log('remove body', entry.id)
      }

      this.$parent.$emit('remove', object)
    })
  }
}
</script>

<style scoped>
.hidden{
  display: none;
}
</style>
