import * as THREE from 'three';
import {OrbitControls} from '/examples/jsm/controls/OrbitControls.js'; //styrer kamera
import GUI from 'lil-gui';
import InteractiveCube from '/js/modules/InteractiveCube.js';
import {EffectComposer} from '/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '/examples/jsm/postprocessing/RenderPass.js';
import {FilmPass} from '/examples/jsm/postprocessing/FilmPass.js';


var _canvasEl = document.getElementById("three");

//sæt størrelse
var _vw = window.innerWidth;
var _vh = window.innerHeight;


// Opretter et kamera med et perspektivisk view
const _scene = new THREE.Scene();
_scene.background = new THREE.Color(0xFFAA20);
//tilføj tåge
// _scene.fog = new THREE.Fog(0xFFAA20, 0, 40);
const _camera = new THREE.PerspectiveCamera(50, _vw/_vh, .1, 1000);
const _renderer = new THREE.WebGLRenderer({canvas:_canvasEl, antialias:true}); //antialias smoother kanterne
_renderer.setSize(_vw,_vh);
_renderer.setPixelRatio(window.devicePixelRatio); //samme opløsning som brugerens skærm
_renderer.setAnimationLoop(animate); //funktion der bliver kaldt hele tiden
_renderer.shadowMap.enabled = true; //gør det muligt at se skygger
_renderer.shadowMap.type = THREE.PCFShadowMap; //default PCF shadowmap


//initiate effect composer
const _composer = new EffectComposer(_renderer);
//capture scene
const _renderPass = new RenderPass(_scene,_camera);
_composer.addPass(_renderPass);

var _stats = new Stats();
document.body.appendChild(_stats.dom); //ligger i DOM / html-dokumnetet

//noise
const _filmEffect = new FilmPass();
_composer.addPass(_filmEffect);

//visualiser x,y og z axis
const _axeshelper = new THREE.AxesHelper(2);
_scene.add(_axeshelper);

//tilføj generel lyskilde
const _ambiLight = new THREE.AmbientLight(0xffffff, 1); //ambient light giver lys over det hele
_scene.add(_ambiLight);

//directional light 
const _dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
_dirLight.castShadow = true;
_scene.add(_dirLight);

//helper to vialualize the light position
const _dirLightHelper = new THREE.DirectionalLightHelper(_dirLight, 2);
_scene.add(_dirLightHelper);

//point light lyser ud fra alle dens retninger
// const _pointLight = new THREE.PointLight(0xFF2AF8, 100);
// _pointLight.castShadow = true;
// _pointLight.position.set(0,4,0);
// _scene.add(_pointLight);


//lav floor
const _floorGeom = new THREE.PlaneGeometry(200,800); 
const _floorTexture = new THREE.TextureLoader().load('/examples/textures/grasstexture.png');
_floorTexture.wrapS = THREE.RepeatWrapping;
_floorTexture.wrapT = THREE.RepeatWrapping;
_floorTexture.repeat.set(1,3);
// Roter teksturen ved at justere dens gentagelse
_floorTexture.rotation = Math.PI / 2; // 90 grader i radianer
const _floorMat = new THREE.MeshPhongMaterial({color:0xFFFFFFF, map:_floorTexture});
const _floor = new THREE.Mesh(_floorGeom,_floorMat);
_floor.rotation.x = dtr(-90);
// _floor.position.z = -350;

_floor.receiveShadow = true;
_scene.add(_floor);

function animate(){

    // _cube.rotation.x += .01;
    // _cube.rotation.y += .01;

//juster kamera position og rotation
    //_camera.position.z += .01;
    //_camera.rotation.x += dtr(.1);

//fade up ambient light
    // if (_ambiLight.intensity < 5) _ambiLight.intensity += .01;

    //_cube.position.z -= .01;


    // Render scenen med EffectComposer
    _composer.render();

    // Opdater stats hvis du bruger det
   

       _renderer.render(_scene, _camera);
}


var _shapes = []; //array som holder alle vores shapes/objekter


// Variabel til antallet af kuber
var _numCubes = 500;
var _cubes = [];

// Opret kuber og tilføj dem til scenen
for (var i = 0; i < _numCubes; i++) {
    // Tilfældige positioner for kuberne
    const _x = Math.random() * 200 - 100;  // x-position i området [-100, 100]
    const _y = 0.5;                        // y-position, højden over gulvet
    const _z = Math.random() * 200 - 100;  // z-position i området [-100, 100]
    
    // Opret en kube med tilfældig farve
    var _cubeGeom = new THREE.BoxGeometry(1, 1, 1);
    var _cubeMat = new THREE.MeshPhongMaterial({ color: randomcolor() });
    var _cube = new THREE.Mesh(_cubeGeom, _cubeMat);

    // Positioner og tilføj kube til scenen
    _cube.position.set(_x, _y, _z);
    _cube.castShadow = true;
    _cube.receiveShadow = true;
    _scene.add(_cube);
    
    // Gem kuben i listen af kuber
    _cubes.push(_cube);
}


//shine light on cube
_dirLight.target = _cube;
_dirLightHelper.update();


//opsætte GUI

const gui = new GUI();

// //create folder for camera
// const _folderca = gui.addFolder("Camera position");
// _folderca.add(_camera.position,'x',-10,10,.1);
// _folderca.add(_camera.position,'y',-10,10,.1);
// _folderca.add(_camera.position,'z',-10,10,.1);

// const _folderrca = gui.addFolder("Camera rotation");
// _folderrca.add(_camera.rotation,'x', dtr(-180), dtr(180), .01);
// _folderrca.add(_camera.rotation,'y', dtr(-180), dtr(180), .01);
// _folderrca.add(_camera.rotation,'z', dtr(-180), dtr(180), .01);



var _state = -1, _max = 5, _x = -5;
function clicked(e){
    _state++;
    if(_state >= _max) _state = 0;
    console.log("Click", _state);
    _x += 1;
    /*if(_state == 0){
        _shapes.push(buildCube(_x,0,0));
    }
    //fjerne cube igen
    else if(_state == 1) {
        _scene.remove(_shapes[0]);
    }
    else if(_state == 2) {
        _shapes.push(buildSphere(_x,2,-40));
    }
    else if(_state == 3) {
        _shapes.push(buildLine(_x,0,-1));
    }
    else if(_state == 4) {
        _shapes.push(buildPlane(_x,0,-5));
    } */
}

/*function onTick() {
    _state++;
    if(_state >= _max) _state = 0;
    console.log("Tick", _state);
}
//sæt interval hver 1.5 sekund
var _interval = setInterval(onTick, 1500);*/


window.addEventListener("click", clicked);

//init - sætter kameraet tilbage så man kan se scenen
_camera.position.z = 10;
_camera.position.y = 1;
const _controls = new OrbitControls(_camera,_canvasEl);

//degree to radius - omregner til radian
function dtr(d) {
    return d * (Math.PI/180);
}
function randomcolor() {
    var _color = new THREE.Color(0xffffff);
    _color.setHex(Math.random() * 0xffffff);
    return _color;
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
