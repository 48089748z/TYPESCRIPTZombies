/// <reference path="phaser/phaser.d.ts"/>
/// <reference path="joypad/GamePad.ts"/>
window.onload = () => {new ShooterGame();};
class ShooterGame extends Phaser.Game
{
    player:Phaser.Sprite;
    cursors:Phaser.CursorKeys;
    bullets:Phaser.Group;
    tilemap:Phaser.Tilemap;
    background:Phaser.TilemapLayer;
    walls:Phaser.TilemapLayer;
    monsters:Phaser.Group;
    explosions:Phaser.Group;
    scoreText:Phaser.Text;
    livesText:Phaser.Text;
    stateText:Phaser.Text;
    gamepad:Gamepads.GamePad;
    
    PLAYER_ACCELERATION = 500;
    PLAYER_MAX_SPEED = 400; // pixels/second
    PLAYER_DRAG = 600;
    MONSTER_SPEED = 200;
    BULLET_SPEED = 500;
    FIRE_RATE = 1;
    LIVES = 100;
    TEXT_MARGIN = 50;
    nextFire = 0;
    score = 0;

    constructor() 
    {
        super(800, 480, Phaser.CANVAS, 'gameDiv');
        this.state.add('main', mainState);
        this.state.start('main');
    }
}
class mainState extends Phaser.State
{
    //OBSERVER PER SCORE
    //FACTORY O DECORATOR PER MONSTERS
    //OTRO PARA BULLETS ?
    //Y TMB PARA EXPLOSIONS SUPONGO
    game:ShooterGame;
    preload():void
    {
        super.preload();

        this.load.image('bg', 'assets/bg.png');
        this.load.image('player', 'assets/survivor1_machine.png');
        this.load.image('bullet', 'assets/bulletBeigeSilver_outline.png');
        this.load.image('zombie1', 'assets/zoimbie1_hold.png');
        this.load.image('zombie2', 'assets/zombie2_hold.png');
        this.load.image('robot', 'assets/robot1_hold.png');
        this.load.image('explosion', 'assets/smokeWhite0.png');
        this.load.image('explosion2', 'assets/smokeWhite1.png');
        this.load.image('explosion3', 'assets/smokeWhite2.png');
        this.load.tilemap('tilemap', 'assets/tiles.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('tiles', 'assets/tilesheet_complete.png');

        this.load.image('joystick_base', 'assets/transparentDark05.png');
        this.load.image('joystick_segment', 'assets/transparentDark09.png');
        this.load.image('joystick_knob', 'assets/transparentDark49.png');
        this.physics.startSystem(Phaser.Physics.ARCADE);
        if (this.game.device.desktop) {this.game.cursors = this.input.keyboard.createCursorKeys();} 
        else 
        {
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
            this.scale.forceOrientation(true);
            this.scale.startFullScreen(false);
        }
    }

    create():void {
        super.create();
        this.createTilemap();
        this.createBackground();
        this.createWalls();
        this.createExplosions();
        this.createBullets();
        this.createPlayer();
        this.setupCamera();
        this.createMonsters();
        this.createTexts();

        if (!this.game.device.desktop) {
            this.createVirtualJoystick();
        }
    }

    private createTexts() {
        var width = this.scale.bounds.width;
        var height = this.scale.bounds.height;

        this.game.scoreText = this.add.text(this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Score: ' + this.game.score,
            {font: "30px Arial", fill: "#ffffff"});
        this.game.scoreText.fixedToCamera = true;
        this.game.livesText = this.add.text(width - this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Lives: ' + this.game.player.health,
            {font: "30px Arial", fill: "#ffffff"});
        this.game.livesText.anchor.setTo(1, 0);
        this.game.livesText.fixedToCamera = true;

        this.game.stateText = this.add.text(width / 2, height / 2, '', {font: '84px Arial', fill: '#fff'});
        this.game.stateText.anchor.setTo(0.5, 0.5);
        this.game.stateText.visible = false;
        this.game.stateText.fixedToCamera = true;
    };

    private createExplosions()
    {
        this.game.explosions = this.add.group();
        this.game.explosions.createMultiple(20, 'explosion');

        this.game.explosions.setAll('anchor.x', 0.5);
        this.game.explosions.setAll('anchor.y', 0.5);

        this.game.explosions.forEach((explosion:Phaser.Sprite) => {
            explosion.loadTexture(this.rnd.pick(['explosion', 'explosion2', 'explosion3']));
        }, this);
    };

    private createWalls()
    {
        this.game.walls = this.game.tilemap.createLayer('walls');
        this.game.walls.x = this.world.centerX;
        this.game.walls.y = this.world.centerY;

        this.game.walls.resizeWorld();

        this.game.tilemap.setCollisionBetween(1, 195, true, 'walls');
    };

    private createBackground()
    {
        this.game.background = this.game.tilemap.createLayer('background');
        this.game.background.x = this.world.centerX;
        this.game.background.y = this.world.centerY;
    };

    private createTilemap()
    {
        this.game.tilemap = this.game.add.tilemap('tilemap');
        this.game.tilemap.addTilesetImage('tilesheet_complete', 'tiles');
    };
    private createVirtualJoystick() {this.game.gamepad = new Gamepads.GamePad(this.game, Gamepads.GamepadType.DOUBLE_STICK);};

    private setupCamera() {
        this.camera.follow(this.game.player);
    };

    private createPlayer()
    {
        this.game.player = this.add.sprite(this.world.centerX, this.world.centerY, 'player');
        this.game.player.anchor.setTo(0.5, 0.5);
        this.game.player.health = this.game.LIVES;
        this.game.physics.enable(this.game.player, Phaser.Physics.ARCADE);
        this.game.player.body.maxVelocity.setTo(this.game.PLAYER_MAX_SPEED, this.game.PLAYER_MAX_SPEED); // x, y
        this.game.player.body.collideWorldBounds = true;
        this.game.player.body.drag.setTo(this.game.PLAYER_DRAG, this.game.PLAYER_DRAG); // x, y
    };

    update():void
    {
        super.update();
        this.movePlayer();
        this.moveMonsters();
        if (this.game.device.desktop)
        {
            this.rotatePlayerToPointer();
            this.fireWhenButtonClicked();
        } 
        this.physics.arcade.collide(this.game.player, this.game.monsters, this.monsterTouchesPlayer, null, this);
        this.physics.arcade.collide(this.game.player, this.game.walls);
        this.physics.arcade.overlap(this.game.bullets, this.game.monsters, this.bulletHitMonster, null, this);
        this.physics.arcade.collide(this.game.bullets, this.game.walls, this.bulletHitWall, null, this);
        this.physics.arcade.collide(this.game.walls, this.game.monsters, this.resetMonster, null, this);
        this.physics.arcade.collide(this.game.monsters, this.game.monsters, this.resetMonster, null, this);
    }
    resetMonster(monster:Phaser.Sprite) {monster.rotation = this.physics.arcade.angleBetween(monster, this.game.player);}
    
    private monsterTouchesPlayer(player:Phaser.Sprite, monster:Phaser.Sprite) {
        monster.kill();
        player.damage(1);
        this.game.livesText.setText("Lives: " + this.game.player.health);
        this.blink(player);
        if (player.health == 0) {
            this.game.stateText.text = " GAME OVER \n Click to restart";
            this.game.stateText.visible = true;
            this.input.onTap.addOnce(this.restart, this);
        }
    }
    restart()
    {
        this.game.player.health = 100;
        this.game.score=0;
        this.game.state.restart();
    }

    private bulletHitWall(bullet:Phaser.Sprite) {
        this.explosion(bullet.x, bullet.y);
        bullet.kill();
    }

    private bulletHitMonster(bullet:Phaser.Sprite, monster:Phaser.Sprite) {
        bullet.kill();
        monster.damage(1);


        this.explosion(bullet.x, bullet.y);

        if (monster.health > 0) {
            this.blink(monster)
        } else {
            this.game.score += 10;
            this.game.scoreText.setText("Score: " + this.game.score);
        }
    }

    blink(sprite:Phaser.Sprite) {
        var tween = this.add.tween(sprite)
            .to({alpha: 0.5}, 100, Phaser.Easing.Bounce.Out)
            .to({alpha: 1.0}, 100, Phaser.Easing.Bounce.Out);

        tween.repeat(3);
        tween.start();
    }

    private moveMonsters() {this.game.monsters.forEach(this.advanceStraightAhead, this)};
    private advanceStraightAhead(monster:Phaser.Sprite) {this.physics.arcade.velocityFromAngle(monster.angle, this.game.MONSTER_SPEED, monster.body.velocity);}
    private fireWhenButtonClicked() {if (this.input.activePointer.isDown) {this.fire();}};

    private rotatePlayerToPointer()
    {
        this.game.player.rotation = this.physics.arcade.angleToPointer(this.game.player, this.input.activePointer);
    };

    private movePlayer() 
    {
        var moveWithKeyboard = function () 
        {
            if (this.game.cursors.left.isDown || this.input.keyboard.isDown(Phaser.Keyboard.A)) {this.game.player.body.acceleration.x = -this.game.PLAYER_ACCELERATION;}
            if (this.game.cursors.right.isDown || this.input.keyboard.isDown(Phaser.Keyboard.D)) {this.game.player.body.acceleration.x = this.game.PLAYER_ACCELERATION;} 
            if (this.game.cursors.up.isDown || this.input.keyboard.isDown(Phaser.Keyboard.W)) {this.game.player.body.acceleration.y = -this.game.PLAYER_ACCELERATION;}
            if (this.game.cursors.down.isDown || this.input.keyboard.isDown(Phaser.Keyboard.S)) {this.game.player.body.acceleration.y = this.game.PLAYER_ACCELERATION;}
            else 
            {
                this.game.player.body.acceleration.x = 0;
                this.game.player.body.acceleration.y = 0;
            }
        };

        var moveWithVirtualJoystick = function () 
        {
            if (this.game.gamepad.stick1.cursors.left) {this.game.player.body.acceleration.x = -this.game.PLAYER_ACCELERATION;}
            if (this.game.gamepad.stick1.cursors.right) {this.game.player.body.acceleration.x = this.game.PLAYER_ACCELERATION;}
            if (this.game.gamepad.stick1.cursors.up) {this.game.player.body.acceleration.y = -this.game.PLAYER_ACCELERATION;}
            if (this.game.gamepad.stick1.cursors.down) {this.game.player.body.acceleration.y = this.game.PLAYER_ACCELERATION;}
            else 
            {
                this.game.player.body.acceleration.x = 0;
                this.game.player.body.acceleration.y = 0;
            }
        };
        if (this.game.device.desktop) 
        {
            moveWithKeyboard.call(this);
            moveWithVirtualJoystick.call(this);
        }
        else {moveWithVirtualJoystick.call(this);}
    };

    fire():void {
        if (this.time.now > this.game.nextFire) {
            var bullet = this.game.bullets.getFirstDead();
            if (bullet) {
                var length = this.game.player.width * 0.5 + 20;
                var x = this.game.player.x + (Math.cos(this.game.player.rotation) * length);
                var y = this.game.player.y + (Math.sin(this.game.player.rotation) * length);

                bullet.reset(x, y);

                this.explosion(x, y);

                bullet.angle = this.game.player.angle;

                var velocity = this.physics.arcade.velocityFromRotation(bullet.rotation, this.game.BULLET_SPEED);

                bullet.body.velocity.setTo(velocity.x, velocity.y);

                this.game.nextFire = this.time.now + this.game.FIRE_RATE;
            }
        }
    }

    explosion(x:number, y:number):void {
        var explosion:Phaser.Sprite = this.game.explosions.getFirstDead();
        if (explosion) {
            explosion.reset(
                x - this.rnd.integerInRange(0, 5) + this.rnd.integerInRange(0, 5),
                y - this.rnd.integerInRange(0, 5) + this.rnd.integerInRange(0, 5)
            );
            explosion.alpha = 0.6;
            explosion.angle = this.rnd.angle();
            explosion.scale.setTo(this.rnd.realInRange(0.5, 0.75));

            this.add.tween(explosion.scale).to({x: 0, y: 0}, 500).start();
            var tween = this.add.tween(explosion).to({alpha: 0}, 500);
            tween.onComplete.add(() => {
                explosion.kill();
            });
            tween.start();
        }

    }
    private createBullets()
    {
        this.game.bullets = this.add.group();
        this.game.bullets.enableBody = true;
        this.game.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.game.bullets.createMultiple(20, 'bullet');

        this.game.bullets.setAll('anchor.x', 0.5);
        this.game.bullets.setAll('anchor.y', 0.5);
        this.game.bullets.setAll('scale.x', 0.5);
        this.game.bullets.setAll('scale.y', 0.5);
        this.game.bullets.setAll('outOfBoundsKill', true);
        this.game.bullets.setAll('checkWorldBounds', true);
    };
    private createMonsters()
    {
        this.game.monsters = this.add.group();
        var factory = new MonsterFactory(this.game);

        //CREAREM 10 Robots
        for (var x=0; x<10; x++) {this.addToGame(factory.createMonster('robot'));}

        //CREAREM 5 Zombies tipus 1
        for (var x=0; x<5; x++) {this.addToGame(factory.createMonster('zombie1'));}

        //CREAREM 3 Zombies tipus 2
        for (var x=0; x<3; x++) {this.addToGame(factory.createMonster('zombie2'));}
    };
    private addToGame(monster:Monster)
    {
        this.game.add.existing(monster);
        this.game.monsters.add(monster);
    }
}

class MonsterFactory
{
    game:ShooterGame;
    constructor(game:ShooterGame) {this.game = game;}
    createMonster(key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture):Monster
    {
        if (key == 'robot'){return new RobotMonster(this.game, key);}
        if (key =='zombie1'){return new Zombie1Monster(this.game, key);}
        if (key =='zombie2'){return new Zombie2Monster(this.game, key);}
        else{return null;}
    }
}
class Monster extends Phaser.Sprite {
    game:ShooterGame;
    constructor(game:ShooterGame, x:number, y:number, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture, frame:string|number)
    {
        super(game, x, y, key, frame);
        this.game = game;
        this.game.physics.enable(this, Phaser.Physics.ARCADE);
        this.body.enableBody = true;
        this.anchor.setTo(0.5,0.5);
        this.angle = game.rnd.angle();
        this.checkWorldBounds = true;
    }
    update():void {
        super.update();
        this.events.onOutOfBounds.add(this.resetMonster, this);
    }
    resetMonster(monster:Phaser.Sprite) {monster.rotation = this.game.physics.arcade.angleBetween(monster, this.game.player);}
}
   

class RobotMonster extends Monster
{
    MONSTER_HEALTH = 3;
    NAME = "ROBOT";
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 100, 100, key, 0);
        this.health = this.MONSTER_HEALTH;
        this.name = this.NAME;
    }
}
class Zombie1Monster extends Monster
{
    MONSTER_HEALTH = 1;
    NAME = "Zombie 1";
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 150, 150,key, 0);
        this.health=this.MONSTER_HEALTH;
        this.name = this.NAME;
    }
}
class Zombie2Monster extends Monster
{
    MONSTER_HEALTH = 2;
    NAME = "Zombie 2";
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 200, 200,key, 0);
        this.health = this.MONSTER_HEALTH;
        this.name = this.NAME;
    }
}
