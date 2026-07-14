export const TRADE_ROUTES_CONFIG = [
    {
        id: 'vulcan_gaia',
        planetAId: 'planet_vulcan',
        planetBId: 'planet_gaia',
        color: '#00ffaa',      // Vibrant cyan-green energy lane
        width: 250,            // Width of the corridor in world space
        speedMultiplier: 2.5   // 150% speed increase
    },
    {
        id: 'vulcan_home',
        planetAId: 'planet_vulcan',
        planetBId: 'planet_home',
        color: '#4db8ff',      // Sleek blue energy lane
        width: 250,            // Width of the corridor in world space
        speedMultiplier: 2.5   // 150% speed increase
    },
    // DEEP SPACE STATION HIGHWAYS
    {
        id: 'ds1_ds2',
        planetAId: 'station_ds1',
        planetBId: 'station_ds2',
        color: '#8a2be2',      // Deep purple energy lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds2_ds3',
        planetAId: 'station_ds2',
        planetBId: 'station_ds3',
        color: '#aa22ff',      // Electric indigo lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds3_ds4',
        planetAId: 'station_ds3',
        planetBId: 'station_ds4',
        color: '#ff00ff',      // Magenta neon lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds4_ds5',
        planetAId: 'station_ds4',
        planetBId: 'station_ds5',
        color: '#00e5ff',      // Bright cyan lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds5_ds6',
        planetAId: 'station_ds5',
        planetBId: 'station_ds6',
        color: '#1565c0',      // Deep sapphire blue lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds6_ds7',
        planetAId: 'station_ds6',
        planetBId: 'station_ds7',
        color: '#4fc3f7',      // Sky blue energy lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds7_ds8',
        planetAId: 'station_ds7',
        planetBId: 'station_ds8',
        color: '#673ab7',      // Violet highway
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds8_ds9',
        planetAId: 'station_ds8',
        planetBId: 'station_ds9',
        color: '#3f51b5',      // Royal blue lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds9_ds10',
        planetAId: 'station_ds9',
        planetBId: 'station_se_5', // Deep Space 10
        color: '#ff2244',      // Contested red-purple lane
        width: 250,
        speedMultiplier: 2.5
    },
    {
        id: 'ds10_ds11',
        planetAId: 'station_se_5',  // Deep Space 10
        planetBId: 'station_blob_3', // Deep Space 11
        color: '#09ab29',      // Acid green lane bordering Blob Space
        width: 250,
        speedMultiplier: 2.5
    }
];
