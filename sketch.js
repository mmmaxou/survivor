/// <reference path="./p5/TSDef/p5.global-mode.d.ts" />
/// <reference path="./p5/TSDef/p5.custom.d.ts" />
/// @ts-check
/// @type frameCount

p5.Vector.random2DAtDistance = function (distance) {
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
    this.vectorToTarget = createVector(0, 0)
    this.distanceToTarget = 0
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
    this.vectorToTarget = force.copy()
    this.distanceToTarget = force.mag()
    force.setMag(this.MAX_SPEED)
    force.sub(this.vel)
    force.limit(this.MAX_FORCE)
    const currentSpeed = this.vel.mag()
    const stepToStop = currentSpeed / this.MAX_FORCE
    const stepToReach = this.distanceToTarget / currentSpeed
    if (this.distanceToTarget < this.MAX_FORCE) {
      return this.vel.setMag(0)
    }
    if (stepToStop * 2 > stepToReach) {
      return p5.Vector.mult(this.vel, -0.5)
    }
    fill(255, 0, 0)
    ellipse(target.x, target.y, 4, 4)
    return force
  }
}

class AntVehicle extends Vehicle {
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
  constructor (x, y) {
    super(x, y)
    this.collision = false
  }
  draw () {
    if (this.collision) {
      fill(0, 255, 0)
      ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
      fill(0, 0, 0)
    } else {
      ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
    }
  }
  update () {
    super.update()
    this.collision = this.distanceToTarget < this.RADIUS
  }
}

class Ant {
  get LIFE_SPAN () {
    return environment.ANT_LIFESPAN
  }

  static RandomCreateAroundVehicle (vehicle) {
    const spawnLocation = p5.Vector.random2DAtDistance(Constants.SPAWN_DISTANCE)
    spawnLocation.add(vehicle.pos)
    const antVehicle = new AntVehicle(spawnLocation.x, spawnLocation.y)
    const ant = new Ant()
    ant.vehicle = antVehicle
    return ant
  }

  constructor () {
    this.vehicle = new AntVehicle()
    this.spawnTime = frameCount
    this._toDelete = false
  }

  update () {
    // Ant follow the player
    this.vehicle.applyForce(this.vehicle.seek(player.vehicle.pos))
    this.vehicle.update()
    if (this.spawnTime + this.LIFE_SPAN < frameCount) {
      this._toDelete = true
    }
    if (this.vehicle.collision) {
      player.collide(this)
    }
  }

  draw () {
    this.vehicle.draw()
  }
}

class PlayerVehicle extends Vehicle {
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
    stroke(0, 0, 0)
    fill(255, 255, 255)
    ellipse(this.pos.x, this.pos.y, this.RADIUS, this.RADIUS)
  }
}

class Player {
  constructor () {
    this.maxLife = 100
    this.life = this.maxLife
    this.experience = new Experience()
    this.vehicle = new PlayerVehicle(windowCenter.x, windowCenter.y)
    this.createLifeBar()
  }
  collide (ant) {
    this.life -= 1
  }
  createLifeBar () {
    this.lifeBar = new DisplayBar(
      createVector(0, windowHeight - 5),
      createVector(windowWidth, windowHeight),
      color(30, 240, 60)
    )
  }
  update () {
    environment.MOVEMENTS.forEach(movement => {
      let force = movement.update(this.vehicle)
      this.vehicle.applyForce(force)
    })
    this.experience.addExperience(1)
    this.experience.update()
    this.lifeBar.updateProgression(this.life / this.maxLife)
    this.vehicle.update()
  }
  draw () {
    this.vehicle.draw()
    this.lifeBar.draw()
    this.experience.draw()
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

class VehicleMouvement {
  update (vehicle) {}
}

class VehicleMouvementRandom2D extends VehicleMouvement {
  update (vehicle) {
    if (!this.target || frameCount % 100 == 0) {
      this.target = p5.Vector.random2DAtDistance(100).add(windowCenter)
    }
    return vehicle.seek(this.target)
  }
}

class VehicleMouvementFollowMouse extends VehicleMouvement {
  update (vehicle) {
    return vehicle.seek(createVector(mouseX, mouseY))
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
      this.levelUp()
    }
  }

  levelUp () {
    this.exp = 0
    this.level += 1
  }

  createProgressBar () {
    this.progressBar = new DisplayBar(
      createVector(0, 0),
      createVector(windowWidth, 8),
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

const ENVIRONMENT_DEFAULT = {
  SPAWN_DISTANCE: 500,
  ANTS_MAXIMUM: 50,

  PLAYER_RADIUS: 25,
  PLAYER_MAX_SPEED: 3,
  PLAYER_MAX_FORCE: 0.5,
  PLAYER_PURSUE_SPEED: 1,

  ANT_RADIUS: 10,
  ANT_MAX_SPEED: 1,
  ANT_MAX_FORCE: 0.1,
  ANT_PURSUE_SPEED: 1,
  ANT_LIFESPAN: 700,

  /** @type {Array<VehicleMouvement>} */
  MOVEMENTS: [new VehicleMouvementFollowMouse()]
}

const ENVIRONMENT_SPAWN_AROUND = {
  ...ENVIRONMENT_DEFAULT,
  ANTS_MAXIMUM: 399
}

const ENVIRONMENT_SINGLE_ENNEMY = {
  ...ENVIRONMENT_DEFAULT,
  ANTS_MAXIMUM: 1,
  /** @type {Array<VehicleMouvement>} */
  MOVEMENTS: [new VehicleMouvementRandom2D()]
}

let ants = []
/** @type {p5.Vector} */
let windowCenter
let environment = ENVIRONMENT_SINGLE_ENNEMY
/** @type {Player} */
let player
let playerMouvements = []

function setup () {
  createCanvas(windowWidth, windowHeight)
  angleMode(DEGREES)
  background(250, 250, 250)

  windowCenter = createVector(windowWidth / 2, windowHeight / 2)
  player = new Player()
}

function draw () {
  background(255, 255, 255, 50)

  player.update()
  player.draw()

  ants = ants.filter(ant => !ant._toDelete)
  if (frameCount % 12 == 0 && ants.length < Constants.ANTS_MAXIMUM) {
    ants.push(Ant.RandomCreateAroundVehicle(player.vehicle))
  }

  ants.forEach(ant => {
    ant.update()
  })

  noStroke()
  fill(0, 0, 0)
  ants.forEach(ant => {
    ant.draw()
  })
}

function windowResized () {
  resizeCanvas(windowWidth, windowHeight)
  player.createLifeBar()
  player.experience.createProgressBar()
}

let mClick = 0
function mouseClicked () {
  mClick += 1
  if (mClick % 2 == 0) {
    environment = ENVIRONMENT_SPAWN_AROUND
  } else {
    environment = ENVIRONMENT_SINGLE_ENNEMY
  }
}
