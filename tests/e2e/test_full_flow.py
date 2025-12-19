"""E2E tests for full user flow"""
import pytest
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException

pytestmark = pytest.mark.e2e  # Mark all tests in this file as e2e

def is_server_running(url="http://localhost:5000"):
    """Check if Flask server is running"""
    try:
        response = requests.get(f"{url}/api/health", timeout=5)
        return response.status_code == 200
    except:
        return False

@pytest.fixture
def driver():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()

def test_login_flow(driver):
    """Test login flow"""
    if not is_server_running():
        pytest.skip("Flask server not running")
    
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
    if not is_server_running():
        pytest.skip("Flask server not running")
    
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
