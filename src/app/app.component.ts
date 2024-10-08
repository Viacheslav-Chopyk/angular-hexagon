import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import L from 'leaflet';
import geojson2h3 from 'geojson2h3';
import {Feature} from 'geojson';
import {HttpClient} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private map!: L.Map;
  private currentHexLayer: L.LayerGroup | undefined;
  title: string = 'angular-test';
  polygonsData: Array<{ id: number, COLOR_HEX: string }> = [];

  constructor(
    private http: HttpClient
  ) {
  }

  ngOnInit() {
    this.initMap();
    this.map.on('zoomend', this.onZoomEnd.bind(this));
    this.loadPolygonsData();
  }

  public loadPolygonsData(): void {
    this.http.get<Array<{ id: number, COLOR_HEX: string }>>('assets/data.json').pipe(
      catchError(error => {
        console.error('Delivery problem:', error);
        return throwError(() => new Error('Oops! Something went wrong. Please try again later.'));
      })
    ).subscribe(res => {
      this.polygonsData = res;
      this.drawHexagons();
    })
  }

  private getColorForPolygon(id: number): string {
    const polygonData = this.polygonsData.find(p => p.id === id);
    return polygonData ? polygonData.COLOR_HEX : '#000000';
  }

  private initMap(): void {
    this.map = L.map('map').setView([48.9225, 24.7110], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);
  }

  private onZoomEnd(): void {
    if (this.currentHexLayer) {
      this.map.removeLayer(this.currentHexLayer);
    }
    this.drawHexagons();
  }

  private getResolutionFromZoom(zoom: number): number {
    if (zoom >= 18) return 12;
    if (zoom >= 16) return 11;
    if (zoom >= 14) return 10;
    if (zoom >= 12) return 9;
    if (zoom >= 10) return 8;
    if (zoom >= 7) return 5;
    if (zoom >= 5) return 4;
    return 3;
  }

  private drawHexagons(): void {
    const zoomLevel = this.map.getZoom();
    const resolution = this.getResolutionFromZoom(zoomLevel);
    const polygons: Array<{ polygon: Feature, color: string }> = [
      {
        polygon: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [24.7100, 48.9220],
              [24.7105, 48.9225],
              [24.7110, 48.9230],
              [24.7115, 48.9225],
              [24.7110, 48.9220],
              [24.7100, 48.9220]
            ]]
          }
        },
        color: this.getColorForPolygon(1)
      },
      {
        polygon: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [24.7090, 48.9210],
              [24.7095, 48.9215],
              [24.7100, 48.9220],
              [24.7105, 48.9215],
              [24.7100, 48.9210],
              [24.7090, 48.9210]
            ]]
          }
        },
        color: this.getColorForPolygon(2)
      },
      {
        polygon: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [24.7120, 48.9240],
              [24.7125, 48.9245],
              [24.7130, 48.9250],
              [24.7120, 48.9255],
              [24.7125, 48.9250],
              [24.7120, 48.9240]
            ]]
          }
        },
        color: this.getColorForPolygon(3)
      }
    ];

    const hexLayer = L.layerGroup();
    try {
      polygons.forEach(({polygon, color}) => {
        const hexagons = geojson2h3.featureToH3Set(polygon, resolution, {ensureOutput: true});

        if (hexagons.length > 0) {
          const multiPolygonFeature = geojson2h3.h3SetToMultiPolygonFeature(hexagons);

          L.geoJSON(multiPolygonFeature, {
            style: {
              color: color,
              fillOpacity: 0.5
            }
          }).addTo(hexLayer);
        }
      });

      hexLayer.addTo(this.map);
      this.currentHexLayer = hexLayer;
    } catch (error) {
      console.error('Error drawing hexagons:', error);
    }
  }
}
