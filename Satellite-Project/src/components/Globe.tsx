import { useEffect } from "react";
import * as THREE from "three";
import text from "./text.jpeg";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { zoomByDelta } from "ol/interaction/Interaction";

const ThreeJsScene = () => {
    useEffect(() => {
        // Set up scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // Create a sphere
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 50, 50),
            new THREE.MeshBasicMaterial({
                map: new THREE.TextureLoader().load(text),
            })
        );

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 50, 50),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        const controls = new OrbitControls(camera, renderer.domElement);

        const lat = (18.2208 * Math.PI) / 180;
        const lng = (66.5901 * Math.PI) / 180;

        const x = Math.cos(lng) * Math.sin(lat);
        const y = Math.sin(lng) * Math.sin(lat);
        const z = Math.cos(lat);

        mesh.position.set(x, y, z);
        scene.add(sphere, mesh);

        // Set up camera position
        camera.position.z = 5;

        // Animation function
        const animate = () => {
            requestAnimationFrame(animate);

            controls.update();

            // // Rotate the sphere
            // if (sphere) {
            //     sphere.rotation.y += 0.01;
            // }

            // Render the scene
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            document.body.removeChild(renderer.domElement);
        };
    }, []);

    return null;
};

export default ThreeJsScene;
