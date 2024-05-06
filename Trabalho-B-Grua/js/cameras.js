import * as THREE from "three";

const camRatio = 7;
const fixedCamPoint = [100, 100, 120];

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

export function createCameras(cameras, scene_position) {
  "use strict";

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

  camFixedOrthogonal.position.set(
    fixedCamPoint[0],
    fixedCamPoint[1],
    fixedCamPoint[2]
  );
  camFixedOrthogonal.lookAt(scene_position);
  cameras[3] = camFixedOrthogonal;

  // Câmara fixa: projeção perspetiva (5).

  const camFixedPerspective = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  camFixedPerspective.position.set(
    fixedCamPoint[0],
    fixedCamPoint[1],
    fixedCamPoint[2]
  );
  camFixedPerspective.lookAt(scene_position);
  cameras[4] = camFixedPerspective;
}

// Câmara móvel: gancho (6).

export const createCamClaw = (parent, cameras, x, y, z) => {
  const camClaw = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  camClaw.position.set(x, y , z);

  camClaw.lookAt(x, -1000, z); 
  camClaw.rotation.z -= Math.PI / 2;
  cameras[5] = camClaw;
  parent.add(camClaw);
};
