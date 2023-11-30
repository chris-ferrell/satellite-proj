// Importing necessary dependencies from React and Three.js
import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import tleDatas from "./data";
import * as satellite from "satellite.js";

// Importing shaders for materials
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";
import atmosphereVertexShader from "../shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "../shaders/atmosphereFragment.glsl";

// React component for the Three.js scene
const ThreeJsScene = () => {
    useEffect(() => {
        // Set up Three.js scene, camera, and renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });

        // Set renderer size and pixel ratio, and append it to the DOM
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // Create a sphere with a custom shader material
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

        // Create a star field
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
        });
        const stars = new THREE.Points(starGeometry, starMaterial);

        // Generate random star positions
        const starVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2300;
            const y = (Math.random() - 0.5) * 2300;
            starVertices.push(x, y);
        }
        starGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(starVertices, 3)
        );

        // Create an atmosphere around the sphere
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

        // Set up orbit controls for camera manipulation
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;

        // Define interface for satellite data
        interface Satellite {
            name: string;
            line1: string;
            line2: string;
            mesh: THREE.Mesh;
        }

        // Split TLE data, create Three.js mesh for each satellite, and add them to the scene
        const tleDataStrings = tleDatas.join("\n").split("\n\n");
        const satellites: Satellite[] = tleDataStrings.reduce(
            (acc: Satellite[], tleDataString) => {
                const tleLines = tleDataString
                    .split("\n")
                    .map((line) => line.trim());

                tleLines.forEach((line, index) => {
                    if (index % 3 === 0) {
                        let name = "";
                        let line1 = "";
                        let line2 = "";

                        // Extract satellite name using a regular expression
                        const nameMatch = line.match(/^(\S.*)/);
                        if (nameMatch) {
                            name = nameMatch[1].trim();
                        }

                        // Create a new Three.js mesh for the satellite
                        const satelliteMesh = new THREE.Mesh(
                            new THREE.SphereGeometry(0.01, 50, 50),
                            new THREE.MeshBasicMaterial({ color: 0xff0000 })
                        );

                        // Extract TLE data and add the satellite to the scene
                        [line1, line2] = tleLines
                            .slice(index + 1, index + 3)
                            .map((l) => l.trim());

                        acc.push({ name, line1, line2, mesh: satelliteMesh });
                        scene.add(satelliteMesh);
                    }
                });

                return acc;
            },
            []
        );

        // Add elements to the scene
        scene.add(sphere, stars);

        // Set up camera position
        camera.position.z = 5;

        // Animation function
        const animate = () => {
            requestAnimationFrame(animate);

            // Update controls
            controls.update();

            // Update satellite positions based on TLE data
            satellites.forEach(({ line1, line2, mesh }) => {
                const timestampMS = Date.now();
                const satrec = satellite.twoline2satrec(line1, line2);
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

                const latitude = satellite.degreesLat(
                    geodeticPosition.latitude
                );
                const longitude = satellite.degreesLong(
                    geodeticPosition.longitude
                );

                const la = (90 - latitude) * (Math.PI / 180);
                const ln = (180 + longitude) * (Math.PI / 180);

                const x = -(1.3 * Math.sin(la) * Math.cos(ln));
                const z = 1.3 * Math.sin(la) * Math.sin(ln);
                const y = 1.3 * Math.cos(la);
                mesh.position.set(x, y, z);
            });

            // Render the scene
            renderer.render(scene, camera);
        };

        // Start the animation loop
        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup function to remove event listener and renderer element
        return () => {
            window.removeEventListener("resize", handleResize);
            document.body.removeChild(renderer.domElement);
        };
    }, []); // Empty dependency array to ensure the effect runs only once

    // Return null since this component doesn't render any React elements directly
    return null;
};

export default ThreeJsScene;
