Write-Host "CHANGEMENT SECTEUR DEMO" -ForegroundColor Cyan
Write-Host ""

Write-Host "Secteur actuel pour la demo:" -ForegroundColor Yellow
Write-Host ""
Write-Host "JURIDIQUE & LEGAL" -ForegroundColor Cyan
Write-Host "1.  Legal         - Avocats" -ForegroundColor White
Write-Host "2.  Notary        - Notaires" -ForegroundColor White
Write-Host "3.  Bailiff       - Huissiers" -ForegroundColor White
Write-Host ""
Write-Host "SANTE & MEDICAL" -ForegroundColor Cyan
Write-Host "4.  Medical       - Medecins" -ForegroundColor White
Write-Host "5.  Dentist       - Dentistes" -ForegroundColor White
Write-Host "6.  Pharmacy      - Pharmaciens" -ForegroundColor White
Write-Host "7.  Veterinary    - Veterinaires" -ForegroundColor White
Write-Host ""
Write-Host "CONSEIL & EXPERTISE" -ForegroundColor Cyan
Write-Host "8.  Consulting    - Consultants" -ForegroundColor White
Write-Host "9.  Coaching      - Coachs" -ForegroundColor White
Write-Host "10. Training      - Formateurs" -ForegroundColor White
Write-Host ""
Write-Host "FINANCE & COMPTABILITE" -ForegroundColor Cyan
Write-Host "11. Accounting    - Comptables" -ForegroundColor White
Write-Host "12. Banking       - Banquiers" -ForegroundColor White
Write-Host "13. Insurance     - Assureurs" -ForegroundColor White
Write-Host "14. Investment    - Investisseurs" -ForegroundColor White
Write-Host ""
Write-Host "IMMOBILIER & CONSTRUCTION" -ForegroundColor Cyan
Write-Host "15. Realty        - Agents immo" -ForegroundColor White
Write-Host "16. Architecture  - Architectes" -ForegroundColor White
Write-Host "17. Engineering   - Ingenieurs" -ForegroundColor White
Write-Host "18. Construction  - Entrepreneurs" -ForegroundColor White
Write-Host ""
Write-Host "TECH & DIGITAL" -ForegroundColor Cyan
Write-Host "19. IT            - Informaticiens" -ForegroundColor White
Write-Host "20. Developer     - Developpeurs" -ForegroundColor White
Write-Host "21. Designer      - Designers" -ForegroundColor White
Write-Host "22. Marketing     - Marketeurs" -ForegroundColor White
Write-Host ""
Write-Host "MANAGEMENT & RH" -ForegroundColor Cyan
Write-Host "23. HR            - RH" -ForegroundColor White
Write-Host "24. Recruitment   - Recruteurs" -ForegroundColor White
Write-Host "25. Management    - Managers" -ForegroundColor White
Write-Host "26. Executive     - Executives" -ForegroundColor White
Write-Host ""
Write-Host "COMMERCE & VENTE" -ForegroundColor Cyan
Write-Host "27. Sales         - Commerciaux" -ForegroundColor White
Write-Host "28. Retail        - Detaillants" -ForegroundColor White
Write-Host "29. Ecommerce     - E-commerce" -ForegroundColor White
Write-Host ""
Write-Host "SERVICES" -ForegroundColor Cyan
Write-Host "30. Event         - Evenementiel" -ForegroundColor White
Write-Host "31. Travel        - Agences voyage" -ForegroundColor White
Write-Host "32. Hospitality   - Hotellerie" -ForegroundColor White
Write-Host "33. Restaurant    - Restauration" -ForegroundColor White
Write-Host ""
Write-Host "AUTRES" -ForegroundColor Cyan
Write-Host "34. Freelance     - Freelances" -ForegroundColor White
Write-Host "35. Entrepreneur  - Entrepreneurs" -ForegroundColor White
Write-Host "36. Startup       - Startups" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Choisir (1-36)"

$sectors = @{
    "1" = @{id="legal"; name="LegalMemo"; color="#1E40AF"; desc="Avocats"}
    "2" = @{id="notary"; name="NotaryMemo"; color="#0891B2"; desc="Notaires"}
    "3" = @{id="bailiff"; name="BailiffMemo"; color="#0D9488"; desc="Huissiers"}
    "4" = @{id="medical"; name="MediMemo"; color="#059669"; desc="Medecins"}
    "5" = @{id="dentist"; name="DentistMemo"; color="#10B981"; desc="Dentistes"}
    "6" = @{id="pharmacy"; name="PharmaMemo"; color="#14B8A6"; desc="Pharmaciens"}
    "7" = @{id="veterinary"; name="VetMemo"; color="#22C55E"; desc="Veterinaires"}
    "8" = @{id="consulting"; name="ConsultMemo"; color="#7C3AED"; desc="Consultants"}
    "9" = @{id="coaching"; name="CoachMemo"; color="#8B5CF6"; desc="Coachs"}
    "10" = @{id="training"; name="TrainMemo"; color="#A855F7"; desc="Formateurs"}
    "11" = @{id="accounting"; name="AccountMemo"; color="#F59E0B"; desc="Comptables"}
    "12" = @{id="banking"; name="BankMemo"; color="#EAB308"; desc="Banquiers"}
    "13" = @{id="insurance"; name="InsureMemo"; color="#16A34A"; desc="Assureurs"}
    "14" = @{id="investment"; name="InvestMemo"; color="#84CC16"; desc="Investisseurs"}
    "15" = @{id="realty"; name="RealtyMemo"; color="#DC2626"; desc="Agents immo"}
    "16" = @{id="architecture"; name="ArchMemo"; color="#0891B2"; desc="Architectes"}
    "17" = @{id="engineering"; name="EngineerMemo"; color="#9333EA"; desc="Ingenieurs"}
    "18" = @{id="construction"; name="BuildMemo"; color="#EA580C"; desc="Entrepreneurs"}
    "19" = @{id="it"; name="ITMemo"; color="#3B82F6"; desc="Informaticiens"}
    "20" = @{id="developer"; name="DevMemo"; color="#6366F1"; desc="Developpeurs"}
    "21" = @{id="designer"; name="DesignMemo"; color="#EC4899"; desc="Designers"}
    "22" = @{id="marketing"; name="MarketMemo"; color="#F43F5E"; desc="Marketeurs"}
    "23" = @{id="hr"; name="HRMemo"; color="#06B6D4"; desc="RH"}
    "24" = @{id="recruitment"; name="RecruitMemo"; color="#14B8A6"; desc="Recruteurs"}
    "25" = @{id="management"; name="ManageMemo"; color="#8B5CF6"; desc="Managers"}
    "26" = @{id="executive"; name="ExecMemo"; color="#6366F1"; desc="Executives"}
    "27" = @{id="sales"; name="SalesMemo"; color="#10B981"; desc="Commerciaux"}
    "28" = @{id="retail"; name="RetailMemo"; color="#F59E0B"; desc="Detaillants"}
    "29" = @{id="ecommerce"; name="EcommMemo"; color="#EF4444"; desc="E-commerce"}
    "30" = @{id="event"; name="EventMemo"; color="#A855F7"; desc="Evenementiel"}
    "31" = @{id="travel"; name="TravelMemo"; color="#06B6D4"; desc="Agences voyage"}
    "32" = @{id="hospitality"; name="HotelMemo"; color="#F97316"; desc="Hotellerie"}
    "33" = @{id="restaurant"; name="RestauMemo"; color="#EF4444"; desc="Restauration"}
    "34" = @{id="freelance"; name="FreeMemo"; color="#8B5CF6"; desc="Freelances"}
    "35" = @{id="entrepreneur"; name="EntrepMemo"; color="#F59E0B"; desc="Entrepreneurs"}
    "36" = @{id="startup"; name="StartupMemo"; color="#3B82F6"; desc="Startups"}
}

if (-not $sectors.ContainsKey($choice)) {
    Write-Host "Choix invalide!" -ForegroundColor Red
    exit 1
}

$sector = $sectors[$choice]

# Sauvegarder le choix
$sector.id | Out-File -FilePath "current-sector.txt" -NoNewline

Write-Host ""
Write-Host "Secteur configure: $($sector.name)" -ForegroundColor Green
Write-Host ""
Write-Host "Email de monitoring: sarraboudjellal57@gmail.com (inchange)" -ForegroundColor White
Write-Host "Interface: $($sector.name)" -ForegroundColor White
Write-Host "Couleur: $($sector.color)" -ForegroundColor White
Write-Host ""
Write-Host "Relancez l'application pour appliquer les changements." -ForegroundColor Yellow
