import { Injectable } from '@angular/core';
import { Feature } from 'geojson';
import { h3ToGeo } from 'h3-js';
import L from 'leaflet';
import * as geojson2h3 from 'geojson2h3';

@Injectable({
  providedIn: 'root'
})
export class HexagonService {

  private readonly zoomToResolutionMap: { [key: number]: number } = {
    19: 13, 18: 12, 17: 11, 16: 11, 15: 10, 14: 10,
    13: 9, 12: 9, 11: 7, 10: 7, 9: 6, 8: 6,
    7: 5, 6: 5, 5: 4, 4: 4, 3: 4
  };

  constructor() {}

  public getResolutionFromZoom(zoom: number): number {
    return this.zoomToResolutionMap[zoom] || 4;
  }

  public getHexagons(polygon: Feature, resolution: number): string[] {
    return geojson2h3.featureToH3Set(polygon, resolution, { ensureOutput: true });
  }

  public filterHexagons(hexagons: string[], bounds: L.LatLngBounds): string[] {
    return hexagons.filter(hex => {
      const [lat, lon] = h3ToGeo(hex);
      return lat >= bounds.getSouthWest().lat && lat <= bounds.getNorthEast().lat &&
        lon >= bounds.getSouthWest().lng && lon <= bounds.getNorthEast().lng;
    });
  }

  public convertToMultiPolygonFeature(hexagons: string[]): Feature {
    return geojson2h3.h3SetToMultiPolygonFeature(hexagons);
  }
}
