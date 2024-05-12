function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1}, scene);

    return scene;
}

function startRenderLoop(engine, scene) {
    engine.runRenderLoop(function () {
        scene.render();
    });
}

function handleResize(engine) {
    window.addEventListener("resize", function () {
        engine.resize();
    });
}

