import * as THREE from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene;
let renderer;

let objectMap = new Map();
let isMoveRing = [false, false, false];

let perspectiveCamera;
let stereoCamera;

let clock;

let cylinderRadius =10, ring1Radius =20, ring2Radius =30, ring3Radius=40;
let cylinderHeight = 50, ringHeight = 20;
let skydomeRadius = 500;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  'use strict';
  scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper());
  scene.background = new THREE.Color(0xe3d8b7);
  createCarrossel();
  createSkydome();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  'use strict';
  perspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight); //default near and far
  perspectiveCamera.position.set(50, 100, 100);
  perspectiveCamera.lookAt(scene.position);
  // TODO - implement stero camera for vr
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createLights() {
  var ambientLight = new THREE.AmbientLight(0xff8000, 0.2);

  scene.add(ambientLight);
}

function createSolidSpotLights(parent) {
  //TODO
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createSkydome() {
  var geometry = new THREE.SphereGeometry(skydomeRadius);
  var texture = new THREE.TextureLoader().load("textures/texture.png");
  var material = new THREE.MeshPhongMaterial({map: texture});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.material.side = THREE.BackSide;
  scene.add(mesh);
}

function createCarrossel() {
  const carrossel = new THREE.Object3D();
  
  const cylinder = createCylinder(carrossel, 0, 0, 0);

  objectMap.set('rings', new Array());
  objectMap.set('surfaces', new Array());
  
  createRing(cylinder, 0, 0, 0, ring1Radius, cylinderRadius, 0x00ff00);
  createRing(cylinder, 0, 0, 0, ring2Radius, ring1Radius, 0x00ffff);
  createRing(cylinder, 0, 0, 0, ring3Radius, ring2Radius, 0x0000ff);
  
  scene.add(carrossel);
}

function createCylinder(parent, x, y, z, outer, inner) {
  const geometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  
  parent.add(mesh);
  objectMap.set('cylinder', mesh);
  
  return mesh;
}

function createRing(parent, x, y, z, outer, inner, c = 0x101010) {
  const geometry = Ring3DGeometry(outer, inner, ringHeight);
  const material = new THREE.MeshBasicMaterial({ color: c, wireframe: false });

  let mesh = new THREE.Mesh(geometry, material);

  for (let i = 0; i < 8; i++) {
    createParametricSolid(mesh, ringHeight/2, (inner + outer)/2, i, 8)    
  }

  mesh.position.set(x, y, z);
  mesh.userData = {moveStep: 0}
  objectMap.get('rings').push(mesh);
  
  parent.add(mesh);
}

function createParametricSolid(parent, heightOffset, centerOffset, idx, total) {
  const jdx = (idx+Math.ceil(centerOffset))%8; // shifting of the index value, so the solids on the rings aren't aligned
  const geometry = getParametricGeometry(jdx);
  const material = new THREE.MeshBasicMaterial( { color: 0xcc1c1c1 >> 2*idx } );
  const mesh = new THREE.Mesh( geometry, material );

  const angle = 2*Math.PI/total * idx;
  const x = centerOffset * Math.cos(angle);
  const z = centerOffset * Math.sin(angle);

  mesh.position.set( x, heightOffset, z);
  objectMap.get("surfaces").push(mesh);
  createSolidSpotLights(mesh);

  parent.add(mesh);
}

function Ring3DGeometry(outer, inner, height) {
  var shape = new THREE.Shape();

  const segments = 64; // Number of segments to use for the shape

  // Create the outer ring
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);

  // Create the hole
  var holePath = new THREE.Path();
  holePath.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  const extrudeSettings = {
    steps: 2,
    depth: height,
    bevelEnabled: false,
  };

  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(Math.PI * 0.5);
  geometry.translate(0,height/2,0);
  return geometry;
}

function getParametricGeometry(i) {
  /*f será uma função tal que f(u,v) = (x,y,z);
    com u,v a variar em [0, 1];
    com y >= 0 para não ficar debaixo do anel
    e com |x|, |z| <= raio dos anéis para não intersetarem com outros sólidos */
  let f;
  const h = 3; const l = 2; // altura e largura
  switch(i%8) {
    case 1: // sela
      f = function (u, v, target) {
        u = (u-0.5)*2; v = (v-0.5)*2; // u, v [0, 1] => [-1, 1]
        target.set(
          /*X=*/ v*l,
          /*Y=*/ ((u**2-v**2)+1)*h,
          /*Z=*/ u*l
        );
      }
      break;
    case 2: // superficie cónica
      f = function (u, v, target) {
        u = (u-0.5)*2; v = (v-0.5)*2; // u, v [0, 1] => [-1, 1]
        target.set(
          /*X=*/ u*l * Math.cos(Math.PI*v),
          /*Y=*/ (Math.abs(u))*h,
          /*Z=*/ u*l * Math.sin(Math.PI*v)
        );
      }
      break;
    case 3: // superficie cilíndrica
      f = function (u, v, target) {
        u = (u-0.5)*2; v = (v-0.5)*2; // u, v [0, 1] => [-1, 1]
        target.set(
          /*X=*/ l * Math.cos(Math.PI*v),
          /*Y=*/ (Math.abs(u))*h,
          /*Z=*/ l * Math.sin(Math.PI*v)
        );
      }
      break;
    case 4: // espiral
      f = function (u, v, target) {
        u = (u-0.5)*2; v = v*3; // u [0, 1] => [-1, 1]; v [0,1] => [0, 3]
        target.set(
          /*X=*/ u*l * Math.cos(Math.PI*v),
          /*Y=*/ (v/3)*h,
          /*Z=*/ u*l * Math.sin(Math.PI*v)
        );
      }
      break;
    case 5: // uma cena que parece mais ou menos uma ampulheta
      f = function (u, v, target) {
        u = (u-0.5)*2; v = (v-0.5)*2; // u, v [0, 1] => [-1, 1]
        target.set(
          /*X=*/ Math.cos(Math.PI*u)*l * Math.cos(Math.PI*v),
          /*Y=*/ (Math.abs(u))*h,
          /*Z=*/ Math.cos(Math.PI*u)*l * Math.sin(Math.PI*v)
        );
      }
      break;
    case 6: // superfície esférica
      f = function (u, v, target) {
        u = (u-0.5)*2; v = (v-0.5)*2; // u, v [0, 1] => [-1, 1]
        target.set(
          /*X=*/ h*Math.cos(Math.PI*v)*Math.sin(Math.PI*u),
          /*Y=*/ h+h*Math.cos(Math.PI*u),
          /*Z=*/ h*Math.sin(Math.PI*v)*Math.sin(Math.PI*u)
        );
      }
      break;
    case 7: // toro
      f = function (u, v, target) {
        u = (u-0.5)*2; v = (v-0.5)*2; // u, v [0, 1] => [-1, 1]
        let r = 0.3, R =0.75;
        target.set(
          /*X=*/ h*Math.cos(Math.PI*v)*(R+r*Math.sin(Math.PI*u)),
          /*Y=*/ 2*R+4*r+h*Math.sin(Math.PI*v)*(R+r*Math.sin(Math.PI*u)),
          /*Z=*/ h*r*Math.cos(Math.PI*u)
        );
      }
      break;
    default: // paraboloide
      f = function (u, v, target) {
        u = (u-0.5)*2; v = (v-0.5)*2; // u, v [0, 1] => [-1, 1]
        target.set(
          /*X=*/ v*l,
          /*Y=*/ (u**2+v**2)*h,
          /*Z=*/ u*l
        );
      };
  }
  return new ParametricGeometry( f, 25, 25 );
}

////////////
/* UPDATE */
////////////
function update() {
  'use strict';

  let delta = clock.getDelta();

  spinCylinder(delta);

  // Try moving each ring
  for (let idx = 0; idx < isMoveRing.length; idx++) {
    if(isMoveRing[idx]) {
      moveRing(idx, delta);
    }
  }

  // Spin each surface
  for (let idx = 0; idx < objectMap.get('surfaces').length; idx++) {
    spinSurface(idx, delta);
  }
}

// MOVEMENTS

function spinCylinder(delta) {
  const speed = 0.7;

  const cylinder = objectMap.get('cylinder');
  const angle = speed*delta;
  cylinder.rotateY(angle);
}

function moveRing(idx, delta) {
  const speed = 1;
  const range = 1;
  
  const ring = objectMap.get('rings')[idx];
  ring.userData.moveStep += speed*delta;
  const distance = range*Math.sin(ring.userData.moveStep + Math.PI/2);
  ring.position.y += distance;
}

function spinSurface(idx, delta) {
  const speed = 1;
  
  const surface = objectMap.get('surfaces')[idx];
  const angle = speed*delta;
  surface.rotateY(angle);
}


/////////////
/* DISPLAY */
/////////////
function render() {
  'use strict';
  
  renderer.render(scene, perspectiveCamera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  'use strict';

  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  createScene();
  createCameras();
  createLights();

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
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
  perspectiveCamera.aspect = window.innerWidth / window.innerHeight;
  perspectiveCamera.updateProjectionMatrix();
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
  'use strict';
  switch (e.key) {
    case '1':
    case '2':
    case '3':
      const idx = parseInt(e.key) - 1;
      if (!isMoveRing[idx])
        isMoveRing[idx] = true;
      break;
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
  'use strict';
  switch (e.key) {
    case '1':
    case '2':
    case '3':
      const idx = parseInt(e.key) - 1;
      isMoveRing[idx] = false;
      break;
  }
}

init();
animate();
