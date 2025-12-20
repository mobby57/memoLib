#!/usr/bin/env python3
"""
Migration script: SQLite to PostgreSQL
Usage: python migrate_to_postgres.py
"""

import os
import sqlite3
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

def migrate_sqlite_to_postgres():
    """Migrate data from SQLite to PostgreSQL"""
    
    # SQLite source
    sqlite_path = os.path.join('src', 'backend', 'data', 'unified.db')
    if not os.path.exists(sqlite_path):
        print("❌ SQLite database not found")
        return False
    
    # PostgreSQL destination
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not set")
        return False
    
    print("🔄 Starting migration SQLite → PostgreSQL...")
    
    try:
        # Connect to SQLite
        sqlite_conn = sqlite3.connect(sqlite_path)
        sqlite_cursor = sqlite_conn.cursor()
        
        # Connect to PostgreSQL
        url = urlparse(database_url.replace('postgresql://', 'postgres://'))
        pg_conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            user=url.username,
            password=url.password,
            database=url.path[1:]
        )
        pg_cursor = pg_conn.cursor()
        
        # Migrate emails table
        print("📧 Migrating emails...")
        sqlite_cursor.execute("SELECT recipient, subject, body, status, created_at FROM emails")
        emails = sqlite_cursor.fetchall()
        
        for email in emails:
            pg_cursor.execute(
                "INSERT INTO emails (recipient, subject, body, status, created_at) VALUES (%s, %s, %s, %s, %s)",
                email
            )
        
        # Migrate templates table
        print("📝 Migrating templates...")
        sqlite_cursor.execute("SELECT name, subject, body, category, created_at FROM templates")
        templates = sqlite_cursor.fetchall()
        
        for template in templates:
            pg_cursor.execute(
                "INSERT INTO templates (name, subject, body, category, created_at) VALUES (%s, %s, %s, %s, %s)",
                template
            )
        
        # Migrate contacts table
        print("👥 Migrating contacts...")
        sqlite_cursor.execute("SELECT name, email, organization, category, created_at FROM contacts")
        contacts = sqlite_cursor.fetchall()
        
        for contact in contacts:
            try:
                pg_cursor.execute(
                    "INSERT INTO contacts (name, email, organization, category, created_at) VALUES (%s, %s, %s, %s, %s)",
                    contact
                )
            except psycopg2.IntegrityError:
                # Skip duplicate emails
                pg_conn.rollback()
                continue
        
        # Migrate transcripts table
        print("🎤 Migrating transcripts...")
        sqlite_cursor.execute("SELECT text, language, confidence, duration, created_at FROM transcripts")
        transcripts = sqlite_cursor.fetchall()
        
        for transcript in transcripts:
            pg_cursor.execute(
                "INSERT INTO transcripts (text, language, confidence, duration, created_at) VALUES (%s, %s, %s, %s, %s)",
                transcript
            )
        
        # Commit all changes
        pg_conn.commit()
        
        # Close connections
        sqlite_conn.close()
        pg_conn.close()
        
        print("✅ Migration completed successfully!")
        print(f"   📧 {len(emails)} emails migrated")
        print(f"   📝 {len(templates)} templates migrated")
        print(f"   👥 {len(contacts)} contacts migrated")
        print(f"   🎤 {len(transcripts)} transcripts migrated")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def verify_migration():
    """Verify migration was successful"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return False
    
    try:
        url = urlparse(database_url.replace('postgresql://', 'postgres://'))
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            user=url.username,
            password=url.password,
            database=url.path[1:]
        )
        cursor = conn.cursor()
        
        # Count records in each table
        tables = ['emails', 'templates', 'contacts', 'transcripts']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   {table}: {count} records")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == '__main__':
    print("🚀 IAPosteManager Database Migration")
    print("=" * 40)
    
    if migrate_sqlite_to_postgres():
        print("\n🔍 Verifying migration...")
        verify_migration()
        print("\n✅ Migration complete! You can now use PostgreSQL.")
        print("💡 Don't forget to set DATABASE_URL in your environment")
    else:
        print("\n❌ Migration failed. Check the error messages above.")