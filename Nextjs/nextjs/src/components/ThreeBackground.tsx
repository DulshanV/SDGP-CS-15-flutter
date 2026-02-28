"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialization
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Clear previous elements if any
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);

        camera.position.z = 5;

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 800;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.03,
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Geometries
        const geometries = [
            new THREE.TorusGeometry(0.7, 0.25, 16, 100),
            new THREE.OctahedronGeometry(0.8),
            new THREE.IcosahedronGeometry(0.6)
        ];

        const shapes: THREE.Mesh[] = [];
        geometries.forEach((geometry, index) => {
            const material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.2,
                wireframe: true
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = (index - 1) * 3;
            mesh.position.z = -3;
            shapes.push(mesh);
            scene.add(mesh);
        });

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0xffffff, 1.5);
        pointLight1.position.set(5, 5, 5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffffff, 1);
        pointLight2.position.set(-5, -5, 5);
        scene.add(pointLight2);

        // Mouse Interaction
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation Loop
        const clock = new THREE.Clock();
        let animationFrameId: number;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            particlesMesh.rotation.y = elapsedTime * 0.05;
            particlesMesh.rotation.x = elapsedTime * 0.02;

            shapes.forEach((shape, index) => {
                shape.rotation.x = elapsedTime * (0.3 + index * 0.1);
                shape.rotation.y = elapsedTime * (0.2 + index * 0.1);
                shape.position.y = Math.sin(elapsedTime + index) * 0.3;
            });

            pointLight1.position.x = Math.sin(elapsedTime * 0.5) * 3;
            pointLight1.position.y = Math.cos(elapsedTime * 0.3) * 3;

            camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        };

        animate();

        // Resize Handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            // Dispose geometries and materials
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            geometries.forEach(g => g.dispose());
            shapes.forEach(s => {
                if (Array.isArray(s.material)) {
                    s.material.forEach(m => m.dispose());
                } else {
                    s.material.dispose();
                }
            });
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed top-0 left-0 w-full h-full z-[1] pointer-events-none"
        />
    );
}
