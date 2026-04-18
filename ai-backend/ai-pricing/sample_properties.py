import json

def get_sample_properties():
    return [
        {
            "id": 1,
            "type": "Luxury apartment",
            "title": "Palo Alto Residences",
            "address": "Bandra West, Mumbai, Maharashtra",
            "features": {
                "area": 3500,
                "bedrooms": 4,
                "distance_to_metro": 1.0,
                "age": 2,
                "floor": 25,
                "amenities": 5
            },
            "description": "High-end luxury apartment with panoramic sea views and top-notch amenities.",
            "image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop"
        },
        {
            "id": 2,
            "type": "Budget studio",
            "title": "Sai Kripa Apartments",
            "address": "Andheri East, Mumbai, Maharashtra",
            "features": {
                "area": 550,
                "bedrooms": 1,
                "distance_to_metro": 8.5,
                "age": 10,
                "floor": 2,
                "amenities": 1
            },
            "description": "Cozy and affordable studio apartment ideal for bachelors.",
            "image_url": "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=1000&auto=format&fit=crop"
        },
        {
            "id": 3,
            "type": "Family home",
            "title": "Lakeview Enclave",
            "address": "HSR Layout, Bengaluru, Karnataka",
            "features": {
                "area": 1500,
                "bedrooms": 3,
                "distance_to_metro": 3.0,
                "age": 8,
                "floor": 6,
                "amenities": 3
            },
            "description": "Spacious mid-range family home situated in a peaceful neighborhood.",
            "image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000&auto=format&fit=crop"
        },
        {
            "id": 4,
            "type": "Commercial property",
            "title": "Cyber Hub Towers",
            "address": "DLF Phase 2, Gurugram, Haryana",
            "features": {
                "area": 2500,
                "bedrooms": 0,
                "distance_to_metro": 0.5,
                "age": 5,
                "floor": 12,
                "amenities": 4
            },
            "description": "Premium office space in a prime commercial hub.",
            "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop"
        },
        {
            "id": 5,
            "type": "Vacation property",
            "title": "Silver Sands Villa",
            "address": "Calangute, Goa",
            "features": {
                "area": 4000,
                "bedrooms": 5,
                "distance_to_metro": 20.0,
                "age": 3,
                "floor": 0,
                "amenities": 5
            },
            "description": "Beautiful vacation villa with a private pool and beach access.",
            "image_url": "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1000&auto=format&fit=crop"
        }
    ]

if __name__ == "__main__":
    properties = get_sample_properties()
    print(json.dumps(properties, indent=4))
