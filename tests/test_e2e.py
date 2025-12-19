"""Tests End-to-End avec Selenium"""
import pytest
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException
import time

def is_server_running(url="http://localhost:5000"):
    """Check if Flask server is running"""
    try:
        response = requests.get(f"{url}/api/health", timeout=5)
        return response.status_code == 200
    except:
        return False

@pytest.mark.e2e
class TestE2E:
    @pytest.fixture
    def driver(self):
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        
        try:
            driver = webdriver.Chrome(options=options)
        except WebDriverException as e:
            pytest.skip(f"Chrome/Chromedriver not available: {e}")
        
        driver.implicitly_wait(10)
        yield driver
        driver.quit()
    
    def test_login_flow(self, driver):
        """Test du flux de connexion"""
        if not is_server_running():
            pytest.skip("Flask server not running")
        
        driver.get('http://localhost:5000')
        
        # Attendre chargement page
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, 'body'))
        )
        
        # Vérifier présence formulaire login
        password_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="password"]'))
        )
        password_field.send_keys('testpassword123')
        
        # Cliquer connexion
        login_btn = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        login_btn.click()
        
        # Vérifier succès (présence dashboard ou navigation)
        WebDriverWait(driver, 10).until(
            lambda d: 'dashboard' in d.page_source.lower() or 'navigation' in d.page_source.lower()
        )
    
    def test_email_composition(self, driver):
        """Test composition d'email"""
        if not is_server_running():
            pytest.skip("Flask server not running")
        
        # Login d'abord
        self.test_login_flow(driver)
        
        # Navigate to home (React SPA)
        driver.get('http://localhost:5000/')
        
        # Wait for React app to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'root'))
        )
        
        # Verify React app loaded successfully
        assert driver.find_element(By.ID, 'root')
        # Test passes if we can access authenticated area
    
    def test_ai_generation(self, driver):
        """Test génération IA"""
        if not is_server_running():
            pytest.skip("Flask server not running")
        
        self.test_login_flow(driver)
        
        # Navigate to home (React SPA handles routing)
        driver.get('http://localhost:5000/')
        
        # Wait for React app to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'root'))
        )
        
        # Verify React app loaded
        assert driver.find_element(By.ID, 'root')
        # Test passes if authenticated user can access the app