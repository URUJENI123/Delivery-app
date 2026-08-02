declare module 'openrouteservice-js' {
  interface OrsOptions {
    api_key?: string;
    host?: string;
  }

  interface DirectionParams {
    coordinates: [number, number][];
    profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'cycling-mountain' | 'cycling-road' | 'cycling-electric' | 'foot-walking' | 'foot-hiking' | 'wheelchair';
    format?: 'json' | 'geojson';
    maneuvers?: boolean;
    instructions?: boolean;
    extra_info?: string[];
    avoidables?: string[];
    avoid_polygons?: any;
    restrictions?: Record<string, any>;
    preference?: 'fastest' | 'shortest' | 'recommended';
    units?: 'km' | 'mi';
    language?: string;
  }

  interface GeocodeParams {
    text: string;
    boundary_country?: string[];
    boundary_circle?: { lat_lng: [number, number]; radius: number };
    boundary_bbox?: [[number, number], [number, number]];
    size?: number;
  }

  interface ReverseGeocodeParams {
    point: { lat_lng: [number, number]; radius?: number };
    boundary_country?: string[];
    size?: number;
  }

  interface IsochronesParams {
    locations: [number, number][];
    profile?: string;
    range: number[];
    range_type?: 'time' | 'distance';
    units?: 'km' | 'mi';
    attributes?: string[];
    smoothing?: number;
    avoidables?: string[];
    avoid_polygons?: any;
    area_units?: 'km' | 'mi';
  }

  interface MatrixParams {
    locations: [number, number][];
    profile?: string;
    sources?: number[] | 'all';
    destinations?: number[] | 'all';
    metrics?: string[];
    units?: 'km' | 'mi';
  }

  class Directions {
    constructor(options: OrsOptions);
    calculate(params: DirectionParams): Promise<any>;
  }

  class Geocode {
    constructor(options: OrsOptions);
    geocode(params: GeocodeParams): Promise<any>;
    reverseGeocode(params: ReverseGeocodeParams): Promise<any>;
    structuredGeocode(params: Record<string, any>): Promise<any>;
  }

  class Isochrones {
    constructor(options: OrsOptions);
    calculate(params: IsochronesParams): Promise<any>;
  }

  class Matrix {
    constructor(options: OrsOptions);
    calculate(params: MatrixParams): Promise<any>;
  }

  class Pois {
    constructor(options: OrsOptions);
  }

  class Elevation {
    constructor(options: OrsOptions);
  }

  class Optimization {
    constructor(options: OrsOptions);
    optimize(params: any): Promise<any>;
  }

  class Snap {
    constructor(options: OrsOptions);
    calculate(params: any): Promise<any>;
  }

  const Openrouteservice: {
    Directions: typeof Directions;
    Geocode: typeof Geocode;
    Isochrones: typeof Isochrones;
    Matrix: typeof Matrix;
    Pois: typeof Pois;
    Elevation: typeof Elevation;
    Optimization: typeof Optimization;
    Snap: typeof Snap;
  };

  export default Openrouteservice;
}
