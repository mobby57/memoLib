#!/usr/bin/env python3
"""
Test script for FormGenerator logging integration
"""

from services.form_generator import FormGenerator

def test_form_generation():
    """Test form generation with logging"""
    try:
        # Initialize FormGenerator
        fg = FormGenerator()
        print("FormGenerator initialized successfully")

        # Sample questions
        questions = [
            {
                'type': 'identity',
                'question': 'What is your name?',
                'field_type': 'text',
                'priority': 'high'
            },
            {
                'type': 'contact',
                'question': 'What is your email?',
                'field_type': 'email',
                'priority': 'high'
            }
        ]

        # Generate form
        result = fg.generate_form(questions, form_type="general", language="fr")
        print("Form generated successfully")
        print(f"Form ID: {result['id']}")
        print(f"Steps count: {len(result['steps'])}")

        return True

    except Exception as e:
        print(f"Error during form generation: {e}")
        return False

if __name__ == "__main__":
    success = test_form_generation()
    if success:
        print("Test passed!")
    else:
        print("Test failed!")
