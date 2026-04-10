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

    // Dynamic internal resolution for performance optimization
    const isMobile = window.innerWidth <= 768;
    canvas.width = isMobile ? 1280 : 1920; // Lower internal resolution on mobile for speed
    canvas.height = isMobile ? 720 : 1080;

    const images = [];
    const obj = { frame: 1 };
    let lastRenderedFrame = -1;

    // Responsive Image Loading logic
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        images.push(img);
        
        // Priority loading for first frame
        if (i === 1) {
            img.src = `assets/sequence/frame-${pad(i, 3)}.jpg`;
            img.onload = () => {
                render(); // Render immediately when first frame is ready
                
                // Dismiss preloader
                const preloader = document.getElementById('preloader');
                if (preloader) {
                    preloader.style.transition = 'opacity 0.6s ease-in-out';
                    preloader.style.opacity = '0';
                    setTimeout(() => { preloader.remove(); }, 600);
                }
            };
        } else {
            // Staggered loading to prevent mobile network congestion
            // Loads images in batches to ensure smooth scroll even during load
            setTimeout(() => {
                img.src = `assets/sequence/frame-${pad(i, 3)}.jpg`;
            }, i * (isMobile ? 15 : 5)); 
        }
    }

    // High-performance Render function with "Object-Fit: Cover" math
    function render() {
        const frameIndex = Math.max(0, Math.round(obj.frame) - 1);
        if (frameIndex === lastRenderedFrame) return; // Skip if same frame
        
        const img = images[frameIndex];
        if (img && img.complete) {
            // Calculate cover sizing (ensures image fills screen without stretching)
            const imgRatio = 1920 / 1080; // Hardcoded based on source aspect ratio
            const canvasRatio = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > canvasRatio) {
                drawHeight = canvas.height;
                drawWidth = canvas.height * imgRatio;
            } else {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgRatio;
            }

            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = (canvas.height - drawHeight) / 2;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            lastRenderedFrame = frameIndex;
        }
    }

    // GSAP ScrollTrigger Configuration
    let tl = gsap.timeline({
        scrollTrigger: {
            scrub: isMobile ? 0.3 : 0.5, // Faster scrub on mobile for "snappier" feel
            trigger: triggerSection,
            start: "top top",
            end: "bottom bottom"
        }
    });

    // 1. Animate Canvas frames
    tl.to(obj, {
        frame: frameCount,
        snap: "frame",
        ease: "none",
        onUpdate: render,
        duration: 10
    }, 0);

    // 2. Text Overlays (Fade logic)
    tl.to("#hero-text", { opacity: 0, y: isMobile ? -30 : -50, duration: 1 }, 1);
    tl.to("#about-text", { opacity: 1, y: 0, duration: 1 }, 2.5);
    tl.to("#about-text", { opacity: 0, y: isMobile ? -30 : -50, duration: 1 }, 4.5);
    tl.to("#fleet-text", { opacity: 1, duration: 1 }, 6.5);
    tl.fromTo(".fly", { y: -50 }, { y: 0, duration: 1 }, 6.5);
    tl.fromTo(".luxury", { y: 50 }, { y: 0, duration: 1 }, 6.5);
    tl.to("#fleet-specs", { opacity: 1, y: -20, duration: 1 }, 8.5);

    // Handle Window Resize for resolution adjustment
    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== (canvas.width <= 1280)) {
            canvas.width = newIsMobile ? 1280 : 1920;
            canvas.height = newIsMobile ? 720 : 1080;
            render();
        }
    });
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
