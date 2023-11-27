import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

import atmosphereVertexShader from "../shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "../shaders/atmosphereFragment.glsl";

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
            new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    globeTexture: {
                        value: new THREE.TextureLoader().load("/text.jpeg"),
                    },
                },
            })
        );

        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
        });

        const stars = new THREE.Points(starGeometry, starMaterial);

        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2300;
            const y = (Math.random() - 0.5) * 2300;
            // const z = -Math.random() * 3000;
            starVertices.push(x, y);
        }
        starGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(starVertices, 3)
        );
        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 50, 50),
            new THREE.ShaderMaterial({
                vertexShader: atmosphereVertexShader,
                fragmentShader: atmosphereFragmentShader,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
            })
        );
        atmosphere.scale.set(1.1, 1.1, 1.1);
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.01, 50, 50),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        // an animation loop is required when either damping or auto-rotation are enabled

        const lat = (90 - 38.95863) * (Math.PI / 180);
        const lng = (180 + -77.357002) * (Math.PI / 180);

        const x = -(1 * Math.sin(lat) * Math.cos(lng));
        const z = 1 * Math.sin(lat) * Math.sin(lng);
        const y = 1 * Math.cos(lat);

        mesh.position.set(x, y, z);
        scene.add(sphere, mesh, atmosphere, stars);

        // Set up camera position
        camera.position.z = 5;

        // Animation function
        const animate = () => {
            requestAnimationFrame(animate);

            controls.update();

            // Rotate the sphere
            // if (sphere) {
            //     sphere.rotation.y += 0.01;
            // }

            // Render the scene
            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            // Clean up event listener
            window.removeEventListener("resize", handleResize);

            // Remove renderer element
            document.body.removeChild(renderer.domElement);
        };
    }, []);

    return null;
};

export default ThreeJsScene;
