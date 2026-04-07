// Location tracking (frontend)

class LocationService {
    constructor() {
        this.currentLocation = null;
        this.hasPermission = false;
        this.currentContractorId = null;
    }
    
    
     //Request location permission from user
     
    async requestPermission() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.hasPermission = true;
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    resolve(this.currentLocation);
                },
                (error) => {
                    this.hasPermission = false;
                    let errorMessage = 'Location permission denied';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Please allow location access to use this feature';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }
    
    /**
     * Update contractor location (for freelancers/contractors)
     * @param {number} contractorId - The contractor's ID
     * @param {string} serviceArea - City/area name
     */
    async updateContractorLocation(contractorId, serviceArea) {
        if (!this.hasPermission || !this.currentLocation) {
            throw new Error('Location permission not granted');
        }
        
        const response = await fetch(`/contractor/${contractorId}/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_area: serviceArea,
                latitude: this.currentLocation.latitude,
                longitude: this.currentLocation.longitude
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update location');
        }
        
        this.currentContractorId = contractorId;
        return data;
    }
    
    /**
     * Get a contractor's location
     * @param {number} contractorId - The contractor's ID
     */
    async getContractorLocation(contractorId) {
        const response = await fetch(`/contractor/${contractorId}/location`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get location');
        }
        
        return data;
    }
    
    /**
     * Find contractors near current location
     * @param {number} radius - Search radius in miles (default: 25)
     */
    async findNearbyContractors(radius = 25) {
        if (!this.hasPermission || !this.currentLocation) {
            throw new Error('Location permission not granted');
        }
        
        const response = await fetch(
            `/contractors/nearby?lat=${this.currentLocation.latitude}&lon=${this.currentLocation.longitude}&radius=${radius}`
        );
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to find nearby contractors');
        }
        
        return data;
    }
    
    /**
     * Get current location (without requesting permission again)
     */
    getCurrentLocation() {
        return this.currentLocation;
    }
    
    /**
     * Check if location permission is already granted
     */
    async checkPermission() {
        if (!navigator.permissions) {
            return this.hasPermission;
        }
        
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            this.hasPermission = permissionStatus.state === 'granted';
            
            permissionStatus.onchange = () => {
                this.hasPermission = permissionStatus.state === 'granted';
                if (this.hasPermission) {
                    // Re-get location if permission was just granted
                    this.requestPermission().catch(console.error);
                }
            };
            
            return this.hasPermission;
        } catch (error) {
            console.error('Error checking permission:', error);
            return this.hasPermission;
        }
    }
}

// Create global instance
const locationService = new LocationService();
