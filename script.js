// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Utility to pad numbers for filenames (e.g., 001, 002)
const pad = (num, size) => {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
};

// Canvas Setup with Integrated GSAP Timeline for Texts
function initCombinedSequence() {
    const canvasId = "main-canvas";
    const frameCount = 193;
    const triggerSection = "#combined-sequence";

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const context = canvas.getContext("2d");

    canvas.width = 1920;
    canvas.height = 1080;

    const images = [];
    const obj = { frame: 1 };

    // Progressive image preloading to prevent network congestion lag
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        if (i <= 5) {
            // Load first few critical frames immediately
            img.src = `assets/sequence/frame-${pad(i, 3)}.jpg`;
        } else {
            // Defer loading of remaining frames 
            setTimeout(() => {
                img.src = `assets/sequence/frame-${pad(i, 3)}.jpg`;
            }, Math.min(2000, i * 10)); // max 2s delay
        }
        images.push(img);
    }

    images[0].onload = () => {
        // Draw the very first frame to the canvas
        context.drawImage(images[0], 0, 0, canvas.width, canvas.height);
        
        // Now that the canvas is ready, dismiss the preloader
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.transition = 'opacity 0.6s ease-in-out';
            preloader.style.opacity = '0';
            setTimeout(() => { preloader.remove(); }, 600);
        }
    };

    function render() {
        let index = Math.max(0, Math.round(obj.frame) - 1);
        if (images[index] && images[index].complete) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(images[index], 0, 0, canvas.width, canvas.height);
        }
    }

    // Master Timeline for the entire combined sequence
    let tl = gsap.timeline({
        scrollTrigger: {
            scrub: 0.5,
            trigger: triggerSection,
            start: "top top",
            end: "bottom bottom"
        }
    });

    // 1. Animate Canvas frames (0 to total duration 10)
    tl.to(obj, {
        frame: frameCount,
        snap: "frame",
        ease: "none",
        onUpdate: render,
        duration: 10
    }, 0);

    // 2. Fade out Hero text (happens between duration 1 and 2)
    tl.to("#hero-text", { opacity: 0, y: -50, duration: 1 }, 1);

    // 3. Fade in About text (happens between 2.5 and 3.5)
    tl.to("#about-text", { opacity: 1, y: 0, duration: 1 }, 2.5);

    // 4. Fade out About text (happens between 4.5 and 5.5)
    tl.to("#about-text", { opacity: 0, y: -50, duration: 1 }, 4.5);

    // 5. Fade in Fleet text (happens between 6.5 and 7.5)
    tl.to("#fleet-text", { opacity: 1, duration: 1 }, 6.5);
    tl.fromTo(".fly", { y: -50 }, { y: 0, duration: 1 }, 6.5);
    tl.fromTo(".luxury", { y: 50 }, { y: 0, duration: 1 }, 6.5);

    // 6. Fade in Fleet Specs (happens between 8.5 and 9.5)
    tl.to("#fleet-specs", { opacity: 1, y: -20, duration: 1 }, 8.5);
}

// Initialize the combined sequence
initCombinedSequence();

// Extra Animations: Fade in advantages grid on scroll
gsap.from(".advantage-card", {
    scrollTrigger: {
        trigger: ".advantages-grid",
        start: "top 80%"
    },
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2
});

// --- 3D WebGL Globe Implementation for Global Section ---
function initGlobe() {
    const container = document.getElementById("globe-container");
    if (!container || typeof Globe === 'undefined') return;

    // Premium Dark aesthetics resources
    const DARK_EARTH_URL = 'https://unpkg.com/three-globe/example/img/earth-dark.jpg';
    const BUMP_MAP_URL = 'https://unpkg.com/three-globe/example/img/earth-topology.png';

    // City coordinates mapped from original Jesko Jets
    const cities = [
        { name: "SEOUL", lat: 37.5665, lng: 126.9780, size: 0.6, color: "#ffffff" },
        { name: "MELBOURNE", lat: -37.8136, lng: 144.9631, size: 0.6, color: "#ffffff" },
        { name: "TOKYO", lat: 35.6762, lng: 139.6503, size: 0.6, color: "#ffffff" },
        { name: "DUBAI", lat: 25.2048, lng: 55.2708, size: 1.0, color: "#A2C4D9" }, // Headquarters
        { name: "LONDON", lat: 51.5074, lng: -0.1278, size: 0.6, color: "#ffffff" },
        { name: "NEW YORK", lat: 40.7128, lng: -74.0060, size: 0.6, color: "#ffffff" },
        { name: "SINGAPORE", lat: 1.3521, lng: 103.8198, size: 0.6, color: "#ffffff" }
    ];

    // Create flight paths (arcs) radiating from Dubai headquarters
    const dubai = cities.find(c => c.name === "DUBAI");
    const arcData = cities.filter(c => c.name !== "DUBAI").map(city => ({
        startLat: dubai.lat,
        startLng: dubai.lng,
        endLat: city.lat,
        endLng: city.lng,
        color: ['#A2C4D9', 'rgba(255, 255, 255, 0)']
    }));

    // Initialize Globe
    const globe = Globe()
        (container)
        .globeImageUrl(DARK_EARTH_URL)
        .bumpImageUrl(BUMP_MAP_URL)
        .backgroundColor('rgba(0,0,0,0)') // Transparent to allow background text through
        .pointsData(cities)
        .pointAltitude(0.01)
        .pointColor('color')
        .pointRadius('size')
        .arcsData(arcData)
        .arcColor('color')
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(3000)
        .arcAltitudeAutoScale(0.3)
        .arcStroke(0.6)
        // Set up the City Names (Labels) on the globe
        .labelsData(cities)
        .labelLat('lat')
        .labelLng('lng')
        .labelText('name')
        .labelSize(1.5)
        .labelDotRadius(0.5)
        .labelColor('color')
        .labelResolution(2);

    // Initial viewpoint (Center on Dubai)
    let isMobile = window.innerWidth <= 768;
    globe.pointOfView({ lat: 25.2, lng: 55.2, altitude: isMobile ? 3.5 : 2.0 });

    // Globe controls & auto-rotation
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.8;
    globe.controls().enableZoom = false;

    // Connect to GSAP ScrollTrigger to give it parallax scroll-rotation
    gsap.to(globe.scene().rotation, {
        scrollTrigger: {
            trigger: "#global",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5 // Smooth scrubbing
        },
        y: Math.PI * 0.8, // Add substantial scroll-linked rotation
        ease: "power1.inOut"
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        globe.width(container.clientWidth);
        globe.height(container.clientHeight);
        
        const currentIsMobile = window.innerWidth <= 768;
        if (currentIsMobile !== isMobile) {
            isMobile = currentIsMobile;
            globe.pointOfView({ altitude: isMobile ? 3.5 : 2.0 });
        }
    });
}

// Call on load
initGlobe();
