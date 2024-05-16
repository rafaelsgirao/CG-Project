import * as THREE from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene
let renderer;

let perspectiveCamera;
let stereoCamera;

let clock;

let cylinderRadius =10, ring1Radius =20, ring2Radius =30, ring3Radius=40;
let cylinderHeight = 50, ringHeight = 20;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  'use strict';
  scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper());
  scene.background = new THREE.Color(0xe3d8b7);
  createCarrossel();

  /*const geometry = Ring3DGeometry(20, 10, 5);
  const material = new THREE.MeshBasicMaterial({ color: 0x101010, wireframe: false });
  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
*/}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  'use strict';
  perspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight); //default near and far
  perspectiveCamera.position.set(50, 100, 100);
  perspectiveCamera.lookAt(scene.position);
  //orthographicCamera
  // TODO - implement stero camera for vr
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCarrossel() {
  const carrossel = new THREE.Object3D();
  
  const cylinder = createCylinder(carrossel, 0, 0, 0);
  createRing(cylinder, 0, 0, 0, ring1Radius, cylinderRadius);
  createRing(cylinder, 0, 0, 0, ring2Radius, ring1Radius);
  createRing(cylinder, 0, 0, 0, ring3Radius, ring2Radius);
  
  scene.add(carrossel);
}

function createCylinder(parent, x, y, z, outer, inner) {
  const geometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  
  parent.add(mesh);
  
  return mesh;
}

function createRing(parent, x, y, z, outer, inner) {
  const geometry = Ring3DGeometry(outer, inner, ringHeight);
  const material = new THREE.MeshBasicMaterial({ color: 0x101010, wireframe: false });

  let mesh = new THREE.Mesh(geometry, material);

  addParametricSolids(mesh);

  mesh.position.set(x, y, z);
  
  parent.add(mesh);
}

function addParametricSolids(parent) {
  /*const geometry = new THREE.ParametricGeometry( THREE.ParametricGeometries.klein, 25, 25 );
  const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  const klein = new THREE.Mesh( geometry, material );
  scene.add( klein );*/
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
  return geometry;
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
      if (!moveFirst) {
        moveFirst = true;
      }
      break;
    case '2':
      if (!moveSecond) {
        moveSecond = true;
      }
      break;
    case '3':
      if (!moveThird) {
        moveThird = true;
      }
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
      if (moveFirst)
        moveFirst = false;
      break;
    case '2':
      if (moveSecond)
        moveSecond = true;
      break;
    case '3':
      if (moveThird)
        moveThird = true;
      break;
  }
}

init();
animate();
