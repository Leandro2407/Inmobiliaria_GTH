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
  // Usamos una referencia para el callback para evitar recargar el mapa si la función cambia
  const onLocationChangeRef = useRef(onLocationChange);
  const [addressInput, setAddressInput] = useState(initialAddress || '');
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Actualizamos la referencia cada vez que cambia la prop
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!apiKey) {
      console.warn('MapaSelector: falta REACT_APP_GOOGLE_MAPS_API_KEY en .env');
      return;
    }

    let map;
    let autocomplete;

    loadGoogleMapsScript(apiKey)
      .then((google) => {
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
        });

        markerRef.current.addListener('dragend', async () => {
          const pos = markerRef.current.getPosition();
          const lat = pos.lat();
          const lng = pos.lng();
          const geocoder = new google.maps.Geocoder();
          try {
            const result = await geocoder.geocode({ location: { lat, lng } });
            const address = result && result[0] ? result[0].formatted_address : '';

            let barrio = '';
            let ciudad = '';
            if (result && result[0]) {
              const components = result[0].address_components;
              components.forEach(c => {
                if (c.types.includes('sublocality') || c.types.includes('neighborhood')) barrio ||= c.long_name;
                if (c.types.includes('locality')) ciudad ||= c.long_name;
              });
            }

            setAddressInput(address);
            // Usamos la referencia .current para llamar a la función
            if (onLocationChangeRef.current) {
                onLocationChangeRef.current({ lat, lng, address, barrio, ciudad });
            }
          } catch (err) {
            setAddressInput('');
            if (onLocationChangeRef.current) {
                onLocationChangeRef.current({ lat, lng });
            }
          }
        });

        autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["geocode"],
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
              if (c.types.includes('sublocality') || c.types.includes('neighborhood')) barrio ||= c.long_name;
              if (c.types.includes('locality')) ciudad ||= c.long_name;
            });
          }

          setAddressInput(address);
          // Usamos la referencia .current para llamar a la función
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
          placeholder="Buscar dirección..."
          aria-label="Buscar dirección"
          ref={searchRef}
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
      </InputGroup>
      <div ref={mapRef} style={{ width: '100%', height: '350px', borderRadius: 6, overflow: 'hidden' }} />
    </div>
  );
};

export default MapaSelector;