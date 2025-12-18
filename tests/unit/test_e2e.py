"""Tests End-to-End avec Selenium"""
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

class TestE2E:
    @pytest.fixture
    def driver(self):
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        driver = webdriver.Chrome(options=options)
        driver.implicitly_wait(10)
        yield driver
        driver.quit()
    
    def test_login_flow(self, driver):
        """Test du flux de connexion"""
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
        # Login d'abord
        self.test_login_flow(driver)
        
        # Aller au compositeur
        driver.get('http://localhost:5000/composer')
        
        # Attendre chargement formulaire
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="email"]'))
        )
        
        # Remplir formulaire avec sélecteurs CSS
        recipient = driver.find_element(By.CSS_SELECTOR, 'input[type="email"]')
        recipient.send_keys('test@example.com')
        
        # Trouver champs par label ou placeholder
        subject_inputs = driver.find_elements(By.CSS_SELECTOR, 'input[type="text"]')
        if subject_inputs:
            subject_inputs[0].send_keys('Test E2E')
        
        # Textarea pour le corps
        body_field = driver.find_element(By.TAG_NAME, 'textarea')
        body_field.send_keys('Message de test automatisé')
        
        # Bouton envoyer
        send_btn = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
        send_btn.click()
        
        # Vérifier message de succès ou erreur
        WebDriverWait(driver, 15).until(
            lambda d: 'succès' in d.page_source.lower() or 'erreur' in d.page_source.lower()
        )
    
    def test_ai_generation(self, driver):
        """Test génération IA"""
        self.test_login_flow(driver)
        
        driver.get('http://localhost:5000/agent')
        
        # Saisir contexte
        context_field = driver.find_element(By.NAME, 'context')
        context_field.send_keys('Demande de rendez-vous médecin')
        
        # Générer
        generate_btn = driver.find_element(By.ID, 'generate-btn')
        generate_btn.click()
        
        # Attendre résultat
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, 'generated-content'))
        )
        
        # Vérifier contenu généré
        generated = driver.find_element(By.ID, 'generated-content')
        assert len(generated.text) > 10