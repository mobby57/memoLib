# Tests E2E Selenium
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_email_generation_flow():
    driver = webdriver.Chrome()
    driver.get('http://localhost:5000')
    
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, 'contextInput'))
    )
    
    context_input = driver.find_element(By.ID, 'contextInput')
    context_input.send_keys('Demande de reunion urgente')
    
    generate_btn = driver.find_element(By.ID, 'generateBtn')
    generate_btn.click()
    
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.ID, 'emailPreview'))
    )
    
    preview = driver.find_element(By.ID, 'emailPreview')
    assert preview.is_displayed()
    
    driver.quit()
    print('OK Test E2E generation email')

if __name__ == '__main__':
    test_email_generation_flow()
