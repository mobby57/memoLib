# Tests E2E Selenium
import pytest
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

pytestmark = pytest.mark.e2e  # Mark all tests in this file as e2e

def is_server_running(url="http://localhost:5000"):
    """Check if Flask server is running"""
    try:
        response = requests.get(f"{url}/api/health", timeout=5)
        return response.status_code == 200
    except:
        return False

@pytest.mark.e2e
def test_email_generation_flow():
    if not is_server_running():
        pytest.skip("Flask server not running")
    
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get('http://localhost:5000')
        
        # Wait for React app to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'root'))
        )
        
        # Check that React app loaded
        assert driver.find_element(By.ID, 'root')
    finally:
        driver.quit()

if __name__ == '__main__':
    test_email_generation_flow()
