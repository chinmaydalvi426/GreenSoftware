// Initialize Mapbox with access token
let mapaccesstoken = mapToken;
mapboxgl.accessToken = mapaccesstoken;

// Check if the map container exists and listing has valid geometry
if (document.getElementById('map') && listing && listing.geometry && listing.geometry.coordinates) {
    // Create responsive map
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: listing.geometry.coordinates,
        zoom: 12,
        scrollZoom: false // Disable scroll zoom for better mobile experience
    });

    // Add map controls
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
    }), 'bottom-right');

    // Add marker with popup
    const marker = new mapboxgl.Marker({
        color: '#fe424d',
        scale: 1.2
    })
    .setLngLat(listing.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: true,
            maxWidth: '300px'
        })
        .setHTML(`
            <div style="text-align: center;">
                <h5 style="margin-bottom: 5px; color: #333;">${listing.title}</h5>
                <p style="margin: 0; color: #666;">${listing.location}</p>
            </div>
        `)
    )
    .addTo(map);

    // Open popup by default
    marker.togglePopup();

    // Adjust map on window resize for responsiveness
    window.addEventListener('resize', () => {
        map.resize();
    });

    // Add event listener to recenter map when container becomes visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                map.resize();
                map.flyTo({
                    center: listing.geometry.coordinates,
                    zoom: 12,
                    essential: true
                });
            }
        });
    }, { threshold: 0.1 });

    observer.observe(document.getElementById('map'));
}