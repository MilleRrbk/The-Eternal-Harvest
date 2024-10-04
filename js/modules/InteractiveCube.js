import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class InteractiveCube{
    constructor(_id, x=0, y=0, z=0, color=0xffffff){
        const geometry = new THREE.BoxGeometry(1,1,1);  
        const _texture = new THREE.TextureLoader().load('/examples/textures/yes.jpg');  
        const material = new THREE.MeshStandardMaterial({map:_texture});//or a MeshBasicMaterial if lights are not needed
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.set(x, y, z);
        this.mesh.userData = this;
        this.id = _id;
        this.bouncing = false;
        this.kicked = false;
        return this;
    }
};
