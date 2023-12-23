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

        // Create a star field
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
        });
        const stars = new THREE.Points(starGeometry, starMaterial);
        const earth = new THREE.Mesh(
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
        // Create a class for Satellite
        class SatelliteObject {
            name: string;
            line1: string;
            line2: string;
            mesh: THREE.InstancedMesh;

            constructor(name: string, line1: string, line2: string) {
                this.name = name;
                this.line1 = line1;
                this.line2 = line2;

                // Create a new Three.js instanced mesh for the satellite
                const geometry = new THREE.SphereGeometry(0.01, 50, 50);
                const material = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                });
                this.mesh = new THREE.InstancedMesh(geometry, material, 1);
            }

            updatePosition() {
                const timestampMS = Date.now();
                const satrec = satellite.twoline2satrec(this.line1, this.line2);
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

                // Set the position for the instanced mesh
                const matrix = new THREE.Matrix4();
                matrix.setPosition(new THREE.Vector3(x, y, z));
                this.mesh.setMatrixAt(0, matrix);
                this.mesh.instanceMatrix.needsUpdate = true;
            }
        }

        // Split TLE data and create Satellite objects
        const tleDataStrings = tleDatas.join("\n").split("\n");

        const satellites: SatelliteObject[] = [];

        let currentSatellite: SatelliteObject | null = null;

        tleDataStrings.forEach((line) => {
            const trimmedLine = line.trim();

            // Skip empty lines
            if (!trimmedLine) {
                return;
            }

            // If it starts with a non-numeric character, consider it as a new satellite name
            if (isNaN(parseInt(trimmedLine[0], 10))) {
                if (currentSatellite) {
                    satellites.push(currentSatellite);
                }

                currentSatellite = new SatelliteObject(trimmedLine, "", "");
            } else if (currentSatellite) {
                // Append line to current satellite's data
                if (currentSatellite.line1 === "") {
                    currentSatellite.line1 = trimmedLine;
                } else {
                    currentSatellite.line2 = trimmedLine;
                }
            }
        });

        // Add the last satellite to the array
        if (currentSatellite) {
            satellites.push(currentSatellite);
        }

        // Add satellites to the scene
        satellites.forEach((satellite) => {
            scene.add(satellite.mesh);
        });

        console.log("Satellites:", satellites);

        // ... (existing code)

        // Add elements to the scene
        scene.add(earth, stars, atmosphere);

        // Set up camera position
        camera.position.z = 5;

        // Animation function
        const animate = () => {
            requestAnimationFrame(animate);

            // Update controls
            controls.update();

            // Update satellite positions based on TLE data
            satellites.forEach((satellite) => {
                satellite.updatePosition();
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
