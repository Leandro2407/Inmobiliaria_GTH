// src/components/common/MapaSelector.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FormControl, InputGroup } from 'react-bootstrap';

const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Se asegura de cargar la librería 'places'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const MapaSelector = ({ initialLat = null, initialLng = null, initialAddress = '', onLocationChange }) => {
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const markerRef = useRef(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const [addressInput, setAddressInput] = useState(initialAddress || '');
  
  // Tu API Key proporcionada
  const apiKey = 'AIzaSyDhzswRgUzNBlXIV9WHnp7pii_xLRt4LNg';

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!apiKey) {
      console.warn('MapaSelector: falta API Key de Google Maps');
      return;
    }

    let map;
    let autocomplete;

    loadGoogleMapsScript(apiKey)
      .then((google) => {
        // Coordenadas por defecto (Salta)
        const defaultPosition = {
          lat: initialLat ? parseFloat(initialLat) : -24.7821,
          lng: initialLng ? parseFloat(initialLng) : -65.4232,
        };

        map = new google.maps.Map(mapRef.current, {
          center: defaultPosition,
          zoom: initialLat && initialLng ? 16 : 12,
        });

        markerRef.current = new google.maps.Marker({
          position: defaultPosition,
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });

        // Evento: al arrastrar el marcador
        markerRef.current.addListener('dragend', async () => {
          const pos = markerRef.current.getPosition();
          const lat = pos.lat();
          const lng = pos.lng();
          const geocoder = new google.maps.Geocoder();
          try {
            const result = await geocoder.geocode({ location: { lat, lng } });
            const address = result && result.results[0] ? result.results[0].formatted_address : '';

            let barrio = '';
            let ciudad = '';
            if (result && result.results[0]) {
              const components = result.results[0].address_components;
              components.forEach(c => {
                if (c.types.includes('sublocality') || c.types.includes('neighborhood')) barrio = barrio || c.long_name;
                if (c.types.includes('locality')) ciudad = ciudad || c.long_name;
              });
            }

            setAddressInput(address);
            if (onLocationChangeRef.current) {
              onLocationChangeRef.current({ lat, lng, address, barrio, ciudad });
            }
          } catch (err) {
            console.error("Geocoding error:", err);
            setAddressInput('');
            if (onLocationChangeRef.current) {
              onLocationChangeRef.current({ lat, lng });
            }
          }
        });

        // Autocompletado
        autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
          componentRestrictions: { country: "ar" } // Limitar a Argentina
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || searchRef.current.value;

          map.setCenter({ lat, lng });
          map.setZoom(16);
          markerRef.current.setPosition({ lat, lng });

          let barrio = '';
          let ciudad = '';
          if (place.address_components) {
            place.address_components.forEach(c => {
              if (c.types.includes('sublocality') || c.types.includes('neighborhood')) barrio = barrio || c.long_name;
              if (c.types.includes('locality')) ciudad = ciudad || c.long_name;
            });
          }

          setAddressInput(address);
          if (onLocationChangeRef.current) {
            onLocationChangeRef.current({ lat, lng, address, barrio, ciudad });
          }
        });
      })
      .catch((err) => {
        console.error('Error cargando Google Maps:', err);
      });

  }, [apiKey, initialLat, initialLng]);

  return (
    <div>
      <InputGroup className="mb-2">
        <FormControl
          placeholder="Buscar dirección (Ej: Avenida Belgrano 1234, Salta)..."
          aria-label="Buscar dirección"
          ref={searchRef}
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
      </InputGroup>
      <div ref={mapRef} style={{ width: '100%', height: '350px', borderRadius: 6, overflow: 'hidden', border: '1px solid #ddd' }} />
      <small className="text-muted">
        Tip: Escribe la dirección completa o arrastra el marcador rojo en el mapa para mayor precisión.
      </small>
    </div>
  );
};

export default MapaSelector;