import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { createCamClaw, createCameras } from "./cameras.js";

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var scene, renderer, currentCamera = 0;
var cameras = new Array(6);
var materials = new Array();

var keyDownMap = new Map(); // criado porque event.repeat no keydown não parece funcionar

var moveRopeDirection = 0, moveTrolleyDirection = 0, rotateCraneDirection = 0, moveClawDirection = 0;

// Crane constants
const baseLength = 15, baseHeight = 10, baseWidth = baseLength;                         // base
const towerLength = 5, towerHeight = 70, towerWidth = towerLength;                      // torre
const cabinLength = 8, cabinHeight = towerLength, cabinWidth = towerLength;             // cabine 
const jibLength = 75, jibHeight = 5, jibWidth = towerWidth;                             // lanca
const counterjibLength = 30, counterjibHeight = jibHeight, counterjibWidth = jibWidth;  // contra-lanca
const apexLength = towerLength, apexHeight = 15, apexWidth = apexLength;                // porta-lanca
const weightLength = 8, weightHeight = 5, weightWidth = towerWidth+0.1;                 // contra-peso
const pendentRadius = 1;                                                                // tirante
const trolleyLength = 5, trolleyHeight = 5, trolleyWidth = jibWidth/2;                  // carrinho
const cableRadius = 1, cableLength = 10;                                                // cabo
const blockLength = 5, blockHeight = blockLength, blockWidth = blockLength;             // bloco da garra
const clawLength = 8, clawHeight = 3, clawWidth = 3;                                    // garra

// Colour constants
const craneColour = 0xd4af37, cabinColour = 0x628db2, 
    metalColour = 0x9e8e8e, darkMetalColour = 0x5e4e4e,
    containerColour = 0x4682b4, containerBaseColour = 0x151e3d,
    loadColour1 = 0x5c2107, loadColour2 = 0x64731e;

// Other objects constants
const containerBaseLength = 1.5*(2*clawLength+blockLength), containerBaseWidth = 2.5*(2*clawLength+blockLength);
const containerWallHeight = 1*(2*clawLength+blockLength), containerWallThickness = 3, 
containerWallLength = containerBaseLength, containerWallWidth = containerBaseWidth - 2 * containerWallThickness;

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(0));
    scene.background = new THREE.Color(0xE3D8B7);
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
function createCrane(){
    'use strict';

    var crane = new THREE.Object3D();

    createBase(crane, 0, baseHeight/2, 0);
    createTower(crane, 0, baseHeight + towerHeight/2, 0);
    createUpperSection(crane, 0, baseHeight + towerHeight, 0);
    scene.add(crane);
}

function createBase(parent, x, y, z){
    'use strict';

    var geometry = new THREE.BoxGeometry(baseLength, baseHeight, baseWidth);
    var material = new THREE.MeshBasicMaterial({color: darkMetalColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createTower(parent, x, y, z){
    'use strict';

    var geometry = new THREE.BoxGeometry(towerLength, towerHeight, towerWidth);
    var material = new THREE.MeshBasicMaterial({color: craneColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}
//--------------------------------------------------------------------------------------------------------

// UPPER SECTION -----------------------------------------------------------------------------------------
function createUpperSection(parent, x, y, z){
    'use strict';

    var upperSection = new THREE.Object3D();

    createCabin(upperSection, (cabinLength - towerLength)/2, cabinHeight/2, 0);
    createApex(upperSection, 0, (apexHeight/2) + cabinHeight, 0);
    createJib(upperSection, apexLength/2 + jibLength/2, cabinHeight + jibHeight/2, 0);
    createCounterJib(upperSection, - apexLength/2 - counterjibLength/2, cabinHeight + counterjibHeight/2, 0);
    createCounterWeight(upperSection, weightLength/2 - counterjibLength, cabinHeight, 0);
    createPendant(upperSection, 0, cabinHeight + apexHeight, 0, -apexLength/2 - counterjibLength * 0.66, cabinHeight + jibHeight, 0); // Tirante traseiro
    createPendant(upperSection, 0, cabinHeight + apexHeight, 0, apexLength/2 + jibLength * 0.66, cabinHeight + jibHeight, 0, true); // Tirante dianteiro
    createFrontSection(upperSection, 15, cabinHeight, 0);
    
    upperSection.position.set(x, y, z);
    parent.add(upperSection);
}

// Cabine
function createCabin(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth);
    var material = new THREE.MeshBasicMaterial({color: cabinColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Porta-Lanca
function createApex(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(apexLength, apexHeight, apexWidth);
    var material = new THREE.MeshBasicMaterial({ color: craneColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Lanca
function createJib(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(jibLength, jibHeight, jibWidth);
    var material = new THREE.MeshBasicMaterial( {color: craneColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Contra-lanca
function createCounterJib(parent, x, y, z) {
    'use strict';
    
    var geometry = new THREE.BoxGeometry(counterjibLength, counterjibHeight, counterjibWidth);
    var material = new THREE.MeshBasicMaterial( {color: craneColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Contra-peso
function createCounterWeight(parent, x, y, z) {
    'use strict';
    
    var geometry = new THREE.BoxGeometry(weightLength, weightHeight, weightWidth);
    var material = new THREE.MeshBasicMaterial( {color: darkMetalColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Tirante
function createPendant(parent, x1, y1, z1, x2, y2, z2, isFront) {
    'use strict';
    var hip = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
    var angle = Math.atan(Math.abs(y2-y1)/Math.abs(x2-x1)) + Math.PI/2;

    var geometry = new THREE.CylinderGeometry(pendentRadius, pendentRadius, hip, 10);
    var material = new THREE.MeshBasicMaterial( {color: metalColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    
    if(isFront) angle = -angle;

    mesh.rotateZ(angle);
    mesh.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);

    parent.add(mesh);
}

//--------------------------------------------------------------------------------------
// FRONT SECTION ///////////////////////////////////////////
function createFrontSection(parent, x, y, z) {
    'use strict';

    var frontSection = new THREE.Object3D();

    createTrolley(frontSection, 0, 0, 0);
    createCable(frontSection, 0, 0, 0);
    createClawSection(frontSection, 0, -cableLength - blockHeight, 0);

    frontSection.position.set(x, y, z);
    parent.add(frontSection);
}

// Carrinho
function createTrolley(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(trolleyLength, trolleyHeight, trolleyWidth);
    var material = new THREE.MeshBasicMaterial( {color: darkMetalColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    parent.add(mesh);
}

// Cabo
function createCable(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.CylinderGeometry(cableRadius, cableRadius, cableLength, 10);
    var material = new THREE.MeshBasicMaterial( {color: metalColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(x,y,z);

    mesh.translateY(-cableLength/2); // alinhar topo do cilindro com a origem do referencial

    parent.add(mesh);
}

//--------------------------------------------------------------------------------------
// CLAW SECTION ///////////////////////////////////////////
function createClawSection(parent, x, y, z) {
    'use strict';

    var clawSection = new THREE.Object3D();

    createBlock(clawSection, 0, blockHeight/2, 0);
    createClaw(clawSection, 0, 0, 0, 0);            // frente
    createClaw(clawSection, 0, 0, 0, Math.PI/2);    // esquerda
    createClaw(clawSection, 0, 0, 0, Math.PI);      // tras
    createClaw(clawSection, 0, 0, 0, Math.PI*1.5);  // direita

    createCamClaw(clawSection, cameras, 0, 0, 0);
    clawSection.position.set(x,y,z);
    parent.add(clawSection);
}

// Bloco da garra
function createBlock(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(blockLength, blockHeight, blockWidth);
    var material = new THREE.MeshBasicMaterial( {color: darkMetalColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Dedo da garra
function createClaw(parent, x, y, z, rad) {
    'use strict';

    var geometry = new CustomTetrahedronGeometry();
    var material = new THREE.MeshBasicMaterial( {color: metalColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);
    
    mesh.scale.set(clawLength,clawHeight,clawWidth);
    mesh.rotateY(rad);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

//--------------------------------------------------------------------------------------
// CONTAINER ///////////////////////////////////////////
function createContainer() {
    'use strict';

    var container = new THREE.Object3D();
    
    createContainerBase(container, 0, containerWallThickness/2, 0);
    var wallY = containerWallHeight/2;
    createContainerWall(container, 0, wallY, containerBaseWidth/2);
    createContainerWall(container, 0, wallY, -containerBaseWidth/2);
    createContainerWall(container, containerBaseLength/2-containerWallThickness/2, wallY, 0, true);
    createContainerWall(container, -containerBaseLength/2+containerWallThickness/2, wallY, 0, true);

    container.rotateY(Math.PI);
    container.position.set(3.5/5 * jibLength, 0, 0);
    scene.add(container);
}

function createContainerBase(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(containerBaseLength-0.1, containerWallThickness, containerBaseWidth-0.1); // -0.1 para impedir conflitos de cor na sobreposição com as laterais
    var material = new THREE.MeshBasicMaterial( {color: containerBaseColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createContainerWall(parent, x, y, z, isWidth) {
    'use strict';

    var size = containerBaseLength;
    if (isWidth) size = containerBaseWidth;

    var geometry = new THREE.BoxGeometry(size, containerWallHeight, containerWallThickness);
    var material = new THREE.MeshBasicMaterial( {color: containerColour, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    if (isWidth) mesh.rotateY(Math.PI/2);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

//--------------------------------------------------------------------------------------
// LOADS ///////////////////////////////////////////

function createLoads() {
    'use strict';

    createCubeLoad(scene, -41, 4, -20);
    createDodecahedronLoad(scene, 24, 2, 42);
    createIcosahedronLoad(scene, -10, 2.5,45);
    createTorusLoad(scene, -34, 3, 30);
    createKnotLoad(scene, -17, 4, -50);
}

function createCubeLoad(parent, x, y, z) {
    'use strict';

    var size = y*2;

    var geometry = new THREE.BoxGeometry(size, size, size);
    var material = new THREE.MeshBasicMaterial( {color: loadColour2, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createDodecahedronLoad(parent, x, y, z) {
    'use strict';

    var size = y*2;

    var geometry = new THREE.DodecahedronGeometry(size);
    var material = new THREE.MeshBasicMaterial( {color: loadColour2, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createIcosahedronLoad(parent, x, y, z) {
    'use strict';

    var size = y*2;

    var geometry = new THREE.IcosahedronGeometry(size);
    var material = new THREE.MeshBasicMaterial( {color: loadColour1, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createTorusLoad(parent, x, y, z) {
    'use strict';

    var size = y*2;

    var geometry = new THREE.TorusGeometry(size, size/3);
    var material = new THREE.MeshBasicMaterial( {color: loadColour2, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createKnotLoad(parent, x, y, z) {
    'use strict';

    var size = y*2;

    var geometry = new THREE.TorusKnotGeometry(size, size/3);
    var material = new THREE.MeshBasicMaterial( {color: loadColour1, wireframe: false});
    materials.push(material);
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);
    parent.add(mesh);
}

//////////////////////
/*CUSTOM TETRAHEDRON*/
//////////////////////
function CustomTetrahedronGeometry() {
    const vertices = [
        // vertical
        { pos: [0,   0,  0.5], norm: [-1,0,0], uv: [0, 0]},
        { pos: [0,   0, -0.5], norm: [-1,0,0], uv: [1, 0]},
        { pos: [0,   1,    0], norm: [-1,0,0], uv: [1, 1]},
        //horizontal
        { pos: [0, 0,  0.5], norm: [0,-1,0], uv: [0, 1]},
        { pos: [0, 0, -0.5], norm: [0,-1,0], uv: [1, 0]},
        { pos: [1, 0,    0], norm: [0,-1,0], uv: [1, 1]},
        //diagonal 1
        { pos: [0, 1,    0], norm: [0.5,0.5,-1], uv: [0, 1]},
        { pos: [1, 0,    0], norm: [0.5,0.5,-1], uv: [1, 0]},
        { pos: [0, 0, -0.5], norm: [0.5,0.5,-1], uv: [1, 1]},
        //diagonal 2
        { pos: [0, 1,    0], norm: [-0.5,-0.5,-1], uv: [0, 1]},
        { pos: [0, 0,  0.5], norm: [-0.5,-0.5,-1], uv: [1, 1]},
        { pos: [1, 0,    0], norm: [-0.5,-0.5,-1], uv: [1, 0]},
    ];

    const positions = [];
    const normals = [];
    const uvs = [];
    for (const vertex of vertices) {
        positions.push(...vertex.pos);
        normals.push(...vertex.norm);
        uvs.push(...vertex.uv);
    }

    var geometry = new THREE.BufferGeometry();
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    geometry.setAttribute(
        'position', 
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
    geometry.setAttribute(
        'normal', 
        new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
    geometry.setAttribute(
        'uv', 
        new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
    return geometry;
}


//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';

}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

    rotateCrane(rotateCraneDirection);
    moveTrolley(moveTrolleyDirection);
    moveRope(moveRopeDirection);
    moveClaw(moveClawDirection);
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
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createCameras(cameras, scene.position);

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    update();

    render();
  
    requestAnimationFrame(animate);
    renderer.render(scene, cameras[currentCamera]);

}

/////////////////////
/* MOVEMENTS        */
/////////////////////
function rotateCrane(direction) {
    'use strict'

    var upperSection = scene.children[1].children[2];
    upperSection.rotation.y += direction * Math.PI/180;
}

function moveTrolley(direction) {
    'use strict'

    var frontSection = scene.children[1].children[2].children[7];
    var jib = scene.children[1].children[2].children[2];

    if (frontSection.position.x + direction*0.5 <= jib.position.x + jibLength/2 - trolleyLength/2  && // dont move past jib
        frontSection.position.x + direction*0.5 >= jib.position.x - jibLength/2 + cabinLength/2 + trolleyLength/2) // dont move inside cabin
            frontSection.translateX(direction*0.5);
}

function moveRope(direction) {
    'use strict'

    var cable = scene.children[1].children[2].children[7].children[1];
    var claw = scene.children[1].children[2].children[7].children[2];
    
    var frontSectionHeight = scene.children[1].children[2].children[7].position.y;
    var upperSectionHeight = scene.children[1].children[2].position.y;

    //calculate the claw height based on the origin referencial
    var clawReferencialHeight = claw.position.y + frontSectionHeight + upperSectionHeight;
    var origin = scene.children[0];
    var originalClawHeight = 0 -cableLength - blockHeight;  // claw original height

    var length = cable.geometry.parameters.height * cable.scale['y'];
    var scaleMatrix = new THREE.Matrix4().makeScale(1, (length - direction*0.5)/length , 1);

    if (clawReferencialHeight - clawLength + direction*0.5 >= origin.position.y && // dont move past ground
        claw.position.y + direction*0.5 <= originalClawHeight) { // dont move past original position
                cable.applyMatrix4(scaleMatrix);
                claw.translateY(direction*0.5);
        }
    
}

function moveClaw(direction) {
    'use strict'

    var frontClaw = scene.children[1].children[2].children[7].children[2].children[1];
    var leftClaw = scene.children[1].children[2].children[7].children[2].children[2];
    var backClaw = scene.children[1].children[2].children[7].children[2].children[3];
    var rightClaw = scene.children[1].children[2].children[7].children[2].children[4];

    if (frontClaw.rotation.z - direction * Math.PI/180 <= 0 &&
        frontClaw.rotation.z - direction * Math.PI/180 >= -Math.PI/2) {
            frontClaw.rotation.z -= direction * Math.PI/180;
            backClaw.rotation.z -= direction * Math.PI/180;
            leftClaw.rotation.x -= direction * Math.PI/180;
            rightClaw.rotation.x += direction * Math.PI/180;
    }
}

////////////////////////////
/*    WIREFRAME TOGGLE    */
////////////////////////////

function toggleWireframe() {
    materials.forEach(element => {
        element.wireframe = !element.wireframe;
    });
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() { 
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        cameras[currentCamera].aspect = window.innerWidth / window.innerHeight;
        cameras[currentCamera].updateProjectionMatrix();
    }
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(event) {
    'use strict';

    /*Este evento para movimentar a grua só devia ser lido no primeiro instante em que a tecla vai para baixo,
    mas como manter a tecla em baixo faz com que se repita o input, o evento seria, normalmente, repetido
    por isso criei o keyDownMap, um mapa que guarda se cada tecla está em baixo
    event.repeat deveria dar esta informação, mas nos meus testes dava sempre valor false*/

    switch (event.key) {
        case " ":
            toggleWireframe();
            break;
        case "1":
          currentCamera = 0;
          break;
        case "2":
          currentCamera = 1;
          break;
        case "3":
          currentCamera = 2;
          break;
        case "4":
          currentCamera = 3;
          break;
        case "5":
          currentCamera = 4;
          break;
        case "6":
          currentCamera = 5;
          break;
        
        case 'Q':
        case 'q': // Q
            if (!keyDownMap.get('q')) {
                rotateCraneDirection += 1;
                keyDownMap.set('q', true)
            }
            break;
        
        case 'A':
        case 'a': // A
            if (!keyDownMap.get('a')) {
                rotateCraneDirection -= 1;
                keyDownMap.set('a', true)
            }
            break;

        case 'W':
        case 'w': // W
            if (!keyDownMap.get('w')) {
                moveTrolleyDirection += 1;
                keyDownMap.set('w', true)
            }
            break;

        case 'S':
        case 's': // S
            if (!keyDownMap.get('s')) {
                moveTrolleyDirection -= 1;
                keyDownMap.set('s', true)
            }
            break;

        case 'E':
        case 'e':
            if (!keyDownMap.get('e')) {
                moveRopeDirection += 1;
                keyDownMap.set('e', true)
            }
            break;
        
        case 'D':
        case 'd':
            if (!keyDownMap.get('d')) {
                moveRopeDirection -= 1;
                keyDownMap.set('d', true)
            }
            break;

        case 'R':
        case 'r':
            if (!keyDownMap.get('r')) {
                moveClawDirection += 1;
                keyDownMap.set('r', true);
            }
            break;

        case 'F':
        case 'f':
            if (!keyDownMap.get('f')) {
                moveClawDirection -= 1;
                keyDownMap.set('f', true);
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
    'use strict';

    switch (event.key) {        
        case 'Q':
        case 'q': // Q
            rotateCraneDirection += -1;
            keyDownMap.set('q', false);
            break;
        
        case 'A':
        case 'a': // A
            rotateCraneDirection -= -1;
            keyDownMap.set('a', false);
            break;

        case 'W':
        case 'w': // W
            moveTrolleyDirection += -1;
            keyDownMap.set('w', false);
            break;

        case 'S':
        case 's': // S
            moveTrolleyDirection -= -1;
            keyDownMap.set('s', false);
            break;

        case 'E':
        case 'e': // E
            moveRopeDirection += -1;
            keyDownMap.set('e', false);
            break;
        
        case 'D':
        case 'd': // D
            moveRopeDirection -= -1;
            keyDownMap.set('d', false);
            break;
        
        case 'R':
        case 'r': // R
            moveClawDirection += -1;
            keyDownMap.set('r', false);
            break;

        case 'F':
        case 'f': // F
            moveClawDirection -= -1;
            keyDownMap.set('f', false);
            break;
            
        default:
            // Do nothing if other keys are pressed
            return;
    }
}

init();
animate();
