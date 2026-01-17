import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DATABASE", "cannon_db")

print(f"Connecting to {MONGODB_URI}, DB: {DB_NAME}")

async def seed_db():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("Beginning seed process...")
    
    # ==========================================
    # SEED COURSES (With Modules & Chapters)
    # ==========================================
    courses = [
        {
            "title": "Jawline Sculptor 101",
            "description": "The ultimate beginner guide to defining your jawline through mewing and chewing exercises.",
            "category": "jawline",
            "difficulty": "beginner",
            "estimated_weeks": 4,
            "modules": [
                {
                    "module_number": 1,
                    "title": "Consultation & Basics",
                    "description": "Learning proper tongue posture.",
                    "chapters": [
                        {
                            "chapter_id": "j1_c1",
                            "title": "What is Mewing?",
                            "description": "Understanding the fundamentals of tongue posture.",
                            "type": "video",
                            "video_url": "https://example.com/videos/mewing-basics.mp4",
                            "duration_minutes": 5
                        },
                        {
                            "chapter_id": "j1_c2",
                            "title": "The 'N' Spot",
                            "description": "Finding the correct position for your tongue tip.",
                            "type": "image",
                            "image_url": "https://images.unsplash.com/photo-1597223506889-498ccf1e03a4",
                            "duration_minutes": 2
                        },
                        {
                            "chapter_id": "j1_c3",
                            "title": "Suction Hold Practice",
                            "description": "Maintain a suction hold for 10 minutes.",
                            "type": "text",
                            "content": "Step 1: Swallow your spit.\nStep 2: Hold the vacuum.\nStep 3: Breathe through your nose.",
                            "duration_minutes": 10
                        }
                    ],
                    "unlock_after_days": 0
                },
                {
                    "module_number": 2,
                    "title": "Chewing Mechanics",
                    "description": "Introduction to mastic gum.",
                    "chapters": [
                        {
                            "chapter_id": "j2_c1",
                            "title": "Chewing Rhythm",
                            "description": "Chew for 20 mins evenly on both sides.",
                            "type": "text",
                            "content": "Chew mastic gum or hard food. Ensure equal time on left and right sides to avoid asymmetry.",
                            "duration_minutes": 20
                        }
                    ],
                    "unlock_after_days": 7
                }
            ],
            "is_active": True,
            "thumbnail_url": "https://images.unsplash.com/photo-1597223506889-498ccf1e03a4?w=500&auto=format&fit=crop&q=60"
        },
        {
            "title": "Glass Skin Routine",
            "description": "Achieve flawless skin texture.",
            "category": "skin",
            "difficulty": "intermediate",
            "estimated_weeks": 6,
            "modules": [
                {
                    "module_number": 1,
                    "title": "Barrier Repair",
                    "description": "Fixing your skin barrier first.",
                    "chapters": [
                        {
                            "chapter_id": "s1_c1",
                            "title": "Hydration Education",
                            "description": "Why hydration matters more than moisture.",
                            "type": "text",
                            "content": "Hydration = Water. Moisture = Oil. You need both.",
                            "duration_minutes": 5
                        }
                    ],
                    "unlock_after_days": 0
                }
            ],
            "is_active": True,
            "thumbnail_url": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&auto=format&fit=crop&q=60"
        }
    ]

    print("\nSeeding Courses...")
    # Clean existing courses to ensure schema update
    await db.courses.delete_many({})
    print("Cleared existing courses.")
    
    for course in courses:
        course["created_at"] = datetime.utcnow()
        course["updated_at"] = datetime.utcnow()
        await db.courses.insert_one(course)
        print(f"Created course: {course['title']}")

    # ==========================================
    # SEED FORUMS
    # ==========================================
    forums = [
        {
            "name": "General Discussion",
            "slug": "general",
            "description": "Talk about anything related to looksmaxxing.",
            "is_admin_only": False, # Anyone can post
            "order": 1,
            "icon": "chatbubbles"
        },
        {
            "name": "Announcements",
            "slug": "announcements",
            "description": "Official updates from the Cannon team.",
            "is_admin_only": True, # Only admin can post
            "order": 0,
            "icon": "megaphone"
        },
        {
            "name": "Marketplace",
            "slug": "marketplace",
            "description": "Buy, sell, and trade recommendations.",
            "is_admin_only": False,
            "order": 2,
            "icon": "cart"
        },
        {
            "name": "Weight Loss",
            "slug": "weight-loss",
            "description": "Share your cutting progress.",
            "is_admin_only": False,
            "order": 3,
            "icon": "body"
        }
    ]

    print("\nSeeding Forums...")
    # Clean existing forums
    await db.forums.delete_many({})
    print("Cleared existing forums.")
    
    for forum in forums:
        forum["created_at"] = datetime.utcnow()
        await db.forums.insert_one(forum)
        print(f"Created forum: {forum['name']}")

    # Create a sample thread if none exist
    general = await db.forums.find_one({"slug": "general"})
    if general:
        user = await db.users.find_one({})
        if user:
            thread = {
                "forum_id": str(general["_id"]),
                "user_id": str(user["_id"]),
                "title": "Welcome to the Community!",
                "content": "This is the start of something great. Share your goals below!",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "reply_count": 0,
                "is_pinned": True,
                "is_locked": False
            }
            await db.threads.insert_one(thread)
            print("Created sample thread in General.")

    print("\nSeed process completed successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_db())
