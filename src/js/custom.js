// THREE and topojson are loaded globally via CDN in footer.html

// ---------- Basic scene ----------
const container = document.getElementById('app');
const scene = new THREE.Scene();

// Renderer with transparent background
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0); // alpha = 0 -> transparent
renderer.sortObjects = true; // Enable render order
container.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 2000);
camera.position.set(0, 0, 260);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 60;
controls.maxDistance = 600;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25;

// === LOCK vertical rotation: only allow left-right rotation ===
// Set both minPolarAngle and maxPolarAngle to the same value (equator) so user can't rotate up/down
// This forces rotation purely around the Y axis (left-right).
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;

// Lighting (not crucial for lines but included)
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.4);
dir.position.set(5, 10, 7);
scene.add(dir);

// Parameters
const RADIUS = 80;
const resolution = 3; // increase for smoother curves (not heavy)

// Material for country borders (front)
const lineMaterial = new THREE.LineBasicMaterial({
	color: 0xffffff,
	transparent: true,
	opacity: 1.0,        // stronger front border opacity
	linewidth: 1
});

// Material for back-facing lines (reduced opacity)
const lineBackMaterial = new THREE.LineBasicMaterial({
	color: 0xffffff,
	transparent: true,
	opacity: 1.0,
	linewidth: 1
});

// Highlight stroke for country borders (slightly offset, brighter)
// This will be created after the main front lines and placed renderOrder above them.
const highlightMaterial = new THREE.LineBasicMaterial({
	color: 0xffffff,
	transparent: true,
	opacity: 1.0,
	linewidth: 1
});

// Material for dots on countries (reduced opacity per request)
const dotMaterial = new THREE.PointsMaterial({
	color: 0xffffff,
	size: 0.9,               // slightly smaller
	sizeAttenuation: true,
	transparent: true,
	opacity: 0.5           // much lower opacity -> subtle country fill
});

// ---------- Utility: lat/lon -> 3D on sphere ----------
function latLonToVector3(lat, lon, radius = RADIUS) {
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lon + 180) * (Math.PI / 180);
	const x = - (radius * Math.sin(phi) * Math.cos(theta));
	const z = (radius * Math.sin(phi) * Math.sin(theta));
	const y = (radius * Math.cos(phi));
	return new THREE.Vector3(x, y, z);
}

// ---------- Add parallels / meridians (lat/long grid) ----------
// Build grid on a slightly LARGER radius so lines appear raised over the landmasses
function buildLatLonGrid() {
	const gridGroup = new THREE.Group();

	const gridRadius = RADIUS + 3; // raise grid slightly above country geometry

	// Create a dedicated material for grid so we can tweak depthTest / opacity separately
	const gridMaterial = new THREE.LineBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0.25,
		linewidth: 1
	});

	// Meridians (longitudes)
	for (let lon = -180; lon <= 180; lon += 15) {
		const points = [];
		for (let lat = -90; lat <= 90; lat += 1 * resolution) {
			points.push(latLonToVector3(lat, lon, gridRadius));
		}
		const geom = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(geom, gridMaterial);
		gridGroup.add(line);
	}

	// Parallels (latitudes)
	for (let lat = -60; lat <= 80; lat += 15) {
		const points = [];
		for (let lon = -180; lon <= 180; lon += 1 * resolution) {
			points.push(latLonToVector3(lat, lon, gridRadius));
		}
		const geom = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(geom, gridMaterial);
		gridGroup.add(line);
	}

	// Equator emphasised (optional)
	{
		const points = [];
		for (let lon = -180; lon <= 180; lon += 0.5) points.push(latLonToVector3(0, lon, gridRadius));
		const g = new THREE.BufferGeometry().setFromPoints(points);
		const eq = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.98 }));
		gridGroup.add(eq);
	}

	// Make sure grid renders above country lines & dots to create layered 3D effect
	gridGroup.renderOrder = 4;
	return gridGroup;
}

// Add grid (raised slightly)
const grid = buildLatLonGrid();
scene.add(grid);

// ---------- Load topological world data and draw country outlines ----------
// Using world-atlas topojson (countries)
const topoURL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

async function loadAndDrawCountries() {
	try {
		const res = await fetch(topoURL);
		if (!res.ok) throw new Error('TopoJSON fetch failed: ' + res.status);
		const topo = await res.json();

		// Convert topojson to geojson features
		const geo = topojson.feature(topo, topo.objects.countries);
		const features = geo.features;

		// Separate positions for front and back facing lines
		const positionsFront = [];
		const positionsBack = [];
		const dotPositions = [];

		for (const feat of features) {
			const geom = feat.geometry;
			// geometry types: Polygon or MultiPolygon
			if (geom.type === 'Polygon') {
				pushPolygonLine(geom.coordinates, positionsFront, positionsBack);
				addCountryDots(geom.coordinates, dotPositions);
			} else if (geom.type === 'MultiPolygon') {
				for (const poly of geom.coordinates) {
					pushPolygonLine(poly, positionsFront, positionsBack);
					addCountryDots(poly, dotPositions);
				}
			}
		}

		// Create front-facing geometry (full opacity)
		const positionArrayFront = new Float32Array(positionsFront);
		const bufferGeomFront = new THREE.BufferGeometry();
		bufferGeomFront.setAttribute('position', new THREE.BufferAttribute(positionArrayFront, 3));
		const linesFront = new THREE.LineSegments(bufferGeomFront, lineMaterial);
		linesFront.renderOrder = 2;
		scene.add(linesFront);

		// Create back-facing geometry (reduced opacity)
		if (positionsBack.length > 0) {
			const positionArrayBack = new Float32Array(positionsBack);
			const bufferGeomBack = new THREE.BufferGeometry();
			bufferGeomBack.setAttribute('position', new THREE.BufferAttribute(positionArrayBack, 3));
			const linesBack = new THREE.LineSegments(bufferGeomBack, lineBackMaterial);
			linesBack.renderOrder = 1;
			scene.add(linesBack);
		}

		// Create subtle dots for all countries
		if (dotPositions.length > 0) {
			const dotArray = new Float32Array(dotPositions);
			const dotGeom = new THREE.BufferGeometry();
			dotGeom.setAttribute('position', new THREE.BufferAttribute(dotArray, 3));
			const dots = new THREE.Points(dotGeom, dotMaterial);
			dots.renderOrder = 3;
			scene.add(dots);
		}

		// ---------- Create a highlighted border stroke by slightly scaling front positions outward ----------
		// This makes country borders "pop" more without changing topo coordinates.
		if (positionsFront.length > 0) {
			// small scale factor to offset outward from center
			const scaleFactor = 1.008; // tweak if needed (1.0 = no offset)
			const highlightArr = new Float32Array(positionsFront.length);
			for (let i = 0; i < positionsFront.length; i += 3) {
				const x = positionsFront[i], y = positionsFront[i + 1], z = positionsFront[i + 2];
				// scale vector slightly away from origin
				highlightArr[i] = x * scaleFactor;
				highlightArr[i + 1] = y * scaleFactor;
				highlightArr[i + 2] = z * scaleFactor;
			}
			const geoHighlight = new THREE.BufferGeometry();
			geoHighlight.setAttribute('position', new THREE.BufferAttribute(highlightArr, 3));
			const linesHighlight = new THREE.LineSegments(geoHighlight, highlightMaterial);
			// render above everything so the outline clearly reads
			linesHighlight.renderOrder = 5;
			scene.add(linesHighlight);
		}

	} catch (err) {
		console.error('Error loading topojson', err);
	}
}

function pushPolygonLine(coordinates, positionsFront, positionsBack) {
	// coordinates = [ring1, ring2, ...] ; ring = [ [lon,lat], ... ]
	for (const ring of coordinates) {
		// iterate through ring points and add segments between consecutive points
		for (let i = 0; i < ring.length - 1; i++) {
			const [lon1, lat1] = ring[i];
			const [lon2, lat2] = ring[i + 1];
			const v1 = latLonToVector3(lat1, lon1);
			const v2 = latLonToVector3(lat2, lon2);

			// Determine if line segment is front-facing or back-facing
			// A segment is front-facing if the center is closer to camera
			const midpoint = new THREE.Vector3(
				(v1.x + v2.x) / 2,
				(v1.y + v2.y) / 2,
				(v1.z + v2.z) / 2
			);

			// Camera is at +Z, so positive Z means front-facing
			if (midpoint.z > 0) {
				positionsFront.push(v1.x, v1.y, v1.z);
				positionsFront.push(v2.x, v2.y, v2.z);
			} else {
				positionsBack.push(v1.x, v1.y, v1.z);
				positionsBack.push(v2.x, v2.y, v2.z);
			}
		}
	}
}

function isPointInPolygon(point, ring) {
	// Ray casting algorithm for point-in-polygon test
	const [x, y] = point;
	let inside = false;

	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];

		const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
}

function addCountryDots(coordinates, dotPositions) {
	// Create a dense grid of dots filling entire country area
	// coordinates = [ring1, ring2, ...]
	const rings = coordinates;
	if (rings.length === 0) return;

	// Use the outer ring for boundary testing
	const outerRing = rings[0];

	// Get bounding box from outer ring
	let minLon = outerRing[0][0], maxLon = outerRing[0][0];
	let minLat = outerRing[0][1], maxLat = outerRing[0][1];
	for (const [lon, lat] of outerRing) {
		minLon = Math.min(minLon, lon);
		maxLon = Math.max(maxLon, lon);
		minLat = Math.min(minLat, lat);
		maxLat = Math.max(maxLat, lat);
	}

	// Dense grid spacing (in degrees) - smaller value = more dots
	const gridStep = 0.75; // 0.75 degree spacing for dense coverage

	// Create grid points and test if inside polygon
	for (let lon = minLon; lon <= maxLon; lon += gridStep) {
		for (let lat = minLat; lat <= maxLat; lat += gridStep) {
			const point = [lon, lat];

			// Check if point is inside outer ring
			if (isPointInPolygon(point, outerRing)) {
				// Check if point is inside any inner rings (holes) - if so, exclude it
				let insideHole = false;
				for (let i = 1; i < rings.length; i++) {
					if (isPointInPolygon(point, rings[i])) {
						insideHole = true;
						break;
					}
				}

				// Add dot if not in a hole
				if (!insideHole) {
					const vec = latLonToVector3(lat, lon);
					dotPositions.push(vec.x, vec.y, vec.z);
				}
			}
		}
	}
}

// ---------- Optional: add concentric latitude rings on southern pole (screenshot like) ----------
function addPoleRings() {
	const group = new THREE.Group();
	const ringsCount = 10;
	for (let i = 1; i <= ringsCount; i++) {
		const r = RADIUS * (i / (ringsCount + 1)) * 0.35; // scale for inner rings
		const segments = 128;
		const pts = [];
		for (let a = 0; a <= Math.PI * 2 + 0.01; a += (Math.PI * 2) / segments) {
			// latitude around the south pole: choose lat ~ -89..-60 for concentric look
			const lat = -85 + i * 2;
			const lon = (a * 180 / Math.PI) - 180;
			pts.push(latLonToVector3(lat, lon));
		}
		const g = new THREE.BufferGeometry().setFromPoints(pts);
		const l = new THREE.Line(g, lineMaterial);
		group.add(l);
	}
	return group;
}
// optional ring (uncomment if you want)
// scene.add(addPoleRings());

// ---------- Scene resize handling ----------
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
	camera.aspect = container.clientWidth / container.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(container.clientWidth, container.clientHeight);
}

// ---------- Animation loop ----------
function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

// ---------- Kick off ----------
loadAndDrawCountries();
animate();

// ---------- Quick GUI-like tuning console logs ----------
console.log('Wireframe globe running. Serve over http(s). Adjust controls.autoRotateSpeed or material color as needed.');

// ---------- Helper: allow toggling auto-rotate with keyboard (optional) ----------
window.addEventListener('keydown', (e) => {
	if (e.key === 'r') controls.autoRotate = !controls.autoRotate;
});
