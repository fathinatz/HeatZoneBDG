// Global variables for map
let map;
const initialMapLat = -6.9175;
const initialMapLon = 107.6191;
const initialMapZoom = 12;
let basemapLayers = {};
let routingControl = null;
let lstLayer;
let layerControl;
let overlays = {};

// Global variables for hero section and slideshow
let hero, heroSlides, currentSlide = 0;
// Global variables for card container and navigation
let container, nextBtn, prevBtn;
// Global variables for infrastructure dots and slides
let infraDots, infraSlides;
// Global variables for content scrolling and section observation
let contentScrollContainer, sections, navItems;
let observer;

/**
 * Sets the background image of the hero section from a specific slide.
 * @param {number} index - The index of the slide to use as background.
 */
function setBackgroundFromSlide(index) {
    if (hero && heroSlides?.length && heroSlides[index]) {
        const imageUrl = heroSlides[index].getAttribute("src");
        hero.style.backgroundImage = `url(${imageUrl})`;
    }
}

/**
 * Starts the slideshow for the hero section, updating the background periodically.
 */
function startSlideshow() {
    if (hero && heroSlides?.length) {
        setBackgroundFromSlide(currentSlide);
        currentSlide = (currentSlide + 1) % heroSlides.length;
        setTimeout(startSlideshow, 4000); // Change slide every 4 seconds
    }
}

/**
 * Initializes the Leaflet map and its base layers.
 */
function initMap() {
    if (document.getElementById('map')) {
        map = L.map('map').setView([initialMapLat, initialMapLon], initialMapZoom);

        basemapLayers = {
            'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map),
            'Google Roads': L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                attribution: '© Google',
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }),
            'Google Satellite': L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                attribution: '© Google',
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }),
            'Google Hybrid': L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                attribution: '© Google',
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }),
            'Dark Mode': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© CartoDB',
                subdomains: 'abcd',
                maxZoom: 19
            })
        };
    }
}

/**
 * Adds the Land Surface Temperature (LST) legend to the map.
 * @param {L.Map} mapInstance - The Leaflet map instance.
 */
function addLSTLegend(mapInstance) {
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "legend-lst-gradient info");
        div.innerHTML += "<div class='legend-title'>LST (°C)</div>";
        div.innerHTML += "<div class='color-bar'></div>";
        div.innerHTML += "<div class='scale-labels'><span>20°C</span><span>45°C</span></div>";
        return div;
    };
    legend.addTo(mapInstance);
}

/**
 * Adds a combined legend for various map layers (Infrastructure, Administration Boundaries, Land Cover, etc.) to the map.
 * @param {L.Map} mapInstance - The Leaflet map instance.
 */
function addCombinedLegend(mapInstance) {
    let legend = L.control({ position: "bottomleft" });

    legend.onAdd = function () {
        let div = L.DomUtil.create("div", "info legend-combined");
        div.innerHTML =
            '<p class="legend-main-title">Legenda</p>' +
            '<p class="legend-section-title">Infrastruktur</p>' +
            '<div class="legend-item">' +
            '<svg width="20" height="15" style="vertical-align: middle;"><circle cx="8" cy="7.5" r="5" fill="#005eff" stroke="#000000" stroke-width="1" /></svg>' +
            'Jembatan' +
            '</div>' +
            '<div class="legend-item">' +
            '<svg width="20" height="15" style="vertical-align: middle;"><circle cx="8" cy="7.5" r="6" fill="rgb(255, 251, 0)" stroke="rgb(0, 0, 0)" stroke-width="1" /></svg>' +
            'Pabrik' +
            '</div>' +
            '<div class="legend-item">' +
            '<svg width="20" height="15" style="vertical-align: middle;"><circle cx="8" cy="7.5" r="5" fill="#a855f7" stroke="#6b21a8" stroke-width="1" /></svg>' +
            'Bangunan' +
            '</div>' +
            '<p class="legend-section-title">Jaringan Jalan</p>' +
            '<div class="legend-item">' +
            '<svg width="20" height="15" style="vertical-align: middle;"><line x1="0" y1="7.5" x2="20" y2="7.5" style="stroke-width:3;stroke:#a50026;opacity:0.7;"/></svg>' +
            'Jalan Raya' +
            '</div>' +
            '<p class="legend-section-title">Zona Buffer</p>' +
            '<div class="legend-item">' +
            '<svg width="20" height="15" style="vertical-align: middle;"><rect x="2" y="3" width="16" height="9" style="fill:#d1b3ff;stroke:#8000FF;stroke-width:2;stroke-dasharray:4 4;fill-opacity:0.3;"/></svg>' +
            'Buffer Pabrik' +
            '</div>' +
            '<p class="legend-section-title">Batas Administrasi</p>' +
            '<div class="legend-item">' +
            '<svg width="20" height="15" style="vertical-align: middle;"><line x1="0" y1="7.5" x2="20" y2="7.5" style="stroke-width:1;stroke:#450111;stroke-dasharray:2 4"/></svg>' +
            'Batas Desa/Kelurahan' +
            '</div>' +
            '<p class="legend-section-title">Tutupan Lahan</p>' +
            '<div class="legend-item"><span style="background-color: #0a208d;"></span>Danau/Situ/Sungai</div>' +
            '<div class="legend-item"><span style="background-color: #067040;"></span>Hutan Rimba</div>' +
            '<div class="legend-item"><span style="background-color: #5d4b08;"></span>Perkebunan/Kebun</div>' +
            '<div class="legend-item"><span style="background-color: #a91b0b;"></span>Permukiman dan Tempat Kegiatan</div>' +
            '<div class="legend-item"><span style="background-color: #4ae268;"></span>Sawah</div>' +
            '<div class="legend-item"><span style="background-color: #FDFDFD; border: 1px solid #ccc;"></span>Semak Belukar</div>' +
            '<div class="legend-item"><span style="background-color: #95a5a6;"></span>Tanah Kosong/Gundul</div>' +
            '<div class="legend-item"><span style="background-color: #f5a623;"></span>Tegalan/Ladang</div>' +
            '<div class="legend-item"><span style="background-color: #000000;"></span>Vegetasi Non Budidaya Lainnya</div>';
        return div;
    };
    legend.addTo(mapInstance);
}

/**
 * Scrolls the content container to a specific section and updates navigation.
 * @param {string} id - The ID of the section to scroll to.
 */
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section && contentScrollContainer) {
        contentScrollContainer.scrollTo({ top: section.offsetTop, behavior: 'smooth' });
        navItems?.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('onclick')?.includes(id)) item.classList.add('active');
        });
    }
}

/**
 /**
 * Fetches and displays real-time weather and Air Quality Index (AQI) data for Bandung.
 */
function fetchRealtimeWeatherAndAQI() {
    const openWeatherApiKey = "109f99480b4e8da2c7a1dce50d5dd8ab";
    const waqiApiKey = "46365d086b99fa2aad8a6ccd99500fd9fdc2d23d";

    const lat = -6.9147;
    const lon = 107.6098;

    const weatherTempElem = document.querySelector(".weather-temp");
    const conditionElem = document.getElementById("weather-condition");
    const humidityElem = document.getElementById("weather-humidity");
    const windElem = document.getElementById("weather-wind");
    const aqiInfoElem = document.getElementById("aqi-info");

    // Set loading states
    weatherTempElem.innerText = "--°C";
    conditionElem.innerText = "Memuat...";
    humidityElem.innerText = "Kelembaban: --%";
    windElem.innerText = "Angin: -- km/h";
    if (aqiInfoElem) aqiInfoElem.innerText = "Memuat AQI...";

    // Fetch weather data
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric&lang=id`)
        .then(response => response.json())
        .then(data => {
            weatherTempElem.innerText = `${Math.round(data.main.temp)}°C`;
            conditionElem.innerText = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
            humidityElem.innerText = `Kelembaban: ${data.main.humidity}%`;
            windElem.innerText = `Angin: ${data.wind.speed} km/h`;
        })
       

    // Fetch AQI data
    fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${waqiApiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.status !== "ok") throw new Error("Data AQI tidak valid");
            const aqi = data.data.aqi;
            const dominan = data.data.dominentpol || "-";

            let status = "", color = "";
            if (aqi <= 50) { status = "Baik"; color = "#00e400"; }
            else if (aqi <= 100) { status = "Sedang"; color = "#ffff00"; }
            else if (aqi <= 150) { status = "Tidak Sehat bagi Kelompok Sensitif"; color = "#ff7e00"; }
            else if (aqi <= 200) { status = "Tidak Sehat"; color = "#ff0000"; }
            else if (aqi <= 300) { status = "Sangat Tidak Sehat"; color = "#8f3fd4"; }
            else { status = "Berbahaya"; color = "#7e0023"; }

            if (aqiInfoElem) {
                aqiInfoElem.innerHTML = `
                    Indeks Kualitas Udara: 
                    <p><span style="color:${color};">${aqi} (${status})</span><br><p>
                    Polutan Dominan: ${dominan.toUpperCase()}
                `;
            }
        })
        .catch(error => {
            if (aqiInfoElem) aqiInfoElem.innerText = `Gagal memuat AQI: ${error.message}`;
            console.error("AQI API error:", error);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    fetchRealtimeWeatherAndAQI();
    setInterval(fetchRealtimeWeatherAndAQI, 600000);
});
// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize hero slideshow
    hero = document.querySelector(".hero");
    heroSlides = document.querySelectorAll(".slideshow-container img");
    if (hero && heroSlides.length > 0) {
        startSlideshow();
        hero.addEventListener("click", () => {
            setBackgroundFromSlide(currentSlide);
            currentSlide = (currentSlide + 1) % heroSlides.length;
        });
    }

    // Initialize card carousel navigation
    container = document.getElementById('cardContainer');
    nextBtn = document.getElementById('nextBtn');
    prevBtn = document.getElementById('prevBtn');
    if (nextBtn) nextBtn.addEventListener('click', () => container.scrollBy({ left: 270, behavior: 'smooth' }));
    if (prevBtn) prevBtn.addEventListener('click', () => container.scrollBy({ left: -270, behavior: 'smooth' }));


    // Initialize infrastructure section dots
    infraDots = document.querySelectorAll('.dot');
    infraSlides = document.querySelectorAll('.infrastruktur-slide');
    infraDots?.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-slide'));
            infraSlides.forEach(slide => slide.classList.remove('active'));
            infraDots.forEach(d => d.classList.remove('active'));
            infraSlides[index].classList.add('active');
            dot.classList.add('active');
        });
    });

    // Initialize Intersection Observer for scroll navigation
    contentScrollContainer = document.querySelector('.content');
    sections = document.querySelectorAll('.header, .map-section, .data-section, #informasi-section');
    navItems = document.querySelectorAll('.nav-item');
    if (contentScrollContainer) {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navItems?.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('onclick')?.includes(id)) item.classList.add('active');
                    });
                }
            });
        }, { root: contentScrollContainer, threshold: 0.5 }); // Trigger when 50% of section is visible

        sections?.forEach(section => observer.observe(section));
    }

    // Initialize the Leaflet map
    initMap();

    const geoJsonPromises = [];

    // --- Load LST (Land Surface Temperature) Layer ---
    geoJsonPromises.push(
        fetch("lst.tif")
            .then(r => {
                if (!r.ok) {
                    console.error(`Failed to fetch lst.tif: ${r.status} ${r.statusText}`);
                    throw new Error(`HTTP error! status: ${r.status}`);
                }
                return r.arrayBuffer();
            })
            .then(parseGeoraster) // Assumes parseGeoraster is available (e.g., from georaster library)
            .then(georaster => {
                // IMPORTANT: These min/max values should ideally be dynamically derived from your LST data
                // or accurately known from your data source. If they are incorrect, the colors will be off.
                const min = 41958.4430, max = 52242.1264; 
                lstLayer = new GeoRasterLayer({
                    georaster,
                    opacity: 0.8,
                    pixelValuesToColorFn: value => {
                        // Ensure value is a number before calculation
                        if (value == null || isNaN(value)) return null; 
                        
                        // Normalize the value between 0 and 1
                        const t = (value - min) / (max - min);

                        // Define color scale (e.g., blue to red for temperature)
                        if (t < 0.2) return "#313695"; // Dark Blue (Coolest)
                        else if (t < 0.4) return "#74add1"; // Light Blue
                        else if (t < 0.6) return "#fdae61"; // Orange
                        else if (t < 0.8) return "#f46d43"; // Red
                        else return "#a50026"; // Dark Red (Hottest)
                    }
                });
                overlays["LST (Temperatur Permukaan)"] = lstLayer;
                addLSTLegend(map);
            })
            .catch(err => console.error("LST layer loading error:", err))
    );

    // --- Define and load various GeoJSON layers ---
    const sources = [
        { url: 'asset/data-spasial/landcover_ar.geojson', name: 'LandCover', labelProp: 'REMARK' },
        { url: 'asset/data-spasial/jembatan_PT.geojson', name: 'Jembatan' },
        { url: 'asset/data-spasial/jalan.json', name: 'Jaringan Jalan' },
        { url: 'asset/data-spasial/pabrik.json', name: 'Pabrik', isPoint: true, labelProp: 'qBF1Pd' },
        { url: 'asset/data-spasial/bufferpabrik.geojson', name: 'Buffer Pabrik', labelProp: 'qBF1Pd' },
        { url: 'asset/data-spasial/Batas_Administrasi.geojson', name: 'Batas Administrasi', labelProp: 'WADMKC' },
        { url: 'asset/data-spasial/bangunan.geojson', name: 'Bangunan', isPoint: true }
    ];

    for (const src of sources) {
        geoJsonPromises.push(
            fetch(src.url)
                .then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch ${src.url}: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
                        throw new Error(`Invalid GeoJSON format for ${src.url}`);
                    }
                    const validFeatures = data.features.filter(f => f.geometry && f.geometry.coordinates?.length > 0);

                    const layer = L.geoJSON({ type: "FeatureCollection", features: validFeatures }, {
                        pointToLayer: (feature, latlng) => {
                            if (src.name === "Pabrik") {
                                return L.circleMarker(latlng, {
                                    radius: 6, fillColor: "rgb(255, 251, 0)", color: "rgb(0, 0, 0)", weight: 1, fillOpacity: 0.8
                                }).bindPopup(feature.properties?.[src.labelProp] || src.name);
                            }
                            if (src.name === "Bangunan") {
                                return L.circleMarker(latlng, {
                                    radius: 5, fillColor: "#a855f7", color: "#6b21a8", weight: 1, fillOpacity: 0.8
                                }).bindPopup("Bangunan");
                            }
                            if (src.name === "Jembatan") {
                                return L.circleMarker(latlng, {
                                    radius: 6, fillColor: "#005eff", color: "#000000", weight: 1, fillOpacity: 0.8
                                }).bindPopup(feature.properties?.[src.labelProp] || src.name);
                            }
                            return L.marker(latlng).bindPopup(feature.properties?.[src.labelProp] || src.name);
                        },
                        style: function(feature) {
                            if (src.name === "LandCover") {
                                switch (feature.properties.REMARK) {
                                    case 'Danau/Situ': case 'Empang': case 'Sungai': return { fillColor: "#0a208d", fillOpacity: 0.8, weight: 0.5, color: "#4065EB" };
                                    case 'Hutan Rimba': return { fillColor: "#067040", fillOpacity: 0.8, color: "#38A800" };
                                    case 'Perkebunan/Kebun': return { fillColor: "#5d4b08", fillOpacity: 0.8, color: "#E9FFBE" };
                                    case 'Permukiman dan Tempat Kegiatan': return { fillColor: "#a91b0b", fillOpacity: 0.8, weight: 0.5, color: "#FB0101" };
                                    case 'Sawah': return { fillColor: "#4ae268", fillOpacity: 0.8, weight: 0.5, color: "#4065EB" };
                                    case 'Semak Belukar': return { fillColor: "#FDFDFD", fillOpacity: 0.8, weight: 0.5, color: "#00A52F" };
                                    case 'Tanah Kosong/Gundul': return { fillColor: "#95a5a6", fillOpacity: 0.8, weight: 0.5, color: "#000000" };
                                    case 'Tegalan/Ladang': return { fillColor: "#f5a623", fillOpacity: 0.8, color: "#EDFF85" };
                                    case 'Vegetasi Non Budidaya Lainnya': return { fillColor: "#000000", fillOpacity: 0.8, weight: 0.5, color: "#000000" };
                                    default: return { fillColor: "#CCCCCC", fillOpacity: 0.5, color: "#999999" };
                                }
                            } else if (src.name === "Jaringan Jalan") {
                                return { color: "#a50026", weight: 3, opacity: 0.7 };
                            } else if (src.name === "Buffer Pabrik") {
                                return { color: "#8000FF", weight: 2, opacity: 0.8, dashArray: "4,4", fillColor: "#d1b3ff", fillOpacity: 0.3 };
                            } else if (src.name === "Batas Administrasi") {
                                return { color: "#450111", weight: 1, opacity: 1, dashArray: "2,4", fillOpacity: 0 };
                            }
                            return {};
                        },
                        onEachFeature: (feature, layer) => layer.bindPopup(feature.properties?.[src.labelProp] || src.name)
                    });
                    overlays[src.name] = layer;
                })
                .catch(err => {
                    console.error(`Error loading ${src.url}:`, err.message);
                })
        );
    }

    await Promise.all(geoJsonPromises);

    // Remove existing layer control before adding a new one to prevent duplicates
    if (map.hasControl && layerControl && map.hasControl(layerControl)) {
        map.removeControl(layerControl);
    }
    layerControl = L.control.layers(basemapLayers, overlays).addTo(map);

    // Add Leaflet Locate and Fullscreen controls
    L.control.locate({ setView: 'untilPan', flyTo: true }).addTo(map);
    map.addControl(new L.Control.Fullscreen());

    // Add combined legend
    addCombinedLegend(map);

    // Fetch weather and AQI data on load and set up interval for updates
    fetchRealtimeWeatherAndAQI();
    setInterval(fetchRealtimeWeatherAndAQI, 600000); // Update every 10 minutes (600000 ms)

    // Add specific overlay layers to the map by default
    ["LST (Temperatur Permukaan)", "Batas Administrasi"].forEach(key => {
        overlays[key]?.addTo(map);
    });
});