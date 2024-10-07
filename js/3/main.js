import * as THREE from 'three';
import {OrbitControls} from '/examples/jsm/controls/OrbitControls.js'; //styrer kamera
import GUI from 'lil-gui';
import Stats from 'three/addons/libs/stats.module.js'; //viser performance FPS
//model for post processing
import {EffectComposer} from '/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';

import {Reflector} from '/examples/jsm/objects/Reflector.js';
import {FontLoader} from '/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from '/examples/jsm/geometries/TextGeometry.js';
//egne moduler
import * as ThreeObjects from '/js/modules/ThreeObjects.js';
import InteractiveCube from '/js/modules/InteractiveCube.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {ColladaLoader} from 'three/addons/loaders/ColladaLoader.js';
import {GlitchPass} from '/examples/jsm/postprocessing/GlitchPass.js';
import {FilmPass} from '/examples/jsm/postprocessing/FilmPass.js';
import {AfterimagePass} from '/examples/jsm/postprocessing/AfterimagePass.js';
import {FirstPersonControls} from '/examples/jsm/controls/FirstPersonControls.js';
import {PointerLockControls} from '/examples/jsm/controls/PointerLockControls.js';

var _canvasEl = document.getElementById("three");

//sæt størrelse
var _vw = window.innerWidth;
var _vh = window.innerHeight;


//create a scene - camera
// Opretter et kamera med et perspektivisk view (50 graders field of view, 
// aspect ratio baseret på skærmens bredde/højde, nærmeste synsfelt på 0.1 og fjerneste på 1000)
const _scene = new THREE.Scene();
_scene.background = new THREE.Color(0xFF7000);
//tilføj tåge
_scene.fog = new THREE.Fog(0xFF7000, 0, 100);
const _camera = new THREE.PerspectiveCamera(50, _vw/_vh, .1, 1000);
const _renderer = new THREE.WebGLRenderer({canvas:_canvasEl, antialias:true}); //antialias smoother kanterne
_renderer.setSize(_vw,_vh);
_renderer.setPixelRatio(window.devicePixelRatio); //samme opløsning som brugerens skærm
_renderer.shadowMap.enabled = true; //gør det muligt at se skygger
_renderer.shadowMap.type = THREE.PCFShadowMap; //default PCF shadowmap

//Audio listener
const _listener = new THREE.AudioListener();
_camera.add(_listener); //attach listener to camera

//Audio source
const _bgMusic = new THREE.Audio(_listener);

//load mp3 file
const _audioLoader = new THREE.AudioLoader();
_audioLoader.load('/examples/sounds/alien_planet_echoes.mp3', function(buffer){
    _bgMusic.setBuffer(buffer);
    _bgMusic.setLoop(true); //loop the audio
    _bgMusic.setVolume(0.9); //adjust volume (0.0 - 0.1)
    _bgMusic.play(); //play audio
});



//Initialize PointerLockControls - allows the camera to capture the mouse movement, enabling the user to look around freely
const _controls = new PointerLockControls(_camera, document.body);

//add the controls to the scene
_scene.add(_controls.object);

//pointer lock event listeners
const _blocker = document.getElementById('_blocker');// Optional: an overlay to block view before entering
const _instructions = document.getElementById('_instructions');// Instructions to click to start

_instructions.addEventListener('click', () => {
    _controls.lock();
});

_controls.addEventListener('lock', () => {
    _instructions.style.display = 'none';
    _blocker.style.display = 'none';
});

_controls.addEventListener('unlock', () => {
    _blocker.style.display = 'block';
    _instructions.style.display = '';
});

const _velocity = new THREE.Vector3();
const _cameraDirection = new THREE.Vector3();
const _moveSpeed = 400.0; 
const _friction = 10.0;

// Create an object to track which keys are being pressed
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Add an event listener for when any key is pressed
document.addEventListener('keydown', (event) => {
  // Check which key was pressed and update the corresponding key in the `keys` object
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.forward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.backward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
    }
}, false);

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            keys.forward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.backward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
    }
}, false);

//initiate effect composer
const _composer = new EffectComposer(_renderer);
//capture scene
const _renderPass = new RenderPass(_scene,_camera);
_composer.addPass(_renderPass);

//radiant/glowingeffect
const _bloomPass = new UnrealBloomPass(new THREE.Vector2(_vw, _vh), .5,1,0);
_composer.addPass(_bloomPass)

//glitch effect
// const _glitchPass = new GlitchPass();
// // _glitchPass.goWild = true;
// _composer.addPass(_glitchPass)

//noise
const _filmEffect = new FilmPass();
_composer.addPass(_filmEffect);

// const _afterimagePass = new AfterimagePass();
// _composer.addPass(_afterimagePass);

var _stats = new Stats();
document.body.appendChild(_stats.dom); //ligger i DOM / html-dokumnetet

//visualiser x,y og z axis
const _axeshelper = new THREE.AxesHelper(2);
_scene.add(_axeshelper);

//tilføj generel lyskilde
const _ambiLight = new THREE.AmbientLight(0xffffff, 0.4); //ambient light giver lys over det hele
_scene.add(_ambiLight);


//point light lyser ud fra alle dens retninger
const _pointLight = new THREE.PointLight(0xffffff, 30);
_pointLight.castShadow = true;
_pointLight.position.set(0,4,0);
_pointLight.shadow.mapSize.width = 512 * 4;
_pointLight.shadow.mapSize.height = 512 * 4;
_scene.add(_pointLight);

//lav floor
const _floorGeom = new THREE.PlaneGeometry(100,800); 
const _floorTexture = new THREE.TextureLoader().load('/examples/textures/grasstexture.png');
_floorTexture.wrapS = THREE.RepeatWrapping;
_floorTexture.wrapT = THREE.RepeatWrapping;
// Roter teksturen ved at justere dens gentagelse
_floorTexture.repeat.set(1,1);
_floorTexture.rotation = Math.PI / 2; // 90 grader i radianer
const _floorMat = new THREE.MeshPhongMaterial({color:0xFFFFFF, map:_floorTexture, side: THREE.DoubleSide});
const _floor = new THREE.Mesh(_floorGeom,_floorMat);
_floor.rotation.x = dtr(-90);
_floor.position.z = -370;

_floor.receiveShadow = true;
_scene.add(_floor);

//byg sphere
function buildSphere(x,y,z) {
    const _geometry = new THREE.SphereGeometry(50,7,7);
    const _material = new THREE.MeshBasicMaterial({color:0xffffff, fog: false});
    var _sphere = new THREE.Mesh(_geometry,_material);
    _sphere.position.set(x,y,z);
    _scene.add(_sphere);
    return _sphere;
}
buildSphere(0,0,-300);

// Seeded random function
function seededRandomGenerator(seed) {
    return function() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
}

let seed = 55;
const seededRandom = seededRandomGenerator(seed);

//load 3D    model TREE
var _3dmodel; // Declare the 3D model variable
var _mixer; // Declare the animation variable
var _animationSetting = {speed:1};

const loader = new GLTFLoader().setPath( '/examples/models/gltf/' );

	loader.load( 'mushroom_tree1.glb', function ( gltf ) {
    //Loader, skalerer og placerer 3D modellen
    _3dmodel = gltf.scene;
    _3dmodel.scale.set(.02,.02,.02);
    
    const _numModels = 60; // Number of models to place
    const placedModels = []; // Array to store positions of placed models

    for (var i = 0; i < _numModels; i++) {
        let validPosition = false;
        let _x, _z;

        // Keep trying to generate a valid position until the minimum distance is satisfied
        while (!validPosition) {
            _x = seededRandom() * 100 - 50; // Narrower range for X-axis
            _z = seededRandom() * 300 - 270; // Wider range for Z-axis

            validPosition = true; // Assume position is valid unless proven otherwise

            // Check if this position is at least 10 units away from every other placed model
            for (let j = 0; j < placedModels.length; j++) {
                const dx = _x - placedModels[j].x;
                const dz = _z - placedModels[j].z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance < 10) {
                    validPosition = false; // Too close to another model, try again
                    break;
                }
            }
        }

        // Save the valid position for future distance checks
        placedModels.push({ x: _x, z: _z });

        // Create a new instance of the model at the valid position
        const _modelInstance = _3dmodel.clone(); // Clone the model for each instance
        _modelInstance.position.set(_x, 0, _z); // Set the position
        _modelInstance.rotation.y = Math.random() * Math.PI; // Set a random rotation

        // Add the instance to the scene
        _scene.add(_modelInstance);
    }
});

const shrekLoader = new GLTFLoader().setPath('/examples/models/gltf/');
shrekLoader.load('alien_plant_shrek.glb', function (gltf) {
    // Load, scale, and position the 3D model
    const _shrek3dmodel = gltf.scene;
    _shrek3dmodel.scale.set(10, 10, 10); // Adjust scale as needed
    
    const _numModels = 30; // Number of models to place
    const placedModels = []; // Array to store positions of placed models

    for (let i = 0; i < _numModels; i++) {
        let validPosition = false;
        let _x, _z;

        // Keep trying to generate a valid position until the minimum distance is satisfied
        while (!validPosition) {
            _x = seededRandom() * 100 - 50; // X-axis range (-50 to 50)
            _z = seededRandom() * 300 - 270; // Z-axis range (-270 to 30)

            validPosition = true; // Assume position is valid unless proven otherwise

            // Check if this position is at least 10 units away from every other placed model
            for (let j = 0; j < placedModels.length; j++) {
                const dx = _x - placedModels[j].x;
                const dz = _z - placedModels[j].z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance < 10) {
                    validPosition = false; // Too close to another model, try again
                    break;
                }
            }
        }

        // Save the valid position for future distance checks
        placedModels.push({ x: _x, z: _z });

        // Create a new instance of the model at the valid position
        const _shrekModelInstance = _shrek3dmodel.clone(); //Correct variable reference
        _shrekModelInstance.position.set(_x, -0.8, _z); // Set the position on X and Z axis
        _shrekModelInstance.rotation.y = Math.random() * Math.PI; // Set a random rotation on Y axis

        // Add the instance to the scene
        _scene.add(_shrekModelInstance);
    }
});

const mushroomLoader = new GLTFLoader().setPath('/examples/models/gltf/');
const positions = [
    { x: -10, z: -20 },
    { x: 15, z: 5 },
    { x: -30, z: 12 },
    { x: 25, z: -25 },
    { x: 0, z: -30 },
    { x: 5, z: 10 },
    { x: -15, z: 15 },
    { x: 20, z: -10 },
    { x: -5, z: -5 },
    { x: 10, z: -15 },
    { x: 30, z: 20 },
    { x: -25, z: 25 },
    { x: 10, z: 10 },
    { x: -20, z: -20 },
    { x: 15, z: 0 },
    { x: 0, z: 20 },
    { x: -10, z: 10 },
    { x: 25, z: -5 },
    { x: 10, z: -30 },
    { x: -5, z: 5 },
    { x: 30, z: -20 },
];

mushroomLoader.load('magical_mushroom_blue.glb', function (gltf) {
    const mushroomModel = gltf.scene; // The loaded model
    mushroomModel.scale.set(0.01, 0.01, 0.01); // Adjust the scale factors as needed

    // Create a glowing material
    const glowingMaterial = new THREE.MeshStandardMaterial({
        color: 0x0036A7, // White color
        emissive: 0x00B1FF,
        emissiveIntensity: 0.5 // Intensity of the glow
    });

    // Iterate through the array of positions
    for (const pos of positions) {
        const mushroomInstance = mushroomModel.clone(); // Clone the model
        mushroomInstance.position.set(pos.x, 1, pos.z); // Set the position
        
        // Traverse the mushroom instance to apply the glowing material
        mushroomInstance.traverse((child) => {
            if (child.isMesh) {
                // Apply the glowing material to each mesh
                child.material = glowingMaterial;
            }
        });

        _scene.add(mushroomInstance); // Add to the scene
    }
});

// Load grass with random positions
loader.load('low_poly_grass.glb', function (gltf) {
    const grassModel = gltf.scene;
    grassModel.scale.set(0.006, 0.006, 0.006); // Adjusted scale

    const numGrass = 100;

    for (let i = 0; i < numGrass; i++) {
        // Generate fully random positions without a seed
        const _x = Math.random() * 100 - 50; // Random x value within the range
        const _z = Math.random() * 300 - 270;      // Random z value within the range
        const y = -4; // Grass should be placed on the ground, so y is set to 0

        // Clone the grass model and place it at the generated position
        const grassInstance = grassModel.clone();
        grassInstance.position.set(_x, y, _z);

        // Add the grass instance to the scene
        _scene.add(grassInstance);
    }
});

var _lab3dmodel;

const _labLoader = new GLTFLoader().setPath('/examples/models/gltf/');
    _labLoader.load('tunnel_lab.glb', function(gltf){
        //places, scales
        _lab3dmodel = gltf.scene;
        _lab3dmodel.scale.set(2.1,2.1,2.1),
        _lab3dmodel.position.set(0,0,-8);
        _scene.add(_lab3dmodel)
    });

gsap.ticker.add(animate);

var _d = 0;//deltaratio

// Movement parameters
const moveSpeed = 100.0; // Units per second
const friction = 10.0; // Friction coefficient

// Velocity and direction vectors
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Clock to track time
const clock = new THREE.Clock();


function animate(){
        // Calculate delta ratio based on target FPS (60)
        _d = gsap.ticker.deltaRatio(60); // Ensures consistent movement speed
    
        // Rotate the stars
        _stars.rotation.y += 0.0001 * _d;
    
        // Update movement based on keys pressed
        direction.set(0, 0, 0);
    
        if (keys.forward) direction.z -= 1;
        if (keys.backward) direction.z += 1;
        if (keys.left) direction.x -= 1;
        if (keys.right) direction.x += 1;
    
        direction.normalize(); // Ensure consistent movement speed
    
        if (keys.forward || keys.backward) velocity.z -= direction.z * moveSpeed * _d * (1/60);
        if (keys.left || keys.right) velocity.x -= direction.x * moveSpeed * _d * (1/60);
    
        // Apply friction (to ensure full stop when keyup)
        velocity.x -= velocity.x * friction * _d * (1/60);
        velocity.z -= velocity.z * friction * _d * (1/60);
    
        // Calculate the camera's direction
        _camera.getWorldDirection(_cameraDirection);
        _cameraDirection.y = 0; // Prevent camera from moving up/down
        _cameraDirection.normalize();
    
        // Calculate the right vector
        const right = new THREE.Vector3();
        right.crossVectors(_camera.up, _cameraDirection).normalize();
    
        // Move the camera
        _controls.object.position.addScaledVector(_cameraDirection, velocity.z * _d * (1/60));
        _controls.object.position.addScaledVector(right, velocity.x * _d * (1/60));
    

    _composer.render(); //render screen med effekter
       
    _stats.update();
}


//opsætte GUI
// const gui = new GUI();

//create folder for camera
// const _folderca = gui.addFolder("Camera position");
// _folderca.add(_camera.position,'x',-10,10,.1);
// _folderca.add(_camera.position,'y',-10,10,.1);
// _folderca.add(_camera.position,'z',-10,10,.1);

// const _folderrca = gui.addFolder("Camera rotation");
// _folderrca.add(_camera.rotation,'x', dtr(-180), dtr(180), .01);
// _folderrca.add(_camera.rotation,'y', dtr(-180), dtr(180), .01);
// _folderrca.add(_camera.rotation,'z', dtr(-180), dtr(180), .01);

//stars
function createStars(){
    const _points = [];
    const _radius = 300; //hvor langt væk starter stjernerne
    for(var i=0;i<1000;i++){
        var _angle = dtr(Math.random() * 360); //tilfældig vinkel hele vejen rundt
        var _x = _radius * Math.cos(_angle); 
        var _z = _radius * Math.sin(_angle);
        var _y = Math.random() * 250;
        _points.push(new THREE.Vector3(_x,_y,_z)); //array med 1000 elementer, hver af dem et 3d koordinat
    } //loopet køres igennem 1000 gange
    const _geometry = new THREE.BufferGeometry().setFromPoints(_points);
    const _material = new THREE.PointsMaterial({color:0xFFFFFF, fog:false})
    var _stars = new THREE.Points(_geometry,_material);
    
    _scene.add(_stars);
    return _stars;
}
var _stars = new createStars();

// Planets
function createPlanets() {
    const _numPlanets = 10; // Number of planets
    const _radius = 300; // How far away the planets start

    // Define geometry and base material
    const _planetGeometry = new THREE.SphereGeometry(1, 16, 16); // Radius 1, 16 segments
    const _planetMaterial = new THREE.MeshPhongMaterial({
        shininess: 100,
        fog: false,
    });

    for (var i = 0; i < _numPlanets; i++) {
    // Create a new mesh for each planet
    const _planet = new THREE.Mesh(_planetGeometry, _planetMaterial);
    _planet.castShadow = true;
    _planet.receiveShadow = true;

    // Random positions
    var _angle = dtr(Math.random() * 360); // Random angle all around
    var _x = _radius * Math.cos(_angle);
    var _z = _radius * Math.sin(_angle);
    var _y = Math.random() * 250;
    _planet.position.set(_x, _y, _z);

    // Random scale
    const _scale = Math.random() * 5 + 30; // Set scale
    _planet.scale.set(_scale, _scale, _scale);

    // Add planet to the scene inside the loop
    _scene.add(_planet);
}

}

createPlanets();

//init - sætter kameraet tilbage så man kan se scenen
_camera.position.z = 10;
_camera.position.y = 1.5;

//degree to radius - omregner til radian
function dtr(d) {
    return d * (Math.PI/180);
}


//når denne function er kaldt, bliver værdierne opdateret
function resized(e){
    var _vw = window.innerWidth;
    var _vh = window.innerHeight;
    //console.log(_vw,_vh);

    _camera.aspect = _vw/_vh;
    _camera.updateProjectionMatrix();
    _renderer.setSize(_vw,_vh);
}

window.addEventListener("resize", resized); // Lytter til ændringer i skærmstørrelsen (resize) og kalder resized-funktionen
resized(null); // Kalder resized for første gang, så størrelsen er korrekt fra starten