import { useEffect } from "react";
import * as THREE from "three";
import text from "./text.jpeg";
import { OrbitControls } from "three/examples/jsm/Addons.js";

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
            new THREE.SphereGeometry(0.03, 50, 50),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        const controls = new OrbitControls(camera, renderer.domElement);

        // const lat = (18.2208 * Math.PI) / 180;
        // const lng = (66.5901 * Math.PI) / 180;

        const lat = (90 - 18.220833) * (Math.PI / 180);
        const lng = (180 + -66.590149) * (Math.PI / 180);

        const x = -(1 * Math.sin(lat) * Math.cos(lng));
        const z = 1 * Math.sin(lat) * Math.sin(lng);
        const y = 1 * Math.cos(lat);

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
