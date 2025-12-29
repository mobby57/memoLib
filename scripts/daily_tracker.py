#!/usr/bin/env python3
"""
Daily Progress Tracker for IAPosteManager Development
Usage: python daily_tracker.py [update|status|report]
"""

import json
import datetime
from pathlib import Path

class DailyTracker:
    def __init__(self):
        self.progress_file = Path("dev_progress.json")
        self.load_progress()
    
    def load_progress(self):
        if self.progress_file.exists():
            with open(self.progress_file, 'r') as f:
                self.progress = json.load(f)
        else:
            self.progress = {
                "week1": {"completed": 0, "total": 14, "tasks": []},
                "week2": {"completed": 0, "total": 14, "tasks": []},
                "week3": {"completed": 0, "total": 14, "tasks": []},
                "week4": {"completed": 0, "total": 14, "tasks": []},
                "daily_logs": []
            }
    
    def save_progress(self):
        with open(self.progress_file, 'w') as f:
            json.dump(self.progress, f, indent=2)
    
    def update_task(self, week, task_name, completed=True):
        """Mark task as completed"""
        today = datetime.date.today().isoformat()
        
        if task_name not in self.progress[week]["tasks"]:
            self.progress[week]["tasks"].append({
                "name": task_name,
                "completed": completed,
                "date": today
            })
            if completed:
                self.progress[week]["completed"] += 1
        
        self.progress["daily_logs"].append({
            "date": today,
            "week": week,
            "task": task_name,
            "status": "completed" if completed else "started"
        })
        
        self.save_progress()
        print(f"✅ {task_name} marked as {'completed' if completed else 'started'}")
    
    def show_status(self):
        """Show current progress"""
        print("\n🚀 IAPosteManager Development Progress")
        print("=" * 50)
        
        total_completed = 0
        total_tasks = 0
        
        for week, data in self.progress.items():
            if week.startswith("week"):
                completed = data["completed"]
                total = data["total"]
                percentage = (completed / total * 100) if total > 0 else 0
                
                total_completed += completed
                total_tasks += total
                
                print(f"{week.upper()}: {completed}/{total} ({percentage:.1f}%)")
                print("█" * int(percentage/2) + "░" * (50 - int(percentage/2)))
        
        overall = (total_completed / total_tasks * 100) if total_tasks > 0 else 0
        print(f"\nOVERALL: {total_completed}/{total_tasks} ({overall:.1f}%)")
        print("█" * int(overall/2) + "░" * (50 - int(overall/2)))
    
    def daily_report(self):
        """Generate daily report"""
        today = datetime.date.today().isoformat()
        today_logs = [log for log in self.progress["daily_logs"] if log["date"] == today]
        
        print(f"\n📊 Daily Report - {today}")
        print("=" * 30)
        
        if today_logs:
            for log in today_logs:
                print(f"• {log['task']} ({log['status']})")
        else:
            print("No tasks completed today")
        
        # Next tasks suggestion
        print("\n🎯 Suggested Next Tasks:")
        current_week = self.get_current_week()
        print(f"Focus on {current_week} tasks")

    def get_current_week(self):
        """Determine current development week"""
        start_date = datetime.date(2025, 1, 1)  # Adjust start date
        current_date = datetime.date.today()
        days_elapsed = (current_date - start_date).days
        week_number = min(days_elapsed // 7 + 1, 4)
        return f"week{week_number}"

if __name__ == "__main__":
    import sys
    
    tracker = DailyTracker()
    
    if len(sys.argv) < 2:
        tracker.show_status()
    elif sys.argv[1] == "update":
        if len(sys.argv) >= 4:
            week = sys.argv[2]
            task = " ".join(sys.argv[3:])
            tracker.update_task(week, task)
        else:
            print("Usage: python daily_tracker.py update <week> <task_name>")
    elif sys.argv[1] == "status":
        tracker.show_status()
    elif sys.argv[1] == "report":
        tracker.daily_report()
    else:
        print("Usage: python daily_tracker.py [update|status|report]")