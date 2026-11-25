
import { loadGLTF } from "./libs/loader.js";

// ====================================
// 1. CONFIGURATION
// ====================================

// MindAR marker file in your repository
const TARGET_FILE = "./assets/targets/scene1.mind";

// Google Drive Scene 1 model
const MODEL_URL =
  "https://drive.google.com/uc?export=download&id=1JhwfhmALbFLdVu0tgsQuHhZ1XADiLeV9";

// ====================================
// 2. GET HTML ELEMENTS
// ====================================

const container = document.querySelector("#ar-container");
const startButton = document.querySelector("#start-button");
const stopButton = document.querySelector("#stop-button");
const statusText = document.querySelector("#status");

let mindarThree = null;
let mixer = null;
let animationFrame = null;

// ====================================
// 3. START AR EXPERIENCE
// ====================================

startButton.addEventListener("click", startAR);
stopButton.addEventListener("click", stopAR);

async function startAR() {

  startButton.disabled = true;
  statusText.textContent = "Preparing AR camera...";

  try {

    const THREE = window.MINDAR.IMAGE.THREE;

    // Create MindAR
    mindarThree = new window.MINDAR.IMAGE.MindARThree({
      container: container,
      imageTargetSrc: TARGET_FILE,
      maxTrack: 1
    });

    const { renderer, scene, camera } = mindarThree;

    // ====================================
    // 4. CREATE LIGHTING
    // ====================================

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      2
    );

    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // ====================================
    // 5. CREATE MARKER ANCHOR
    // ====================================

    const anchor = mindarThree.addAnchor(0);

    // ====================================
    // 6. LOAD SCENE 1 MODEL
    // ====================================

    statusText.textContent = "Loading Scene 1...";

    const gltf = await loadGLTF(MODEL_URL);

    const model = gltf.scene;

    // Adjust model size and position
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, 0, 0);

    anchor.group.add(model);

    // ====================================
    // 7. PLAY MODEL ANIMATION
    // ====================================

    if (gltf.animations && gltf.animations.length > 0) {

      mixer = new THREE.AnimationMixer(model);

      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });

      const clock = new THREE.Clock();

      function animate() {
        animationFrame = requestAnimationFrame(animate);

        const delta = clock.getDelta();

        if (mixer) {
          mixer.update(delta);
        }
      }

      animate();
    }

    // ====================================
    // 8. START CAMERA
    // ====================================

    await mindarThree.start();

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    statusText.textContent =
      "AR is running! Point your camera at the marker.";

    startButton.style.display = "none";
    stopButton.style.display = "inline-block";

  } catch (error) {

    console.error("AR Error:", error);

    statusText.textContent =
      "Unable to start AR: " + error.message;

    startButton.disabled = false;

    if (mindarThree) {
      try {
        await mindarThree.stop();
      } catch (stopError) {
        console.error(stopError);
      }
      mindarThree = null;
    }
  }
}

// ====================================
// 9. STOP AR EXPERIENCE
// ====================================

async function stopAR() {

  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  if (mindarThree) {
    mindarThree.renderer.setAnimationLoop(null);
    await mindarThree.stop();
    mindarThree = null;
  }

  mixer = null;

  statusText.textContent = "AR experience stopped.";

  stopButton.style.display = "none";
  startButton.style.display = "inline-block";
  startButton.disabled = false;
}
