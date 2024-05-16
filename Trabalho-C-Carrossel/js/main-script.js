import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  'use strict';
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
  'use strict';
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions() {
  'use strict';
}

////////////
/* UPDATE */
////////////
function update() {
  'use strict';
}

/////////////
/* DISPLAY */
/////////////
function render() {
  'use strict';
  
  renderer.render(scene, cameras[currentCamera]);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  'use strict';
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  'use strict';

  update();
  render();

  requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
  'use strict';

  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerHeight > 0 && window.innerWidth > 0) {
    cameras.forEach((camera) => {
      if (camera.isPerspectiveCamera) {
        camera.aspect = window.innerWidth / window.innerHeight;
      } else {
        camera.left = -window.innerWidth / camRatio;
        camera.right = window.innerWidth / camRatio;
        camera.top = window.innerHeight / camRatio;
        camera.bottom = -window.innerHeight / camRatio;
      }
      camera.updateProjectionMatrix();
    });
  }
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  'use strict';
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
  'use strict';
}

init();
animate();
