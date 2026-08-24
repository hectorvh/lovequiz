import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, PrimaryButton, Tag } from '../components/ui';
import { HECTOR_HOME_COORDS } from '../data/questions';
import { formatKilometers, formatMeters, haversineDistanceMeters } from '../lib/distance';

/**
 * Esri's shaded relief basemap: terrain only, with no country, city or street
 * labels, which is what makes the question a fair guess.
 */
const TERRAIN_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';

const pinIcon = (emoji: string) =>
  L.divIcon({
    html: `<span style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">${emoji}</span>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  });

/** Untimed and unscored by design: it touches neither hearts nor punishments. */
export default function BonusMapQuestion({ onContinue }: { onContinue: (meters: number) => void }) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [picked, setPicked] = useState<L.LatLng | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 1,
      minZoom: 1,
      worldCopyJump: true,
      attributionControl: true,
    });

    L.tileLayer(TERRAIN_TILES, {
      maxZoom: 13,
      attribution: 'Tiles &copy; Esri — Source: Esri, USGS, NOAA',
    }).addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => {
      setPicked(event.latlng);
      if (markerRef.current) {
        markerRef.current.setLatLng(event.latlng);
      } else {
        markerRef.current = L.marker(event.latlng, { icon: pinIcon('📍') }).addTo(map);
      }
    });

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const confirm = () => {
    if (!picked || !mapRef.current) return;

    const meters = haversineDistanceMeters(
      { lat: picked.lat, lng: picked.lng },
      HECTOR_HOME_COORDS,
    );
    setDistance(meters);

    const target = L.latLng(HECTOR_HOME_COORDS.lat, HECTOR_HOME_COORDS.lng);
    L.marker(target, { icon: pinIcon('🏠') }).addTo(mapRef.current);
    L.polyline([picked, target], {
      color: '#d9a441',
      weight: 2,
      dashArray: '5 6',
    }).addTo(mapRef.current);
    mapRef.current.fitBounds(L.latLngBounds([picked, target]).pad(0.35));
  };

  const answered = distance !== null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden !p-3.5">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <Tag>{t('bonus.tag')}</Tag>
        </div>

        <p className="font-display mb-2 shrink-0 text-[clamp(0.95rem,2.5vh,1.15rem)] leading-snug text-ink">
          {t('bonus.prompt')}
        </p>

        <div
          ref={containerRef}
          className="min-h-40 w-full flex-1 overflow-hidden rounded-2xl border border-card-line"
        />

        {answered ? (
          <div className="animate-rise mt-2 shrink-0 rounded-xl bg-good-bg px-3 py-2 text-[12px] leading-snug text-[#204623]">
            <p className="font-semibold">
              {t('bonus.resultKm', { km: formatKilometers(distance, i18n.language) })}
            </p>
            <p>{t('bonus.resultM', { m: formatMeters(distance, i18n.language) })}</p>
            <p className="mt-1 opacity-80">{t('bonus.reveal')}</p>
          </div>
        ) : (
          <p className="mt-2 shrink-0 text-center text-[11.5px] text-ink-soft">{t('bonus.hint')}</p>
        )}

        <div className="mt-2 shrink-0">
          {answered ? (
            <PrimaryButton onClick={() => onContinue(distance)}>
              {t('common.continue')}
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={confirm} disabled={!picked}>
              {t('common.accept')}
            </PrimaryButton>
          )}
        </div>
      </Card>
    </div>
  );
}
