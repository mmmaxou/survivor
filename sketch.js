/// <reference path="./p5/TSDef/p5.global-mode.d.ts" />
/// <reference path="./p5/TSDef/p5.d.ts" />
/// @ts-check

class Vehicle {
  MAX_SPEED = 1
  MAX_FORCE = 1
  PURSUE_SPEED = 1

  constructor (x, y) {
    this.pos = createVector(x, y)
    this.vel = createVector(0, 0)
    this.acc = createVector(0, 0)
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
  MAX_SPEED = 2
  MAX_FORCE = 0.1
  PURSUE_SPEED = 1

  draw () {
    ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
  }
}

class Player extends Vehicle {
  RADIUS = 20
  MAX_SPEED = 3
  MAX_FORCE = 0.35
  PURSUE_SPEED = 1

  draw () {
    ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
  }
}

const ANT_AMOUNT = 10
const ants = []
let player
let mousePos

function setup () {
  createCanvas(windowWidth, windowHeight)
  angleMode(DEGREES)
  background(250, 250, 250)
  player = new Player(mouseX)
  for (let i = 0; i < ANT_AMOUNT; i++) {
    ants.push(new Ant(random(0, windowWidth), random(0, windowHeight)))
  }
}

function draw () {
  background(255, 255, 255, 50)
  mousePos = createVector(mouseX, mouseY)

  stroke(0, 0, 0)
  fill(255, 255, 255)
  player.applyForce(player.seek(mousePos))
  player.update()
  player.draw()

  noStroke()
  fill(0, 0, 0)
  ants.forEach(ant => {
    ant.applyForce(ant.pursue(player))
    ant.update()
    ant.draw()
  })
}

function windowResized () {
  resizeCanvas(windowWidth, windowHeight)
}

function mouseClicked () {}
