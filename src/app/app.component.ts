import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { HexagonService } from './hexagon.service';
import {Feature} from 'geojson';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<div id="map"></div>`,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private map!: L.Map;
  private currentHexLayer: L.LayerGroup | undefined;
  title: string = 'angular-hexagon';
  polygonsData: Array<{ id: number, COLOR_HEX: string }> = [];

  constructor(
    private http: HttpClient,
    private hexagonService: HexagonService
  ) {}

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
    });
  }

  private getColorForPolygon(id: number): string {
    const polygonData = this.polygonsData.find(p => p.id === id);
    return polygonData ? polygonData.COLOR_HEX : '#000000';
  }

  private initMap(): void {
    this.map = L.map('map').setView([48.9225, 24.7110], 16);
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

  private drawHexagons(): void {
    const zoomLevel = this.map.getZoom();
    const resolution = this.hexagonService.getResolutionFromZoom(zoomLevel);
    const bounds = this.map.getBounds();

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
      polygons.forEach(({ polygon, color }) => {
        const hexagons = this.hexagonService.getHexagons(polygon, resolution);
        const filteredHexagons = this.hexagonService.filterHexagons(hexagons, bounds);

        if (filteredHexagons.length > 0) {
          const multiPolygonFeature = this.hexagonService.convertToMultiPolygonFeature(filteredHexagons);

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
