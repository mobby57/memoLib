"""E2E tests for full user flow"""
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.fixture
def driver():
    driver = webdriver.Chrome()
    yield driver
    driver.quit()

def test_login_flow(driver):
    """Test login flow"""
    driver.get("http://localhost:5000/login")
    
    email_input = driver.find_element(By.ID, "email")
    password_input = driver.find_element(By.ID, "password")
    
    email_input.send_keys("test@example.com")
    password_input.send_keys("TestPassword123!")
    
    submit_btn = driver.find_element(By.ID, "submit")
    submit_btn.click()
    
    WebDriverWait(driver, 10).until(
        EC.url_contains("/dashboard")
    )
    
    assert "dashboard" in driver.current_url

def test_compose_email(driver):
    """Test email composition"""
    # Login first
    driver.get("http://localhost:5000/login")
    # ... login steps
    
    # Navigate to compose
    driver.get("http://localhost:5000/compose")
    
    recipient = driver.find_element(By.ID, "recipient")
    subject = driver.find_element(By.ID, "subject")
    body = driver.find_element(By.ID, "body")
    
    recipient.send_keys("recipient@example.com")
    subject.send_keys("Test Email")
    body.send_keys("This is a test email")
    
    send_btn = driver.find_element(By.ID, "send")
    send_btn.click()
    
    success_msg = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "success"))
    )
    
    assert "sent" in success_msg.text.lower()
