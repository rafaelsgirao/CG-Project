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
let isMoveRing = [true, true, true];

let perspectiveCamera;
let stereoCamera;

let clock;

let cylinderRadius = 10,
  ring1Radius = 20,
  ring2Radius = 30,
  ring3Radius = 40;
let cylinderHeight = 50,
  ringHeight = 20;
let skydomeRadius = 500;

let directionalLight;
let directionalHelper;

let lights = new Array();
let lightsHelpers = new Array();

let enableHelpers = false;

//materials
const LAMBERT = 1;
const TOON = 2;
const PHONG = 3;
const NORMAL = 4;
let materialsOff = false;
let changeMaterial = true;
let currentMaterial = LAMBERT;

// altura e largura das superficies parametricas
const h = 3;
const l = 2;

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
  createMobiusStrip();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createCameras() {
  'use strict';
  perspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight); //default near and far
  perspectiveCamera.position.set(50, 110, 120);
  perspectiveCamera.lookAt(scene.position);
  // TODO - implement stero camera for vr
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

function createLights() {
  const ambientLight = new THREE.AmbientLight(0xff8000, 0.1);

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(30, 60, 0);
  directionalLight.target = scene;
  directionalHelper = new THREE.DirectionalLightHelper(directionalLight); // just to help - remove later
  
  scene.add(ambientLight);
  scene.add(directionalLight);
  scene.add(directionalHelper);
}

function createSolidSpotLight(parent) {
  const spotLight = new THREE.SpotLight(0xffffff, 1);
  spotLight.target.position.x = spotLight.position.x;
  spotLight.target.position.y = spotLight.position.y + 1;
  spotLight.target.position.z = spotLight.position.z;
  spotLight.angle = Math.PI/2;
  const helper = new THREE.SpotLightHelper(spotLight);

  parent.add(spotLight);
  parent.add(helper);
  lights.push(spotLight);
  lightsHelpers.push(helper);
}

/////////////////////////////////
/* OBJECT3D(S) HELPER FUNCTIONS*/
/////////////////////////////////

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
    segments: segments,
  };

  var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(Math.PI * 0.5);
  geometry.translate(0, height / 2, 0);
  return geometry;
}

/**
 * Parametric functions
 * f(u,v) = (x,y,z);
    com u,v a variar em [0, 1];
    com y >= 0 para não ficar debaixo do anel
    e com |x|, |z| <= raio dos anéis para não intersetarem com outros sólidos
 * */

function saddle(u, v, target) {
  // u, v [0, 1] => [-1, 1]
  u = (u - 0.5) * 2;
  v = (v - 0.5) * 2;
  target.set(v * l, (u ** 2 - v ** 2 + 1) * h, u * l);
}
function conicalSurface(u, v, target) {
  // u, v [0, 1] => [-1, 1]
  u = (u-0.5)*2; 
  v = (v-0.5)*2; 
  target.set(
    (Math.abs(u))*h - h/2,
    u*l * Math.cos(Math.PI*v) + l,
    u*l * Math.sin(Math.PI*v)
  );
}
function cilindricSurface(u, v, target) {
  // u, v [0, 1] => [-1, 1]
  u = (u-0.5)*2; 
  v = (v-0.5)*2; 
  target.set(
    (Math.abs(u))*h - h/2,
    l * Math.cos(Math.PI*v) + l,
    l * Math.sin(Math.PI*v)
  );
}
function spiral(u, v, target) {
  // u [0, 1] => [-1, 1]; v [0,1] => [0, 3]
  u = (u - 0.5) * 2;
  v = v * 3;
  target.set(u * l * Math.cos(Math.PI * v), (v / 3) * h, u * l * Math.sin(Math.PI * v));
}
function hourglass(u, v, target) {
  // u, v [0, 1] => [-1, 1]
  u = (u - 0.5) * 2;
  v = (v - 0.5) * 2;
  target.set(
    (Math.abs(u))*h - h/2,
    Math.cos(Math.PI*u)*l * Math.cos(Math.PI*v) + l,
    Math.cos(Math.PI*u)*l * Math.sin(Math.PI*v)
  );
}
function sphericalSurface(u, v, target) {
  // u, v [0, 1] => [-1, 1]
  u = (u - 0.5) * 2;
  v = (v - 0.5) * 2;
  target.set(
    h * Math.cos(Math.PI * v) * Math.sin(Math.PI * u),
    h + h * Math.cos(Math.PI * u),
    h * Math.sin(Math.PI * v) * Math.sin(Math.PI * u)
  );
}
function torus(u, v, target) {
  // u, v [0, 1] => [-1, 1]
  u = (u - 0.5) * 2;
  v = (v - 0.5) * 2;
  const r = 0.3;
  const R = 0.75;
  target.set(
    h * Math.cos(Math.PI * v) * (R + r * Math.sin(Math.PI * u)),
    2 * R + 4 * r + h * Math.sin(Math.PI * v) * (R + r * Math.sin(Math.PI * u)),
    h * r * Math.cos(Math.PI * u)
  );
}
function paraboloid(u, v, target) {
  // u, v [0, 1] => [-1, 1]
  u = (u - 0.5) * 2;
  v = (v - 0.5) * 2;
  target.set(v * l, (u ** 2 + v ** 2) * h, u * l);
}

function getParametricGeometry(i) {
  let f;
  switch (i % 8) {
    case 1:
      f = saddle;
      break;
    case 2:
      f = conicalSurface;
      break;
    case 3:
      f = cilindricSurface;
      break;
    case 4:
      f = spiral;
      break;
    case 5:
      f = hourglass;
      break;
    case 6:
      f = sphericalSurface;
      break;
    case 7:
      f = torus;
      break;
    default:
      f = paraboloid;
      break;
  }
  return new ParametricGeometry(f, 25, 25);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createSkydome() {
  var geometry = new THREE.SphereGeometry(skydomeRadius);
  var texture = new THREE.TextureLoader().load('textures/texture.png');

  const lambertMaterial = new THREE.MeshLambertMaterial({ map: texture });
  lambertMaterial.side = THREE.BackSide;

  const toonMaterial = new THREE.MeshToonMaterial({ map: texture });
  toonMaterial.side = THREE.BackSide;

  const phongMaterial = new THREE.MeshPhongMaterial({ map: texture });
  phongMaterial.side = THREE.BackSide;

  const normalMaterial = new THREE.MeshNormalMaterial({});
  normalMaterial.side = THREE.BackSide;

  const basicMaterial = new THREE.MeshBasicMaterial({ map: texture });
  basicMaterial.side = THREE.BackSide;

  var mesh = new THREE.Mesh(geometry);
  mesh.userData = {
    lambert: lambertMaterial,
    toon: toonMaterial,
    phong: phongMaterial,
    normal: normalMaterial,
    basic: basicMaterial,
  };

  objectMap.set('skydome', mesh);
  scene.add(mesh);
}

function createCarrossel() {
  const carrossel = new THREE.Object3D();
  const cylinder = createCylinder(carrossel, 0, 0, 0);
  objectMap.set('rings', new Array());
  objectMap.set('surfaces', new Array());
  createRing(cylinder, 0, 0.5, 0, ring1Radius, cylinderRadius, 0x00ff00);
  createRing(cylinder, 0, 1, 0, ring2Radius, ring1Radius, 0x00ffff);
  createRing(cylinder, 0, 1.5, 0, ring3Radius, ring2Radius, 0x0000ff);
  scene.add(carrossel);
}

function createCylinder(parent, x, y, z) {
  const geometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight);

  const lambertMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });

  const toonMaterial = new THREE.MeshToonMaterial({ color: 0xff0000 });

  const phongMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

  const normalMaterial = new THREE.MeshNormalMaterial({});

  const basicMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const mesh = new THREE.Mesh(geometry);
  mesh.userData = {
    lambert: lambertMaterial,
    toon: toonMaterial,
    phong: phongMaterial,
    normal: normalMaterial,
    basic: basicMaterial,
  };

  mesh.position.set(x, y, z);

  parent.add(mesh);
  objectMap.set('cylinder', mesh);
  return mesh;
}

function createRing(parent, x, y, z, outer, inner, c = 0x101010) {
  const geometry = Ring3DGeometry(outer, inner, ringHeight);

  const lambertMaterial = new THREE.MeshLambertMaterial({ color: c });

  const toonMaterial = new THREE.MeshToonMaterial({ color: c });

  const phongMaterial = new THREE.MeshPhongMaterial({ color: c });

  const normalMaterial = new THREE.MeshNormalMaterial({});

  const basicMaterial = new THREE.MeshBasicMaterial({ color: c });

  const mesh = new THREE.Mesh(geometry);
  mesh.userData = {
    moveStep: y,
    lambert: lambertMaterial,
    toon: toonMaterial,
    phong: phongMaterial,
    normal: normalMaterial,
    basic: basicMaterial,
  };

  for (let i = 0; i < 8; i++) {
    createParametricSolid(mesh, ringHeight / 2, (inner + outer) / 2, i, 8);
  }

  mesh.position.set(x, y, z);

  objectMap.get('rings').push(mesh);
  parent.add(mesh);
}

function createParametricSolid(parent, heightOffset, centerOffset, idx, total) {
  const jdx = (idx + Math.ceil(centerOffset)) % 8; // shifting of the index value, so the solids on the rings aren't aligned
  const geometry = getParametricGeometry(jdx);

  let colour = Math.random()*16**6

  const lambertMaterial = new THREE.MeshLambertMaterial({ color: colour});

  const toonMaterial = new THREE.MeshToonMaterial({ color: colour});

  const phongMaterial = new THREE.MeshPhongMaterial({ color: colour});

  const normalMaterial = new THREE.MeshNormalMaterial({});

  const basicMaterial = new THREE.MeshBasicMaterial({ color: colour});

  const mesh = new THREE.Mesh(geometry);
  mesh.userData = {
    lambert: lambertMaterial,
    toon: toonMaterial,
    phong: phongMaterial,
    normal: normalMaterial,
    basic: basicMaterial, 

    rotDirection: (centerOffset*idx%2) * 2 -1
  };

  const angle = ((2 * Math.PI) / total) * idx;
  const x = centerOffset * Math.cos(angle);
  const z = centerOffset * Math.sin(angle);

  mesh.position.set(x, heightOffset, z);

  createSolidSpotLight(mesh);

  objectMap.get('surfaces').push(mesh);
  parent.add(mesh);
}

function createMobiusStrip() {
  const vertices = [
    0.9, 0, -0, 1.1, 0, 0, 0.8241872278871633, 0.36695179592028854, -0.02079116908177593,
    1.0029036873980386, 0.44652149023131177, 0.02079116908177593, 0.6080024837579808,
    0.6752551675088466, -0.040673664307580015, 0.7302587289597358, 0.811034483445942,
    0.040673664307580015, 0.2840169943749475, 0.8741144278657722, -0.058778525229247314,
    0.3340169943749474, 1.0279986047245349, 0.058778525229247314, -0.09753414386684887,
    0.92797539147978, -0.07431448254773942, -0.11152278266845779, 1.0610683992567669,
    0.07431448254773942, -0.47499999999999976, 0.8227241335952168, -0.08660254037844387,
    -0.5249999999999998, 0.9093266739736606, 0.08660254037844387, -0.7840169943749473,
    0.5696216890923392, -0.09510565162951536, -0.8340169943749473, 0.6059488154926073,
    0.09510565162951536, -0.967923174178441, 0.20573842186410332, -0.09945218953682733,
    -0.9883720272891703, 0.21008495977141528, 0.09945218953682733, -0.9883720272891703,
    -0.21008495977141503, -0.09945218953682734, -0.967923174178441, -0.20573842186410307,
    0.09945218953682734, -0.8340169943749475, -0.605948815492607, -0.09510565162951537,
    -0.7840169943749475, -0.569621689092339, 0.09510565162951537, -0.5250000000000005,
    -0.9093266739736603, -0.08660254037844388, -0.4750000000000005, -0.8227241335952166,
    0.08660254037844388, -0.11152278266845875, -1.0610683992567667, -0.07431448254773945,
    -0.09753414386684973, -0.92797539147978, 0.07431448254773945, 0.3340169943749472,
    -1.0279986047245349, -0.05877852522924733, 0.28401699437494726, -0.8741144278657723,
    0.05877852522924733, 0.730258728959736, -0.8110344834459418, -0.04067366430758001,
    0.6080024837579809, -0.6752551675088463, 0.04067366430758001, 1.0029036873980386,
    -0.44652149023131177, -0.02079116908177593, 0.8241872278871634, -0.36695179592028854,
    0.02079116908177593, 1.1, -2.6942229581241775e-16, -1.2246467991473533e-17, 0.9,
    -2.2043642384652358e-16, 1.2246467991473533e-17,
  ];

  const indices = [
    0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6, 5, 7, 6, 6, 7, 8, 7, 9, 8, 8, 9, 10, 9, 11, 10, 10,
    11, 12, 11, 13, 12, 12, 13, 14, 13, 15, 14, 14, 15, 16, 15, 17, 16, 16, 17, 18, 17, 19, 18, 18,
    19, 20, 19, 21, 20, 20, 21, 22, 21, 23, 22, 22, 23, 24, 23, 25, 24, 24, 25, 26, 25, 27, 26, 26,
    27, 28, 27, 29, 28, 28, 29, 30, 29, 31, 30,
  ];

  const geometry = new THREE.BufferGeometry();

  // Adding vertices, indices, and UVs to the geometry
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(indices, 2));
  geometry.setIndex(indices);

  const materialProps = {
    color: 0xc0c0c0,
    side: THREE.DoubleSide,
    //wireframe: false,
  };

  const lambertMaterial = new THREE.MeshLambertMaterial(materialProps);

  const toonMaterial = new THREE.MeshToonMaterial(materialProps);

  const phongMaterial = new THREE.MeshPhongMaterial(materialProps);

  const normalMaterial = new THREE.MeshNormalMaterial(materialProps);

  const basicMaterial = new THREE.MeshBasicMaterial(materialProps);

  // Creating the Mobius strip (mesh)
  const mesh = new THREE.Mesh(geometry, lambertMaterial);

  mesh.userData = {
    lambert: lambertMaterial,
    toon: toonMaterial,
    phong: phongMaterial,
    normal: normalMaterial,
    basic: basicMaterial,
  };

  mesh.scale.set(50, 50, 50);

  // Rotate the Möbius strip for some animation
  mesh.rotation.x += Math.PI / 2;
  mesh.rotation.z += Math.PI / 2;
  mesh.position.y = 40;

  // Adding the Mobius strip to the scene
  scene.add(mesh);
  objectMap.set('mobiusStrip', mesh);
}

///////////////
/* MOVEMENTS */
///////////////
function spinCylinder(delta) {
  const speed = 0.7;
  const cylinder = objectMap.get('cylinder');
  const angle = speed * delta;
  cylinder.rotateY(angle);
}

function moveRing(idx, delta) {
  const speed = 2;
  const ring = objectMap.get('rings')[idx];
  ring.userData.moveStep += speed * delta;
  ring.position.y = (cylinderHeight / 2) * Math.sin(ring.userData.moveStep);
}

function spinSurface(idx, delta) {
  const speed = 1;
  const surface = objectMap.get('surfaces')[idx];
  const angle = speed*delta*surface.userData.rotDirection;
  surface.rotateY(angle);
}

/////////////////////
/* UPDATE Materials*/
/////////////////////

function changeMaterials() {
  const cylinder = objectMap.get('cylinder');
  const rings = objectMap.get('rings');
  const surfaces = objectMap.get('surfaces');
  const skydome = objectMap.get('skydome');
  const mobiusStrip = objectMap.get('mobiusStrip');

  switch (currentMaterial) {
    case LAMBERT:
      skydome.material = skydome.userData.lambert;
      skydome.material.normalNeedsUpdate = true;
      cylinder.material = cylinder.userData.lambert;
      cylinder.material.normalNeedsUpdate = true;
      mobiusStrip.material = mobiusStrip.userData.lambert;
      mobiusStrip.material.normalNeedsUpdate = true;
      rings.forEach((ring) => {
        ring.material = ring.userData.lambert;
        ring.material.normalNeedsUpdate = true;
      });
      surfaces.forEach((surface) => {
        surface.material = surface.userData.lambert;
        surface.material.normalNeedsUpdate = true;
      });
      break;

    case PHONG:
      skydome.material = skydome.userData.phong;
      skydome.material.normalNeedsUpdate = true;
      cylinder.material = cylinder.userData.phong;
      cylinder.material.normalNeedsUpdate = true;
      mobiusStrip.material = mobiusStrip.userData.phong;
      mobiusStrip.material.normalNeedsUpdate = true;
      rings.forEach((ring) => {
        ring.material = ring.userData.phong;
        ring.material.normalNeedsUpdate = true;
      });
      surfaces.forEach((surface) => {
        surface.material = surface.userData.phong;
        surface.material.normalNeedsUpdate = true;
      });
      break;

    case TOON:
      skydome.material = skydome.userData.toon;
      skydome.material.normalNeedsUpdate = true;
      cylinder.material = cylinder.userData.toon;
      cylinder.material.normalNeedsUpdate = true;
      mobiusStrip.material = mobiusStrip.userData.toon;
      mobiusStrip.material.normalNeedsUpdate = true;
      rings.forEach((ring) => {
        ring.material = ring.userData.toon;
        ring.material.normalNeedsUpdate = true;
      });
      surfaces.forEach((surface) => {
        surface.material = surface.userData.toon;
        surface.material.normalNeedsUpdate = true;
      });
      break;

    case NORMAL:
      skydome.material = skydome.userData.normal;
      skydome.material.normalNeedsUpdate = true;
      cylinder.material = cylinder.userData.normal;
      cylinder.material.normalNeedsUpdate = true;
      mobiusStrip.material = mobiusStrip.userData.normal;
      mobiusStrip.material.normalNeedsUpdate = true;
      rings.forEach((ring) => {
        ring.material = ring.userData.normal;
        ring.material.normalNeedsUpdate = true;
      });
      surfaces.forEach((surface) => {
        surface.material = surface.userData.normal;
        surface.material.normalNeedsUpdate = true;
      });
      break;

    default:
      skydome.material = skydome.userData.lambert;
      skydome.material.normalNeedsUpdate = true;
      cylinder.material = cylinder.userData.lambert;
      cylinder.material.normalNeedsUpdate = true;
      mobiusStrip.material = mobiusStrip.userData.lambert;
      mobiusStrip.material.normalNeedsUpdate = true;
      rings.forEach((ring) => {
        ring.material = ring.userData.lambert;
        ring.material.normalNeedsUpdate = true;
      });
      surfaces.forEach((surface) => {
        surface.material = surface.userData.lambert;
        surface.material.normalNeedsUpdate = true;
      });
      break;
  }
  changeMaterial = false;
}

function turnOffMaterials() {
  const cylinder = objectMap.get('cylinder');
  const rings = objectMap.get('rings');
  const surfaces = objectMap.get('surfaces');
  const skydome = objectMap.get('skydome');
  const mobiusStrip = objectMap.get('mobiusStrip');

  skydome.material = skydome.userData.basic;
  skydome.material.normalNeedsUpdate = true;
  cylinder.material = cylinder.userData.basic;
  cylinder.material.normalNeedsUpdate = true;
  mobiusStrip.material = mobiusStrip.userData.basic;
  mobiusStrip.material.normalNeedsUpdate = true;
  rings.forEach((ring) => {
    ring.material = ring.userData.basic;
    ring.material.normalNeedsUpdate = true;
  });
  surfaces.forEach((surface) => {
    surface.material = surface.userData.basic;
    surface.material.normalNeedsUpdate = true;
  });

  changeMaterial = false;
}

////////////
/* UPDATE */
////////////
function update() {
  'use strict';

  if (changeMaterial) {
    if (materialsOff) turnOffMaterials();
    else changeMaterials();
  }

  let delta = clock.getDelta();

  spinCylinder(delta);

  // Try moving each ring
  for (let idx = 0; idx < isMoveRing.length; idx++) {
    if (isMoveRing[idx]) {
      moveRing(idx, delta);
    }
  }

  // Spin each surface
  for (let idx = 0; idx < objectMap.get('surfaces').length; idx++) {
    spinSurface(idx, delta);
  }

  //helpers - remove later
  if (enableHelpers) {
    lightsHelpers.forEach((helper) => {
      helper.visible = lights.at(0).visible;
    });
    directionalHelper.visible = directionalLight.visible;
  } else {
    lightsHelpers.forEach((helper) => {
      helper.visible = false;
    });
    directionalHelper.visible = false;
  }
}

/////////////
/* DISPLAY */
/////////////
function render() {
  'use strict';
  renderer.render(scene, perspectiveCamera);
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
  /*
  switch (e.key) {
    case '1':
    case '2':
    case '3':
      const idx = parseInt(e.key) - 1;
      if (!isMoveRing[idx])
        isMoveRing[idx] = true;
      break;
  }
  */
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
      isMoveRing[idx] = !isMoveRing[idx];
      break;

    case 'd':
    case 'D':
      directionalLight.visible = !directionalLight.visible;
      break;
    case 's':
    case 'S':
      lights.forEach((light) => {
        light.visible = !light.visible;
      });
      break;

    case 'q':
    case 'Q':
      currentMaterial = LAMBERT;
      if (!materialsOff) changeMaterial = true;
      break;
    case 'w':
    case 'W':
      currentMaterial = PHONG;
      if (!materialsOff) changeMaterial = true;
      break;
    case 'e':
    case 'E':
      currentMaterial = TOON;
      if (!materialsOff) changeMaterial = true;
      break;
    case 'r':
    case 'R':
      currentMaterial = NORMAL;
      if (!materialsOff) changeMaterial = true;
      break;
    case 't':
    case 'T':
      materialsOff = !materialsOff;
      changeMaterial = true;
      break;

    //disable helpers
    case 'h':
    case 'H':
      enableHelpers = !enableHelpers;
      break;
  }
}

init();
animate();
