/// <reference path="./p5/TSDef/p5.global-mode.d.ts" />
/// <reference path="./p5/TSDef/p5.custom.d.ts" />
/// @ts-check
/// @type frameCount

p5.Vector.random2DatDistance = function (distance) {
  return p5.Vector.random2D().mult(distance)
}

class Vehicle {
  get MAX_SPEED () {
    return 1
  }
  get MAX_FORCE () {
    return 1
  }
  get PURSUE_SPEED () {
    return 1
  }

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
  get MAX_SPEED () {
    return environment.ANT_MAX_SPEED
  }
  get MAX_FORCE () {
    return environment.ANT_MAX_FORCE
  }
  get PURSUE_SPEED () {
    return environment.ANT_PURSUE_SPEED
  }
  get RADIUS () {
    return environment.ANT_RADIUS
  }
  get LIFE_SPAN () {
    return environment.ANT_LIFESPAN
  }

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
  get MAX_SPEED () {
    return environment.PLAYER_MAX_SPEED
  }
  get MAX_FORCE () {
    return environment.PLAYER_MAX_FORCE
  }
  get PURSUE_SPEED () {
    return environment.PLAYER_PURSUE_SPEED
  }
  get RADIUS () {
    return environment.PLAYER_RADIUS
  }
  draw () {
    ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
  }
}

class Constants {
  static get SPAWN_DISTANCE () {
    return environment.SPAWN_DISTANCE
  }
  static get ANTS_MAXIMUM () {
    return environment.ANTS_MAXIMUM
  }
}

class PlayerMouvementRandom2D {
  constructor () {
    this.target = createVector()
  }

  update (player) {
    if (frameCount % 100 == 0) {
      this.target = p5.Vector.random2DatDistance(200).add(windowCenter)
    }
    player.applyForce(player.seek(this.target))
  }
}

class PlayerMouvementFollowMouse {
  update (player) {
    const mousePos = createVector(mouseX, mouseY)
    player.applyForce(player.seek(mousePos))
  }
}

class DisplayBar {
  constructor (start, end, color, progression = 1) {
    this.start = start
    this.end = end
    this.color = color
    this.progression = progression
    this.width = this.end.x - this.start.x
    this.height = this.end.y - this.start.y
    this.widthProgression = this.width
  }

  updateProgression (newProgression) {
    this.progression = newProgression
    this.widthProgression = this.width * newProgression
  }

  draw () {
    noStroke()
    fill(0, 0, 0)
    rect(this.start.x, this.start.y, this.width, this.height)
    fill(this.color)
    rect(this.start.x, this.start.y, this.widthProgression, this.height)
  }
}

class Experience {
  constructor () {
    this.createProgressBar()
    this.exp = 0
    this.level = 1
  }

  addExperience (amount) {
    this.exp += amount
    if (this.exp > this.level * 100) {
      this.exp = 0
      this.level += 1
    }
  }

  createProgressBar () {
    this.progressBar = new DisplayBar(
      createVector(0, 0),
      createVector(windowWidth, 5),
      color(0, 60, 255)
    )
  }

  update () {
    const progression = this.exp / (100 * this.level) || 0.01
    this.progressBar.updateProgression(progression)
  }

  draw () {
    this.progressBar.draw()
    fill(0, 0, 0)
    textSize(24)
    textAlign(LEFT, TOP)
    text(str(this.level), 15, 15)
  }
}

const ENVIRONMENT_SPAWN_AROUND = {
  SPAWN_DISTANCE: 600,
  ANTS_MAXIMUM: 200,

  PLAYER_RADIUS: 25,
  PLAYER_MAX_SPEED: 3,
  PLAYER_MAX_FORCE: 0.35,
  PLAYER_PURSUE_SPEED: 1,

  ANT_RADIUS: 10,
  ANT_MAX_SPEED: 1,
  ANT_MAX_FORCE: 0.1,
  ANT_PURSUE_SPEED: 1,
  ANT_LIFESPAN: 600
}

let ants = []
let closeAnts = {}
let windowCenter
let environment = ENVIRONMENT_SPAWN_AROUND
let player
let playerMouvements = []
let lifeBar
let experience

function setup () {
  createCanvas(windowWidth, windowHeight)
  angleMode(DEGREES)
  background(250, 250, 250)

  windowCenter = createVector(windowWidth / 2, windowHeight / 2)
  player = new Player(windowCenter.x, windowCenter.y)

  playerMouvements.push(new PlayerMouvementRandom2D())
  // playerMouvements.push(new PlayerMouvementFollowMouse())

  lifeBar = new DisplayBar(
    createVector(0, windowHeight - 5),
    createVector(windowWidth, windowHeight),
    color(0, 255, 0)
  )

  experience = new Experience()
}

function draw () {
  background(255, 255, 255, 50)

  playerMouvements.forEach(playerMouvement => playerMouvement.update(player))

  ants = ants.filter(ant => !ant._toDelete)
  if (frameCount % 12 == 0 && ants.length < Constants.ANTS_MAXIMUM) {
    const spawnLocation = p5.Vector.random2DatDistance(Constants.SPAWN_DISTANCE)
    spawnLocation.add(player.pos)
    const newAnt = new Ant(spawnLocation.x, spawnLocation.y)
    ants.push(newAnt)
  }
  ants.forEach(ant => {
    ant.applyForce(ant.seek(player.pos))
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

  lifeBar.draw()
  experience.addExperience(1)
  experience.update()
  experience.draw()
}

function windowResized () {
  resizeCanvas(windowWidth, windowHeight)
  lifeBar = new DisplayBar(
    createVector(0, windowHeight - 5),
    createVector(windowWidth, windowHeight),
    color(0, 255, 0)
  )
  experience.createProgressBar()
}
