// ===================== Fall 2022 EECS 493 Assignment 3 =====================
// This starter code provides a structure and helper functions for implementing
// the game functionality. It is a suggestion meant to help you, and you are not
// required to use all parts of it. You can (and should) add additional functions
// as needed or change existing functions.

// ==================================================
// ============ Page Scoped Globals Here ============
// ==================================================

// Div Handlers
let game_window;
let game_screen;
let onScreenAsteroid;

// Difficulty Helpers
let astProjectileSpeed = 3;          // easy: 1, norm: 3, hard: 5

// Game Object Helpers
let currentAsteroid = 1;
let AST_OBJECT_REFRESH_RATE = 15;
let maxPersonPosX = 1218;
let maxPersonPosY = 658;
let PERSON_SPEED = 5;                // Speed of the person
let vaccineOccurrence = 20000;       // Vaccine spawns every 20 seconds
let vaccineGone = 5000;              // Vaccine disappears in 5 seconds
let maskOccurrence = 15000;          // Masks spawn every 15 seconds
let maskGone = 5000;                 // Mask disappears in 5 seconds
let difficulty = "normal";
let spawn_rate = 800;
// let spawn_rate = 3000;
let rocket = $('#rocket');
let shield_num = 1;
let rocket_size = 50;
let shield_obtained = false;
let danger = $('#danger_num');
let danger_num = 20;
let level = $('#level_num');
let level_num = 1;
let score = $('#score_num');
let score_num = 0;
var collect_audio = new Audio('src/audio/collect.mp3');
var die_audio = new Audio('src/audio/die.mp3');
var volume_val = 50;
var played = false;
let spawn_interval;
let shield_interval;
let portal_interval;
let player_interval;
let score_interval;
let collided = false;
let spawnAsteroid;

// Movement Helpers
var LEFT = false;
var RIGHT = false;
var UP = false;
var DOWN = false;
var touched = false;

var KEYS = {
  left: 37, 
  right: 39, 
  up: 38,
  down: 40
  // spacebar: 32,
  // shift: 16
}

// ==============================================
// ============ Functional Code Here ============
// ==============================================

// Main
$(document).ready(function () {
  // ====== Startup ====== 
  game_window = $('.game-window');
  game_screen = $("#actual_game");
  onScreenAsteroid = $('.curAstroid');

  // TODO: ADD MORE
  //spawn(); // Example: Spawn an asteroid that travels from one border to another
  $(window).keydown(keyPressRouter);
  maxRocketPosX = game_window.width() - rocket.width(); 
  maxRocketPosY = game_window.height() - rocket.height(); 
  game_screen.hide('');
  $('#game_right_section').hide();
});

// TODO: ADD YOUR FUNCTIONS HERE

// Keydown event handler
document.onkeydown = function (e) {
  if (e.key == 'ArrowLeft') LEFT = true;
  if (e.key == 'ArrowRight') RIGHT = true;
  if (e.key == 'ArrowUp') UP = true;
  if (e.key == 'ArrowDown') DOWN = true;
}

// Keyup event handler
document.onkeyup = function (e) {
  if (e.key == 'ArrowLeft') LEFT = false;
  if (e.key == 'ArrowRight') RIGHT = false;
  if (e.key == 'ArrowUp') UP = false;
  if (e.key == 'ArrowDown') DOWN = false;
}

function setting_click() {
  $('#settings').show();
  
  
  var slider = document.getElementById("myRange");
  var output = document.getElementById("volume-value");
  output.innerHTML = slider.value;

  slider.oninput = function() {
  output.innerHTML = this.value;
  collect_audio.volume = this.value / 100;
  die_audio.volume = this.value / 100;
}
}

function play_game() {
  clearInterval(spawn_interval);
  if (difficulty == 'normal') {
    danger_num = 20;
  }
  if (!played) {
    $('#tutorial').show();
    played = true;
  }
  else {
    show_splash();
    $('#game_right_section').show();
  }
  // spawn_interval = setInterval(spawn, spawn_rate);
  shield_interval = setInterval(gen_shield, maskOccurrence);
  portal_interval = setInterval(gen_portal, vaccineOccurrence);
  player_interval = setInterval(reset_player, 1);
  // score_interval = setInterval(score_update, 500);
}

function start_over() {
  $('#actual_game').hide();
  $('#landing-page').show();
  $('#game_over').hide();
  // show landing page buttons
  $('#play_game_btn').show();
  $('#settings_btn').show();
  collided = false;
  if (difficulty == "easy") {
    danger_num = 10;
  }
  if (difficulty == "normal") {
    danger_num = 20;
  }
  if (difficulty == "hard") {
    danger_num = 30;
  }
  level_num = 1;
  score_num = 0;
  $('#score_num').html(score_num);
  $('#rocket').css("left", "45%");
  $('#rocket').css("top", "45%");
  // need to clear screen before spawning again
  
}

function show_splash() {
  $('#tutorial').hide();
  $('#get-ready').show();
  setTimeout(function() {
    $('#actual_game').show();
    spawn_interval = setInterval(spawn, spawn_rate);
    score_interval = setInterval(score_update, 500);
  }, 3000);
  $('#game_right_section').show();
}

function reset_player() {
  if (!LEFT && !RIGHT &&!UP &&!DOWN) {
    if (shield_obtained) {
      $('#rocket-img').attr('src', 'src/player/player_shielded.gif');
    }
    else {
      $('#rocket-img').attr('src', 'src/player/player.gif');
    }
  }
}

function close_settings() {
  $('#settings').hide();
}

function easy_selected() {
  difficulty = "easy";
  spawn_rate = 1000;
  astProjectileSpeed = 1;
  $('#normal').css('border', '2px solid black');
  $('#hard').css('border', '2px solid black');
  $('#easy').css('border', '5px solid yellow');
  danger_num = 10;
}

function normal_selected() {
  difficulty = "normal";
  spawn_rate = 800;
  astProjectileSpeed = 3;
  $('#easy').css('border', '2px solid black');
  $('#hard').css('border', '2px solid black');
  $('#normal').css('border', '5px solid yellow');
  danger_num = 20;
}

function hard_selected() {
  difficulty = "hard";
  spawn_rate = 600;
  astProjectileSpeed = 5;
  $('#easy').css('border', '2px solid black');
  $('#normal').css('border', '2px solid black');
  $('#hard').css('border', '5px solid yellow');
  danger_num = 30;
}

// location of portals and shields on thhe board is random and should be contained entirely within the dimensions of the board
// PORTALS AND SHIELDS DO NOT MOVE!

// shield spawns every 15 seconds and disappears 5 seconds after it was spawned
function gen_shield() {
  let rand_x = getRandomNumber(0, 1218);
  let rand_y = getRandomNumber(0, 658);
  $('#shield').css("top", rand_y);
  $('#shield').css("left", rand_x);
  $('#shield').show();
  setTimeout(hide_shield, maskGone);
  $('#rocket-img').attr('src', 'src/player/player_shielded.gif');
}

function hide_shield() {
  $('#shield').hide();
}

// portal spawns every 20 seconds and disappears 5 seconds after it was spawned
function gen_portal() {
  let rand_x = getRandomNumber(0, 1218);
  let rand_y = getRandomNumber(0, 658);
  $('#portal').css("top", rand_y);
  $('#portal').css("left", rand_x);
  $('#portal').show();
  setTimeout(hide_portal, vaccineGone);
}

function hide_portal() {
  $('#portal').hide();
}

function keyPressRouter(event) {
  switch(event.which) {
    case KEYS.up:
    case KEYS.down: 
    case KEYS.left: 
    case KEYS.right:
      console.log("Arrow key pressed!");  
      moveSpaceShip(event.which); 
      break;
    default: 
      console.log("INVALID INPUT!!!!");       
      break;

  }
}

function moveSpaceShip(direction) {
  switch(direction) {
    case KEYS.left: 
      if (collided) {
        break;
      }
      console.log("moving left"); 
      var newPos = parseInt($('#rocket').css("left")) - rocket_size; 
      console.log($('#rocket').css("left"));
      console.log(newPos);
      if (newPos < 0) {
        newPos = 0; 
      }
      if (shield_obtained) {
        $('#rocket-img').attr('src', 'src/player/player_shielded_left.gif');
      }
      else {
        $('#rocket-img').attr('src', 'src/player/player_left.gif');
      }
      $('#rocket').css("left", newPos); 
      break;
    case KEYS.up:
      if (collided) {
        break;
      } 
      console.log("moving up"); 
      // ADD CODE HERE TO MOVE SPACESHIP UP
      var newPos = parseInt($('#rocket').css("top")) - rocket_size;
      console.log($('#rocket').css("top"));
      console.log(newPos);
      if (newPos < 0) {
        newPos = 0;
      }
      if (shield_obtained) {
        $('#rocket-img').attr('src', 'src/player/player_shielded_up.gif');
      }
      else {
        $('#rocket-img').attr('src', 'src/player/player_up.gif');
      }
      $('#rocket').css("top", newPos);
      break;
    case KEYS.down: 
      if (collided) {
        break;
      }
      console.log("moving down"); 
      var newPos = parseInt($('#rocket').css("top")) + rocket_size;
      console.log($('#rocket').css("top"));
      console.log(newPos);
      if (newPos > maxPersonPosY) {
        newPos = maxPersonPosY; 
      }
      if (shield_obtained) {
        $('#rocket-img').attr('src', 'src/player/player_shielded_down.gif');
      }
      else {
        $('#rocket-img').attr('src', 'src/player/player_down.gif');
      }
      $('#rocket').css("top", newPos); 
      break;
    case KEYS.right: 
      if (collided) {
        break;
      }
      console.log("moving right"); 
      // ADD CODE HERE TO MOVE SPACESHIP TO THE RIGHT
      var newPos = parseInt($('#rocket').css("left")) + rocket_size;
      console.log($('#rocket').css("left"));
      console.log(newPos);
      if (newPos > maxPersonPosX) {
        newPos = maxPersonPosX;
      }
      if (shield_obtained) {
        $('#rocket-img').attr('src', 'src/player/player_shielded_right.gif');
      }
      else {
        $('#rocket-img').attr('src', 'src/player/player_right.gif');
      }
      $('#rocket').css("left", newPos);
      break;
  }
  
}

// Starter Code for randomly generating and moving an asteroid on screen
// Feel free to use and add additional methods to this class
class Asteroid {
  // constructs an Asteroid object
  constructor() {
      /*------------------------Public Member Variables------------------------*/
      // create a new Asteroid div and append it to DOM so it can be modified later
      let objectString = "<div id = 'a-" + currentAsteroid + "' class = 'curAstroid' > <img src = 'src/asteroid.png'/></div>";
      onScreenAsteroid.append(objectString);
      // select id of this Asteroid
      this.id = $('#a-' + currentAsteroid);
      currentAsteroid++; // ensure each Asteroid has its own id
      // current x, y position of this Asteroid
      this.cur_x = 0; // number of pixels from right
      this.cur_y = 0; // number of pixels from top

      /*------------------------Private Member Variables------------------------*/
      // member variables for how to move the Asteroid
      this.x_dest = 0;
      this.y_dest = 0;
      // member variables indicating when the Asteroid has reached the boarder
      this.hide_axis = 'x';
      this.hide_after = 0;
      this.sign_of_switch = 'neg';
      // spawn an Asteroid at a random location on a random side of the board
      this.#spawnAsteroid();
  }

  // Requires: called by the user
  // Modifies:
  // Effects: return true if current Asteroid has reached its destination, i.e., it should now disappear
  //          return false otherwise
  hasReachedEnd() {
      if(this.hide_axis == 'x'){
          if(this.sign_of_switch == 'pos'){
              if(this.cur_x > this.hide_after){
                  return true;
              }                    
          }
          else{
              if(this.cur_x < this.hide_after){
                  return true;
              }          
          }
      }
      else {
          if(this.sign_of_switch == 'pos'){
              if(this.cur_y > this.hide_after){
                  return true;
              }                    
          }
          else{
              if(this.cur_y < this.hide_after){
                  return true;
              }          
          }
      }
      return false;
  }

  // Requires: called by the user
  // Modifies: cur_y, cur_x
  // Effects: move this Asteroid 1 unit in its designated direction
  updatePosition() {
      // ensures all asteroids travel at current level's speed
      this.cur_y += this.y_dest * astProjectileSpeed;
      this.cur_x += this.x_dest * astProjectileSpeed;
      // update asteroid's css position
      this.id.css('top', this.cur_y);
      this.id.css('right', this.cur_x);
  }

  // Requires: this method should ONLY be called by the constructor
  // Modifies: cur_x, cur_y, x_dest, y_dest, num_ticks, hide_axis, hide_after, sign_of_switch
  // Effects: randomly determines an appropriate starting/ending location for this Asteroid
  //          all asteroids travel at the same speed
  #spawnAsteroid() {
      // REMARK: YOU DO NOT NEED TO KNOW HOW THIS METHOD'S SOURCE CODE WORKS
      let x = getRandomNumber(0, 1280);
      let y = getRandomNumber(0, 720);
      let floor = 784;
      let ceiling = -64;
      let left = 1344;
      let right = -64;
      let major_axis = Math.floor(getRandomNumber(0, 2));
      let minor_aix =  Math.floor(getRandomNumber(0, 2));
      let num_ticks;

      if(major_axis == 0 && minor_aix == 0){
          this.cur_y = floor;
          this.cur_x = x;
          let bottomOfScreen = game_screen.height();
          num_ticks = Math.floor((bottomOfScreen + 64) / astProjectileSpeed);

          this.x_dest = (game_screen.width() - x);
          this.x_dest = (this.x_dest - x)/num_ticks + getRandomNumber(-.5,.5);
          this.y_dest = -astProjectileSpeed - getRandomNumber(0, .5);
          this.hide_axis = 'y';
          this.hide_after = -64;
          this.sign_of_switch = 'neg';
      }
      if(major_axis == 0 && minor_aix == 1){
          this.cur_y = ceiling;
          this.cur_x = x;
          let bottomOfScreen = game_screen.height();
          num_ticks = Math.floor((bottomOfScreen + 64) / astProjectileSpeed);

          this.x_dest = (game_screen.width() - x);
          this.x_dest = (this.x_dest - x)/num_ticks + getRandomNumber(-.5,.5);
          this.y_dest = astProjectileSpeed + getRandomNumber(0, .5);
          this.hide_axis = 'y';
          this.hide_after = 784;
          this.sign_of_switch = 'pos';
      }
      if(major_axis == 1 && minor_aix == 0) {
          this.cur_y = y;
          this.cur_x = left;
          let bottomOfScreen = game_screen.width();
          num_ticks = Math.floor((bottomOfScreen + 64) / astProjectileSpeed);

          this.x_dest = -astProjectileSpeed - getRandomNumber(0, .5);
          this.y_dest = (game_screen.height() - y);
          this.y_dest = (this.y_dest - y)/num_ticks + getRandomNumber(-.5,.5);
          this.hide_axis = 'x';
          this.hide_after = -64;
          this.sign_of_switch = 'neg';
      }
      if(major_axis == 1 && minor_aix == 1){
          this.cur_y = y;
          this.cur_x = right;
          let bottomOfScreen = game_screen.width();
          num_ticks = Math.floor((bottomOfScreen + 64) / astProjectileSpeed);

          this.x_dest = astProjectileSpeed + getRandomNumber(0, .5);
          this.y_dest = (game_screen.height() - y);
          this.y_dest = (this.y_dest - y)/num_ticks + getRandomNumber(-.5,.5);
          this.hide_axis = 'x';
          this.hide_after = 1344;
          this.sign_of_switch = 'pos';
      }
      // show this Asteroid's initial position on screen
      this.id.css("top", this.cur_y);
      this.id.css("right", this.cur_x);
      // normalize the speed s.t. all Asteroids travel at the same speed
      let speed = Math.sqrt((this.x_dest)*(this.x_dest) + (this.y_dest)*(this.y_dest));
      this.x_dest = this.x_dest / speed;
      this.y_dest = this.y_dest / speed;
  }
}

// Spawns an asteroid travelling from one border to another
function spawn() {
  let asteroid = new Asteroid();
  setTimeout(spawn_helper(asteroid), 0);
  // setInterval(check_collisions, 1, asteroid.id);
  spawnAsteroid = setInterval(check_collisions, 1, asteroid.id);
}

function check_collisions(asteroid_obj) {
  // console.log("spawn");
  if (isColliding(asteroid_obj, $("#rocket"))) {
    if (shield_obtained) {
      $('#rocket-img').attr('src', 'src/player/player.gif');
      shield_obtained = false;
      asteroid_obj.remove();
    }
    else {
      collided = true;
      // need to stop rocket from moving
      clearInterval(spawn_interval);
      clearInterval(shield_interval);
      clearInterval(portal_interval);
      clearInterval(score_interval);
      clearInterval(spawnAsteroid);
      die_audio.play();
      console.log("game over");
      $('#rocket-img').attr('src', 'src/player/player_touched.gif');
      setTimeout(game_end, 2000);
    }
    console.log("collision");
  }
  else if (isColliding($("#shield"), $("#rocket"))) {
    collect_audio.play();
    $('#shield').hide();
    shield_obtained = true;
  }
  else if (isColliding($("#portal"), $("#rocket"))) {
    
    collect_audio.play();
    astProjectileSpeed *= 1.2;
    danger_num += 2;
    level_num += 1;
    $('#danger_num').html(danger_num);
    $('#level_num').html(level_num);
    $('#portal').hide();
  }
}

function game_end() {
  // clearInterval(spawn_interval);
  $('#final_score').html(score_num);
  $('#actual_game').hide();
  $('#play_game_btn').hide();
  $('#settings_btn').hide();
  $('#landing-page').show();
  $('#get-ready').hide();
  $('#game_over').show();
  $('#game_right_section').hide();
  // need to remove everything in curAstroid html class
  // score_num = 0;
  $('.curAstroid').empty();
}

function score_update() {
  score_num += 40;
  console.log(score_num);
  $('#score_num').html(score_num);
}

function spawn_helper(asteroid) {
  let astermovement = setInterval(function () {
    // update asteroid position on screen
    asteroid.updatePosition();

    // determine whether asteroid has reached its end position, i.e., outside the game border
    if (asteroid.hasReachedEnd()) {
      asteroid.id.remove();
      clearInterval(astermovement);
    }
    if (collided) {
      // asteroid.id.remove();
      clearInterval(astermovement);
    }
  }, AST_OBJECT_REFRESH_RATE);
}

//===================================================

// ==============================================
// =========== Utility Functions Here ===========
// ==============================================

// Are two elements currently colliding?
function isColliding(o1, o2) {
  return isOrWillCollide(o1, o2, 0, 0);
}

// Will two elements collide soon?
// Input: Two elements, upcoming change in position for the moving element
function willCollide(o1, o2, o1_xChange, o1_yChange) {
  return isOrWillCollide(o1, o2, o1_xChange, o1_yChange);
}

// Are two elements colliding or will they collide soon?
// Input: Two elements, upcoming change in position for the moving element
// Use example: isOrWillCollide(paradeFloat2, person, FLOAT_SPEED, 0)
function isOrWillCollide(o1, o2, o1_xChange, o1_yChange) {
  // if (o1.width() === null || o2.width() === null) {
  //   return;
  // }
  const o1D = {
    'left': o1.offset().left + o1_xChange,
    'right': o1.offset().left + o1.width() + o1_xChange,
    'top': o1.offset().top + o1_yChange,
    'bottom': o1.offset().top + o1.height() + o1_yChange
  };
  const o2D = {
    'left': o2.offset().left,
    'right': o2.offset().left + o2.width(),
    'top': o2.offset().top,
    'bottom': o2.offset().top + o2.height()
  };
  // Adapted from https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  if (o1D.left < o2D.right &&
    o1D.right > o2D.left &&
    o1D.top < o2D.bottom &&
    o1D.bottom > o2D.top) {
    // collision detected!
    return true;
  }
  return false;
}

// Get random number between min and max integer
function getRandomNumber(min, max) {
  return (Math.random() * (max - min)) + min;
}
