/// <reference path="phaser/phaser.d.ts"/>
/// <reference path="joypad/GamePad.ts"/>
window.onload = () => {new ShooterGame();};
class ShooterGame extends Phaser.Game
{
    player:Player;
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
    achievementsText:Phaser.Text;
    gamepad:Gamepads.GamePad;
    
    PLAYER_ACCELERATION = 500;
    PLAYER_MAX_SPEED = 300;
    PLAYER_DRAG = 600;
    MONSTER_SPEED = 200;
    BULLET_SPEED = 600;
    FIRE_RATE = 200;
    TEXT_MARGIN = 50;
    NEXT_FIRE = 0;
    constructor() 
    {
        super(1000, 1000, Phaser.CANVAS, 'gameDiv');
        this.state.add('main', mainState);
        this.state.start('main');
    }
    explode(x:number, y:number)
    {
        var explosion = this.explosions.getFirstDead();
        if (explosion)
        {
            explosion.reset(x - this.rnd.integerInRange(0, 5) + this.rnd.integerInRange(0, 5), y - this.rnd.integerInRange(0, 5) + this.rnd.integerInRange(0, 5));
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
}
class mainState extends Phaser.State
{
    game:ShooterGame;
    preload():void
    {
        super.preload();

        this.loadImages();
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
    loadImages()
    {
        this.load.tilemap('tilemap', 'assets/tiles.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('tiles', 'assets/tilesheet_complete.png');
        this.load.image('player', 'assets/survivor1_machine.png');
        this.load.image('bullet', 'assets/bulletBeigeSilver_outline.png');
        this.load.image('zombie1', 'assets/zoimbie1_hold.png');
        this.load.image('zombie2', 'assets/zombie2_hold.png');
        this.load.image('robot', 'assets/robot1_hold.png');
        this.load.image('joystick_base', 'assets/transparentDark05.png');
        this.load.image('joystick_segment', 'assets/transparentDark09.png');
        this.load.image('joystick_knob', 'assets/transparentDark49.png');
        this.load.image('explosion', 'assets/smokeWhite0.png');
        this.load.image('explosion2', 'assets/smokeWhite1.png');
        this.load.image('explosion3', 'assets/smokeWhite2.png');
        this.load.image('red_explosion', 'assets/red_explosion.gif');
        this.load.image('yellow_explosion', 'assets/yellow_explosion.gif');
    }
    create():void
    {
        super.create();
        this.createMap();
        this.createWalls();
        this.createExplosions();
        this.createBullets();
        this.createPlayer();
        this.setupCamera();
        this.createMonsters();
        this.createTexts();
        if (!this.game.device.desktop) {this.createVirtualJoystick();}
    }
    private createTexts() 
    {
        var width = this.scale.bounds.width;
        var height = this.scale.bounds.height;
        this.game.scoreText = this.add.text(this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Score: ' + this.game.player.getScore(), {font: "30px Arial", fill: "#ffffff"});
        this.game.scoreText.fixedToCamera = true;
        this.game.livesText = this.add.text(width - this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Lives: ' + this.game.player.health, {font: "30px Arial", fill: "#ffffff"});
        this.game.livesText.anchor.setTo(1, 0);
        this.game.livesText.fixedToCamera = true;
        this.game.stateText = this.add.text(width / 2, height / 2, '', {font: '84px Arial', fill: '#fff'});
        this.game.stateText.anchor.setTo(0.5, 0.5);
        this.game.stateText.fixedToCamera = true;
        this.game.achievementsText = this.add.text(this.world.centerX, 30, "THIS IS THE OBSERVER PATTERN", {font: "30px Arial", fill: "#ffffff"});
        this.game.achievementsText.anchor.setTo(0.5, 0.5);
        this.game.achievementsText.fixedToCamera = true;
    };
    private createExplosions()
    {
        this.game.explosions = this.add.group();
        this.game.explosions.createMultiple(20, null);
    };
    private createWalls()
    {
        this.game.walls = this.game.tilemap.createLayer('walls');
        this.game.walls.x = this.world.centerX;
        this.game.walls.y = this.world.centerY;
        this.game.walls.resizeWorld();
        this.game.tilemap.setCollisionBetween(1, 195, true, 'walls');
    };
    private createMap()
    {
        this.game.tilemap = this.game.add.tilemap('tilemap');
        this.game.tilemap.addTilesetImage('tilesheet_complete', 'tiles');
        this.game.background = this.game.tilemap.createLayer('background');
        this.game.background.x = this.world.centerX;
        this.game.background.y = this.world.centerY;
    };
    update():void
    {
        super.update();
        this.movePlayer();
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
    movePlayer()
    {
        var moveWithKeyboard = function ()
        {
            if (this.game.cursors.left.isDown || this.input.keyboard.isDown(Phaser.Keyboard.A)) {this.game.player.body.acceleration.x = -this.game.PLAYER_ACCELERATION;}
            else if (this.game.cursors.right.isDown || this.input.keyboard.isDown(Phaser.Keyboard.D)) {this.game.player.body.acceleration.x = this.game.PLAYER_ACCELERATION;}
            else if (this.game.cursors.up.isDown || this.input.keyboard.isDown(Phaser.Keyboard.W)) {this.game.player.body.acceleration.y = -this.game.PLAYER_ACCELERATION;}
            else if (this.game.cursors.down.isDown || this.input.keyboard.isDown(Phaser.Keyboard.S)) {this.game.player.body.acceleration.y = this.game.PLAYER_ACCELERATION;}
            else
            {
                this.game.player.body.acceleration.x = 0;
                this.game.player.body.acceleration.y = 0;
            }
        };
        var moveWithVirtualJoystick = function ()
        {
            if (this.game.gamepad.stick1.cursors.left) {this.game.player.body.acceleration.x = -this.game.PLAYER_ACCELERATION;}
            else if (this.game.gamepad.stick1.cursors.right) {this.game.player.body.acceleration.x = this.game.PLAYER_ACCELERATION;}
            else if (this.game.gamepad.stick1.cursors.up) {this.game.player.body.acceleration.y = -this.game.PLAYER_ACCELERATION;}
            else if (this.game.gamepad.stick1.cursors.down) {this.game.player.body.acceleration.y = this.game.PLAYER_ACCELERATION;}
            else
            {
                this.game.player.body.acceleration.x = 0;
                this.game.player.body.acceleration.y = 0;
            }
        };
        if (this.game.device.desktop) {moveWithKeyboard.call(this);}
        else {moveWithVirtualJoystick.call(this);}
    }
    private monsterTouchesPlayer(player:Player, monster:Monster)
    {
        monster.kill();
        player.damage(1);
        this.game.livesText.setText("Lives: " + this.game.player.health);
        this.blink(player);
        if (player.health == 0)
        {
            this.game.stateText.text = " GAME OVER \n Click to restart";
            this.input.onTap.addOnce(this.restart, this);
        }
    }
    private bulletHitMonster(bullet:Bullet, monster:Monster) 
    {
        bullet.kill();
        monster.damage(1);
        this.explosion(bullet.x, bullet.y, bullet.explosionable);
        if (monster.health > 0) {this.blink(monster)}
        else
        {
            this.game.player.SCORE += 10;
            this.game.scoreText.setText("Score: " + this.game.player.getScore());
        }
    }
    blink(sprite:Phaser.Sprite) 
    {
        var tween = this.add.tween(sprite).to({alpha: 0.5}, 100, Phaser.Easing.Bounce.Out).to({alpha: 1.0}, 100, Phaser.Easing.Bounce.Out);
        tween.repeat(3);
        tween.start();
    }
    fire():void 
    {
        if (this.time.now > this.game.NEXT_FIRE) 
        {
            var bullet = this.game.bullets.getFirstDead();
            if (bullet) 
            {
                var length = this.game.player.width * 0.5 + 20;
                var x = this.game.player.x + (Math.cos(this.game.player.rotation) * length);
                var y = this.game.player.y + (Math.sin(this.game.player.rotation) * length);
                
                this.explosion(x, y, bullet.explosionable);
                bullet.reset(x, y);

                bullet.angle = this.game.player.angle;

                var velocity = this.physics.arcade.velocityFromRotation(bullet.rotation, this.game.BULLET_SPEED);

                bullet.body.velocity.setTo(velocity.x, velocity.y);

                this.game.NEXT_FIRE = this.time.now + this.game.FIRE_RATE;
            }
        }
    }
    
    private createMonsters()
    {
        this.game.monsters = this.add.group();
        var factory = new MonsterFactory(this.game);
        for (var x=0; x<10; x++) {this.addMonster(factory.createMonster('robot'));} //CREAREM 10 ROBOTS CRIDANT A LA FACTORY I DIENTLI EL TIPUS QUE VOLEM
        for (var x=0; x<15; x++) {this.addMonster(factory.createMonster('zombie1'));} //CREAREM 10 ZOMBIES TIPUS 1 CRIDANT A LA FACTORY I DIENTLI EL TIPUS QUE VOLEM
        for (var x=0; x<23; x++) {this.addMonster(factory.createMonster('zombie2'));}  //CREAREM 10 ZOMBIES TIPUS 2 CRIDANT A LA FACTORY I DIENTLI EL TIPUS QUE VOLEM
        var monsterWithAbility = factory.createMonster('robot'); //CREAREM UN ULTIM MONSTER AMB HABILITATS PER COMPROVAR QUE EL DECORATOR FUNCIONA CORRECTAMENT
        monsterWithAbility.setAbility(new Teleport());
        monsterWithAbility.setAbility(new Fly());
        monsterWithAbility.setAbility(new Run());
        this.addMonster(monsterWithAbility);
    };
    private createBullets()
    {
        this.game.bullets = this.add.group();
        this.game.bullets.enableBody = true;
        this.game.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        for (var x=0; x<20; x++) //CREAREM 20 BULLETS I 5 EXPLOSIONS DE CADA TIPUS PER QUE ES VEGI AL JOC QUE FUNCIONA AL CREAR LES BALES LI PODEM DIR FACILMENT QUIN TIPUS DEXPLOSIO TINDRAN O SI NO VOLEM QUE EN TINGUIN
        {
            var bullet = new Bullet(this.game, 'bullet');
            bullet.setExplosionable(new RedExplosion(this.game)); //5 BALES AMB RED EXPLOSION
            this.game.bullets.add(bullet);

            bullet = new Bullet(this.game, 'bullet');
            bullet.setExplosionable(new SmokeExplosion(this.game)); //5 BALES AMB SMOKE EXPLOSION
            this.game.bullets.add(bullet);

            bullet = new Bullet(this.game, 'bullet');
            bullet.setExplosionable(new YellowExplosion(this.game)); //5 BALES AMB YELLOW EXPLOSION
            this.game.bullets.add(bullet);

            bullet = new Bullet(this.game, 'bullet');
            bullet.setExplosionable(new NoExplosion(this.game)); //5 BALES SENSE EXPLOSION
            this.game.bullets.add(bullet);
        }
    };
    fireWhenButtonClicked() {if (this.input.activePointer.isDown) {this.fire();}};
    rotatePlayerToPointer() {this.game.player.rotation = this.physics.arcade.angleToPointer(this.game.player, this.input.activePointer);};
    addMonster(monster:Monster) {this.game.add.existing(monster); this.game.monsters.add(monster);}
    restart() {this.game.state.restart();}
    resetMonster(monster:Monster) {monster.rotation = this.physics.arcade.angleBetween(monster, this.game.player);}
    createVirtualJoystick() {this.game.gamepad = new Gamepads.GamePad(this.game, Gamepads.GamepadType.DOUBLE_STICK);};
    setupCamera() {this.camera.follow(this.game.player);};
    bulletHitWall(bullet:Bullet) {this.explosion(bullet.x, bullet.y, bullet.explosionable); bullet.kill();}
    explosion(x:number, y:number, explosionable:Explosionable):void {explosionable.checkExplosionType(x, y);} //METODE QUE CRIDARA A LA INTERFICIE DE CADA BULLET PER VEURE QUINA EXPLOSIO TE
    createPlayer() {var oriol = new Player('ORIOL', 5, this.game, this.world.centerX, this.world.centerY, 'player', 0); this.game.player = this.add.existing(oriol);}; //METODE PER CREAR JUGADOR
}

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- STRATEGY PATTERN FOR BULLETS & EXPLOSIONS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- STRATEGY PATTERN FOR BULLETS & EXPLOSIONS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- STRATEGY PATTERN FOR BULLETS & EXPLOSIONS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- STRATEGY PATTERN FOR BULLETS & EXPLOSIONS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- STRATEGY PATTERN FOR BULLETS & EXPLOSIONS ---------- ---------- ---------- ---------- ---------- ---------- FINISHED
class Bullet extends Phaser.Sprite //AIXO SERIA COM EL GAT, LES BULLETS EXPLOTEN PER TANT IMPLEMENTEN LA INTERFICIE EXPLOSIONABLE PER A QUE POGUEM PASARLI UN TIPUS D'EXPLOSIÓ
{
    explosionable:Explosionable;
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 0, 0, key, 0);
        this.anchor.setTo(0.5, 0.5);
        this.scale.setTo(0.5, 0.5);
        this.checkWorldBounds = true;
        this.events.onOutOfBounds.add(this.killBullet, this);
        this.kill();
    }
    killBullet(bullet:Bullet) {bullet.kill();}
    setExplosionable(explosionable:Explosionable):void {this.explosionable = explosionable;}
}
interface Explosionable //INTERFICIE EXPLOSIONABLE QUE ENS OBLIGARA A FER EL OVERRIDE DE QUIN TIPUS D'EXPLOSIO ES
{
    checkExplosionType(x:number, y:number):void
}
class SmokeExplosion extends Phaser.Sprite implements Explosionable //EXPLOSIÓ DE FUM
{
    game:ShooterGame;
    constructor(game:ShooterGame)
    {
        super(game, 0, 0, null, 0);
        this.game = game;
        this.anchor.set(0.5, 0.5);
        this.kill();
    }
    checkExplosionType(x:number, y:number):void  //METODE QUE CAMBIARA EL TIPUS D'EXPLOSIÓ DEL GRUP D'EXPLOSIONS DEL GAME
    {
        this.game.explosions.forEach((explosion:Phaser.Sprite) => {explosion.loadTexture(this.game.rnd.pick(['explosion', 'explosion2', 'explosion3']));}, this);
        this.game.explode(x, y);
    }
}
class RedExplosion extends Phaser.Sprite implements Explosionable //EXPLOSIÓ VERMELLA
{
    game:ShooterGame;
    constructor(game:ShooterGame)
    {
        super(game, 0, 0, null, 0);
        this.game = game;
        this.anchor.set(0.5, 0.5);
        this.kill();
    }
    checkExplosionType(x:number, y:number):void  //METODE QUE CAMBIARA EL TIPUS D'EXPLOSIÓ DEL GRUP D'EXPLOSIONS DEL GAME
    {
        this.game.explosions.forEach((explosion:Phaser.Sprite) => {explosion.loadTexture('red_explosion');}, this);
        this.game.explode(x, y);
    }
}
class NoExplosion extends Phaser.Sprite implements Explosionable //SENSE EXPLOSIÓ
{
    game:ShooterGame;
    constructor(game:ShooterGame)
    {
        super(game, 0, 0, null, 0);
        this.game = game;
        this.anchor.set(0.5, 0.5);
        this.kill();
    }
    checkExplosionType(x:number, y:number):void  //METODE QUE CAMBIARA EL TIPUS D'EXPLOSIÓ DEL GRUP D'EXPLOSIONS DEL GAME
    {
        this.game.explosions.forEach((explosion:Phaser.Sprite) => {explosion.loadTexture(null);}, this);
        this.game.explode(x, y);
    }
}
class YellowExplosion extends Phaser.Sprite implements Explosionable //EXPLOSIÓ GROGA
{
    game:ShooterGame;
    constructor(game:ShooterGame)
    {
        super(game, 0, 0, null, 0);
        this.game = game;
        this.anchor.set(0.5, 0.5);
        this.kill();
    }
    checkExplosionType(x:number, y:number):void //METODE QUE CAMBIARA EL TIPUS D'EXPLOSIÓ DEL GRUP D'EXPLOSIONS DEL GAME
    {
        this.game.explosions.forEach((explosion:Phaser.Sprite) => {explosion.loadTexture('yellow_explosion');}, this);
        this.game.explode(x, y);
    }
}

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- DECORATOR PATTERN FOR MONSTERS ABILITIES ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- DECORATOR PATTERN FOR MONSTERS ABILITIES ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- DECORATOR PATTERN FOR MONSTERS ABILITIES ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- DECORATOR PATTERN FOR MONSTERS ABILITIES ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- DECORATOR PATTERN FOR MONSTERS ABILITIES ---------- ---------- ---------- ---------- ---------- ---------- FINISHED
class Ability //CLASE PRINCIPAL QUE NOMES CONTE LA DESCRIPCIO DE LA HABILITAT
{
    ABILITY:string = "None";
    constructor(ability:string) {this.ABILITY = ability;}
}
class Teleport extends Ability {constructor() {super("Teleport")}} //CADASCUNA DE LES ABILITATS QUE LI PODREM AFEGIR A CADA MONSTER
class Fly extends Ability {constructor() {super("Fly");}}
class Run extends Ability {constructor() {super("Run");}}

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- FACTORY PATTERN FOR MONSTERS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- FACTORY PATTERN FOR MONSTERS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- FACTORY PATTERN FOR MONSTERS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- FACTORY PATTERN FOR MONSTERS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- FACTORY PATTERN FOR MONSTERS ---------- ---------- ---------- ---------- ---------- ---------- FINISHED
class Monster extends Phaser.Sprite //MONSTER PER DEFECTE TINDRA TOT EL QUE TINDRIA CUALSEVOL MONSTER, DE CUALSEVOL TIPUS
{
    index:number = 0 ;
    ABILITIES:Array<Ability> = []; //AQUEST ARRAY ES PER EL DECORATOR
    game:ShooterGame;
    MONSTER_HEALTH = 0; //AQUESTES DUES VARIABLES LES TENEN TOTS ELS MONSTRES PERO VARIARAN SEGONS QUIN MONSTRE CREEM
    NAME:string;
    SPEED:number;
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
    update():void
    {
        super.update();
        this.events.onOutOfBounds.add(this.resetMonster, this);
        this.game.physics.arcade.velocityFromAngle(this.angle, this.SPEED, this.body.velocity);
        var toPrint = this.NAME+" ABILITIES:  ";
        for (var x=0; x<this.ABILITIES.length; x++)
        {
            toPrint = toPrint + this.ABILITIES[x].ABILITY;
            // this.game.scoreText.setText(toPrint);  //Uncomment this to check that it works.
        }
    }
    setAbility(ability:Ability)
    {
        this.ABILITIES[this.index] = ability;
        this.index++;
    }
    resetMonster(monster:Phaser.Sprite) {monster.rotation = this.game.physics.arcade.angleBetween(monster, this.game.player);}
}
class MonsterFactory //A LA FACTORY DE MONSTRES LI DIREM QUE VOLEM, AIXO SERIA COM LA CLASE PASTISSERIA O MONERIA QUE CREA EN AQUEST CAS MONSTRES DEL TIPUS QUE VOLGUEM
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
class RobotMonster extends Monster //CADA MONSTER TINDRA NOM VIDA I VELOCITAT DIFERENT
{
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 100, 100, key, 0);
        this.health = 5;
        this.NAME = "ROBOT";
        this.SPEED = 200;
    }
    update():void {super.update();}
}
class Zombie1Monster extends Monster //CADA MONSTER TINDRA NOM VIDA I VELOCITAT DIFERENT
{
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 150, 150,key, 0);
        this.health=2;
        this.NAME="Zombie 1";
        this.SPEED = 300;
    }
    update():void {super.update();}
}
class Zombie2Monster extends Monster //CADA MONSTER TINDRA NOM VIDA I VELOCITAT DIFERENT
{
    constructor(game:ShooterGame, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture)
    {
        super(game, 200, 200,key, 0);
        this.health = 3;
        this.NAME="Zombie 2";
        this.SPEED = 250;
    }
    update():void {super.update();}
}

// ---------- ---------- ---------- ---------- ---------- ---------- ---------- OBSERVER PATTERN FOR PLAYERS SCORE & ACHIEVEMENTS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- OBSERVER PATTERN FOR PLAYERS SCORE & ACHIEVEMENTS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- OBSERVER PATTERN FOR PLAYERS SCORE & ACHIEVEMENTS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- OBSERVER PATTERN FOR PLAYERS SCORE & ACHIEVEMENTS ---------- ---------- ---------- ---------- ---------- ---------- ----------
// ---------- ---------- ---------- ---------- ---------- ---------- ---------- OBSERVER PATTERN FOR PLAYERS SCORE & ACHIEVEMENTS ---------- ---------- ---------- ---------- ---------- ---------- FINISHED
class Player extends Phaser.Sprite //EL PLAYER PODRA SUBSCRIURES O NO A LA CLASE DETAILS
{
    game:ShooterGame;
    details:Details = new Details();
    SCORE:number;
    NAME:string;
    constructor(name:string, startingLives:number, game:ShooterGame, x:number, y:number, key:string|Phaser.RenderTexture|Phaser.BitmapData|PIXI.Texture, frame:string|number)
    {
        super(game, x, y, key, frame);
        this.game = game;
        this.NAME = name;
        this.SCORE = 0;
        this.anchor.setTo(0.5, 0.5);
        this.health = startingLives;
        this.game.physics.enable(this, Phaser.Physics.ARCADE);
        this.body.maxVelocity.setTo(this.game.PLAYER_MAX_SPEED, this.game.PLAYER_MAX_SPEED);
        this.body.collideWorldBounds = true;
        this.body.drag.setTo(this.game.PLAYER_DRAG, this.game.PLAYER_DRAG);
        this.details.subscribe(this);
    }
    preUpdate():void {
        super.preUpdate();
        this.details.generateRandomAchievements(); //AIXO NOMES ES PER GENERAR UNS QUANTS ACHIEVEMENTS ABANS DEL UPDATE()
    }
    update():void
    {
        super.update();
        this.details.update(this); //EL UPDATE DEL PLAYER S'EXECUTA SOL, PERO LA CLASE ACHIEVEMENTS NO ES UN SPRITE I NO S'EXECUTA SOLA, PER TANT AL UPDATE DE PLAYER HAUREM DE FORÇAR A LA DETAILS A FER UPDATE TMB
    }
    notify(notification:string):void {this.game.achievementsText.setText(notification);}
    getScore():number{return this.SCORE;}
}

class Achievement //POJO SIMPLE DE ACHIEVEMENTS, PER QUE EN POGUEM CREAR DE NOUS FACILMENT, NOMES LI HE FICAT UN MISATGE PER QUAN ES COMPLEIX, I UN NUMERO QUE SERA EL SCORE MINIM PER COMPLIR EL ACHIEVEMENT
{
    REQUERIMENT:number = 0;
    MESSAGE:string = "";
    constructor(requeriment:number, message:string)
    {
        this.REQUERIMENT = requeriment;
        this.MESSAGE = message;
    };
}

class Details //EL PLAYER ES SUBSCRIU A LA CLASE DETAILS PER OBSERVAR SI HA COMPLERT ACHIEVEMENTS O NO
{
    PLAYERS:Array<Player> = [];
    ACHIEVEMENTS:Array<Achievement> = [];
    index:number = 0;
    constructor(){}
    subscribe(player:Player) //FUNCIO PER SUBSCRIURE UN PLAYER ALS ACHIEVEMENTS
    {
        this.PLAYERS[this.index] = player;
        this.index++;
    }
    update(player:Player):void
    {
        for (var x=0; x<this.PLAYERS.length; x++) //PER CADASCUN DELS JUGADORS QUE SUBSCRITS
        {
            if (this.PLAYERS[x].NAME == player.NAME) //COMPROVA QUE EL QUE DEMANA LA INFORMACIÓ ESTA SUBSCRIT TMB
            {
                for (var y=0; y<this.ACHIEVEMENTS.length; y++) //I PER CADASCUN DEL ACHIEVEMENTS QUE EXISTEIXEN
                {
                    if (player.SCORE == this.ACHIEVEMENTS[y].REQUERIMENT) //COMPROVA SI HA COMPLERT ALGUN
                    {
                        player.notify(this.ACHIEVEMENTS[y].MESSAGE); //I SI ES AIXI EL NOTIFICA
                    }
                }
            }
        }
    }
    generateRandomAchievements():boolean {for (var x=0; x<5; x++) {this.ACHIEVEMENTS[x] = new Achievement(x*100, "YOU HAVE REACHED LEVEL "+x+"!");} return true;} //METODE PER GENERAR ACHIEVEMENTS 
}