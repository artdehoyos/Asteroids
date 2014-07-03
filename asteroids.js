/**
 * Created by Art on 5/19/14.
 */
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameCanvas',{'preload':preload, 'create':create, 'update':update});

function preload(){
    game.load.spritesheet('ship','assets/ship.png', 27, 31);
    game.load.spritesheet('shots','assets/shots.png',8,10);
    game.load.spritesheet('asteroidlg','assets/asteroidlg.png',99,88);
    game.load.spritesheet('asteroidmd','assets/asteroidmd.png',33,31);
    game.load.spritesheet('asteroidsm','assets/asteroidsm.png',20,19);
}

function create(){
    game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);
    ship = game.add.sprite(200,300,'ship');
    ship.anchor.setTo(0.5, 0.5);
    game.physics.arcade.enableBody(ship);

    asteroids = game.add.group();
    asteroids_lg = game.add.group();
    asteroids_md = game.add.group();
    asteroids_sm = game.add.group();

    asteroids_lg.createMultiple(3, 'asteroidlg');
    asteroids_md.createMultiple(9, 'asteroidmd');
    asteroids_sm.createMultiple(36, 'asteroidsm');

    asteroids.add(asteroids_lg);
    asteroids.add(asteroids_md);
    asteroids.add(asteroids_sm);

    getAsteroids('lg', 3, 5);

    maxTurn = 180;
    turnAccel = 10;
    accel = 150;
    winTextStyle = {font: "96px Arial", fill: "#ffffff", align: "center" };
    ship.body.maxVelocity.setTo(225, 225);

    shots = game.add.group();
    shots.createMultiple(20, 'shots');
    lastShot = game.time.now;
    shotSpeed = 1600;
    shotInterval = 200;

    score = 0;

    scoreText = game.add.text(20, 20, 'Score: '+score, {font:'Arial', fill:'#ffffff'});
    controlsText = game.add.text(20, game.world.bounds.height - 20,'Controls - Move: W,A,S,D Shoot: Space', {font:'Arial', fill:'#ffffff'});
    winText = game.add.text(game.world.centerX, game.world.centerY, '', winTextStyle);
    winText.anchor.set(0.5);
}

function update(){
    if(game.input.keyboard.isDown(Phaser.Keyboard.A)){
        ship.body.angularVelocity -=turnAccel;
        if(Math.abs(ship.body.angularVelocity) > maxTurn)
            ship.body.angularVelocity = -maxTurn;
    }
    else if(game.input.keyboard.isDown(Phaser.Keyboard.D)){
        ship.body.angularVelocity += turnAccel;
        if(Math.abs(ship.body.angularVelocity) > maxTurn)
            ship.body.angularVelocity = maxTurn;
    }
    else{
        if(ship.body.angularVelocity < 0)
            ship.body.angularVelocity += turnAccel;
        if(ship.body.angularVelocity > 0)
            ship.body.angularVelocity -= turnAccel;
    }

    if(game.input.keyboard.isDown(Phaser.Keyboard.W)){

        ship.body.acceleration.x = Math.sin(ship.rotation) * accel;
        ship.body.acceleration.y = -Math.cos(ship.rotation) * accel;
    }
    else{
        ship.body.acceleration.x = 0;
        ship.body.acceleration.y = 0;
    }

    if(game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && ship.alive){
        if(game.time.now - lastShot >= shotInterval){
            lastShot = game.time.now;
            shot = shots.getFirstDead();
            shot.reset(ship.x, ship.y);
            // shot = game.add.sprite(ship.x, ship.y, 'shots');
            shot.anchor.setTo(0.5,0.5);
            game.physics.arcade.enableBody(shot);
            shot.angle = ship.angle;
            shot.body.velocity.x = Math.sin(ship.rotation) * shotSpeed;
            shot.body.velocity.y = -Math.cos(ship.rotation) * shotSpeed;
            shot.checkWorldBounds = true;
            shot.outOfBoundsKill = true;
            shot.lifespan = 2000;
        }

    }

    // Keep objects on the screen
    wrapObject(ship)

    // All these forEach calls are to handle the nested groups.
    asteroids.forEach(function(group){
        group.forEach(wrapObject, this, true);
    }, this, true);

    asteroids.forEach(function(group){
        game.physics.arcade.collide(group, shots, function(asteroid, shot){
            asteroid.damage(1);
            if(asteroid.health < 1){
                if(asteroid.key == 'asteroidlg'){
                    getAsteroids('md', 3, 3, asteroid.position.x, asteroid.position.y);
                    score += 200;
                }
                else if(asteroid.key == 'asteroidmd'){
                    getAsteroids('sm', 4, 1, asteroid.position.x, asteroid.position.y);
                    score += 300;
                }
                else{
                    score += 500;
                }
                asteroid.kill();
            }
            shot.kill();
        });
    });

    asteroids.forEach(function(group){
        game.physics.arcade.collide(ship, group, function(ship, asteroid){
            ship.kill();
            winText.text = 'You Lose';
        });
    },this, true);

    asteroids.forEach(function(group1){
        asteroids.forEach(function(group2){
            game.physics.arcade.collide(group1, group2);
        },this, true);
    },this, true);

    scoreText.text = 'Score: '+score;
    if(asteroids_lg.countLiving() == 0 && asteroids_md.countLiving() == 0 && asteroids_sm.countLiving() == 0){
        winText.text = 'You Win';
    }
}

function getAsteroids(type, count, health, posx, posy){
    for(var i = 0; i < count; i = i + 1){
        var asteroid = eval('asteroids_'+type).getFirstDead();
        game.physics.arcade.enableBody(asteroid);
        asteroid.body.mass = 5;
        if(typeof(posx) === 'undefined' || typeof(posy) === 'undefined'){
            asteroid.reset(Math.random() * 800, Math.random() * 600);
        }
        else{
            asteroid.reset(posx,posy);
        }
        asteroid.anchor.setTo(0.5, 0.5);
        asteroid.body.setSize(asteroid.width * 0.9, asteroid.height * 0.9, 0, 0);
        asteroid.body.angularVelocity = (Math.random() - 0.5) * 30;
        asteroid.body.velocity.x = (Math.random() - 0.5) * 50;
        asteroid.body.velocity.y = (Math.random() - 0.5) * 50;
        asteroid.body.maxVelocity.setTo(200,200);
        asteroid.health = health;
    }
}

function wrapObject(object){
    if (object.x > game.width) object.x = 0;
    if (object.x < 0) object.x = game.width;
    if (object.y > game.height) object.y = 0;
    if (object.y < 0) object.y = game.height;
}

