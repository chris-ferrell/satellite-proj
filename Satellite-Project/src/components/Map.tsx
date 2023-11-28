// MapComponent.jsx
import { useEffect } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

const MapComponent = () => {
    useEffect(() => {
        // Create a new map
        const map = new Map({
            target: "map",
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        });

        return () => {
            // Cleanup resources on component unmount
            map.dispose();
        };
    }, []); // Empty dependency array to run the effect only once

    return <div id="map" style={{ width: "100%", height: "400px" }}></div>;
};

export default MapComponent;
