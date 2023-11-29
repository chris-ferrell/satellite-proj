import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
// import { getLatLngObj } from "tle.js";
import * as satellite from "satellite.js";
import tleDatas from "./data";

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
            new THREE.SphereGeometry(0.05, 50, 50),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;

        // const la = (90 - lat) * (Math.PI / 180);
        // const ln = (180 + lng) * (Math.PI / 180);

        // const x = -(1 * Math.sin(la) * Math.cos(ln));
        // const z = 1 * Math.sin(la) * Math.sin(ln);
        // const y = 1 * Math.cos(la);

        scene.add(sphere, mesh, atmosphere, stars);

        // Set up camera position
        camera.position.z = 5;

        // Animation function
        const animate = () => {
            requestAnimationFrame(animate);

            controls.update();

            const timestampMS = Date.now();

            const tleLines = tle1.split("\n").map((line) => line.trim());
            const satrec = satellite.twoline2satrec(tleLines[1], tleLines[2]);

            const date = new Date(timestampMS);

            const positionAndVelocity = satellite.propagate(
                satrec,
                date
            ).position;
            if (typeof positionAndVelocity === "boolean") {
                // Handle error, if any
                return;
            }

            const gmst = satellite.gstime(date);
            const geodeticPosition = satellite.eciToGeodetic(
                positionAndVelocity,
                gmst
            );

            const latitude = satellite.degreesLat(geodeticPosition.latitude);
            const longitude = satellite.degreesLong(geodeticPosition.longitude);

            // console.log("Latitude:", latitude);
            // console.log("Longitude:", longitude);

            const la = (90 - latitude) * (Math.PI / 180);
            const ln = (180 + longitude) * (Math.PI / 180);

            const x = -(1 * Math.sin(la) * Math.cos(ln));
            const z = 1 * Math.sin(la) * Math.sin(ln);
            const y = 1 * Math.cos(la) + 0.2;
            mesh.position.set(x, y, z);

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
