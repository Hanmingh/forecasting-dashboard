import React, { useEffect, useRef } from 'react';

interface MapProps {
  width?: string | number;
  height?: string | number;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  names?: boolean;
  mmsi?: string;
  imo?: string;
  showTrack?: boolean;
  fleet?: string;
  fleetName?: string;
  fleetTimespan?: number;
  clickToActivate?: boolean;
  storePosition?: boolean;
  defaultMaptype?: number;
  className?: string;
  style?: React.CSSProperties;
}

const Map: React.FC<MapProps> = ({
  width = "100%",
  height = 600,
  latitude,
  longitude,
  zoom,
  names = false,
  mmsi,
  imo,
  showTrack = false,
  fleet,
  fleetName,
  fleetTimespan,
  clickToActivate = false,
  storePosition = true,
  defaultMaptype,
  className,
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const parseWidth = (w: string | number) => {
      const ws = w.toString();
      if (ws.includes('%')) {
        return ws;
      } else {
        const intWidth = parseInt(ws);
        return intWidth < 480 ? 480 : intWidth;
      }
    };

    const parseHeight = (h: string | number) => {
      const intHeight = parseInt(h.toString());
      return intHeight < 400 ? 400 : intHeight;
    };

    const buildIframeUrl = () => {
      const parsedWidth = parseWidth(width);
      const parsedHeight = parseHeight(height);
      
      let referrer = window.location.href;
      if (referrer.indexOf('file://') >= 0 || referrer.indexOf('file%3A%2F%2F') >= 0) {
        referrer = 'testingonly';
      }
      referrer = encodeURIComponent(referrer);

      let url = 'https://www.vesselfinder.com/aismap?';
      
      const params: string[] = [];
      
      params.push(`zoom=${zoom !== undefined ? zoom : 'undefined'}`);
      params.push(`lat=${latitude !== undefined ? latitude : 'undefined'}`);
      params.push(`lon=${longitude !== undefined ? longitude : 'undefined'}`);
      params.push(`width=${encodeURIComponent(parsedWidth.toString())}`);
      params.push(`height=${encodeURIComponent(parsedHeight.toString())}`);
      params.push(`names=${names}`);
      
      if (mmsi !== undefined) {
        params.push(`mmsi=${mmsi}`);
      }
      
      if (imo !== undefined) {
        params.push(`imo=${imo}`);
      }
      
      params.push(`track=${showTrack}`);
      
      if (fleet !== undefined && fleet.indexOf('@') < 0) {
        params.push(`fleet=${fleet}`);
      } else {
        params.push('fleet=false');
      }
      
      if (fleetName !== undefined && fleetName.indexOf('@') < 0) {
        params.push(`fleet_name=${encodeURIComponent(fleetName)}`);
      } else {
        params.push('fleet_name=false');
      }
      
      if (fleetTimespan !== undefined) {
        params.push(`fleet_timespan=${fleetTimespan}`);
      }
      
      params.push(`clicktoact=${clickToActivate}`);
      params.push(`store_pos=${storePosition}`);
      
      if (defaultMaptype !== undefined) {
        params.push(`default_maptype=${defaultMaptype}`);
      }
      
      params.push(`ra=${referrer}`);
      
      return url + params.join('&');
    };

    const createIframe = () => {
      const iframeUrl = buildIframeUrl();
      const parsedWidth = parseWidth(width);
      const parsedHeight = parseHeight(height);
      
      const iframe = document.createElement('iframe');
      iframe.name = 'vesselfinder';
      iframe.id = 'vesselfinder';
      iframe.width = parsedWidth.toString();
      iframe.height = parsedHeight.toString();
      iframe.frameBorder = '0';
      iframe.src = iframeUrl;
      iframe.style.border = '1px solid #e5e7eb';
      iframe.style.borderRadius = '8px';
      
      iframe.innerHTML = 'Browser does not support embedded objects.<br/>Visit directly <a href="https://www.vesselfinder.com" target="_blank">www.vesselfinder.com</a>';
      
      return iframe;
    };

    const container = containerRef.current;
    container.innerHTML = '';
    const iframe = createIframe();
    container.appendChild(iframe);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [width, height, latitude, longitude, zoom, names, mmsi, imo, showTrack, fleet, fleetName, fleetTimespan, clickToActivate, storePosition, defaultMaptype]);

  return (
    <div 
      ref={containerRef}
      className={className}
      style={style}
    />
  );
};

export const VESSELS = {
  EVER_GIVEN: { mmsi: '636023000', imo: '9506291', name: 'Ever Given' },
  MSC_OSCAR: { mmsi: '538006612', imo: '9705834', name: 'MSC Oscar' },
  HARMONY_OF_SEAS: { mmsi: '229767000', imo: '9682875', name: 'Harmony of the Seas' },
  SYMPHONY_OF_SEAS: { mmsi: '249047000', imo: '9744001', name: 'Symphony of the Seas' },
};

export const AREAS = {
  SINGAPORE: { lat: 1.29, lon: 103.85, zoom: 10, name: '新加坡港' },
  SUEZ_CANAL: { lat: 30.5, lon: 32.35, zoom: 8, name: '苏伊士运河' },
  ENGLISH_CHANNEL: { lat: 50.9, lon: 1.4, zoom: 7, name: '英吉利海峡' },
  GLOBAL: { lat: 25.0, lon: 55.0, zoom: 3, name: '全球视图' },
};

interface AdvancedMapProps extends MapProps {
  showControls?: boolean;
  onVesselSelect?: (vessel: typeof VESSELS[keyof typeof VESSELS]) => void;
  onAreaSelect?: (area: typeof AREAS[keyof typeof AREAS]) => void;
}

export const AdvancedMap: React.FC<AdvancedMapProps> = ({
  showControls = true,
  onVesselSelect,
  onAreaSelect,
  ...mapProps
}) => {
  const [selectedVessel, setSelectedVessel] = React.useState<string>('');
  const [selectedArea, setSelectedArea] = React.useState<string>('GLOBAL');
  const [currentProps, setCurrentProps] = React.useState(mapProps);

  const handleVesselChange = (vesselKey: string) => {
    if (vesselKey === '') {
      setSelectedVessel('');
      setCurrentProps(prev => ({
        ...prev,
        mmsi: undefined,
        imo: undefined,
      }));
    } else {
      const vessel = VESSELS[vesselKey as keyof typeof VESSELS];
      if (vessel) {
        setSelectedVessel(vesselKey);
        setCurrentProps(prev => ({
          ...prev,
          mmsi: vessel.mmsi,
          imo: vessel.imo,
        }));
        onVesselSelect?.(vessel);
      }
    }
  };

  const handleAreaChange = (areaKey: string) => {
    const area = AREAS[areaKey as keyof typeof AREAS];
    if (area) {
      setSelectedArea(areaKey);
      setCurrentProps(prev => ({
        ...prev,
        latitude: area.lat,
        longitude: area.lon,
        zoom: area.zoom,
      }));
      onAreaSelect?.(area);
    }
  };

  return (
    <div>
      {showControls && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* 区域选择 */}
          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold', color: '#374151' }}>
              区域:
            </label>
            <select
              value={selectedArea}
              onChange={(e) => handleAreaChange(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
              }}
            >
              {Object.entries(AREAS).map(([key, area]) => (
                <option key={key} value={key}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* 船舶选择 */}
          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold', color: '#374151' }}>
              追踪船舶:
            </label>
            <select
              value={selectedVessel}
              onChange={(e) => handleVesselChange(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
              }}
            >
              <option value="">显示所有船舶</option>
              {Object.entries(VESSELS).map(([key, vessel]) => (
                <option key={key} value={key}>
                  {vessel.name}
                </option>
              ))}
            </select>
          </div>

          {/* 显示航迹 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="showTrack"
              checked={currentProps.showTrack || false}
              onChange={(e) => setCurrentProps(prev => ({ ...prev, showTrack: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="showTrack" style={{ color: '#374151' }}>
              显示航迹
            </label>
          </div>

          {/* 显示船名 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="showNames"
              checked={currentProps.names || false}
              onChange={(e) => setCurrentProps(prev => ({ ...prev, names: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="showNames" style={{ color: '#374151' }}>
              显示船名
            </label>
          </div>
        </div>
      )}

      <Map {...currentProps} />
    </div>
  );
};

export default Map;