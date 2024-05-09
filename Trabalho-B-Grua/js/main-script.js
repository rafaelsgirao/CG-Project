'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene,
  renderer,
  currentCamera = 0;
let cameras = new Array(6);
let materials = new Array();
let loads = new Array();
let animationStage = 0;

const components = new Map();
const radiusMap = new Map();
let colliding = null;

let clock;

let keyDownMap = new Map(); // criado porque event.repeat no keydown não parece funcionar

let moveRopeDirection = 0,
  moveTrolleyDirection = 0,
  rotateCraneDirection = 0,
  moveClawDirection = 0;

// Crane constants
const baseLength = 15,
  baseHeight = 10,
  baseWidth = baseLength; // base
const towerLength = 5,
  towerHeight = 70,
  towerWidth = towerLength; // torre
const cabinLength = 8,
  cabinHeight = towerLength,
  cabinWidth = towerLength; // cabine
const jibLength = 75,
  jibHeight = 5,
  jibWidth = towerWidth; // lanca
const counterjibLength = 30,
  counterjibHeight = jibHeight,
  counterjibWidth = jibWidth; // contra-lanca
const apexLength = towerLength,
  apexHeight = 15,
  apexWidth = apexLength; // porta-lanca
const weightLength = 8,
  weightHeight = 5,
  weightWidth = towerWidth + 0.1; // contra-peso
const pendentRadius = 1; // tirante
const trolleyLength = 5,
  trolleyHeight = 5,
  trolleyWidth = jibWidth / 2; // carrinho
const cableRadius = 1,
  cableLength = 10; // cabo
const blockLength = 5,
  blockHeight = blockLength,
  blockWidth = blockLength; // bloco da garra
const clawLength = 8,
  clawHeight = 3,
  clawWidth = 3; // garra

// Colour constants
const craneColour = 0xd4af37,
  cabinColour = 0x628db2,
  metalColour = 0x9e8e8e,
  darkMetalColour = 0x5e4e4e,
  containerColour = 0x4682b4,
  containerBaseColour = 0x151e3d,
  loadColour1 = 0x5c2107,
  loadColour2 = 0x64731e;

// Camera constants
const camRatio = 7;
const fixedCamPoint = [100, 100, 120];

// Other objects constants
const containerBaseLength = 1.5 * (2 * clawLength + blockLength),
  containerBaseWidth = 2.5 * (2 * clawLength + blockLength);
const containerWallHeight = 1 * (2 * clawLength + blockLength),
  containerWallThickness = 3,
  containerWallLength = containerBaseLength,
  containerWallWidth = containerBaseWidth - 2 * containerWallThickness;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe3d8b7);
  createCrane();
  createContainer();
  createLoads();
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

// LOWER SECTION --------------------------------------------------------------------------------------
function createCrane() {
  let crane = new THREE.Object3D();

  createBase(crane, 0, baseHeight / 2, 0);
  createTower(crane, 0, baseHeight + towerHeight / 2, 0);
  createUpperSection(crane, 0, baseHeight + towerHeight, 0);
  scene.add(crane);
}

function createBase(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(baseLength, baseHeight, baseWidth);
  let material = new THREE.MeshBasicMaterial({ color: darkMetalColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('base', mesh);
}

function createTower(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(towerLength, towerHeight, towerWidth);
  let material = new THREE.MeshBasicMaterial({ color: craneColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('tower', mesh);
}
//--------------------------------------------------------------------------------------------------------

// UPPER SECTION -----------------------------------------------------------------------------------------
function createUpperSection(parent, x, y, z) {
  let upperSection = new THREE.Object3D();

  createCabin(upperSection, (cabinLength - towerLength) / 2, cabinHeight / 2, 0);
  createApex(upperSection, 0, apexHeight / 2 + cabinHeight, 0);
  createJib(upperSection, apexLength / 2 + jibLength / 2, cabinHeight + jibHeight / 2, 0);
  createCounterJib(
    upperSection,
    -apexLength / 2 - counterjibLength / 2,
    cabinHeight + counterjibHeight / 2,
    0
  );
  createCounterWeight(upperSection, weightLength / 2 - counterjibLength, cabinHeight, 0);
  createPendant(
    upperSection,
    0,
    cabinHeight + apexHeight,
    0,
    -apexLength / 2 - counterjibLength * 0.66,
    cabinHeight + jibHeight,
    0
  ); // Tirante traseiro
  createPendant(
    upperSection,
    0,
    cabinHeight + apexHeight,
    0,
    apexLength / 2 + jibLength * 0.66,
    cabinHeight + jibHeight,
    0,
    true
  ); // Tirante dianteiro
  createFrontSection(upperSection, 15, cabinHeight, 0);

  upperSection.position.set(x, y, z);
  parent.add(upperSection);
  components.set('upperSection', upperSection);
}

// Cabine
function createCabin(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth);
  let material = new THREE.MeshBasicMaterial({ color: cabinColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('cabin', mesh);
}

// Porta-Lanca
function createApex(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(apexLength, apexHeight, apexWidth);
  let material = new THREE.MeshBasicMaterial({ color: craneColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('apex', mesh);
}

// Lanca
function createJib(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(jibLength, jibHeight, jibWidth);
  let material = new THREE.MeshBasicMaterial({ color: craneColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('jib', mesh);
}

// Contra-lanca
function createCounterJib(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(counterjibLength, counterjibHeight, counterjibWidth);
  let material = new THREE.MeshBasicMaterial({ color: craneColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('counterJib', mesh);
}

// Contra-peso
function createCounterWeight(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(weightLength, weightHeight, weightWidth);
  let material = new THREE.MeshBasicMaterial({ color: darkMetalColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('counterWeight', mesh);
}

// Tirante
function createPendant(parent, x1, y1, z1, x2, y2, z2, isFront) {
  let hip = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  let angle = Math.atan(Math.abs(y2 - y1) / Math.abs(x2 - x1)) + Math.PI / 2;

  let geometry = new THREE.CylinderGeometry(pendentRadius, pendentRadius, hip, 10);
  let material = new THREE.MeshBasicMaterial({ color: metalColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  if (isFront) angle = -angle;

  mesh.rotateZ(angle);
  mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);

  parent.add(mesh);
  components.set('pendant', mesh);
}

//--------------------------------------------------------------------------------------
// FRONT SECTION ///////////////////////////////////////////
function createFrontSection(parent, x, y, z) {
  let frontSection = new THREE.Object3D();

  createTrolley(frontSection, 0, 0, 0);
  createCable(frontSection, 0, 0, 0);
  createClawSection(frontSection, 0, -cableLength - blockHeight, 0);

  frontSection.position.set(x, y, z);
  parent.add(frontSection);
  components.set('frontSection', frontSection);
}

// Carrinho
function createTrolley(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(trolleyLength, trolleyHeight, trolleyWidth);
  let material = new THREE.MeshBasicMaterial({ color: darkMetalColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('trolley', mesh);
}

// Cabo
function createCable(parent, x, y, z) {
  let geometry = new THREE.CylinderGeometry(cableRadius, cableRadius, cableLength, 10);
  let material = new THREE.MeshBasicMaterial({ color: metalColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(x, y, z);

  mesh.translateY(-cableLength / 2); // alinhar topo do cilindro com a origem do referencial

  parent.add(mesh);
  components.set('cable', mesh);
}

//--------------------------------------------------------------------------------------
// CLAW SECTION ///////////////////////////////////////////
function createClawSection(parent, x, y, z) {
  let clawSection = new THREE.Object3D();

  createBlock(clawSection, 0, blockHeight / 2, 0);
  createClaw(clawSection, 0, 0, 0, 0, 'frontClaw');
  createClaw(clawSection, 0, 0, 0, Math.PI / 2, 'leftClaw');
  createClaw(clawSection, 0, 0, 0, Math.PI, 'backClaw');
  createClaw(clawSection, 0, 0, 0, Math.PI * 1.5, 'rightClaw');
  createCamClaw(clawSection, cameras, 0, 0, 0);
  clawSection.position.set(x, y, z);
  parent.add(clawSection);
  components.set('clawSection', clawSection);
}

// Bloco da garra
function createBlock(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(blockLength, blockHeight, blockWidth);
  let material = new THREE.MeshBasicMaterial({ color: darkMetalColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('block', mesh);
}

// Dedo da garra
function createClaw(parent, x, y, z, rad, name) {
  let geometry = new CustomTetrahedronGeometry();
  let material = new THREE.MeshBasicMaterial({ color: metalColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.scale.set(clawLength, clawHeight, clawWidth);
  mesh.rotateY(rad);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set(name, mesh);
}

//--------------------------------------------------------------------------------------
// CONTAINER ///////////////////////////////////////////
function createContainer() {
  let container = new THREE.Object3D();

  createContainerBase(container, 0, containerWallThickness / 2, 0);
  let wallY = containerWallHeight / 2;
  createContainerWall(container, 0, wallY, containerBaseWidth / 2);
  createContainerWall(container, 0, wallY, -containerBaseWidth / 2);
  createContainerWall(
    container,
    containerBaseLength / 2 - containerWallThickness / 2,
    wallY,
    0,
    true
  );
  createContainerWall(
    container,
    -containerBaseLength / 2 + containerWallThickness / 2,
    wallY,
    0,
    true
  );

  container.rotateY(Math.PI);
  container.position.set((3.5 / 5) * jibLength, 0, 0);
  scene.add(container);
  components.set('container', container);
}

function createContainerBase(parent, x, y, z) {
  let geometry = new THREE.BoxGeometry(
    containerBaseLength - 0.1,
    containerWallThickness,
    containerBaseWidth - 0.1
  ); // -0.1 para impedir conflitos de cor na sobreposição com as laterais
  let material = new THREE.MeshBasicMaterial({ color: containerBaseColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('containerBase', mesh);
}

function createContainerWall(parent, x, y, z, isWidth) {
  let size = containerBaseLength;
  if (isWidth) size = containerBaseWidth;

  let geometry = new THREE.BoxGeometry(size, containerWallHeight, containerWallThickness);
  let material = new THREE.MeshBasicMaterial({ color: containerColour, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  if (isWidth) mesh.rotateY(Math.PI / 2);

  mesh.position.set(x, y, z);
  parent.add(mesh);
  components.set('containerWall', mesh);
}

//--------------------------------------------------------------------------------------
// LOADS ///////////////////////////////////////////

function createLoads() {
  createCubeLoad(scene, -41, 4, -20);
  createDodecahedronLoad(scene, 24, 2, 42);
  createIcosahedronLoad(scene, -10, 2.5, 45);
  createTorusLoad(scene, -34, 3, 30);
  createKnotLoad(scene, -17, 4, -50);
}

function createCubeLoad(parent, x, y, z) {
  let size = y * 2;

  let geometry = new THREE.BoxGeometry(size, size, size);
  let material = new THREE.MeshBasicMaterial({ color: loadColour2, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'cube';

  mesh.position.set(x, y, z);
  parent.add(mesh);
  loads.push(mesh);
  radiusMap.set(mesh.name, size / 2);
}

function createDodecahedronLoad(parent, x, y, z) {
  let size = y;

  let geometry = new THREE.DodecahedronGeometry(size);
  let material = new THREE.MeshBasicMaterial({ color: loadColour2, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'dodecahedron';

  mesh.position.set(x, y, z);
  parent.add(mesh);
  loads.push(mesh);
  radiusMap.set(mesh.name, size);
}

function createIcosahedronLoad(parent, x, y, z) {
  let size = y;

  let geometry = new THREE.IcosahedronGeometry(size);
  let material = new THREE.MeshBasicMaterial({ color: loadColour1, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(x, y, z);
  mesh.name = 'icosahedron';
  parent.add(mesh);
  loads.push(mesh);
  radiusMap.set(mesh.name, size);
}

function createTorusLoad(parent, x, y, z) {
  let size = y;

  let geometry = new THREE.TorusGeometry(size, size / 3);
  let material = new THREE.MeshBasicMaterial({ color: loadColour2, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(x, y, z);
  mesh.name = 'torus';

  parent.add(mesh);
  loads.push(mesh);
  radiusMap.set(mesh.name, size);
}

function createKnotLoad(parent, x, y, z) {
  let size = y;

  let geometry = new THREE.TorusKnotGeometry(size, size / 3);
  let material = new THREE.MeshBasicMaterial({ color: loadColour1, wireframe: false });
  materials.push(material);
  let mesh = new THREE.Mesh(geometry, material);

  mesh.rotateX(Math.PI / 2);
  mesh.position.set(x, y, z);
  mesh.name = 'knot';

  parent.add(mesh);
  loads.push(mesh);
  radiusMap.set(mesh.name, size);
}

//////////////////////
/*CUSTOM TETRAHEDRON*/
//////////////////////
function CustomTetrahedronGeometry() {
  const vertices = [
    // vertical
    { pos: [0, 0, 0.5], norm: [-1, 0, 0], uv: [0, 0] },
    { pos: [0, 0, -0.5], norm: [-1, 0, 0], uv: [1, 0] },
    { pos: [0, 1, 0], norm: [-1, 0, 0], uv: [1, 1] },
    //horizontal
    { pos: [0, 0, 0.5], norm: [0, -1, 0], uv: [0, 1] },
    { pos: [0, 0, -0.5], norm: [0, -1, 0], uv: [1, 0] },
    { pos: [1, 0, 0], norm: [0, -1, 0], uv: [1, 1] },
    //diagonal 1
    { pos: [0, 1, 0], norm: [0.5, 0.5, -1], uv: [0, 1] },
    { pos: [1, 0, 0], norm: [0.5, 0.5, -1], uv: [1, 0] },
    { pos: [0, 0, -0.5], norm: [0.5, 0.5, -1], uv: [1, 1] },
    //diagonal 2
    { pos: [0, 1, 0], norm: [-0.5, -0.5, -1], uv: [0, 1] },
    { pos: [0, 0, 0.5], norm: [-0.5, -0.5, -1], uv: [1, 1] },
    { pos: [1, 0, 0], norm: [-0.5, -0.5, -1], uv: [1, 0] },
  ];

  const positions = [];
  const normals = [];
  const uvs = [];
  for (const vertex of vertices) {
    positions.push(...vertex.pos);
    normals.push(...vertex.norm);
    uvs.push(...vertex.uv);
  }

  let geometry = new THREE.BufferGeometry();
  const positionNumComponents = 3;
  const normalNumComponents = 3;
  const uvNumComponents = 2;
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents)
  );
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
  );
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
  return geometry;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions() {
  if (colliding != null) return;

  let claw = components.get('clawSection');
  let clawWcsPos = new THREE.Vector3();
  claw.getWorldPosition(clawWcsPos);
  let clawR = clawLength;

  loads.every((l) => {
    let r = radiusMap.get(l.name);
    if (
      // soma_dos_raios ^ 2 >= distância_entre_centros ^ 2
      (r + clawR) ** 2 >=
      (l.position.x - clawWcsPos.x) ** 2 +
        (l.position.y - clawWcsPos.y) ** 2 +
        (l.position.z - clawWcsPos.z) ** 2
    ) {
      colliding = l;
      return false;
    }
    return true;
  });
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras(cameras, scene_position) {
  // Câmara frontal (1).
  const camFrontal = new THREE.OrthographicCamera(
    window.innerWidth / -camRatio,
    window.innerWidth / camRatio,
    window.innerHeight / camRatio,
    window.innerHeight / -camRatio,
    1,
    1000
  );
  camFrontal.position.set(120, 0, 0);
  camFrontal.lookAt(scene_position);

  cameras[0] = camFrontal;

  // Câmara lateral (2).
  const camLateral = new THREE.OrthographicCamera(
    window.innerWidth / -camRatio,
    window.innerWidth / camRatio,
    window.innerHeight / camRatio,
    window.innerHeight / -camRatio,
    1,
    1000
  );
  camLateral.position.set(0, 0, 120);
  camLateral.lookAt(scene_position);

  cameras[1] = camLateral;

  // Câmara de topo (3).
  const camTopo = new THREE.OrthographicCamera(
    window.innerWidth / -camRatio,
    window.innerWidth / camRatio,
    window.innerHeight / camRatio,
    window.innerHeight / -camRatio,
    1,
    1000
  );
  camTopo.position.set(0, 200, 0);
  camTopo.lookAt(scene_position);

  cameras[2] = camTopo;

  // Câmara fixa: projeção ortogonal (4).
  const camFixedOrthogonal = new THREE.OrthographicCamera(
    window.innerWidth / -camRatio,
    window.innerWidth / camRatio,
    window.innerHeight / camRatio,
    window.innerHeight / -camRatio,
    1,
    1000
  );

  camFixedOrthogonal.position.set(...fixedCamPoint);
  camFixedOrthogonal.lookAt(scene_position);
  cameras[3] = camFixedOrthogonal;

  // Câmara fixa: projeção perspetiva (5).

  const camFixedPerspective = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  camFixedPerspective.position.set(...fixedCamPoint);
  camFixedPerspective.lookAt(scene_position);
  cameras[4] = camFixedPerspective;
}

// Câmara móvel: gancho (6).

const createCamClaw = (parent, cameras, x, y, z) => {
  const camClaw = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);

  camClaw.position.set(x, y, z);

  camClaw.lookAt(x, -1000, z);
  camClaw.rotation.z -= Math.PI / 2;
  cameras[5] = camClaw;
  parent.add(camClaw);
};

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(delta) {
  let cable;
  const period = Math.PI * 2; // rotation period, use to compare angles above a full rotation (e.g. have 450 degrees == 90 degrees)
  function mod(n, d) {
    return ((n % d) + d) % d;
  } // n%d in js can be negative, this is always positive

  switch (animationStage) {
    case 0: {
      // move claws to slightly open position (to open or close, depending on position)
      const claw = components.get('frontClaw');
      const desiredAngle = -Math.PI / 10; // angle for the claws to be at before object snapping

      const direction = claw.rotation.z > desiredAngle ? 1 : -1; // check if it needs to open or close to achive 60 degrees

      moveClaw(direction, delta);

      // check if this movement brought the claw to/ surpassed the desired angle
      if (direction * claw.rotation.z <= direction * desiredAngle) {
        // times direction to check if the angle was surpassed taking the movement direction into account
        animationStage += 1;
      }
      break;
    }

    case 1: {
      // snap object to claw
      const clawSection = components.get('clawSection');

      clawSection.add(colliding);

      let newY = -radiusMap.get(colliding.name);
      colliding.position.set(0, newY, 0);

      animationStage += 1;
      break;
    }
    case 2: {
      // close claws
      const claw = components.get('frontClaw');
      const closedAngle = -Math.PI / 4; // angle for the claws to close at
      moveClaw(1, delta);

      // check if this movement brought the claw to/ surpassed the desired angle
      if (claw.rotation.z <= closedAngle) {
        animationStage += 1;
      }
      break;
    }
    case 3: // pull cable up
    case 9: {
      cable = components.get('cable');
      const desiredScaling = 1.02;

      moveRope(1, delta);

      if (cable.scale['y'] <= desiredScaling) {
        animationStage += 1;
      }
      break;
    }
    case 4: {
      // rotate upper section
      let upperSection = components.get('upperSection');

      const direction = mod(upperSection.rotation.y, period) > period / 2 ? 1 : -1; // check which rotation is closest

      rotateCrane(direction, delta);

      // check if this movement brought the claw to/ surpassed the desired angle
      if (direction * mod(upperSection.rotation.y, period) < (direction * period) / 2) {
        animationStage += 1;
      }
      break;
    }
    case 5: {
      // move trolley
      let frontSection = components.get('frontSection');
      const desiredValue = 55;

      const direction = frontSection.position.x < desiredValue ? 1 : -1;

      moveTrolley(direction, delta);

      if (direction * frontSection.position.x >= direction * desiredValue) {
        animationStage += 1;
      }
      break;
    }
    case 6: {
      // pull cable down
      let cable = components.get('cable');
      const desiredScale = 7;

      moveRope(-1, delta);

      if (cable.scale['y'] >= desiredScale) {
        animationStage += 1;
      }
      break;
    }
    case 7: {
      // open claw
      const claw = components.get('frontClaw');
      const openedAngle = -Math.PI / 10; // angle for the claws to open at
      moveClaw(-1, delta);

      // check if this movement brought the claw to/ surpassed the desired angle
      if (claw.rotation.z >= openedAngle) {
        animationStage += 1;
      }
      break;
    }
    case 8: {
      // decouple object from claw
      scene.add(colliding);

      colliding.position.set(0, 0, 0);
      colliding.applyMatrix4(colliding.matrixWorld);

      animationStage += 1;
      break;
    }
    default: // reset stage counter and colliding variable
      animationStage = 0;
      colliding = null;
  }
}

////////////
/* UPDATE */
////////////
function update() {
  let delta = clock.getDelta();
  checkCollisions();

  if (colliding == null) {
    rotateCrane(rotateCraneDirection, delta);
    moveTrolley(moveTrolleyDirection, delta);
    moveRope(moveRopeDirection, delta);
    moveClaw(moveClawDirection, delta);
  } else {
    handleCollisions(delta);
  }
}

/////////////
/* DISPLAY */
/////////////
function render() {
  renderer.render(scene, cameras[currentCamera]);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  createScene();
  createCameras(cameras, scene.position);

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
  update();
  render();

  requestAnimationFrame(animate);
}

/////////////////////
/* MOVEMENTS        */
/////////////////////
function rotateCrane(direction, delta) {
  'use strict';

  let upperSection = components.get('upperSection');
  let rotation = (((direction * Math.PI) / 180) * delta) / 0.015;
  upperSection.rotation.y += rotation;
}

function moveTrolley(direction, delta) {
  'use strict';

  let frontSection = components.get('frontSection');
  let jib = components.get('jib');

  let translation = (direction * 0.5 * delta) / 0.015;

  // dont move past jib
  if (
    translation > 0 &&
    frontSection.position.x + translation >=
      jib.position.x + jibLength / 2 - trolleyLength / 2 - 0.1
  ) {
    frontSection.position.x = jib.position.x + jibLength / 2 - trolleyLength / 2 - 0.1;
    return;
  }
  // dont move inside cabin
  if (
    translation < 0 &&
    frontSection.position.x + translation <=
      jib.position.x - jibLength / 2 + cabinLength / 2 + trolleyLength / 2
  ) {
    frontSection.position.x = jib.position.x - jibLength / 2 + cabinLength / 2 + trolleyLength / 2;
    return;
  }
  frontSection.translateX(translation);
  return;
}

function moveRope(direction, delta) {
  'use strict';

  const origin = scene.children[0];
  const cable = components.get('cable');
  const claw = components.get('clawSection');
  const frontSection = components.get('frontSection');
  const upperSection = components.get('upperSection');

  const translation = (direction * 0.5 * delta) / 0.015;
  const length = cable.geometry.parameters.height * cable.scale['y'];
  let missingHeight;

  let clawReferencialHeight = claw.position.y + frontSection.position.y + upperSection.position.y; // claw height based on origin referencial

  // dont move past ground
  if (translation < 0 && clawReferencialHeight - clawLength + translation <= origin.position.y) {
    missingHeight = origin.position.y - (clawReferencialHeight - clawLength);
    cable.applyMatrix4(new THREE.Matrix4().makeScale(1, (length - missingHeight) / length, 1));
    claw.translateY(missingHeight);
    return;
  }

  let originalClawHeight = 0 - cableLength - blockHeight; // claw original height

  // dont move past original position
  if (translation > 0 && claw.position.y + translation >= originalClawHeight) {
    missingHeight = originalClawHeight - claw.position.y;
    cable.applyMatrix4(new THREE.Matrix4().makeScale(1, (length - missingHeight) / length, 1));
    claw.translateY(missingHeight);
    return;
  }

  cable.applyMatrix4(new THREE.Matrix4().makeScale(1, (length - translation) / length, 1));
  claw.translateY(translation);
  return;
}

function moveClaw(direction, delta) {
  'use strict';

  let frontClaw = components.get('frontClaw');
  let leftClaw = components.get('leftClaw');
  let backClaw = components.get('backClaw');
  let rightClaw = components.get('rightClaw');

  let rotation = (((direction * Math.PI) / 180) * delta) / 0.015;

  //dont open too much
  if (rotation < 0 && frontClaw.rotation.z - rotation >= 0) {
    frontClaw.rotation.z = 0;
    backClaw.rotation.z = Math.PI;
    leftClaw.rotation.x = 0;
    rightClaw.rotation.x = 0;
    return;
  }
  //dont close too much
  if (rotation > 0 && frontClaw.rotation.z - rotation <= -Math.PI / 2) {
    frontClaw.rotation.z = -Math.PI / 2;
    backClaw.rotation.z = Math.PI / 2;
    leftClaw.rotation.x = -Math.PI / 2;
    rightClaw.rotation.x = Math.PI / 2;
    return;
  }
  frontClaw.rotation.z -= rotation;
  backClaw.rotation.z -= rotation;
  leftClaw.rotation.x -= rotation;
  rightClaw.rotation.x += rotation;
  return;
}

////////////////////////////
/*    WIREFRAME TOGGLE    */
////////////////////////////

function toggleWireframe() {
  document.getElementById('buttonWireframe')?.classList.toggle('active');
  materials.forEach((element) => {
    element.wireframe = !element.wireframe;
  });
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() {
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

const enableHUDButton = (key) => {
  key = key.toUpperCase();
  document.getElementById(`button${key}`)?.classList.add('active');
};

const disableHUDButton = (key) => {
  key = key.toUpperCase();
  document.getElementById(`button${key}`)?.classList.remove('active');
};

const switchCamera = (n /* index of new camera */) => {
  if (n == currentCamera) {
    return;
  }
  disableHUDButton(`${currentCamera + 1}`);
  enableHUDButton(`${n + 1}`);
  currentCamera = n;
};
///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(event) {
  /*Este evento para movimentar a grua só devia ser lido no primeiro instante em que a tecla vai para baixo,
    mas como manter a tecla em baixo faz com que se repita o input, o evento seria, normalmente, repetido
    por isso criei o keyDownMap, um mapa que guarda se cada tecla está em baixo
    event.repeat deveria dar esta informação, mas nos meus testes dava sempre valor false*/

  switch (event.key) {
    case '7':
      toggleWireframe();
      enableHUDButton(event.key);
      break;
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      switchCamera(parseInt(event.key) - 1);
      break;

    case 'Q':
    case 'q': // Q
      if (!keyDownMap.get('q')) {
        rotateCraneDirection += 1;
        keyDownMap.set('q', true);
        enableHUDButton(event.key);
      }
      break;

    case 'A':
    case 'a': // A
      if (!keyDownMap.get('a')) {
        rotateCraneDirection -= 1;
        keyDownMap.set('a', true);
        enableHUDButton(event.key);
      }
      break;

    case 'W':
    case 'w': // W
      if (!keyDownMap.get('w')) {
        moveTrolleyDirection += 1;
        keyDownMap.set('w', true);
        enableHUDButton(event.key);
      }
      break;

    case 'S':
    case 's': // S
      if (!keyDownMap.get('s')) {
        moveTrolleyDirection -= 1;
        keyDownMap.set('s', true);
        enableHUDButton(event.key);
      }
      break;

    case 'E':
    case 'e':
      if (!keyDownMap.get('e')) {
        moveRopeDirection += 1;
        keyDownMap.set('e', true);
        enableHUDButton(event.key);
      }
      break;

    case 'D':
    case 'd':
      if (!keyDownMap.get('d')) {
        moveRopeDirection -= 1;
        keyDownMap.set('d', true);
        enableHUDButton(event.key);
      }
      break;

    case 'F':
    case 'f':
      if (!keyDownMap.get('r')) {
        moveClawDirection += 1;
        keyDownMap.set('r', true);
        enableHUDButton(event.key);
      }
      break;

    case 'R':
    case 'r':
      if (!keyDownMap.get('f')) {
        moveClawDirection -= 1;
        keyDownMap.set('f', true);
        enableHUDButton(event.key);
      }
      break;

    default:
      // Do nothing if other keys are pressed
      return;
  }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(event) {
  switch (event.key) {
    case 'Q':
    case 'q': // Q
      rotateCraneDirection += -1;
      keyDownMap.set('q', false);
      disableHUDButton(event.key);
      break;

    case 'A':
    case 'a': // A
      rotateCraneDirection -= -1;
      keyDownMap.set('a', false);
      disableHUDButton(event.key);
      break;

    case 'W':
    case 'w': // W
      moveTrolleyDirection += -1;
      keyDownMap.set('w', false);
      disableHUDButton(event.key);
      break;

    case 'S':
    case 's': // S
      moveTrolleyDirection -= -1;
      keyDownMap.set('s', false);
      disableHUDButton(event.key);
      break;

    case 'E':
    case 'e': // E
      moveRopeDirection += -1;
      keyDownMap.set('e', false);
      disableHUDButton(event.key);
      break;

    case 'D':
    case 'd': // D
      moveRopeDirection -= -1;
      keyDownMap.set('d', false);
      disableHUDButton(event.key);
      break;

    case 'F':
    case 'f': // F
      moveClawDirection += -1;
      keyDownMap.set('r', false);
      disableHUDButton(event.key);
      break;

    case 'R':
    case 'r': // R
      moveClawDirection -= -1;
      keyDownMap.set('f', false);
      disableHUDButton(event.key);
      break;

    default:
      // Do nothing if other keys are pressed
      return;
  }
}

init();
animate();
