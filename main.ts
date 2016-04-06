/// <reference path="phaser/phaser.d.ts"/>
/// <reference path="joypad/GamePad.ts"/>
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

    constructor() {
        super(800, 480, Phaser.CANVAS, 'gameDiv');
        this.state.add('main', mainState);
        this.state.start('main');
    }
}

window.onload = () => {
    var game = new ShooterGame();
};

class mainState extends Phaser.State
{
    //OBSERVER PER SCORE
    //FACTORY O DECORATOR PER MONSTERS
    //
    game:ShooterGame;



    preload():void {
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

        if (this.game.device.desktop) {
            this.game.cursors = this.input.keyboard.createCursorKeys();
        } else {
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

        this.game.scoreText = this.add.text(this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Score: ' + this.score,
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

    private setRandomAngle(monster:Phaser.Sprite) {
        monster.angle = this.rnd.angle();
    }


    private createVirtualJoystick() {this.game.gamepad = new Gamepads.GamePad(this.game, Gamepads.GamepadType.DOUBLE_STICK);};

    private setupCamera() {
        this.camera.follow(this.game.player);
    };

    private createPlayer()
    {
        this.player = this.add.sprite(this.world.centerX, this.world.centerY, 'player');
        this.player.anchor.setTo(0.5, 0.5);
        this.player.health = this.LIVES;
        this.physics.enable(this.player, Phaser.Physics.ARCADE);
        this.player.body.maxVelocity.setTo(this.PLAYER_MAX_SPEED, this.PLAYER_MAX_SPEED); // x, y
        this.player.body.collideWorldBounds = true;
        this.player.body.drag.setTo(this.PLAYER_DRAG, this.PLAYER_DRAG); // x, y
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
        } else
        {
            this.rotateWithRightStick();
            this.fireWithRightStick();
        }
        this.physics.arcade.collide(this.player, this.monsters, this.monsterTouchesPlayer, null, this);
        this.physics.arcade.collide(this.player, this.walls);
        this.physics.arcade.overlap(this.bullets, this.monsters, this.bulletHitMonster, null, this);
        this.physics.arcade.collide(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.arcade.collide(this.walls, this.monsters, Monster.resetMonster, null, this);
        this.physics.arcade.collide(this.monsters, this.monsters, Monster.resetMonster, null, this);
    }

    rotateWithRightStick() {
        var speed = this.gamepad.stick2.speed;

        if (Math.abs(speed.x) + Math.abs(speed.y) > 20) {
            var rotatePos = new Phaser.Point(this.player.x + speed.x, this.player.y + speed.y);
            this.player.rotation = this.physics.arcade.angleToXY(this.player, rotatePos.x, rotatePos.y);

            this.fire();
        }
    }

    fireWithRightStick() {
        //this.gamepad.stick2.
    }

    private monsterTouchesPlayer(player:Phaser.Sprite, monster:Phaser.Sprite) {
        monster.kill();

        player.damage(1);

        this.livesText.setText("Lives: " + this.player.health);

        this.blink(player);

        if (player.health == 0) {
            this.stateText.text = " GAME OVER \n Click to restart";
            this.stateText.visible = true;

            //the "click to restart" handler
            this.input.onTap.addOnce(this.restart, this);
        }
    }

    restart() {
        this.score=0;
        this.game.state.restart();
    }

    private bulletHitWall(bullet:Phaser.Sprite, walls:Phaser.TilemapLayer) {
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
            this.score += 10;
            this.scoreText.setText("Score: " + this.score);
        }
    }

    blink(sprite:Phaser.Sprite) {
        var tween = this.add.tween(sprite)
            .to({alpha: 0.5}, 100, Phaser.Easing.Bounce.Out)
            .to({alpha: 1.0}, 100, Phaser.Easing.Bounce.Out);

        tween.repeat(3);
        tween.start();
    }

    private moveMonsters() {this.monsters.forEach(this.advanceStraightAhead, this)};
    private advanceStraightAhead(monster:Phaser.Sprite) {this.physics.arcade.velocityFromAngle(monster.angle, this.MONSTER_SPEED, monster.body.velocity);}
    private fireWhenButtonClicked() {if (this.input.activePointer.isDown) {this.fire();}};

    private rotatePlayerToPointer()
    {
        this.player.rotation = this.physics.arcade.angleToPointer(this.player, this.input.activePointer);
    };

    private movePlayer() {
        var moveWithKeyboard = function () {
            if (this.cursors.left.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.A)) {
                this.player.body.acceleration.x = -this.PLAYER_ACCELERATION;
            } else if (this.cursors.right.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.D)) {
                this.player.body.acceleration.x = this.PLAYER_ACCELERATION;
            } else if (this.cursors.up.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.W)) {
                this.player.body.acceleration.y = -this.PLAYER_ACCELERATION;
            } else if (this.cursors.down.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.S)) {
                this.player.body.acceleration.y = this.PLAYER_ACCELERATION;
            } else {
                this.player.body.acceleration.x = 0;
                this.player.body.acceleration.y = 0;
            }
        };

        var moveWithVirtualJoystick = function () {
            if (this.gamepad.stick1.cursors.left) {
                this.player.body.acceleration.x = -this.PLAYER_ACCELERATION;
            }
            if (this.gamepad.stick1.cursors.right) {
                this.player.body.acceleration.x = this.PLAYER_ACCELERATION;
            } else if (this.gamepad.stick1.cursors.up) {
                this.player.body.acceleration.y = -this.PLAYER_ACCELERATION;
            } else if (this.gamepad.stick1.cursors.down) {
                this.player.body.acceleration.y = this.PLAYER_ACCELERATION;
            } else {
                this.player.body.acceleration.x = 0;
                this.player.body.acceleration.y = 0;
            }
        };
        if (this.game.device.desktop) {
            moveWithKeyboard.call(this);
        } else {
            moveWithVirtualJoystick.call(this);
        }
    };

    fire():void {
        if (this.time.now > this.nextFire) {
            var bullet = this.bullets.getFirstDead();
            if (bullet) {
                var length = this.player.width * 0.5 + 20;
                var x = this.player.x + (Math.cos(this.player.rotation) * length);
                var y = this.player.y + (Math.sin(this.player.rotation) * length);

                bullet.reset(x, y);

                this.explosion(x, y);

                bullet.angle = this.player.angle;

                var velocity = this.physics.arcade.velocityFromRotation(bullet.rotation, this.BULLET_SPEED);

                bullet.body.velocity.setTo(velocity.x, velocity.y);

                this.nextFire = this.time.now + this.FIRE_RATE;
            }
        }
    }

    explosion(x:number, y:number):void {
        var explosion:Phaser.Sprite = this.explosions.getFirstDead();
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
        this.bullets = this.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(20, 'bullet');

        this.bullets.setAll('anchor.x', 0.5);
        this.bullets.setAll('anchor.y', 0.5);
        this.bullets.setAll('scale.x', 0.5);
        this.bullets.setAll('scale.y', 0.5);
        this.bullets.setAll('outOfBoundsKill', true);
        this.bullets.setAll('checkWorldBounds', true);
    };
    private createMonsters()
    {
        this.monsters = this.add.group();
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
        this.add.existing(monster);
        this.monsters.add(monster);
    }

}


class MonsterFactory
{
    game:ShooterGame;
    constructor(game:Phaser.Game) {this.game = game;}
    createMonster(key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture):Monster
    {
        if (key == 'robot'){return new RobotMonster(this.game, key);}
        if (key =='zombie1'){return new Zombie1Monster(this.game, key);}
        if (key =='zombie2'){return new Zombie2Monster(this.game, key);}
        else{return null;};
    }
}
class Monster extends Phaser.Sprite
{
    game:ShooterGame;
    constructor(game:ShooterGame, x:number, y:number, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture, frame:string|number)
    {
        super(game, x, y, key, frame);
        this.game = game;
        this.game.physics.enable(this, Phaser.Physics.ARCADE);
        this.body.enableBody = true;
        this.anchor.setTo(0.5,0.5);
        this.angle = game.rnd.angle();
        this.events.onOutOfBounds(this.resetMonster, this);
    }
    resetMonster(monster:Phaser.Sprite)
    {
        monster.rotation = this.game.physics.arcade.angleBetween(monster, this.game.player);
    }

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
    MONSTER_HEALTH = 2
    NAME = "Zombie 2";
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 200, 200,key, 0);
        this.health = this.MONSTER_HEALTH;
        this.name = this.NAME;
    }
}
