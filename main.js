const ZOOM_LEVEL_MISSION = 5.0;  
const ZOOM_THRESHOLD = 5.75;      

let scene, camera, renderer, labelRenderer, moon, raycaster, mouse;
let landingSites = [], missionGroups = [];
let isDragging = false, lastInteraction = Date.now(), prevMouse = {x:0, y:0};
let targetZ = 18;

let isAutoRotating = false;
let targetRotation = { x: 0, y: 0 };
let activeLabel = null; 

let imgPos = 0, imgScale = 1, velocity = 0, isImgDragging = false, lastMouseX = 0;
const friction = 0.94;

let allMissions = []; 
let currentMissionId = null; 

async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 18;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none'; 
    document.getElementById('canvas-container').appendChild(labelRenderer.domElement);

    const moonTex = new THREE.TextureLoader().load('moon.jpg');
    moon = new THREE.Mesh(new THREE.SphereGeometry(4, 64, 64), new THREE.MeshPhongMaterial({map: moonTex, shininess:0}));
    moon.rotation.y = -Math.PI/2; 
    scene.add(moon);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(8, 6, 8);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    try {
        const res = await fetch('config.json');
        const data = await res.json();
        allMissions = data.missioni; 
        setupMissions(data.missioni);
    } catch(e) { console.error("Config missing"); }

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel, {passive: false});
    window.addEventListener('click', onClick);
    window.addEventListener('resize', onWindowResize);

    const slider = document.getElementById('zoom-slider');
    slider.addEventListener('input', (e) => {
        targetZ = -parseFloat(e.target.value); 
        isAutoRotating = false;
        lastInteraction = Date.now();
    });

    animate();
}

// Funzione per mostrare/nascondere la zona Info
function toggleInfoZone(e) {
    e.stopPropagation();
    const infoZone = document.getElementById('info-zone');
    const btn = document.getElementById('info-toggle-btn');
    if (infoZone.style.display === 'block') {
        infoZone.style.display = 'none';
        btn.classList.remove('active');
    } else {
        infoZone.style.display = 'block';
        btn.classList.add('active');
    }
}

function setupMissions(missions) {
    const groups = {};
    const GOLDEN_ANGLE = 2.39996; 
    const DISTANCE_FACTOR = 0.6;  
    const MIN_RADIUS = 0.3;       
    const missionCounters = {};

    missions.forEach((m) => {
        const missionID = m.id;
        if (missionCounters[missionID] === undefined) missionCounters[missionID] = 0;
        
        const n = missionCounters[missionID];
        missionCounters[missionID]++; 

        const angle = n * GOLDEN_ANGLE;
        const radius = MIN_RADIUS + (DISTANCE_FACTOR * Math.sqrt(n));
        const finalLat = m.lat + (radius * Math.cos(angle));
        const finalLon = m.lon + (radius * Math.sin(angle));

        const phi = (90 - finalLat) * (Math.PI / 180);
        const theta = (finalLon + 180) * (Math.PI / 180);
        
        const disc = new THREE.Mesh(
            new THREE.CircleGeometry(0.04, 32), 
            new THREE.MeshBasicMaterial({color: 0x00ff41, side: THREE.DoubleSide})
        );
        
        disc.position.set(-(4.02 * Math.sin(phi) * Math.cos(theta)), 4.02 * Math.cos(phi), 4.02 * Math.sin(phi) * Math.sin(theta));
        disc.lookAt(0,0,0);
        disc.userData = m;
        moon.add(disc);
        landingSites.push(disc);

        if(!groups[missionID]) {
            const basePhi = (90 - m.lat) * (Math.PI / 180);
            const baseTheta = (m.lon + 180) * (Math.PI / 180);
            groups[missionID] = { phi: basePhi, theta: baseTheta, name: missionID };
        }
    });

    for(let id in groups) {
        const g = groups[id];
        const div = document.createElement('div');
        div.className = 'mission-label';
        div.textContent = g.name;
        
        div.onclick = (e) => {
            e.stopPropagation();
            activeLabel = div;
            isAutoRotating = true;
            
            moon.rotation.y %= Math.PI * 2;
            moon.rotation.x %= Math.PI * 2;
            targetRotation.y = -g.theta + Math.PI/2;
            targetRotation.x = -(g.phi - Math.PI/2);

            if (moon.rotation.y - targetRotation.y > Math.PI) targetRotation.y += Math.PI * 2;
            if (moon.rotation.y - targetRotation.y < -Math.PI) targetRotation.y -= Math.PI * 2;

            targetZ = ZOOM_LEVEL_MISSION; 
            lastInteraction = Date.now();
        };

        const lbl = new THREE.CSS2DObject(div);
        lbl.labelDiv = div; 
        lbl.position.set(-(4.1 * Math.sin(g.phi) * Math.cos(g.theta)), 4.1 * Math.cos(g.phi), 4.1 * Math.sin(g.phi) * Math.sin(g.theta));
        moon.add(lbl);
        missionGroups.push(lbl);
    }
}

function onMouseDown(e) {
    // Chiude il pannello info se l'utente inizia a trascinare la Luna
    document.getElementById('info-zone').style.display = 'none';
    document.getElementById('info-toggle-btn').classList.remove('active');

    if (e.clientY <= 90) return;

    if(document.getElementById('panorama').style.display === 'block') { isImgDragging = true; lastMouseX = e.clientX; velocity = 0; }
    else { isDragging = true; isAutoRotating = false; prevMouse = {x: e.clientX, y: e.clientY}; }
}

function onMouseUp() { isDragging = false; isImgDragging = false; }

function onMouseMove(e) {
    if(isDragging && document.getElementById('canvas-container').style.display !== 'none') {
        const sens = 0.0012 * (camera.position.z / 18); 
        moon.rotation.y += (e.clientX - prevMouse.x) * sens;
        moon.rotation.x += (e.clientY - prevMouse.y) * sens;
        lastInteraction = Date.now();
    }
    if(isImgDragging) {
        const deltaX = e.clientX - lastMouseX;
        velocity = deltaX; imgPos += deltaX; lastMouseX = e.clientX;
        updateImgTransform();
    }
    prevMouse = {x: e.clientX, y: e.clientY};
}

function onWheel(e) {
    // Chiude le info all'uso della rotella
    document.getElementById('info-zone').style.display = 'none';
    document.getElementById('info-toggle-btn').classList.remove('active');

    if (e.clientY <= 90) return;

    if (document.getElementById('panorama').style.display === 'block') {
        e.preventDefault();
        imgScale = Math.min(Math.max(imgScale - e.deltaY * 0.001, 1), 5);
        updateImgTransform();
    } else {
        targetZ = Math.min(Math.max(camera.position.z + e.deltaY * 0.012, 4.2), 18.0);
        isAutoRotating = false;
        lastInteraction = Date.now();
    }
}

function updateImgTransform() {
    const wrapper = document.getElementById('panorama-wrapper');
    const img = document.getElementById('lunar-img');
    const containerWidth = window.innerWidth;
    const renderedWidth = img.getBoundingClientRect().width;
    const limit = (renderedWidth - containerWidth) / 2;
    
    if (renderedWidth > containerWidth) { imgPos = Math.min(Math.max(imgPos, -limit), limit); } 
    else { imgPos = 0; }
    wrapper.style.transform = `translateX(calc(-50% + ${imgPos}px)) scale(${imgScale})`;
}

function onClick(e) {
    if (e.clientY <= 90 || document.getElementById('panorama').style.display === 'block') return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    if(camera.position.z < ZOOM_THRESHOLD) {
        const hits = raycaster.intersectObjects(landingSites.filter(s => s.visible));
        if(hits.length > 0) enterStreetView(hits[0].object.userData);
    }
}

function enterStreetView(cfg) {
    document.getElementById('canvas-container').style.display = 'none';
    document.getElementById('panorama').style.display = 'block';
    document.getElementById('zoom-container').style.display = 'none';
    
    // Chiude e occulta l'area info
    document.getElementById('info-zone').style.display = 'none';
    document.getElementById('info-toggle-btn').style.display = 'none';
    document.getElementById('header-container').style.display = 'none';
    
    document.getElementById('panorama-controls').style.display = 'flex';
    
    const imgEl = document.getElementById('lunar-img');
    const overlayEl = document.getElementById('hotspot-overlay');
    overlayEl.innerHTML = '';
    
    const hsMenuEl = document.getElementById('hotspot-menu');
    const hsItemsContainer = document.getElementById('hotspot-items');
    hsItemsContainer.innerHTML = '';
    hsMenuEl.style.display = 'none';
    
    const fileName = cfg.file.replace('photosphere/', '');
    const missionNum = fileName.split('_')[0];
    imgEl.src = `photosphere/Apollo ${missionNum}/${fileName}`;
    
    imgEl.onload = () => { 
        imgPos = 0; 
        imgScale = 1; 
        velocity = 0; 
        updateImgTransform(); 
        
        if (cfg.hotSpots && cfg.hotSpots.length > 0) {
            hsMenuEl.style.display = 'block';
            document.getElementById('hotspot-menu-toggle').onclick = (e) => {
                e.stopPropagation();
                hsMenuEl.classList.toggle('open');
                document.getElementById('panorama-menu').classList.remove('open');
            };

            const naturalW = imgEl.naturalWidth;
            const naturalH = imgEl.naturalHeight;
            
            cfg.hotSpots.forEach((hs, index) => {
                const container = document.createElement('div');
                container.className = 'lunar-hotspot-container';
                container.id = `hs-container-${index}`;
                
                const pctX = (hs.x / naturalW) * 100;
                const pctY = (hs.y / naturalH) * 100;
                container.style.left = `${pctX}%`;
                container.style.top = `${pctY}%`;
                
                const trigger = document.createElement('div');
                trigger.className = 'hotspot-trigger';
                
                const content = document.createElement('div');
                content.className = 'hotspot-content';
                content.innerText = hs.text;
                
                content.onclick = (e) => {
                    e.stopPropagation(); 
                    const nomeMissione = document.getElementById('d-id').innerText.split(' - ')[0] || "";
                    const queryRicerca = encodeURIComponent(`${nomeMissione} ${hs.text}`);
                    window.open(`https://www.google.com/search?q=${queryRicerca}`, '_blank');
                };
                
                trigger.onclick = (e) => {
                    e.stopPropagation();
                    focusHotspotElement(container);
                };
                
                container.appendChild(trigger);
                container.appendChild(content);
                overlayEl.appendChild(container);

                const hsItem = document.createElement('div');
                hsItem.className = 'hotspot-item';
                hsItem.textContent = hs.text;
                
                hsItem.onclick = (e) => {
                    e.stopPropagation();
                    const containerWidth = window.innerWidth;
                    const renderedWidth = imgEl.getBoundingClientRect().width;
                    const hsRenderedX = (hs.x / naturalW) * renderedWidth;
                    
                    imgPos = (renderedWidth / 2) - hsRenderedX;
                    velocity = 0; 
                    updateImgTransform();
                    
                    hsMenuEl.classList.remove('open');
                    focusHotspotElement(container);
                };
                hsItemsContainer.appendChild(hsItem);
            });
        }
    };
    
    document.getElementById('d-id').innerText = cfg.titolo;
    document.getElementById('d-coords').innerText = `${cfg.lat.toFixed(3)}°N / ${cfg.lon.toFixed(3)}°E`;
    
    currentMissionId = cfg.id;
    const sameMission = allMissions.filter(m => m.id === cfg.id);
    const menuEl = document.getElementById('panorama-menu');
    const itemsContainer = document.getElementById('panorama-items');
    itemsContainer.innerHTML = '';
    
    if(sameMission.length > 1) {
        menuEl.style.display = 'block';
        document.getElementById('panorama-menu-toggle').onclick = (e) => {
            e.stopPropagation();
            menuEl.classList.toggle('open');
            document.getElementById('hotspot-menu').classList.remove('open');
        };
        
        sameMission.forEach((mission, idx) => {
            const item = document.createElement('div');
            item.className = 'panorama-item';
            item.setAttribute('data-idx', idx + 1);
            if(mission.file === cfg.file) item.classList.add('active');
            
            const labelText = mission.titolo.substring(mission.titolo.lastIndexOf('-') + 1).trim() || `Stazione ${idx + 1}`;
            item.textContent = labelText;
            
            item.onclick = (e) => {
                e.stopPropagation();
                enterStreetView(mission);
                menuEl.classList.remove('open');
            };
            itemsContainer.appendChild(item);
        });
    } else {
        menuEl.style.display = 'none';
    }

    window.addEventListener('click', closeAllDropdowns);
}

function closeAllDropdowns() {
    document.getElementById('panorama-menu').classList.remove('open');
    document.getElementById('hotspot-menu').classList.remove('open');
    // Chiude anche le info se aperte cliccando fuori
    document.getElementById('info-zone').style.display = 'none';
    document.getElementById('info-toggle-btn').classList.remove('active');
}

function focusHotspotElement(targetContainer) {
    document.querySelectorAll('.lunar-hotspot-container').forEach(el => {
        if(el !== targetContainer) el.classList.remove('open');
    });
    targetContainer.classList.toggle('open');
}

function exitStreetView() {
    window.removeEventListener('click', closeAllDropdowns);
    closeAllDropdowns();

    document.getElementById('panorama').style.display = 'none';
    document.getElementById('canvas-container').style.display = 'block';
    document.getElementById('zoom-container').style.display = 'flex';
    
    // Ripristina UI Vista Luna
    document.getElementById('panorama-controls').style.display = 'none';
    document.getElementById('header-container').style.display = 'flex';
    document.getElementById('info-toggle-btn').style.display = 'block';
    
    currentMissionId = null;
    targetZ = 18.0; 
    document.getElementById('zoom-slider').value = -18.0;
    lastInteraction = Date.now();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    camera.position.z += (targetZ - camera.position.z) * 0.1;
    document.getElementById('zoom-slider').value = -camera.position.z;
    
    if(isAutoRotating) {
        moon.rotation.y += (targetRotation.y - moon.rotation.y) * 0.08;
        moon.rotation.x += (targetRotation.x - moon.rotation.x) * 0.08;
        if(Math.abs(moon.rotation.y - targetRotation.y) < 0.001) isAutoRotating = false;
    }

    const isNear = camera.position.z < ZOOM_THRESHOLD;
    landingSites.forEach(s => s.visible = true);
    
    missionGroups.forEach(g => {
        const el = g.labelDiv;
        const isThisActive = (el === activeLabel);

        const labelWorldPosition = new THREE.Vector3();
        g.getWorldPosition(labelWorldPosition);

        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        const dotProduct = labelWorldPosition.clone().normalize().dot(cameraDirection);
        const isBehind = dotProduct > -0.2; 

        if (isNear && activeLabel) {
            if (isThisActive) {
                el.classList.add('fixed-top');
                el.style.opacity = '1';
            } else {
                el.classList.remove('fixed-top');
                el.style.opacity = '0';
            }
        } else {
            el.classList.remove('fixed-top');
            
            if (isBehind) {
                el.style.opacity = '0.15';
                el.style.pointerEvents = 'none'; 
            } else {
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            }

            if(!isAutoRotating && !isNear) activeLabel = null;
        }
    });

    if(!isImgDragging && Math.abs(velocity) > 0.1) {
        imgPos += velocity; velocity *= friction; updateImgTransform();
    }

    const idleTime = Date.now() - lastInteraction;
    const hintEl = document.getElementById('idle-hint');

    if (idleTime > 8000 && document.getElementById('panorama').style.display !== 'block') {
        hintEl.style.opacity = '0.5';
    } else {
        hintEl.style.opacity = '0';
    }

    if (!isDragging && !isAutoRotating && idleTime > 8000) {
        moon.rotation.y += 0.0003;
    }
    
    labelRenderer.render(scene, camera);
    renderer.render(scene, camera);
}

window.onload = init;
