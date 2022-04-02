/// <reference path="./p5/TSDef/p5.global-mode.d.ts" />
/// <reference path="./p5/TSDef/p5.custom.d.ts" />
/// @ts-check
/// @type frameCount

p5.Vector.random2DatDistance = function (distance) {
  return p5.Vector.random2D().mult(distance)
}

class Vehicle {
  MAX_SPEED = 1
  MAX_FORCE = 1
  PURSUE_SPEED = 1

  constructor (x, y) {
    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.acc = createVector(0, 0)
    this.force = createVector(0, 0)
  }

  applyForce (force) {
    this.acc.add(force)
  }

  update () {
    this.vel.add(this.acc)
    this.vel.limit(this.MAX_SPEED)
    this.pos.add(this.vel)
    this.acc.set(0, 0)
  }

  evade (vehicle) {
    const pursuit = this.pursue(vehicle)
    pursuit.mult(-1)
    return pursuit
  }

  pursue (vehicle) {
    const target = vehicle.pos.copy()
    const prediction = vehicle.vel.copy()
    prediction.mult(this.PURSUE_SPEED)
    target.add(prediction)
    return this.seek(target)
  }

  flee (target) {
    return this.seek(target).mult(-1)
  }

  seek (target) {
    const force = p5.Vector.sub(target, this.pos)
    force.setMag(this.MAX_SPEED)
    force.sub(this.vel)
    force.limit(this.MAX_FORCE)
    return force
  }
}

class Ant extends Vehicle {
  RADIUS = 12
  MAX_SPEED = 1
  MAX_FORCE = 0.05
  PURSUE_SPEED = 0.7
  LIFE_SPAN = 300

  constructor (x, y) {
    super(x, y)
    this.spawnTime = frameCount
    this._toDelete = false
  }

  draw () {
    ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
  }

  update () {
    super.update()
    if (this.spawnTime + this.LIFE_SPAN < frameCount) {
      this._toDelete = true
    }
  }
}

class Player extends Vehicle {
  RADIUS = 20
  MAX_SPEED = 3.5
  MAX_FORCE = 0.35
  PURSUE_SPEED = 1

  draw () {
    ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
  }
}

const ANTS_MAXIMUM = 200
let ants = []
let closeAnts = {}
let windowCenter
let player

function setup () {
  createCanvas(windowWidth, windowHeight)
  angleMode(DEGREES)
  windowCenter = createVector(windowWidth / 2, windowHeight / 2)
  background(250, 250, 250)
  player = new Player(windowCenter.x, windowCenter.y)
}

function draw () {
  background(255, 255, 255, 50)
  const mousePos = createVector(mouseX, mouseY)
  if (ants.length > 1) {
    player.applyForce(player.evade(ants[0]))
  }
  player.applyForce(player.seek(mousePos))
  player.applyForce(player.seek(windowCenter))
  player.applyForce(p5.Vector.random2D())

  ants = ants.filter(ant => !ant._toDelete)
  if (frameCount % 30 && ants.length < ANTS_MAXIMUM) {
    const spawnLocation = p5.Vector.random2DatDistance(500).add(player.pos)
    const newAnt = new Ant(spawnLocation.x, spawnLocation.y)
    ants.push(newAnt)
  }
  ants.forEach(ant => {
    ant.applyForce(ant.pursue(player))
    ant.update()
  })

  stroke(0, 0, 0)
  fill(255, 255, 255)
  player.update()
  player.draw()

  noStroke()
  fill(0, 0, 0)
  ants.forEach(ant => {
    ant.draw()
  })
}

function windowResized () {
  resizeCanvas(windowWidth, windowHeight)
}
