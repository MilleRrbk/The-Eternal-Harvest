class Model {
    constructor(loaderPath, modelFile, scene) {
        this.loader = new THREE.ColladaLoader().setPath(loaderPath);
        this.modelFile = modelFile;
        this.scene = scene;
        this._3dmodel = null;
    }

    loadModel(callback) {
        this.loader.load(this.modelFile, (collada) => {
            this._3dmodel = collada.scene;
            this._3dmodel.scale.set(1, 1, 1);
            if (callback) callback();
        });
    }

    placeInstances(count, range) {
        if (!this._3dmodel) {
            console.error('Model not loaded yet!');
            return;
        }

        for (let i = 0; i < count; i++) {
            const instance = this._3dmodel.clone();
            const randomX = (Math.random() - 0.5) * range;
            const randomY = (Math.random() - 0.5) * range;
            const randomZ = (Math.random() - 0.5) * range;

            instance.position.set(randomX, randomY, randomZ);
            instance.rotation.z = THREE.MathUtils.degToRad(180);
            this.scene.add(instance);
        }
    }
}
