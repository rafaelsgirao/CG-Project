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
    var camera = new THREE.PerspectiveCamera(70,
                                         window.innerWidth / window.innerHeight,
                                         1,
                                         1000);
    camera.position.x = 50;
    camera.position.y = 50;
    camera.position.z = 50;
    camera.lookAt(scene.position);

    cameras.push(camera);
}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createCrane(){
    'use strict';

    var crane = new THREE.Object3D();

    createBase(crane, 0, 10, 0);
    createTower(crane, 0, 30, 0);
    createUpperSection(crane, 0, 0, 0);
    scene.add(crane);
}

function createBase(parent, x, y, z){
    'use strict';

    var geometry = new THREE.BoxGeometry(10, 10, 10);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: (0,0,0), wireframe: true}));
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createTower(parent, x, y, z){
    'use strict';

    var geometry = new THREE.BoxGeometry(8, 40, 8);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: (0,0,0), wireframe: true}));
    mesh.position.set(x, y, z);
    parent.add(mesh);
}

function createUpperSection(parent, x, y, z){
    'use strict';

    var upperSection = new THREE.Object3D();
/*
    createCabin(upperSection);          // Cabine
    createApex(upperSection);           // Porta-lança
    createJib(upperSection);            // Lança
    createCounterjib(upperSection);     // Contra-lança
    createCounterweight(upperSection);  // Contra-peso
    createRearPendant(upperSection);    // Tirante de trás
    createForePendant(upperSection);    // Tirante da frente
    createAOutraParteComAsCoisasQueMexem(parent)
*/
    parent.add(upperSection);
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
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

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
        cameras[currentCamera].aspect = window.innerWidth / window.innerHeight;
        cameras[currentCamera].updateProjectionMatrix();
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
function onKeyUp(e){
    'use strict';
}

init();
animate();