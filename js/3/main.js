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
const _pointLight = new THREE.PointLight(0xffffff, 50);
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
// _floor.position.z = -350;

_floor.receiveShadow = true;
_scene.add(_floor);



// Seeded random function
function seededRandom(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
// Define your seed (use the same seed to get the same random numbers each time)
var seed = 42; // You can change this seed to any number


//load 3D model
var _3dmodel; // Declare the 3D model variable
var _mixer; // Declare the animation variable
var _animationSetting = {speed:1};

const loader = new GLTFLoader().setPath( '/examples/models/gltf/' );

	loader.load( 'mushroom_tree1.glb', function ( gltf ) {
    //Loader, skalerer og placerer 3D modellen
    _3dmodel = gltf.scene;
    _3dmodel.scale.set(.02,.02,.02);
    
    const _numModels = 80; // Number of models to place
    const placedModels = []; // Array to store positions of placed models

    for (var i = 0; i < _numModels; i++) {
        let validPosition = false;
        let _x, _z;

        // Keep trying to generate a valid position until the minimum distance is satisfied
        while (!validPosition) {
            _x = Math.random(seed) * 400 - 200; // Random x value
            _z = Math.random(seed) * -100; // Random z value
            
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

gsap.ticker.add(animate);

var _d = 0;//deltaratio
var _clock = new THREE.Clock();
var _direction = 0;

function animate(){
    _d = gsap.ticker.deltaRatio(60); //matcher op imod 60 fps - alle får samme hastighed på deres animation

    _stars.rotation.y += .0001 * _d;

    _composer.render(); //render screen med effekter
       
    _stats.update();
}


//opsætte GUI
const gui = new GUI();

//create folder for camera
const _folderca = gui.addFolder("Camera position");
_folderca.add(_camera.position,'x',-10,10,.1);
_folderca.add(_camera.position,'y',-10,10,.1);
_folderca.add(_camera.position,'z',-10,10,.1);

const _folderrca = gui.addFolder("Camera rotation");
_folderrca.add(_camera.rotation,'x', dtr(-180), dtr(180), .01);
_folderrca.add(_camera.rotation,'y', dtr(-180), dtr(180), .01);
_folderrca.add(_camera.rotation,'z', dtr(-180), dtr(180), .01);

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


