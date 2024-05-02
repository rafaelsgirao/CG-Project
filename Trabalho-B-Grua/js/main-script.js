import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var scene, renderer, currentCamera = 0;
var cameras = new Array();

const baseLength = 15, baseHeight = 10, baseWidth = baseLength;                         // base
const towerLength = 5, towerHeight = 70, towerWidth = towerLength;                      // torre
const cabinLength = 8, cabinHeight = towerLength, cabinWidth = towerLength;             // cabine 
const jibLength = 75, jibHeight = 5, jibWidth = towerWidth;                             // lanca
const counterjibLength = 30, counterjibHeight = jibHeight, counterjibWidth = jibWidth;  // contra-lanca
const apexLength = towerLength, apexHeight = 15, apexWidth = apexLength;                // porta-lanca
const weightLength = 8, weightHeight = 5, weightWidth = towerWidth;                     // contra-peso
const pendentRadius = 1;                                                                // tirante
const trolleyLength = 5, trolleyHeight = 5, trolleyWidth = jibWidth/2;                  // carrinho
const cableRadius = 1; var cableLength = 10;                                            // cabo
const blockLength = 5, blockHeight = blockLength, blockWidth = blockLength;             // bloco da garra
const clawLength = 5, clawHeight = 3, clawWidth = 3;                                    // garra

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(10));
    scene.background = new THREE.Color(0xE3D8B7);
    createCrane();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCameras(){
    'use strict';
    
    // Camera 1
    var cam1 = new THREE.PerspectiveCamera(70,
                                         window.innerWidth / window.innerHeight,
                                         1,
                                         1000);
    cam1.position.x = 120;
    cam1.position.y = 110;
    cam1.position.z = 100;
    cam1.lookAt(scene.position);

    cameras.push(cam1);

    const frontCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 100);
    frontCamera.position.set(0, 0, 80);
    frontCamera.lookAt(scene.position);

    cameras.push(frontCamera);
    
    const sideCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000);
    sideCamera.position.set(100, 0, 0);
    sideCamera.lookAt(scene.position);

    cameras.push(sideCamera);

    const topCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000);
    topCamera.position.set(0, 100, 0);
    topCamera.lookAt(scene.position);

    cameras.push(topCamera);
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
    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: (0,0,0), wireframe: true}));
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createTower(parent, x, y, z){
    'use strict';

    var geometry = new THREE.BoxGeometry(towerLength, towerHeight, towerWidth);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: (0,0,0), wireframe: true}));
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
    //createForePendant(upperSection, 0, cabinHeight + jibHeight, 0);
    //createRearPendant(upperSection, 0, cabinHeight + jibHeight, 0);
    createFrontSection(upperSection, 15, cabinHeight, 0);
    
    upperSection.position.set(x, y, z);
    parent.add(upperSection);
}

// Cabine
function createCabin(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth);
    var material = new THREE.MeshBasicMaterial({ color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Porta-Lanca
function createApex(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(apexLength, apexHeight, apexWidth);
    var material = new THREE.MeshBasicMaterial({ color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

// Lanca
function createJib(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(jibLength, jibHeight, jibWidth);
    var material = new THREE.MeshBasicMaterial( {color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

//Contra-lanca
function createCounterJib(parent, x, y, z) {
    'use strict';
    
    var geometry = new THREE.BoxGeometry(counterjibLength, counterjibHeight, counterjibWidth);
    var material = new THREE.MeshBasicMaterial( {color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}


// Contra-peso
function createCounterWeight(parent, x, y, z) {
    'use strict';
    
    var geometry = new THREE.BoxGeometry(weightLength, weightHeight, weightWidth);
    var material = new THREE.MeshBasicMaterial( {color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

//Tirante de tras
function createRearPendant(parent, x, y, z) {
    'use strict';
    
    var geometry = new THREE.CylinderGeometry(pendentRadius, pendentRadius);
    var material = new THREE.MeshBasicMaterial( {color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x , y, z);
    parent.add(mesh);
}

//Tirante da frente
function createForePendant(parent, x, y, z) {
    'use strict';
    
    var geometry = new THREE.CylinderGeometry(pendentRadius, pendentRadius);
    var material = new THREE.MeshBasicMaterial( {color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

//--------------------------------------------------------------------------------------
// FRONT SECTION ///////////////////////////////////////////
function createFrontSection(parent, x, y, z) {
    'use strict';

    var frontSection = new THREE.Object3D();

    createTrolley(frontSection, 0, 0, 0);
    createCable(frontSection, 0, 0, 0);
    createClawSection(frontSection, 0, -cableLength, 0);

    frontSection.position.set(x, y, z);
    parent.add(frontSection);
}

function createTrolley(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.BoxGeometry(trolleyLength, trolleyHeight, trolleyWidth);
    var material = new THREE.MeshBasicMaterial( {color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    parent.add(mesh);
}

function createCable(parent, x, y, z) {
    'use strict';

    var geometry = new THREE.CylinderGeometry(cableRadius, cableRadius, cableLength, 10);
    var material = new THREE.MeshBasicMaterial( {color: (0,0,0), wireframe: true});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.translateY(cableLength/2);
    mesh.position.set(x,y,z);
    mesh.position.y -= cableLength/2;
    parent.add(mesh);
}

//--------------------------------------------------------------------------------------
// CLAW SECTION ///////////////////////////////////////////
function createClawSection(parent, x, y, z) {
    var clawSection = new THREE.Object3D();
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
    createCameras();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    render();
  
    requestAnimationFrame(animate);
    renderer.render(scene, cameras[currentCamera]);

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
    switch (event.key) {
        case '1':
            currentCamera = 0;
            break;
        case '2':
            currentCamera = 1;
            break;
        case '3':
            currentCamera = 2;
            break;
        default:
            // Do nothing if other keys are pressed
            return;
    }

}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
}

init();
animate();