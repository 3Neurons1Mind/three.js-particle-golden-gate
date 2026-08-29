import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

// ==========================================
// 1. SCENE, CAMERA & RENDERER SETUP
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02040a, 0.0075);

function getAspect() {
    return window.innerWidth / window.innerHeight;
}

function getResponsiveZ(landscapeZ, portraitRatioFactor = 1.78) {
    const aspect = getAspect();
    if (aspect >= 1.4) return landscapeZ;
    // Linear scaling tailored for 9:16 portrait (aspect = 0.5625)
    const t = Math.max(0, Math.min(1.0, (1.4 - aspect) / (1.4 - 0.5625)));
    return landscapeZ * (1.0 + (portraitRatioFactor - 1.0) * t);
}

function getResponsiveY(landscapeY, portraitOffset = 2.2) {
    const aspect = getAspect();
    if (aspect >= 1.4) return landscapeY;
    const t = Math.max(0, Math.min(1.0, (1.4 - aspect) / (1.4 - 0.5625)));
    return landscapeY + portraitOffset * t;
}

const camera = new THREE.PerspectiveCamera(45, getAspect(), 0.1, 1400);

// Camera target vector for smooth lookAt transitions
const cameraLookAt = new THREE.Vector3(0, 2.0, 0);
const targetLookAt = new THREE.Vector3(0, 2.0, 0);

// Initial Camera Framing tuned for 9:16 vertical ratio and 16:9 landscape
camera.position.set(0, getResponsiveY(3.5, 2.2), getResponsiveZ(42, 1.78));

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false, powerPreference: 'high-performance' });
} catch (e) {
    try {
        renderer = new THREE.WebGLRenderer({ antialias: false });
    } catch (e2) {
        document.body.innerHTML = '<div style="color:white;text-align:center;padding:50px;"><h2>WebGL not supported</h2><p>Please enable Hardware Acceleration.</p></div>';
        throw e2;
    }
}
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x02040a);
document.body.appendChild(renderer.domElement);

// ==========================================
// 2. SOFT ETHEREAL POST-PROCESSING (REFINED BLOOM)
// ==========================================
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Tuned bloom for crisp steel filaments, glowing traffic & aviation beacons
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.24, // Subtle elegant bloom strength
    0.42, // Bloom radius
    0.22  // Threshold
);
composer.addPass(bloomPass);

// ==========================================
// 3. COLOR PALETTES (SAN FRANCISCO INTERNATIONAL ORANGE & USA)
// ==========================================
// Signature International Orange Architectural Palette
const COLOR_ORANGE_PRIMARY   = new THREE.Color(0xF03A17); // Iconic Golden Gate International Orange
const COLOR_ORANGE_HIGHLIGHT = new THREE.Color(0xFF6B3D); // Sunlit / illuminated outer chords
const COLOR_ORANGE_DEEP      = new THREE.Color(0xB3260E); // Deep shadow truss chords
const COLOR_STEEL_RIVET      = new THREE.Color(0xFFB300); // Golden steel rivet nodes & floodlights
const COLOR_MAIN_CABLE       = new THREE.Color(0xFF5722); // 36-inch Main suspension cables
const COLOR_SUSPENDER_WIRE   = new THREE.Color(0xFFA07A); // Vertical suspender wire ropes
const COLOR_CONCRETE_PIER    = new THREE.Color(0x455A64); // Marin & SF Anchorage & Pier Caissons
const COLOR_ROADWAY_ASPHALT  = new THREE.Color(0x263238); // 6-Lane highway road deck
const COLOR_STREET_LAMP      = new THREE.Color(0xFFE082); // Art Deco warm roadway luminaires
const COLOR_CAR_HEADLIGHT    = new THREE.Color(0xFFFAF0); // Moving Northbound car headlights
const COLOR_CAR_TAILLIGHT    = new THREE.Color(0xFF1744); // Moving Southbound car taillights
const COLOR_AERO_BEACON      = new THREE.Color(0xFF0033); // Flashing red tower summit strobes
const COLOR_SPARKLE_WHITE    = new THREE.Color(0xFFFFFF); // Scintillation diamond sparkle

// USA 4th of July Patriotic Palette (Stars & Stripes)
const COLOR_USA_RED          = new THREE.Color(0xD92638);
const COLOR_USA_WHITE        = new THREE.Color(0xF5F7FA);
const COLOR_USA_BLUE         = new THREE.Color(0x1B458F);
const COLOR_USA_GOLD         = new THREE.Color(0xFFD700);

// San Francisco Bay Marine Landscape & Fog
const COLOR_WATER_DEEP       = new THREE.Color(0x02111E); // Pacific Ocean deep waters
const COLOR_WATER_TEAL       = new THREE.Color(0x063148); // Ocean swells & crests
const COLOR_WATER_REFLECT    = new THREE.Color(0xBA552A); // Orange reflections on water ripples
const COLOR_FOG_SILVER       = new THREE.Color(0x78909C); // "Karl the Fog" marine layer
const COLOR_FOG_WHITE        = new THREE.Color(0xB0BEC5); // Bright misty fog crests
const COLOR_HEADLANDS_GREEN  = new THREE.Color(0x1B3022); // Marin Headlands coastal flora
const COLOR_HEADLANDS_CLIFF  = new THREE.Color(0x2E2822); // Rugged Pacific rock cliffs
const COLOR_FORT_POINT_BRICK = new THREE.Color(0x6D4C41); // Historic Fort Point brick arches
const COLOR_SHIP_HULL        = new THREE.Color(0x1E293B); // Container ship hull
const COLOR_SHIP_LIGHT       = new THREE.Color(0x00E5FF); // Ship navigation mast light

// ==========================================
// 4. PARTICLE SIMULATION SETUP (200,000 Particles)
// ==========================================
const particleCount = 200000;

const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const targets = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const colorsUSA = new Float32Array(particleCount * 3);
const randoms = new Float32Array(particleCount * 2);
const typeAttr = new Float32Array(particleCount);

// Geometric Landmarks
const TOWER_SOUTH_X = -13.0; // South Tower (San Francisco side)
const TOWER_NORTH_X =  13.0; // North Tower (Marin Headlands side)
const DECK_Y = -2.2;         // Roadway Deck Height
const WATER_Y = -7.0;        // Ocean Surface Level
const TOWER_TOP_Y = 15.5;    // Tower Summit Spire Height
const SADDLE_Y = 14.8;       // Cable Saddle Height atop towers
const CABLE_SAG_Y = -1.6;    // Main cable lowest point at center span (x=0)
const CABLE_Z_OFFSET = 2.1;  // Dual cable offset (+Z and -Z)
const ANCHOR_SOUTH_X = -31.5;// SF Anchorage
const ANCHOR_NORTH_X =  31.5;// Marin Anchorage
const ANCHOR_Y = -2.5;       // Cable anchor deck connection height

// Parametric Main Cable Parabola function
function getMainCableY(x) {
    if (x >= TOWER_SOUTH_X && x <= TOWER_NORTH_X) {
        // Main Center Span (x between -13 and +13)
        const norm = x / TOWER_NORTH_X; // -1 to 1
        return CABLE_SAG_Y + (SADDLE_Y - CABLE_SAG_Y) * (norm * norm);
    } else if (x < TOWER_SOUTH_X) {
        // South Side Span (x from -31.5 to -13.0)
        const t = (x - ANCHOR_SOUTH_X) / (TOWER_SOUTH_X - ANCHOR_SOUTH_X); // 0 at anchor, 1 at tower
        // Graceful suspension curve
        return ANCHOR_Y + (SADDLE_Y - ANCHOR_Y) * Math.pow(t, 1.45);
    } else {
        // North Side Span (x from +13.0 to +31.5)
        const t = (ANCHOR_NORTH_X - x) / (ANCHOR_NORTH_X - TOWER_NORTH_X); // 1 at tower, 0 at anchor
        return ANCHOR_Y + (SADDLE_Y - ANCHOR_Y) * Math.pow(t, 1.45);
    }
}

// Parametric Deck Crown (slight vertical arch)
function getDeckY(x) {
    const norm = Math.max(-1.0, Math.min(1.0, x / 28.0));
    return DECK_Y + 0.35 * (1.0 - norm * norm);
}

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const i2 = i * 2;

    // Initial celestial rain formation coordinates
    positions[i3]     = (Math.random() - 0.5) * 80;
    positions[i3 + 1] = Math.random() * 55 + 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 45;

    let tx = 0, ty = 0, tz = 0;
    let tColor = COLOR_ORANGE_PRIMARY;
    let usaColor = COLOR_USA_WHITE;
    let pType = 0.0; // 0: Structure, 1: Traffic, 2: Sparkle, 3: Water, 4: Fog, 5: Aero Beacon, 6: Ambient

    // --- PARTITION 1: TWO ART DECO TOWERS & FOUNDATION CAISSONS (0 to 65,000) ---
    if (i < 65000) {
        const isSouthTower = (i % 2 === 0);
        const towerX = isSouthTower ? TOWER_SOUTH_X : TOWER_NORTH_X;
        const sub = Math.floor(i / 2);

        // Sub-distribution within each Tower:
        if (sub < 4500) {
            // --- 1A. MASSIVE CONCRETE FOUNDATION PIER CAISSON (Water Level y = -7.5 to y = -2.2) ---
            const h = Math.random();
            ty = -7.5 + h * 5.3;
            const caissonW = 4.2 + (1.0 - h) * 0.8;
            const caissonL = 7.4 + (1.0 - h) * 1.2;

            const isRim = Math.random() < 0.35;
            if (isRim) {
                const side = Math.floor(Math.random() * 4);
                const u = (Math.random() - 0.5) * 2.0;
                if (side === 0) { tx = towerX + u * (caissonW * 0.5); tz = caissonL * 0.5; }
                else if (side === 1) { tx = towerX + u * (caissonW * 0.5); tz = -caissonL * 0.5; }
                else if (side === 2) { tx = towerX + caissonW * 0.5; tz = u * (caissonL * 0.5); }
                else { tx = towerX - caissonW * 0.5; tz = u * (caissonL * 0.5); }
            } else {
                tx = towerX + (Math.random() - 0.5) * caissonW;
                tz = (Math.random() - 0.5) * caissonL;
            }
            tColor = COLOR_CONCRETE_PIER;

        } else if (sub < 22000) {
            // --- 1B. TWO ART DECO STEPPED TOWER LEGS (Shafts at z = -2.1 and z = +2.1) ---
            const legSide = Math.random() > 0.5 ? 1 : -1;
            const legCenterZ = legSide * CABLE_Z_OFFSET;

            // Height from deck y = -2.2 to tower crown y = +15.5
            const h = Math.random(); // 0 to 1
            ty = -2.2 + h * 17.7;

            // Art Deco 4-Tier Stepped Setbacks
            // Tier 1: -2.2 to 3.0, Tier 2: 3.0 to 7.5, Tier 3: 7.5 to 11.5, Tier 4: 11.5 to 15.0
            let legW = 1.4; // Width along X
            let legD = 1.6; // Depth along Z
            if (ty > 11.5) {
                legW = 0.95; legD = 1.1;
            } else if (ty > 7.5) {
                legW = 1.10; legD = 1.25;
            } else if (ty > 3.0) {
                legW = 1.25; legD = 1.42;
            }

            const memberChoice = Math.random();
            if (memberChoice < 0.45) {
                // 4 Main Vertical Corner Chords & Fluting Ribs
                const corner = Math.floor(Math.random() * 4);
                const ox = (corner % 2 === 0 ? -1 : 1) * (legW * 0.5) + (Math.random() - 0.5) * 0.05;
                const oz = (corner < 2 ? -1 : 1) * (legD * 0.5) + (Math.random() - 0.5) * 0.05;
                tx = towerX + ox;
                tz = legCenterZ + oz;
                tColor = COLOR_ORANGE_HIGHLIGHT;
                if (Math.random() < 0.10) pType = 2.0; // Rivet Sparkle

            } else if (memberChoice < 0.80) {
                // Cellular Fluting Vertical Lines (Art Deco Vertical Steel Cells)
                const face = Math.floor(Math.random() * 4);
                const cellIdx = (Math.floor(Math.random() * 5) - 2) * 0.22;
                if (face === 0) { tx = towerX + cellIdx * legW; tz = legCenterZ + legD * 0.5; }
                else if (face === 1) { tx = towerX + cellIdx * legW; tz = legCenterZ - legD * 0.5; }
                else if (face === 2) { tx = towerX + legW * 0.5; tz = legCenterZ + cellIdx * legD; }
                else { tx = towerX - legW * 0.5; tz = legCenterZ + cellIdx * legD; }
                tColor = (Math.random() > 0.3) ? COLOR_ORANGE_PRIMARY : COLOR_STEEL_RIVET;

            } else {
                // Horizontal Internal Tie Plates & Rivet Bands
                const numTiers = 24;
                const tierIdx = Math.floor(h * numTiers);
                ty = -2.2 + (tierIdx / numTiers) * 17.7 + (Math.random() - 0.5) * 0.05;
                tx = towerX + (Math.random() - 0.5) * legW;
                tz = legCenterZ + (Math.random() - 0.5) * legD;
                tColor = COLOR_ORANGE_DEEP;
            }

        } else if (sub < 29000) {
            // --- 1C. 4 ART DECO PORTAL STRUTS & CHEVRON ARCHES (Horizontal Cross Braces between Legs) ---
            // 4 Portal Strut Tiers between z = -2.1 and z = +2.1
            const strutTier = Math.floor(Math.random() * 4);
            let strutBaseY = 1.0;
            let strutH = 1.8;
            if (strutTier === 0) { strutBaseY = 0.8; strutH = 2.0; }
            else if (strutTier === 1) { strutBaseY = 5.2; strutH = 2.0; }
            else if (strutTier === 2) { strutBaseY = 9.2; strutH = 2.0; }
            else { strutBaseY = 13.0; strutH = 1.8; }

            const u = (Math.random() - 0.5) * 2.0; // -1 to 1 across bridge width Z
            tz = u * (CABLE_Z_OFFSET * 0.95);
            tx = towerX + (Math.random() - 0.5) * 0.85;

            // Art Deco Stepped Chevron Profile
            const stepArch = Math.pow(Math.abs(u), 0.7) * 0.55;
            const subH = Math.random();
            ty = strutBaseY + subH * strutH - (subH < 0.25 ? stepArch : 0.0);

            const isChevronRib = Math.random() < 0.35;
            tColor = isChevronRib ? COLOR_STEEL_RIVET : COLOR_ORANGE_PRIMARY;
            if (Math.random() < 0.08) pType = 2.0;

        } else {
            // --- 1D. TOWER SUMMIT ART DECO FINIALS, SADDLE HOUSINGS & RED AVIATION STROBES (y = 14.8 to 16.5) ---
            const legSide = Math.random() > 0.5 ? 1 : -1;
            const legCenterZ = legSide * CABLE_Z_OFFSET;
            const h = Math.random();

            if (h < 0.65) {
                // Saddle Housing & Decorative Stepped Finials
                ty = SADDLE_Y + h * 1.5;
                const finialW = (1.0 - h * 0.5) * 0.75;
                const finialD = (1.0 - h * 0.5) * 0.9;
                tx = towerX + (Math.random() - 0.5) * finialW;
                tz = legCenterZ + (Math.random() - 0.5) * finialD;
                tColor = COLOR_ORANGE_HIGHLIGHT;
            } else {
                // Pulsing Red Aeronautical Beacon at top of both towers
                pType = 5.0; // Aviation Strobe
                ty = 15.6 + (Math.random() - 0.5) * 0.3;
                tx = towerX + (Math.random() - 0.5) * 0.15;
                tz = legCenterZ + (Math.random() - 0.5) * 0.15;
                tColor = COLOR_AERO_BEACON;
            }
        }

    // --- PARTITION 2: MAIN SUSPENSION CABLES & VERTICAL SUSPENDER ROPES (65,000 to 110,000) ---
    } else if (i < 110000) {
        const sub = i - 65000;
        const cableSide = Math.random() > 0.5 ? 1 : -1;
        const cableZ = cableSide * CABLE_Z_OFFSET;

        if (sub < 27000) {
            // --- 2A. TWO MASSIVE 36-INCH MAIN SUSPENSION CABLES (x = -31.5 to +31.5) ---
            // Dense cluster along continuous catenary / parabola
            const xProgress = Math.random(); // 0 to 1 across full bridge span
            tx = ANCHOR_SOUTH_X + xProgress * (ANCHOR_NORTH_X - ANCHOR_SOUTH_X);
            const coreY = getMainCableY(tx);

            // Circular cable strand cross-section bundle (radius ~0.14)
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * 0.15;
            ty = coreY + Math.sin(angle) * radius;
            tz = cableZ + Math.cos(angle) * radius;

            // Cable bands / clamps every 1.5 units
            const isCableBand = (Math.abs(tx) % 1.2 < 0.12);
            tColor = isCableBand ? COLOR_STEEL_RIVET : COLOR_MAIN_CABLE;
            if (Math.random() < 0.12) pType = 2.0; // Sparkle gleam

        } else {
            // --- 2B. HUNDREDS OF VERTICAL SUSPENDER WIRE ROPES (Connecting Cables to Road Deck) ---
            // Spaced every 0.65 units along roadway span
            const numRopes = 84;
            const ropeIdx = Math.floor(Math.random() * numRopes);
            const ropeX = ANCHOR_SOUTH_X + 1.5 + (ropeIdx / numRopes) * (ANCHOR_NORTH_X - ANCHOR_SOUTH_X - 3.0);
            
            // Exclude inside tower core
            if (Math.abs(ropeX - TOWER_SOUTH_X) > 0.9 && Math.abs(ropeX - TOWER_NORTH_X) > 0.9) {
                const topY = getMainCableY(ropeX);
                const bottomY = getDeckY(ropeX);

                if (topY > bottomY + 0.2) {
                    const t = Math.random(); // Interpolate along vertical wire
                    ty = bottomY + t * (topY - bottomY);
                    tx = ropeX + (Math.random() - 0.5) * 0.03;
                    tz = cableZ + (Math.random() - 0.5) * 0.03;
                    tColor = COLOR_SUSPENDER_WIRE;
                } else {
                    // Fallback to deck
                    tx = ropeX;
                    ty = bottomY;
                    tz = cableZ;
                    tColor = COLOR_ORANGE_PRIMARY;
                }
            } else {
                // Near tower base
                tx = ropeX;
                ty = getDeckY(ropeX);
                tz = cableZ;
                tColor = COLOR_ORANGE_PRIMARY;
            }
        }

    // --- PARTITION 3: STIFFENING TRUSS, 6-LANE ROAD DECK & ART DECO STREET LAMPS (110,000 to 148,000) ---
    } else if (i < 148000) {
        const sub = i - 110000;
        const xProgress = Math.random();
        const roadX = ANCHOR_SOUTH_X + xProgress * (ANCHOR_NORTH_X - ANCHOR_SOUTH_X);
        const deckBaseY = getDeckY(roadX);

        if (sub < 20000) {
            // --- 3A. DEEP STIFFENING WARREN TRUSS (Underneath the roadway, y = deckBaseY - 2.0 to deckBaseY) ---
            const trussSide = Math.random() > 0.5 ? 1 : -1;
            const trussZ = trussSide * CABLE_Z_OFFSET;
            const trussH = 1.9; // 25-foot deep real truss
            const trussBottomY = deckBaseY - trussH;

            const memberType = Math.random();
            if (memberType < 0.35) {
                // Top Chord (at deck) or Bottom Chord
                const isTop = Math.random() > 0.5;
                ty = (isTop ? deckBaseY : trussBottomY) + (Math.random() - 0.5) * 0.06;
                tx = roadX;
                tz = trussZ + (Math.random() - 0.5) * 0.06;
                tColor = COLOR_ORANGE_HIGHLIGHT;

            } else if (memberType < 0.75) {
                // Diagonal Warren Cross Trusses (Triangular X-braces along sides)
                const panelWidth = 1.2;
                const panelIdx = Math.floor(roadX / panelWidth);
                const pX0 = panelIdx * panelWidth;
                const pX1 = (panelIdx + 1) * panelWidth;
                const diagDir = Math.random() > 0.5 ? 1 : -1;
                const t = Math.random();

                tx = pX0 + t * (pX1 - pX0);
                ty = diagDir > 0 ? (trussBottomY + t * trussH) : (deckBaseY - t * trussH);
                tz = trussZ + (Math.random() - 0.5) * 0.04;
                tColor = COLOR_ORANGE_PRIMARY;

            } else {
                // Bottom Floor Lateral Wind Bracing (Underneath Roadway)
                const u = (Math.random() - 0.5) * 2.0;
                tx = roadX;
                ty = trussBottomY + (Math.random() - 0.5) * 0.08;
                tz = u * (CABLE_Z_OFFSET * 0.95);
                tColor = COLOR_ORANGE_DEEP;
            }

        } else if (sub < 33000) {
            // --- 3B. 6-LANE ROADWAY DECK SURFACE & SIDEWALK RAILINGS ---
            const isSidewalk = Math.random() < 0.25;
            if (isSidewalk) {
                // Art Deco Pedestrian Sidewalk Railing on Outer Rim
                const side = Math.random() > 0.5 ? 1 : -1;
                tz = side * (CABLE_Z_OFFSET - 0.15) + (Math.random() - 0.5) * 0.08;
                ty = deckBaseY + Math.random() * 0.5; // Railing height
                tx = roadX;
                tColor = COLOR_ORANGE_HIGHLIGHT;
            } else {
                // 6-Lane Asphalt Highway
                const u = (Math.random() - 0.5) * 2.0;
                tz = u * (CABLE_Z_OFFSET * 0.75);
                ty = deckBaseY + (Math.random() - 0.5) * 0.04;
                tx = roadX;

                // Center yellow divider line vs asphalt lanes
                const isCenterLine = Math.abs(tz) < 0.08;
                tColor = isCenterLine ? COLOR_STEEL_RIVET : COLOR_ROADWAY_ASPHALT;
            }

        } else {
            // --- 3C. ART DECO ROADWAY STREET LUMINAIRES (Glowing Amber Lamp Posts) ---
            const lampSide = Math.random() > 0.5 ? 1 : -1;
            const lampZ = lampSide * (CABLE_Z_OFFSET - 0.1);
            const lampSpacing = 2.0;
            const lampIdx = Math.floor(roadX / lampSpacing);
            const lX = lampIdx * lampSpacing;

            const h = Math.random();
            tx = lX + (Math.random() - 0.5) * 0.04;
            tz = lampZ + (Math.random() - 0.5) * 0.04;
            ty = deckBaseY + h * 0.75;

            if (h > 0.75) {
                tColor = COLOR_STREET_LAMP;
                if (Math.random() < 0.25) pType = 2.0; // Glow
            } else {
                tColor = COLOR_ORANGE_DEEP;
            }
        }

    // --- PARTITION 4: DYNAMIC FLOWING HIGHWAY TRAFFIC (148,000 to 160,000) ---
    } else if (i < 160000) {
        // Type 1.0: Moving Vehicles (Headlights flowing Northbound, Taillights flowing Southbound)
        pType = 1.0;
        const isNorthbound = Math.random() > 0.5;
        const roadX = ANCHOR_SOUTH_X + Math.random() * (ANCHOR_NORTH_X - ANCHOR_SOUTH_X);
        const deckBaseY = getDeckY(roadX);

        if (isNorthbound) {
            // Northbound (+X direction) Lanes: z between -1.5 and -0.25
            const lane = Math.floor(Math.random() * 3);
            const laneZ = -1.35 + lane * 0.45 + (Math.random() - 0.5) * 0.12;
            tx = roadX;
            ty = deckBaseY + 0.15 + (Math.random() - 0.5) * 0.06;
            tz = laneZ;
            tColor = COLOR_CAR_HEADLIGHT;
        } else {
            // Southbound (-X direction) Lanes: z between +0.25 and +1.5
            const lane = Math.floor(Math.random() * 3);
            const laneZ = 0.45 + lane * 0.45 + (Math.random() - 0.5) * 0.12;
            tx = roadX;
            ty = deckBaseY + 0.15 + (Math.random() - 0.5) * 0.06;
            tz = laneZ;
            tColor = COLOR_CAR_TAILLIGHT;
        }

    // --- PARTITION 5: SAN FRANCISCO BAY & PACIFIC OCEAN WATER (160,000 to 178,000) ---
    } else if (i < 178000) {
        // Type 3.0: Animated Pacific Ocean waves with shimmering orange reflection
        pType = 3.0;
        tx = (Math.random() - 0.5) * 72.0;
        tz = (Math.random() - 0.5) * 36.0;
        ty = WATER_Y + (Math.random() - 0.5) * 0.22;

        // Bridge reflection corridor near center
        const distFromBridge = Math.abs(tz);
        if (distFromBridge < 4.5 && Math.abs(tx) < 28.0 && Math.random() > 0.45) {
            tColor = COLOR_WATER_REFLECT;
        } else if (Math.random() > 0.60) {
            tColor = COLOR_WATER_TEAL;
        } else {
            tColor = COLOR_WATER_DEEP;
        }

    // --- PARTITION 6: ROLLING SAN FRANCISCO MARINE FOG ("KARL THE FOG") (178,000 to 190,000) ---
    } else if (i < 190000) {
        // Type 4.0: Gentle billowing marine fog flowing through the Golden Gate Strait
        pType = 4.0;
        tx = (Math.random() - 0.5) * 68.0;
        tz = (Math.random() - 0.5) * 34.0;
        // Fog layer hugging water and lower towers (y = -6.0 to +3.5)
        ty = -5.8 + Math.random() * 8.5;

        tColor = (Math.random() > 0.4) ? COLOR_FOG_SILVER : COLOR_FOG_WHITE;

    // --- PARTITION 7: MARIN HEADLANDS, FORT POINT & PASSING SHIP (190,000 to 196,000) ---
    } else if (i < 196000) {
        const sub = i - 190000;
        if (sub < 2800) {
            // Marin Headlands Cliffs (North Side x > 28)
            const u = Math.random();
            tx = 26.0 + u * 12.0;
            tz = (Math.random() - 0.5) * 32.0;
            const hillHeight = Math.pow(u, 0.8) * 9.5;
            ty = WATER_Y + Math.random() * hillHeight;
            tColor = (Math.random() > 0.4) ? COLOR_HEADLANDS_GREEN : COLOR_HEADLANDS_CLIFF;

        } else if (sub < 5000) {
            // Fort Point Historic Brick Fortification (South Side x < -26)
            const u = Math.random();
            tx = -26.0 - u * 10.0;
            tz = (Math.random() - 0.5) * 26.0;
            ty = WATER_Y + Math.random() * 4.5;
            tColor = COLOR_FORT_POINT_BRICK;

        } else {
            // Cargo Container Ship cruising under bridge center span (x ~ 0, z ~ 12)
            const shipProg = Math.random();
            tx = -3.5 + shipProg * 7.0;
            tz = 10.0 + (Math.random() - 0.5) * 2.2;
            const h = Math.random();
            ty = WATER_Y + 0.3 + h * 2.2;

            if (h > 0.85) {
                tColor = COLOR_SHIP_LIGHT;
                pType = 2.0; // Glow
            } else {
                tColor = COLOR_SHIP_HULL;
            }
        }

    // --- PARTITION 8: PACIFIC TWILIGHT SPARKS & SEA MIST (196,000 to 200,000) ---
    } else {
        pType = 6.0;
        tx = (Math.random() - 0.5) * 75.0;
        ty = WATER_Y + Math.random() * 26.0;
        tz = (Math.random() - 0.5) * 42.0;
        tColor = (Math.random() > 0.5) ? COLOR_ORANGE_HIGHLIGHT : COLOR_SPARKLE_WHITE;
    }

    // --- USA 4TH OF JULY STARS & STRIPES COLOR MAPPING ---
    if (pType < 3.0) {
        // Towers become Star-Spangled Royal Blue
        const isNearTower = Math.abs(tx - TOWER_SOUTH_X) < 2.5 || Math.abs(tx - TOWER_NORTH_X) < 2.5;
        if (isNearTower && ty > -2.2) {
            usaColor = (Math.random() < 0.15) ? COLOR_USA_WHITE : COLOR_USA_BLUE;
        } else {
            // Roadway & Cables become Patriotic Red and White Stripes!
            const stripeIdx = Math.floor((tx + 35.0) / 3.0);
            usaColor = (stripeIdx % 2 === 0) ? COLOR_USA_RED : COLOR_USA_WHITE;
        }
    } else {
        usaColor = tColor;
    }

    targets[i3]     = tx;
    targets[i3 + 1] = ty;
    targets[i3 + 2] = tz;

    colors[i3]     = tColor.r;
    colors[i3 + 1] = tColor.g;
    colors[i3 + 2] = tColor.b;

    colorsUSA[i3]     = usaColor.r;
    colorsUSA[i3 + 1] = usaColor.g;
    colorsUSA[i3 + 2] = usaColor.b;

    typeAttr[i] = pType;

    randoms[i2]     = Math.random();
    randoms[i2 + 1] = Math.random();
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3));
geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('aColorUSA', new THREE.BufferAttribute(colorsUSA, 3));
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 2));
geometry.setAttribute('aType', new THREE.BufferAttribute(typeAttr, 1));

// ==========================================
// 5. CUSTOM SHADER MATERIAL (GLOWING FILAMENTS & KINETIC DYNAMICS)
// ==========================================
const material = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 1.0 },
        uSparkleIntensity: { value: 1.0 },
        uUSABlend: { value: 0.0 },
        uGoldPulse: { value: 0.0 }
    },
    vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform float uSparkleIntensity;
        uniform float uUSABlend;
        uniform float uGoldPulse;
        
        attribute vec3 aTarget;
        attribute vec3 aColor;
        attribute vec3 aColorUSA;
        attribute vec2 aRandom;
        attribute float aType;
        
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
            vec3 targetPos = aTarget;
            vec3 baseColor = mix(aColor, aColorUSA, uUSABlend);
            vColor = baseColor;
            
            // 1. DYNAMIC VEHICLE TRAFFIC FLOW (Type 1.0)
            if (aType > 0.5 && aType < 1.5) {
                float isNorthbound = step(0.0, -targetPos.z); // Negative Z = Northbound (+X)
                float speed = 12.0 + aRandom.y * 6.0;
                float spanLen = 63.0; // Full bridge length from -31.5 to +31.5
                
                if (isNorthbound > 0.5) {
                    // Northbound cars move toward +X
                    float flowX = mod(targetPos.x + 31.5 + uTime * speed, spanLen) - 31.5;
                    targetPos.x = flowX;
                    // Recalculate deck crown height dynamically
                    float normX = clamp(flowX / 28.0, -1.0, 1.0);
                    targetPos.y = -2.2 + 0.35 * (1.0 - normX * normX) + 0.15;
                    vColor = mix(vColor, vec3(1.0, 0.98, 0.90), 0.5);
                } else {
                    // Southbound cars move toward -X
                    float flowX = mod(targetPos.x + 31.5 - uTime * speed, spanLen) - 31.5;
                    targetPos.x = flowX;
                    float normX = clamp(flowX / 28.0, -1.0, 1.0);
                    targetPos.y = -2.2 + 0.35 * (1.0 - normX * normX) + 0.15;
                    vColor = mix(vColor, vec3(1.0, 0.1, 0.2), 0.4);
                }
            }
            // 2. DIAMOND SPARKLE / RIVET SCINTILLATION (Type 2.0)
            else if (aType > 1.5 && aType < 2.5) {
                float flash = sin(uTime * 15.0 + aRandom.x * 62.8);
                float flashIntensity = step(0.72, flash) * uSparkleIntensity;
                vec3 gleam = vec3(1.0, 0.95, 0.85) * 1.4;
                vColor = mix(vColor, gleam, flashIntensity);
            }
            // 3. PACIFIC OCEAN WAVE SWELLS (Type 3.0)
            else if (aType > 2.5 && aType < 3.5) {
                float wave1 = sin(targetPos.x * 0.35 + uTime * 2.2) * 0.16;
                float wave2 = cos(targetPos.z * 0.45 + uTime * 1.8) * 0.11;
                targetPos.y += wave1 + wave2;
                targetPos.x += sin(uTime * 0.7 + aRandom.y * 6.28) * 0.08;
            }
            // 4. BILLOWING SAN FRANCISCO MARINE FOG DRIFT (Type 4.0)
            else if (aType > 3.5 && aType < 4.5) {
                // Fog slowly drifts across the Golden Gate Strait (+Z and slight +X)
                float fogDriftX = sin(uTime * 0.3 + targetPos.z * 0.1) * 1.8;
                float fogDriftZ = mod(targetPos.z + 18.0 + uTime * 1.2, 36.0) - 18.0;
                float fogBobY = sin(uTime * 0.5 + aRandom.x * 6.28) * 0.4;
                targetPos.x += fogDriftX;
                targetPos.z = fogDriftZ;
                targetPos.y += fogBobY;
            }
            // 5. FLASHING RED AVIATION STROBES (Type 5.0)
            else if (aType > 4.5 && aType < 5.5) {
                float strobe = step(0.60, sin(uTime * 4.5 + aRandom.x * 3.14));
                vColor = mix(vec3(0.4, 0.0, 0.0), vec3(1.2, 0.05, 0.1), strobe);
            }
            // 6. AMBIENT SEA MIST / DUST (Type 6.0)
            else if (aType > 5.5 && aType < 6.5) {
                targetPos.x += sin(uTime * 0.45 + aRandom.x * 6.28) * 1.2;
                targetPos.y += cos(uTime * 0.35 + aRandom.y * 6.28) * 0.8;
                targetPos.z += sin(uTime * 0.40 + aRandom.x * 3.14) * 0.9;
            }
            
            // 7. GOLDEN ENERGY SURGE WAVE ACROSS BRIDGE SPAN
            float pulseWave = mod(uTime * 14.0, 75.0) - 37.5;
            float distToPulse = abs(targetPos.x - pulseWave);
            float surge = smoothstep(4.0, 0.0, distToPulse) * uGoldPulse;
            vec3 surgeGold = vec3(1.0, 0.84, 0.35);
            vColor = mix(vColor, surgeGold, surge * 0.75);
            
            // Solid, stable particle structure (never explodes or dissolves)
            vec3 currentPos = targetPos;
            vOpacity = 0.95;
            
            vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Point sizing with depth attenuation for sharp distinct steel trusses
            gl_PointSize = (2.20 * (30.0 / -mvPosition.z));
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
            vec2 xy = gl_PointCoord.xy - vec2(0.5);
            float d = length(xy);
            if(d > 0.5) discard;
            
            // High-contrast sharp core with smooth falloff
            float alpha = exp(-d * d * 13.0);
            
            gl_FragColor = vec4(vColor, alpha * vOpacity * 0.95);
        }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending
});

const particles = new THREE.Points(geometry, material);
particles.frustumCulled = false;
scene.add(particles);

// ==========================================
// 6. SAN FRANCISCO TWILIGHT STARFIELD
// ==========================================
const spaceGeo = new THREE.BufferGeometry();
const spacePoints = 3000;
const spacePositions = new Float32Array(spacePoints * 3);
const spaceColors = new Float32Array(spacePoints * 3);

for (let i = 0; i < spacePoints; i++) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 120 + Math.random() * 280;

    spacePositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    spacePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 25.0;
    spacePositions[i * 3 + 2] = r * Math.cos(phi);

    if (Math.random() > 0.8) {
        spaceColors[i * 3]     = 1.0;
        spaceColors[i * 3 + 1] = 0.85;
        spaceColors[i * 3 + 2] = 0.55;
    } else {
        spaceColors[i * 3]     = 0.75;
        spaceColors[i * 3 + 1] = 0.85;
        spaceColors[i * 3 + 2] = 0.98;
    }
}

spaceGeo.setAttribute('position', new THREE.BufferAttribute(spacePositions, 3));
spaceGeo.setAttribute('color', new THREE.BufferAttribute(spaceColors, 3));

const spaceMat = new THREE.PointsMaterial({
    size: 1.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.38
});
const spaceStars = new THREE.Points(spaceGeo, spaceMat);
scene.add(spaceStars);

// ==========================================
// 7. CONTINUOUS AUTOMATED AERIAL DRONE CINEMATOGRAPHY
// ==========================================
const params = {
    progress: 1.0,
    sparkleIntensity: 1.0,
    usaBlend: 0.0,
    goldPulse: 0.0
};

// Orchestrate Hollywood-grade aerial drone cinematography with GSAP
const cameraTimeline = gsap.timeline({ repeat: -1 });

function buildCinematicCameraChoreography() {
    cameraTimeline.clear();

    const zBase = getResponsiveZ(42, 1.78);
    const yBase = getResponsiveY(3.5, 2.2);
    const zWater = getResponsiveZ(20, 1.55);
    const zTower = getResponsiveZ(16, 1.50);
    const yAerial = getResponsiveZ(38, 1.35);

    // --- SHOT 1: Grand Coastal Establishing View (San Francisco Bay to Marin Headlands) [8s] ---
    cameraTimeline.to(camera.position, {
        x: 0,
        y: yBase,
        z: zBase,
        duration: 8.0,
        ease: "power1.inOut"
    }, 0);
    cameraTimeline.to(targetLookAt, {
        x: 0,
        y: 2.0,
        z: 0,
        duration: 8.0,
        ease: "power1.inOut"
    }, 0);

    // --- SHOT 2: Low-Altitude Water Run Skimming Pacific Swells under Stiffening Truss [9s] ---
    cameraTimeline.to(camera.position, {
        x: -8.0,
        y: -4.8,
        z: zWater,
        duration: 9.0,
        ease: "power1.inOut"
    }, 8.0);
    cameraTimeline.to(targetLookAt, {
        x: 0,
        y: -1.5,
        z: 0,
        duration: 9.0,
        ease: "power1.inOut"
    }, 8.0);

    // --- SHOT 3: Dramatic Ascending Spiral Up South Tower Art Deco Struts & Saddle [10s] ---
    cameraTimeline.to(camera.position, {
        x: TOWER_SOUTH_X - 10.0,
        y: 16.5,
        z: zTower,
        duration: 10.0,
        ease: "sine.inOut"
    }, 17.0);
    cameraTimeline.to(targetLookAt, {
        x: TOWER_SOUTH_X,
        y: 14.5,
        z: 0,
        duration: 10.0,
        ease: "sine.inOut"
    }, 17.0);

    // --- SHOT 4: High-Speed Glide Down Center Roadway Among Flowing Car Lights [9s] ---
    cameraTimeline.to(camera.position, {
        x: 6.0,
        y: 0.2,
        z: 3.5,
        duration: 9.0,
        ease: "power2.inOut"
    }, 27.0);
    cameraTimeline.to(targetLookAt, {
        x: 24.0,
        y: -1.2,
        z: 0,
        duration: 9.0,
        ease: "power2.inOut"
    }, 27.0);

    // --- SHOT 5: High Bird's-Eye Top-Down Aerial Over Suspension Cables & Marine Fog [8s] ---
    cameraTimeline.to(camera.position, {
        x: 0.1,
        y: yAerial,
        z: 4.0,
        duration: 8.0,
        ease: "power2.inOut"
    }, 36.0);
    cameraTimeline.to(targetLookAt, {
        x: 0,
        y: 0.0,
        z: 0,
        duration: 8.0,
        ease: "power2.inOut"
    }, 36.0);

    // --- SHOT 6: Sweeping Horizon Orbit Returning to Grand Panoramic Vista [8s] ---
    cameraTimeline.to(camera.position, {
        x: 0,
        y: yBase,
        z: zBase,
        duration: 8.0,
        ease: "power1.inOut"
    }, 44.0);
    cameraTimeline.to(targetLookAt, {
        x: 0,
        y: 2.0,
        z: 0,
        duration: 8.0,
        ease: "power1.inOut"
    }, 44.0);
}

// Orchestrate Light Shows (USA 4th of July Celebration, Golden Pulse, Reassembly)
const fxTimeline = gsap.timeline({ repeat: -1 });

function buildFxChoreography() {
    fxTimeline.clear();

    // Serene International Orange state (8s)
    fxTimeline.to({}, { duration: 8.0 });

    // Patriotic USA 4th of July Red, White & Blue Illumination (7s)
    fxTimeline.to(params, {
        usaBlend: 1.0,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: updateUniforms
    }).to({}, { duration: 3.2 }).to(params, {
        usaBlend: 0.0,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: updateUniforms
    });

    // Golden solar energy surge wave across bridge span (3s)
    fxTimeline.to(params, {
        goldPulse: 1.0,
        duration: 1.4,
        ease: "power2.in",
        onUpdate: updateUniforms
    }).to(params, {
        goldPulse: 0.0,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: updateUniforms
    });

    // Serene hold between lighting choreography cycles (10s)
    fxTimeline.to({}, { duration: 10.0 });
}

function updateUniforms() {
    material.uniforms.uProgress.value = params.progress;
    material.uniforms.uSparkleIntensity.value = params.sparkleIntensity;
    material.uniforms.uUSABlend.value = params.usaBlend;
    material.uniforms.uGoldPulse.value = params.goldPulse;
}

buildCinematicCameraChoreography();
buildFxChoreography();

// ==========================================
// 8. INTERACTIVE DRAG & TOUCH NAVIGATION
// ==========================================
let userOffsetRotY = 0;
let userOffsetRotX = 0;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        userOffsetRotY += deltaX * 0.0035;
        userOffsetRotX += deltaY * 0.002;
        userOffsetRotX = Math.max(-0.35, Math.min(0.35, userOffsetRotX));
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    }
});

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// Touch support
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        previousMouseX = e.touches[0].clientX;
        previousMouseY = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMouseX;
        const deltaY = e.touches[0].clientY - previousMouseY;
        userOffsetRotY += deltaX * 0.0045;
        userOffsetRotX += deltaY * 0.0025;
        userOffsetRotX = Math.max(-0.35, Math.min(0.35, userOffsetRotX));
        previousMouseX = e.touches[0].clientX;
        previousMouseY = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchend', () => {
    isDragging = false;
});

// ==========================================
// 9. RESIZE HANDLER
// ==========================================
function handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.setSize(window.innerWidth, window.innerHeight);
    buildCinematicCameraChoreography();
}
window.addEventListener('resize', handleResize);

// ==========================================
// 10. MAIN ANIMATION LOOP
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    material.uniforms.uTime.value = time;

    // Smooth LookAt interpolation for buttery cinematography
    cameraLookAt.lerp(targetLookAt, 0.05);
    camera.lookAt(cameraLookAt);

    // Subtle continuous scene float + interactive drag blend
    const autoFloatY = Math.sin(time * 0.12) * 0.02;
    const autoFloatZ = Math.cos(time * 0.10) * 0.01;

    userOffsetRotY *= 0.985; // Gently return to automated drone path
    userOffsetRotX *= 0.985;

    particles.rotation.y = autoFloatY + userOffsetRotY;
    particles.rotation.x = userOffsetRotX;
    particles.rotation.z = autoFloatZ;

    spaceStars.rotation.y += 0.00008;

    composer.render();
}

animate();
