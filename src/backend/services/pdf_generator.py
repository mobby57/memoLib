"""
Générateur de factures PDF professionnelles pour cabinets d'avocats
Conforme aux obligations fiscales et déontologiques
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any


class InvoicePDFGenerator:
    """Générateur de factures PDF conformes"""
    
    def __init__(self, output_dir: str = 'data/factures'):
        """
        Initialise le générateur de factures
        
        Args:
            output_dir: Répertoire de sortie des PDF
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.styles = getSampleStyleSheet()
        
        # Style personnalisé pour les titres
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=30,
            alignment=1  # Centré
        )
        
        # Style pour le corps
        self.body_style = ParagraphStyle(
            'CustomBody',
            parent=self.styles['BodyText'],
            fontSize=10,
            leading=14
        )
    
    def generate_invoice(self, invoice_data: Dict[str, Any]) -> Path:
        """
        Génère une facture PDF professionnelle
        
        Args:
            invoice_data: Données de la facture
                {
                    'numero': 'FAC-2025-0001',
                    'date': '2025-01-15',
                    'cabinet': {
                        'nom': 'Cabinet Dupont & Associés',
                        'adresse': '123 Rue du Palais',
                        'code_postal': '75001',
                        'ville': 'Paris',
                        'siret': '123 456 789 00012',
                        'tva': 'FR12345678901'
                    },
                    'client': {
                        'nom': 'Jean Martin',
                        'adresse': '456 Avenue de la République',
                        'code_postal': '75010',
                        'ville': 'Paris'
                    },
                    'dossier': '2025-0042',
                    'lignes': [
                        {'description': 'Consultation juridique', 'quantite': 2, 'prix_unitaire': 150.00},
                        {'description': 'Rédaction conclusions', 'quantite': 1, 'prix_unitaire': 500.00}
                    ],
                    'tva_taux': 20.0
                }
                
        Returns:
            Chemin du fichier PDF généré
        """
        filename = f"{invoice_data['numero'].replace('/', '-')}.pdf"
        filepath = self.output_dir / filename
        
        # Création du document
        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=A4,
            topMargin=2*cm,
            bottomMargin=2*cm,
            leftMargin=2.5*cm,
            rightMargin=2.5*cm
        )
        
        # Éléments du document
        story = []
        
        # En-tête cabinet (logo + coordonnées)
        story.append(self._build_header(invoice_data['cabinet']))
        story.append(Spacer(1, 1*cm))
        
        # Titre
        story.append(Paragraph(f"FACTURE N° {invoice_data['numero']}", self.title_style))
        story.append(Spacer(1, 0.5*cm))
        
        # Informations facture et client
        story.append(self._build_info_section(invoice_data))
        story.append(Spacer(1, 1*cm))
        
        # Tableau des prestations
        story.append(self._build_services_table(invoice_data['lignes']))
        story.append(Spacer(1, 0.5*cm))
        
        # Totaux
        story.append(self._build_totals_table(invoice_data))
        story.append(Spacer(1, 1*cm))
        
        # Mentions légales
        story.append(self._build_legal_mentions(invoice_data))
        
        # Génération du PDF
        doc.build(story, onFirstPage=self._add_footer, onLaterPages=self._add_footer)
        
        print(f"✅ Facture générée: {filepath}")
        return filepath
    
    def _build_header(self, cabinet: Dict[str, str]) -> Table:
        """Construit l'en-tête avec coordonnées du cabinet"""
        header_data = [
            [Paragraph(f"<b>{cabinet['nom']}</b>", self.body_style)],
            [Paragraph(cabinet['adresse'], self.body_style)],
            [Paragraph(f"{cabinet['code_postal']} {cabinet['ville']}", self.body_style)],
            [Paragraph(f"SIRET: {cabinet['siret']}", self.body_style)],
            [Paragraph(f"N° TVA: {cabinet['tva']}", self.body_style)]
        ]
        
        table = Table(header_data, colWidths=[15*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
        ]))
        
        return table
    
    def _build_info_section(self, invoice_data: Dict[str, Any]) -> Table:
        """Section informations facture et client"""
        client = invoice_data['client']
        
        data = [
            [
                Paragraph("<b>Date d'émission:</b>", self.body_style),
                Paragraph(invoice_data['date'], self.body_style),
                Paragraph("<b>Client:</b>", self.body_style),
                Paragraph(f"<b>{client['nom']}</b>", self.body_style)
            ],
            [
                Paragraph("<b>Dossier N°:</b>", self.body_style),
                Paragraph(invoice_data['dossier'], self.body_style),
                Paragraph("<b>Adresse:</b>", self.body_style),
                Paragraph(client['adresse'], self.body_style)
            ],
            [
                '',
                '',
                '',
                Paragraph(f"{client['code_postal']} {client['ville']}", self.body_style)
            ]
        ]
        
        table = Table(data, colWidths=[3.5*cm, 3.5*cm, 2.5*cm, 5.5*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (1, 0), colors.lightgrey),
            ('BACKGROUND', (2, 0), (3, 0), colors.lightgrey),
        ]))
        
        return table
    
    def _build_services_table(self, lignes: List[Dict[str, Any]]) -> Table:
        """Tableau des prestations"""
        # En-tête
        data = [[
            Paragraph('<b>Description</b>', self.body_style),
            Paragraph('<b>Quantité</b>', self.body_style),
            Paragraph('<b>Prix unitaire</b>', self.body_style),
            Paragraph('<b>Total HT</b>', self.body_style)
        ]]
        
        # Lignes de prestations
        for ligne in lignes:
            total_ht = ligne['quantite'] * ligne['prix_unitaire']
            data.append([
                Paragraph(ligne['description'], self.body_style),
                Paragraph(str(ligne['quantite']), self.body_style),
                Paragraph(f"{ligne['prix_unitaire']:.2f} €", self.body_style),
                Paragraph(f"{total_ht:.2f} €", self.body_style)
            ])
        
        table = Table(data, colWidths=[8*cm, 2*cm, 2.5*cm, 2.5*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a237e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        
        return table
    
    def _build_totals_table(self, invoice_data: Dict[str, Any]) -> Table:
        """Tableau des totaux avec TVA"""
        # Calculs
        total_ht = sum(l['quantite'] * l['prix_unitaire'] for l in invoice_data['lignes'])
        tva_montant = total_ht * (invoice_data['tva_taux'] / 100)
        total_ttc = total_ht + tva_montant
        
        data = [
            ['Total HT:', f"{total_ht:.2f} €"],
            [f'TVA ({invoice_data["tva_taux"]:.1f}%):', f"{tva_montant:.2f} €"],
            ['<b>Total TTC:</b>', f"<b>{total_ttc:.2f} €</b>"]
        ]
        
        table = Table(data, colWidths=[12*cm, 3*cm])
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ]))
        
        return table
    
    def _build_legal_mentions(self, invoice_data: Dict[str, Any]) -> Paragraph:
        """Mentions légales obligatoires"""
        mentions = f"""
        <font size=8>
        <b>Conditions de paiement:</b> Paiement à réception de facture.<br/>
        <b>Retard de paiement:</b> Taux de pénalité de 10% du montant TTC. Indemnité forfaitaire pour frais de recouvrement: 40€.<br/>
        <b>TVA:</b> TVA non applicable, article 293 B du CGI (si applicable).<br/>
        <b>Profession réglementée:</b> Avocat inscrit au Barreau de Paris. Soumis au règlement intérieur national de la profession d'avocat.
        </font>
        """
        
        return Paragraph(mentions, self.body_style)
    
    def _add_footer(self, canvas, doc):
        """Ajoute le pied de page"""
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.drawCentredString(
            A4[0] / 2,
            1.5*cm,
            f"Page {canvas.getPageNumber()} - Facture générée le {datetime.now().strftime('%d/%m/%Y à %H:%M')}"
        )
        canvas.restoreState()


# Instance globale
pdf_generator = InvoicePDFGenerator()


def generate_invoice_pdf(billing_data: Dict[str, Any], cabinet_info: Dict[str, str]) -> Path:
    """
    Fonction helper pour générer une facture PDF
    
    Args:
        billing_data: Données de facturation (depuis BillingManager)
        cabinet_info: Informations du cabinet
        
    Returns:
        Chemin du PDF généré
    """
    invoice_data = {
        'numero': billing_data['numero_facture'],
        'date': billing_data.get('date', datetime.now().strftime('%Y-%m-%d')),
        'cabinet': cabinet_info,
        'client': billing_data['client'],
        'dossier': billing_data['numero_dossier'],
        'lignes': billing_data['prestations'],
        'tva_taux': 20.0  # TVA standard
    }
    
    return pdf_generator.generate_invoice(invoice_data)
