class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }
    
    subtract(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    magnitude() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }

    argument() {
        return Math.atan2(this.y, this.x);
    }

    normalize(length) {
        this.x *= length/this.magnitude();
        this.y *= length/this.magnitude();
    }

    bottle(length) {
        if(this.magnitude() < length) {
            this.normalize(length);
        }
    }

    cap(length) {
        if(this.magnitude() > length) {
            this.normalize(length);
        }
    }
}

const windowWidth = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

const windowHeight = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

const MAX_SPEED = 3;
const MIN_SPEED = 1.7;
const NUM_BOIDS = 150;
const PERCEPTION = 80;
const MAX_ACCELERATION = 0.04;
let idCounter = 0;

class Boid {
    constructor() {
        this.position = new Vector(Math.random() * windowWidth, Math.random() * windowHeight);
        this.velocity = new Vector( 2/Math.sqrt(2) * MAX_SPEED * Math.random() - (MAX_SPEED/Math.sqrt(2)), 
        2/Math.sqrt(2) * MAX_SPEED * Math.random() - (MAX_SPEED/Math.sqrt(2)));
        this.acceleration = new Vector(0,0);
        let node = document.createElement("div");
        node.innerHTML = '<div id="' + idCounter.toString()  + '" class = "boid" ></div>';
        ++idCounter;
        document.getElementById("boids").appendChild(node);
        this.el = document.getElementById((idCounter-1).toString());
        this.draw();
    }

    draw() {
        this.el.style.left = (this.position.x).toString() + "px";
        this.el.style.top = (windowHeight - this.position.y).toString() + "px";
        this.el.style.transform = "rotate(" + -1*this.velocity.argument().toString() + "rad)";
    }

    update() {
        this.position = this.position.add(this.velocity);
        this.velocity = this.velocity.add(this.acceleration);
        this.velocity.normalize(MIN_SPEED);
        if(this.position.x < 0) this.position.x = windowWidth;
        if(this.position.x > windowWidth) this.position.x = 0;
        if(this.position.y < 0) this.position.y = windowHeight;
        if(this.position.y > windowHeight) this.position.y = 0;
        this.draw();
        
    }

    cohesion(boids) {
        let avgPosition = new Vector(0,0);
        let avgOut = new Vector(0,0);
        let numNeighbors = 0;
        let numOut = 0;
        for(let other of boids) {
            let dist = other.position.subtract(this.position).magnitude();
            if(this != other && dist < PERCEPTION) {
                avgPosition = avgPosition.add(other.position);
                ++numNeighbors;
            }
        }
        if(numNeighbors > 0) {
            avgPosition.x /= numNeighbors;
            avgPosition.y /= numNeighbors;
            let steering = avgPosition.subtract(this.position);
            steering.cap(MAX_ACCELERATION);
            return steering;
        }
        return this.acceleration;
    }

    alignment(boids) {
        let avgVelocity = new Vector(0,0);
        let numNeighbors = 0;
        const MIN_DISTANCE = 5;
        for(let other of boids) {
            let dist = other.position.subtract(this.position).magnitude();
            if(this != other && dist < PERCEPTION && dist > MIN_DISTANCE) {
                avgVelocity = avgVelocity.add(other.velocity);
                ++numNeighbors;
            }
        }
        if(numNeighbors > 0) {
            avgVelocity.x /= numNeighbors;
            avgVelocity.y /= numNeighbors;
            let steering = avgVelocity.subtract(this.velocity);
            steering.cap(MAX_ACCELERATION);
            return steering;
        }
        return this.acceleration;
    }

    separation(boids) {
        let avgVelocity = new Vector(0,0);
        let numNeighbors = 0;
        const MIN_DISTANCE = 50;
        const SCALER = 1;
        for(let other of boids) {
            let dist = other.position.subtract(this.position).magnitude();
            if(this != other && dist < MIN_DISTANCE) {
                let posDifferential = this.position.subtract(other.position);
                posDifferential.x = SCALER/posDifferential.x;
                posDifferential.y = SCALER/posDifferential.y;
                avgVelocity = avgVelocity.add(posDifferential);
            }
        }
        if(numNeighbors > 0) {
            avgVelocity.x /= numNeighbors;
            avgVelocity.y /= numNeighbors;
            let steering = avgVelocity.subtract(this.velocity);
            return steering;
        }
        return this.acceleration;
    }

    
   

    flock(boids) {
        const ALIGNMENT_MULTIPLIER = 1
        const COHESION_MULTIPLIER = 0.2;
        const SEPARATION_MULTIPLIER = 1.4;
        let alignment = this.alignment(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        this.acceleration.x = ALIGNMENT_MULTIPLIER * alignment.x + COHESION_MULTIPLIER * cohesion.x + SEPARATION_MULTIPLIER * separation.x;
        this.acceleration.y = ALIGNMENT_MULTIPLIER * alignment.y + COHESION_MULTIPLIER * cohesion.y + SEPARATION_MULTIPLIER * separation.y;
        this.acceleration.x /= 2;
        this.acceleration.y /= 2;
    }
    
}

document.addEventListener("DOMContentLoaded", function(event) { 
    let flock = [];
    for(let i = 0; i < NUM_BOIDS; ++i) {
        flock.push(new Boid());
    }
    setInterval(function() {
        for(let boid of flock) {
            boid.flock(flock);
            boid.update();
        }
    }, 1);

});
