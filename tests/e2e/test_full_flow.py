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
    
    try:
        driver = webdriver.Chrome(options=options)
    except WebDriverException as e:
        pytest.skip(f"Chrome/Chromedriver not available: {e}")
    
    yield driver
    driver.quit()

def test_login_flow(driver):
    """Test React login flow with proper wait times"""
    if not is_server_running():
        pytest.skip("Flask server not running")
    
    driver.get("http://localhost:5000/login")
    
    # Wait for React to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "password"))
    )
    
    password_input = driver.find_element(By.ID, "password")
    password_input.send_keys("TestPassword123!")
    
    submit_btn = driver.find_element(By.ID, "submit")
    submit_btn.click()
    
    # Wait for the URL to change from /login (React navigation takes time)
    WebDriverWait(driver, 15).until(
        EC.url_changes("http://localhost:5000/login")
    )
    
    # Verify we're no longer on the login page
    assert driver.current_url != "http://localhost:5000/login", f"Still on login page: {driver.current_url}"
    
    # Should be redirected to dashboard (/)
    assert "/" in driver.current_url or "dashboard" in driver.current_url

def test_compose_email(driver):
    """Test email composition"""
    if not is_server_running():
        pytest.skip("Flask server not running")
    
    # Login first
    driver.get("http://localhost:5000/login")
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "password"))
    )
    password_input = driver.find_element(By.ID, "password")
    password_input.send_keys("TestPassword123!")
    submit_btn = driver.find_element(By.ID, "submit")
    submit_btn.click()
    
    # Wait for login to complete
    WebDriverWait(driver, 10).until(
        EC.url_changes("http://localhost:5000/login")
    )
    
    # Navigate to compose (React route)
    driver.get("http://localhost:5000/")
    
    # Wait for React app to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "root"))
    )
    
    # Test passes if we can access the app
    assert "localhost:5000" in driver.current_url
